import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';

const directory = new URL('../dist/', import.meta.url);
const types = {
  html: 'text/html; charset=utf-8',
  css: 'text/css; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
};
const port = Number(process.env.PORT ?? 8321);

try {
  await readFile(new URL('index.html', directory));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  console.error('Run npm run build before starting the game.');
  process.exit(1);
}

createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }

  const path = (request.url ?? '/').split('?')[0];
  const file = /^\/([a-z0-9-]+\.(html|css|js))$/.exec(path === '/' ? '/index.html' : path);
  if (!file) {
    response.writeHead(404).end();
    return;
  }

  try {
    const body = await readFile(new URL(file[1], directory));
    response.writeHead(200, { 'Content-Type': types[file[2]], 'Content-Length': body.length });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch (error) {
    response.writeHead(error.code === 'ENOENT' ? 404 : 500).end();
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`Aftershift is running at http://localhost:${port}`);
});
