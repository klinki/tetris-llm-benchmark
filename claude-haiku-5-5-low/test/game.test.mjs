import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game, COLS, ROWS } from '../dist/game.js';
import { cells } from '../dist/pieces.js';
import { BagRandomizer, mulberry32 } from '../dist/random.js';

// Deals the given pieces in a repeating cycle.
const sequence = (...types) => {
  let i = 0;
  return { next: () => types[i++ % types.length] };
};

test('7-bag randomizer deals every piece once per bag', () => {
  const random = new BagRandomizer(mulberry32(42));
  for (let bag = 0; bag < 10; bag++) {
    const seen = new Set(Array.from({ length: 7 }, () => random.next()));
    assert.equal(seen.size, 7);
  }
});

test('I piece rotates clockwise into a vertical column', () => {
  assert.deepEqual(cells('I', 1).map(([x]) => x), [2, 2, 2, 2]);
});

test('hard drop lands the piece and scores 2 points per row', () => {
  const game = new Game(sequence('O'));
  game.hardDrop();
  assert.equal(game.board[21][4], 'O');
  assert.equal(game.board[20][5], 'O');
  assert.equal(game.score, 40);
});

test('ghost piece reports the landing row', () => {
  const game = new Game(sequence('O'));
  assert.equal(game.ghostY(), 20);
});

test('single line clear scores 100 at level 1, plus drop points', () => {
  const game = new Game(sequence('O'));
  for (let x = 2; x < COLS; x++) game.board[21][x] = 'L';
  for (let i = 0; i < 4; i++) game.move(-1);
  game.hardDrop();
  assert.equal(game.lines, 1);
  assert.equal(game.score, 40 + 100);
  assert.equal(game.board[21][0], 'O');
  assert.equal(game.board[21][2], null);
});

test('tetris scores 800 and starts back-to-back', () => {
  const game = new Game(sequence('I'));
  for (let y = 18; y < ROWS; y++) for (let x = 1; x < COLS; x++) game.board[y][x] = 'L';
  game.board[0][9] = 'Z'; // keeps the board from being a perfect clear
  game.rotate(1);
  for (let i = 0; i < 5; i++) game.move(-1);
  game.hardDrop();
  assert.equal(game.lines, 4);
  assert.equal(game.score, 2 * 18 + 800);
  assert.equal(game.backToBack, true);
});

test('hold swaps with the held piece once per spawn', () => {
  const game = new Game(sequence('T', 'O'));
  assert.equal(game.current.type, 'T');
  game.hold();
  assert.equal(game.held, 'T');
  assert.equal(game.current.type, 'O');
  game.hold(); // no second hold until the next piece locks
  assert.equal(game.held, 'T');
  assert.equal(game.current.type, 'O');
});

test('a piece locked entirely above the visible field ends the game', () => {
  const game = new Game(sequence('O'));
  game.board[2][4] = 'Z'; // blocks the O just above the visible field
  game.hardDrop();
  assert.equal(game.over, true);
});
