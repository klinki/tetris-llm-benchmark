import { TYPES, type PieceType } from "./tetromino.js";

/**
 * Guideline 7-bag randomizer: each of the seven pieces appears exactly once
 * per bag, in shuffled order.
 */
export class Bag {
  private queue: PieceType[] = [];

  next(): PieceType {
    this.fill();
    return this.queue.shift()!;
  }

  private fill(): void {
    if (this.queue.length > 0) return;
    const bag = [...TYPES];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    this.queue = bag;
  }
}
