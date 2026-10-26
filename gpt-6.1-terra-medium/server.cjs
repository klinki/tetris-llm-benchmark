const http = require('http'), fs = require('fs'), path = require('path');
const root = __dirname;
http.createServer((req, res) => {
  const file = path.join(root, decodeURIComponent((req.url || '/').split('?')[0] === '/' ? '/index.html' : (req.url || '').split('?')[0]));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (err, data) => { if (err) { res.writeHead(404).end('Not found'); return; } res.setHeader('Content-Type', ({'.html':'text/html','.css':'text/css','.js':'text/javascript'})[path.extname(file)] || 'application/octet-stream'); res.end(data); });
}).listen(8321, () => console.log('Tetris running at http://localhost:8321'));
