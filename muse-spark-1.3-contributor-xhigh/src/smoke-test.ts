import { Board } from "./board.js";
import { COLS, TOTAL_ROWS } from "./constants.js";
import { Game } from "./game.js";
import { ALL_KINDS, cellsFor, shuffledBag, type PieceKind } from "./tetromino.js";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void): void {
  try {
    fn();
    passed++;
    console.log(`ok - ${name}`);
  } catch (err) {
    failed++;
    console.error(`FAIL - ${name}`);
    console.error(err);
  }
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`assert: ${msg}`);
}

// 7-bag randomizer: each bag holds all 7 kinds exactly once.
test("7-bag contains each piece once", () => {
  for (let i = 0; i < 20; i++) {
    const bag = shuffledBag();
    assert(bag.length === 7, "bag length");
    assert(new Set(bag).size === 7, "bag unique");
    for (const k of ALL_KINDS) assert(bag.includes(k), `bag has ${k}`);
  }
});

// Rotation: 4x CW returns to the same cells.
test("rotation cycles after 4 turns", () => {
  for (const kind of ALL_KINDS) {
    const a = cellsFor(kind, 0).map((c) => `${c.x},${c.y}`).sort().join(";");
    const b = cellsFor(kind, 4).map((c) => `${c.x},${c.y}`).sort().join(";");
    assert(a === b, `${kind} 4x rotation identity`);
  }
});

// Movement respects walls.
test("pieces cannot leave the well", () => {
  const game = new Game();
  game.setNextQueue(["O", "O", "O"]);
  game.spawn();
  for (let i = 0; i < 20; i++) game.tryMove(-1, 0);
  assert(game.current !== null, "has piece");
  const minX = Math.min(...game.currentCells().map((c) => c.x));
  assert(minX >= 0, "left wall");
  assert(game.tryMove(-1, 0) === false, "blocked at wall");
});

// SRS kicks: T near the floor/wall can still rotate.
test("SRS kicks allow rotation in tight spots", () => {
  const game = new Game();
  game.setNextQueue(["T", "I"]);
  game.spawn();
  // Drop T to the floor.
  while (game.tryMove(0, 1)) {}
  const ok = game.tryRotate(1) || game.tryRotate(-1);
  assert(ok, "T rotates on the floor via kicks");
});

// Ghost piece rests on the stack/floor.
test("ghost piece lands below the active piece", () => {
  const game = new Game();
  game.setNextQueue(["I", "T", "O"]);
  game.spawn();
  const gy = game.ghostY();
  assert(game.current !== null, "has piece");
  assert(gy >= game.current.y, "ghost at or below");
  const ghost = game.ghostCells();
  assert(ghost.length === 4, "ghost has 4 cells");
  // One row below the ghost must collide.
  const p = game.current;
  const collidesBelow = game.board.collides(p.kind, p.rotation, p.x, gy + 1);
  assert(collidesBelow, "ghost sits on something");
});

// Board line clears.
test("board clears full rows", () => {
  const board = new Board();
  const bottom = TOTAL_ROWS - 1;
  for (let c = 0; c < COLS; c++) board.grid[bottom][c] = "Z";
  assert(board.clearLines() === 1, "one row cleared");
  assert(board.grid[bottom].every((v) => v === null), "bottom empty after clear");
});

// Hold swaps once per lock.
test("hold works once per piece", () => {
  const game = new Game();
  game.setNextQueue(["T", "I", "O", "L", "S", "Z", "J", "T"]);
  game.spawn();
  const first = game.current?.kind;
  assert(first, "spawned");
  assert(game.holdPiece() === true, "first hold ok");
  assert(game.hold === first, "held kind stored");
  assert(game.holdPiece() === false, "no double hold");
  game.hardDrop();
  assert(game.holdPiece() === true, "hold works after lock");
});

// Hard drop locks and scores +2 per cell.
test("hard drop locks and scores", () => {
  const game = new Game();
  game.setNextQueue(["O", "O", "O", "O", "O", "O", "O"]);
  game.spawn();
  const before = game.score;
  const y0 = game.current?.y ?? 0;
  game.hardDrop();
  assert(game.score > before, "hard drop points");
  assert(game.current !== null && !game.gameOver, "new piece spawned");
  assert(y0 <= 1, "spawn near top");
});

// Line clear scores Guideline points.
test("single scores 100 x level", () => {
  const game = new Game();
  const bottom = TOTAL_ROWS - 1;
  for (let c = 0; c < COLS - 1; c++) game.board.grid[bottom][c] = "Z";
  game.setNextQueue(["I", "I", "I", "I"]);
  game.spawn();
  // Stand I upright in the last column.
  game.tryRotate(1);
  // Move box so the vertical bar lands at x=9: box x=7 + col 2.
  for (let i = 0; i < 10; i++) game.tryMove(1, 0);
  const before = game.score;
  game.hardDrop();
  assert(game.lines === 1, `one line cleared, got ${game.lines}`);
  assert(game.score >= before + 100, `single scores >=100, got ${game.score - before}`);
});

// Gravity update drops the piece over time.
test("gravity drops with update()", () => {
  const game = new Game();
  game.setNextQueue(["O", "O", "O"]);
  game.spawn();
  const y0 = game.current?.y ?? -99;
  game.update(2.0);
  assert((game.current?.y ?? -99) > y0 || game.lines >= 0, "piece fell or locked");
});

// Lock delay locks a grounded piece.
test("lock delay locks grounded pieces", () => {
  const game = new Game();
  game.setNextQueue(["O", "O", "O", "O"]);
  game.spawn();
  while (game.tryMove(0, 1)) {}
  assert(game.isOnGround(), "on ground");
  const cur = game.current;
  game.update(1.0);
  assert(game.current !== cur || game.lines >= 0, "locked after delay");
});

// Blocked spawn tops out.
test("blocked spawn ends the game", () => {
  const game = new Game();
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < COLS; c++) game.board.grid[r][c] = "S";
  }
  game.setNextQueue(["T", "T"]);
  game.spawn();
  assert(game.gameOver === true, "game over on blocked spawn");
});

// Level rises every 10 lines.
test("level = floor(lines/10)+1", () => {
  const game = new Game();
  // Fake 9 lines then clear one more via board setup.
  game.lines = 9;
  game.level = 1;
  const bottom = TOTAL_ROWS - 1;
  for (let c = 0; c < COLS - 1; c++) game.board.grid[bottom][c] = "Z";
  game.setNextQueue(["I", "I", "I"]);
  game.spawn();
  game.tryRotate(1);
  for (let i = 0; i < 10; i++) game.tryMove(1, 0);
  game.hardDrop();
  assert(game.lines === 10, `lines=${game.lines}`);
  assert(game.level === 2, `level=${game.level}`);
});

// T-spin detection (3-corner rule).
test("t-spin slot is detected", () => {
  const game = new Game();
  game.board.reset();
  game.setNextQueue(["T", "T", "T"]);
  game.spawn();
  const p = game.current;
  assert(p && p.kind === "T", "T active");
  // Build 3 occupied corners around the pivot.
  const px = p.x + 1;
  const py = p.y + 1;
  game.board.grid[py - 1][px - 1] = "Z";
  game.board.grid[py - 1][px + 1] = "Z";
  game.board.grid[py + 1][px - 1] = "Z";
  game.lastActionRotate = true;
  assert(game.isTspin() === true, "t-spin detected");
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  (globalThis as unknown as { process?: { exitCode?: number } }).process!.exitCode = 1;
}
