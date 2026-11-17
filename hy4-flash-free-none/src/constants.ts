// Game constants and shape definitions following the Tetris Guideline.

/** Number of visible columns / rows on the playfield. */
export const COLS = 10;
export const ROWS = 20;

/** Extra hidden rows above the visible playfield (spawn area). */
export const HIDDEN_ROWS = 2;
export const TOTAL_ROWS = ROWS + HIDDEN_ROWS;

/** Shape identifiers. The order here is the classic Guideline order. */
export type ShapeId = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

export const SHAPES: ShapeId[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

/** Guideline colors for each piece (also used by the renderer). */
export const COLORS: Record<ShapeId, string> = {
  I: '#00f0f0', // cyan
  J: '#0000f0', // blue
  L: '#f0a000', // orange
  O: '#f0f000', // yellow
  S: '#00f000', // green
  T: '#a000f0', // purple
  Z: '#f00000', // red
};

/**
 * Each tetromino defined by its 4 rotation states (0=R, 1=R2... actually
 * states 0,1,2,3 corresponding to 0, R, 2, L in SRS). Coordinates are
 * [x, y] within a 4x4 (I and O) or 3x3 (others) bounding box.
 *
 * We use the canonical SRS spawn orientations (spawn state = 0).
 */
export type Cell = readonly [number, number];
export type RotationCells = readonly Cell[];

export interface ShapeDefinition {
  readonly id: ShapeId;
  readonly size: number; // bounding box size (3 or 4)
  readonly cells: readonly RotationCells[]; // 4 rotation states
}

// Rotation state indices follow SRS: 0 = spawn, 1 = R (clockwise),
// 2 = 2, 3 = L (counter-clockwise).
const I_CELLS: RotationCells[] = [
  [[0, 1], [1, 1], [2, 1], [3, 1]],
  [[2, 0], [2, 1], [2, 2], [2, 3]],
  [[0, 2], [1, 2], [2, 2], [3, 2]],
  [[1, 0], [1, 1], [1, 2], [1, 3]],
];

const J_CELLS: RotationCells[] = [
  [[0, 0], [0, 1], [1, 1], [2, 1]],
  [[1, 0], [2, 0], [1, 1], [1, 2]],
  [[0, 1], [1, 1], [2, 1], [2, 2]],
  [[1, 0], [1, 1], [0, 2], [1, 2]],
];

const L_CELLS: RotationCells[] = [
  [[2, 0], [0, 1], [1, 1], [2, 1]],
  [[1, 0], [1, 1], [1, 2], [2, 2]],
  [[0, 1], [1, 1], [2, 1], [0, 2]],
  [[1, 0], [2, 0], [1, 1], [1, 2]],
];

const O_CELLS: RotationCells[] = [
  [[1, 0], [2, 0], [1, 1], [2, 1]],
  [[1, 0], [2, 0], [1, 1], [2, 1]],
  [[1, 0], [2, 0], [1, 1], [2, 1]],
  [[1, 0], [2, 0], [1, 1], [2, 1]],
];

const S_CELLS: RotationCells[] = [
  [[1, 0], [2, 0], [0, 1], [1, 1]],
  [[1, 0], [1, 1], [2, 1], [2, 2]],
  [[1, 1], [2, 1], [0, 2], [1, 2]],
  [[0, 0], [0, 1], [1, 1], [1, 2]],
];

const T_CELLS: RotationCells[] = [
  [[1, 0], [0, 1], [1, 1], [2, 1]],
  [[1, 0], [1, 1], [2, 1], [1, 2]],
  [[0, 1], [1, 1], [2, 1], [1, 2]],
  [[1, 0], [0, 1], [1, 1], [1, 2]],
];

const Z_CELLS: RotationCells[] = [
  [[0, 0], [1, 0], [1, 1], [2, 1]],
  [[2, 0], [1, 1], [2, 1], [1, 2]],
  [[0, 1], [1, 1], [1, 2], [2, 2]],
  [[1, 0], [0, 1], [1, 1], [0, 2]],
];

export const SHAPE_DEFINITIONS: Record<ShapeId, ShapeDefinition> = {
  I: { id: 'I', size: 4, cells: I_CELLS },
  J: { id: 'J', size: 3, cells: J_CELLS },
  L: { id: 'L', size: 3, cells: L_CELLS },
  O: { id: 'O', size: 4, cells: O_CELLS },
  S: { id: 'S', size: 3, cells: S_CELLS },
  T: { id: 'T', size: 3, cells: T_CELLS },
  Z: { id: 'Z', size: 3, cells: Z_CELLS },
};

/**
 * Super Rotation System wall kick data.
 * Each entry is a list of [dx, dy] offsets to try, in order, when rotating
 * from state A to state B. y is measured downward, so positive dy is up.
 *
 * For JLSTZ pieces (3x3):
 *   0->R: (0,0) (-1,0) (-1,+1) (0,-2) (-1,-2)
 *   R->0: (0,0) (+1,0) (+1,-1) (0,+2) (+1,+2)
 *   R->2: (0,0) (+1,0) (+1,-1) (0,+2) (+1,+2)
 *   2->R: (0,0) (-1,0) (-1,+1) (0,-2) (-1,-2)
 *   2->L: (0,0) (+1,0) (+1,+1) (0,-2) (+1,-2)
 *   L->2: (0,0) (-1,0) (-1,-1) (0,+2) (-1,+2)
 *   L->0: (0,0) (-1,0) (-1,-1) (0,+2) (-1,+2)
 *   0->L: (0,0) (+1,0) (+1,+1) (0,-2) (+1,-2)
 *
 * For I piece (4x4):
 *   0->R: (0,0) (-2,0) (+1,0) (-2,-1) (+1,+2)
 *   R->0: (0,0) (+2,0) (-1,0) (+2,+1) (-1,-2)
 *   R->2: (0,0) (-1,0) (+2,0) (-1,+2) (+2,-1)
 *   2->R: (0,0) (+1,0) (-2,0) (+1,-2) (-2,+1)
 *   2->L: (0,0) (+2,0) (-1,0) (+2,+1) (-1,-2)
 *   L->2: (0,0) (-2,0) (+1,0) (-2,-1) (+1,+2)
 *   L->0: (0,0) (+1,0) (-2,0) (+1,-2) (-2,+1)
 *   0->L: (0,0) (-1,0) (+2,0) (-1,+2) (+2,-1)
 *
 * O piece never kicks (all offsets (0,0)).
 */
export type KickOffset = readonly [number, number];
export type KickTable = Record<string, readonly KickOffset[]>;

export const JLSTZ_KICKS: KickTable = {
  '0>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '1>0': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '1>2': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '2>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '2>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '3>2': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '3>0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '0>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
};

export const I_KICKS: KickTable = {
  '0>1': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '1>0': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '1>2': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  '2>1': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '2>3': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '3>2': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '3>0': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '0>3': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
};

export const O_KICKS: KickTable = {
  '0>1': [[0, 0]],
  '1>0': [[0, 0]],
  '1>2': [[0, 0]],
  '2>1': [[0, 0]],
  '2>3': [[0, 0]],
  '3>2': [[0, 0]],
  '3>0': [[0, 0]],
  '0>3': [[0, 0]],
};

export function getKickTable(id: ShapeId): KickTable {
  if (id === 'I') return I_KICKS;
  if (id === 'O') return O_KICKS;
  return JLSTZ_KICKS;
}

/** Gravity in frames-per-row for each level (Guideline formula). */
export function gravityForLevel(level: number): number {
  // Guideline: (0.8 - ((level - 1) * 0.007)) ^ (level - 1), in seconds per row.
  const exponent = level - 1;
  const seconds = Math.pow(0.8 - (level - 1) * 0.007, exponent);
  // Convert to frames at 60Hz; clamp to a sane minimum.
  return Math.max(1, Math.round(seconds * 60));
}

/** Lock delay in frames (Guideline: 500ms). */
export const LOCK_DELAY_FRAMES = 30;

/** Maximum number of lock-delay resets (move/reset rule). */
export const MAX_LOCK_RESETS = 15;

/** Frames before a DAS/ARR-style auto-repeat begins (for testing/determinism). */
export const DAS_FRAMES = 10;
export const ARR_FRAMES = 2;

/** Points for single, double, triple, tetris. */
export const CLEAR_POINTS = [0, 100, 300, 500, 800] as const;

/** Number of pieces shown in the next queue. */
export const NEXT_QUEUE_SIZE = 5;
