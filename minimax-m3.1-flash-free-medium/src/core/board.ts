/** The playfield matrix with collision and line clearing logic. */

import { BOARD_WIDTH, TOTAL_ROWS } from './constants.js';
import { PIECE_ORDER, type OffsetList, type PieceType } from './pieces.js';

const PIECE_VALUES: Record<PieceType, number> = {
  I: 1,
  J: 2,
  L: 3,
  O: 4,
  S: 5,
  T: 6,
  Z: 7,
};

export class Board {
  readonly width = BOARD_WIDTH;
  readonly height = TOTAL_ROWS;

  private readonly cells = new Uint8Array(this.width * this.height);

  /** Value stored in the matrix for a piece type (0 means empty). */
  static valueOf(type: PieceType): number {
    return PIECE_VALUES[type];
  }

  /** Type stored in the matrix, or null for an empty cell. */
  static typeOf(value: number): PieceType | null {
    if (value === 0) return null;
    return PIECE_ORDER[value - 1] ?? null;
  }

  /** Piece type of a cell, or null when the cell is empty or out of bounds. */
  typeAt(x: number, y: number): PieceType | null {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
    return Board.typeOf(this.cells[y * this.width + x]);
  }

  /** True when the given cell is outside of the playfield or already filled. */
  isBlocked(x: number, y: number): boolean {
    if (x < 0 || x >= this.width) return true; // walls
    if (y >= this.height) return true; // floor
    if (y < 0) return false; // above the field is free space
    return this.cells[y * this.width + x] !== 0;
  }

  /** True when the playfield does not contain a single block. */
  isEmpty(): boolean {
    return this.cells.every((value) => value === 0);
  }

  /** True when all cells of a piece fit at the given position. */
  canPlace(cells: OffsetList, originX: number, originY: number): boolean {
    return cells.every(({ x, y }) => !this.isBlocked(originX + x, originY + y));
  }

  /** Writes a piece into the matrix. */
  place(cells: OffsetList, originX: number, originY: number, value: number): void {
    for (const { x, y } of cells) {
      const row = originY + y;
      const column = originX + x;
      if (row < 0 || row >= this.height || column < 0 || column >= this.width) continue;
      this.cells[row * this.width + column] = value;
    }
  }

  /** Removes all filled rows and returns how many of them there were. */
  clearFullRows(): number {
    let cleared = 0;
    for (let y = 0; y < this.height; y++) {
      if (!this.isRowFull(y)) continue;
      cleared++;
      this.shiftRowsDown(y);
      y--;
    }
    return cleared;
  }

  private isRowFull(y: number): boolean {
    for (let x = 0; x < this.width; x++) {
      if (this.cells[y * this.width + x] === 0) return false;
    }
    return true;
  }

  private shiftRowsDown(fromRow: number): void {
    for (let y = fromRow; y > 0; y--) {
      const target = y * this.width;
      const source = (y - 1) * this.width;
      for (let x = 0; x < this.width; x++) {
        this.cells[target + x] = this.cells[source + x];
      }
    }
    for (let x = 0; x < this.width; x++) {
      this.cells[x] = 0;
    }
  }
}
