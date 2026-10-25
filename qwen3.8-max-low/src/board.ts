// Playfield: 10 columns wide, 20 visible rows plus a hidden spawn buffer on top.
import { Cells } from './pieces.js';

export const WIDTH = 10;
export const VISIBLE_ROWS = 20;
export const BUFFER_ROWS = 4;
export const HEIGHT = VISIBLE_ROWS + BUFFER_ROWS;

const enum Cell { Empty = 0 }

export class Board {
  // grid[y][x] holds 0 for empty, or piece type index + 1 (see PIECE_TYPES).
  readonly grid: number[][];

  constructor() {
    this.grid = Board.emptyGrid();
  }

  private static emptyGrid(): number[][] {
    return Array.from({ length: HEIGHT }, () => new Array<number>(WIDTH).fill(Cell.Empty));
  }

  reset(): void {
    for (let y = 0; y < HEIGHT; y++) this.grid[y].fill(Cell.Empty);
  }

  set(x: number, y: number, value: number): void {
    if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT) this.grid[y][x] = value;
  }

  // True when every cell is inside the board horizontally, above the bottom,
  // and not overlapping a filled cell. Cells above the top (y < 0) are free.
  isFree(cells: Cells): boolean {
    return cells.every(([x, y]) =>
      x >= 0 && x < WIDTH && y < HEIGHT && (y < 0 || this.grid[y][x] === Cell.Empty)
    );
  }

  // Removes completed rows, shifts everything above down, returns the count.
  clearLines(): number {
    let cleared = 0;
    for (let y = HEIGHT - 1; y >= 0; y--) {
      if (this.grid[y].every((v) => v !== Cell.Empty)) {
        this.grid.splice(y, 1);
        this.grid.unshift(new Array<number>(WIDTH).fill(Cell.Empty));
        cleared++;
        y++; // re-check the row that shifted into this position
      }
    }
    return cleared;
  }
}
