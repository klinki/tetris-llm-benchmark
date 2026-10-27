import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { clearPoints, isDifficult } from '../core/scoring.js';

function points(lines: number, extra: object = {}): number {
  return clearPoints({
    lines,
    tspin: 'none',
    perfect: false,
    wasB2B: false,
    comboCount: lines > 0 ? 1 : 0,
    level: 1,
    ...extra,
  });
}

test('line clear values scale with level', () => {
  assert.equal(points(1), 100);
  assert.equal(points(2), 300);
  assert.equal(points(3), 500);
  assert.equal(points(4), 800);
  assert.equal(points(4, { level: 3 }), 2400);
  assert.equal(points(0), 0);
});

test('T-spin values', () => {
  assert.equal(points(0, { tspin: 'full' }), 400);
  assert.equal(points(1, { tspin: 'full' }), 800);
  assert.equal(points(2, { tspin: 'full' }), 1200);
  assert.equal(points(3, { tspin: 'full' }), 1600);
  assert.equal(points(0, { tspin: 'mini' }), 100);
  assert.equal(points(1, { tspin: 'mini' }), 200);
});

test('back-to-back multiplies difficult clears by 1.5', () => {
  assert.equal(points(4, { wasB2B: true }), 1200);
  assert.equal(points(2, { tspin: 'full', wasB2B: true }), 1800);
  // A single is not difficult: no multiplier even inside a chain.
  assert.equal(points(1, { wasB2B: true }), 100);
});

test('combo bonus pays 50 x (count-1) per level', () => {
  assert.equal(points(1, { comboCount: 1 }), 100);
  assert.equal(points(1, { comboCount: 2 }), 150);
  assert.equal(points(1, { comboCount: 5, level: 2 }), (100 + 4 * 50) * 2);
});

test('perfect clear bonuses replace the clear value', () => {
  assert.equal(points(2, { perfect: true }), 3000);
  assert.equal(points(1, { perfect: true }), 2000);
  assert.equal(points(4, { perfect: true, wasB2B: true }), 10000); // B2B PC tetris
});

test('difficult classification', () => {
  assert.equal(isDifficult(4, 'none'), true);
  assert.equal(isDifficult(2, 'full'), true);
  assert.equal(isDifficult(1, 'mini'), true);
  assert.equal(isDifficult(3, 'none'), false);
  assert.equal(isDifficult(0, 'full'), false); // no lines: does not touch the chain
});
