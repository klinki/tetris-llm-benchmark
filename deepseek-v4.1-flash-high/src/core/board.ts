import { BOARD_HEIGHT, BOARD_WIDTH } from "./constants.js";
import type { Point } from "./pieces.js";
import type { PieceType } from "./types.js";

export type CellValue = PieceType | null;

/**
 * The playfield. Rows 0..HIDDEN_ROWS-1 sit above the visible area; cells above
 * the grid (negative rows) count as free space so pieces can kick upwards.
 */
export class Board {
  readonly width = BOARD_WIDTH;
  readonly height = BOARD_HEIGHT;
  private cells: CellValue[][] = [];

  constructor() {
    this.reset();
  }

  reset(): void {
    this.cells = Array.from({ length: this.height }, () =>
      new Array<CellValue>(this.width).fill(null),
    );
  }

  getCell(x: number, y: number): CellValue {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
    return this.cells[y][x];
  }

  setCell(x: number, y: number, value: CellValue): void {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    this.cells[y][x] = value;
  }

  /** True for walls, floor and occupied cells. Space above the board is free. */
  isBlocked(x: number, y: number): boolean {
    if (x < 0 || x >= this.width || y >= this.height) return true;
    if (y < 0) return false;
    return this.cells[y][x] !== null;
  }

  canPlace(cells: readonly Point[]): boolean {
    return cells.every((cell) => !this.isBlocked(cell.x, cell.y));
  }

  isRowFull(y: number): boolean {
    if (y < 0 || y >= this.height) return false;
    return this.cells[y].every((value) => value !== null);
  }

  isRowEmpty(y: number): boolean {
    if (y < 0 || y >= this.height) return false;
    return this.cells[y].every((value) => value === null);
  }

  /** Removes all full rows and returns their original row indices. */
  clearLines(): number[] {
    const cleared: number[] = [];
    for (let y = 0; y < this.height; y += 1) {
      if (this.isRowFull(y)) cleared.push(y);
    }
    if (cleared.length === 0) return cleared;

    const kept = this.cells.filter((_, y) => !cleared.includes(y));
    const empty = Array.from({ length: cleared.length }, () =>
      new Array<CellValue>(this.width).fill(null),
    );
    this.cells = [...empty, ...kept];
    return cleared;
  }

  isPerfectClear(): boolean {
    return this.cells.every((row) => row.every((value) => value === null));
  }
}
