import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve, extname} from 'node:path';
const root = resolve('.');
http.createServer(async(req,res)=>{
  try {
    const path = resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname === '/' ? '/index.html' : new URL(req.url, 'http://localhost').pathname));
    if(!path.startsWith(root + '/')) throw Error();
    const data = await readFile(path);
    res.setHeader('Content-Type', {'.html':'text/html','.css':'text/css','.js':'text/javascript'}[extname(path)] ?? 'application/octet-stream');
    res.end(data);
  } catch {res.writeHead(404);res.end('Not found');}
}).listen(8321,()=>console.log('Tetris: http://localhost:8321'));
