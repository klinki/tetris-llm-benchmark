import { COLS, TOTAL_ROWS, HIDDEN_ROWS, Cell, getKickTable, SHAPE_DEFINITIONS } from './constants';
import { ActivePiece, CellValue } from './types';

/** The playfield grid. Rows 0..HIDDEN_ROWS-1 are hidden spawn rows. */
export class Board {
  grid: CellValue[][] = [];

  constructor() {
    this.clear();
  }

  clear(): void {
    this.grid = Array.from({ length: TOTAL_ROWS }, () =>
      Array<CellValue>(COLS).fill(null)
    );
  }

  /** Clone just the cell grid (used for snapshots / testing). */
  cloneGrid(): CellValue[][] {
    return this.grid.map((row) => row.slice());
  }

  /** Compute the absolute board cells occupied by a piece at a given pose. */
  static pieceCells(piece: ActivePiece): Cell[] {
    const def = SHAPE_DEFINITIONS[piece.shape];
    const cells = def.cells[piece.rotation];
    return cells.map(([cx, cy]) => [piece.x + cx, piece.y + cy] as Cell);
  }

  /** Check whether a piece at a given pose collides with walls, floor, or stack. */
  collides(piece: ActivePiece): boolean {
    for (const [x, y] of Board.pieceCells(piece)) {
      if (x < 0 || x >= COLS || y >= TOTAL_ROWS) return true;
      if (y < 0) continue; // above the board is allowed in the hidden rows region
      if (this.grid[y][x] !== null) return true;
    }
    return false;
  }

  /** Check if a piece fits entirely within the visible spawn area. */
  fitsInSpawn(piece: ActivePiece): boolean {
    for (const [x, y] of Board.pieceCells(piece)) {
      if (y < 0 || y >= TOTAL_ROWS || x < 0 || x >= COLS) return false;
      if (this.grid[y][x] !== null) return false;
    }
    return true;
  }

  /** Lock a piece into the grid. Returns number of lines cleared. */
  lock(piece: ActivePiece): number {
    for (const [x, y] of Board.pieceCells(piece)) {
      if (y >= 0 && y < TOTAL_ROWS && x >= 0 && x < COLS) {
        this.grid[y][x] = piece.shape;
      }
    }
    const cleared = this.clearFullLines();
    return cleared;
  }

  /** Remove all full lines, shifting above rows down. Returns count cleared. */
  private clearFullLines(): number {
    let cleared = 0;
    for (let y = TOTAL_ROWS - 1; y >= 0; y--) {
      if (this.grid[y].every((cell) => cell !== null)) {
        // Remove this row and insert a fresh empty row at the top.
        this.grid.splice(y, 1);
        this.grid.unshift(Array<CellValue>(COLS).fill(null));
        cleared++;
        y++; // re-check the same row index, now containing shifted content
      }
    }
    return cleared;
  }

  /**
   * Try to rotate a piece using SRS wall kicks. Returns the new piece pose
   * if a valid rotation was found, otherwise null.
   */
  tryRotate(piece: ActivePiece, direction: 1 | -1): ActivePiece | null {
    const from = piece.rotation;
    const to = direction === 1 ? (from + 1) % 4 : (from + 3) % 4;
    const table = getKickTable(piece.shape);
    const tests = table[`${from}>${to}`] || [[0, 0]];
    for (const [dx, dy] of tests) {
      const candidate: ActivePiece = {
        ...piece,
        rotation: to,
        x: piece.x + dx,
        // dy is expressed as "positive = up" in the kick table, board y grows down.
        y: piece.y - dy,
      };
      if (!this.collides(candidate)) {
        return candidate;
      }
    }
    return null;
  }

  /** Drop a piece straight down until the next step would collide. */
  ghostPose(piece: ActivePiece): ActivePiece {
    let ghost: ActivePiece = { ...piece };
    while (!this.collides({ ...ghost, y: ghost.y + 1 })) {
      ghost = { ...ghost, y: ghost.y + 1 };
    }
    return ghost;
  }

  /** True if any cell in the hidden spawn rows is occupied (top-out condition). */
  isToppedOut(): boolean {
    for (let y = 0; y < HIDDEN_ROWS; y++) {
      if (this.grid[y].some((cell) => cell !== null)) return true;
    }
    return false;
  }
}
