import { TETROMINO_TYPES } from './tetrominoes.js';
import { TetrominoType } from './types.js';

/**
 * 7-Bag Randomizer following the Tetris Guideline.
 * Generates permutations of all 7 tetrominoes using Fisher-Yates shuffle.
 */
export class BagRandomizer {
  private queue: TetrominoType[] = [];
  private readonly rng: () => number;

  constructor(rng: () => number = Math.random) {
    this.rng = rng;
    this.ensureQueue(14);
  }

  /**
   * Generates a newly shuffled bag of all 7 tetrominoes.
   */
  public createBag(): TetrominoType[] {
    const bag: TetrominoType[] = [...TETROMINO_TYPES];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      const tmp = bag[i]!;
      bag[i] = bag[j]!;
      bag[j] = tmp;
    }
    return bag;
  }

  private ensureQueue(minSize: number): void {
    while (this.queue.length < minSize) {
      this.queue.push(...this.createBag());
    }
  }

  /**
   * Draws and removes the next piece from the bag queue.
   */
  public next(): TetrominoType {
    this.ensureQueue(7);
    const piece = this.queue.shift()!;
    this.ensureQueue(7);
    return piece;
  }

  /**
   * Returns a preview of upcoming pieces without removing them.
   */
  public peek(count: number = 5): TetrominoType[] {
    this.ensureQueue(count + 7);
    return this.queue.slice(0, count);
  }

  /**
   * Resets the randomizer queue, optionally seeding it with specific pieces for tests.
   */
  public reset(seedQueue?: TetrominoType[]): void {
    this.queue = seedQueue ? [...seedQueue] : [];
    this.ensureQueue(14);
  }
}
