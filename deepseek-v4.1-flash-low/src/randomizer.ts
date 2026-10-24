import { PIECE_TYPES, type PieceType } from './tetromino.js';

/**
 * Guideline 7-bag randomizer. Every group of seven pieces contains each
 * tetromino exactly once, in shuffled order.
 */
export class BagRandomizer {
  private bag: PieceType[] = [];

  constructor(private readonly rng: () => number = Math.random) {}

  /** Remove and return the next piece. */
  next(): PieceType {
    if (this.bag.length === 0) {
      this.refill();
    }

    return this.bag.shift() as PieceType;
  }

  /** Look at the upcoming pieces without consuming them. */
  peek(count: number): PieceType[] {
    while (this.bag.length < count) {
      this.refill();
    }

    return this.bag.slice(0, count);
  }

  private refill(): void {
    const pieces = [...PIECE_TYPES];

    // Fisher-Yates shuffle.
    for (let i = pieces.length - 1; i > 0; i -= 1) {
      const j = Math.floor(this.rng() * (i + 1));
      const swap = pieces[i];
      pieces[i] = pieces[j];
      pieces[j] = swap;
    }

    this.bag.push(...pieces);
  }
}
