/** Minimal dependency-free static file server for the built game. */

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("../dist/", import.meta.url)));
const port = Number(process.env.PORT ?? 8321);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

async function findFile(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }

  const relative = decoded.replace(/^\/+/, "");
  const candidate = resolve(join(root, relative || "index.html"));
  if (candidate !== root && !candidate.startsWith(root + sep)) return null;

  try {
    const info = await stat(candidate);
    if (info.isDirectory()) {
      const index = join(candidate, "index.html");
      const indexInfo = await stat(index);
      return indexInfo.isFile() ? index : null;
    }
    return info.isFile() ? candidate : null;
  } catch {
    return null;
  }
}

const server = createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { allow: "GET, HEAD" });
    response.end("Method Not Allowed");
    return;
  }

  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
  const file = await findFile(pathname);

  if (!file) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not Found");
    return;
  }

  try {
    const body = await readFile(file);
    response.writeHead(200, {
      "content-type": MIME_TYPES[extname(file)] ?? "application/octet-stream",
      "content-length": body.byteLength,
      "cache-control": "no-store",
    });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch {
    response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    response.end("Internal Server Error");
  }
});

server.listen(port, () => {
  console.log(`Tetris running at http://localhost:${port}`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use. Set PORT to serve on another port.`);
  } else {
    console.error(error);
  }
  process.exit(1);
});
