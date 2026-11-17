// The playfield grid: collision tests, merging locked pieces and line clears.
import { COLS, ROWS } from "./constants.js";
import type { ActivePiece, GridCell, Vec } from "./types.js";
import { pieceCells } from "./pieces.js";

export class Board {
  grid: GridCell[][] = [];

  constructor() {
    this.reset();
  }

  reset(): void {
    this.grid = Array.from({ length: ROWS }, () => Array<GridCell>(COLS).fill(null));
  }

  /** True when a cell is outside the walls/floor or overlaps a locked block. */
  private blocked(x: number, y: number): boolean {
    if (x < 0 || x >= COLS || y >= ROWS) return true;
    // Cells above the top of the field are open air.
    if (y < 0) return false;
    return this.grid[y][x] !== null;
  }

  /** True when any of the given absolute cells collides. */
  collides(cells: Vec[]): boolean {
    return cells.some((c) => this.blocked(c.x, c.y));
  }

  /** True when a piece at its current position/rotation collides. */
  pieceCollides(piece: ActivePiece): boolean {
    return this.collides(pieceCells(piece.type, piece.rotation, piece.x, piece.y));
  }

  /**
   * Lock a piece into the grid. Returns true if any cell landed above the
   * visible field (a "lock out", which tops the player out).
   */
  merge(piece: ActivePiece, firstVisibleRow: number): boolean {
    let lockedAbove = false;
    for (const { x, y } of pieceCells(piece.type, piece.rotation, piece.x, piece.y)) {
      if (y < firstVisibleRow) lockedAbove = true;
      if (y >= 0 && y < ROWS && x >= 0 && x < COLS) this.grid[y][x] = piece.type;
    }
    return lockedAbove;
  }

  /** Indices of completely filled rows, top to bottom. */
  fullRows(): number[] {
    const rows: number[] = [];
    for (let y = 0; y < ROWS; y++) {
      if (this.grid[y].every((c) => c !== null)) rows.push(y);
    }
    return rows;
  }

  /** Remove the given rows and drop everything above them down. */
  clearRows(rows: number[]): void {
    if (rows.length === 0) return;
    const removed = new Set(rows);
    const kept = this.grid.filter((_, y) => !removed.has(y));
    const empty = Array.from({ length: rows.length }, () => Array<GridCell>(COLS).fill(null));
    this.grid = [...empty, ...kept];
  }

  /** True when the whole field is empty (used for perfect-clear detection). */
  isEmpty(): boolean {
    return this.grid.every((row) => row.every((c) => c === null));
  }
}
