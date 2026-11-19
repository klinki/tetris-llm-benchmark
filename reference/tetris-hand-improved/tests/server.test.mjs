import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";

test("the local server serves only the game files", async (t) => {
  const script = fileURLToPath(new URL("../scripts/serve.mjs", import.meta.url));
  const server = spawn(process.execPath, [script], { env: { ...process.env, PORT: "0" } });
  t.after(() => server.kill());
  const [line] = await once(server.stdout, "data");
  const origin = String(line).match(/http:\/\/localhost:\d+/)?.[0];
  assert.ok(origin, `unexpected output: ${line}`);

  const page = await fetch(`${origin}/`);
  assert.equal(page.status, 200);
  assert.match(page.headers.get("content-type"), /^text\/html/);
  const html = await page.text();
  for (const id of ["board", "hold", "next", "score", "level", "lines", "overlay", "play"])
    assert.match(html, new RegExp(`id="${id}"`), `#${id} is present`);

  for (const [path, type] of [["/style.css", /^text\/css/], ["/dist/main.js", /^text\/javascript/], ["/dist/engine.js", /^text\/javascript/]]) {
    const response = await fetch(origin + path);
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get("content-type"), type, path);
  }
  for (const path of ["/package.json", "/src/engine.ts", "/%2e%2e/%2e%2e/etc/passwd", "/dist/../package.json"]) {
    const response = await fetch(origin + path);
    assert.equal(response.status, 404, path);
  }
});
