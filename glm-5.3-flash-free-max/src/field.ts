/**
 * The playfield: a COLS x ROWS grid of locked cells. Rows above the skyline
 * belong to the same storage but are not rendered.
 */

import { COLS, ROWS } from "./constants.js";
import type { PieceType } from "./tetromino.js";

type Cell = PieceType | null;

const EMPTY_ROW: () => Cell[] = () => Array<Cell>(COLS).fill(null);

export class Field {
  readonly cells: Cell[][] = [];

  constructor() {
    this.reset();
  }

  reset(): void {
    this.cells.length = 0;
    for (let y = 0; y < ROWS; y++) this.cells.push(EMPTY_ROW());
  }

  get(x: number, y: number): Cell {
    return this.isOpen(x, y) ? this.cells[y][x] : null;
  }

  /**
   * Whether a cell address may be occupied by piece geometry.
   * Below and beside the field is solid wall/floor; above the top edge is
   * open air (Guideline pieces live above the skyline when they spawn).
   */
  isOpen(x: number, y: number): boolean {
    if (x < 0 || x >= COLS || y >= ROWS) return false;
    if (y < 0) return true;
    return this.cells[y][x] === null;
  }

  /** Stamp piece cells into the grid (cells above the top edge are ignored). */
  lockCells(
    cells: ReadonlyArray<readonly [number, number]>,
    pieceX: number,
    pieceY: number,
    type: PieceType,
  ): void {
    for (const [dx, dy] of cells) {
      const x = pieceX + dx;
      const y = pieceY + dy;
      if (y >= 0 && y < ROWS && x >= 0 && x < COLS) this.cells[y][x] = type;
    }
  }

  /** Remove full rows, shifting everything above down; returns count. */
  clearLines(): number {
    const remaining = this.cells.filter((row) => row.some((c) => c === null));
    const cleared = ROWS - remaining.length;
    while (remaining.length < ROWS) remaining.unshift(EMPTY_ROW());
    this.cells.length = 0;
    this.cells.push(...remaining);
    return cleared;
  }
}
