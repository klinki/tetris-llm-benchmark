import { COLS, ROWS } from './constants.js'
import { PIECE_TYPES, type PieceType } from './pieces.js'

const TYPE_INDEX: Record<PieceType, number> = {
  I: 1,
  J: 2,
  L: 3,
  O: 4,
  S: 5,
  T: 6,
  Z: 7,
}

/** The fixed stack of locked tetromino cells. Rows are top-down, 0 is hidden. */
export class Board {
  private readonly grid = new Uint8Array(COLS * ROWS)

  isFilled(row: number, col: number): boolean {
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return false
    return this.grid[row * COLS + col] !== 0
  }

  cellAt(row: number, col: number): PieceType | null {
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return null
    const value = this.grid[row * COLS + col]
    return value === 0 ? null : PIECE_TYPES[value - 1]
  }

  set(row: number, col: number, type: PieceType | null): void {
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return
    this.grid[row * COLS + col] = type === null ? 0 : TYPE_INDEX[type]
  }

  /** Indices of completely filled rows, top-down. */
  fullRows(): number[] {
    const rows: number[] = []
    for (let r = 0; r < ROWS; r++) {
      let full = true
      for (let c = 0; c < COLS; c++) {
        if (this.grid[r * COLS + c] === 0) {
          full = false
          break
        }
      }
      if (full) rows.push(r)
    }
    return rows
  }

  /** Remove the given rows, shifting everything above them down. Returns the count cleared. */
  clearRows(rows: readonly number[]): number {
    if (rows.length === 0) return 0
    const cleared = new Set(rows)
    const kept: number[] = []
    for (let r = 0; r < ROWS; r++) {
      if (!cleared.has(r)) kept.push(r)
    }
    const offset = ROWS - kept.length
    // Copy bottom-up so in-place shifts never read an already-overwritten row.
    for (let r = ROWS - 1; r >= offset; r--) {
      const src = kept[r - offset]
      for (let c = 0; c < COLS; c++) {
        this.grid[r * COLS + c] = this.grid[src * COLS + c]
      }
    }
    for (let r = 0; r < offset; r++) {
      this.grid.fill(0, r * COLS, (r + 1) * COLS)
    }
    return rows.length
  }

  reset(): void {
    this.grid.fill(0)
  }
}
