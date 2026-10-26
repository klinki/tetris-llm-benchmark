import { PIECE_TYPES, type PieceType } from "./pieces.js";

export type Random = () => number;

/**
 * Guideline "7-bag" randomizer: every 7 pieces contain each Tetrimino
 * exactly once, in random order.
 */
export class Bag {
  private queue: PieceType[] = [];

  constructor(private readonly random: Random = Math.random) {}

  next(): PieceType {
    if (this.queue.length === 0) this.refill();
    return this.queue.pop()!;
  }

  private refill(): void {
    const bag = [...PIECE_TYPES];
    // Fisher–Yates shuffle.
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    this.queue = bag;
  }
}
