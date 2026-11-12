/** Board and gameplay constants (Tetris Guideline). */

export const COLS = 10;
export const ROWS = 20;

/** Number of pieces shown in the "next" queue. */
export const PREVIEW_COUNT = 5;

/** Time a piece may rest on a surface before it locks, in ms. */
export const LOCK_DELAY_MS = 500;

/** Maximum number of times a lock delay can be reset by moving the piece. */
export const MAX_LOCK_RESETS = 15;

/** Cell size of a single block in pixels (rendering only). */
export const CELL_SIZE = 28;

export const DAS_MS = 150;
export const ARR_MS = 40;

/**
 * Gravity table: seconds per cell for a given level.
 * Formula from the Tetris Guideline.
 */
export function gravityMs(level: number): number {
  const l = Math.max(1, level);
  const base = 0.8 - (l - 1) * 0.007;
  const seconds = Math.pow(Math.max(base, 0.0001), l - 1);
  return Math.max(1, Math.round(seconds * 1000));
}
