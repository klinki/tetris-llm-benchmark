import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const files = new Map([
  ['/', ['index.html', 'text/html']],
  ['/index.html', ['index.html', 'text/html']],
  ['/style.css', ['style.css', 'text/css']],
  ...['app', 'game', 'pieces', 'display'].map((name) => [
    '/dist/' + name + '.js',
    ['dist/' + name + '.js', 'text/javascript']
  ])
]);

createServer(async (req, res) => {
  const file = files.get((req.url || '/').split('?')[0]);
  if (!file) return res.writeHead(404).end();
  try {
    const body = await readFile(new URL(file[0], import.meta.url));
    res
      .writeHead(200, { 'Content-Type': file[1] + '; charset=utf-8' })
      .end(body);
  } catch {
    res.writeHead(500).end('Unable to load game file.');
  }
}).listen(8321, () =>
  console.log('Tetris is running at http://localhost:8321')
);
