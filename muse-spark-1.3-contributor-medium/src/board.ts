import { COLS, TOTAL_ROWS, type PieceType } from './constants.js';
import { getCells, type Rotation } from './pieces.js';

export type Cell = PieceType | null;

export class Board {
  grid: Cell[][];

  constructor() {
    this.grid = Array.from({ length: TOTAL_ROWS }, () => Array<Cell>(COLS).fill(null));
  }

  clone(): Board {
    const b = new Board();
    b.grid = this.grid.map((r) => [...r]);
    return b;
  }

  collides(type: PieceType, rotation: Rotation, px: number, py: number): boolean {
    for (const [cx, cy] of getCells(type, rotation)) {
      const x = px + cx;
      const y = py + cy;
      if (x < 0 || x >= COLS || y >= TOTAL_ROWS) return true;
      if (y < 0) continue;
      if (this.grid[y][x] !== null) return true;
    }
    return false;
  }

  lock(type: PieceType, rotation: Rotation, px: number, py: number): void {
    for (const [cx, cy] of getCells(type, rotation)) {
      const x = px + cx;
      const y = py + cy;
      if (y < 0 || y >= TOTAL_ROWS || x < 0 || x >= COLS) continue;
      this.grid[y][x] = type;
    }
  }

  /** Removes full rows, returns count cleared. */
  clearLines(): number {
    const kept = this.grid.filter((row) => !row.every((c) => c !== null));
    const cleared = TOTAL_ROWS - kept.length;
    while (kept.length < TOTAL_ROWS) kept.unshift(Array<Cell>(COLS).fill(null));
    this.grid = kept;
    return cleared;
  }

  isEmpty(): boolean {
    return this.grid.every((r) => r.every((c) => c === null));
  }
}
