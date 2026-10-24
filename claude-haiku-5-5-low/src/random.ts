import { PIECE_TYPES, type PieceType } from './pieces.js';

export interface Randomizer {
  next(): PieceType;
}

/** 7-bag randomizer: shuffles all seven pieces, deals them out, then refills. */
export class BagRandomizer implements Randomizer {
  private bag: PieceType[] = [];

  constructor(private readonly rng: () => number = Math.random) {}

  next(): PieceType {
    if (this.bag.length === 0) this.refill();
    return this.bag.pop() as PieceType;
  }

  private refill(): void {
    const bag = [...PIECE_TYPES];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    this.bag = bag;
  }
}

/** Small seeded PRNG (mulberry32), so games and tests can be made deterministic. */
export function mulberry32(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
