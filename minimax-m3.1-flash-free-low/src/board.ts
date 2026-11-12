import { COLS, ROWS } from './constants.js';
import { Cell, PieceType, SHAPES } from './pieces.js';

/**
 * Super Rotation System wall kick tables.
 * Offsets are given in screen coordinates (x right, y down) and are applied
 * in order until the rotated piece fits.
 */
type Offset = { dx: number; dy: number };
type KickKey = string;

const JLSTZ_KICKS: Record<KickKey, Offset[]> = {
  '0>1': [
    { dx: 0, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: -1, dy: -1 },
    { dx: 0, dy: 2 },
    { dx: -1, dy: 2 },
  ],
  '1>0': [
    { dx: 0, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: 1, dy: 1 },
    { dx: 0, dy: -2 },
    { dx: 1, dy: -2 },
  ],
  '1>2': [
    { dx: 0, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: 1, dy: 1 },
    { dx: 0, dy: -2 },
    { dx: 1, dy: -2 },
  ],
  '2>1': [
    { dx: 0, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: -1, dy: -1 },
    { dx: 0, dy: 2 },
    { dx: -1, dy: 2 },
  ],
  '2>3': [
    { dx: 0, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: 1, dy: -1 },
    { dx: 0, dy: 2 },
    { dx: 1, dy: 2 },
  ],
  '3>2': [
    { dx: 0, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: -1, dy: 1 },
    { dx: 0, dy: -2 },
    { dx: -1, dy: -2 },
  ],
  '3>0': [
    { dx: 0, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: -1, dy: 1 },
    { dx: 0, dy: -2 },
    { dx: -1, dy: -2 },
  ],
  '0>3': [
    { dx: 0, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: 1, dy: -1 },
    { dx: 0, dy: 2 },
    { dx: 1, dy: 2 },
  ],
};

const I_KICKS: Record<KickKey, Offset[]> = {
  '0>1': [
    { dx: 0, dy: 0 },
    { dx: -2, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: -2, dy: 1 },
    { dx: 1, dy: -2 },
  ],
  '1>0': [
    { dx: 0, dy: 0 },
    { dx: 2, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 2, dy: -1 },
    { dx: -1, dy: 2 },
  ],
  '1>2': [
    { dx: 0, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 2, dy: 0 },
    { dx: -1, dy: -2 },
    { dx: 2, dy: 1 },
  ],
  '2>1': [
    { dx: 0, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: -2, dy: 0 },
    { dx: 1, dy: 2 },
    { dx: -2, dy: -1 },
  ],
  '2>3': [
    { dx: 0, dy: 0 },
    { dx: 2, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 2, dy: -1 },
    { dx: -1, dy: 2 },
  ],
  '3>2': [
    { dx: 0, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: -2, dy: 0 },
    { dx: 1, dy: 2 },
    { dx: -2, dy: -1 },
  ],
  '3>0': [
    { dx: 0, dy: 0 },
    { dx: -2, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: -2, dy: 1 },
    { dx: 1, dy: -2 },
  ],
  '0>3': [
    { dx: 0, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: -2, dy: 0 },
    { dx: 1, dy: 2 },
    { dx: -2, dy: -1 },
  ],
};

export function kickTable(type: PieceType, from: number, to: number): Offset[] {
  if (type === 'O') return [{ dx: 0, dy: 0 }];
  const key = `${from}>${to}` as KickKey;
  const table = type === 'I' ? I_KICKS : JLSTZ_KICKS;
  return table[key] ?? [{ dx: 0, dy: 0 }];
}

/** The playfield. Cells are stored row major, row 0 is the top row. */
export class Board {
  readonly cells: (PieceType | null)[] = new Array(COLS * ROWS).fill(null);

  clear(): void {
    this.cells.fill(null);
  }

  get(x: number, y: number): PieceType | null {
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return null;
    return this.cells[y * COLS + x];
  }

  isFilled(x: number, y: number): boolean {
    if (y >= ROWS) return true; // floor
    if (y < 0) return false;
    return this.cells[y * COLS + x] !== null;
  }

  /** True when the given cells do not overlap the stack and stay in bounds. */
  fits(cells: Cell[], x: number, y: number): boolean {
    for (const cell of cells) {
      const cx = x + cell.dx;
      const cy = y + cell.dy;
      if (cx < 0 || cx >= COLS) return false;
      if (cy >= ROWS) return false;
      if (cy >= 0 && this.cells[cy * COLS + cx] !== null) return false;
    }
    return true;
  }

  lock(cells: Cell[], x: number, y: number, type: PieceType): void {
    for (const cell of cells) {
      const cx = x + cell.dx;
      const cy = y + cell.dy;
      if (cx < 0 || cx >= COLS || cy < 0 || cy >= ROWS) continue;
      this.cells[cy * COLS + cx] = type;
    }
  }

  /** Removes all completed rows and returns how many were removed. */
  clearLines(): number {
    let removed = 0;
    for (let y = 0; y < ROWS; y++) {
      let full = true;
      for (let x = 0; x < COLS; x++) {
        if (this.cells[y * COLS + x] === null) {
          full = false;
          break;
        }
      }
      if (!full) continue;
      removed++;
      // shift all rows above down by one
      for (let yy = y; yy > 0; yy--) {
        for (let x = 0; x < COLS; x++) {
          this.cells[yy * COLS + x] = this.cells[(yy - 1) * COLS + x];
        }
      }
      for (let x = 0; x < COLS; x++) this.cells[x] = null;
      y--;
    }
    return removed;
  }

  /** Highest row index that holds a block (or -1 when the board is empty). */
  stackHeight(): number {
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (this.cells[y * COLS + x] !== null) return y;
      }
    }
    return -1;
  }
}

export function cellsOf(type: PieceType, rotation: number): Cell[] {
  return SHAPES[type][((rotation % 4) + 4) % 4];
}
