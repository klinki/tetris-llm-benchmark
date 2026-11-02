import { Rotation, SHAPES, Tetromino } from './pieces.js';

export const BOARD_WIDTH = 10;
export const VISIBLE_ROWS = 20;
/** Two hidden rows above the visible field where pieces spawn. */
export const HIDDEN_ROWS = 2;
export const BOARD_HEIGHT = VISIBLE_ROWS + HIDDEN_ROWS;

export type Cell = Tetromino | null;
export type Grid = Cell[][];

/** Absolute board cells occupied by a piece whose matrix origin is at (x, y). */
export function pieceCells(type: Tetromino, rotation: Rotation, x: number, y: number): [number, number][] {
  const cells: [number, number][] = [];
  const matrix = SHAPES[type][rotation];
  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row].length; col++) {
      if (matrix[row][col]) cells.push([x + col, y + row]);
    }
  }
  return cells;
}

/** The playfield grid: 10 wide, 20 visible rows plus 2 hidden spawn rows. */
export class Board {
  readonly grid: Grid = [];

  constructor() {
    this.clear();
  }

  clear(): void {
    this.grid.length = 0;
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      this.grid.push(new Array<Cell>(BOARD_WIDTH).fill(null));
    }
  }

  /**
   * True when the square is unavailable: a wall, the floor or a locked cell.
   * The area above the field (y < 0) is open space.
   */
  isBlocked(x: number, y: number): boolean {
    if (y < 0) return false;
    if (x < 0 || x >= BOARD_WIDTH || y >= BOARD_HEIGHT) return true;
    return this.grid[y][x] !== null;
  }

  fits(type: Tetromino, rotation: Rotation, x: number, y: number): boolean {
    return pieceCells(type, rotation, x, y).every((cell) => !this.isBlocked(cell[0], cell[1]));
  }

  /** Writes the piece into the grid. Cells above the field (y < 0) are skipped. */
  lock(type: Tetromino, rotation: Rotation, x: number, y: number): void {
    for (const cell of pieceCells(type, rotation, x, y)) {
      if (cell[1] >= 0 && cell[1] < BOARD_HEIGHT) this.grid[cell[1]][cell[0]] = type;
    }
  }

  /** Removes every full row and returns how many were cleared. */
  clearFullRows(): number {
    const kept = this.grid.filter((row) => row.some((cell) => cell === null));
    const cleared = BOARD_HEIGHT - kept.length;
    if (cleared > 0) {
      while (kept.length < BOARD_HEIGHT) {
        kept.unshift(new Array<Cell>(BOARD_WIDTH).fill(null));
      }
      this.grid.length = 0;
      this.grid.push(...kept);
    }
    return cleared;
  }
}
