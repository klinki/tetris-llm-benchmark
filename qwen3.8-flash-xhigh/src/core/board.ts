import type { Cell } from './pieces.js';

/** Standard Guideline playfield: 10 wide, 20 visible rows. */
export const COLS = 10;
export const VISIBLE_ROWS = 20;
/** Two buffer rows above the visible field for spawns and upward wall kicks. */
export const HIDDEN_ROWS = 2;
export const ROWS = VISIBLE_ROWS + HIDDEN_ROWS;

/**
 * The stack of locked cells. Stores piece ids (see PIECE_ID); 0 is empty.
 * Out-of-bounds columns and rows below the floor are solid; rows above the
 * field (the buffer zone and beyond) are open.
 */
export class Board {
  private grid = new Uint8Array(COLS * ROWS);

  reset(): void {
    this.grid.fill(0);
  }

  /** True if the cell is blocked: a wall, the floor, or a locked piece. */
  solidAt(x: number, y: number): boolean {
    if (x < 0 || x >= COLS || y >= ROWS) return true;
    if (y < 0) return false;
    return this.grid[y * COLS + x] !== 0;
  }

  get(x: number, y: number): number {
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return 0;
    return this.grid[y * COLS + x];
  }

  /** Used by tests to build stacks. */
  set(x: number, y: number, id: number): void {
    if (x >= 0 && x < COLS && y >= 0 && y < ROWS) this.grid[y * COLS + x] = id;
  }

  /** True if the piece cells at offset (ox, oy) collide with walls or stack. */
  overlaps(cells: readonly Cell[], ox: number, oy: number): boolean {
    for (const [cx, cy] of cells) {
      if (this.solidAt(ox + cx, oy + cy)) return true;
    }
    return false;
  }

  /** Lock piece cells into the grid. */
  place(cells: readonly Cell[], ox: number, oy: number, id: number): void {
    for (const [cx, cy] of cells) {
      const x = ox + cx;
      const y = oy + cy;
      if (x >= 0 && x < COLS && y >= 0 && y < ROWS) this.grid[y * COLS + x] = id;
    }
  }

  /** Remove full rows and drop the rest. Returns the number of rows cleared. */
  clearFullRows(): number {
    let cleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
      let full = true;
      for (let x = 0; x < COLS; x++) {
        if (this.grid[y * COLS + x] === 0) {
          full = false;
          break;
        }
      }
      if (!full) continue;
      for (let k = y; k > 0; k--) {
        this.grid.copyWithin(k * COLS, (k - 1) * COLS, k * COLS);
      }
      this.grid.fill(0, 0, COLS);
      cleared++;
      y++; // re-check the same row after the shift
    }
    return cleared;
  }

  isEmpty(): boolean {
    for (let i = 0; i < this.grid.length; i++) {
      if (this.grid[i] !== 0) return false;
    }
    return true;
  }
}
