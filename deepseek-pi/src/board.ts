import { CELLS, type Piece } from "./tetromino.js";

export const COLS = 10;
/** Total rows: 20 visible plus 2 hidden rows on top (rows 0 and 1). */
export const ROWS = 22;
/** Index of the first visible row. */
export const VISIBLE = 2;

/**
 * The playfield. Cell values are 0 (empty) or 1..7 (piece id, see PIECE_IDS).
 * Rows are stored top to bottom.
 */
export class Board {
  readonly grid = new Uint8Array(COLS * ROWS);

  reset(): void {
    this.grid.fill(0);
  }

  collides(piece: Piece, x: number, y: number): boolean {
    return this.collidesCells(CELLS[piece.type][piece.state], x, y);
  }

  collidesCells(cells: ReadonlyArray<readonly [number, number]>, x: number, y: number): boolean {
    for (const [dx, dy] of cells) {
      const cx = x + dx;
      const cy = y + dy;
      if (cx < 0 || cx >= COLS || cy < 0 || cy >= ROWS) return true;
      if (this.grid[cy * COLS + cx] !== 0) return true;
    }
    return false;
  }

  merge(piece: Piece, x: number, y: number, id: number): void {
    for (const [dx, dy] of CELLS[piece.type][piece.state]) {
      this.grid[(y + dy) * COLS + (x + dx)] = id;
    }
  }

  /** Remove full rows, shifting everything above down. Returns the count. */
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
      cleared++;
      for (let yy = y; yy > 0; yy--) {
        for (let x = 0; x < COLS; x++) {
          this.grid[yy * COLS + x] = this.grid[(yy - 1) * COLS + x];
        }
      }
      this.grid.fill(0, 0, COLS);
      y++; // re-check this row: it now holds what was one row above
    }
    return cleared;
  }
}
