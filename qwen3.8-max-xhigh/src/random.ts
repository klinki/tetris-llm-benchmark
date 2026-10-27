import { KINDS, type PieceKind } from "./pieces.js";

export type Rng = () => number;

// Guideline 7-bag randomizer: every bag contains all seven tetrominoes
// in shuffled order; a new bag is shuffled once the current one runs out.
export class BagRandomizer {
  private bag: PieceKind[] = [];

  constructor(private rng: Rng = Math.random) {}

  next(): PieceKind {
    if (this.bag.length === 0) this.bag = this.freshBag();
    return this.bag.pop()!;
  }

  private freshBag(): PieceKind[] {
    const bag = KINDS.slice();
    // Fisher-Yates shuffle
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    return bag;
  }
}
