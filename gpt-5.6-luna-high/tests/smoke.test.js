import assert from 'node:assert/strict';
import { Board, TetrisGame, createBag, getCells, getGravityInterval } from '../dist/src/game.js';

const types = new Set(['I', 'J', 'L', 'O', 'S', 'T', 'Z']);
const bag = createBag(() => 0.25);
assert.equal(bag.length, 7);
assert.equal(new Set(bag).size, 7, 'a bag contains each tetromino exactly once');
assert.ok(bag.every((piece) => types.has(piece)));

const board = new Board();
board.cells[21] = Array(10).fill('I');
assert.equal(board.clearLines(), 1);
assert.ok(board.cells[0].every((cell) => cell === null));

for (const type of types) {
  assert.equal(getCells(type, 0).length, 4, `${type} has four blocks`);
  assert.equal(getCells(type, 1).length, 4, `${type} rotates to four blocks`);
}
assert.ok(getGravityInterval(1) > getGravityInterval(10));

const game = new TetrisGame(() => 0.1);
assert.ok(game.active, 'game spawns a piece');
assert.ok(game.queue.length >= 5);
const first = game.active.type;
assert.equal(game.holdPiece(), true);
assert.equal(game.hold, first);
assert.equal(game.holdPiece(), false, 'hold can only be used once per piece');
const before = game.score;
game.hardDrop();
assert.ok(game.score > before, 'hard drop awards points');
assert.notEqual(game.active, null, 'a new piece spawns after locking');

console.log('Smoke tests passed.');
