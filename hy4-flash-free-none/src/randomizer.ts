import { SHAPES, ShapeId } from './constants';

/**
 * A simple seedable PRNG (mulberry32) so tests can be deterministic.
 * Returns a function producing floats in [0, 1).
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function (): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 7-bag randomizer: yields each of the 7 tetrominoes exactly once per bag,
 * in a shuffled order. This guarantees the well-known Tetris distribution.
 */
export class Randomizer {
  private rng: () => number;
  private bag: ShapeId[] = [];

  constructor(seed?: number) {
    this.rng = seed === undefined ? Math.random : mulberry32(seed);
  }

  /** Fisher-Yates shuffle of the 7 shapes. */
  private refill(): void {
    this.bag = SHAPES.slice();
    for (let i = this.bag.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      const tmp = this.bag[i];
      this.bag[i] = this.bag[j];
      this.bag[j] = tmp;
    }
  }

  /** Pull the next piece from the bag. */
  next(): ShapeId {
    if (this.bag.length === 0) {
      this.refill();
    }
    return this.bag.pop()!;
  }
}
