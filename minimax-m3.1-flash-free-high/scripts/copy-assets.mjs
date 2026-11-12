import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const src = join(root, 'src');
const dist = join(root, 'dist');

await mkdir(dist, { recursive: true });

for (const asset of ['index.html', 'styles.css']) {
  await copyFile(join(src, asset), join(dist, asset));
}

console.log('copied static assets to dist/');
