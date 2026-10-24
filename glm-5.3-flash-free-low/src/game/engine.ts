/**
 * Core Tetris engine primitives: board model, SRS matrices and rotations,
 * wall-kick tables and the 7-bag shuffle. This module is free of DOM code so
 * the logic stays testable on its own.
 */

export const COLS = 10;
export const ROWS = 20;

export type Cell = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type Board = Cell[][];

export type PieceId = 0 | 1 | 2 | 3 | 4 | 5 | 6; // I J L O S T Z

export interface Piece {
  id: PieceId;
  /** Column of the top-left corner of the piece matrix. */
  x: number;
  /** Row of the top-left corner of the piece matrix. */
  y: number;
  rotation: 0 | 1 | 2 | 3;
}

export const COLORS: Record<PieceId, string> = {
  0: '#00bcd4', // I — cyan
  1: '#3f51b5', // J — blue
  2: '#ff9800', // L — orange
  3: '#ffeb3b', // O — yellow
  4: '#4caf50', // S — green
  5: '#9c27b0', // T — purple
  6: '#f44336', // Z — red
};

/** Spawn orientation matrices (SRS: 4×4 for I, 2×2 for O, 3×3 for the rest). */
const MATRICES: number[][][] = [
  [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], // I
  [[1, 0, 0], [1, 1, 1], [0, 0, 0]], // J
  [[0, 0, 1], [1, 1, 1], [0, 0, 0]], // L
  [[1, 1], [1, 1]], // O
  [[0, 1, 1], [1, 1, 0], [0, 0, 0]], // S
  [[0, 1, 0], [1, 1, 1], [0, 0, 0]], // T
  [[1, 1, 0], [0, 1, 1], [0, 0, 0]], // Z
];

/** shapes[id][rotation] lists filled cells as (x, y) matrix offsets. */
const SHAPES: number[][][][] = MATRICES.map((matrix) => {
  const variants: number[][][] = [];
  let current = matrix;
  for (let r = 0; r < 4; r++) {
    if (r > 0) {
      current = rotateMatrix(current);
    }
    variants.push(filledCells(current));
  }
  return variants;
});

/** Rotates a square matrix 90° clockwise. */
function rotateMatrix(matrix: number[][]): number[][] {
  const size = matrix.length;
  const out: number[][] = Array.from({ length: size }, () => Array.from({ length: size }, () => 0));
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      out[c][size - 1 - r] = matrix[r][c];
    }
  }
  return out;
}

function filledCells(matrix: number[][]): number[][] {
  const cells: number[][] = [];
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c] === 1) {
        cells.push([c, r]);
      }
    }
  }
  return cells;
}

/**
 * SRS wall-kick data for J, L, S, T, Z. Entries are (dx, dy) offsets in board
 * coordinates (y grows downward), so the guideline's y-up tests have their y
 * sign flipped here.
 */
export const KICKS_JLSTZ: Record<string, number[][]> = {
  '0>1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '1>0': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '1>2': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '2>1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '2>3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '3>2': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '3>0': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '0>3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
};

/** SRS wall-kick data for I. */
export const KICKS_I: Record<string, number[][]> = {
  '0>1': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  '1>0': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  '1>2': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
  '2>1': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  '2>3': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  '3>2': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  '3>0': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  '0>3': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
};

export function emptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => 0 as Cell));
}

/** Cells occupied by a piece with a given rotation, as (x, y) matrix offsets. */
export function pieceCells(id: PieceId, rotation: number): number[][] {
  return SHAPES[id][((rotation % 4) + 4) % 4];
}

/** Absolute occupied cells of a piece positioned on the board. */
export function absoluteCells(piece: Piece): number[][] {
  return pieceCells(piece.id, piece.rotation).map(([cx, cy]) => [piece.x + cx, piece.y + cy]);
}

/** Fisher–Yates shuffle, used by the 7-bag randomizer. */
export function shuffle<T>(items: T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}
