import test from "node:test";
import assert from "node:assert/strict";
import {
  ALL_PIECES,
  BOARD_HEIGHT,
  BOARD_WIDTH,
  TetrisGame,
  getGravityInterval,
} from "../dist/game.js";
test("the randomizer produces complete seven-piece bags", () => {
  const game = new TetrisGame(() => 0.37);
  const observed = [];
  for (let i = 0; i < 7; i += 1) {
    observed.push(game.getState().current.type);
    game.hardDrop();
  }
  assert.equal(observed.length, 7);
  assert.equal(new Set(observed).size, 7);
});

test("movement stays inside the board and hard drop locks a piece", () => {
  const game = new TetrisGame(() => 0.5);
  const starting = game.getState();
  for (let i = 0; i < 20; i += 1) game.move(-1);
  assert.ok(game.getState().current.x >= 0);
  const distance = game.hardDrop();
  assert.ok(distance > 0);
  assert.equal(game.getState().score, distance * 2);
  assert.equal(game.getState().board.flat().filter(Boolean).length, 4);
  assert.notEqual(game.getState().current.type, starting.current.type);
});

test("hold swaps only after the active piece locks", () => {
  const game = new TetrisGame(() => 0.1);
  const first = game.getState().current.type;
  assert.equal(game.hold(), true);
  const afterFirstHold = game.getState();
  assert.equal(afterFirstHold.hold, first);
  assert.equal(game.hold(), false);
  game.hardDrop();
  const beforeSecondHold = game.getState().current.type;
  assert.equal(game.hold(), true);
  const afterSecondHold = game.getState();
  assert.equal(afterSecondHold.current.type, first);
  assert.equal(afterSecondHold.hold, beforeSecondHold);
});

test("rotation exposes all standard four-cell orientations", () => {
  const game = new TetrisGame();
  for (const type of ALL_PIECES) {
    for (const rotation of [0, 1, 2, 3]) {
      assert.equal(game.getPieceCells(type, rotation).length, 4);
    }
  }
  assert.equal(new Set(game.getPieceCells("I", 0).map(({ x, y }) => `${x},${y}`)).size, 4);
});

test("gravity follows the guideline speed curve and pauses simulation", () => {
  const game = new TetrisGame(() => 0.8);
  assert.equal(getGravityInterval(1), 800);
  assert.equal(getGravityInterval(10), 100);
  const before = game.getState().current.y;
  game.tick(799);
  assert.equal(game.getState().current.y, before);
  game.tick(1);
  assert.equal(game.getState().current.y, before + 1);
  game.togglePause();
  const pausedY = game.getState().current.y;
  game.tick(2000);
  assert.equal(game.getState().current.y, pausedY);
});

test("board dimensions are stable for renderers", () => {
  const state = new TetrisGame().getState();
  assert.equal(state.board.length, BOARD_HEIGHT);
  assert.ok(state.board.every((row) => row.length === BOARD_WIDTH));
});

test("a completed row clears and awards line score", () => {
  const game = new TetrisGame(() => 0.5);
  const state = game.getState();
  assert.equal(state.current.type, "I");
  const board = Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null));
  const missing = new Set();
  for (let x = 0; x < BOARD_WIDTH; x += 1) board[BOARD_HEIGHT - 1][x] = "J";
  for (const point of game.getPieceCells(state.current.type, state.current.rotation)) {
    if (state.ghost.y + point.y === BOARD_HEIGHT - 1) {
      missing.add(state.ghost.x + point.x);
      board[BOARD_HEIGHT - 1][state.ghost.x + point.x] = null;
    }
  }
  assert.equal(missing.size, 4);
  game.debugSetBoard(board);
  game.hardDrop();
  assert.equal(game.getState().lines, 1);
  assert.ok(game.getState().score >= 100);
});