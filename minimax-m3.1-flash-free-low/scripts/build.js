import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, 'dist');

mkdirSync(dist, { recursive: true });
for (const asset of ['index.html', 'style.css']) {
  copyFileSync(join(root, 'src', asset), join(dist, asset));
}
console.log('assets copied to dist/');
