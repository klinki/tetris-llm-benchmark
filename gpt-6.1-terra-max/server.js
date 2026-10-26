import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const root = process.cwd();
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml' };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url || '/', 'http://localhost').pathname);
    const file = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (file !== root && !file.startsWith(root + sep)) throw new Error('Invalid path');
    const contents = await readFile(file);
    response.writeHead(200, {'Content-Type': types[extname(file)] || 'application/octet-stream'});
    response.end(contents);
  } catch {
    response.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'});
    response.end('Not found');
  }
});
server.listen(8321, () => console.log('Tetris is running at http://localhost:8321'));
