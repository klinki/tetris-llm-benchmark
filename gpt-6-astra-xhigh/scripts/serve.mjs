import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { extname, resolve, sep } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const port = Number(process.env.PORT || 8321);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.map': 'application/json', '.svg': 'image/svg+xml' };

const server = createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end('Method not allowed');
    return;
  }
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const path = resolve(root, relative);
    // Expose only the game's public assets, never sources or node_modules.
    const allowed = ['index.html', 'styles.css'].includes(relative)
      || (relative.startsWith('dist/') && path.startsWith(resolve(root, 'dist') + sep));
    if (!allowed || !path.startsWith(root.endsWith(sep) ? root : root + sep)) {
      response.writeHead(404).end('Not found');
      return;
    }
    if (!(await stat(path)).isFile()) { response.writeHead(404).end('Not found'); return; }
    const content = await readFile(path);
    response.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch (error) {
    const badRequest = error instanceof URIError || error instanceof TypeError;
    response.writeHead(badRequest ? 400 : 404).end(badRequest ? 'Bad request' : 'Not found');
  }
});
server.on('error', error => { console.error(`Cannot start Tetris: ${error.message}`); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`Tetris is ready at http://localhost:${server.address().port}`));
