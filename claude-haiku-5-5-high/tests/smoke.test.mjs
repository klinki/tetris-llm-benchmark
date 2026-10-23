import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game, gravityInterval } from '../dist/game/game.js';
import { Board, BOARD_HEIGHT, BOARD_WIDTH } from '../dist/game/board.js';
import { PieceSource } from '../dist/game/bag.js';
import { PIECE_TYPES } from '../dist/game/pieces.js';
import { detectTSpin } from '../dist/game/scoring.js';

const BOTTOM = BOARD_HEIGHT - 1;

function seededRandom(seed) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

test('7-bag deals every shape exactly once per bag', () => {
  const source = new PieceSource(seededRandom(1));
  for (let bag = 0; bag < 3; bag++) {
    const dealt = Array.from({ length: PIECE_TYPES.length }, () => source.next()).sort();
    assert.deepEqual(dealt, [...PIECE_TYPES].sort());
  }
});

test('pieces stop at the side walls', () => {
  const game = new Game({ sequence: ['O'] });
  for (let i = 0; i < BOARD_WIDTH; i++) game.moveHorizontal(-1);
  assert.equal(game.active.x, 0);
  for (let i = 0; i < BOARD_WIDTH; i++) game.moveHorizontal(1);
  assert.equal(game.active.x, BOARD_WIDTH - 2);
});

test('hard drop scores two points per row, locks the piece and spawns the next one', () => {
  const game = new Game({ sequence: ['O'] });
  const rows = game.ghostY - game.active.y;
  game.hardDrop();
  assert.equal(game.score, rows * 2);
  assert.equal(game.board.get(4, BOTTOM), 'O');
  assert.equal(game.board.get(5, BOTTOM), 'O');
  assert.equal(game.isOver, false);
});

test('a horizontal I piece completing the bottom row clears it and scores', () => {
  const game = new Game({ sequence: ['I'] });
  for (const x of [0, 1, 2, 7, 8, 9]) game.board.set(x, BOTTOM, 'O');
  game.hardDrop();
  assert.equal(game.lines, 1);
  assert.equal(game.board.get(0, BOTTOM), null);
  // 20 rows hard dropped (2 points each), a single at level 1 (100), and an all-clear
  // bonus (800) because the board is empty afterwards.
  assert.equal(game.score, 20 * 2 + 100 + 800);
});

test('a grounded piece locks only after the lock delay', () => {
  const game = new Game({ sequence: ['O'] });
  while (game.active.y < BOTTOM - 1) game.update(0.05);
  assert.equal(game.board.get(4, BOTTOM), null);
  game.update(0.4);
  assert.equal(game.board.get(4, BOTTOM), null);
  game.update(0.2);
  assert.equal(game.board.get(4, BOTTOM), 'O');
});

test('gravity drops one row per second at level 1', () => {
  assert.equal(gravityInterval(1), 1);
  const game = new Game({ sequence: ['O'] });
  const startY = game.active.y;
  game.update(1.01);
  assert.equal(game.active.y, startY + 1);
});

test('hold swaps once per spawned piece', () => {
  const game = new Game({ sequence: ['T', 'I', 'S'] });
  game.hold();
  assert.equal(game.heldPiece, 'T');
  assert.equal(game.active.type, 'I');
  assert.equal(game.canHold, false);

  game.hold();
  assert.equal(game.heldPiece, 'T');
  assert.equal(game.active.type, 'I');

  game.hardDrop();
  assert.equal(game.canHold, true);
  game.hold();
  assert.equal(game.heldPiece, 'S');
  assert.equal(game.active.type, 'T');
});

test('rotating against an obstacle uses an SRS wall kick', () => {
  const game = new Game({ sequence: ['I'] });
  game.rotate(1); // vertical I in column 5
  for (let i = 0; i < 4; i++) game.moveHorizontal(1); // column 9, against the right wall
  assert.equal(game.active.x, 7);
  assert.equal(game.rotate(1), true); // the unkicked horizontal I would stick out past the wall
  assert.equal(game.active.rotation, 2);
  assert.equal(game.active.x, 6);
});

test('a locked piece overlapping the spawn area ends the game, and R restarts it', () => {
  // The vertical I rests on a block at row 22, so it locks with rows 18-21 and only
  // its bottom two rows are visible. The next O cannot spawn over it.
  const game = new Game({ sequence: ['I', 'O'] });
  game.board.set(5, 22, 'Z');
  assert.equal(game.rotate(1), true);
  game.hardDrop();
  assert.equal(game.isOver, true);

  game.restart();
  assert.equal(game.isOver, false);
  assert.equal(game.board.isEmpty(), true);
});

test('T-spin detection follows the three-corner rule', () => {
  // T pointing up at (3, 37): blocks at (4,37), (3,38), (4,38), (5,38).
  // Its corners are (3,37), (5,37), (3,39) and (5,39).
  const board = new Board();
  board.set(3, 39, 'O');
  board.set(5, 39, 'O');
  board.set(5, 37, 'O');
  assert.equal(detectTSpin(board, 0, 3, 37, 0), 'mini');
  assert.equal(detectTSpin(board, 0, 3, 37, 4), 'full');

  board.set(3, 37, 'O');
  assert.equal(detectTSpin(board, 0, 3, 37, 0), 'full');
  assert.equal(detectTSpin(new Board(), 0, 3, 37, 0), 'none');
});
