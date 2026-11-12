import { PIECE_TYPES } from './pieces.js';
import type { PieceType } from './types.js';

/**
 * The Guideline randomizer: pieces are handed out from shuffled bags of seven
 * so every bag contains each tetromino exactly once.
 */
export class SevenBag {
  private bag: PieceType[] = [];

  constructor(private readonly random: () => number = Math.random) {}

  /** The next piece of the current bag. */
  next(): PieceType {
    if (this.bag.length === 0) this.refill();
    return this.bag.pop() as PieceType;
  }

  private refill(): void {
    const pieces = PIECE_TYPES.slice();
    for (let i = pieces.length - 1; i > 0; i -= 1) {
      const j = Math.floor(this.random() * (i + 1));
      const swap = pieces[i];
      pieces[i] = pieces[j];
      pieces[j] = swap;
    }
    this.bag = pieces;
  }
}
