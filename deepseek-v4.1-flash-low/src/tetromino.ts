/**
 * Tetromino definitions: shapes, colors and Super Rotation System (SRS)
 * wall-kick data.
 */

export type PieceType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';
export type Rotation = 0 | 1 | 2 | 3;

export const PIECE_TYPES: readonly PieceType[] = [
  'I',
  'J',
  'L',
  'O',
  'S',
  'T',
  'Z',
];

/** Guideline colors, one per shape. */
export const COLORS: Readonly<Record<PieceType, string>> = {
  I: '#22d3ee',
  J: '#3b82f6',
  L: '#f59e0b',
  O: '#facc15',
  S: '#22c55e',
  T: '#a855f7',
  Z: '#ef4444',
};

type Matrix = number[][];
export type Cell = readonly [x: number, y: number];

const SPAWN_MATRICES: Readonly<Record<PieceType, Matrix>> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
};

function rotateCW(matrix: Matrix): Matrix {
  const size = matrix.length;
  const result: Matrix = Array.from({ length: size }, () =>
    Array<number>(size).fill(0),
  );

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      result[x][size - 1 - y] = matrix[y][x];
    }
  }

  return result;
}

function cellsFromMatrix(matrix: Matrix): Cell[] {
  const cells: Cell[] = [];

  for (let y = 0; y < matrix.length; y += 1) {
    for (let x = 0; x < matrix[y].length; x += 1) {
      if (matrix[y][x] === 1) {
        cells.push([x, y]);
      }
    }
  }

  return cells;
}

const ROTATIONS: Readonly<Record<PieceType, readonly Cell[][]>> = (() => {
  const result = {} as Record<PieceType, readonly Cell[][]>;

  for (const type of PIECE_TYPES) {
    const states: Cell[][] = [];
    let matrix = SPAWN_MATRICES[type];

    for (let rotation = 0; rotation < 4; rotation += 1) {
      states.push(cellsFromMatrix(matrix));
      // The O piece is symmetric: rotating it would only shift its cells.
      if (type !== 'O') {
        matrix = rotateCW(matrix);
      }
    }

    result[type] = states;
  }

  return result;
})();

/** Occupied cells of a piece, relative to its matrix origin. */
export function getCells(type: PieceType, rotation: Rotation): readonly Cell[] {
  return ROTATIONS[type][rotation];
}

/** Spawn column for a piece so that it is horizontally centered. */
export function spawnX(type: PieceType): number {
  return type === 'O' ? 4 : 3;
}

/** Spawn row for a piece, inside the hidden buffer rows. */
export function spawnY(type: PieceType): number {
  return type === 'I' ? -1 : 0;
}

/**
 * SRS kick offsets, expressed in Guideline coordinates where positive Y is
 * up. The game board uses positive Y down, so `kicksFor` flips the sign.
 */
type KickTable = Readonly<Record<string, readonly Cell[]>>;

const JLSTZ_KICKS: KickTable = {
  '0>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '1>0': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '1>2': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '2>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '2>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '3>2': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '3>0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '0>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
};

const I_KICKS: KickTable = {
  '0>1': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '1>0': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '1>2': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  '2>1': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '2>3': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '3>2': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '3>0': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '0>3': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
};

const NO_KICKS: readonly Cell[] = [[0, 0]];

/** Test offsets for a rotation, in screen coordinates (positive Y down). */
export function kicksFor(
  type: PieceType,
  from: Rotation,
  to: Rotation,
): readonly Cell[] {
  if (type === 'O') {
    return NO_KICKS;
  }

  const table = type === 'I' ? I_KICKS : JLSTZ_KICKS;
  const offsets = table[`${from}>${to}`] ?? NO_KICKS;

  return offsets.map(([x, y]) => [x, -y] as const);
}
