import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PORT = Number(process.env.PORT ?? 8321);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.map': 'application/json; charset=utf-8',
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  });
  res.end(body);
}

const server = createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    send(res, 405, 'Method Not Allowed', { Allow: 'GET, HEAD' });
    return;
  }

  try {
    const url = new URL(req.url ?? '/', 'http://localhost');
    let pathname = decodeURIComponent(url.pathname);

    if (pathname.endsWith('/')) {
      pathname += 'index.html';
    }

    const filePath = resolve(join(ROOT, normalize(pathname)));

    if (filePath !== ROOT && !filePath.startsWith(`${ROOT}${sep}`)) {
      send(res, 403, 'Forbidden');
      return;
    }

    let info;
    try {
      info = await stat(filePath);
    } catch {
      send(res, 404, 'Not Found');
      return;
    }

    if (info.isDirectory()) {
      send(res, 404, 'Not Found');
      return;
    }

    const body = await readFile(filePath);
    const headers = {
      'Content-Type': MIME_TYPES[extname(filePath)] ?? 'application/octet-stream',
      'Content-Length': body.byteLength,
    };

    if (req.method === 'HEAD') {
      send(res, 200, '', headers);
      return;
    }

    send(res, 200, body, headers);
  } catch {
    send(res, 500, 'Internal Server Error');
  }
});

server.listen(PORT, () => {
  console.log(`Tetris running at http://localhost:${PORT}`);
});
