import { copyFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const sourceDirectory = join(projectRoot, 'src');
const outputDirectory = join(projectRoot, 'dist');

await mkdir(outputDirectory, { recursive: true });
await Promise.all([
  copyFile(join(sourceDirectory, 'index.html'), join(outputDirectory, 'index.html')),
  copyFile(join(sourceDirectory, 'styles.css'), join(outputDirectory, 'styles.css')),
]);

console.log('Copied index.html and styles.css into dist/');
