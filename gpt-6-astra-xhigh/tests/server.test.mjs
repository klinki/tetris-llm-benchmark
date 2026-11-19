import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

let child;
let base;
before(async () => {
  child = spawn(process.execPath, ['scripts/serve.mjs'], { env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
  base = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Server did not start')), 5000);
    child.once('error', error => { clearTimeout(timeout); reject(error); });
    child.once('exit', code => { clearTimeout(timeout); reject(new Error(`Server exited: ${code}`)); });
    child.stdout.once('data', data => {
      clearTimeout(timeout);
      const url = data.toString().match(/http:\/\/localhost:\d+/)?.[0];
      if (url) resolve(url);
      else reject(new Error('Server did not report its URL'));
    });
  });
});
after(async () => {
  if (child && child.exitCode === null) {
    const stopped = once(child, 'exit');
    child.kill();
    await stopped;
  }
});

test('serves the page and ES modules with correct MIME types', async () => {
  for (const [path, mime] of [['/', 'text/html'], ['/styles.css', 'text/css'], ['/dist/main.js', 'text/javascript'], ['/dist/game.js', 'text/javascript']]) {
    const response = await fetch(base + path);
    assert.equal(response.status, 200);
    assert.ok(response.headers.get('content-type').startsWith(mime));
    assert.ok((await response.text()).length > 0);
  }
});

test('does not serve sources, dependencies, missing files or path traversal', async () => {
  for (const path of ['/README.md', '/package.json', '/src/game.ts', '/node_modules/typescript/package.json', '/dist/missing.js', '/dist%2f..%2fpackage.json', '/dist/%2e%2e%2f%2e%2e%2fREADME.md']) {
    assert.equal((await fetch(base + path)).status, 404, path);
  }
  assert.equal((await fetch(base + '/%ZZ')).status, 400);
});

test('supports HEAD and rejects write methods', async () => {
  const head = await fetch(base, { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
  const post = await fetch(base, { method: 'POST' });
  assert.equal(post.status, 405);
  assert.equal(post.headers.get('allow'), 'GET, HEAD');
});
