import { PIECE_TYPES, PieceType } from './pieces.js';

export type RandomSource = () => number;

/** Guideline "7-bag" randomizer: every piece appears once per shuffled bag of seven. */
export class Bag {
  private pieces: PieceType[] = [];

  constructor(private readonly random: RandomSource = Math.random) {}

  next(): PieceType {
    if (this.pieces.length === 0) this.refill();
    return this.pieces.pop()!;
  }

  private refill(): void {
    const bag = PIECE_TYPES.slice();
    // Fisher–Yates shuffle.
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    this.pieces = bag;
  }
}
