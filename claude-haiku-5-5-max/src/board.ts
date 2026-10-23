import { BOARD_HEIGHT, BOARD_WIDTH } from './constants.js';
import { offsetsOf, type PieceState, type PieceType } from './pieces.js';

type Row = (PieceType | null)[];

const emptyRow = (): Row => Array<PieceType | null>(BOARD_WIDTH).fill(null);

/** The stack of locked pieces. Row 0 is the top of the buffer zone, the last row is the floor. */
export class Board {
  private rows: Row[] = Array.from({ length: BOARD_HEIGHT }, emptyRow);

  clear(): void {
    this.rows = Array.from({ length: BOARD_HEIGHT }, emptyRow);
  }

  /** The piece type stored at (x, y), or null when the cell is empty or off the board. */
  cell(x: number, y: number): PieceType | null {
    return this.isInside(x, y) ? this.rows[y][x] : null;
  }

  /** Sets one cell directly. Used to build boards in tests. */
  setCell(x: number, y: number, type: PieceType | null): void {
    this.rows[y][x] = type;
  }

  /** True when (x, y) is a wall, the floor, above the board, or already filled. */
  isBlocked(x: number, y: number): boolean {
    return !this.isInside(x, y) || this.rows[y][x] !== null;
  }

  /** True when every cell of the piece lands on an open cell. */
  canPlace(piece: PieceState): boolean {
    const { type, rotation, x, y } = piece;
    return offsetsOf(type, rotation).every(([dx, dy]) => !this.isBlocked(x + dx, y + dy));
  }

  /** Writes a locked piece into the stack. The caller must have checked that it fits. */
  place(piece: PieceState): void {
    const { type, rotation, x, y } = piece;
    for (const [dx, dy] of offsetsOf(type, rotation)) {
      this.rows[y + dy][x + dx] = type;
    }
  }

  /** Removes completed rows, shifts the rows above them down, and returns how many were removed. */
  clearLines(): number {
    const remaining = this.rows.filter((row) => row.includes(null));
    const cleared = BOARD_HEIGHT - remaining.length;
    if (cleared > 0) {
      this.rows = [...Array.from({ length: cleared }, emptyRow), ...remaining];
    }
    return cleared;
  }

  private isInside(x: number, y: number): boolean {
    return x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT;
  }
}
