/** Seeded pseudo random generator, handy for tests and replays. */

import { PIECE_TYPES } from "./pieces.js";
import type { PieceType } from "./types.js";

export type RandomFn = () => number;

export function mulberry32(seed: number): RandomFn {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Guideline 7-bag randomizer: every bag contains each tetromino exactly once. */
export class BagRandomizer {
  private bag: PieceType[] = [];

  constructor(
    private readonly random: RandomFn = Math.random,
    private readonly pieces: readonly PieceType[] = PIECE_TYPES,
  ) {}

  next(): PieceType {
    if (this.bag.length === 0) this.refill();
    return this.bag.pop() as PieceType;
  }

  reset(): void {
    this.bag = [];
  }

  private refill(): void {
    this.bag = [...this.pieces];
    for (let i = this.bag.length - 1; i > 0; i -= 1) {
      const j = Math.floor(this.random() * (i + 1));
      const swap = this.bag[i];
      this.bag[i] = this.bag[j];
      this.bag[j] = swap;
    }
  }
}
