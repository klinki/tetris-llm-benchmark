import { PIECE_TYPES } from './pieces.js';
import type { PieceType } from './types.js';

/**
 * The seven bag randomiser of the Tetris Guideline: every piece appears
 * exactly once in each bag and the order of the bags is random.
 */
export class Bag {
  private readonly random: () => number;
  private bag: PieceType[] = [];

  constructor(random: () => number = Math.random) {
    this.random = random;
  }

  /** Throws the current bag away. */
  reset(): void {
    this.bag = [];
  }

  /** Takes the next piece out of the bag, refilling it when it is empty. */
  next(): PieceType {
    if (this.bag.length === 0) {
      this.refill();
    }
    const piece = this.bag.pop();
    if (!piece) {
      throw new Error('The bag randomiser produced no piece');
    }
    return piece;
  }

  private refill(): void {
    const pieces = [...PIECE_TYPES];
    for (let i = pieces.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      const swap = pieces[i];
      pieces[i] = pieces[j];
      pieces[j] = swap;
    }
    this.bag = pieces;
  }
}
