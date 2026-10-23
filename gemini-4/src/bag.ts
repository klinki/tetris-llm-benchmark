import { ALL_PIECES } from './constants.js';
import { PieceType } from './types.js';

/**
 * Tetris Guideline 7-Bag Random Generator.
 * Deals all 7 distinct tetrominoes in random order before generating the next bag.
 */
export class BagRandomizer {
  private queue: PieceType[] = [];
  private readonly rng: () => number;

  constructor(rng: () => number = Math.random) {
    this.rng = rng;
    this.refillIfNeeded(14);
  }

  public next(): PieceType {
    this.refillIfNeeded(7);
    return this.queue.shift()!;
  }

  public peek(count: number): PieceType[] {
    this.refillIfNeeded(count);
    return this.queue.slice(0, count);
  }

  public reset(): void {
    this.queue = [];
    this.refillIfNeeded(14);
  }

  private refillIfNeeded(minSize: number): void {
    while (this.queue.length < minSize) {
      const bag: PieceType[] = [...ALL_PIECES];
      // Fisher-Yates shuffle
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(this.rng() * (i + 1));
        const temp = bag[i];
        bag[i] = bag[j];
        bag[j] = temp;
      }
      this.queue.push(...bag);
    }
  }
}
