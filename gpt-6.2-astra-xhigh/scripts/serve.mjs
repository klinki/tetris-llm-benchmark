import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const types = { '/': 'text/html', '/index.html': 'text/html', '/style.css': 'text/css' };
const root = new URL('../', import.meta.url);
const port = Number(process.env.PORT || 8321);
createServer(async (req, res) => {
  const path = req.url.split('?')[0];
  const type = Object.hasOwn(types, path)
    ? types[path]
    : /^\/dist\/[\w-]+\.js$/.test(path)
      ? 'text/javascript'
      : null;
  if (!type || (req.method !== 'GET' && req.method !== 'HEAD')) {
    res.writeHead(404).end();
    return;
  }
  try {
    const data = await readFile(new URL(path === '/' ? 'index.html' : path.slice(1), root));
    res.writeHead(200, { 'Content-Type': type + '; charset=utf-8', 'Cache-Control': 'no-cache' });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch {
    res.writeHead(404).end();
  }
}).listen(port, () => console.log('Tetris is ready at http://localhost:' + port));
