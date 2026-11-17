import { copyFile } from 'node:fs/promises';

await Promise.all(['index.html', 'styles.css'].map((file) => copyFile(file, `dist/${file}`)));
