import { COLS, TOTAL_ROWS } from "./constants.js";
import { cellsFor, type PieceKind } from "./tetromino.js";

export class Board {
  grid: (PieceKind | null)[][];

  constructor() {
    this.grid = Board.emptyGrid();
  }

  static emptyGrid(): (PieceKind | null)[][] {
    return Array.from({ length: TOTAL_ROWS }, () => new Array<PieceKind | null>(COLS).fill(null));
  }

  reset(): void {
    this.grid = Board.emptyGrid();
  }

  /** True when the cell is solid: wall, floor, or an existing block. */
  isOccupied(x: number, y: number): boolean {
    if (x < 0 || x >= COLS) return true;
    if (y >= TOTAL_ROWS) return true;
    if (y < 0) return false;
    return this.grid[y][x] !== null;
  }

  collides(kind: PieceKind, rotation: number, px: number, py: number): boolean {
    for (const c of cellsFor(kind, rotation)) {
      if (this.isOccupied(px + c.x, py + c.y)) return true;
    }
    return false;
  }

  /** Write a piece into the grid. Cells above the board (y < 0) are clipped. */
  lock(kind: PieceKind, rotation: number, px: number, py: number): void {
    for (const c of cellsFor(kind, rotation)) {
      const x = px + c.x;
      const y = py + c.y;
      if (y < 0) continue;
      if (x < 0 || x >= COLS || y >= TOTAL_ROWS) continue;
      this.grid[y][x] = kind;
    }
  }

  /** Remove full rows, push empty rows on top. Returns cleared count. */
  clearLines(): number {
    let cleared = 0;
    const kept: (PieceKind | null)[][] = [];
    for (let r = 0; r < TOTAL_ROWS; r++) {
      if (this.grid[r].every((v) => v !== null)) {
        cleared++;
      } else {
        kept.push(this.grid[r]);
      }
    }
    while (kept.length < TOTAL_ROWS) {
      kept.unshift(new Array<PieceKind | null>(COLS).fill(null));
    }
    this.grid = kept;
    return cleared;
  }
}
