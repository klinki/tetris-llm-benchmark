import { PIECE_TYPES, type PieceType } from './pieces.js';

/** Guideline 7-bag randomizer: every run of 7 pieces contains each tetromino exactly once. */
export class SevenBag {
  private bag: PieceType[] = [];

  constructor(private readonly random: () => number = Math.random) {}

  next(): PieceType {
    if (this.bag.length === 0) this.bag = this.shuffled();
    return this.bag.pop()!;
  }

  private shuffled(): PieceType[] {
    const pieces = [...PIECE_TYPES];
    for (let i = pieces.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
    }
    return pieces;
  }
}
