// Minimal static file server for the game. Serves index.html, style.css and dist/ only.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = 8321;
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const distDir = join(root, 'dist') + sep;

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};

createServer(async (req, res) => {
  const { pathname } = new URL(req.url ?? '/', 'http://localhost');
  const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  const allowed = file === join(root, 'index.html') || file === join(root, 'style.css') || file.startsWith(distDir);

  try {
    if (!allowed) throw new Error('not found');
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': CONTENT_TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}).listen(PORT, () => {
  console.log(`TetrisJS running at http://localhost:${PORT}`);
});
