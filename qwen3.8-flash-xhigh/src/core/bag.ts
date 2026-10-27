import { PIECE_TYPES, type PieceType } from './pieces.js';

/**
 * Guideline random generator: deals the seven tetrominoes in shuffled bags,
 * so a piece cannot appear twice in a bag and never waits more than 12
 * pieces. Accepts an injectable random source for deterministic tests.
 */
export class SevenBag {
  private bag: PieceType[] = [];
  private pos = 0;

  constructor(private random: () => number = Math.random) {}

  next(): PieceType {
    if (this.pos >= this.bag.length) this.refill();
    return this.bag[this.pos++];
  }

  private refill(): void {
    const bag = PIECE_TYPES.slice();
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    this.bag = bag;
    this.pos = 0;
  }
}
