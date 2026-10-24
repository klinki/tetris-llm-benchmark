import { ALL_KINDS, PieceKind } from "./pieces.js";

/** 7-bag randomizer: every 7 pieces contain each kind exactly once. */
export class Bag {
  private queue: PieceKind[] = [];
  constructor(private random: () => number = Math.random) {}

  private refill(): void {
    const bag = [...ALL_KINDS];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    this.queue.push(...bag);
  }

  next(): PieceKind {
    if (this.queue.length === 0) this.refill();
    return this.queue.shift()!;
  }

  peek(n: number): PieceKind[] {
    while (this.queue.length < n) this.refill();
    return this.queue.slice(0, n);
  }

  /** Remove and return the next piece (same as next, explicit for previews). */
  take(): PieceKind {
    return this.next();
  }
}
