/** The 7-bag randomizer required by the Tetris Guideline. */

import { PIECE_ORDER, type PieceType } from './pieces.js';

export type RandomSource = () => number;

export class SevenBag {
  private bag: PieceType[] = [];

  constructor(private readonly random: RandomSource = Math.random) {}

  /** Returns the next piece of the sequence. */
  next(): PieceType {
    if (this.bag.length === 0) this.refill();
    const piece = this.bag.pop();
    if (!piece) throw new Error('The randomizer produced no piece.');
    return piece;
  }

  private refill(): void {
    this.bag = [...PIECE_ORDER];
    for (let i = this.bag.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
    }
  }
}
