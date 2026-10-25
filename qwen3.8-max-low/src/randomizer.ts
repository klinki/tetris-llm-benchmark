// 7-bag randomizer: each bag contains all seven tetrominoes, shuffled.
import { PIECE_TYPES, PieceType } from './pieces.js';

export class BagRandomizer {
  private bag: PieceType[] = [];

  constructor(private rng: () => number = Math.random) {}

  next(): PieceType {
    if (this.bag.length === 0) {
      this.bag = [...PIECE_TYPES];
      // Fisher-Yates shuffle.
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = Math.floor(this.rng() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
      }
    }
    return this.bag.pop()!;
  }
}
