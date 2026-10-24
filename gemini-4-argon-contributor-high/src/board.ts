import { getPieceCells } from './tetrominoes.js';
import { CellValue, RotationState, TetrominoType } from './types.js';

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
export const BUFFER_HEIGHT = 4;

/**
 * Creates an empty playfield matrix of height rows by width columns.
 */
export function createEmptyBoard(
  width: number = BOARD_WIDTH,
  height: number = BOARD_HEIGHT
): CellValue[][] {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => null)
  );
}

/**
 * Deep clones a board matrix.
 */
export function cloneBoard(board: CellValue[][]): CellValue[][] {
  return board.map((row) => [...row]);
}

/**
 * Checks whether a piece of `type` can occupy `(x, y, rotation)` on `board`.
 * Cells above the visible board (`-BUFFER_HEIGHT <= cy < 0`) are permitted as empty buffer space.
 */
export function isValidPiecePosition(
  board: CellValue[][],
  type: TetrominoType,
  x: number,
  y: number,
  rotation: RotationState
): boolean {
  const height = board.length;
  const width = board[0]?.length ?? BOARD_WIDTH;
  const cells = getPieceCells(type, x, y, rotation);

  for (const cell of cells) {
    if (cell.x < 0 || cell.x >= width) {
      return false;
    }
    if (cell.y >= height || cell.y < -BUFFER_HEIGHT) {
      return false;
    }
    if (cell.y >= 0 && board[cell.y]?.[cell.x] !== null) {
      return false;
    }
  }
  return true;
}

/**
 * Clears full horizontal lines from the board in-place and returns the cleared row indices.
 */
export function clearFullLines(board: CellValue[][]): number[] {
  const width = board[0]?.length ?? BOARD_WIDTH;
  const height = board.length;
  const clearedRowIndices: number[] = [];
  const remainingRows: CellValue[][] = [];

  for (let y = 0; y < height; y++) {
    const row = board[y]!;
    if (row.every((cell) => cell !== null)) {
      clearedRowIndices.push(y);
    } else {
      remainingRows.push(row);
    }
  }

  if (clearedRowIndices.length > 0) {
    const newEmptyRows = Array.from({ length: clearedRowIndices.length }, () =>
      Array.from({ length: width }, () => null as CellValue)
    );
    board.splice(0, height, ...newEmptyRows, ...remainingRows);
  }

  return clearedRowIndices;
}
