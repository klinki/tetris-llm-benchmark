import type { Cell, Kind } from './pieces.js';

export const COLS = 10;
export const ROWS = 20;

/**
 * The playfield: rows of locked cells. Rows above the visible area (negative y)
 * are not stored; the stack top is row 0.
 */
export class Board {
  grid: (Kind | null)[][] = [];

  constructor() {
    this.reset();
  }

  reset(): void {
    this.grid = Array.from({ length: ROWS }, () => Array<Kind | null>(COLS).fill(null));
  }

  cellAt(x: number, y: number): Kind | null {
    return this.inside(x, y) ? this.grid[y][x] : null;
  }

  inside(x: number, y: number): boolean {
    return x >= 0 && x < COLS && y >= 0 && y < ROWS;
  }

  /** True if a piece in `state` offset by (px, py) would overlap walls, floor or the stack. */
  collides(cells: readonly Cell[], px: number, py: number): boolean {
    for (const [cx, cy] of cells) {
      const x = px + cx;
      const y = py + cy;
      if (x < 0 || x >= COLS || y >= ROWS) return true;
      if (y >= 0 && this.grid[y][x]) return true;
    }
    return false;
  }

  /** Used for T-spin corner checks: walls and floor count as occupied. */
  isOccupied(x: number, y: number): boolean {
    if (y < 0) return false; // empty space above the skyline
    if (x < 0 || x >= COLS || y >= ROWS) return true; // wall / floor
    return this.grid[y][x] !== null;
  }

  /** Writes a piece into the grid and returns how many full lines vanished. */
  lock(cells: readonly Cell[], px: number, py: number, kind: Kind): number {
    for (const [cx, cy] of cells) {
      const y = py + cy;
      if (y >= 0) this.grid[y][px + cx] = kind;
    }
    return this.clearLines();
  }

  private clearLines(): number {
    const kept = this.grid.filter((row) => row.some((c) => c === null));
    const cleared = ROWS - kept.length;
    while (kept.length < ROWS) kept.unshift(Array<Kind | null>(COLS).fill(null));
    this.grid = kept;
    return cleared;
  }
}
