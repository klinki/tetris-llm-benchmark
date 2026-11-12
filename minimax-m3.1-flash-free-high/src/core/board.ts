import { BOARD_HEIGHT, BOARD_WIDTH, FIRST_VISIBLE_ROW } from './constants.js';
import { cellsOf, PIECE_TYPES, type Cell, type Piece, type PieceType } from './pieces.js';

/** Cell values stored in the board: 0 = empty, 1..7 = piece type index + 1. */
export type CellValue = number;

function pieceValue(type: PieceType): CellValue {
  return PIECE_TYPES.indexOf(type) + 1;
}

/** The playfield. */
export class Board {
  readonly width = BOARD_WIDTH;
  readonly height = BOARD_HEIGHT;
  /** Row-major grid of cell values. */
  readonly cells = new Uint8Array(BOARD_WIDTH * BOARD_HEIGHT);

  /** Index of a cell inside {@link cells}. */
  index(x: number, y: number): number {
    return y * BOARD_WIDTH + x;
  }

  /** Value of a cell; out of bounds cells count as filled. */
  valueAt(x: number, y: number): CellValue {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return 1;
    return this.cells[y * this.width + x]!;
  }

  /** True when the given cell is outside of the board or already filled. */
  isBlocked(x: number, y: number): boolean {
    return this.valueAt(x, y) !== 0;
  }

  /** True when the piece does not fit at the given position. */
  collides(type: PieceType, rotation: number, px: number, py: number): boolean {
    for (const [cx, cy] of cellsOf(type, rotation)) {
      if (this.isBlocked(px + cx, py + cy)) return true;
    }
    return false;
  }

  /** True when the piece does not fit at its current position. */
  collidesAt(piece: Piece): boolean {
    return this.collides(piece.type, piece.rotation, piece.x, piece.y);
  }

  /** Writes the piece into the grid and returns the indices of full rows. */
  lock(piece: Piece): number[] {
    const value = pieceValue(piece.type);
    for (const [cx, cy] of cellsOf(piece.type, piece.rotation)) {
      const x = piece.x + cx;
      const y = piece.y + cy;
      if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
        this.cells[y * this.width + x] = value;
      }
    }
    return this.findFullRows();
  }

  /** Indices of all rows that are completely filled. */
  findFullRows(): number[] {
    const rows: number[] = [];
    for (let y = 0; y < this.height; y++) {
      let full = true;
      for (let x = 0; x < this.width; x++) {
        if (this.cells[y * this.width + x] === 0) {
          full = false;
          break;
        }
      }
      if (full) rows.push(y);
    }
    return rows;
  }

  /** Removes the given rows and shifts the rows above them down. */
  clearRows(rows: readonly number[]): void {
    if (rows.length === 0) return;
    const cleared = new Set(rows);
    let target = this.height - 1;
    for (let y = this.height - 1; y >= 0; y--) {
      if (cleared.has(y)) continue;
      this.cells.copyWithin(target * this.width, y * this.width, y * this.width + this.width);
      target--;
    }
    while (target >= 0) {
      this.cells.fill(0, target * this.width, target * this.width + this.width);
      target--;
    }
  }

  /** Removes every cell from the board. */
  clear(): void {
    this.cells.fill(0);
  }

  /** Highest occupied row of the given column, or -1 when the column is empty. */
  columnHeight(x: number): number {
    for (let y = 0; y < this.height; y++) {
      if (this.cells[y * this.width + x] !== 0) return y;
    }
    return -1;
  }

  /** True when every visible cell is empty. */
  isEmpty(): boolean {
    for (let y = FIRST_VISIBLE_ROW; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.cells[y * this.width + x] !== 0) return false;
      }
    }
    return true;
  }

  /** Absolute board cells of a piece. */
  static absoluteCells(piece: Piece): Cell[] {
    return cellsOf(piece.type, piece.rotation).map(([cx, cy]) => [piece.x + cx, piece.y + cy]);
  }
}
