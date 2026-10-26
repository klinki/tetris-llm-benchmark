import type { PieceType, Point } from './pieces.js';

export const COLS = 10;
export const VISIBLE_ROWS = 20;
/** Buffer zone above the visible field where pieces spawn. */
export const HIDDEN_ROWS = 20;
export const ROWS = HIDDEN_ROWS + VISIBLE_ROWS;

export type Cell = PieceType | null;

function emptyRow(): Cell[] {
  return new Array<Cell>(COLS).fill(null);
}

/** The 10x40 Guideline matrix; row 0 is the top of the buffer zone. */
export class Board {
  private rows: Cell[][] = Array.from({ length: ROWS }, emptyRow);

  get(x: number, y: number): Cell {
    return this.rows[y]?.[x] ?? null;
  }

  set(x: number, y: number, cell: Cell): void {
    this.rows[y][x] = cell;
  }

  /** Walls and floor count as blocked, so pieces can never leave the matrix. */
  isBlocked(x: number, y: number): boolean {
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return true;
    return this.rows[y][x] !== null;
  }

  place(cells: readonly Point[], type: PieceType): void {
    for (const [x, y] of cells) this.rows[y][x] = type;
  }

  /** Removes completed rows, shifts everything above down and returns the count. */
  clearFullRows(): number {
    const remaining = this.rows.filter((row) => row.includes(null));
    const cleared = ROWS - remaining.length;
    if (cleared > 0) this.rows = [...Array.from({ length: cleared }, emptyRow), ...remaining];
    return cleared;
  }
}
