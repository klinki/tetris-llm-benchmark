export type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
export type Rotation = 0 | 1 | 2 | 3;

/** A block inside a piece's square box, as [column, row] with y pointing down. */
export type Cell = readonly [number, number];

/** SRS wall-kick offset as [dx, dy], with dy pointing up as in the published tables. */
export type Kick = readonly [number, number];

export const PIECE_TYPES: readonly PieceType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

export const PIECE_COLORS: Record<PieceType, string> = {
  I: '#00f0f0',
  O: '#f0f000',
  T: '#a000f0',
  S: '#00f000',
  Z: '#f00000',
  J: '#0000f0',
  L: '#f0a000',
};

// Spawn orientation (rotation 0) inside a box of BOX_SIZE x BOX_SIZE blocks.
const SPAWN_CELLS: Record<PieceType, readonly Cell[]> = {
  I: [[0, 1], [1, 1], [2, 1], [3, 1]],
  O: [[0, 0], [1, 0], [0, 1], [1, 1]],
  T: [[1, 0], [0, 1], [1, 1], [2, 1]],
  S: [[1, 0], [2, 0], [0, 1], [1, 1]],
  Z: [[0, 0], [1, 0], [1, 1], [2, 1]],
  J: [[0, 0], [0, 1], [1, 1], [2, 1]],
  L: [[2, 0], [0, 1], [1, 1], [2, 1]],
};

const BOX_SIZE: Record<PieceType, number> = { I: 4, O: 2, T: 3, S: 3, Z: 3, J: 3, L: 3 };

function rotateClockwise(cells: readonly Cell[], size: number): Cell[] {
  return cells.map(([x, y]) => [size - 1 - y, x] as const);
}

// Cells for every rotation of every piece. The O square is unchanged by rotation.
const STATES = {} as Record<PieceType, Cell[][]>;
for (const type of PIECE_TYPES) {
  const states: Cell[][] = [[...SPAWN_CELLS[type]]];
  for (let rotation = 1; rotation < 4; rotation++) {
    states.push(rotateClockwise(states[rotation - 1], BOX_SIZE[type]));
  }
  STATES[type] = states;
}

export function pieceCells(type: PieceType, rotation: Rotation): readonly Cell[] {
  return STATES[type][rotation];
}

const JLSTZ_KICKS: Record<string, readonly Kick[]> = {
  '0>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '1>0': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '1>2': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '2>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '2>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '3>2': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '3>0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '0>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
};

const I_KICKS: Record<string, readonly Kick[]> = {
  '0>1': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '1>0': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '1>2': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  '2>1': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '2>3': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '3>2': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '3>0': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '0>3': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
};

const NO_KICKS: readonly Kick[] = [[0, 0]];

/** Offsets to try, in order, when rotating from one rotation state to another. */
export function kickTests(type: PieceType, from: Rotation, to: Rotation): readonly Kick[] {
  if (type === 'O') return NO_KICKS;
  const table = type === 'I' ? I_KICKS : JLSTZ_KICKS;
  return table[`${from}>${to}`];
}
