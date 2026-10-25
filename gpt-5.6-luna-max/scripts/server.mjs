import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const port = Number(process.env.PORT ?? 8321);
const root = normalize(join(fileURLToPath(new URL(".", import.meta.url)), "..", "dist"));
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".map": "application/json; charset=utf-8",
};

function requestedPath(urlPath) {
  const decoded = decodeURIComponent((urlPath ?? "/").split("?")[0]);
  const path = decoded === "/" ? "/index.html" : decoded;
  const candidate = normalize(join(root, path));
  return candidate.startsWith(root + sep) || candidate === root ? candidate : null;
}

const server = createServer((request, response) => {
  const filePath = requestedPath(request.url);
  if (filePath === null || !existsSync(filePath) || !statSync(filePath).isFile()) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "cache-control": "no-cache",
    "content-type": mimeTypes[extname(filePath)] ?? "application/octet-stream",
  });
  createReadStream(filePath).pipe(response);
});

server.listen(port, "127.0.0.1", () => {
  console.log("TetrisJS running at http://localhost:" + port);
});
