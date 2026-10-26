const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = 8321;
const ROOT = __dirname;
const MIME = {
  '.html':'text/html', '.js':'application/javascript', '.css':'text/css',
  '.json':'application/json', '.png':'image/png', '.svg':'image/svg+xml'
};
http.createServer((req,res)=>{
  let url = req.url.split('?')[0];
  if (url === '/') url = '/index.html';
  const file = path.join(ROOT, url);
  fs.readFile(file,(err,data)=>{
    if(err){ res.statusCode=404; res.end('not found'); return;}
    const ext = path.extname(file);
    res.setHeader('Content-Type', MIME[ext]||'application/octet-stream');
    res.end(data);
  });
}).listen(PORT,()=>console.log('http://localhost:'+PORT));
