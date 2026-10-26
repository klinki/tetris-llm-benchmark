// Minimal dependency-free static file server.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const port = Number(process.env.PORT) || 8321;
const types = { ".html": "text/html", ".js": "text/javascript", ".map": "application/json", ".css": "text/css" };

createServer(async (req, res) => {
  const path = normalize(decodeURIComponent((req.url ?? "/").split("?")[0]));
  const file = join(root, path === "/" ? "index.html" : path);
  if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
  try {
    const body = await readFile(file);
    res.writeHead(200, { "Content-Type": types[extname(file)] ?? "application/octet-stream" }).end(body);
  } catch {
    res.writeHead(404).end("Not found");
  }
}).listen(port, () => console.log(`TetrisJS running at http://localhost:${port}`));
