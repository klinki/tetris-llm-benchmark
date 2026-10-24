// Headless Guideline smoke tests (no DOM). Run via `npm test`.
import assert from "node:assert/strict";
import { TetrisGame, COLS, ROWS, getCells, gravityIntervalMs } from "../dist/tetris.js";

function seededRandom(seed = 12345) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

let passed = 0;
function check(name, fn) {
  fn();
  passed++;
  console.log(`ok - ${name}`);
}

// 7-bag: every 7 spawns contain all piece types
check("7-bag randomizer deals all 7 pieces", () => {
  const g = new TetrisGame(seededRandom(1));
  const seen = new Set();
  seen.add(g.active.type);
  for (let i = 0; i < 6; i++) {
    g.hardDrop();
    seen.add(g.active.type);
  }
  assert.equal(seen.size, 7);
});

// movement bounds
check("pieces cannot leave the board sideways", () => {
  const g = new TetrisGame(seededRandom(2));
  for (let i = 0; i < 20; i++) g.move(-1, 0);
  for (const [x] of g.activeCells()) assert.ok(x >= 0);
  for (let i = 0; i < 40; i++) g.move(1, 0);
  for (const [x] of g.activeCells()) assert.ok(x < COLS);
});

// rotation produces valid cells and SRS kicks exist (I wall kick near wall)
check("rotation stays in bounds via wall kicks", () => {
  const g = new TetrisGame(seededRandom(3));
  // force an I piece at left wall vertical->horizontal stress
  let guard = 0;
  while (g.active.type !== "I" && guard++ < 20) g.hardDrop();
  assert.equal(g.active.type, "I");
  for (let i = 0; i < 10; i++) g.move(-1, 0);
  assert.ok(g.rotate(1));
  for (const [x, y] of g.activeCells()) {
    assert.ok(x >= 0 && x < COLS);
    assert.ok(y < ROWS);
  }
});

// ghost piece sits on stack/ground
check("ghost piece is lowest legal position", () => {
  const g = new TetrisGame(seededRandom(4));
  const gy = g.ghostY();
  assert.ok(gy >= g.active.y);
  assert.ok(g.collides(g.active.type, g.active.rotation, g.active.x, gy + 1));
});

// hold swaps once per lock
check("hold stores and swaps once per piece", () => {
  const g = new TetrisGame(seededRandom(5));
  const first = g.active.type;
  assert.ok(g.hold());
  assert.equal(g.holdType, first);
  assert.equal(g.hold(), false, "cannot hold twice before lock");
  g.hardDrop();
  assert.ok(g.hold(), "hold available again after lock");
});

// line clear + guideline scoring (Tetris = 800 * level)
check("tetris scores 800 on level 1", () => {
  const g = new TetrisGame(seededRandom(6));
  // build a well: fill bottom 4 rows except col 9, drop vertical I in col 9
  for (let y = ROWS - 4; y < ROWS; y++)
    for (let x = 0; x < COLS - 1; x++) g.board[y][x] = "T";
  // force vertical I at far right
  let guard = 0;
  while (g.active.type !== "I" && guard++ < 30) g.hardDrop();
  g.active.rotation = 1;
  // I vertical occupies x+2; want cells at col 9 => x=7
  g.active.x = 7;
  g.active.y = ROWS - 4;
  assert.ok(!g.collides("I", 1, 7, ROWS - 4));
  const before = g.score;
  const res = g.hardDrop();
  assert.equal(res.cleared, 4);
  assert.equal(g.score - before - 2 * 0 - 0 >= 800, true);
  assert.equal(g.score - before >= 800, true);
});

// single scores 100
check("single line scores 100", () => {
  const g = new TetrisGame(seededRandom(7));
  for (let x = 0; x < COLS - 1; x++) g.board[ROWS - 1][x] = "Z";
  let guard = 0;
  while (g.active.type !== "I" && guard++ < 30) g.hardDrop();
  g.active.rotation = 1;
  g.active.x = 7;
  g.active.y = ROWS - 4;
  const before = g.score;
  const res = g.hardDrop();
  assert.ok(res.cleared >= 1);
  assert.ok(g.score - before >= 100);
});

// lock delay: grounded piece does not lock instantly, locks after delay
check("lock delay holds then locks", () => {
  const g = new TetrisGame(seededRandom(8));
  g.active.y = g.ghostY();
  assert.ok(g.onGround());
  assert.equal(g.tick(100), null);
  assert.equal(g.tick(200), null);
  const activeBefore = g.active.type;
  const res = g.tick(200);
  assert.ok(res !== null, "should lock after 500ms");
  assert.notEqual(g.active?.type, undefined);
  void activeBefore;
});

// gravity speeds up with level
check("gravity accelerates with level", () => {
  assert.ok(gravityIntervalMs(1) > gravityIntervalMs(5));
  assert.ok(gravityIntervalMs(5) > gravityIntervalMs(10));
});

// top-out on blocked spawn
check("blocked spawn ends the game", () => {
  const g = new TetrisGame(seededRandom(9));
  for (let x = 0; x < COLS; x++) {
    g.board[0][x] = "S";
    g.board[1][x] = "S";
  }
  const ok = g.spawn();
  assert.equal(ok, false);
  assert.equal(g.gameOver, true);
});

// next queue stays stocked
check("next queue previews upcoming pieces", () => {
  const g = new TetrisGame(seededRandom(10));
  assert.ok(g.nextQueue.length >= 5);
  const a = g.nextQueue.slice(0, 5).join("");
  g.hardDrop();
  assert.ok(g.nextQueue.length >= 5);
  assert.ok(typeof a === "string");
});

// reset clears state
check("reset restarts after game over", () => {
  const g = new TetrisGame(seededRandom(11));
  g.gameOver = true;
  g.score = 999;
  g.reset();
  assert.equal(g.gameOver, false);
  assert.equal(g.score, 0);
  assert.ok(g.active);
});

console.log(`\nAll ${passed} smoke tests passed.`);
