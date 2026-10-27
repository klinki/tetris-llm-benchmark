import { PIECE_TYPES, PieceType } from "./pieces.js";

export type RandomFn = () => number;

/** Guideline "7-bag" randomizer with a look-ahead queue. */
export class Bag {
  private queue: PieceType[] = [];

  constructor(private readonly random: RandomFn = Math.random) {}

  next(): PieceType {
    this.fill(1);
    return this.queue.shift()!;
  }

  /** Returns the upcoming pieces without consuming them. */
  peek(count: number): readonly PieceType[] {
    this.fill(count);
    return this.queue.slice(0, count);
  }

  private fill(count: number): void {
    while (this.queue.length < count) {
      const bag = PIECE_TYPES.slice();
      // Fisher-Yates shuffle
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
      this.queue.push(...bag);
    }
  }
}
