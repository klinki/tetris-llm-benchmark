import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, extname, sep } from "node:path";

const root = resolve(fileURLToPath(new URL("../", import.meta.url)));
const port = Number(process.env.PORT || 8321);
const types = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".map": "application/json",
  ".svg": "image/svg+xml",
};
try {
  await readFile(resolve(root, "dist/main.js"));
} catch {
  console.error("Build the game first with npm run build.");
  process.exit(1);
}
createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
    const relative = pathname === "/" ? "index.html" : pathname.slice(1);
    const path = resolve(root, relative);
    if (
      !path.startsWith(root + sep) ||
      !/^(index\.html|style\.css|dist\/.*\.(js|map))$/.test(relative)
    ) {
      response.writeHead(404).end("Not found");
      return;
    }
    const body = await readFile(path);
    response.writeHead(200, {
      "Content-Type": `${types[extname(path)] || "application/octet-stream"}; charset=utf-8`,
      "Cache-Control": "no-cache",
    });
    response.end(body);
  } catch {
    response.writeHead(404).end("Not found");
  }
}).listen(port, "0.0.0.0", () =>
  console.log(`Tetris is running at http://localhost:${port}`),
);
