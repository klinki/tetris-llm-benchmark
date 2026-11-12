import { BOARD_ROWS, BOARD_WIDTH } from './constants.js';
import { getCells } from './pieces.js';
import type { Piece, PieceType } from './types.js';

/** The playfield. Every cell holds the type of the piece resting on it. */
export class Board {
  private readonly grid: (PieceType | null)[][] = [];

  constructor() {
    for (let y = 0; y < BOARD_ROWS; y += 1) {
      this.grid.push(new Array<PieceType | null>(BOARD_WIDTH).fill(null));
    }
  }

  get rows(): number {
    return BOARD_ROWS;
  }

  get columns(): number {
    return BOARD_WIDTH;
  }

  /** Removes every block from the board. */
  clear(): void {
    for (const row of this.grid) row.fill(null);
  }

  /** The piece type resting on the given cell, `null` when the cell is empty. */
  cellAt(x: number, y: number): PieceType | null {
    if (!this.isInside(x, y)) return null;
    return this.grid[y][x];
  }

  /** Places a single block, used to set up test positions. */
  setCell(x: number, y: number, type: PieceType): void {
    if (!this.isInside(x, y)) return;
    this.grid[y][x] = type;
  }

  /** True when the coordinate is outside of the board or already filled. */
  isBlocked(x: number, y: number): boolean {
    if (!this.isInside(x, y)) return true;
    return this.grid[y][x] !== null;
  }

  /** True when the piece does not fit at its current position. */
  collides(piece: Piece): boolean {
    return getCells(piece.type, piece.rotation).some((cell) =>
      this.isBlocked(piece.x + cell.x, piece.y + cell.y),
    );
  }

  /** Freezes the piece into the board. */
  lock(piece: Piece): void {
    for (const cell of getCells(piece.type, piece.rotation)) {
      const x = piece.x + cell.x;
      const y = piece.y + cell.y;
      if (this.isInside(x, y)) this.grid[y][x] = piece.type;
    }
  }

  /** Removes every complete row and returns how many rows were removed. */
  clearLines(): number {
    let cleared = 0;
    for (let y = 0; y < BOARD_ROWS; y += 1) {
      if (this.grid[y].every((cell) => cell !== null)) {
        this.grid.splice(y, 1);
        this.grid.unshift(new Array<PieceType | null>(BOARD_WIDTH).fill(null));
        cleared += 1;
        y -= 1; // the row below moved up, check it again
      }
    }
    return cleared;
  }

  private isInside(x: number, y: number): boolean {
    return x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_ROWS;
  }
}
