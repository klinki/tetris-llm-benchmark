import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const rankingPath = resolve(repositoryRoot, "RANKING.md");
const markdown = readFileSync(rankingPath, "utf8");

const localLinks = [...markdown.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)]
  .map((match) => match[1])
  .filter((link) => !link.includes(":"));

for (const link of localLinks) {
  assert.equal(existsSync(resolve(dirname(rankingPath), link)), true, `Missing local link: ${link}`);
}

const rankingRows = markdown.split("\n").filter((line) => /^\| [1-5] \|/.test(line));
assert.equal(rankingRows.length, 5, "Expected five ranking rows");

for (const row of rankingRows) {
  const columns = row.split("|").map((column) => column.trim());
  const scores = columns.slice(3, 8).map(Number);
  for (const score of scores) {
    assert.equal(Number.isFinite(score), true, `Invalid score in row: ${row}`);
    assert.equal(score >= 0 && score <= 10, true, `Score outside 0–10 in row: ${row}`);
    assert.equal(Number.isInteger(score * 2), true, `Score is not a half-point increment: ${row}`);
  }

  const recomputed = scores[0] * 0.4
    + scores[1] * 0.2
    + scores[2] * 0.2
    + scores[3] * 0.1
    + scores[4] * 0.1;
  const displayed = Number(columns[8].replaceAll("*", ""));
  assert.equal(recomputed.toFixed(2), displayed.toFixed(2), `Weighted score mismatch: ${row}`);
}

for (const block of markdown.split(/\n\n+/).filter((part) => part.startsWith("|"))) {
  const rowWidths = block.split("\n").filter(Boolean).map((line) => line.split("|").length);
  assert.equal(new Set(rowWidths).size, 1, `Ragged Markdown table: ${block.split("\n")[0]}`);
}

console.log(`Validated ${localLinks.length} local links, ${rankingRows.length} score rows, and all Markdown tables.`);
