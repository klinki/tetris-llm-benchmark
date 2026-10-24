import assert from 'node:assert/strict';
import test from 'node:test';
import { getCells, TetrisGame } from '../dist/game.js';

test('the randomizer deals each tetromino once per bag', () => {
  const game = new TetrisGame(() => 0.5);
  const firstBag = [game.current.type, ...game.nextQueue.slice(0, 6)].sort();
  assert.deepEqual(firstBag, ['I', 'J', 'L', 'O', 'S', 'T', 'Z']);
});

test('hold can be used once until the active piece locks', () => {
  const game = new TetrisGame(() => 0.5);
  assert.equal(game.holdPiece(), true);
  assert.equal(game.holdPiece(), false);
  game.hardDrop();
  assert.equal(game.canHold, true);
});

test('hard drop awards points and locks the piece on the board', () => {
  const game = new TetrisGame(() => 0.5);
  const distance = game.getGhostY() - game.current.y;
  assert.equal(game.hardDrop(), distance);
  assert.equal(game.score, distance * 2);
  assert.equal(game.board.flat().filter(Boolean).length, 4);
});

test('a piece that spawns over occupied cells tops out', () => {
  const game = new TetrisGame(() => 0.5);
  const nextType = game.nextQueue[0];
  const width = nextType === 'I' || nextType === 'O' ? 4 : 3;
  const spawnX = Math.floor((10 - width) / 2);
  const visibleSpawnCell = getCells(nextType).find(([, y]) => y === 1);
  assert.ok(visibleSpawnCell);
  game.board[0][spawnX + visibleSpawnCell[0]] = 'J';
  game.current = { type: 'O', x: 0, y: 5, rotation: 0 };
  game.hardDrop();
  assert.equal(game.gameOver, true);
});
