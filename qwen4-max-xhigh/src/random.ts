// Guideline 7-bag randomizer: each bag is a shuffled permutation of all 7 pieces.

import { PIECE_TYPES, type PieceType } from './pieces.js';

export class Bag {
  private pieces: PieceType[] = [];

  constructor(private rng: () => number = Math.random) {}

  next(): PieceType {
    if (this.pieces.length === 0) {
      this.pieces = [...PIECE_TYPES];
      // Fisher-Yates shuffle.
      for (let i = this.pieces.length - 1; i > 0; i--) {
        const j = Math.floor(this.rng() * (i + 1));
        [this.pieces[i], this.pieces[j]] = [this.pieces[j], this.pieces[i]];
      }
    }
    return this.pieces.pop()!;
  }
}
