import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)));
const port = Number(process.env.PORT ?? 8321);
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

const server = createServer(async (request, response) => {
  const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
  let relativePath;
  if (pathname === '/' || pathname === '/index.html') relativePath = 'index.html';
  else if (pathname === '/styles.css') relativePath = 'styles.css';
  else if (pathname.startsWith('/dist/')) relativePath = pathname.slice(1);
  else {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }

  const filePath = resolve(root, relativePath);
  if (!filePath.startsWith(`${root}${sep}`) && filePath !== resolve(root, 'index.html')) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  try {
    const contents = await readFile(filePath);
    response.writeHead(200, {
      'Content-Type': mimeTypes[extname(filePath)] ?? 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    response.end(contents);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`TetrisJS is running at http://localhost:${port}`);
});
