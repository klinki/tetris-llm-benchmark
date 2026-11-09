import type { Cell, Matrix, PieceType } from './types.js';

export const BOARD_WIDTH = 10;
export const VISIBLE_HEIGHT = 20;
/** Rows above the visible field that pieces spawn in and may be kicked into. */
export const HIDDEN_ROWS = 2;
export const BOARD_HEIGHT = VISIBLE_HEIGHT + HIDDEN_ROWS;
/** Top-left of a piece's bounding box at spawn (all boxes are 3 or 4 wide). */
export const SPAWN_X = 3;
export const SPAWN_Y = 1;

function emptyRows(): Matrix {
  return Array.from({ length: BOARD_HEIGHT }, () => Array<Cell>(BOARD_WIDTH).fill(null));
}

export class Board {
  cells: Matrix = emptyRows();

  clear(): void {
    this.cells = emptyRows();
  }

  /**
   * True when a piece cell at (x, y) would collide. Cells above the matrix
   * (y < 0) are open air; the walls and the floor are solid. Walls/floor
   * counting as filled is also what makes corner-based T-Spin detection work.
   */
  isOccupied(x: number, y: number): boolean {
    if (y < 0) return false;
    if (y >= BOARD_HEIGHT || x < 0 || x >= BOARD_WIDTH) return true;
    return this.cells[y][x] !== null;
  }

  set(x: number, y: number, type: PieceType): void {
    if (x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT) {
      this.cells[y][x] = type;
    }
  }

  /** Remove every full row, shifting rows above down; return the count. */
  clearLines(): number {
    const kept = this.cells.filter((row) => row.some((cell) => cell === null));
    const cleared = BOARD_HEIGHT - kept.length;
    while (kept.length < BOARD_HEIGHT) {
      kept.unshift(Array<Cell>(BOARD_WIDTH).fill(null));
    }
    this.cells = kept;
    return cleared;
  }

  isEmpty(): boolean {
    return this.cells.every((row) => row.every((cell) => cell === null));
  }

  snapshot(): Matrix {
    return this.cells.map((row) => [...row]);
  }
}
