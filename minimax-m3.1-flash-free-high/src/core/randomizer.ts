import { PIECE_TYPES, type PieceType } from './pieces.js';

/** A random number generator, injectable for deterministic tests. */
export type RandomSource = () => number;

/**
 * The "7-bag" randomizer required by the Tetris Guideline: every bag holds
 * all seven pieces exactly once, the order inside a bag is random.
 */
export class PieceBag {
  private bag: PieceType[] = [];

  constructor(private readonly random: RandomSource = Math.random) {}

  /** Returns the next piece and refills the bag when it runs empty. */
  next(): PieceType {
    if (this.bag.length === 0) this.refill();
    return this.bag.pop()!;
  }

  /** Fills the bag with a shuffled set of all seven pieces. */
  private refill(): void {
    const pieces = PIECE_TYPES.slice();
    for (let i = pieces.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      const tmp = pieces[i]!;
      pieces[i] = pieces[j]!;
      pieces[j] = tmp;
    }
    this.bag = pieces;
  }
}
