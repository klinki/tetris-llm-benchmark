import { cp, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const source = join(root, 'src');
const target = join(root, 'dist');

await mkdir(target, { recursive: true });

for (const file of ['index.html', 'styles.css']) {
  await cp(join(source, file), join(target, file));
}

console.log('Copied the static assets to dist/.');
