// Headless smoke tests for the game logic (run against the compiled dist/).
import { test } from "node:test";
import assert from "node:assert/strict";
import { Bag } from "../dist/bag.js";
import { Game, HEIGHT, HIDDEN_ROWS, WIDTH, gravitySeconds } from "../dist/game.js";
import { PIECE_TYPES } from "../dist/pieces.js";

/** Small deterministic PRNG so tests are reproducible. */
function seeded(seed = 1) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

function fillRow(game, y, gaps = []) {
  for (let x = 0; x < WIDTH; x++) game.board[y * WIDTH + x] = gaps.includes(x) ? 0 : 1;
}

function newGame() {
  const game = new Game(seeded(42));
  return game;
}

test("7-bag yields every piece once per bag", () => {
  const bag = new Bag(seeded(7));
  for (let round = 0; round < 10; round++) {
    const pieces = Array.from({ length: 7 }, () => bag.next());
    assert.deepEqual([...pieces].sort(), [...PIECE_TYPES].sort());
  }
});

test("pieces spawn centred and drop one row immediately", () => {
  const game = newGame();
  const p = game.active;
  assert.equal(p.x, p.type === "O" ? 4 : 3);
  assert.equal(p.y, HIDDEN_ROWS - 1);
  assert.equal(game.nextPieces.length, 5);
});

test("gravity follows the Guideline curve", () => {
  assert.equal(gravitySeconds(1), 1);
  assert.ok(Math.abs(gravitySeconds(2) - 0.793) < 1e-9);
  const game = newGame();
  const y = game.active.y;
  game.update(999);
  assert.equal(game.active.y, y);
  game.update(2);
  assert.equal(game.active.y, y + 1);
});

test("hard drop scores 2 per cell and locks", () => {
  const game = newGame();
  game.active = { type: "O", rotation: 0, x: 4, y: 20 };
  game.hardDrop();
  assert.equal(game.score, 2 * (HEIGHT - 2 - 20));
  assert.notEqual(game.cell(4, HEIGHT - 1), 0);
  assert.notEqual(game.cell(5, HEIGHT - 2), 0);
});

test("single line clear shifts the stack down", () => {
  const game = newGame();
  fillRow(game, HEIGHT - 1, [3, 4, 5, 6]);
  game.board[(HEIGHT - 2) * WIDTH] = 1; // block above the line
  game.active = { type: "I", rotation: 0, x: 3, y: 30 };
  game.hardDrop();
  assert.equal(game.lines, 1);
  assert.equal(game.score, 100 + 2 * (HEIGHT - 2 - 30));
  assert.notEqual(game.cell(0, HEIGHT - 1), 0);
  assert.equal(game.cell(1, HEIGHT - 1), 0);
});

test("tetris scores 800 and back-to-back scores 1.5x", () => {
  const game = newGame();
  for (let y = HEIGHT - 8; y < HEIGHT; y++) fillRow(game, y, [9]);
  game.active = { type: "I", rotation: 1, x: 7, y: HEIGHT - 4 };
  game.hardDrop();
  assert.equal(game.lines, 4);
  assert.equal(game.score, 800);
  game.active = { type: "I", rotation: 1, x: 7, y: HEIGHT - 4 };
  game.hardDrop();
  assert.equal(game.lines, 8);
  // second tetris: 800 * 1.5 back-to-back + 50 combo
  assert.equal(game.score, 800 + 1200 + 50);
  assert.match(game.message, /BACK-TO-BACK TETRIS/);
});

test("SRS wall kick lets I rotate next to the wall", () => {
  const game = newGame();
  game.active = { type: "I", rotation: 1, x: -2, y: 30 }; // vertical in column 0
  assert.ok(game.rotate(1));
  assert.equal(game.active.rotation, 2);
  assert.equal(game.active.x, 0);
});

test("rotation fails when every kick is blocked", () => {
  const game = newGame();
  for (let y = 0; y < HEIGHT; y++) fillRow(game, y, [4]);
  game.active = { type: "I", rotation: 1, x: 2, y: 30 };
  assert.equal(game.rotate(1), false);
  assert.equal(game.active.rotation, 1);
});

test("T-spin double is detected and scored", () => {
  const game = newGame();
  fillRow(game, HEIGHT - 1, [4]);
  fillRow(game, HEIGHT - 2, [3, 4, 5]);
  game.board[(HEIGHT - 3) * WIDTH + 3] = 1; // overhang
  game.active = { type: "T", rotation: 1, x: 3, y: HEIGHT - 3 };
  assert.ok(game.rotate(1));
  game.hardDrop();
  assert.equal(game.lines, 2);
  assert.equal(game.score, 1200);
  assert.equal(game.message, "T-SPIN DOUBLE");
});

test("hold swaps pieces once per drop", () => {
  const game = newGame();
  const first = game.active.type;
  const second = game.nextPieces[0];
  game.hold();
  assert.equal(game.holdPiece, first);
  assert.equal(game.active.type, second);
  game.hold();
  assert.equal(game.active.type, second, "second hold is ignored");
  game.hardDrop();
  const third = game.active.type;
  game.hold();
  assert.equal(game.active.type, first);
  assert.equal(game.holdPiece, third);
});

test("lock delay is 0.5s once grounded", () => {
  const game = newGame();
  game.active = { type: "O", rotation: 0, x: 4, y: HEIGHT - 2 };
  game.update(499);
  assert.equal(game.active.y, HEIGHT - 2);
  assert.equal(game.cell(4, HEIGHT - 1), 0);
  game.update(2);
  assert.notEqual(game.cell(4, HEIGHT - 1), 0);
});

test("soft drop is 20x faster and scores 1 per cell", () => {
  const game = newGame();
  const y = game.active.y;
  game.setSoftDrop(true);
  game.update(100);
  assert.equal(game.active.y, y + 2);
  assert.equal(game.score, 2);
});

test("blocked spawn tops out and reset starts a new game", () => {
  const game = newGame();
  for (let i = 0; i < 100 && !game.gameOver; i++) game.hardDrop();
  assert.ok(game.gameOver);
  game.hardDrop(); // no-op after game over
  game.reset();
  assert.equal(game.gameOver, false);
  assert.equal(game.score, 0);
  assert.ok(game.board.every((c) => c === 0));
});
