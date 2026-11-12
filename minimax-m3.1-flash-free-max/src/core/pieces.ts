import type { Offset, PieceType, Rotation } from './types.js';

export const PIECE_TYPES: readonly PieceType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

/**
 * Shape of every piece in each of its four rotation states.
 * `X` marks a filled cell, `.` an empty one.
 */
export const SHAPES: Record<PieceType, readonly (readonly string[])[]> = {
  I: [
    ['....', 'XXXX', '....', '....'],
    ['..X.', '..X.', '..X.', '..X.'],
    ['....', '....', 'XXXX', '....'],
    ['..X.', '..X.', '..X.', '..X.'],
  ],
  J: [
    ['X..', 'XXX', '...'],
    ['.XX', '.X.', '.X.'],
    ['...', 'XXX', '..X'],
    ['.X.', '.X.', 'XX.'],
  ],
  L: [
    ['..X', 'XXX', '...'],
    ['.X.', '.X.', '.XX'],
    ['...', 'XXX', 'X..'],
    ['XX.', '.X.', '.X.'],
  ],
  O: [
    ['XX', 'XX'],
    ['XX', 'XX'],
    ['XX', 'XX'],
    ['XX', 'XX'],
  ],
  S: [
    ['.XX', 'XX.', '...'],
    ['.X.', '.XX', '..X'],
    ['...', '.XX', 'XX.'],
    ['X..', 'XX.', '.X.'],
  ],
  T: [
    ['.X.', 'XXX', '...'],
    ['.X.', '.XX', '.X.'],
    ['...', 'XXX', '.X.'],
    ['.X.', 'XX.', '.X.'],
  ],
  Z: [
    ['XX.', '.XX', '...'],
    ['..X', '.XX', '.X.'],
    ['...', 'XX.', '.XX'],
    ['.X.', 'XX.', 'X..'],
  ],
};

/**
 * Where a piece appears. The lowest cells of every piece sit on the second row
 * of the visible field, the rest of the shape is drawn above them.
 */
export const SPAWN_POSITIONS: Record<PieceType, Offset> = {
  I: { x: 3, y: 2 },
  J: { x: 3, y: 2 },
  L: { x: 3, y: 2 },
  O: { x: 4, y: 2 },
  S: { x: 3, y: 2 },
  T: { x: 3, y: 2 },
  Z: { x: 3, y: 2 },
};

/**
 * Super Rotation System wall kicks for J, L, S, T and Z.
 * Keys are the rotation transition, values are offsets tried in order.
 * The published offsets use a y axis pointing up, the playfield uses one
 * pointing down, so the signs are flipped in `toScreenOffsets`.
 */
const JLSTZ_KICKS: Record<string, readonly (readonly [number, number])[]> = {
  '01': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '10': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '12': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '21': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '23': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '32': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '30': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '03': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
};

/** Super Rotation System wall kicks for the I piece. */
const I_KICKS: Record<string, readonly (readonly [number, number])[]> = {
  '01': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '10': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '12': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  '21': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '23': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '32': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  '30': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '03': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
};

function toScreenOffsets(
  table: Record<string, readonly (readonly [number, number])[]>,
): Record<string, readonly Offset[]> {
  const result: Record<string, Offset[]> = {};
  for (const [transition, offsets] of Object.entries(table)) {
    result[transition] = offsets.map(([x, y]) => ({ x, y: -y }));
  }
  return result;
}

const KICK_TABLES: Record<PieceType, Record<string, readonly Offset[]>> = {
  I: toScreenOffsets(I_KICKS),
  J: toScreenOffsets(JLSTZ_KICKS),
  L: toScreenOffsets(JLSTZ_KICKS),
  O: {},
  S: toScreenOffsets(JLSTZ_KICKS),
  T: toScreenOffsets(JLSTZ_KICKS),
  Z: toScreenOffsets(JLSTZ_KICKS),
};

const NO_OFFSET: readonly Offset[] = [{ x: 0, y: 0 }];

/** The filled cells of a piece in the given rotation, relative to its box. */
export function getCells(type: PieceType, rotation: Rotation): readonly Offset[] {
  const matrix = SHAPES[type][rotation];
  const cells: Offset[] = [];
  matrix.forEach((row, y) => {
    for (let x = 0; x < row.length; x += 1) {
      if (row[x] === 'X') cells.push({ x, y });
    }
  });
  return cells;
}

/** The wall kick offsets to try when rotating from one state into another. */
export function getKickOffsets(type: PieceType, from: Rotation, to: Rotation): readonly Offset[] {
  return KICK_TABLES[type][`${from}${to}`] ?? NO_OFFSET;
}
