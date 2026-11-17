import { BOARD_WIDTH, BOARD_HEIGHT } from './constants.js';
import type { Cell, PieceType } from './types.js';

/** The playfield matrix. Index [0][0] is the top-left cell. */
export class Board {
  cells: (PieceType | null)[][] = [];

  constructor() {
    this.reset();
  }

  reset(): void {
    this.cells = Array.from({ length: BOARD_HEIGHT }, () =>
      Array<PieceType | null>(BOARD_WIDTH).fill(null),
    );
  }

  /** True when the piece at (offsetX, offsetY) is out of bounds or overlaps a locked cell. */
  collides(pieceCells: readonly Cell[], offsetX: number, offsetY: number): boolean {
    for (const cell of pieceCells) {
      const x = offsetX + cell.x;
      const y = offsetY + cell.y;
      if (x < 0 || x >= BOARD_WIDTH || y >= BOARD_HEIGHT) return true;
      // Cells above the board are allowed (spawn buffer).
      if (y >= 0 && this.cells[y][x] !== null) return true;
    }
    return false;
  }

  /** Merge a piece into the board. */
  lock(pieceCells: readonly Cell[], offsetX: number, offsetY: number, type: PieceType): void {
    for (const cell of pieceCells) {
      const x = offsetX + cell.x;
      const y = offsetY + cell.y;
      if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
        this.cells[y][x] = type;
      }
    }
  }

  /** Remove every full row and insert empty rows at the top. Returns the number cleared. */
  clearLines(): number {
    let cleared = 0;
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (this.cells[y].every((v) => v !== null)) {
        this.cells.splice(y, 1);
        this.cells.unshift(Array<PieceType | null>(BOARD_WIDTH).fill(null));
        cleared++;
        y++; // Re-check the row that just shifted down into this index.
      }
    }
    return cleared;
  }
}
