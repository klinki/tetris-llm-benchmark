import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const port = Number(process.env.PORT) || 8321;
const root = join(process.cwd(), "dist");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".map": "application/json; charset=utf-8"
};

createServer(async (request, response) => {
  try {
    const requested = new URL(request.url ?? "/", "http://localhost").pathname;
    const relative = requested === "/" ? "index.html" : requested.slice(1);
    const file = normalize(join(root, relative));
    if (!file.startsWith(root) || !(await stat(file)).isFile()) throw new Error("Not found");
    response.writeHead(200, { "Content-Type": types[extname(file)] ?? "application/octet-stream" });
    response.end(await readFile(file));
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}).listen(port, () => console.log(`TetrisJS is running at http://localhost:${port}`));
