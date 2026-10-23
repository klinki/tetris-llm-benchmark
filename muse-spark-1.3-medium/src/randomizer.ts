import { ALL_PIECES } from './pieces.js';
import type { PieceType } from './types.js';

/** Guideline 7-bag: every 7 dealt pieces contain each tetromino exactly once. */
export class SevenBag {
  private queue: PieceType[] = [];
  private rng: () => number;

  constructor(rng: () => number = Math.random) {
    this.rng = rng;
    this.topUp(14);
  }

  next(): PieceType {
    this.topUp(7);
    return this.queue.shift() as PieceType;
  }

  peek(count: number): PieceType[] {
    this.topUp(count);
    return this.queue.slice(0, count);
  }

  reset(): void {
    this.queue = [];
    this.topUp(14);
  }

  private topUp(minSize: number): void {
    while (this.queue.length < minSize) {
      const bag: PieceType[] = [...ALL_PIECES];
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(this.rng() * (i + 1));
        const tmp = bag[i];
        bag[i] = bag[j];
        bag[j] = tmp;
      }
      this.queue.push(...bag);
    }
  }
}
