/**
 * Tetromino definitions following the Tetris Guideline / Super Rotation System.
 *
 * Each piece is described by its 4 rotation states as cell offsets (x right,
 * y down) inside a bounding box: 4x4 for I, 3x3 for J/L/S/T/Z, 2x2 for O.
 * State 0 is the spawn state; state 1 results from a clockwise rotation,
 * state 2 from two rotations, state 3 from a counter-clockwise rotation.
 */

export type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export const PIECE_TYPES: readonly PieceType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

/** A cell offset within a piece's bounding box: [x, y] with y pointing down. */
export type Cell = readonly [number, number];

export const PIECE_ID: Record<PieceType, number> = {
  I: 1, O: 2, T: 3, S: 4, Z: 5, J: 6, L: 7,
};

export const COLORS: Record<PieceType, string> = {
  I: '#3ee6f0', // cyan
  O: '#f5d90a', // yellow
  T: '#a94ef5', // purple
  S: '#41e05a', // green
  Z: '#f5475b', // red
  J: '#4d6ef7', // blue
  L: '#f59431', // orange
};

const ID_TO_TYPE: PieceType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
export function typeForId(id: number): PieceType | null {
  return id >= 1 && id <= 7 ? ID_TO_TYPE[id - 1] : null;
}

export const ROTATIONS: Record<PieceType, readonly (readonly Cell[])[]> = {
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

/**
 * Wall kick data, stored in screen coordinates (x right, y down; the wiki
 * tables use y up, so their y values are negated here). Keyed as "from to".
 */
type KickTable = Record<string, readonly (readonly [number, number])[]>;

const KICKS_JLSTZ: KickTable = {
  '01': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '10': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '12': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '21': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '23': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '32': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '30': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '03': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
};

const KICKS_I: KickTable = {
  '01': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  '10': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  '12': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
  '21': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  '23': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  '32': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  '30': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  '03': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
};

const NO_KICK: readonly (readonly [number, number])[] = [[0, 0]];

/** The five kick offsets to test for a rotation of `type` from `from` to `to`. */
export function kicksFor(type: PieceType, from: number, to: number): readonly (readonly [number, number])[] {
  if (type === 'O') return NO_KICK; // the O piece never kicks
  const table = type === 'I' ? KICKS_I : KICKS_JLSTZ;
  return table[`${from}${to}`] ?? NO_KICK;
}

/**
 * Spawn placement [x, y] of the bounding box. Pieces spawn at the top of the
 * playfield with their lowest cells in the first visible row; the two rows
 * above are hidden buffer rows.
 */
export const SPAWN_POS: Record<PieceType, readonly [number, number]> = {
  I: [3, 1],
  O: [4, 1],
  T: [3, 1],
  S: [3, 1],
  Z: [3, 1],
  J: [3, 1],
  L: [3, 1],
};
