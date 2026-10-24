import { PIECE_TYPES, type PieceType } from "./pieces.js";

export type Random = () => number;

/** Endless supply of pieces with a preview of what comes next. */
export interface PieceSource {
  next(): PieceType;
  peek(count: number): PieceType[];
}

/** 7-bag randomizer: every piece appears exactly once per bag of seven. */
export class SevenBag implements PieceSource {
  private queue: PieceType[] = [];

  constructor(private readonly random: Random = Math.random) {}

  next(): PieceType {
    this.fill(1);
    return this.queue.shift()!;
  }

  peek(count: number): PieceType[] {
    this.fill(count);
    return this.queue.slice(0, count);
  }

  private fill(count: number): void {
    while (this.queue.length < count) {
      this.queue.push(...this.shuffledBag());
    }
  }

  private shuffledBag(): PieceType[] {
    const bag = [...PIECE_TYPES];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    return bag;
  }
}
