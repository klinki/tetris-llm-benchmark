import { PIECE_TYPES, type PieceType } from './pieces.js';

/** Supplies the sequence of pieces; injectable so tests can choose the pieces. */
export interface PieceSource {
  next(): PieceType;
  peek(count: number): PieceType[];
}

/** Guideline "7-bag": deals all seven pieces in random order, then starts a new bag. */
export class Bag implements PieceSource {
  private readonly queue: PieceType[] = [];

  constructor(private readonly random: () => number = Math.random) {}

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
      const bag = [...PIECE_TYPES];
      // Fisher–Yates shuffle
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
      this.queue.push(...bag);
    }
  }
}
