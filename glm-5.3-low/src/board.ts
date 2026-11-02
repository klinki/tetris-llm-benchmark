import { BOARD_HEIGHT, BOARD_WIDTH } from './constants.js';
import type { Cell, PieceType } from './tetromino.js';

export type Square = PieceType | null;

export class Board {
  readonly width = BOARD_WIDTH;
  readonly height = BOARD_HEIGHT;
  private squares: Square[][] = Board.emptyGrid();

  private static emptyGrid(): Square[][] {
    return Array.from({ length: BOARD_HEIGHT }, () =>
      Array<Square>(BOARD_WIDTH).fill(null),
    );
  }

  /** Anything outside the playfield (walls, floor, above the ceiling) counts as solid. */
  isOccupied(x: number, y: number): boolean {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return true;
    return this.squares[y][x] !== null;
  }

  get(x: number, y: number): Square {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
    return this.squares[y][x];
  }

  set(x: number, y: number, value: Square): void {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.squares[y][x] = value;
    }
  }

  /** True when every cell of `cells` translated by (x, y) is inside the field and free. */
  canPlace(cells: readonly Cell[], x: number, y: number): boolean {
    return cells.every(c => !this.isOccupied(x + c.x, y + c.y));
  }

  /** Removes every full row (shifting the stack down); returns how many were cleared. */
  clearLines(): number {
    const kept = this.squares.filter(row => row.some(square => square === null));
    const cleared = this.height - kept.length;
    while (kept.length < this.height) {
      kept.unshift(Array<Square>(this.width).fill(null));
    }
    this.squares = kept;
    return cleared;
  }
}
