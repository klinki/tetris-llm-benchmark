// Tetromino definitions: SRS rotation states and spawn positions.
// Cells are [x, y] offsets within the piece bounding box (y grows downward).
import type { PieceType, RotationStates, Vec } from "./types.js";

/**
 * Rotation states for every piece, index 0..3 = spawn, R, 180, L.
 * J/L/S/T/Z use a 3x3 box, I uses a 4x4 box, O uses a 2x2 box.
 */
export const PIECES: Record<PieceType, RotationStates> = {
  I: [
    [[0, 1], [1, 1], [2, 1], [3, 1]],
    [[2, 0], [2, 1], [2, 2], [2, 3]],
    [[0, 2], [1, 2], [2, 2], [3, 2]],
    [[1, 0], [1, 1], [1, 2], [1, 3]],
  ],
  O: [
    [[0, 0], [1, 0], [0, 1], [1, 1]],
    [[0, 0], [1, 0], [0, 1], [1, 1]],
    [[0, 0], [1, 0], [0, 1], [1, 1]],
    [[0, 0], [1, 0], [0, 1], [1, 1]],
  ],
  T: [
    [[1, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [1, 2]],
    [[1, 0], [0, 1], [1, 1], [1, 2]],
  ],
  S: [
    [[1, 0], [2, 0], [0, 1], [1, 1]],
    [[1, 0], [1, 1], [2, 1], [2, 2]],
    [[1, 1], [2, 1], [0, 2], [1, 2]],
    [[0, 0], [0, 1], [1, 1], [1, 2]],
  ],
  Z: [
    [[0, 0], [1, 0], [1, 1], [2, 1]],
    [[2, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [1, 2], [2, 2]],
    [[1, 0], [0, 1], [1, 1], [0, 2]],
  ],
  J: [
    [[0, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [2, 2]],
    [[1, 0], [1, 1], [0, 2], [1, 2]],
  ],
  L: [
    [[2, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [1, 2], [2, 2]],
    [[0, 1], [1, 1], [2, 1], [0, 2]],
    [[0, 0], [1, 0], [1, 1], [1, 2]],
  ],
};

/** Spawn top-left position of each piece's bounding box. */
export const SPAWN: Record<PieceType, Vec> = {
  I: { x: 3, y: 3 },
  O: { x: 4, y: 3 },
  T: { x: 3, y: 3 },
  S: { x: 3, y: 3 },
  Z: { x: 3, y: 3 },
  J: { x: 3, y: 3 },
  L: { x: 3, y: 3 },
};

/** All seven piece types, used by the bag randomizer. */
export const PIECE_TYPES: readonly PieceType[] = ["I", "O", "T", "S", "Z", "J", "L"];

/** Absolute board cells occupied by a piece. */
export function pieceCells(type: PieceType, rotation: number, x: number, y: number): Vec[] {
  return PIECES[type][rotation].map(([cx, cy]) => ({ x: x + cx, y: y + cy }));
}
