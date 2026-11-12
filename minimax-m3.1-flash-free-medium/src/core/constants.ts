/** Shared constants describing the playfield, timings and scoring of the game. */

/** Width of the playfield (in cells). */
export const BOARD_WIDTH = 10;

/** Number of visible rows of the playfield. */
export const VISIBLE_ROWS = 20;

/** Hidden buffer rows kept above the visible playfield (for spawns and kicks). */
export const BUFFER_ROWS = 4;

/** Total number of rows kept in the board matrix. */
export const TOTAL_ROWS = VISIBLE_ROWS + BUFFER_ROWS;

/** Index of the first visible row inside the board matrix. */
export const FIRST_VISIBLE_ROW = BUFFER_ROWS;

/** Time (ms) a piece stays unlocked once it reached the stack. */
export const LOCK_DELAY_MS = 500;

/** Maximum amount of lock delay resets ("move reset" lock down) per piece. */
export const MAX_LOCK_RESETS = 15;

/** Entry delay (ms) between a piece locking down and the next one spawning. */
export const ARE_MS = 100;

/** Delayed auto shift (ms) before a held direction starts repeating. */
export const DAS_MS = 167;

/** Auto repeat rate (ms) of a held direction. */
export const ARR_MS = 33;

/** Soft drop is this many times faster than the current gravity. */
export const SOFT_DROP_FACTOR = 20;

/** Amount of pieces shown in the next queue. */
export const PREVIEW_COUNT = 5;

/** Score for 1, 2, 3 and 4 cleared lines. */
export const LINE_SCORES = [0, 100, 300, 500, 800];

/** Score of a full T-spin for 0, 1, 2 and 3 cleared lines. */
export const TSPIN_SCORES = [400, 800, 1200, 1600];

/** Score of a T-spin mini for 0, 1, 2 and 3 cleared lines. */
export const TSPIN_MINI_SCORES = [100, 200, 400, 400];

/** Bonus for clearing the whole playfield at once. */
export const PERFECT_CLEAR_SCORES = [0, 800, 1200, 1800, 2000];

/** Bonus per combo step. */
export const COMBO_BONUS = 50;

/** Back-to-back multiplier applied to difficult clears. */
export const BACK_TO_BACK_MULTIPLIER = 1.5;

/**
 * Gravity of a level in milliseconds per row, using the classic marathon curve
 * `seconds = (0.8 - (level - 1) * 0.007) ^ (level - 1)`.
 */
export function gravityIntervalMs(level: number): number {
  const l = Math.max(1, level);
  const seconds = Math.pow(0.8 - (l - 1) * 0.007, l - 1);
  return Math.max(1, seconds * 1000);
}
