import type { PieceType } from './types.js';

export const PIECE_TYPES: readonly PieceType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

/**
 * 7-bag randomizer: each shuffled bag yields every tetromino exactly once
 * before any type repeats.
 */
export class BagRandomizer {
  private bag: PieceType[] = [];

  next(): PieceType {
    if (this.bag.length === 0) this.refill();
    return this.bag.pop()!;
  }

  private refill(): void {
    this.bag = [...PIECE_TYPES];
    for (let i = this.bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
    }
  }
}
