import { COLS, ROWS } from "./constants.js";
import { cellsOf, type Piece, type PieceType } from "./pieces.js";

export type BoardCell = PieceType | null;

/** The playfield. Row 0 is the top of the hidden buffer, row ROWS - 1 the floor. */
export class Board {
  private rows: BoardCell[][] = Array.from({ length: ROWS }, emptyRow);

  get(x: number, y: number): BoardCell {
    return this.rows[y][x];
  }

  set(x: number, y: number, value: BoardCell): void {
    this.rows[y][x] = value;
  }

  /** Walls, floor and ceiling count as occupied. */
  isBlocked(x: number, y: number): boolean {
    return x < 0 || x >= COLS || y < 0 || y >= ROWS || this.rows[y][x] !== null;
  }

  fits(piece: Piece): boolean {
    return cellsOf(piece).every(([x, y]) => !this.isBlocked(x, y));
  }

  lock(piece: Piece): void {
    for (const [x, y] of cellsOf(piece)) this.rows[y][x] = piece.type;
  }

  /** Removes all full rows, drops everything above them and returns how many were removed. */
  clearLines(): number {
    const remaining = this.rows.filter((row) => row.some((cell) => cell === null));
    const cleared = ROWS - remaining.length;
    while (remaining.length < ROWS) remaining.unshift(emptyRow());
    this.rows = remaining;
    return cleared;
  }

  isEmpty(): boolean {
    return this.rows.every((row) => row.every((cell) => cell === null));
  }
}

function emptyRow(): BoardCell[] {
  return new Array<BoardCell>(COLS).fill(null);
}
