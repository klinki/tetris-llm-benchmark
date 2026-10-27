// Minimal dependency-free static file server: http://localhost:8321
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const PORT = 8321;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".map": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const server = createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    const decoded = decodeURIComponent(pathname);
    const filePath = resolve(join(ROOT, decoded === "/" ? "index.html" : decoded));
    if (filePath !== ROOT && !filePath.startsWith(ROOT + sep)) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    const body = await readFile(filePath);
    const type = MIME_TYPES[extname(filePath).toLowerCase()] ?? "application/octet-stream";
    res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" }).end(body);
  } catch (error) {
    const code = error && typeof error === "object" ? error.code : "";
    if (code === "ENOENT" || code === "EISDIR") {
      res.writeHead(404).end("Not found");
    } else {
      res.writeHead(500).end("Server error");
    }
  }
});

server.listen(PORT, () => {
  console.log(`Tetris running at http://localhost:${PORT}`);
  if (!existsSync(join(ROOT, "dist", "main.js"))) {
    console.warn("warning: dist/main.js is missing - run `npm run build` first");
  }
});
