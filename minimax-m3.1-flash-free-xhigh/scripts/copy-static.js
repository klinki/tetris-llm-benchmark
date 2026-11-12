import { cp, mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const SOURCE = 'src';
const TARGET = 'dist';

/** Copies every file that is not a TypeScript source into the build folder. */
async function copyStatic(from, to) {
  const entries = await readdir(from, { withFileTypes: true });
  let copied = 0;

  for (const entry of entries) {
    if (entry.isDirectory()) {
      copied += await copyStatic(join(from, entry.name), join(to, entry.name));
    } else if (!entry.name.endsWith('.ts')) {
      await mkdir(to, { recursive: true });
      await cp(join(from, entry.name), join(to, entry.name));
      copied++;
    }
  }

  return copied;
}

await mkdir(TARGET, { recursive: true });
const copied = await copyStatic(SOURCE, TARGET);
console.log(`Copied ${copied} static file(s) from ${SOURCE} to ${TARGET}.`);
