import type { PieceType } from "./tetromino.js";

const ALL: PieceType[] = ["I", "J", "L", "O", "S", "T", "Z"];

/**
 * The guideline "Random Generator": all seven tetrominoes are shuffled into a
 * bag and dealt before the next bag is created.
 */
export class SevenBag {
  private bag: PieceType[] = [];

  next(): PieceType {
    if (this.bag.length === 0) {
      this.bag = [...ALL];
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
      }
    }
    return this.bag.pop()!;
  }
}
