import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = 8321;
const root = fileURLToPath(new URL('..', import.meta.url));
const publicDir = resolve(root, 'public');
const distDir = resolve(root, 'dist');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};

createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url ?? '/', 'http://localhost');
    const isDist = pathname.startsWith('/dist/');
    const dir = isDist ? distDir : publicDir;
    const rel = isDist ? pathname.slice('/dist/'.length) : pathname.slice(1) || 'index.html';
    const file = resolve(dir, decodeURIComponent(rel));

    if (!file.startsWith(dir + sep)) {
      res.writeHead(403).end('Forbidden');
      return;
    }

    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(PORT, () => {
  console.log(`TetrisJS running at http://localhost:${PORT}`);
});
