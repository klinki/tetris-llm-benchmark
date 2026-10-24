/**
 * Minimal dependency-free static dev server.
 * Serves index.html, styles.css and the compiled game (dist/) on port 8321.
 */

import http from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 8321);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";

  const resolved = path.normalize(path.join(ROOT, pathname));
  if (!resolved.startsWith(ROOT + path.sep) && resolved !== ROOT) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  if (!existsSync(resolved) || !statSync(resolved).isFile()) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("404 — not found");
    return;
  }

  res.writeHead(200, { "Content-Type": MIME[path.extname(resolved)] ?? "application/octet-stream" });
  createReadStream(resolved).pipe(res);
});

server.listen(PORT, () => {
  console.log(`TetrisJS is live at http://localhost:${PORT}`);
});
