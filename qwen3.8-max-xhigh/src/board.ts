import { COLS, ROWS } from "./constants.js";
import type { Cell, PieceKind } from "./pieces.js";

// The playfield grid of settled cells. Row 0 is the top of the hidden
// buffer zone, row ROWS - 1 is the floor.
export class Board {
  private cells: (PieceKind | null)[] = new Array(COLS * ROWS).fill(null);

  clear(): void {
    this.cells.fill(null);
  }

  get(x: number, y: number): PieceKind | null {
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return null;
    return this.cells[y * COLS + x];
  }

  set(x: number, y: number, kind: PieceKind | null): void {
    if (x >= 0 && x < COLS && y >= 0 && y < ROWS) this.cells[y * COLS + x] = kind;
  }

  // True when the given piece cells (relative to a bounding box at x, y)
  // overlap a wall, the floor or settled cells. Cells above the field
  // (y < 0) hang in the air and are allowed.
  collides(cells: readonly Cell[], x: number, y: number): boolean {
    for (const cell of cells) {
      const bx = x + cell.x;
      const by = y + cell.y;
      if (bx < 0 || bx >= COLS || by >= ROWS) return true;
      if (by >= 0 && this.cells[by * COLS + bx] !== null) return true;
    }
    return false;
  }

  // Freeze a piece into the grid.
  merge(cells: readonly Cell[], x: number, y: number, kind: PieceKind): void {
    for (const cell of cells) {
      this.set(x + cell.x, y + cell.y, kind);
    }
  }

  isRowFull(y: number): boolean {
    for (let x = 0; x < COLS; x++) {
      if (this.cells[y * COLS + x] === null) return false;
    }
    return true;
  }

  // Remove full rows and shift everything above down. Returns how many
  // rows were cleared.
  clearLines(): number {
    const kept: number[] = [];
    for (let y = 0; y < ROWS; y++) {
      if (!this.isRowFull(y)) kept.push(y);
    }
    const cleared = ROWS - kept.length;
    if (cleared === 0) return 0;
    const next: (PieceKind | null)[] = new Array(COLS * ROWS).fill(null);
    kept.forEach((srcY, i) => {
      const dstY = i + cleared;
      for (let x = 0; x < COLS; x++) next[dstY * COLS + x] = this.cells[srcY * COLS + x];
    });
    this.cells = next;
    return cleared;
  }
}
