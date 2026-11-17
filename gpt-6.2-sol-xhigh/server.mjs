import { readFile } from "node:fs/promises";
import { createServer } from "node:http";

const root = new URL("./", import.meta.url);
const port = Number(process.env.PORT ?? 8321);

const assets = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/styles.css", ["styles.css", "text/css; charset=utf-8"]],
]);

const server = createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }

  const pathname = request.url?.split("?")[0] ?? "";
  const asset = assets.get(pathname) ??
    (/^\/dist\/[a-z]+\.js$/.test(pathname)
      ? [pathname.slice(1), "text/javascript; charset=utf-8"]
      : null);

  if (!asset) {
    response.writeHead(404).end();
    return;
  }

  const [path, contentType] = asset;
  try {
    const body = await readFile(new URL(path, root));
    response.writeHead(200, {
      "Content-Type": contentType,
      "Content-Length": body.length,
      "Cache-Control": "no-cache",
    });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch (error) {
    response.writeHead(error.code === "ENOENT" ? 404 : 500).end();
  }
});

try {
  await readFile(new URL("dist/main.js", root));
  server.listen(port, () => {
    console.log(`TetrisJS is available at http://localhost:${server.address().port}`);
  });
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  console.error("Build the game with npm run build before starting the server.");
  process.exitCode = 1;
}
