import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const source = resolve(projectRoot, "src");
const output = resolve(projectRoot, "dist");

await mkdir(output, { recursive: true });
await Promise.all([
  copyFile(resolve(source, "index.html"), resolve(output, "index.html")),
  copyFile(resolve(source, "styles.css"), resolve(output, "styles.css"))
]);
