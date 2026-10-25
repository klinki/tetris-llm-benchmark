import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = new URL("./dist/", import.meta.url).pathname;
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8" };

createServer(async (req, res) => {
  try {
    const requested = req.url === "/" ? "index.html" : req.url?.split("?")[0].replace(/^\//, "") || "index.html";
    const file = normalize(join(root, requested));
    if (!file.startsWith(root) || !(await stat(file)).isFile()) throw new Error("not found");
    res.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream" });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404).end("Not found");
  }
}).listen(8321, () => console.log("TetrisJS running at http://localhost:8321"));
