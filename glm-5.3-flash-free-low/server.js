/**
 * Minimal dependency-free static file server.
 * Serves dist/ at http://localhost:8321 (binary-safe: fs.readFileSync).
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8321;
const ROOT = path.resolve(__dirname, 'dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url || '/', `http://localhost:${PORT}`);
    const pathname = decodeURIComponent(url.pathname);
    const target = path.normalize(path.join(ROOT, pathname === '/' ? 'index.html' : pathname));
    if (!target.startsWith(ROOT)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    const data = fs.readFileSync(target);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(target)] || 'application/octet-stream' });
    res.end(data);
  } catch (err) {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`TetrisJS running at http://localhost:${PORT}`);
});
