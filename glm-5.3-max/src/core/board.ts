import type { PieceType } from "./tetromino.js";

/** Playfield width in cells. */
export const WIDTH = 10;

/** Total rows: 20 visible plus 2 hidden rows above them where pieces spawn. */
export const HEIGHT = 22;

/** Number of hidden rows above the visible playfield. */
export const HIDDEN_ROWS = 2;

/** The playfield grid plus collision, clearing helpers. */
export class Board {
  /** Row-major grid of locked cells (grid[y][x]); null means empty. */
  readonly grid: (PieceType | null)[][] = createGrid();

  reset(): void {
    for (const row of this.grid) row.fill(null);
  }

  /**
   * Whether a cell would stop a piece: stack, side walls or floor all count.
   * The space above the field is open so pieces can kick above row 0.
   */
  isBlocked(x: number, y: number): boolean {
    if (x < 0 || x >= WIDTH || y >= HEIGHT) return true;
    if (y < 0) return false;
    return this.grid[y][x] !== null;
  }

  isEmpty(): boolean {
    return this.grid.every((row) => row.every((cell) => cell === null));
  }

  /** Removes every full row, dropping the rows above; returns the count cleared. */
  clearLines(): number {
    let cleared = 0;
    for (let y = HEIGHT - 1; y >= 0; ) {
      if (this.grid[y].every((cell) => cell !== null)) {
        this.grid.splice(y, 1);
        this.grid.unshift(new Array<PieceType | null>(WIDTH).fill(null));
        cleared++;
        // Rows above just dropped into row y, so check this index again.
      } else {
        y--;
      }
    }
    return cleared;
  }
}

function createGrid(): (PieceType | null)[][] {
  return Array.from({ length: HEIGHT }, () => new Array<PieceType | null>(WIDTH).fill(null));
}
