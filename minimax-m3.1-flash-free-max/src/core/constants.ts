import type { PieceType } from './types.js';

export const BOARD_WIDTH = 10;
export const VISIBLE_ROWS = 20;

/** Hidden rows above the visible field, used for spawning and rotation headroom. */
export const BUFFER_ROWS = 2;
export const BOARD_ROWS = VISIBLE_ROWS + BUFFER_ROWS;

/** Size of a single cell in pixels. */
export const CELL_SIZE = 30;

/** Number of pieces shown in the next queue. */
export const PREVIEW_COUNT = 3;

/** Time a resting piece waits before it locks, in milliseconds. */
export const LOCK_DELAY_MS = 500;

/** How often the lock delay may be reset by moving or rotating the piece. */
export const MAX_LOCK_RESETS = 15;

/** Soft drop falls this many times faster than the normal gravity. */
export const SOFT_DROP_FACTOR = 20;

/** Highest level that influences gravity and scoring. */
export const MAX_LEVEL = 20;

/** Delay and rate of the auto repeat for the left/right keys, in milliseconds. */
export const KEY_REPEAT_DELAY_MS = 150;
export const KEY_REPEAT_RATE_MS = 33;

export const PIECE_COLORS: Record<PieceType, string> = {
  I: '#31c7ef',
  J: '#005ad2',
  L: '#ff8f27',
  O: '#ffec12',
  S: '#4cdb38',
  T: '#a85ad7',
  Z: '#f8385f',
};
