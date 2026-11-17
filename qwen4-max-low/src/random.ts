// 7-bag randomizer: deals all seven tetrominoes in a shuffled order,
// then reshuffles a fresh bag. Guarantees no piece droughts longer than 12.
import type { PieceType } from "./types.js";
import { PIECE_TYPES } from "./pieces.js";

export type Rng = () => number;

/** Deterministic PRNG (mulberry32) for reproducible tests. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Bag {
  private queue: PieceType[] = [];

  constructor(private readonly rng: Rng = Math.random) {}

  /** Draw the next piece, refilling the bag when it runs dry. */
  next(): PieceType {
    if (this.queue.length === 0) this.refill();
    return this.queue.shift()!;
  }

  /** Peek at upcoming pieces without consuming them (for the next queue). */
  preview(count: number): PieceType[] {
    while (this.queue.length < count) this.refill();
    return this.queue.slice(0, count);
  }

  private refill(): void {
    const bag = [...PIECE_TYPES];
    // Fisher-Yates shuffle.
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    this.queue.push(...bag);
  }
}
