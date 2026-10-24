import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, normalize, join } from 'node:path';

const PORT = 8321;
const ROOT = new URL('.', import.meta.url).pathname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

async function resolve(urlPath) {
  if (urlPath === '/') urlPath = '/index.html';
  const clean = normalize(urlPath);
  const rel = clean.startsWith('/dist/') ? join('dist', clean.slice('/dist/'.length)) : join('public', clean);
  const path = normalize(join(ROOT, rel));
  if (!path.startsWith(ROOT)) return null; // path traversal guard
  try {
    const data = await readFile(path);
    return { data, type: MIME[extname(path)] ?? 'application/octet-stream' };
  } catch {
    return null;
  }
}

createServer(async (req, res) => {
  try {
    const found = await resolve(new URL(req.url ?? '/', 'http://localhost').pathname);
    if (found) {
      res.writeHead(200, { 'Content-Type': found.type });
      res.end(found.data);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
    }
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end(String(err));
  }
}).listen(PORT, () => console.log(`TetrisJS serving at http://localhost:${PORT}`));
