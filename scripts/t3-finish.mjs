// Settle finished run threads and archive their T3 projects through the local server's internal RPC API.
// Reads {"t3Home", "threads": [threadId], "projects": [projectId]} on stdin and prints {"settled", "archived"}.
// Like t3-launch.mjs, this uses T3's undocumented API with a five-minute session that can only operate
// threads and projects; it works from any terminal, unlike T3's own tools in a thread that is not full-access.
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const request = JSON.parse(readFileSync(0, "utf8"));
const t3Home = request.t3Home ?? join(homedir(), ".t3");
const runtime = JSON.parse(readFileSync(join(t3Home, "userdata", "server-runtime.json"), "utf8"));
const t3 = process.env.T3_BIN ?? "t3";

const session = JSON.parse(execFileSync(t3, [
  "auth", "session", "issue", "--scope", "orchestration:operate", "--scope", "orchestration:read",
  "--ttl", "5m", "--label", "tetris-bench finish", "--json",
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

// Threads are settled first: archiving keeps a project's threads, but they should leave the active list too.
const calls = [
  ...(request.threads ?? []).map((threadId) => ({
    kind: "settled", id: threadId, tag: "orchestration.dispatchCommand",
    payload: { type: "thread.settle", commandId: randomUUID(), threadId },
  })),
  ...(request.projects ?? []).map((projectId) => ({
    kind: "archived", id: projectId, tag: "projects.mutate",
    payload: { type: "project.update", commandId: randomUUID(), projectId, archived: true },
  })),
];
const done = { settled: [], archived: [] };

const url = new URL("/ws", runtime.origin.replace(/^http/, "ws"));
url.searchParams.set("orchestrationProtocol", "2");
url.searchParams.set("wsTicket", ticket);
const socket = new WebSocket(url);
const timer = setTimeout(() => fail("timed out waiting for T3 to settle and archive"), 60_000);

function send(index) {
  if (index === calls.length) {
    clearTimeout(timer);
    socket.close();
    revoke();
    console.log(JSON.stringify(done));
    process.exit(0);
  }
  const call = calls[index];
  socket.send(JSON.stringify({ _tag: "Request", id: String(index), tag: call.tag, headers: [], payload: call.payload }));
}

socket.onopen = () => send(0);
socket.onmessage = (event) => {
  for (const frame of [].concat(JSON.parse(String(event.data)))) {
    if (frame._tag === "Ping") {
      socket.send(JSON.stringify({ _tag: "Pong" }));
    } else if (frame._tag === "Exit") {
      const index = Number(frame.requestId);
      const call = calls[index];
      if (frame.exit._tag !== "Success") fail(`${call.payload.type} ${call.id} failed: ${JSON.stringify(frame.exit).slice(0, 2000)}`);
      done[call.kind].push(call.id);
      send(index + 1);
    } else if (frame._tag === "Defect" || frame._tag === "ClientProtocolError") {
      fail(`protocol error: ${JSON.stringify(frame).slice(0, 2000)}`);
    }
  }
};
socket.onerror = () => fail("could not connect to the T3 server WebSocket");
