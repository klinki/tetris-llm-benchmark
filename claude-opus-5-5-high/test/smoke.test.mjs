// Headless smoke tests for the game logic. Run with `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";

import { Bag } from "../dist/bag.js";
import { BOARD_HEIGHT, BOARD_WIDTH, VISIBLE_TOP } from "../dist/board.js";
import { Game, LOCK_DELAY_MS, gravityInterval } from "../dist/game.js";
import { PIECE_TYPES } from "../dist/pieces.js";

const BOTTOM = BOARD_HEIGHT - 1;

/** Deterministic PRNG (mulberry32). */
function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function newGame() {
  return new Game({ random: seeded(42) });
}

/** Fill a row completely, except for the given columns. */
function fillRow(game, y, except = []) {
  for (let x = 0; x < BOARD_WIDTH; x++) if (!except.includes(x)) game.board.set(x, y, "O");
}

function place(game, type, x, y, rotation = 0) {
  game.active = { type, x, y, rotation };
}

test("7-bag yields every piece exactly once per bag", () => {
  const bag = new Bag(seeded(1));
  for (let round = 0; round < 10; round++) {
    const pieces = Array.from({ length: 7 }, () => bag.next());
    assert.deepEqual([...pieces].sort(), [...PIECE_TYPES].sort());
  }
});

test("pieces spawn above the field and drop one row immediately", () => {
  const game = newGame();
  const { type, x, y } = game.active;
  assert.equal(x, type === "O" ? 4 : 3);
  assert.equal(y, VISIBLE_TOP - (type === "I" ? 3 : 2) + 1);
  assert.equal(game.nextQueue.length, 5);
});

test("pieces stop at the walls", () => {
  const game = newGame();
  place(game, "T", 3, 30);
  let moves = 0;
  while (game.moveLeft()) moves++;
  assert.equal(moves, 3);
  assert.equal(game.active.x, 0);
  while (game.moveRight()) moves++;
  assert.equal(game.active.x, BOARD_WIDTH - 3);
});

test("SRS wall kick moves a T off the left wall", () => {
  const game = newGame();
  // T in the "left" state hugging the wall: its box column 0 is outside the field.
  place(game, "T", -1, 30, 1);
  assert.ok(game.rotateCCW());
  assert.equal(game.active.rotation, 0);
  assert.equal(game.active.x, 0); // kicked one column right
});

test("SRS I-piece kick against the right wall", () => {
  const game = newGame();
  place(game, "I", 7, 30, 1); // vertical I in the last column
  assert.ok(game.rotateCW());
  assert.equal(game.active.rotation, 2);
  assert.equal(game.active.x, 6); // kicked left so the bar fits
});

test("hard drop scores 2 points per cell and locks the piece", () => {
  const game = newGame();
  place(game, "O", 4, 30);
  game.hardDrop();
  assert.equal(game.score, (BOTTOM - 1 - 30) * 2);
  assert.equal(game.board.get(4, BOTTOM), "O");
  assert.equal(game.board.get(5, BOTTOM - 1), "O");
  assert.ok(game.active, "next piece spawned");
});

test("single line clear and tetris scoring with back-to-back", () => {
  const game = newGame();
  fillRow(game, BOTTOM, [3, 4, 5, 6]);
  place(game, "I", 3, BOTTOM - 1); // flat I, cells on row y + 1
  game.hardDrop();
  assert.equal(game.lines, 1);
  assert.equal(game.score, 100);
  assert.ok(game.board.isEmpty());

  for (const tetris of [1, 2]) {
    const before = game.score;
    for (let y = BOTTOM - 3; y <= BOTTOM; y++) fillRow(game, y, [9]);
    place(game, "I", 7, BOTTOM - 3, 1); // vertical I in column 9
    game.hardDrop();
    const gained = game.score - before;
    // First tetris: 800. Second: 800 * 1.5 back-to-back, plus a 50-point combo.
    assert.equal(gained, tetris === 1 ? 800 + 50 : 1200 + 100);
    assert.equal(game.lastClear.backToBack, tetris === 2);
  }
  assert.equal(game.lines, 9);
});

test("T-Spin Double is detected and scored", () => {
  const game = newGame();
  fillRow(game, BOTTOM, [4]);
  fillRow(game, BOTTOM - 1, [3, 4, 5]);
  game.board.set(5, BOTTOM - 2, "O"); // overhang
  place(game, "T", 3, BOTTOM - 2, 1);
  assert.ok(game.rotateCW());
  game.hardDrop();
  assert.equal(game.lastClear.tSpin, "full");
  assert.equal(game.lastClear.lines, 2);
  assert.equal(game.score, 1200);
});

test("hold swaps once per piece", () => {
  const game = newGame();
  const first = game.active.type;
  const next = game.nextQueue[0];
  game.hold();
  assert.equal(game.held, first);
  assert.equal(game.active.type, next);
  game.hold(); // ignored until the piece locks
  assert.equal(game.held, first);
  game.hardDrop();
  assert.ok(game.canHold);
  game.hold();
  assert.equal(game.active.type, first);
});

test("lock delay waits 0.5s on the ground and resets on movement", () => {
  const game = newGame();
  place(game, "T", 3, BOTTOM - 1);
  game.update(LOCK_DELAY_MS - 100);
  assert.equal(game.active.y, BOTTOM - 1, "still the same piece");
  game.moveLeft(); // resets the lock timer
  game.update(LOCK_DELAY_MS - 100);
  assert.equal(game.active.y, BOTTOM - 1);
  game.update(150);
  assert.notEqual(game.active.y, BOTTOM - 1, "locked and a new piece spawned");
  assert.equal(game.board.get(3, BOTTOM), "T");
});

test("gravity follows the guideline curve", () => {
  assert.equal(gravityInterval(1), 1000);
  assert.ok(Math.abs(gravityInterval(2) - 793) < 1);
  const game = newGame();
  const y = game.active.y;
  game.update(1000);
  assert.equal(game.active.y, y + 1);
});

test("top out when the spawn area is blocked, and restart", () => {
  const game = newGame();
  fillRow(game, VISIBLE_TOP - 2);
  game.hold(); // spawns a new piece into the blocked area
  assert.equal(game.status, "over");
  game.hardDrop(); // no-op once the game is over
  game.reset();
  assert.equal(game.status, "playing");
  assert.equal(game.score, 0);
  assert.ok(game.board.isEmpty());
});
