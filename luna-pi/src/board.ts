import { BOARD_HEIGHT, BOARD_WIDTH } from "./constants.js";
import { getCells } from "./pieces.js";
import type { ActivePiece, Cell, Grid, PieceType } from "./types.js";

function emptyRow(width: number): Array<Cell | null> {
  return Array<Cell | null>(width).fill(null);
}

export class Board {
  public readonly width: number;
  public readonly height: number;
  private cells: Grid;

  public constructor(width = BOARD_WIDTH, height = BOARD_HEIGHT) {
    this.width = width;
    this.height = height;
    this.cells = this.createEmptyGrid();
  }

  public reset(): void {
    this.cells = this.createEmptyGrid();
  }

  public getCell(column: number, row: number): Cell | null {
    if (!this.isInside(column, row)) {
      return null;
    }
    return this.cells[row][column];
  }

  /** Useful for setting up a board and for small integrations; gameplay only reads this grid. */
  public setCell(column: number, row: number, value: Cell | null): void {
    if (!this.isInside(column, row)) {
      throw new RangeError(`Cell (${column}, ${row}) is outside the board`);
    }
    this.cells[row][column] = value;
  }

  public getGrid(): Grid {
    return this.cells.map((row) => [...row]);
  }

  public isEmpty(): boolean {
    return this.cells.every((row) => row.every((cell) => cell === null));
  }

  /**
   * A cell above the visible playfield is legal. This lets SRS kicks work near
   * the top while still rejecting horizontal and bottom overflow.
   */
  public canPlace(piece: ActivePiece): boolean {
    for (const cell of getCells(piece)) {
      if (cell.column < 0 || cell.column >= this.width || cell.row >= this.height) {
        return false;
      }
      if (cell.row >= 0 && this.cells[cell.row][cell.column] !== null) {
        return false;
      }
    }
    return true;
  }

  /** Locks a piece and reports whether any of its cells were above the field. */
  public lock(piece: ActivePiece): { overflow: boolean } {
    let overflow = false;

    for (const cell of getCells(piece)) {
      if (cell.row < 0) {
        overflow = true;
        continue;
      }
      if (cell.column >= 0 && cell.column < this.width && cell.row < this.height) {
        this.cells[cell.row][cell.column] = piece.type;
      }
    }

    return { overflow };
  }

  public clearLines(): number {
    let writeRow = this.height - 1;
    let cleared = 0;

    for (let readRow = this.height - 1; readRow >= 0; readRow -= 1) {
      const row = this.cells[readRow];
      if (row.every((cell) => cell !== null)) {
        cleared += 1;
        continue;
      }

      this.cells[writeRow] = row;
      writeRow -= 1;
    }

    while (writeRow >= 0) {
      this.cells[writeRow] = emptyRow(this.width);
      writeRow -= 1;
    }

    return cleared;
  }

  private createEmptyGrid(): Grid {
    return Array.from({ length: this.height }, () => emptyRow(this.width));
  }

  private isInside(column: number, row: number): boolean {
    return column >= 0 && column < this.width && row >= 0 && row < this.height;
  }
}
