// Playfield grid helpers. Cells hold the piece type that occupies them, or null.

import { COLS, ROWS } from './constants.js';
import type { PieceType } from './pieces.js';

export type Board = (PieceType | null)[][];

export function createBoard(): Board {
  return Array.from({ length: ROWS }, () => Array<PieceType | null>(COLS).fill(null));
}

export function fullRows(board: Board): number[] {
  const rows: number[] = [];
  for (let y = 0; y < ROWS; y++) {
    if (board[y].every((cell) => cell !== null)) rows.push(y);
  }
  return rows;
}

// Removes the given rows and shifts everything above them down.
export function removeRows(board: Board, rows: number[]): void {
  for (const y of [...rows].sort((a, b) => b - a)) board.splice(y, 1);
  while (board.length < ROWS) board.unshift(Array<PieceType | null>(COLS).fill(null));
}

export function isEmpty(board: Board): boolean {
  return board.every((row) => row.every((cell) => cell === null));
}
