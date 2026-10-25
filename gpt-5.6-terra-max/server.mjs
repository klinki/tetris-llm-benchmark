import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, normalize, resolve, sep } from "node:path";

const root = resolve(process.cwd(), "dist");
const port = Number(process.env.PORT || 8321);
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

const server = createServer((request, response) => {
  const requestUrl = new URL(request.url || "/", "http://localhost");
  const pathname = decodeURIComponent(requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname);
  const requested = normalize(resolve(root, "." + pathname));

  if (requested !== root && !requested.startsWith(root + sep)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  const file = existsSync(requested) && statSync(requested).isFile()
    ? requested
    : resolve(root, "index.html");

  if (!existsSync(file)) {
    response.writeHead(503, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Build the project first with npm run build.");
    return;
  }

  response.writeHead(200, {
    "Cache-Control": "no-store",
    "Content-Type": contentTypes[extname(file)] || "application/octet-stream"
  });
  createReadStream(file).pipe(response);
});

server.listen(port, "0.0.0.0", () => {
  console.log("Tetris is running at http://localhost:" + port);
});
