import { PIECE_TYPES } from "./types.js";
import type { PieceType } from "./types.js";

/** A Guideline seven-bag generator. */
export class SevenBag {
  private bag: PieceType[] = [];

  public constructor(private readonly random: () => number = Math.random) {}

  public reset(): void {
    this.bag = [];
  }

  public next(): PieceType {
    if (this.bag.length === 0) {
      this.refill();
    }

    return this.bag.shift() as PieceType;
  }

  private refill(): void {
    this.bag = [...PIECE_TYPES];

    for (let index = this.bag.length - 1; index > 0; index -= 1) {
      const value = this.random();
      const normalized = Number.isFinite(value) ? Math.max(0, Math.min(0.999999999, value)) : 0;
      const swapIndex = Math.floor(normalized * (index + 1));
      [this.bag[index], this.bag[swapIndex]] = [this.bag[swapIndex], this.bag[index]];
    }
  }
}
