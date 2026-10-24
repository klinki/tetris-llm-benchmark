/** Piece kinds and the Tetris Guideline shapes, colors, rotation states and SRS kick tables. */

export type Kind = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

/** Cell offset inside a piece's rotation box: x right, y down. */
export type Cell = [number, number];

/** Wall kick offset: [dx, dyUp] (dyUp is positive *up*, the SRS convention). */
export type Offset = readonly [number, number];

export const KINDS: readonly Kind[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

/** Spawn orientation (state 0) cells, flat side down, per the Guideline. */
const BASE: Record<Kind, readonly Cell[]> = {
  I: [[0, 1], [1, 1], [2, 1], [3, 1]], // in a 4x4 box
  O: [[0, 0], [1, 0], [0, 1], [1, 1]], // in a 2x2 box, rotation is a no-op
  T: [[1, 0], [0, 1], [1, 1], [2, 1]],
  S: [[1, 0], [2, 0], [0, 1], [1, 1]],
  Z: [[0, 0], [1, 0], [1, 1], [2, 1]],
  J: [[0, 0], [0, 1], [1, 1], [2, 1]],
  L: [[2, 0], [0, 1], [1, 1], [2, 1]],
};

const SIZE: Record<Kind, number> = { I: 4, O: 2, T: 3, S: 3, Z: 3, J: 3, L: 3 };

/** Rotate one step clockwise inside the N x N rotation box: (x, y) -> (N-1-y, x). */
function rotateCW(cells: readonly Cell[], size: number): Cell[] {
  return cells.map(([x, y]): Cell => [size - 1 - y, x]);
}

function statesFor(kind: Kind): Cell[][] {
  const states: Cell[][] = [[...BASE[kind]]];
  for (let i = 1; i < 4; i++) states.push(rotateCW(states[i - 1], SIZE[kind]));
  return states;
}

/** All four rotation states per piece, index 0..3 = spawn, right, 180, left. */
export const STATES: Record<Kind, readonly Cell[][]> = {
  I: statesFor('I'),
  O: statesFor('O'),
  T: statesFor('T'),
  S: statesFor('S'),
  Z: statesFor('Z'),
  J: statesFor('J'),
  L: statesFor('L'),
};

/**
 * Super Rotation System wall kick data for J, L, S, T and Z, keyed `"from>to"`.
 * Coordinates follow the SRS convention: x right, y up.
 */
const JLSTZ_KICKS: Record<string, readonly Offset[]> = {
  '0>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '1>0': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '1>2': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '2>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '2>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '3>2': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '3>0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '0>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
};

/** SRS wall kick data for the I piece. */
const I_KICKS: Record<string, readonly Offset[]> = {
  '0>1': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '1>0': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '1>2': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  '2>1': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '2>3': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '3>2': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '3>0': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '0>3': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
};

/** Kick offsets for a rotation, converted to screen space (y down): apply as (x + dx, y - dyUp). */
export function kicksFor(kind: Kind, from: number, to: number): readonly Offset[] {
  if (kind === 'O') return [[0, 0]];
  const table = kind === 'I' ? I_KICKS : JLSTZ_KICKS;
  return table[`${from}>${to}`];
}

/** Guideline spawn colors. */
export const COLORS: Record<Kind, string> = {
  I: '#00e5ff',
  O: '#ffd500',
  T: '#c24cf0',
  S: '#25d338',
  Z: '#ff4d4d',
  J: '#3a6cff',
  L: '#ff8b1c',
};
