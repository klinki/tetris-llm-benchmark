import { cp, mkdir } from "node:fs/promises";

await mkdir("dist", { recursive: true });
await Promise.all([
  cp("src/index.html", "dist/index.html"),
  cp("src/styles.css", "dist/styles.css"),
]);
