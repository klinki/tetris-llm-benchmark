import assert from 'node:assert/strict';

import { Board, BOARD_HEIGHT, BOARD_WIDTH, HIDDEN_ROWS, SPAWN_Y } from '../dist/board.js';
import { COLORS, PIECE_DEFS, PIECE_TYPES, kicksFor } from '../dist/pieces.js';
import { BagRandomizer, SequenceRandomizer, createSeededRng } from '../dist/randomizer.js';
import { Scoring, gravityIntervalMs, levelForLines } from '../dist/scoring.js';
import { Game, LOCK_DELAY_MS } from '../dist/game.js';

// Tiny dependency-free harness so `node test/smoke.test.js` is enough.
const tests = [];
const test = (name, fn) => tests.push([name, fn]);

const SEVEN = ['T', 'I', 'O', 'S', 'Z', 'J', 'L'];

// ---------------------------------------------------------------------------
// Randomizers
// ---------------------------------------------------------------------------

test('7-bag randomizer yields every tetromino exactly once per bag', () => {
  const bag = new BagRandomizer(createSeededRng(12345));
  for (let round = 0; round < 5; round += 1) {
    const drawn = [];
    for (let i = 0; i < 7; i += 1) drawn.push(bag.next());
    assert.deepEqual([...drawn].sort(), [...PIECE_TYPES].sort());
  }
});

test('sequence randomizer cycles and resets', () => {
  const seq = new SequenceRandomizer(['T', 'I', 'O']);
  assert.deepEqual([seq.next(), seq.next(), seq.next(), seq.next()], ['T', 'I', 'O', 'T']);
  seq.reset();
  assert.equal(seq.next(), 'T');
});

// ---------------------------------------------------------------------------
// Pieces / SRS
// ---------------------------------------------------------------------------

test('SRS states: four rotations with exactly four cells each', () => {
  for (const type of PIECE_TYPES) {
    const def = PIECE_DEFS[type];
    assert.equal(def.states.length, 4, `${type} has four states`);
    for (const state of def.states) {
      const cells = state.flat().filter((v) => v === 1).length;
      assert.equal(cells, 4, `${type} state has four cells`);
    }
  }
  assert.deepEqual(PIECE_DEFS.T.states[1], [[0, 1, 0], [0, 1, 1], [0, 1, 0]]);
  assert.deepEqual(PIECE_DEFS.T.states[2], [[0, 0, 0], [1, 1, 1], [0, 1, 0]]);
  assert.deepEqual(
    PIECE_DEFS.I.states[1],
    [[0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0]],
  );
});

test('the O piece never rotates (identical states)', () => {
  for (let r = 1; r < 4; r += 1) {
    assert.deepEqual(PIECE_DEFS.O.states[r], PIECE_DEFS.O.states[0]);
  }
});

test('each shape has a distinct colour', () => {
  const colors = PIECE_TYPES.map((t) => COLORS[t]);
  assert.equal(new Set(colors).size, 7);
});

test('wall-kick tables match the SRS offsets (board coordinates)', () => {
  assert.deepEqual(kicksFor('T', 0, 1), [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]]);
  assert.deepEqual(kicksFor('T', 1, 2), [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]]);
  assert.deepEqual(kicksFor('I', 0, 1), [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]]);
  assert.deepEqual(kicksFor('O', 0, 1), [[0, 0]]);
});

// ---------------------------------------------------------------------------
// Board
// ---------------------------------------------------------------------------

test('board collision: air above, solid walls and floor', () => {
  const b = new Board();
  assert.equal(b.isOccupied(3, -1), false);
  assert.equal(b.isOccupied(-1, 5), true);
  assert.equal(b.isOccupied(BOARD_WIDTH, 5), true);
  assert.equal(b.isOccupied(3, BOARD_HEIGHT), true);
  b.set(3, 5, 'T');
  assert.equal(b.isOccupied(3, 5), true);
  assert.equal(b.isEmpty(), false);
});

test('board clears full rows and drops the rows above', () => {
  const b = new Board();
  for (let x = 0; x < BOARD_WIDTH; x += 1) b.set(x, BOARD_HEIGHT - 1, 'I');
  b.set(0, BOARD_HEIGHT - 2, 'T');
  assert.equal(b.clearLines(), 1);
  assert.equal(b.cells[BOARD_HEIGHT - 1][0], 'T');
  assert.equal(b.cells[BOARD_HEIGHT - 2][0], null);
});

// ---------------------------------------------------------------------------
// Scoring / gravity
// ---------------------------------------------------------------------------

test('levels rise every ten lines; gravity accelerates with level', () => {
  assert.equal(levelForLines(0), 1);
  assert.equal(levelForLines(10), 2);
  assert.equal(levelForLines(25), 3);
  assert.ok(Math.abs(gravityIntervalMs(1) - 1000) < 1e-6);
  assert.ok(gravityIntervalMs(10) < gravityIntervalMs(1));
  assert.ok(gravityIntervalMs(20) <= 2);
});

test('Guideline line-clear scoring, combos and back-to-back', () => {
  const s = new Scoring();
  assert.equal(s.registerClear({ lines: 1, tSpin: 'none', perfectClear: false }).points, 100);
  assert.equal(s.registerClear({ lines: 1, tSpin: 'none', perfectClear: false }).points, 150); // combo x1
  assert.equal(s.score, 250);

  const b2b = new Scoring();
  assert.equal(b2b.registerClear({ lines: 4, tSpin: 'none', perfectClear: false }).points, 800);
  // Second Tetris: 800 * 1.5 (B2B) + 50 (combo x1) = 1250
  assert.equal(b2b.registerClear({ lines: 4, tSpin: 'none', perfectClear: false }).points, 1250);
});

test('T-Spin scoring table', () => {
  const s = new Scoring();
  const sum = s.registerClear({ lines: 2, tSpin: 'full', perfectClear: false });
  assert.equal(sum.points, 1200);
  assert.ok(sum.label.includes('T-SPIN'));
  assert.equal(s.registerClear({ lines: 0, tSpin: 'full', perfectClear: false }).points, 400);
});

// ---------------------------------------------------------------------------
// Game: initial state & movement
// ---------------------------------------------------------------------------

test('game starts with a full next queue, no hold and an active piece', () => {
  const g = new Game({ pieceSequence: SEVEN });
  assert.equal(g.active.type, 'T');
  assert.equal(g.nextPieces.length, 5);
  assert.equal(g.holdPiece, null);
  assert.equal(g.score, 0);
  assert.equal(g.level, 1);
  assert.equal(g.lines, 0);
  assert.equal(g.gameOver, false);
  assert.equal(g.canHoldPiece, true);
});

test('horizontal movement respects the side walls', () => {
  const g = new Game({ pieceSequence: SEVEN });
  const start = g.active.x;
  assert.equal(g.moveLeft(), true);
  assert.equal(g.active.x, start - 1);
  assert.equal(g.moveRight(), true);
  assert.equal(g.active.x, start);
  for (let i = 0; i < 12; i += 1) g.moveLeft();
  const wall = g.active.x;
  assert.equal(g.moveLeft(), false);
  assert.equal(g.active.x, wall);
});

test('SRS wall kick moves a T away from the wall on rotation', () => {
  const g = new Game({ pieceSequence: SEVEN });
  // T in state 1 with its box one column off the left edge; the default
  // rotation would push a cell out of bounds, so kick test 2 (x +1) applies.
  g.placeActive('T', 1, -1, 5);
  assert.equal(g.rotateCW(), true);
  assert.equal(g.active.rotation, 2);
  assert.equal(g.active.x, 0);
});

test('O piece does not rotate', () => {
  const g = new Game({ pieceSequence: SEVEN });
  g.placeActive('O', 0, 3, 5);
  const before = { ...g.active };
  assert.equal(g.rotateCW(), false);
  assert.deepEqual(g.active, before);
});

test('ghost piece lands on top of the stack', () => {
  const g = new Game({ pieceSequence: SEVEN });
  for (let x = 0; x < BOARD_WIDTH; x += 1) g.board.set(x, BOARD_HEIGHT - 1, 'Z');
  g.placeActive('O', 0, 3, 0);
  assert.equal(g.ghost.y, BOARD_HEIGHT - 3);
});

// ---------------------------------------------------------------------------
// Game: drops, scoring, clears
// ---------------------------------------------------------------------------

test('soft drop and hard drop award points and lock the piece', () => {
  const g = new Game({ pieceSequence: SEVEN });
  g.placeActive('T', 0, 3, 0);
  assert.equal(g.softDrop(), true);
  assert.equal(g.score, 1);
  g.hardDrop();
  assert.equal(g.score, 39); // +1 soft, +38 hard (19 rows)
  assert.equal(g.lastClear.label, '');
  assert.equal(g.active.y, SPAWN_Y); // a fresh piece spawned
});

test('a Tetris clears four lines and scores 800 x level', () => {
  const g = new Game({ pieceSequence: ['I', 'I', 'I', 'I', 'I', 'I', 'I'] });
  for (let y = BOARD_HEIGHT - 4; y < BOARD_HEIGHT; y += 1) {
    for (let x = 1; x < BOARD_WIDTH; x += 1) g.board.set(x, y, 'Z');
  }
  g.board.set(5, 10, 'S'); // avoid a perfect clear
  g.placeActive('I', 1, -2, 0); // vertical I in column 0
  g.hardDrop();
  assert.equal(g.lines, 4);
  assert.equal(g.lastClear.label, 'TETRIS');
  assert.equal(g.score, 800 + 36); // Tetris + 2 points x 18 dropped rows
});

test('ten line clears raise the level during real play', () => {
  const g = new Game({ pieceSequence: ['I', 'I', 'I', 'I', 'I', 'I', 'I'] });
  for (let n = 0; n < 10; n += 1) {
    g.board.clear();
    for (let x = 0; x < BOARD_WIDTH - 1; x += 1) g.board.set(x, BOARD_HEIGHT - 1, 'Z');
    g.placeActive('I', 1, 7, 0); // vertical I completes the last column
    g.hardDrop();
  }
  assert.equal(g.lines, 10);
  assert.equal(g.level, 2);
  assert.equal(g.gameOver, false);
});

test('T-Spin is detected with the three-corner rule', () => {
  const g = new Game({ pieceSequence: SEVEN });
  g.board.set(3, 10, 'Z');
  g.board.set(5, 10, 'Z');
  g.board.set(3, 12, 'Z');
  g.board.set(4, 13, 'Z'); // floor so the T cannot fall
  g.placeActive('T', 0, 3, 10);
  assert.equal(g.rotateCW(), true);
  assert.equal(g.active.rotation, 1);
  g.hardDrop(); // drops zero rows, so the rotation stays the last movement
  assert.equal(g.lastClear.label, 'T-SPIN');
  assert.equal(g.score, 400);
});

// ---------------------------------------------------------------------------
// Game: hold, gravity, lock delay, top-outs, restart
// ---------------------------------------------------------------------------

test('hold swaps the piece and is limited to once per piece', () => {
  const g = new Game({ pieceSequence: SEVEN });
  assert.equal(g.hold(), true);
  assert.equal(g.holdPiece, 'T');
  assert.equal(g.active.type, 'I');
  assert.equal(g.canHoldPiece, false);
  assert.equal(g.hold(), false);
  g.hardDrop();
  assert.equal(g.canHoldPiece, true);
  assert.equal(g.hold(), true);
  assert.equal(g.active.type, 'T'); // swapped back
  assert.equal(g.holdPiece, 'O');
});

test('gravity drops one row per Guideline interval at level 1', () => {
  const g = new Game({ pieceSequence: SEVEN });
  g.placeActive('T', 0, 3, 0);
  g.update(999);
  assert.equal(g.active.y, 0);
  g.update(1);
  assert.equal(g.active.y, 1);
});

test('lock delay waits ~500ms and a move refreshes it', () => {
  const a = new Game({ pieceSequence: SEVEN });
  a.placeActive('O', 0, 3, 20); // resting on the floor
  a.update(LOCK_DELAY_MS - 1);
  assert.equal(a.active.y, 20);
  a.update(1);
  assert.equal(a.board.cells[BOARD_HEIGHT - 1][4], 'O');
  assert.equal(a.active.y, SPAWN_Y);

  const b = new Game({ pieceSequence: SEVEN });
  b.placeActive('O', 0, 3, 20);
  b.update(400);
  assert.equal(b.moveLeft(), true); // resets the lock timer
  b.update(400);
  assert.equal(b.active.y, 20);
  b.update(100);
  assert.equal(b.active.y, SPAWN_Y);
});

test('lock out: a piece locking entirely above the visible field ends the game', () => {
  const g = new Game({ pieceSequence: SEVEN });
  for (let y = HIDDEN_ROWS; y < BOARD_HEIGHT; y += 1) {
    for (let x = 0; x < BOARD_WIDTH - 1; x += 1) g.board.set(x, y, 'Z');
  }
  g.placeActive('O', 0, 3, 0);
  g.hardDrop();
  assert.equal(g.gameOver, true);
});

test('block out: a blocked spawn ends the game', () => {
  const g = new Game({ pieceSequence: SEVEN });
  for (let y = HIDDEN_ROWS; y < BOARD_HEIGHT; y += 1) {
    for (let x = 0; x < BOARD_WIDTH; x += 1) g.board.set(x, y, 'Z');
  }
  assert.equal(g.hold(), true); // forces a fresh spawn into a blocked field
  assert.equal(g.gameOver, true);
});

test('restart clears the board, score and piece sequence', () => {
  const g = new Game({ pieceSequence: SEVEN });
  g.board.set(0, 5, 'Z');
  g.scoring.score = 500;
  g.gameOver = true;
  g.restart();
  assert.equal(g.score, 0);
  assert.equal(g.lines, 0);
  assert.equal(g.level, 1);
  assert.equal(g.holdPiece, null);
  assert.equal(g.gameOver, false);
  assert.equal(g.board.isEmpty(), true);
  assert.equal(g.active.type, 'T');
});

// ---------------------------------------------------------------------------

let failed = 0;
for (const [name, fn] of tests) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}
console.log(`\n${tests.length - failed}/${tests.length} smoke tests passed`);
if (failed > 0) process.exit(1);
