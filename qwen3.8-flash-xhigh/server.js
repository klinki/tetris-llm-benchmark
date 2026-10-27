// Minimal dependency-free static server for the game.
// Serves index.html at / and the compiled assets under dist/.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname);
const PORT = 8321;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.map': 'application/json',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  let rel = decodeURIComponent(url.pathname);
  if (rel === '/') rel = '/index.html';

  const normalized = normalize(rel);
  // Only allow the entry page and compiled files; nothing else is exposed.
  const allowed = normalized === '/index.html' || normalized.startsWith('/dist/');
  if (!allowed) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found\n');
    return;
  }

  try {
    const file = join(ROOT, normalized);
    const body = await readFile(file);
    res.writeHead(200, {
      'Content-Type': MIME[extname(file)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found. Did you run `npm run build`?\n');
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Tetris running at http://localhost:${PORT}`);
});
