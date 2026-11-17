import test from 'node:test';
import assert from 'node:assert/strict';
import { cells, Game, HEIGHT } from './dist/game.js';

test('seven unique pieces per bag with five previews available', () => {
  const game = new Game(() => 0);
  assert.equal(new Set([game.active.kind, ...game.queue]).size, 7);
  game.hold();
  game.hardDrop();
  assert.ok(game.queue.length >= 5);
});

test('hold is limited to once per piece and ghost predicts hard drop', () => {
  const game = new Game(() => 0);
  const original = game.active.kind;
  game.hold();
  const current = game.active.kind;
  game.hold();
  assert.equal(game.active.kind, current);
  assert.equal(game.held, original);
  const landed = cells(game.ghost);
  game.hardDrop();
  for (const [x, y] of landed) assert.equal(game.board[y][x], current + 1);
  assert.ok(game.canHold);
});

test('gravity applies lock delay and clears completed rows', () => {
  const game = new Game(() => 0);
  game.active = { kind: 0, x: 5, y: HEIGHT - 3, turn: 0 };
  game.board.at(-1).fill(1);
  game.board.at(-1)[5] = 0;
  game.advance(1000);
  assert.equal(game.active.y, HEIGHT - 2);
  game.advance(499);
  assert.equal(game.lines, 0);
  game.advance(1);
  assert.equal(game.lines, 1);
  assert.equal(game.score, 100);
});

test('rotation can kick off a wall and a blocked spawn ends the game', () => {
  const game = new Game(() => 0);
  game.active = { kind: 0, x: 0, y: 5, turn: 0 };
  assert.ok(game.rotate(1));
  assert.equal(game.active.x, 1);
  game.board[1].fill(1);
  game.hold();
  assert.ok(game.over);
});
