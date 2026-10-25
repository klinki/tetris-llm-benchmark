import { PieceType, PIECE_TYPES } from "./pieces.js";

/**
 * Guideline 7-bag randomizer: every bag contains all seven tetrominoes
 * in a shuffled order, so no piece can be starved for long.
 */
export class Bag {
  private bag: PieceType[] = [];

  constructor(private rng: () => number = Math.random) {}

  next(): PieceType {
    if (this.bag.length === 0) this.refill();
    return this.bag.pop()!;
  }

  private refill(): void {
    this.bag = [...PIECE_TYPES];
    // Fisher-Yates shuffle
    for (let i = this.bag.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      const tmp = this.bag[i];
      this.bag[i] = this.bag[j];
      this.bag[j] = tmp;
    }
  }
}
