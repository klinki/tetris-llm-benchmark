import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { SevenBag } from '../core/bag.js';
import { PIECE_TYPES } from '../core/pieces.js';

/** Simple seeded LCG for deterministic tests. */
function lcg(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

test('7-bag: every group of 7 consecutive pieces is a permutation of all types', () => {
  const bag = new SevenBag(lcg(42));
  const drawn: string[] = [];
  for (let i = 0; i < 700; i++) drawn.push(bag.next());
  for (let g = 0; g < 100; g++) {
    const group = new Set(drawn.slice(g * 7, g * 7 + 7));
    assert.equal(group.size, 7, `bag ${g} has duplicates: ${drawn.slice(g * 7, g * 7 + 7)}`);
    for (const t of PIECE_TYPES) assert.ok(group.has(t));
  }
});

test('7-bag: uniform distribution over many draws', () => {
  const bag = new SevenBag(lcg(7));
  const counts = new Map<string, number>();
  for (let i = 0; i < 7000; i++) {
    const t = bag.next();
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  for (const t of PIECE_TYPES) {
    assert.equal(counts.get(t), 1000);
  }
});

test('7-bag: default random source still obeys the bag rule', () => {
  const bag = new SevenBag();
  const drawn: string[] = [];
  for (let i = 0; i < 210; i++) drawn.push(bag.next());
  for (let g = 0; g < 30; g++) {
    assert.equal(new Set(drawn.slice(g * 7, g * 7 + 7)).size, 7);
  }
});
