import type { Board } from './board.js';
import type { Offset, PieceState, Rotation } from './pieces.js';

export type SpinKind = 'none' | 'mini' | 'full';

/** The four corners of the T's 3x3 shape box, relative to its centre. */
const CORNERS: readonly Offset[] = [
  [-1, -1],
  [1, -1],
  [-1, 1],
  [1, 1],
];

/** The two corners on the side the T points toward, for each rotation. */
const FRONT_CORNERS: Record<Rotation, readonly Offset[]> = {
  0: [[-1, -1], [1, -1]], // nub up
  1: [[1, -1], [1, 1]], // nub right
  2: [[-1, 1], [1, 1]], // nub down
  3: [[-1, -1], [-1, 1]], // nub left
};

/** Index of the last wall kick test. A rotation that needed it counts as a full T-spin. */
const LAST_KICK_INDEX = 4;

/**
 * Guideline T-spin detection for a T that has just rotated into place.
 * At least three of the four corners around the T's centre must be blocked.
 * Two blocked front corners make a full T-spin. Otherwise it is a mini,
 * unless the rotation used the last wall kick.
 */
export function detectTSpin(board: Board, piece: PieceState, kickIndex: number): SpinKind {
  if (piece.type !== 'T') return 'none';
  const centerX = piece.x + 1;
  const centerY = piece.y + 1;
  const blocked = ([dx, dy]: Offset) => board.isBlocked(centerX + dx, centerY + dy);
  if (CORNERS.filter(blocked).length < 3) return 'none';
  if (FRONT_CORNERS[piece.rotation].every(blocked) || kickIndex === LAST_KICK_INDEX) {
    return 'full';
  }
  return 'mini';
}
