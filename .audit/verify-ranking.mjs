import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const rankingPath = resolve(repositoryRoot, "RANKING.md");
const markdown = readFileSync(rankingPath, "utf8");

let localLinkCount = 0;
const documents = [
  "RANKING.md", "README.md", ".audit/README.md", ".audit/browser-results.md",
  ".audit/october-review.md",
];
for (const relativePath of documents) {
  const documentPath = resolve(repositoryRoot, relativePath);
  const content = readFileSync(documentPath, "utf8").replace(/```[^\n]*\n[\s\S]*?```/g, "");
  const links = [...content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)]
    .map(match => match[1]).filter(link => !link.includes(":"));
  for (const link of links) {
    assert.equal(existsSync(resolve(dirname(documentPath), link.split("#")[0])), true,
      `Missing local link in ${relativePath}: ${link}`);
  }
  localLinkCount += links.length;
  for (const block of content.split(/\n\n+/).filter(part => part.startsWith("|"))) {
    const widths = block.split("\n").filter(Boolean).map(line => line.split("|").length);
    assert.equal(new Set(widths).size, 1, `Ragged Markdown table in ${relativePath}: ${block.split("\n")[0]}`);
  }
}

const implementationCount = Number(markdown.match(/evaluates (\d+) implementations/)?.[1]);
assert.equal(Number.isInteger(implementationCount), true, "Missing implementation count in introduction");
const rankingRows = markdown.split("\n").filter((line) => /^\| \d+ \|/.test(line));
assert.equal(rankingRows.length, implementationCount, "Ranking row count does not match introduction");

let previousOrder;

for (const [index, row] of rankingRows.entries()) {
  const columns = row.split("|").map((column) => column.trim());
  assert.equal(Number(columns[1]), index + 1, `Nonsequential ranking: ${row}`);
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

  const bugCount = kind => Number(columns[9].match(new RegExp(`(\\d+) ${kind}`))?.[1] ?? 0);
  const critical = bugCount("critical");
  const beforeOtherDeductions = critical > 0 ? Math.min(4, 10 - 4 * critical) : 10;
  const correctness = Math.max(0, beforeOtherDeductions - 1.5 * bugCount("major") - 0.5 * bugCount("minor"));
  assert.equal(scores[0], correctness, `Correctness does not match documented bug deductions: ${row}`);

  const order = [Number(recomputed.toFixed(2)), scores[0], scores[1], scores[2]];
  if (previousOrder) {
    const firstDifference = order.findIndex((value, position) => value !== previousOrder[position]);
    assert.equal(firstDifference < 0 || order[firstDifference] < previousOrder[firstDifference], true,
      `Ranking order or tie-break mismatch: ${row}`);
  }
  previousOrder = order;
}

console.log(`Validated ${localLinkCount} local links, ${rankingRows.length} score rows, deductions, ordering, and tables in ${documents.length} documents.`);
