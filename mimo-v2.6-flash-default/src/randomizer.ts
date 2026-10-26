import { PIECE_TYPES } from './pieces.js';
import type { PieceType } from './constants.js';
import { mulberry32 } from './rng.js';
import type { Rng } from './rng.js';

/** Guideline 7-bag randomizer: every batch of 7 pieces contains each piece once. */
export class SevenBag {
  private queue: PieceType[] = [];

  constructor(private rng: Rng = mulberry32(Date.now())) {}

  reset(): void {
    this.queue.length = 0;
  }

  next(): PieceType {
    if (this.queue.length === 0) this.refill();
    return this.queue.shift()!;
  }

  /** Upcoming pieces without consuming them. */
  peek(count: number): PieceType[] {
    while (this.queue.length < count) this.refill();
    return this.queue.slice(0, count);
  }

  private refill(): void {
    const bag = [...PIECE_TYPES];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    this.queue.push(...bag);
  }
}
