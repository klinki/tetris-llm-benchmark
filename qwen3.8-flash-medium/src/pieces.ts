/**
 * Tetromino definitions and Super Rotation System (SRS) data.
 *
 * Each piece lives in a square bounding box (I: 4x4, O: 2x2, others: 3x3).
 * The four rotation states are derived by rotating the spawn-state cells
 * inside the box, which matches the SRS orientation diagrams. Kick offsets
 * are stored in screen coordinates (positive y = down).
 */
export type PieceType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z'

export type Cell = readonly [number, number]

export const PIECE_TYPES: readonly PieceType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z']

/** Guideline colors: every shape has its own color. */
export const COLORS: Record<PieceType, string> = {
  I: '#00f0f0',
  J: '#0000f0',
  L: '#f0a000',
  O: '#f0f000',
  S: '#00f000',
  T: '#a000f0',
  Z: '#f00000',
}

const BOX_SIZE: Record<PieceType, number> = {
  I: 4,
  J: 3,
  L: 3,
  O: 2,
  S: 3,
  T: 3,
  Z: 3,
}

/** Spawn state (rotation 0) cells inside the bounding box. */
const BASE: Record<PieceType, readonly Cell[]> = {
  I: [[0, 1], [1, 1], [2, 1], [3, 1]] as const,
  J: [[0, 0], [0, 1], [1, 1], [2, 1]] as const,
  L: [[2, 0], [0, 1], [1, 1], [2, 1]] as const,
  O: [[0, 0], [1, 0], [0, 1], [1, 1]] as const,
  S: [[1, 0], [2, 0], [0, 1], [1, 1]] as const,
  T: [[1, 0], [0, 1], [1, 1], [2, 1]] as const,
  Z: [[0, 0], [1, 0], [1, 1], [2, 1]] as const,
}

/** Precomputed cells for all four rotation states of every piece. */
const ROTATIONS: Record<PieceType, readonly (readonly Cell[])[]> = (() => {
  const result = {} as Record<PieceType, (readonly Cell[])[]>
  for (const type of PIECE_TYPES) {
    const size = BOX_SIZE[type]
    const states: (readonly Cell[])[] = [BASE[type]]
    for (let r = 1; r < 4; r++) {
      const prev = states[r - 1]
      states.push(prev.map(([x, y]) => [size - 1 - y, x] as const))
    }
    result[type] = states
  }
  return result
})()

export function boxSize(type: PieceType): number {
  return BOX_SIZE[type]
}

/** Cells of a piece in a given rotation state, relative to its box origin. */
export function cellsFor(type: PieceType, rot: number): readonly Cell[] {
  return ROTATIONS[type][((rot % 4) + 4) % 4]
}

/** Horizontal spawn position: centered, columns 3-6 (I) / 3-5 (others) / 4-5 (O). */
export function spawnX(type: PieceType, cols: number): number {
  return Math.floor((cols - BOX_SIZE[type]) / 2)
}

export type Kick = readonly [number, number]

// SRS wall kick table for J, L, S, T and Z pieces.
const JLSTZ_KICKS: Record<string, readonly Kick[]> = {
  '0>1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]] as const,
  '1>0': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]] as const,
  '1>2': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]] as const,
  '2>1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]] as const,
  '2>3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]] as const,
  '3>2': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]] as const,
  '3>0': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]] as const,
  '0>3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]] as const,
}

// SRS wall kick table for the I piece.
const I_KICKS: Record<string, readonly Kick[]> = {
  '0>1': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]] as const,
  '1>0': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]] as const,
  '1>2': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]] as const,
  '2>1': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]] as const,
  '2>3': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]] as const,
  '3>2': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]] as const,
  '3>0': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]] as const,
  '0>3': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]] as const,
}

/** Wall kick offsets to try for a rotation from one state to another. */
export function kicksFor(type: PieceType, from: number, to: number): readonly Kick[] {
  if (type === 'O') return [[0, 0]]
  const table = type === 'I' ? I_KICKS : JLSTZ_KICKS
  return table[`${from}>${to}`] ?? [[0, 0]]
}
