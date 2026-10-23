import { NEXT_QUEUE_SIZE } from './constants.js';
import type { PieceType } from './pieces.js';
import { Bag } from './bag.js';

/** Lookahead window of upcoming pieces, always topped up from the bag. */
export class Queue {
  private readonly bag: Bag;
  private readonly size: number;
  private pieces: PieceType[] = [];

  constructor(bag: Bag, size: number = NEXT_QUEUE_SIZE) {
    this.bag = bag;
    this.size = size;
    this.fill();
  }

  private fill(): void {
    while (this.pieces.length < this.size) this.pieces.push(this.bag.next());
  }

  /** The piece `offset` positions ahead, without consuming it. */
  peek(offset = 0): PieceType {
    return this.pieces[offset];
  }

  /** Removes and returns the front piece, then refills the queue. */
  shift(): PieceType {
    const piece = this.pieces.shift() as PieceType;
    this.fill();
    return piece;
  }

  /** A copy of the upcoming pieces. */
  snapshot(): PieceType[] {
    return [...this.pieces];
  }

  reset(): void {
    this.pieces = [];
    this.fill();
  }
}
