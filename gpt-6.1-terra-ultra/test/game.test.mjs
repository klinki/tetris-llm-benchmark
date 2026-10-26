import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, cells } from '../dist/game.js';

const emptyBoard = () => Array.from({ length: 20 }, () => Array(10).fill(null));

test('the queue draws each of the seven pieces once per bag', () => {
  const game = new Game(() => 0.5);
  const pieces = [game.active.type, ...game.next];
  const expected = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
  assert.deepEqual(pieces.slice(0, 7).sort(), expected);
  assert.deepEqual(pieces.slice(7, 14).sort(), expected);
});

test('rotation uses a wall kick when the rotated piece would cross the wall', () => {
  const game = new Game();
  game.active = { type: 'T', rotation: 1, x: -1, y: 5 };
  assert.equal(game.rotate(-1), true);
  assert.equal(game.active.rotation, 0);
  assert.equal(game.active.x, 0);
  assert.ok(cells(game.active).every(({ x }) => x >= 0));
});

test('hold is limited to once per piece and reopens after locking', () => {
  const game = new Game(() => 0.5);
  const first = game.active.type;
  game.hold();
  const second = game.active.type;
  assert.equal(game.held, first);
  assert.equal(game.canHold, false);
  game.hold();
  assert.equal(game.active.type, second);
  game.hardDrop();
  assert.equal(game.canHold, true);
  game.hold();
  assert.equal(game.active.type, first);
});

test('ghost and hard drop land on the stack and award drop points', () => {
  const game = new Game();
  game.active = { type: 'O', rotation: 0, x: 3, y: 0 };
  game.board[19][4] = 'I';
  const ghost = game.ghost();
  assert.equal(ghost.y, 17);
  assert.equal(game.active.y, 0);
  game.hardDrop();
  assert.equal(game.score, 34);
  assert.equal(game.board[18][4], 'O');
  assert.equal(game.board[19][4], 'I');
});

test('grounded pieces lock after the lock delay', () => {
  const game = new Game();
  game.active = { type: 'O', rotation: 0, x: 3, y: 18 };
  game.update(499);
  assert.equal(game.board[19][4], null);
  game.update(1);
  assert.equal(game.board[19][4], 'O');
});

test('clearing a single line scores and advances the line counter', () => {
  const game = new Game();
  game.board = emptyBoard();
  game.board[19] = Array(10).fill('J');
  game.board[19][4] = game.board[19][5] = null;
  game.board[18][0] = 'J'; // Keep the field nonempty, so this is not a perfect clear.
  game.active = { type: 'O', rotation: 0, x: 3, y: 18 };
  game.hardDrop();
  assert.equal(game.lines, 1);
  assert.equal(game.score, 100);
  assert.equal(game.board[19][0], 'J');
});

test('a piece locked entirely above the playfield ends the game; reset starts over', () => {
  const game = new Game();
  game.board[0].fill('J');
  game.active = { type: 'T', rotation: 0, x: 3, y: -2 };
  game.hardDrop();
  assert.equal(game.gameOver, true);
  game.reset();
  assert.equal(game.gameOver, false);
  assert.equal(game.score, 0);
  assert.ok(game.active);
  assert.ok(game.board.every(row => row.every(square => square === null)));
});

test('a blocked spawn ends the game', () => {
  const game = new Game();
  game.board[1][4] = 'J';
  game.active = { type: 'O', rotation: 0, x: 3, y: -1 };
  game.next[0] = 'O';
  game.hardDrop();
  assert.equal(game.gameOver, true);
  assert.equal(game.active, null);
});
