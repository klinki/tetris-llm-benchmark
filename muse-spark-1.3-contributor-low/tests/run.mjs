import assert from "node:assert/strict";
import { Game } from "../dist/game.js";
import { Bag } from "../dist/randomizer.js";
import { cellsFor } from "../dist/pieces.js";
import { clearLines, collides, emptyGrid } from "../dist/board.js";
import { COLS, ROWS } from "../dist/constants.js";

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`ok - ${name}`);
}

// Board basics
test("grid is 10x22 empty", () => {
  const g = emptyGrid();
  assert.equal(g.length, ROWS);
  assert.equal(g[0].length, COLS);
  assert.ok(g.flat().every((v) => v === null));
});

// 7-bag: each bag of 7 has all kinds
test("7-bag randomizer deals complete sets", () => {
  let seed = 42;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const bag = new Bag(rand);
  for (let b = 0; b < 4; b++) {
    const set = new Set();
    for (let i = 0; i < 7; i++) set.add(bag.next());
    assert.equal(set.size, 7);
  }
});

// Rotation states have 4 cells and O never changes
test("piece rotation states are sane", () => {
  for (const r of [0, 1, 2, 3]) {
    assert.equal(cellsFor("T", r).length, 4);
    assert.equal(cellsFor("I", r).length, 4);
  }
  assert.deepEqual(cellsFor("O", 0), cellsFor("O", 3));
});

// Wall kick: rotation on empty board succeeds
test("rotation works on empty board", () => {
  const game = new Game();
  game.setQueue(["T", "T", "T", "T", "T", "T"]);
  game.spawnNext();
  assert.equal(game.tryRotate(1), true);
  assert.equal(game.current.rotation, 1);
  assert.equal(game.tryRotate(-1), true);
  assert.equal(game.current.rotation, 0);
});

// Line clear + scoring
test("single line clear scores 100 * level", () => {
  const game = new Game();
  game.setQueue(["I", "I", "I", "I", "I", "I"]);
  game.spawnNext();
  // Fill bottom row except columns 0-3, then lay horizontal I to complete it.
  const y = ROWS - 1;
  for (let x = 4; x < COLS; x++) game.grid[y][x] = "T";
  game.current = { kind: "I", rotation: 0, x: 0, y: y - 1 };
  const before = game.score;
  game.hardDrop();
  assert.equal(game.lines, 1);
  assert.ok(game.score >= before + 100);
});

// Hold swaps and locks until lock
test("hold works once per piece", () => {
  const game = new Game();
  game.setQueue(["S", "Z", "T", "J", "L", "I", "O"]);
  game.spawnNext(); // S
  assert.equal(game.hold(), true);
  assert.equal(game.holdKind, "S");
  assert.equal(game.hold(), false); // locked out
});

// Ghost piece rests on the floor for empty board
test("ghost piece reaches the floor", () => {
  const game = new Game();
  game.setQueue(["O", "O", "O", "O", "O", "O"]);
  game.spawnNext();
  const gy = game.ghostY();
  assert.ok(gy > game.current.y);
});

// Gravity + lock delay: piece falls and locks, spawning next
test("gravity drops and locks the piece", () => {
  const game = new Game();
  game.setQueue(["O", "O", "O", "O", "O", "O", "I"]);
  game.spawnNext();
  game.level = 15; // fast gravity so the test finishes quickly
  const kind = game.current.kind;
  for (let i = 0; i < 600; i++) game.update(16.7);
  const occupied = game.grid.flat().some((v) => v === kind);
  assert.ok(occupied, "piece should have locked into the grid");
});

// Block-out ends the game
test("blocked spawn tops out", () => {
  const game = new Game();
  game.setQueue(["I", "I", "I", "I"]);
  // Plug the spawn area.
  for (let x = 0; x < COLS; x++) {
    game.grid[0][x] = "Z";
    game.grid[1][x] = "Z";
  }
  game.spawnNext();
  assert.equal(game.status, "over");
});

// clearLines helper removes full rows
test("clearLines removes full rows", () => {
  const grid = emptyGrid();
  for (let x = 0; x < COLS; x++) grid[ROWS - 1][x] = "T";
  assert.equal(clearLines(grid), 1);
  assert.ok(grid[ROWS - 1].every((v) => v === null));
});

// Soft drop awards points
test("soft drop movement awards points", () => {
  const game = new Game();
  game.setQueue(["O", "O", "O", "O", "O", "O"]);
  game.spawnNext();
  game.softDrop = true;
  const before = game.score;
  game.tryMove(0, 1);
  assert.ok(game.score > before);
});

console.log(`\nAll ${passed} smoke tests passed.`);
