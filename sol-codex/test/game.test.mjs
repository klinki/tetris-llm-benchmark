import test from "node:test";
import assert from "node:assert/strict";
import { TetrisGame, emptyBoard, cells, ROWS } from "../dist/game.js";

test("7-bag contains every tetromino exactly once", () => {
  const game = new TetrisGame(() => 0.42);
  const bag = [game.active.name, ...game.queue.slice(0, 6)];
  assert.deepEqual([...bag].sort(), ["I","J","L","O","S","T","Z"]);
});

test("hard drop locks a piece and awards two points per row", () => {
  const game = new TetrisGame(() => 0);
  const start = game.active.name;
  game.hardDrop();
  assert.ok(game.board.some(row => row.includes(start)));
  assert.ok(game.score > 0);
});

test("a complete row clears and scores a single", () => {
  const game = new TetrisGame(() => 0);
  game.board = emptyBoard();
  game.board[ROWS - 1].fill("J");
  assert.equal(game.clearLines(), 1);
  assert.ok(game.board[0].every(cell => cell === null));
});

test("hold may only be used once before locking", () => {
  const game = new TetrisGame(() => 0);
  const first = game.active.name;
  game.hold();
  const second = game.active.name;
  game.hold();
  assert.equal(game.active.name, second);
  assert.equal(game.held, first);
});

test("rotation uses wall kicks instead of leaving the board", () => {
  const game = new TetrisGame(() => 0);
  game.active = { name: "T", x: -1, y: 4, rotation: 1 };
  assert.equal(game.valid(game.active), true);
  assert.equal(game.rotate(1), true);
  assert.ok(cells(game.active).every(([x]) => x >= 0));
});

test("blocked spawn causes top out", () => {
  const game = new TetrisGame(() => 0);
  for (const row of [0, 1]) for (const column of [3, 4, 5, 6]) game.board[row][column] = "Z";
  game.hardDrop();
  assert.equal(game.over, true);
});
