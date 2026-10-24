import { COLS, ROWS } from "./constants.js";
import { PieceKind } from "./pieces.js";

export type Grid = (PieceKind | null)[][];

export function emptyGrid(): Grid {
  return Array.from({ length: ROWS }, () => Array<PieceKind | null>(COLS).fill(null));
}

export function collides(grid: Grid, cells: { x: number; y: number }[], px: number, py: number): boolean {
  for (const c of cells) {
    const x = px + c.x;
    const y = py + c.y;
    if (x < 0 || x >= COLS || y >= ROWS) return true;
    if (y >= 0 && grid[y][x] !== null) return true;
    // y < 0: above the board, never collides (we always spawn at y>=0, kept for safety)
  }
  return false;
}

/** Merge piece cells into the grid. Returns false if any cell is out of bounds. */
export function merge(grid: Grid, kind: PieceKind, cells: { x: number; y: number }[], px: number, py: number): void {
  for (const c of cells) {
    const x = px + c.x;
    const y = py + c.y;
    if (y >= 0 && y < ROWS && x >= 0 && x < COLS) grid[y][x] = kind;
  }
}

/** Remove full rows. Returns the number of cleared lines. */
export function clearLines(grid: Grid): number {
  let cleared = 0;
  for (let y = ROWS - 1; y >= 0; y--) {
    if (grid[y].every((v) => v !== null)) {
      grid.splice(y, 1);
      grid.unshift(Array<PieceKind | null>(COLS).fill(null));
      cleared++;
      y++; // re-check the row that fell into this index
    }
  }
  return cleared;
}
