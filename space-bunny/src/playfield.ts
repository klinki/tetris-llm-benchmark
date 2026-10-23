/**
 * The playfield: a flat grid of blocks plus the operations the game needs.
 * Row 0 is the top hidden row, row `ROWS - 1` is the floor.
 */

import { COLS, ROWS } from './constants.js';
import type { PieceType } from './types.js';

export class Playfield {
  private readonly cells = new Array<PieceType | null>(COLS * ROWS).fill(null);

  reset(): void {
    this.cells.fill(null);
  }

  /** Block at the given position, or `null` when out of bounds or empty. */
  at(x: number, y: number): PieceType | null {
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return null;
    return this.cells[y * COLS + x];
  }

  /** True when the position is inside the field and holds a block. */
  isOccupied(x: number, y: number): boolean {
    return this.at(x, y) !== null;
  }

  set(x: number, y: number, value: PieceType | null): void {
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return;
    this.cells[y * COLS + x] = value;
  }

  isRowFull(y: number): boolean {
    if (y < 0 || y >= ROWS) return false;
    for (let x = 0; x < COLS; x += 1) {
      if (this.cells[y * COLS + x] === null) return false;
    }
    return true;
  }

  /** Rows that are completely filled, bottom to top. */
  fullRows(): number[] {
    const rows: number[] = [];
    for (let y = 0; y < ROWS; y += 1) {
      if (this.isRowFull(y)) rows.push(y);
    }
    return rows;
  }

  /**
   * Removes the given rows and lets everything above fall down.
   * Returns the number of cleared rows.
   */
  clearRows(rows: readonly number[]): number {
    if (rows.length === 0) return 0;
    const doomed = new Set(rows);
    const kept: (PieceType | null)[] = [];
    for (let y = ROWS - 1; y >= 0; y -= 1) {
      if (doomed.has(y)) continue;
      for (let x = 0; x < COLS; x += 1) {
        kept.push(this.cells[y * COLS + x] as PieceType | null);
      }
    }
    this.cells.fill(null);
    let index = 0;
    for (let y = ROWS - 1; y >= 0; y -= 1) {
      for (let x = 0; x < COLS; x += 1) {
        this.cells[y * COLS + x] = index < kept.length ? (kept[index] as PieceType | null) : null;
        index += 1;
      }
    }
    return doomed.size;
  }

  /** True when the whole field is empty (used for perfect clears). */
  isEmpty(): boolean {
    for (const cell of this.cells) {
      if (cell !== null) return false;
    }
    return true;
  }

  /** Number of blocks on the field. */
  get filled(): number {
    let count = 0;
    for (const cell of this.cells) {
      if (cell !== null) count += 1;
    }
    return count;
  }

  /** Height of the stack in rows (0 when empty), counting hidden rows. */
  get height(): number {
    for (let y = 0; y < ROWS; y += 1) {
      if (this.filledInRow(y)) return ROWS - y;
    }
    return 0;
  }

  private filledInRow(y: number): boolean {
    for (let x = 0; x < COLS; x += 1) {
      if (this.cells[y * COLS + x] !== null) return true;
    }
    return false;
  }

  /** ASCII dump, handy while debugging and in tests. */
  toRows(): string[] {
    const lines: string[] = [];
    for (let y = 0; y < ROWS; y += 1) {
      let line = '';
      for (let x = 0; x < COLS; x += 1) {
        line += this.cells[y * COLS + x] ?? '.';
      }
      lines.push(line);
    }
    return lines;
  }
}