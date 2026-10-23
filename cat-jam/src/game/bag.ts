import { PIECE_TYPES, type PieceType } from './pieces.js';

/** Guideline 7-bag randomizer: each bag holds one of every piece, shuffled. */
export class Bag {
  private pieces: PieceType[] = [];
  private readonly rng: () => number;

  constructor(rng: () => number = Math.random) {
    this.rng = rng;
  }

  private refill(): void {
    this.pieces = [...PIECE_TYPES];
    for (let i = this.pieces.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [this.pieces[i], this.pieces[j]] = [this.pieces[j], this.pieces[i]];
    }
  }

  /** Draws the next piece, refilling the bag when it runs out. */
  next(): PieceType {
    if (this.pieces.length === 0) this.refill();
    return this.pieces.pop() as PieceType;
  }

  /** Discards the current bag so the next draw starts a fresh one. */
  reset(): void {
    this.pieces = [];
  }
}
