import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.PORT) || 8321;
const root = fileURLToPath(new URL('..', import.meta.url));
const publicDir = resolve(root, 'public');
const distDir = resolve(root, 'dist');

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

/** Maps a URL path to a file: /dist/* comes from dist/, everything else from public/. */
function filePathFor(pathname) {
  const decoded = decodeURIComponent(pathname);
  const [dir, relative] = decoded.startsWith('/dist/')
    ? [distDir, decoded.slice('/dist/'.length)]
    : [publicDir, decoded.slice(1) || 'index.html'];
  const file = resolve(dir, relative);
  return file.startsWith(dir + sep) ? file : null;
}

const server = createServer(async (req, res) => {
  try {
    const file = filePathFor(new URL(req.url, 'http://localhost').pathname);
    if (!file) throw new Error('outside the served directories');
    const body = await readFile(file);
    res.writeHead(200, {
      'Content-Type': CONTENT_TYPES[extname(file)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`TetrisJS is running at http://localhost:${PORT}`);
});
