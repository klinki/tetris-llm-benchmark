import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname } from "node:path";

const output = new URL("../dist/", import.meta.url);
const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
]);

const server = createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }

  const path = (request.url ?? "/").split("?")[0];
  const file = path === "/" ? "index.html" : path.slice(1);
  const type = contentTypes.get(extname(file));
  if (!path.startsWith("/") || !/^[\w.-]+$/.test(file) || !type) {
    response.writeHead(404).end();
    return;
  }

  try {
    const body = await readFile(new URL(file, output));
    response.writeHead(200, { "Content-Type": type, "Content-Length": body.length });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch (error) {
    response.writeHead(error.code === "ENOENT" ? 404 : 500).end();
  }
});

server.listen(Number(process.env.PORT ?? 8321), "127.0.0.1", () => {
  console.log(`Fluxwell: http://localhost:${server.address().port}`);
});
