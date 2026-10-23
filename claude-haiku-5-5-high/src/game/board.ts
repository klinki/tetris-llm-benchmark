import type { Cell, PieceType } from './pieces.js';

export const BOARD_WIDTH = 10;
/** Total rows, including the hidden buffer above the visible field. */
export const BOARD_HEIGHT = 40;
/** Rows with an index below this are hidden; rows from here down are visible. */
export const VISIBLE_TOP = BOARD_HEIGHT - 20;

export class Board {
  private readonly cells: (PieceType | null)[] = new Array<PieceType | null>(
    BOARD_WIDTH * BOARD_HEIGHT,
  ).fill(null);

  get(x: number, y: number): PieceType | null {
    return this.cells[y * BOARD_WIDTH + x];
  }

  set(x: number, y: number, type: PieceType | null): void {
    this.cells[y * BOARD_WIDTH + x] = type;
  }

  /** True when the position is inside the board and empty. */
  isFree(x: number, y: number): boolean {
    return x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT && this.get(x, y) === null;
  }

  /** True when every block of a shape placed at (x, y) would sit on a free cell. */
  fits(shape: readonly Cell[], x: number, y: number): boolean {
    return shape.every(([dx, dy]) => this.isFree(x + dx, y + dy));
  }

  isEmpty(): boolean {
    return this.cells.every((cell) => cell === null);
  }

  clear(): void {
    this.cells.fill(null);
  }

  /** Removes full rows, shifts the rest down, and returns how many rows were removed. */
  clearFullRows(): number {
    let write = BOARD_HEIGHT - 1;
    let cleared = 0;
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (this.isRowFull(y)) {
        cleared++;
        continue;
      }
      if (write !== y) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
          this.set(x, write, this.get(x, y));
        }
      }
      write--;
    }
    for (let y = write; y >= 0; y--) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        this.set(x, y, null);
      }
    }
    return cleared;
  }

  private isRowFull(y: number): boolean {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      if (this.get(x, y) === null) return false;
    }
    return true;
  }
}
