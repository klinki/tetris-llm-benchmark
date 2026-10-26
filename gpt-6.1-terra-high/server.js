import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve, extname, sep} from 'node:path';
const root=process.cwd();
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
createServer(async(req,res)=>{try{const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname === '/' ? '/index.html' : new URL(req.url,'http://localhost').pathname));if(path!==root && !path.startsWith(root+sep))throw Error('Invalid path');const data=await readFile(path);res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream'});res.end(data);}catch{res.writeHead(404);res.end('Not found');}}).listen(8321,()=>console.log('Tetris running at http://localhost:8321'));
