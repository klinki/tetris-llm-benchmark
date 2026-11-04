import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const port = Number(process.env.PORT ?? 8321);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

const server = createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" }).end("Method not allowed");
    return;
  }
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const path = resolve(root, `.${pathname === "/" ? "/index.html" : pathname}`);
    const type = types[extname(path)];
    if (!path.startsWith(root.endsWith(sep) ? root : root + sep) || !type) {
      response.writeHead(404).end("Not found");
      return;
    }
    const content = await readFile(path);
    response.writeHead(200, { "Content-Type": type, "Cache-Control": "no-cache", "X-Content-Type-Options": "nosniff" });
    response.end(request.method === "HEAD" ? undefined : content);
  } catch (error) {
    const badRequest = error instanceof URIError;
    response.writeHead(badRequest ? 400 : 404).end(badRequest ? "Bad request" : "Not found");
  }
});

server.on("error", (error) => {
  console.error(`Could not start Tetris: ${error.message}`);
  process.exitCode = 1;
});
server.listen(port, "127.0.0.1", () => console.log(`Tetris is ready at http://localhost:${port}`));
