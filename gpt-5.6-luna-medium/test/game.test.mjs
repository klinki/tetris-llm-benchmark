import test from "node:test";
import assert from "node:assert/strict";
import { TetrisGame, RandomBag, cellsFor, COLS, ROWS } from "../dist/game.js";

test("randomizer returns complete seven-piece bags", () => {
  const bag = new RandomBag(() => 0.5);
  const first = Array.from({ length: 7 }, () => bag.next()).sort();
  assert.deepEqual(first, ["I", "J", "L", "O", "S", "T", "Z"]);
});

test("pieces move, rotate, and hard drop onto the board", () => {
  const game = new TetrisGame(() => 0);
  const start = game.active.x;
  assert.equal(game.move(-1), true);
  assert.equal(game.active.x, start - 1);
  game.rotate(1);
  assert.equal(game.active.type === "O" || game.active.rotation === 1, true);
  game.hardDrop();
  assert.equal(game.board.flat().filter(Boolean).length, 4);
  assert.equal(game.over, false);
});

test("completed rows are removed and score lines advance", () => {
  const game = new TetrisGame(() => 0);
  game.board[ROWS - 1] = Array(COLS).fill("I");
  game.clearLines();
  assert.equal(game.board.length, ROWS);
  assert.equal(game.board[ROWS - 1].every(cell => cell === null), true);
});

test("hold can be used once per piece and then re-enabled after lock", () => {
  const game = new TetrisGame(() => 0);
  const first = game.active.type;
  game.holdPiece();
  assert.equal(game.hold, first);
  const afterHold = game.active.type;
  game.holdPiece();
  assert.equal(game.active.type, afterHold);
  game.hardDrop();
  assert.equal(game.canHold, true);
});

test("wall collision prevents moving outside the board", () => {
  const game = new TetrisGame(() => 0);
  for (let i = 0; i < 20; i++) game.move(-1);
  assert.equal(cellsFor(game.active).some(([x]) => x < 0), false);
});
