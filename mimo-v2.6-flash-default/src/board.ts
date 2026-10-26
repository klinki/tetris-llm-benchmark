import { COLS, HIDDEN_ROWS, ROWS } from './constants.js';
import type { PieceType } from './constants.js';
import type { Cells } from './pieces.js';

/** The playfield grid. Row 0 is the top of the hidden buffer, row ROWS-1 the floor. */
export class Board {
  readonly cols: number;
  readonly rows: number;
  private grid: (PieceType | null)[][];

  constructor(cols = COLS, rows = ROWS) {
    this.cols = cols;
    this.rows = rows;
    this.grid = Board.emptyGrid(rows, cols);
  }

  reset(): void {
    this.grid = Board.emptyGrid(this.rows, this.cols);
  }

  /** Cell content, or null when empty or outside the board. */
  get(x: number, y: number): PieceType | null {
    if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return null;
    return this.grid[y][x];
  }

  set(x: number, y: number, type: PieceType): void {
    if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) this.grid[y][x] = type;
  }

  /** True when a cell blocks movement: walls, floor and locked cells. Rows above the buffer are free. */
  isOccupied(x: number, y: number): boolean {
    if (x < 0 || x >= this.cols) return true;
    if (y >= this.rows) return true;
    if (y < 0) return false;
    return this.grid[y][x] !== null;
  }

  collides(cells: Cells, x: number, y: number): boolean {
    for (const [cx, cy] of cells) {
      if (this.isOccupied(x + cx, y + cy)) return true;
    }
    return false;
  }

  lock(cells: Cells, x: number, y: number, type: PieceType): void {
    for (const [cx, cy] of cells) this.set(x + cx, y + cy, type);
  }

  /** How far the piece can fall from (x, y) before it hits something. */
  dropDistance(cells: Cells, x: number, y: number): number {
    let distance = 0;
    while (!this.collides(cells, x, y + distance + 1)) distance++;
    return distance;
  }

  rowFull(y: number): boolean {
    for (let x = 0; x < this.cols; x++) {
      if (this.grid[y][x] === null) return false;
    }
    return true;
  }

  /** Removes completed rows, shifts the stack down and returns the number of cleared rows. */
  clearLines(): number {
    let cleared = 0;
    for (let y = this.rows - 1; y >= 0; y--) {
      if (this.rowFull(y)) {
        cleared++;
      } else if (cleared > 0) {
        this.grid[y + cleared] = this.grid[y];
      }
    }
    for (let y = 0; y < cleared; y++) this.grid[y] = Board.emptyRow(this.cols);
    return cleared;
  }

  /** True when no cell is filled (a "perfect clear"). */
  isPerfectClear(): boolean {
    return this.filledCells() === 0;
  }

  /** Number of filled cells, handy for tests. */
  filledCells(): number {
    let count = 0;
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (this.grid[y][x] !== null) count++;
      }
    }
    return count;
  }

  /** True when the given rows are inside the visible field (used by the renderer). */
  static isVisibleRow(y: number): boolean {
    return y >= HIDDEN_ROWS;
  }

  private static emptyRow(cols: number): (PieceType | null)[] {
    return new Array<PieceType | null>(cols).fill(null);
  }

  private static emptyGrid(rows: number, cols: number): (PieceType | null)[][] {
    const grid: (PieceType | null)[][] = [];
    for (let y = 0; y < rows; y++) grid.push(Board.emptyRow(cols));
    return grid;
  }
}
