/**
 * Headless logic smoke tests: they load the compiled modules from dist/
 * (which is why `npm test` builds first) and never touch the DOM.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { Board } from '../dist/board.js';
import { Bag } from '../dist/bag.js';
import { STATES, kicksFor, KINDS } from '../dist/pieces.js';
import { Game, gravityIntervalMs, LOCK_DELAY_MS } from '../dist/game.js';

const sorted = (cells) =>
  JSON.stringify(cells.map(([x, y]) => `${x},${y}`).sort());

test('7-bag draws all seven kinds exactly once per bag', () => {
  const bag = new Bag();
  const drawn = Array.from({ length: 7 }, () => bag.next());
  assert.deepEqual([...drawn].sort(), [...KINDS].sort());
  assert.equal(new Set(drawn).size, 7);
});

test('spawn states match the Guideline shapes', () => {
  assert.equal(sorted(STATES.T[0]), sorted([[1, 0], [0, 1], [1, 1], [2, 1]]));
  assert.equal(sorted(STATES.T[1]), sorted([[1, 0], [2, 1], [1, 1], [1, 2]])); // pointing right
  assert.equal(sorted(STATES.T[3]), sorted([[1, 2], [0, 1], [1, 1], [1, 0]])); // pointing left
  assert.equal(sorted(STATES.I[0]), sorted([[0, 1], [1, 1], [2, 1], [3, 1]]));
  assert.equal(sorted(STATES.O[1]), sorted(STATES.O[0])); // O rotation is a no-op
});

test('SRS wall kick tables', () => {
  assert.deepEqual(kicksFor('T', 0, 1), [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]]);
  assert.deepEqual(kicksFor('I', 2, 3), [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]]);
  assert.deepEqual(kicksFor('O', 0, 1), [[0, 0]]); // O never kicks
});

test('board collision, wall kicks and line clears', () => {
  const board = new Board();
  assert.equal(board.collides(STATES.T[0], 3, 5), false);
  assert.equal(board.collides(STATES.T[0], -1, 5), true);
  assert.equal(board.collides(STATES.T[0], 3, 19), true); // floor overflow

  // lock an I piece into the only gap in the bottom row
  const bottom = board.grid[19];
  for (let x = 0; x < 3; x++) bottom[x] = 'L';
  for (let x = 7; x < 10; x++) bottom[x] = 'J';
  const cleared = board.lock(STATES.I[0], 3, 18, 'I');
  assert.equal(cleared, 1);
  assert.equal(board.cellAt(0, 19), null); // cleared rows collapse
  assert.equal(board.cellAt(0, 18), null);
});

test('gravity interval follows the guideline curve', () => {
  assert.ok(Math.abs(gravityIntervalMs(1) - 1000) < 1e-6);
  assert.ok(Math.abs(gravityIntervalMs(2) - 793) < 1e-6);
  assert.ok(gravityIntervalMs(10) < gravityIntervalMs(5));
  assert.ok(gravityIntervalMs(10) < 100);
});

test('a piece falls one cell per gravity interval', () => {
  const game = new Game();
  const y0 = game.piece.y;
  game.update(gravityIntervalMs(1) + 1);
  assert.equal(game.piece.y, y0 + 1);
  game.update(gravityIntervalMs(1) + 1);
  assert.equal(game.piece.y, y0 + 2);
});

test('hard drop scores 2 per cell fallen', () => {
  const game = new Game();
  game.hardDrop();
  // every kind spawns with its lowest cell on the skyline (y = 0) and lands on row 19
  assert.equal(game.score, 2 * 19);
  assert.equal(game.lines, 0);
});

test('single line clear scores 100 x level', () => {
  const board = new Board();
  // leave exactly a 4-wide gap for an I piece
  for (let x = 0; x < 3; x++) board.grid[19][x] = 'L';
  for (let x = 7; x < 10; x++) board.grid[19][x] = 'J';
  const game = new Game(board, ['I']);
  assert.equal(game.piece.kind, 'I');
  game.hardDrop(); // 2 * 19 for the drop, then 100 * 1 for the line
  assert.equal(game.score, 2 * 19 + 100);
  assert.equal(game.lines, 1);
  assert.equal(game.level, 1);
});

test('T-spin is detected by the 3-corner rule and scores without lines', () => {
  const board = new Board();
  board.grid[18][0] = 'L'; // bottom corners occupied
  board.grid[18][2] = 'L';
  board.grid[16][2] = 'L'; // one back corner occupied; (0,16) stays free
  const game = new Game(board);
  game.piece = { kind: 'T', x: 0, y: 16, rot: 0 }; // directly on the stack
  game.lastActionRotation = true;
  game.hardDrop();
  assert.equal(game.lines, 0);
  assert.equal(game.score, 400); // T-spin with no lines: 400 x level
  // a plain landing (no prior rotation) must not score a T-spin
  const game2 = new Game(board);
  game2.piece = { kind: 'T', x: 0, y: 16, rot: 0 };
  game2.lastActionRotation = false;
  game2.hardDrop();
  assert.equal(game2.score, 0);
});

test('hold swaps once per piece', () => {
  const game = new Game(new Board(), ['I']);
  const held = game.piece.kind;
  game.hold();
  assert.equal(game.holdKind, held);
  assert.ok(KINDS.includes(game.piece.kind)); // replaced by the next piece from the bag
  assert.equal(game.canHold, false);
  const piece = { ...game.piece };
  game.hold();
  assert.deepEqual(game.piece, piece); // second hold within the same piece is refused
  game.hardDrop(); // locks and re-enables the hold for the next piece
  assert.equal(game.canHold, true);
});

test('lock delay locks a grounded piece after 500ms', () => {
  const board = new Board();
  board.grid[19].fill('L');
  const game = new Game(board);
  game.piece = { kind: 'T', x: 0, y: 17, rot: 0 };
  game.update(LOCK_DELAY_MS - 100);
  assert.equal(game.piece.kind, 'T'); // resting on the stack, not yet locked
  game.update(LOCK_DELAY_MS + 100);
  assert.equal(game.piece.y, -1); // locked, and the next piece spawned above the skyline
});

test('moves while grounded use up the limited lock resets', () => {
  const board = new Board();
  board.grid[19].fill('L');
  const game = new Game(board);
  game.piece = { kind: 'T', x: 0, y: 17, rot: 0 };
  const side = 300;
  let lastPiece = JSON.stringify(game.piece);
  for (let i = 0; i < 30; i++) {
    game.move(1);
    game.move(-1);
    game.update(side);
  }
  // with resets exhausted the piece must have locked rather than survived 30 * 300ms
  assert.notEqual(JSON.stringify(game.piece), lastPiece);
});

test('blocked spawn tops out', () => {
  const board = new Board();
  board.grid[0].fill('L');
  const game = new Game(board);
  assert.equal(game.over, true);
});

test('restart after game over starts a fresh game', () => {
  const board = new Board();
  board.grid[0].fill('L');
  const game = new Game(board);
  assert.equal(game.over, true);
  game.restart();
  assert.equal(game.over, false);
  assert.equal(game.score, 0);
  assert.equal(game.lines, 0);
  assert.ok(game.board.grid[0].every((c) => c === null));
});
