/**
 * Playfield: 10 x 22 grid. The top HIDDEN_ROWS rows are the spawn buffer
 * (not rendered); the remaining 20 rows are the visible field.
 */

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 22;
export const HIDDEN_ROWS = 2;

export class Board {
  /** Cell values: 0 empty, otherwise a piece color id. */
  readonly cells = new Uint8Array(BOARD_WIDTH * BOARD_HEIGHT);

  reset(): void {
    this.cells.fill(0);
  }

  /** True when a cell can be occupied. Above the field is free; walls/floor are not. */
  isFree(row: number, col: number): boolean {
    if (col < 0 || col >= BOARD_WIDTH || row >= BOARD_HEIGHT) return false;
    if (row < 0) return true;
    return this.cells[row * BOARD_WIDTH + col] === 0;
  }

  /** True when a piece matrix placed at (row, col) overlaps a wall, floor or stack. */
  collides(matrix: number[][], row: number, col: number): boolean {
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] && !this.isFree(row + r, col + c)) return true;
      }
    }
    return false;
  }

  /**
   * Write a piece into the grid.
   * Returns true when the piece locked entirely inside the hidden rows (lock out).
   */
  lock(matrix: number[][], row: number, col: number, colorId: number): boolean {
    let minRow = BOARD_HEIGHT;
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (!matrix[r][c]) continue;
        this.cells[(row + r) * BOARD_WIDTH + (col + c)] = colorId;
        minRow = Math.min(minRow, row + r);
      }
    }
    return minRow < HIDDEN_ROWS;
  }

  /** Remove full rows, shift the stack down, return how many rows cleared. */
  clearLines(): number {
    let cleared = 0;
    for (let r = BOARD_HEIGHT - 1; r >= 0; r--) {
      if (!this.isRowFull(r)) continue;
      // Move rows [0, r) down by one row, then blank the top row.
      this.cells.copyWithin(BOARD_WIDTH, 0, r * BOARD_WIDTH);
      this.cells.fill(0, 0, BOARD_WIDTH);
      cleared++;
      r++; // re-check this index: a new row slid into it
    }
    return cleared;
  }

  private isRowFull(row: number): boolean {
    const start = row * BOARD_WIDTH;
    for (let c = 0; c < BOARD_WIDTH; c++) {
      if (this.cells[start + c] === 0) return false;
    }
    return true;
  }
}
