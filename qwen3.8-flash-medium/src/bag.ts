import { PIECE_TYPES, type PieceType } from './pieces.js'

/**
 * Guideline 7-bag randomizer: pieces are dealt in shuffled batches of seven,
 * so every tetromino appears exactly once per bag.
 */
export class SevenBag {
  private current: PieceType[] = []

  constructor(private readonly rng: () => number = Math.random) {}

  next(): PieceType {
    if (this.current.length === 0) {
      this.current = shuffle(PIECE_TYPES, this.rng)
    }
    return this.current.shift() as PieceType
  }

  reset(): void {
    this.current = []
  }
}

function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const result = items.slice()
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = result[i]
    result[i] = result[j]
    result[j] = tmp
  }
  return result
}
