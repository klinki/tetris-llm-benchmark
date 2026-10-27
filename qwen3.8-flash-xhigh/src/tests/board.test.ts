import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { Board, COLS, ROWS } from '../core/board.js';
import { ROTATIONS } from '../core/pieces.js';

test('walls and floor are solid, the buffer above the field is open', () => {
  const b = new Board();
  assert.equal(b.solidAt(-1, 5), true);
  assert.equal(b.solidAt(COLS, 5), true);
  assert.equal(b.solidAt(0, ROWS), true);
  assert.equal(b.solidAt(0, -3), false);
  assert.equal(b.solidAt(0, 0), false);
});

test('overlaps detects stack cells', () => {
  const b = new Board();
  const oCells = ROTATIONS.O[0]; // always 2x2
  assert.equal(b.overlaps(oCells, 0, 0), false);
  b.set(1, 1, 2);
  assert.equal(b.overlaps(oCells, 0, 0), true); // O box 0,0 covers (1,1)
  assert.equal(b.overlaps(oCells, 0, 2), false); // moved below the block
});

test('full rows clear and the stack shifts down', () => {
  const b = new Board();
  b.set(0, ROWS - 2, 1); // marker one row above the floor row
  for (let x = 0; x < COLS; x++) b.set(x, ROWS - 1, 5); // full bottom row
  const cleared = b.clearFullRows();
  assert.equal(cleared, 1);
  assert.equal(b.get(0, ROWS - 1), 1); // marker fell to the floor
  assert.ok(b.isEmpty() === false);
  for (let x = 0; x < COLS; x++) b.set(x, ROWS - 1, 5);
  assert.equal(b.clearFullRows(), 1);
  assert.equal(b.isEmpty(), true);
});

test('multiple full rows clear at once', () => {
  const b = new Board();
  for (let y = ROWS - 4; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) b.set(x, y, 3);
  }
  assert.equal(b.clearFullRows(), 4);
  assert.equal(b.isEmpty(), true);
});
