import { PIECE_TYPES, type PieceType } from './pieces.js';

export type Random = () => number;

/** Supplies the next piece shape. */
export type PieceSource = () => PieceType;

/**
 * 7-bag randomizer: the shapes are shuffled into bags of seven,
 * so every run of seven pieces contains each shape exactly once.
 */
export function createBag(random: Random = Math.random): PieceSource {
  let bag: PieceType[] = [];
  return () => {
    if (bag.length === 0) bag = shuffle(PIECE_TYPES, random);
    return bag.pop() as PieceType;
  };
}

function shuffle<T>(items: readonly T[], random: Random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
