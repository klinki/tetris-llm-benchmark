/**
 * The Guideline 7-bag randomizer: all seven tetromino types are shuffled and
 * dealt in order before a new bag is opened, so every seven draws contain
 * exactly one of each piece.
 */

import { PIECE_TYPES, type PieceType } from "./tetromino.js";

function shuffledBag(): PieceType[] {
  const bag = [...PIECE_TYPES];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

export class SevenBag {
  private queue: PieceType[] = [];

  /** Draw the next piece type, opening a new bag when the queue runs out. */
  take(): PieceType {
    if (this.queue.length === 0) this.queue = shuffledBag();
    return this.queue.shift() as PieceType;
  }
}
