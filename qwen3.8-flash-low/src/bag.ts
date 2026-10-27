import { PIECES, type PieceType } from "./pieces.js";

/**
 * The Guideline's 7-bag randomizer: pieces are drawn in shuffled batches of
 * all seven, so every tetromino appears exactly once per seven pieces.
 */
export class Bag {
  private queue: PieceType[] = [];

  constructor(private readonly rng: () => number = Math.random) {}

  next(): PieceType {
    if (this.queue.length === 0) {
      this.queue = [...PIECES];
      for (let i = this.queue.length - 1; i > 0; i--) {
        const j = Math.floor(this.rng() * (i + 1));
        [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
      }
    }
    return this.queue.shift()!;
  }
}
