import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
const root=process.cwd();const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json'};
createServer(async(req,res)=>{try{let pathname=new URL(req.url??'/',`http://${req.headers.host}`).pathname;if(pathname==='/')pathname='/index.html';const file=resolve(root,`.${pathname}`);if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403).end('Forbidden');return;}const content=await readFile(file);res.writeHead(200,{'content-type':types[extname(file)]??'application/octet-stream','cache-control':'no-cache'}).end(content);}catch{res.writeHead(404,{'content-type':'text/plain'}).end('Not found');}}).listen(8321,()=>console.log('TetrisJS running at http://localhost:8321'));
