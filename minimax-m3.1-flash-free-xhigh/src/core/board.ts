import { COLS, HIDDEN_ROWS, ROWS, TOTAL_ROWS } from './constants.js';
import { pieceCells } from './pieces.js';
import type { Cell, PieceType, Rotation } from './types.js';

/** Value stored for every piece type, zero means an empty cell. */
const VALUES: Record<PieceType, number> = { I: 1, J: 2, L: 3, O: 4, S: 5, T: 6, Z: 7 };

/** Reverse lookup of {@link VALUES}. */
const BY_VALUE: readonly PieceType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

/** The playfield. */
export class Board {
  private readonly cells = new Uint8Array(COLS * TOTAL_ROWS);

  /** Removes every block from the board. */
  clear(): void {
    this.cells.fill(0);
  }

  private index(x: number, y: number): number {
    return (y + HIDDEN_ROWS) * COLS + x;
  }

  /** Value of a cell, zero when the cell is empty or outside of the grid. */
  valueAt(x: number, y: number): number {
    if (x < 0 || x >= COLS || y < -HIDDEN_ROWS || y >= ROWS) {
      return 0;
    }
    return this.cells[this.index(x, y)];
  }

  /**
   * True when the cell blocks a piece. Walls, the floor and the ceiling count
   * as solid, exactly like the blocks of the playfield.
   */
  isSolid(x: number, y: number): boolean {
    if (x < 0 || x >= COLS) {
      return true;
    }
    if (y >= ROWS || y < -HIDDEN_ROWS) {
      return true;
    }
    return this.cells[this.index(x, y)] !== 0;
  }

  /** Piece that fills a cell, null when the cell is empty. */
  pieceAt(x: number, y: number): PieceType | null {
    const value = this.valueAt(x, y);
    return value === 0 ? null : BY_VALUE[value - 1];
  }

  /** Writes a value into a cell, cells outside of the grid are ignored. */
  set(x: number, y: number, value: number): void {
    if (x < 0 || x >= COLS || y < -HIDDEN_ROWS || y >= ROWS) {
      return;
    }
    this.cells[this.index(x, y)] = value;
  }

  /** True when a piece placed at the given position does not collide. */
  fits(type: PieceType, rotation: Rotation, x: number, y: number): boolean {
    for (const cell of pieceCells(type, rotation)) {
      if (this.isSolid(x + cell.x, y + cell.y)) {
        return false;
      }
    }
    return true;
  }

  /** Writes the blocks of a piece into the board. */
  lock(type: PieceType, cells: readonly Cell[]): void {
    const value = VALUES[type];
    for (const cell of cells) {
      this.set(cell.x, cell.y, value);
    }
  }

  /** True when every cell of the row is filled. */
  isRowFull(y: number): boolean {
    for (let x = 0; x < COLS; x++) {
      if (this.valueAt(x, y) === 0) {
        return false;
      }
    }
    return true;
  }

  /** Removes every full row and returns how many rows were removed. */
  clearLines(): number {
    let cleared = 0;
    for (let y = 0; y < ROWS; y++) {
      if (this.isRowFull(y)) {
        this.removeRow(y);
        cleared++;
        y--;
      }
    }
    return cleared;
  }

  /** Drops a row and moves everything above of it one row down. */
  private removeRow(y: number): void {
    // The rows are copied from the bottom to the top, otherwise a row would
    // be overwritten before it is read.
    for (let row = y - 1; row >= -HIDDEN_ROWS; row--) {
      for (let x = 0; x < COLS; x++) {
        this.cells[this.index(x, row + 1)] = this.cells[this.index(x, row)];
      }
    }
    for (let x = 0; x < COLS; x++) {
      this.cells[this.index(x, -HIDDEN_ROWS)] = 0;
    }
  }

  /** True when the visible field holds no block at all. */
  isEmpty(): boolean {
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (this.valueAt(x, y) !== 0) {
          return false;
        }
      }
    }
    return true;
  }
}
