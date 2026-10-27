import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { COLS, ROWS } from '../core/board.js';
import { Game } from '../core/game.js';
import { PIECE_TYPES, ROTATIONS, kicksFor } from '../core/pieces.js';

test('every piece has four distinct cells in each of its four states', () => {
  for (const type of PIECE_TYPES) {
    assert.equal(ROTATIONS[type].length, 4);
    for (const state of ROTATIONS[type]) {
      assert.equal(state.length, 4);
      assert.equal(new Set(state.map(([x, y]) => `${x},${y}`)).size, 4);
    }
  }
});

test('kick tables expose five tests for I/JLSTZ and none for O', () => {
  for (const type of PIECE_TYPES) {
    for (let from = 0; from < 4; from++) {
      for (const dir of [1, -1]) {
        const to = (from + dir + 4) % 4;
        const kicks = kicksFor(type, from, to);
        assert.equal(kicks.length, type === 'O' ? 1 : 5, `${type} ${from}->${to}`);
        assert.deepEqual(kicks[0], [0, 0]);
      }
    }
  }
});

/** Build a game and force the active piece to a given placement. */
function withPiece(type: (typeof PIECE_TYPES)[number], rot: number, x: number, y: number): Game {
  const g = new Game();
  g.board.reset();
  g.current = { type, rot, x, y };
  return g;
}

test('four clockwise rotations return a piece to its spawn state', () => {
  const g = withPiece('T', 0, 3, 5);
  for (let i = 0; i < 4; i++) assert.equal(g.rotate(1), true);
  assert.equal(g.current.rot, 0);
  assert.equal(g.current.x, 3);
});

test('J on the left wall kicks right when rotating counter-clockwise', () => {
  // State R at x=-1 fits against the wall; back to state 0 needs the +1 kick.
  const g = withPiece('J', 1, -1, 10);
  assert.equal(g.rotate(-1), true);
  assert.equal(g.current.rot, 0);
  assert.equal(g.current.x, 0); // kicked one cell away from the wall
});

test('I vertical on the right wall kicks left when rotating clockwise', () => {
  const g = withPiece('I', 1, 7, 5); // occupies column 9
  assert.equal(g.rotate(1), true); // 1 -> 2: kicks (-1, 0)
  assert.equal(g.current.x, 6);
  assert.equal(g.current.rot, 2);
});

test('T on the floor uses the floor kick when rotating', () => {
  // T spawn state resting on the floor; rotating CW would clip the floor,
  // so SRS kicks it one row up and one cell sideways.
  const g = withPiece('T', 0, 4, ROWS - 2);
  assert.equal(g.rotate(1), true);
  assert.equal(g.current.rot, 1);
  assert.ok(g.current.y <= ROWS - 3, 'piece was kicked above the floor');
  assert.ok(g.current.x === 3 || g.current.x === 4);
});

test('a rotation blocked by the stack fails cleanly', () => {
  // T at (3,10) in state 0 sits in a pocket: rows 9 and 12 are solid,
  // row 10 is open only at column 4, row 11 only at columns 3..5.
  // Every clockwise and counter-clockwise rotation target and kick clips
  // the surrounding walls, so the rotation must fail with no side effects.
  const g = new Game();
  g.board.reset();
  for (let x = 0; x < COLS; x++) {
    g.board.set(x, 9, 6);
    g.board.set(x, 12, 6);
    if (x !== 4) g.board.set(x, 10, 6);
    if (x < 3 || x > 5) g.board.set(x, 11, 6);
  }
  g.current = { type: 'T', rot: 0, x: 3, y: 10 };
  assert.equal(g.rotate(1), false);
  assert.equal(g.rotate(-1), false);
  assert.deepEqual(g.current, { type: 'T', rot: 0, x: 3, y: 10 });
});
