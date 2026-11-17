import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const files = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ...['main', 'game', 'pieces'].map(name => [
    `/dist/${name}.js`, [`dist/${name}.js`, 'text/javascript; charset=utf-8'],
  ]),
]);

createServer(async (request, response) => {
  const path = request.url?.split('?')[0];
  const file = files.get(path);
  if (!file || !['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(404).end('Not found');
    return;
  }

  const [filename, type] = file;
  try {
    const content = await readFile(new URL(`../${filename}`, import.meta.url));
    response.writeHead(200, { 'Content-Type': type });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      response.writeHead(404).end('File missing. Run npm run build first.');
    } else {
      response.writeHead(500).end('Unable to serve file.');
    }
  }
}).listen(8321, 'localhost', () => {
  console.log('TetrisJS is running at http://localhost:8321');
});
