import http from 'node:http'
import {readFile} from 'node:fs/promises'
const files={'/':['index.html','text/html'],'/style.css':['style.css','text/css'],'/dist/game.js':['dist/game.js','text/javascript'],'/dist/ui.js':['dist/ui.js','text/javascript']}
http.createServer(async(req,res)=>{
 const entry=Object.hasOwn(files,req.url)&&files[req.url]
 if(entry){try{const data=await readFile(entry[0]);res.writeHead(200,{'Content-Type':entry[1]});res.end(data);return}catch{}}
 res.writeHead(404);res.end()
}).listen(8321)
