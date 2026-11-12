// Copies the static assets (html/css) that tsc does not handle into dist/.
import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

await mkdir(dist, { recursive: true });

for (const asset of ['index.html', 'styles.css']) {
  await copyFile(join(root, 'src', asset), join(dist, asset));
}
