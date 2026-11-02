import { PIECE_TYPES } from './tetromino.js';
import type { PieceType } from './tetromino.js';

/** Guideline 7-bag randomizer: every bag contains each of the seven pieces exactly once. */
export class SevenBagRandomizer {
  private bag: PieceType[] = [];

  constructor(private readonly rand: () => number = Math.random) {}

  next(): PieceType {
    if (this.bag.length === 0) {
      this.bag = [...PIECE_TYPES];
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = Math.floor(this.rand() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
      }
    }
    return this.bag.pop()!;
  }
}
