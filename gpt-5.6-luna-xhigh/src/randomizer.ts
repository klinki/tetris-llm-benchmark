import { PIECE_TYPES, type PieceType } from "./types.js";

export interface PieceRandomizer {
  next(): PieceType;
  reset?(): void;
}

export class SevenBag implements PieceRandomizer {
  private bag: PieceType[] = [];

  public next(): PieceType {
    if (this.bag.length === 0) this.refill();
    return this.bag.shift()!;
  }

  public reset(): void {
    this.bag = [];
  }

  private refill(): void {
    this.bag = [...PIECE_TYPES];
    for (let i = this.bag.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
    }
  }
}
