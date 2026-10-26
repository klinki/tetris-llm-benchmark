/** All shared constants for the game: board geometry, timings, colors. */

export type PieceType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

/** Kind of last-moment rotation bonus, see https://tetris.fandom.com/wiki/T-Spin */
export type Spin = 'none' | 'mini' | 'full';

/** Board width in cells (Guideline playfield is 10 wide). */
export const COLS = 10;

/** Board height in cells: a hidden buffer below the visible 20 rows. */
export const ROWS = 40;

/** Rows 0..HIDDEN_ROWS-1 are the hidden buffer, rows HIDDEN_ROWS..ROWS-1 are visible. */
export const HIDDEN_ROWS = 20;

/** Number of visible rows. */
export const VISIBLE_ROWS = ROWS - HIDDEN_ROWS;

/** Spawn column of the 4x4 piece box, pieces appear in the middle of the field. */
export const SPAWN_X = 3;

/** Spawn row of the piece box, pieces appear in the top two visible rows. */
export const SPAWN_Y = HIDDEN_ROWS;

/** Number of upcoming pieces shown in the next queue (Guideline shows 5). */
export const NEXT_QUEUE_SIZE = 5;

/** A piece rests 500ms on the stack before it locks (Guideline lock delay). */
export const LOCK_DELAY = 0.5;

/** Maximum number of times the lock delay may be reset by moves/rotations. */
export const MAX_LOCK_RESETS = 15;

/** Delayed Auto Shift: time held before horizontal movement repeats. */
export const DAS = 0.167;

/** Auto Repeat Rate: interval of repeated horizontal movement while held. */
export const ARR = 0.033;

/** Soft drop is 20x gravity, never slower than one cell per frame. */
export const SOFT_DROP_FACTOR = 20;

/** Edge length of one rendered cell in pixels. */
export const CELL = 30;

export interface PieceColors {
  fill: string;
  border: string;
}

/** Each shape has its own color (Guideline colors, slightly toned down). */
export const COLORS: Record<PieceType, PieceColors> = {
  I: { fill: '#31c7ef', border: '#1d7f96' },
  J: { fill: '#4a4dd6', border: '#2c2e86' },
  L: { fill: '#f18e00', border: '#9c5c00' },
  O: { fill: '#f7d308', border: '#a68a05' },
  S: { fill: '#4cb944', border: '#2f7829' },
  T: { fill: '#ad4d9c', border: '#6f3164' },
  Z: { fill: '#ef3340', border: '#981f26' },
};
