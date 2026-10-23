import { COLS, ROWS, Cell, PieceType, Point } from './types';
import { pieceCells, Piece } from './tetromino';

export function createBoard(): Cell[][] {
  const board: Cell[][] = [];
  for (let y = 0; y < ROWS; y++) {
    board.push(new Array(COLS).fill(null));
  }
  return board;
}

export function cell(board: Cell[][], x: number, y: number): Cell {
  if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return null;
  return board[y][x];
}

export function setCell(board: Cell[][], x: number, y: number, value: Cell) {
  if (x >= 0 && x < COLS && y >= 0 && y < ROWS) board[y][x] = value;
}

// Returns true if none of the piece's cells collide with the board bounds or
// occupied cells.
export function collides(board: Cell[][], piece: Piece): boolean {
  for (const p of pieceCells(piece)) {
    if (p.x < 0 || p.x >= COLS || p.y >= ROWS) return true;
    if (p.y >= 0 && board[p.y][p.x] !== null) return true;
  }
  return false;
}

// Lock the piece into the board, coloring each occupied cell.
export function lockPiece(board: Cell[][], piece: Piece) {
  for (const p of pieceCells(piece)) {
    if (p.y >= 0 && p.y < ROWS && p.x >= 0 && p.x < COLS) {
      board[p.y][p.x] = piece.type;
    }
  }
}

// Clear full lines and return the number of lines cleared. New empty rows are
// added at the top.
export function clearLines(board: Cell[][]): number {
  let cleared = 0;
  let y = 0;
  while (y < board.length) {
    const full = board[y].every((c) => c !== null);
    if (full) {
      board.splice(y, 1);
      board.unshift(new Array(COLS).fill(null));
      cleared++;
    } else {
      y++;
    }
  }
  return cleared;
}
