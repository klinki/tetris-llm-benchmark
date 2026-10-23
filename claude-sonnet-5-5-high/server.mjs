// Minimal static file server for the game: serves index.html and the compiled dist/ folder.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT) || 8321;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.map': 'application/json' };

createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  const path = normalize(decodeURIComponent(pathname));
  const file = path === '/' ? 'index.html' : path.slice(1);

  // Only the page and the build output are public.
  if (file !== 'index.html' && !file.startsWith('dist/')) {
    res.writeHead(404).end('Not found');
    return;
  }
  try {
    const body = await readFile(join(root, file));
    res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(port, () => console.log(`Tetris running at http://localhost:${port}`));
