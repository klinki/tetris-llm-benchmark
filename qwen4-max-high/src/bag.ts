/** Guideline 7-bag randomizer: each bag is a shuffled permutation of all
 *  seven tetrominoes, so no piece can drought for more than 12 draws. */

import { PIECES, type PieceType } from './pieces.js';

export class Bag {
  private items: PieceType[] = [];

  constructor(private readonly rng: () => number = Math.random) {}

  /** Draw the next piece, refilling and shuffling a fresh bag when empty. */
  draw(): PieceType {
    if (this.items.length === 0) {
      this.items = [...PIECES];
      for (let i = this.items.length - 1; i > 0; i--) {
        const j = Math.floor(this.rng() * (i + 1));
        [this.items[i], this.items[j]] = [this.items[j], this.items[i]];
      }
    }
    return this.items.pop()!;
  }
}