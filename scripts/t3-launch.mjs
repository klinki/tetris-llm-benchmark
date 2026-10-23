// Start a T3 Code thread through the local server's internal RPC API.
// Reads a JSON launch request on stdin and prints {"threadId": ...} on success.
// T3 does not document this API; benchmark.py falls back to a manual start if it fails.
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const request = JSON.parse(readFileSync(0, "utf8"));
const t3Home = request.t3Home ?? join(homedir(), ".t3");
const runtime = JSON.parse(readFileSync(join(t3Home, "userdata", "server-runtime.json"), "utf8"));
const t3 = process.env.T3_BIN ?? "t3";

// A short-lived session that can only operate threads, revoked once the launch is accepted.
const session = JSON.parse(execFileSync(t3, [
  "auth", "session", "issue", "--scope", "orchestration:operate", "--scope", "orchestration:read",
  "--ttl", "5m", "--label", "tetris-bench launch", "--json",
], { encoding: "utf8" }));
const token = session.token ?? session.accessToken ?? session.bearerToken;
const sessionId = session.sessionId ?? session.id;

function revoke() {
  if (!sessionId) return;
  try {
    execFileSync(t3, ["auth", "session", "revoke", sessionId], { stdio: "ignore" });
  } catch {
    // The session expires on its own after five minutes.
  }
}

function fail(message) {
  revoke();
  console.error(message);
  process.exit(1);
}

if (!token) fail("t3 auth session issue did not return a token");
const ticketResponse = await fetch(`${runtime.origin}/api/auth/websocket-ticket`, {
  method: "POST",
  headers: { authorization: `Bearer ${token}` },
});
if (!ticketResponse.ok) fail(`websocket-ticket returned HTTP ${ticketResponse.status}`);
const { ticket } = await ticketResponse.json();

const url = new URL("/ws", runtime.origin.replace(/^http/, "ws"));
url.searchParams.set("orchestrationProtocol", "2");
url.searchParams.set("wsTicket", ticket);
const socket = new WebSocket(url);
const timer = setTimeout(() => fail("timed out waiting for orchestration.launchThread"), 30_000);

socket.onopen = () => {
  socket.send(JSON.stringify({
    _tag: "Request",
    id: "1",
    tag: "orchestration.launchThread",
    headers: [],
    payload: {
      commandId: randomUUID(),
      projectId: request.projectId,
      title: request.title,
      generateTitle: false,
      modelSelection: request.modelSelection,
      runtimeMode: "full-access",
      interactionMode: "default",
      workspaceStrategy: { type: "root" },
      initialMessage: { text: request.prompt, attachments: [] },
    },
  }));
};

socket.onmessage = (event) => {
  const frames = [].concat(JSON.parse(String(event.data)));
  for (const frame of frames) {
    if (frame._tag === "Ping") {
      socket.send(JSON.stringify({ _tag: "Pong" }));
    } else if (frame._tag === "Exit" && frame.requestId === "1") {
      clearTimeout(timer);
      socket.close();
      if (frame.exit._tag !== "Success") fail(`launchThread failed: ${JSON.stringify(frame.exit).slice(0, 2000)}`);
      revoke();
      console.log(JSON.stringify({ threadId: frame.exit.value.threadId }));
      process.exit(0);
    } else if (frame._tag === "Defect" || frame._tag === "ClientProtocolError") {
      fail(`launchThread protocol error: ${JSON.stringify(frame).slice(0, 2000)}`);
    }
  }
};
socket.onerror = () => fail("could not connect to the T3 server WebSocket");
