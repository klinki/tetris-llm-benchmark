import test from "node:test";
import assert from "node:assert/strict";

import { BOARD_HEIGHT, BOARD_WIDTH, Board } from "../src/board.js";
import { Game, gravityIntervalMs, LOCK_DELAY_MS, NEXT_QUEUE_SIZE } from "../src/game.js";
import { PIECE_TYPES } from "../src/pieces.js";
import { Bag } from "../src/random.js";

/** Deterministic PRNG so failures are reproducible. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

test("bag randomizer deals all seven pieces before repeating", () => {
  const bag = new Bag(mulberry32(42));
  const first = Array.from({ length: 7 }, () => bag.next());
  const second = Array.from({ length: 7 }, () => bag.next());
  assert.equal(new Set(first).size, 7);
  assert.equal(new Set(second).size, 7);
  for (const type of PIECE_TYPES) assert.ok(first.includes(type));
});

test("new game spawns a piece and buffers the next queue", () => {
  const game = new Game(mulberry32(1));
  assert.ok(game.current);
  assert.equal(game.nextQueue.length, NEXT_QUEUE_SIZE);
  assert.equal(game.gameOver, false);
  assert.equal(game.score, 0);
  assert.equal(game.level, 1);
});

test("gravity follows the Guideline curve", () => {
  assert.equal(gravityIntervalMs(1), 1000);
  assert.ok(Math.abs(gravityIntervalMs(2) - 793) < 1);
  assert.ok(gravityIntervalMs(10) < gravityIntervalMs(9));
});

test("board.clearLines removes full rows and shifts the stack down", () => {
  const board = new Board();
  for (let c = 0; c < BOARD_WIDTH; c++) board.cells[21 * BOARD_WIDTH + c] = 3;
  board.cells[20 * BOARD_WIDTH] = 3;
  assert.equal(board.clearLines(), 1);
  assert.equal(board.cells[21 * BOARD_WIDTH], 3); // lone cell slid to the floor
  assert.equal(board.cells[20 * BOARD_WIDTH], 0);
});

test("hard drop locks the piece and spawns the next one", () => {
  const game = new Game(mulberry32(2));
  game.hardDrop();
  assert.ok(game.board.cells.some((v) => v !== 0), "board should hold the locked piece");
  assert.ok(game.current, "a new piece should spawn");
  assert.equal(game.canHold, true);
  assert.equal(game.gameOver, false);
});

test("tetris clear awards 800 x level", () => {
  const game = new Game(mulberry32(3));
  // Fill the bottom four rows except column 0.
  for (let r = 18; r <= 21; r++) {
    for (let c = 1; c < BOARD_WIDTH; c++) game.board.cells[r * BOARD_WIDTH + c] = 1;
  }
  // Vertical I (rotation 1 keeps its cells in matrix column 2) parked over column 0.
  game.current = { type: "I", rot: 1, row: 18, col: -2 };
  game.hardDrop();
  assert.equal(game.score, 800);
  assert.equal(game.lines, 4);
  assert.equal(game.board.cells.some((v) => v !== 0), false);
  assert.equal(game.lastClear!.text, "TETRIS");
});

test("SRS wall kick pushes the I piece away from the left wall", () => {
  const game = new Game(mulberry32(4));
  // Vertical I flush against the left wall; rotating to flat needs the +2x kick.
  game.current = { type: "I", rot: 1, row: 5, col: -2 };
  assert.equal(game.rotate(-1), true);
  assert.equal(game.current!.rot, 0);
  assert.equal(game.current!.col, 0);
  assert.equal(game.current!.row, 5);
});

test("hold swaps pieces once and recharges after a lock", () => {
  const game = new Game(mulberry32(5));
  const first = game.current!.type;
  game.holdPiece();
  assert.equal(game.hold, first);
  assert.equal(game.canHold, false);
  const second = game.current!.type;
  game.holdPiece(); // ignored until the piece locks
  assert.equal(game.current!.type, second);
  assert.equal(game.hold, first);
  game.hardDrop();
  assert.equal(game.canHold, true);
  const third = game.current!.type;
  game.holdPiece();
  assert.equal(game.current!.type, first);
  assert.equal(game.hold, third);
});

test("ghost drop position is the lowest free row", () => {
  const game = new Game(mulberry32(7));
  game.current = { type: "O", rot: 0, row: 0, col: 4 };
  assert.equal(game.dropPosition(), BOARD_HEIGHT - 2);
});

test("soft drop falls faster and scores one point per cell", () => {
  const game = new Game(mulberry32(8));
  const startRow = game.current!.row;
  game.softDropHeld = true;
  game.update(200); // level 1 soft interval = 1000/20 = 50ms -> 4 cells
  assert.equal(game.current!.row, startRow + 4);
  assert.equal(game.score, 4);
});

test("piece locks only after the lock delay expires", () => {
  const game = new Game(mulberry32(9));
  game.current = { type: "O", rot: 0, row: BOARD_HEIGHT - 2, col: 4 };
  game.update(LOCK_DELAY_MS - 100);
  assert.equal(game.current!.type, "O"); // still the same piece
  assert.equal(game.current!.row, BOARD_HEIGHT - 2);
  game.update(200);
  assert.equal(game.board.cells[(BOARD_HEIGHT - 2) * BOARD_WIDTH + 4] !== 0, true);
  assert.ok(game.current, "next piece should have spawned");
});

test("T-spin double is detected and awards 1200", () => {
  const game = new Game(mulberry32(10));
  const W = BOARD_WIDTH;
  // Row 21: full except the nub hole at column 4.
  // Row 20: full except the T slot at columns 3-5.
  // Row 19: overhang at column 3 so three corners are occupied.
  for (let c = 0; c < W; c++) {
    if (c !== 4) game.board.cells[21 * W + c] = 1;
    if (c < 3 || c > 5) game.board.cells[20 * W + c] = 1;
  }
  game.board.cells[19 * W + 3] = 1;
  game.current = { type: "T", rot: 0, row: 19, col: 3 };
  assert.equal(game.rotate(1), true);
  assert.equal(game.rotate(1), true);
  assert.equal(game.current!.rot, 2);
  game.update(LOCK_DELAY_MS + 100);
  assert.equal(game.lines, 2);
  assert.equal(game.score, 1200);
  assert.match(game.lastClear!.text, /T-SPIN DOUBLE/);
});

test("locking above the visible field ends the game", () => {
  const game = new Game(mulberry32(11));
  for (let r = 2; r < BOARD_HEIGHT; r++) {
    for (let c = 0; c < BOARD_WIDTH; c++) game.board.cells[r * BOARD_WIDTH + c] = 1;
  }
  game.current = { type: "O", rot: 0, row: 0, col: 4 };
  game.hardDrop(); // locks inside the hidden rows: lock out
  assert.equal(game.gameOver, true);
  game.restart();
  assert.equal(game.gameOver, false);
  assert.equal(game.score, 0);
  assert.equal(game.lines, 0);
  assert.ok(game.current);
  assert.equal(game.board.cells.some((v) => v !== 0), false);
});
