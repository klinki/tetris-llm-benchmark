import { TETROMINOES, Tetromino } from './pieces.js';

/** Shuffled 7-bag randomizer: every bag deals all seven pieces exactly once. */
export class BagRandomizer {
  private bag: Tetromino[] = [];

  constructor(private readonly rng: () => number = Math.random) {}

  next(): Tetromino {
    if (this.bag.length === 0) {
      this.bag = [...TETROMINOES];
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = Math.floor(this.rng() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
      }
    }
    return this.bag.pop()!;
  }
}
