import { pieceCells, type PieceType, type Rotation } from './pieces.js';

export const COLS = 10;
/** Rows above the visible playfield where pieces spawn. */
export const HIDDEN_ROWS = 2;
export const VISIBLE_ROWS = 20;
export const ROWS = VISIBLE_ROWS + HIDDEN_ROWS;

export type Cell = PieceType | null;

/** The matrix of locked blocks. Row 0 is the top (hidden) row. */
export class Board {
  private cells: Cell[] = new Array(COLS * ROWS).fill(null);

  get(x: number, y: number): Cell {
    return this.cells[y * COLS + x];
  }

  set(x: number, y: number, type: Cell): void {
    this.cells[y * COLS + x] = type;
  }

  /** Anything outside the left, right or bottom wall counts as filled; space above the top is free. */
  isBlocked(x: number, y: number): boolean {
    if (x < 0 || x >= COLS || y >= ROWS) return true;
    return y >= 0 && this.cells[y * COLS + x] !== null;
  }

  collides(type: PieceType, rotation: Rotation, x: number, y: number): boolean {
    return pieceCells(type, rotation).some(([dx, dy]) => this.isBlocked(x + dx, y + dy));
  }

  place(type: PieceType, rotation: Rotation, x: number, y: number): void {
    for (const [dx, dy] of pieceCells(type, rotation)) this.set(x + dx, y + dy, type);
  }

  /** Removes all full rows, drops the rows above them, and returns how many were removed. */
  clearLines(): number {
    const kept: Cell[] = [];
    for (let y = 0; y < ROWS; y++) {
      const row = this.cells.slice(y * COLS, (y + 1) * COLS);
      if (row.some((c) => c === null)) kept.push(...row);
    }
    const cleared = (this.cells.length - kept.length) / COLS;
    this.cells = new Array<Cell>(cleared * COLS).fill(null).concat(kept);
    return cleared;
  }

  isEmpty(): boolean {
    return this.cells.every((c) => c === null);
  }

  clear(): void {
    this.cells.fill(null);
  }
}
