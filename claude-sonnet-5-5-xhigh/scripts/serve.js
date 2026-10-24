// Minimal static file server for the game, using only Node's standard library.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const PORT = Number(process.env.PORT) || 8321;

// Only the page, its stylesheet and the compiled scripts are served.
const SERVED = ["index.html", "style.css", `dist${sep}`];

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".map": "application/json; charset=utf-8",
};

function resolveRequest(url) {
  const pathname = decodeURIComponent(new URL(url, "http://localhost").pathname);
  const relative = normalize(pathname === "/" ? "index.html" : pathname.slice(1));
  return SERVED.some((entry) => relative === entry || relative.startsWith(entry)) ? join(ROOT, relative) : null;
}

const server = createServer(async (request, response) => {
  try {
    const file = resolveRequest(request.url ?? "/");
    if (!file) throw Object.assign(new Error("Not found"), { code: "ENOENT" });

    const body = await readFile(file);
    response.writeHead(200, {
      "Content-Type": CONTENT_TYPES[extname(file)] ?? "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    response.end(body);
  } catch (error) {
    const notFound = error.code === "ENOENT" || error.code === "EISDIR";
    response.writeHead(notFound ? 404 : 500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(notFound ? "Not found" : "Server error");
  }
});

server.listen(PORT, () => {
  console.log(`TetrisJS running at http://localhost:${PORT}`);
});
