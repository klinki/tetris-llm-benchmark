/** Copies static browser assets next to the compiled JavaScript. */

import { copyFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const source = fileURLToPath(new URL("../src/", import.meta.url));
const target = fileURLToPath(new URL("../dist/", import.meta.url));

await mkdir(target, { recursive: true });

for (const asset of ["index.html", "styles.css"]) {
  await copyFile(join(source, asset), join(target, asset));
}

console.log("Copied static assets to dist/");
