import { PIECE_TYPES, PieceType } from './pieces.js';

/**
 * 7-bag randomizer: every bag contains all seven pieces exactly once and
 * the order inside a bag is random (Guideline requirement).
 */
export class Randomizer {
  private bag: PieceType[] = [];

  reset(): void {
    this.bag = [];
  }

  next(): PieceType {
    if (this.bag.length === 0) this.refill();
    const piece = this.bag.pop() as PieceType;
    return piece;
  }

  private refill(): void {
    const bag = PIECE_TYPES.slice();
    // Fisher-Yates shuffle
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    this.bag = bag;
  }
}
