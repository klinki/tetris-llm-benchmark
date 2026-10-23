import { PIECE_TYPES, type PieceType } from './pieces.js';

/**
 * Returns a piece source that deals the seven tetrominoes in shuffled bags of
 * seven. Every bag holds each piece exactly once, which keeps droughts short.
 */
export function createSevenBag(random: () => number = Math.random): () => PieceType {
  let bag: PieceType[] = [];
  return () => {
    if (bag.length === 0) bag = shuffle(PIECE_TYPES, random);
    return bag.pop()!;
  };
}

/** Fisher-Yates shuffle of a copy of `items`. */
function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
