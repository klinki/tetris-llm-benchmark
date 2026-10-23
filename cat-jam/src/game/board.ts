import { BOARD_WIDTH, FIELD_HEIGHT, BUFFER_ROWS } from './constants.js';
import type { Cell, PieceType } from './pieces.js';

export type CellValue = PieceType | null;

/**
 * The playfield. Rows 0..BUFFER_ROWS-1 are hidden above the visible area and
 * act as the spawn buffer; the rest is the visible 10x20 field.
 */
export class Board {
  readonly width = BOARD_WIDTH;
  readonly height = FIELD_HEIGHT;
  private cells: CellValue[] = new Array<CellValue>(BOARD_WIDTH * FIELD_HEIGHT).fill(null);

  private index(x: number, y: number): number {
    return y * BOARD_WIDTH + x;
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && x < BOARD_WIDTH && y >= 0 && y < FIELD_HEIGHT;
  }

  /** The piece occupying a cell, or null. Out-of-bounds reads as empty. */
  get(x: number, y: number): CellValue {
    return this.inBounds(x, y) ? this.cells[this.index(x, y)] : null;
  }

  /** True when any cell of `offset` placed at (x, y) would be blocked. */
  collides(offset: Cell[], x: number, y: number): boolean {
    for (const [cx, cy] of offset) {
      const px = x + cx;
      const py = y + cy;
      if (px < 0 || px >= BOARD_WIDTH || py < 0 || py >= FIELD_HEIGHT) return true;
      if (this.cells[this.index(px, py)] !== null) return true;
    }
    return false;
  }

  /**
   * Writes a piece into the grid. Returns true when any cell landed in the
   * hidden buffer, which the Guideline treats as a block-out.
   */
  lock(type: PieceType, offset: Cell[], x: number, y: number): boolean {
    let lockedAboveField = false;
    for (const [cx, cy] of offset) {
      const px = x + cx;
      const py = y + cy;
      if (py < BUFFER_ROWS) lockedAboveField = true;
      if (this.inBounds(px, py)) this.cells[this.index(px, py)] = type;
    }
    return lockedAboveField;
  }

  /** Removes every full row, shifting the rows above down. Returns cleared rows. */
  clearLines(): number[] {
    const full: number[] = [];
    for (let y = 0; y < FIELD_HEIGHT; y++) {
      let isFull = true;
      for (let x = 0; x < BOARD_WIDTH; x++) {
        if (this.cells[this.index(x, y)] === null) {
          isFull = false;
          break;
        }
      }
      if (isFull) full.push(y);
    }
    if (full.length === 0) return full;

    const fullSet = new Set(full);
    const kept: CellValue[] = [];
    for (let y = 0; y < FIELD_HEIGHT; y++) {
      if (fullSet.has(y)) continue;
      for (let x = 0; x < BOARD_WIDTH; x++) kept.push(this.cells[this.index(x, y)]);
    }
    // Rows above a cleared line shift down; empty rows appear at the top.
    const empty = new Array<CellValue>(BOARD_WIDTH * full.length).fill(null);
    this.cells = [...empty, ...kept];
    return full;
  }

  /** Empties the board. */
  clear(): void {
    this.cells = new Array<CellValue>(BOARD_WIDTH * FIELD_HEIGHT).fill(null);
  }
}
