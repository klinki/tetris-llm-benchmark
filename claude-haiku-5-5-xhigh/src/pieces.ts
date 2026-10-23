export const PIECE_TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'] as const;

export type PieceType = (typeof PIECE_TYPES)[number];

/** 0 = spawn, 1 = clockwise, 2 = half turn, 3 = counter-clockwise. */
export type Rotation = 0 | 1 | 2 | 3;

export interface Point {
  x: number;
  y: number;
}

/** Wall kick offset [x, y]. Y points up, as in the SRS tables, so screen rows subtract it. */
export type Kick = [number, number];

// Guideline colours; every shape has its own.
export const PIECE_COLORS: Record<PieceType, string> = {
  I: '#00f0f0',
  O: '#f0f000',
  T: '#a000f0',
  S: '#00f000',
  Z: '#f00000',
  J: '#0000f0',
  L: '#f0a000',
};

// Spawn orientation of each shape. 'X' is a filled cell.
const SPAWN_GRIDS: Record<PieceType, string[]> = {
  I: ['....', 'XXXX', '....', '....'],
  O: ['XX', 'XX'],
  T: ['.X.', 'XXX', '...'],
  S: ['.XX', 'XX.', '...'],
  Z: ['XX.', '.XX', '...'],
  J: ['X..', 'XXX', '...'],
  L: ['..X', 'XXX', '...'],
};

const ROTATIONS: Record<PieceType, Point[][]> = Object.fromEntries(
  PIECE_TYPES.map((type) => [type, rotationsOf(type)]),
) as Record<PieceType, Point[][]>;

// SRS wall kicks, from the Tetris Wiki. Keys are "from>to" rotations.
const JLSTZ_KICKS: Record<string, Kick[]> = {
  '0>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '1>0': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '1>2': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '2>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '2>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '3>2': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '3>0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '0>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
};

const I_KICKS: Record<string, Kick[]> = {
  '0>1': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '1>0': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '1>2': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  '2>1': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '2>3': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '3>2': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '3>0': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '0>3': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
};

// The O piece looks the same in every rotation, so a plain rotation is always enough.
const O_KICKS: Kick[] = [[0, 0]];

/** Filled cells of every rotation, relative to the top-left corner of the piece's box. */
export function pieceCells(type: PieceType, rotation: Rotation): Point[] {
  return ROTATIONS[type][rotation];
}

/** Width and height of the square box a shape is drawn in. */
export function boxSize(type: PieceType): number {
  return SPAWN_GRIDS[type].length;
}

/** Kick offsets to try, in order, when rotating from one rotation to another. */
export function kickTests(type: PieceType, from: Rotation, to: Rotation): Kick[] {
  if (type === 'O') return O_KICKS;
  const table = type === 'I' ? I_KICKS : JLSTZ_KICKS;
  return table[`${from}>${to}`];
}

function rotationsOf(type: PieceType): Point[][] {
  const rotations: Point[][] = [];
  let grid = SPAWN_GRIDS[type].map((row) => [...row].map((ch) => ch === 'X'));
  for (let r = 0; r < 4; r++) {
    rotations.push(filledCells(grid));
    grid = rotateClockwise(grid);
  }
  return rotations;
}

function rotateClockwise(grid: boolean[][]): boolean[][] {
  const n = grid.length;
  return grid.map((_, y) => grid.map((_, x) => grid[n - 1 - x][y]));
}

function filledCells(grid: boolean[][]): Point[] {
  return grid.flatMap((row, y) => row.flatMap((on, x) => (on ? [{ x, y }] : [])));
}
