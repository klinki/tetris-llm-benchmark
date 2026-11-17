import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const files = new Map([
  ['/', ['index.html', 'text/html']],
  ['/index.html', ['index.html', 'text/html']],
  ['/dist/main.js', ['dist/main.js', 'text/javascript']],
  ['/dist/game.js', ['dist/game.js', 'text/javascript']],
]);

createServer(async (request, response) => {
  const file = files.get(request.url?.split('?')[0]);
  if (!file) {
    response.writeHead(404).end('Not found');
    return;
  }
  try {
    const body = await readFile(new URL(file[0], import.meta.url));
    response.writeHead(200, { 'Content-Type': file[1] + '; charset=utf-8' }).end(body);
  } catch (error) {
    if (error.code === 'ENOENT') response.writeHead(404).end('Run npm run build first.');
    else response.writeHead(500).end('Unable to read file.');
  }
}).listen(8321, 'localhost', () => console.log('http://localhost:8321'));
