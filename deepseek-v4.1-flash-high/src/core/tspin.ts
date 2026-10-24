/** T-spin detection based on the Guideline three-corner rule. */

import type { Board } from "./board.js";
import type { ActivePiece, Rotation, TSpinKind } from "./types.js";

/** Corner order: top-left, top-right, bottom-left, bottom-right. */
const FRONT_CORNERS: Record<Rotation, readonly [number, number]> = {
  0: [0, 1],
  1: [1, 3],
  2: [2, 3],
  3: [0, 2],
};

export function detectTSpin(
  board: Board,
  piece: ActivePiece,
  lastMoveWasRotation: boolean,
  kickIndex: number,
): TSpinKind {
  if (!lastMoveWasRotation || piece.type !== "T") return "none";

  const corners = [
    board.isBlocked(piece.x, piece.y),
    board.isBlocked(piece.x + 2, piece.y),
    board.isBlocked(piece.x, piece.y + 2),
    board.isBlocked(piece.x + 2, piece.y + 2),
  ];
  const filled = corners.filter(Boolean).length;
  if (filled < 3) return "none";

  const [frontA, frontB] = FRONT_CORNERS[piece.rotation];
  if ((corners[frontA] && corners[frontB]) || kickIndex === 4) return "full";
  return "mini";
}
