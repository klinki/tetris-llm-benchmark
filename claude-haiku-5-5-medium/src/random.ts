import { PIECE_TYPES, PieceType } from './types.js';

// Guideline 7-bag randomizer: every piece appears once in each bag of seven.
export class BagRandomizer {
  private bag: PieceType[] = [];

  constructor(private readonly random: () => number = Math.random) {}

  next(): PieceType {
    if (this.bag.length === 0) this.refill();
    return this.bag.pop()!;
  }

  private refill(): void {
    const bag = [...PIECE_TYPES];
    // Fisher-Yates shuffle.
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    this.bag = bag;
  }
}
