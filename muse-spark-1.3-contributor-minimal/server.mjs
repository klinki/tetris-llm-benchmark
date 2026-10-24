import { createServer } from "http";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { extname, join } from "path";

const root = new URL(".", import.meta.url).pathname;
const PORT = 8321;
const mime = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".map": "application/json" };

createServer(async (req, res) => {
  try {
    let url = decodeURIComponent(req.url.split("?")[0]);
    if (url === "/") url = "/index.html";
    const file = join(root, url.slice(1));
    if (!existsSync(file)) { res.writeHead(404); res.end("not found"); return; }
    const body = await readFile(file);
    res.writeHead(200, { "Content-Type": mime[extname(file)] || "application/octet-stream" });
    res.end(body);
  } catch (e) { res.writeHead(500); res.end(String(e)); }
}).listen(PORT, () => console.log(`http://localhost:${PORT}`));
