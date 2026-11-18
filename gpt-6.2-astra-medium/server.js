import http from 'node:http';
import {readFile} from 'node:fs/promises';
const types = {html:'text/html',css:'text/css',js:'text/javascript'};
http.createServer(async (req,res) => {
  const path = new URL(req.url,'http://localhost').pathname;
  const file = path === '/' ? 'index.html' : path.slice(1);
  if (!/^(index\.html|style\.css|dist\/[a-z]+\.js)$/.test(file)) return res.writeHead(404).end();
  try {
    const body = await readFile(new URL(file,import.meta.url));
    res.writeHead(200,{'Content-Type':types[file.split('.').pop()]}).end(body);
  } catch { res.writeHead(404).end(); }
}).listen(8321,()=>console.log('Tetris at http://localhost:8321'));
