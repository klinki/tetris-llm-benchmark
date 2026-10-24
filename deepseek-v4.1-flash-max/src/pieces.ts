/**
 * Tetromino geometry, spawn positions and Super Rotation System kick tables.
 *
 * Shapes are stored as matrices and rotated at module load so that every
 * rotation state matches the SRS box rotation used by the Guideline.
 */

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

export type PieceType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';
export type Rotation = 0 | 1 | 2 | 3;

export interface Cell {
  x: number;
  y: number;
}

export interface Piece {
  type: PieceType;
  rotation: Rotation;
  x: number;
  y: number;
}

export const PIECE_TYPES: readonly PieceType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

/** One distinct, high-contrast colour per tetromino. */
export const PIECE_COLORS: Record<PieceType, string> = {
  I: '#3ddbd9',
  J: '#5b8cff',
  L: '#ffa94d',
  O: '#ffd43b',
  S: '#51cf66',
  T: '#b197fc',
  Z: '#ff6b6b',
};

/** Spawn-orientation matrices. 1 = mino, 0 = empty. */
const SHAPE_MATRICES: Record<PieceType, readonly (readonly number[])[]> = {
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

function rotateClockwise(matrix: readonly (readonly number[])[]): number[][] {
  const size = matrix.length;
  const result: number[][] = Array.from({ length: size }, () => Array<number>(size).fill(0));
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      result[y][x] = matrix[size - 1 - x][y];
    }
  }
  return result;
}

function occupiedCells(matrix: readonly (readonly number[])[]): Cell[] {
  const cells: Cell[] = [];
  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < matrix[y].length; x++) {
      if (matrix[y][x] !== 0) cells.push({ x, y });
    }
  }
  return cells;
}

const SHAPES: Record<PieceType, readonly (readonly Cell[])[]> = (() => {
  const shapes = {} as Record<PieceType, readonly (readonly Cell[])[]>;
  for (const type of PIECE_TYPES) {
    const rotations: Cell[][] = [];
    let matrix = SHAPE_MATRICES[type];
    for (let rotation = 0; rotation < 4; rotation++) {
      rotations.push(occupiedCells(matrix));
      matrix = rotateClockwise(matrix);
    }
    shapes[type] = rotations;
  }
  return shapes;
})();

export function cellsFor(type: PieceType, rotation: Rotation): readonly Cell[] {
  return SHAPES[type][rotation];
}

export function matrixSize(type: PieceType): number {
  return SHAPE_MATRICES[type].length;
}

/** Board-space coordinates of every mino in a piece. */
export function absoluteCells(piece: Piece): Cell[] {
  return cellsFor(piece.type, piece.rotation).map((cell) => ({
    x: piece.x + cell.x,
    y: piece.y + cell.y,
  }));
}

/**
 * Pieces spawn centred at the top of the playfield. The matrices are laid out
 * so the lowest occupied row is always row 1.
 */
export function spawnPiece(type: PieceType): Piece {
  const size = matrixSize(type);
  return {
    type,
    rotation: 0,
    x: Math.floor((BOARD_WIDTH - size) / 2),
    y: 0,
  };
}

/*
 * SRS wall kicks. The canonical tables use a y-up coordinate system, so the
 * offsets below are already converted to screen space (positive y down).
 */
const JLSTZ_KICKS: Readonly<Record<string, readonly Cell[]>> = {
  '0>1': [
    { x: 0, y: 0 },
    { x: -1, y: 0 },
    { x: -1, y: -1 },
    { x: 0, y: 2 },
    { x: -1, y: 2 },
  ],
  '1>0': [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: -2 },
    { x: 1, y: -2 },
  ],
  '1>2': [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: -2 },
    { x: 1, y: -2 },
  ],
  '2>1': [
    { x: 0, y: 0 },
    { x: -1, y: 0 },
    { x: -1, y: -1 },
    { x: 0, y: 2 },
    { x: -1, y: 2 },
  ],
  '2>3': [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: -1 },
    { x: 0, y: 2 },
    { x: 1, y: 2 },
  ],
  '3>2': [
    { x: 0, y: 0 },
    { x: -1, y: 0 },
    { x: -1, y: 1 },
    { x: 0, y: -2 },
    { x: -1, y: -2 },
  ],
  '3>0': [
    { x: 0, y: 0 },
    { x: -1, y: 0 },
    { x: -1, y: 1 },
    { x: 0, y: -2 },
    { x: -1, y: -2 },
  ],
  '0>3': [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: -1 },
    { x: 0, y: 2 },
    { x: 1, y: 2 },
  ],
};

const I_KICKS: Readonly<Record<string, readonly Cell[]>> = {
  '0>1': [
    { x: 0, y: 0 },
    { x: -2, y: 0 },
    { x: 1, y: 0 },
    { x: -2, y: 1 },
    { x: 1, y: -2 },
  ],
  '1>0': [
    { x: 0, y: 0 },
    { x: 2, y: 0 },
    { x: -1, y: 0 },
    { x: 2, y: -1 },
    { x: -1, y: 2 },
  ],
  '1>2': [
    { x: 0, y: 0 },
    { x: -1, y: 0 },
    { x: 2, y: 0 },
    { x: -1, y: -2 },
    { x: 2, y: 1 },
  ],
  '2>1': [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: -2, y: 0 },
    { x: 1, y: 2 },
    { x: -2, y: -1 },
  ],
  '2>3': [
    { x: 0, y: 0 },
    { x: 2, y: 0 },
    { x: -1, y: 0 },
    { x: 2, y: -1 },
    { x: -1, y: 2 },
  ],
  '3>2': [
    { x: 0, y: 0 },
    { x: -2, y: 0 },
    { x: 1, y: 0 },
    { x: -2, y: 1 },
    { x: 1, y: -2 },
  ],
  '3>0': [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: -2, y: 0 },
    { x: 1, y: 2 },
    { x: -2, y: -1 },
  ],
  '0>3': [
    { x: 0, y: 0 },
    { x: -1, y: 0 },
    { x: 2, y: 0 },
    { x: -1, y: -2 },
    { x: 2, y: 1 },
  ],
};

export function getKicks(type: PieceType, from: Rotation, to: Rotation): readonly Cell[] {
  if (type === 'O') return [{ x: 0, y: 0 }];
  const table = type === 'I' ? I_KICKS : JLSTZ_KICKS;
  return table[`${from}>${to}`] ?? [{ x: 0, y: 0 }];
}

/** Bounding box of a shape in its local matrix coordinates. */
export function shapeBounds(
  type: PieceType,
  rotation: Rotation,
): { minX: number; maxX: number; minY: number; maxY: number } {
  const cells = cellsFor(type, rotation);
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const cell of cells) {
    minX = Math.min(minX, cell.x);
    maxX = Math.max(maxX, cell.x);
    minY = Math.min(minY, cell.y);
    maxY = Math.max(maxY, cell.y);
  }
  return { minX, maxX, minY, maxY };
}
