import test from 'node:test';
import assert from 'node:assert/strict';
import * as game from '../dist/game.js';

test('seven bag contains each piece exactly once', () => {
  const bag = game.sevenBag(() => 0.5);
  assert.equal(bag.length, 7);
  assert.deepEqual([...bag].sort(), ['I', 'J', 'L', 'O', 'S', 'T', 'Z']);
});

test('rotation, collision, and line clearing work', () => {
  const board = game.createBoard();
  const piece = game.makePiece('T');
  assert.equal(game.collides(board, piece), false);
  assert.equal(game.tryRotate(board, piece), true);
  assert.equal(piece.rotation, 1);
  for (let x = 0; x < game.COLS; x++) board[game.ROWS - 1][x] = 'I';
  assert.equal(game.clearLines(board), 1);
  assert.ok(board[game.ROWS - 1].every(cell => cell === null));
});
