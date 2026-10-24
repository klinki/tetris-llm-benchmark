import test from 'node:test';
import assert from 'node:assert/strict';

import {
  COLS,
  HIDDEN_ROWS,
  ROWS,
  Game,
  gravityMs,
} from '../dist/game.js';
import { BagRandomizer } from '../dist/randomizer.js';
import { PIECE_TYPES, getCells } from '../dist/tetromino.js';

/** Small deterministic PRNG so tests are reproducible. */
function seededRandom(seed) {
  return () => {
    seed += 0x6d2b79f5;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function emptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function fillRows(game, rows, columns, type = 'J') {
  for (const y of rows) {
    for (const x of columns) {
      game.board[y][x] = type;
    }
  }
}

function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

test('7-bag randomizer yields every piece once per bag', () => {
  const bag = new BagRandomizer(seededRandom(1));

  for (let round = 0; round < 25; round += 1) {
    const pieces = Array.from({ length: 7 }, () => bag.next());
    assert.deepEqual([...pieces].sort(), [...PIECE_TYPES].sort());
  }
});

test('peek does not consume pieces and returns a stable queue', () => {
  const bag = new BagRandomizer(seededRandom(99));
  const preview = bag.peek(5);

  assert.equal(preview.length, 5);
  assert.deepEqual(bag.peek(5), preview);

  assert.equal(bag.next(), preview[0]);
  assert.deepEqual(bag.peek(5).slice(0, 4), preview.slice(1));
});

test('every tetromino has four cells in all four rotations', () => {
  for (const type of PIECE_TYPES) {
    for (let rotation = 0; rotation < 4; rotation += 1) {
      assert.equal(getCells(type, rotation).length, 4, `${type} ${rotation}`);
    }
  }

  // O never shifts while rotating.
  for (let rotation = 0; rotation < 4; rotation += 1) {
    assert.deepEqual(getCells('O', rotation), getCells('O', 0));
  }
});

test('Guideline gravity starts at one second per row and speeds up', () => {
  assert.equal(gravityMs(1), 1000);
  assert.ok(gravityMs(2) < gravityMs(1));

  for (let level = 2; level <= 20; level += 1) {
    assert.ok(gravityMs(level) <= gravityMs(level - 1));
    assert.ok(gravityMs(level) >= 1);
  }
});

test('piece falls with gravity', () => {
  const game = new Game(seededRandom(2));
  game.board = emptyBoard();
  game.active = { type: 'T', rotation: 0, x: 3, y: 0 };
  const startY = game.active.y;

  game.update(1000);

  assert.equal(game.active.y, startY + 1);
});

test('pieces stop at the left wall', () => {
  const game = new Game(seededRandom(3));
  game.board = emptyBoard();
  game.active = { type: 'T', rotation: 0, x: 3, y: 5 };

  while (game.move(-1)) {
    // Move until the wall stops the piece.
  }

  assert.equal(game.active.x, 0);
  assert.equal(game.move(-1), false);
});

test('SRS wall kick nudges a piece away from the wall', () => {
  const game = new Game(seededRandom(4));
  game.board = emptyBoard();
  game.active = { type: 'T', rotation: 1, x: -1, y: 10 };

  assert.equal(game.rotate(-1), true);
  assert.equal(game.active.rotation, 0);
  assert.equal(game.active.x, 0);
});

test('single line clear scores 100 points at level 1', () => {
  const game = new Game(seededRandom(5));
  game.board = emptyBoard();
  fillRows(game, [ROWS - 1], range(0, 5));
  game.active = { type: 'I', rotation: 0, x: 6, y: ROWS - 2 };

  game.hardDrop();

  assert.equal(game.lines, 1);
  assert.equal(game.score, 100);
  assert.ok(game.board[ROWS - 1].every((cell) => cell === null));
});

test('Tetris clears four lines and back-to-back awards a bonus', () => {
  const game = new Game(seededRandom(6));

  const setupTetris = () => {
    game.board = emptyBoard();
    fillRows(game, [18, 19, 20, 21], range(1, COLS - 1));
    game.active = { type: 'I', rotation: 1, x: -2, y: 18 };
  };

  setupTetris();
  game.hardDrop();
  assert.equal(game.lines, 4);
  assert.equal(game.score, 800);

  setupTetris();
  game.hardDrop();
  assert.equal(game.lines, 8);
  // 800 for the first Tetris; 1200 for the back-to-back Tetris plus 50 combo.
  assert.equal(game.score, 2050);
});

test('T-spin single uses Guideline scoring', () => {
  const game = new Game(seededRandom(13));
  game.board = emptyBoard();
  fillRows(game, [ROWS - 1], [0, 1, 2, 3, 5, 6, 7, 8, 9]);
  fillRows(game, [ROWS - 3], [3]);

  // Rotate into the notch so the last action is a rotation.
  game.active = { type: 'T', rotation: 1, x: 3, y: ROWS - 3 };
  assert.equal(game.rotate(1), true);
  assert.equal(game.active.rotation, 2);

  game.update(500);

  assert.equal(game.lines, 1);
  assert.equal(game.score, 800);
});

test('soft drop awards one point per row', () => {
  const game = new Game(seededRandom(7));
  game.board = emptyBoard();
  game.active = { type: 'T', rotation: 0, x: 3, y: 0 };
  game.softDropping = true;
  const startY = game.active.y;

  game.update(100);

  assert.equal(game.active.y, startY + 2);
  assert.equal(game.score, 2);
});

test('hold swaps once per piece and refreshes after locking', () => {
  const game = new Game(seededRandom(8));
  game.board = emptyBoard();

  const first = game.active.type;
  const upcoming = game.queue[0];

  game.hold();
  assert.equal(game.holdType, first);
  assert.equal(game.active.type, upcoming);
  assert.equal(game.canHold, false);

  const activeAfterHold = game.active.type;
  game.hold();
  assert.equal(game.active.type, activeAfterHold);
  assert.equal(game.canHold, false);

  game.hardDrop();
  assert.equal(game.canHold, true);

  game.hold();
  assert.equal(game.active.type, first);
});

test('lock delay keeps a grounded piece active for 500ms', () => {
  const game = new Game(seededRandom(9));
  game.board = emptyBoard();
  game.active = { type: 'T', rotation: 0, x: 3, y: ROWS - 2 };
  const original = game.active;

  game.update(400);
  assert.equal(game.active, original);

  game.update(200);
  assert.notEqual(game.active, original);
  assert.equal(game.gameOver, false);
});

test('ghost piece projects to the floor', () => {
  const game = new Game(seededRandom(10));
  game.board = emptyBoard();
  game.active = { type: 'I', rotation: 0, x: 3, y: -1 };

  assert.equal(game.ghostY(), ROWS - 2);
});

test('locking entirely inside the buffer ends the game', () => {
  const game = new Game(seededRandom(11));
  game.board = emptyBoard();
  fillRows(game, [HIDDEN_ROWS], range(0, COLS - 2));
  game.active = { type: 'T', rotation: 0, x: 3, y: 0 };

  game.hardDrop();

  assert.equal(game.gameOver, true);
  assert.equal(game.active, null);
});

test('restart resets score, board and game over state', () => {
  const game = new Game(seededRandom(12));
  game.score = 5000;
  game.lines = 42;
  game.level = 5;
  game.gameOver = true;
  game.active = null;

  game.restart();

  assert.equal(game.score, 0);
  assert.equal(game.lines, 0);
  assert.equal(game.level, 1);
  assert.equal(game.gameOver, false);
  assert.ok(game.active);
  assert.ok(game.board.every((row) => row.every((cell) => cell === null)));
});
