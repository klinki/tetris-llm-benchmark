import { BOARD_WIDTH, TOTAL_ROWS } from './constants.js';
import { pieceCells } from './pieces.js';
import { Cell, PieceType, Rotation } from './types.js';

export function createBoard(): Cell[][] {
  return Array.from({ length: TOTAL_ROWS }, () => emptyRow());
}

function emptyRow(): Cell[] {
  return new Array<Cell>(BOARD_WIDTH).fill(null);
}

export function isFree(board: Cell[][], type: PieceType, rotation: Rotation, x: number, y: number): boolean {
  return pieceCells(type, rotation).every(({ x: dx, y: dy }) => {
    const bx = x + dx;
    const by = y + dy;
    if (bx < 0 || bx >= BOARD_WIDTH || by >= TOTAL_ROWS) return false;
    // Rows above the board are open, so pieces can spawn partly out of sight.
    return by < 0 || board[by][bx] === null;
  });
}

export function lockPiece(board: Cell[][], type: PieceType, rotation: Rotation, x: number, y: number): void {
  for (const { x: dx, y: dy } of pieceCells(type, rotation)) {
    board[y + dy][x + dx] = type;
  }
}

// Removes every full row, drops the rows above them, and returns how many were removed.
export function clearFullRows(board: Cell[][]): number {
  let cleared = 0;
  for (let y = board.length - 1; y >= 0;) {
    if (board[y].every((cell) => cell !== null)) {
      board.splice(y, 1);
      board.unshift(emptyRow());
      cleared++;
    } else {
      y--;
    }
  }
  return cleared;
}

export function isBoardEmpty(board: Cell[][]): boolean {
  return board.every((row) => row.every((cell) => cell === null));
}
