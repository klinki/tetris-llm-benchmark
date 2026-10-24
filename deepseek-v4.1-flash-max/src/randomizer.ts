import { PIECE_TYPES, type PieceType } from './pieces.js';

/** Small, fast seeded PRNG (mulberry32) used for deterministic games/tests. */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Guideline 7-bag randomizer: every bag contains each tetromino exactly once,
 * shuffled, then the bag is refilled.
 */
export class BagRandomizer {
  private bag: PieceType[] = [];

  constructor(private readonly random: () => number = Math.random) {}

  next(): PieceType {
    if (this.bag.length === 0) this.refill();
    return this.bag.pop() as PieceType;
  }

  private refill(): void {
    this.bag = [...PIECE_TYPES];
    for (let i = this.bag.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      const temporary = this.bag[i];
      this.bag[i] = this.bag[j];
      this.bag[j] = temporary;
    }
  }
}
