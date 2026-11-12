/**
 * Tetromino definitions.
 *
 * Each piece is described by a bounding box matrix in its spawn state.
 * The other three rotation states are derived by rotating the matrix
 * clockwise, which is exactly how the Super Rotation System defines
 * the JLSTZ and I piece geometry.
 */

export type PieceType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

export const PIECE_TYPES: PieceType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

export const COLORS: Record<PieceType, string> = {
  I: '#22d3ee',
  J: '#3b82f6',
  L: '#f97316',
  O: '#facc15',
  S: '#22c55e',
  T: '#a855f7',
  Z: '#ef4444',
};

/** Spawn matrices. `X` marks a filled cell, `.` an empty one. */
const SPAWN_MATRICES: Record<PieceType, string[]> = {
  I: ['....', 'XXXX', '....', '....'],
  J: ['X..', 'XXX', '...'],
  L: ['..X', 'XXX', '...'],
  O: ['XX', 'XX'],
  S: ['.XX', 'XX.', '...'],
  T: ['.X.', 'XXX', '...'],
  Z: ['XX.', '.XX', '...'],
};

/** Box size of each piece (3x3, 4x4 or 2x2). */
const BOX_SIZE: Record<PieceType, number> = {
  I: 4,
  J: 3,
  L: 3,
  O: 2,
  S: 3,
  T: 3,
  Z: 3,
};

export type Cell = { dx: number; dy: number };

function rotateMatrixClockwise(matrix: string[]): string[] {
  const n = matrix.length;
  const out: string[] = [];
  for (let y = 0; y < n; y++) {
    let row = '';
    for (let x = 0; x < n; x++) {
      row += matrix[n - 1 - x][y];
    }
    out.push(row);
  }
  return out;
}

function matrixToCells(matrix: string[]): Cell[] {
  const cells: Cell[] = [];
  matrix.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] === 'X') cells.push({ dx: x, dy: y });
    }
  });
  return cells;
}

/** Precomputed cells for every piece type and rotation state. */
export const SHAPES: Record<PieceType, Cell[][]> = (() => {
  const shapes = {} as Record<PieceType, Cell[][]>;
  for (const type of PIECE_TYPES) {
    const states: Cell[][] = [];
    let matrix = SPAWN_MATRICES[type];
    for (let r = 0; r < 4; r++) {
      states.push(matrixToCells(matrix));
      matrix = rotateMatrixClockwise(matrix);
    }
    shapes[type] = states;
  }
  return shapes;
})();

export function boxSize(type: PieceType): number {
  return BOX_SIZE[type];
}

/**
 * Horizontal spawn offset of the piece bounding box.
 * Guideline: J/L/S/T/Z occupy columns 3-5, I occupies columns 3-6 and
 * O occupies columns 4-5 of a 10 wide field.
 */
export function spawnX(type: PieceType): number {
  switch (type) {
    case 'O':
      return 4;
    case 'I':
      return 3;
    default:
      return 3;
  }
}

/** Vertical spawn offset: pieces appear just below the top of the field. */
export function spawnY(type: PieceType): number {
  return type === 'I' ? 0 : 0;
}
