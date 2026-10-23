/**
 * Guideline randomizer: a shuffled bag of all seven pieces. Drawing from a
 * bag guarantees that every piece shows up once before any piece repeats.
 */

import { PIECE_ORDER } from './tetromino.js';
import type { PieceType } from './types.js';

export type Random = () => number;

/** Small deterministic PRNG, used by the tests. */
export function mulberry32(seed: number): Random {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class SevenBagRandomizer {
  private bag: PieceType[] = [];

  constructor(private readonly random: Random = Math.random) {}

  next(): PieceType {
    if (this.bag.length === 0) this.refill();
    // The bag is always full at this point.
    return this.bag.pop() as PieceType;
  }

  private refill(): void {
    const bag = [...PIECE_ORDER];
    for (let i = bag.length - 1; i > 0; i -= 1) {
      const j = Math.floor(this.random() * (i + 1));
      const swap = bag[i] as PieceType;
      bag[i] = bag[j] as PieceType;
      bag[j] = swap;
    }
    this.bag = bag;
  }
}