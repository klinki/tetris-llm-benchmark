// Static file server for the game. Serves public/ at the root and dist/ under /dist/.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = 8321;
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PUBLIC_DIR = resolve(ROOT, 'public');
const DIST_DIR = resolve(ROOT, 'dist');

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

/** Maps a URL path to a file under public/ or dist/. */
function resolveFile(pathname) {
  if (pathname === '/') return join(PUBLIC_DIR, 'index.html');
  if (pathname.startsWith('/dist/')) return join(DIST_DIR, pathname.slice('/dist/'.length));
  return join(PUBLIC_DIR, pathname);
}

const server = createServer(async (request, response) => {
  const { pathname } = new URL(request.url ?? '/', 'http://localhost');
  const file = resolve(resolveFile(pathname));
  const insideRoot = file.startsWith(PUBLIC_DIR + sep) || file.startsWith(DIST_DIR + sep);

  try {
    if (!insideRoot) throw new Error(`refusing to serve ${file}`);
    const body = await readFile(file);
    response.writeHead(200, {
      'Content-Type': CONTENT_TYPES[extname(file)] ?? 'application/octet-stream',
    });
    response.end(body);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
});

server.on('error', (error) => {
  console.error(error.code === 'EADDRINUSE' ? `Port ${PORT} is already in use` : error);
  process.exitCode = 1;
});

server.listen(PORT, () => {
  console.log(`Tetris is running at http://localhost:${PORT}`);
});
