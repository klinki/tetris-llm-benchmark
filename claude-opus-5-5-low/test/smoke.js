// Headless smoke tests for the game logic (run after `npm run build`).
import assert from "node:assert/strict";
import { Game, COLS, ROWS, gravityInterval } from "../dist/game.js";
import { Bag, PIECE_TYPES, SHAPES } from "../dist/pieces.js";

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`ok - ${name}`);
}

function seeded(seed = 1) {
  return () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
}

test("7-bag yields every piece once per bag", () => {
  const bag = new Bag(seeded(7));
  for (let b = 0; b < 5; b++) {
    const set = new Set(Array.from({ length: 7 }, () => bag.next()));
    assert.equal(set.size, 7);
  }
});

test("every rotation state has 4 cells", () => {
  for (const t of PIECE_TYPES) for (const s of SHAPES[t]) assert.equal(s.length, 4);
});

test("four rotations return to the original orientation", () => {
  const g = new Game(seeded());
  const before = { ...g.current };
  for (let i = 0; i < 4; i++) g.rotate(1);
  assert.equal(g.current.rot, before.rot);
});

test("pieces cannot move through walls", () => {
  const g = new Game(seeded());
  for (let i = 0; i < 20; i++) g.move(-1);
  assert.ok(g.cells(g.current).every(([x]) => x >= 0));
  for (let i = 0; i < 20; i++) g.move(1);
  assert.ok(g.cells(g.current).every(([x]) => x < COLS));
});

test("hard drop locks the piece at the bottom and spawns the next", () => {
  const g = new Game(seeded());
  const next = g.queue[0];
  g.hardDrop();
  assert.equal(g.current.type, next);
  assert.ok(g.board[ROWS - 1].some((c) => c !== null));
  assert.ok(g.score > 0);
});

test("clearing a line scores and removes it", () => {
  const g = new Game(seeded());
  g.board[ROWS - 1] = Array(COLS).fill("J");
  g.board[ROWS - 1][0] = null;
  g.current = { type: "I", x: -2, y: ROWS - 4, rot: 1 }; // vertical I in column 0
  assert.ok(g.fits(g.current));
  g.hardDrop();
  assert.equal(g.lines, 1);
  assert.equal(g.score, 100);
});

test("tetris scores 800 at level 1", () => {
  const g = new Game(seeded());
  for (let y = ROWS - 4; y < ROWS; y++) {
    g.board[y] = Array(COLS).fill("L");
    g.board[y][9] = null;
  }
  g.current = { type: "I", x: 7, y: ROWS - 4, rot: 1 };
  assert.ok(g.fits(g.current));
  g.hardDrop();
  assert.equal(g.lines, 4);
  assert.equal(g.score, 800);
});

test("hold swaps pieces once per drop", () => {
  const g = new Game(seeded());
  const first = g.current.type;
  g.holdPiece();
  assert.equal(g.hold, first);
  const second = g.current.type;
  g.holdPiece();
  assert.equal(g.current.type, second, "second hold is ignored");
});

test("gravity and lock delay eventually lock the piece", () => {
  const g = new Game(seeded());
  const first = g.current;
  for (let i = 0; i < 2000 && g.current === first; i++) g.update(16);
  assert.notEqual(g.current, first);
});

test("gravity speeds up with level", () => {
  assert.ok(gravityInterval(1) === 1000);
  assert.ok(gravityInterval(10) < gravityInterval(5));
});

test("game over when the stack reaches the spawn area", () => {
  const g = new Game(seeded());
  for (let i = 0; i < 100 && !g.gameOver; i++) g.hardDrop();
  assert.ok(g.gameOver);
  g.reset();
  assert.ok(!g.gameOver);
});

console.log(`\n${passed} tests passed`);
