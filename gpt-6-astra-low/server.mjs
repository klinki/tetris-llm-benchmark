import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd();
http.createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname === '/'?'/index.html':new URL(req.url,'http://localhost').pathname));if(!file.startsWith(root+path.sep))throw Error();const data=await readFile(file);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css'})[path.extname(file)]||'application/octet-stream');res.end(data);}catch{res.writeHead(404);res.end('Not found');}}).listen(8321,()=>console.log('http://localhost:8321'));
