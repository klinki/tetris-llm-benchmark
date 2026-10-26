import { PIECE_TYPES, type PieceType } from "./pieces.js";

export const BOARD_WIDTH = 10;
/** Total rows, including the hidden buffer zone above the visible field. */
export const BOARD_HEIGHT = 40;
export const VISIBLE_ROWS = 20;
/** Index of the first visible row (rows above it are the buffer zone). */
export const VISIBLE_TOP = BOARD_HEIGHT - VISIBLE_ROWS;

const EMPTY = 0;

/**
 * The playfield. Each cell stores 0 for empty or (piece index + 1),
 * kept in a flat typed array for speed. Row 0 is the top.
 */
export class Board {
  readonly cells = new Uint8Array(BOARD_WIDTH * BOARD_HEIGHT);

  /** True if the cell is a wall, floor or an occupied block. */
  isBlocked(x: number, y: number): boolean {
    if (x < 0 || x >= BOARD_WIDTH || y >= BOARD_HEIGHT) return true;
    if (y < 0) return false; // open sky above the buffer zone
    return this.cells[y * BOARD_WIDTH + x] !== EMPTY;
  }

  get(x: number, y: number): PieceType | null {
    const value = this.cells[y * BOARD_WIDTH + x];
    return value === EMPTY ? null : PIECE_TYPES[value - 1];
  }

  set(x: number, y: number, type: PieceType): void {
    this.cells[y * BOARD_WIDTH + x] = PIECE_TYPES.indexOf(type) + 1;
  }

  /** Removes full rows, shifting everything above down. Returns rows cleared. */
  clearLines(): number {
    let cleared = 0;
    // Walk from the bottom, copying non-full rows down by `cleared` rows.
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      const start = y * BOARD_WIDTH;
      if (this.isRowFull(start)) {
        cleared++;
      } else if (cleared > 0) {
        this.cells.copyWithin(start + cleared * BOARD_WIDTH, start, start + BOARD_WIDTH);
      }
    }
    this.cells.fill(EMPTY, 0, cleared * BOARD_WIDTH);
    return cleared;
  }

  isEmpty(): boolean {
    return this.cells.every((c) => c === EMPTY);
  }

  reset(): void {
    this.cells.fill(EMPTY);
  }

  private isRowFull(start: number): boolean {
    for (let i = start; i < start + BOARD_WIDTH; i++) if (this.cells[i] === EMPTY) return false;
    return true;
  }
}
