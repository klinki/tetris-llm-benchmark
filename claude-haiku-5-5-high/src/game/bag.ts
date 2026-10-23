import { PIECE_TYPES, type PieceType } from './pieces.js';

/**
 * Deals pieces from shuffled bags that each hold all seven shapes once (the Guideline's
 * 7-bag randomizer), which keeps long droughts of a shape from happening.
 * A fixed `sequence` can replace the bags, cycling through it (used by tests).
 */
export class PieceSource {
  private bag: PieceType[] = [];
  private bagIndex = 0;
  private sequenceIndex = 0;

  constructor(
    private readonly random: () => number = Math.random,
    private readonly sequence: readonly PieceType[] = [],
  ) {}

  next(): PieceType {
    if (this.sequence.length > 0) {
      const type = this.sequence[this.sequenceIndex];
      this.sequenceIndex = (this.sequenceIndex + 1) % this.sequence.length;
      return type;
    }
    if (this.bagIndex === this.bag.length) {
      this.bag = shuffle(PIECE_TYPES, this.random);
      this.bagIndex = 0;
    }
    return this.bag[this.bagIndex++];
  }
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
