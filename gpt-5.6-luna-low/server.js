const http = require('http'), fs = require('fs'), path = require('path');
const root = __dirname, mime = {'.html':'text/html', '.js':'text/javascript', '.css':'text/css'};
http.createServer((req,res) => { let p = req.url === '/' ? '/index.html' : req.url; p = path.join(root, p); if (!p.startsWith(root) || !fs.existsSync(p)) return res.writeHead(404).end(); res.writeHead(200, {'Content-Type': mime[path.extname(p)] || 'text/plain'}); fs.createReadStream(p).pipe(res); }).listen(8321, () => console.log('Tetris: http://localhost:8321'));
