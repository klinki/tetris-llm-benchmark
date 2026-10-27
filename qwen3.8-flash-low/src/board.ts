import type { PieceType } from "./pieces.js";

/** The playfield: a plain 2D grid holding the type of the piece cell last locked there. */
export class Board {
  readonly grid: (PieceType | null)[][];

  constructor(readonly width: number, readonly height: number) {
    this.grid = Array.from({ length: height }, () => Array<PieceType | null>(width).fill(null));
  }

  clear(): void {
    for (const row of this.grid) row.fill(null);
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  isFree(x: number, y: number): boolean {
    return this.inBounds(x, y) && this.grid[y][x] === null;
  }

  /** True when every `[x, y]` cell is inside the board and unoccupied. */
  canPlace(cells: readonly (readonly [number, number])[]): boolean {
    return cells.every(([x, y]) => this.isFree(x, y));
  }

  setCell(x: number, y: number, piece: PieceType | null): void {
    this.grid[y][x] = piece;
  }

  /** Removes all full rows, shifting everything above down. Returns the number of rows cleared. */
  clearFullRows(): number {
    let cleared = 0;
    for (let y = this.height - 1; y >= 0; y--) {
      if (this.grid[y].every((cell) => cell !== null)) {
        this.grid.splice(y, 1);
        this.grid.unshift(Array<PieceType | null>(this.width).fill(null));
        cleared++;
        y++; // the rows shifted down by one; re-check the same index
      }
    }
    return cleared;
  }
}
