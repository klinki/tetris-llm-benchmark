import { PIECE_TYPES } from './pieces.js';
import type { PieceType } from './types.js';

export type RandomFn = () => number;

export interface PieceSource {
  next(): PieceType;
  reset(): void;
}

/** Small deterministic PRNG (mulberry32) for reproducible tests. */
export function createSeededRng(seed: number): RandomFn {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Guideline 7-bag: every seven pieces contain each tetromino exactly once. */
export class BagRandomizer implements PieceSource {
  private bag: PieceType[] = [];

  constructor(private readonly rng: RandomFn = Math.random) {}

  next(): PieceType {
    if (this.bag.length === 0) this.refill();
    return this.bag.pop()!;
  }

  reset(): void {
    this.bag = [];
  }

  private refill(): void {
    const pieces: PieceType[] = [...PIECE_TYPES];
    for (let i = pieces.length - 1; i > 0; i -= 1) {
      const j = Math.floor(this.rng() * (i + 1));
      [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
    }
    this.bag = pieces;
  }
}

/** Cycles a fixed sequence of pieces — handy for scripted tests/debugging. */
export class SequenceRandomizer implements PieceSource {
  private index = 0;

  constructor(private readonly sequence: readonly PieceType[]) {
    if (sequence.length === 0) throw new Error('piece sequence must not be empty');
  }

  next(): PieceType {
    const type = this.sequence[this.index % this.sequence.length];
    this.index += 1;
    return type;
  }

  reset(): void {
    this.index = 0;
  }
}
