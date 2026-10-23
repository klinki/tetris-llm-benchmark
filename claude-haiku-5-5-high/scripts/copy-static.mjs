import { cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Copies the HTML and CSS from public/ next to the compiled JavaScript in dist/.
const publicDir = fileURLToPath(new URL('../public', import.meta.url));
const distDir = fileURLToPath(new URL('../dist', import.meta.url));

await cp(publicDir, distDir, { recursive: true });
