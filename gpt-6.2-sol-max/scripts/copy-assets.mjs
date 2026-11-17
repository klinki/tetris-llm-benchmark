import { copyFile, mkdir } from "node:fs/promises";

const assets = new URL("../public/", import.meta.url);
const output = new URL("../dist/", import.meta.url);

await mkdir(output, { recursive: true });
await Promise.all(["index.html", "styles.css"].map((file) =>
  copyFile(new URL(file, assets), new URL(file, output)),
));
