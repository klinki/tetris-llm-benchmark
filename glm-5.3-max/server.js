#!/usr/bin/env node
// Serves the built game at http://localhost:8321 (plain static files, no dependencies).
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const PORT = 8321;
const ROOT = fileURLToPath(new URL(".", import.meta.url));
const ROOT_PREFIX = ROOT.endsWith(sep) ? ROOT : ROOT + sep;

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

async function readSafe(pathname) {
  const filePath = resolve(join(ROOT, pathname));
  if (!filePath.startsWith(ROOT_PREFIX)) return null; // reject path traversal
  try {
    return await readFile(filePath);
  } catch {
    return null;
  }
}

const server = createServer(async (req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405).end("Method not allowed");
    return;
  }
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
  } catch {
    res.writeHead(400).end("Bad request");
    return;
  }
  if (pathname.endsWith("/")) pathname += "index.html";

  const body = await readSafe(pathname);
  if (!body) {
    res.writeHead(404).end("Not found");
    return;
  }
  res.writeHead(200, {
    "Content-Type": MIME_TYPES[extname(pathname)] ?? "application/octet-stream",
    "Cache-Control": "no-cache",
  });
  res.end(req.method === "HEAD" ? undefined : body);
});

server.listen(PORT, async () => {
  console.log(`Tetris is running at http://localhost:${PORT}`);
  if (!(await readSafe("dist/src/ui/main.js"))) {
    console.warn("The game is not built yet - run `npm run build` first.");
  }
});
