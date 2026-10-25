import test from "node:test";
import assert from "node:assert/strict";
import { TetrisGame, BOARD_HEIGHT, BOARD_WIDTH, emptyBoard, pieceCells } from "../dist/game.js";

test("creates a 10x24 board and an active piece", () => {
  const game = new TetrisGame(() => 0.5);
  assert.equal(game.board.length, BOARD_HEIGHT);
  assert.ok(game.board.every(row => row.length === BOARD_WIDTH));
  assert.equal(pieceCells(game.active).length, 4);
});

test("the 7-bag contains each tetromino once", () => {
  const game = new TetrisGame(() => 0.5);
  const firstBag = [game.active.kind, ...game.queue.slice(0, 6)];
  assert.deepEqual(new Set(firstBag), new Set(["I","J","L","O","S","T","Z"]));
});

test("hard drop locks a piece and awards two points per row", () => {
  const game = new TetrisGame(() => 0.5);
  const kind = game.active.kind;
  const distance = game.hardDrop();
  assert.ok(distance > 0);
  assert.ok(game.board.some(row => row.includes(kind)));
  assert.equal(game.score, distance * 2);
});

test("hold can only be used once before a piece locks", () => {
  const game = new TetrisGame(() => 0.5);
  const first = game.active.kind;
  assert.equal(game.hold(), true);
  assert.equal(game.holdPiece, first);
  assert.equal(game.hold(), false);
  game.hardDrop();
  assert.equal(game.hold(), true);
});

test("clears a completed line and applies Guideline single score", () => {
  const game = new TetrisGame(() => 0.5);
  game.board = emptyBoard();
  game.board[BOARD_HEIGHT - 1] = Array(BOARD_WIDTH).fill("J");
  for (let x = 3; x <= 6; x++) game.board[BOARD_HEIGHT - 1][x] = null;
  game.active = { kind:"I", rotation:0, x:4, y:BOARD_HEIGHT-1 };
  game.hardDrop();
  assert.equal(game.lines, 1);
  assert.equal(game.score, 100);
});

test("blocked spawn triggers top-out", () => {
  const game = new TetrisGame(() => 0.5);
  for (let y = 0; y < 5; y++) {
    for (let x = 2; x < 8; x++) game.board[y][x] = "Z";
  }
  game.active = { kind:"O", rotation:0, x:4, y:BOARD_HEIGHT-1 };
  game.hardDrop();
  assert.equal(game.status, "gameover");
});
