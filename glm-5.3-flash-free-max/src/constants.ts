/**
 * Shared numeric constants and tuning tables for the whole game.
 * Kept here so both the DOM-free game logic and the renderer agree on them.
 */

/** Playfield size, Guideline standard: 10 cells wide, 20 rows visible. */
export const COLS = 10;

/** Two hidden rows above the skyline give spawn and rotation headroom. */
export const HIDDEN_ROWS = 2;
export const VISIBLE_ROWS = 20;
export const ROWS = VISIBLE_ROWS + HIDDEN_ROWS;

/**
 * Guideline gravity for "Fixed Goal Marathon": rows per drop expressed in
 * milliseconds, derived from the classic 60 fps table
 * (frames per row: 16, 13, 10, 9, 8, 7, 6, 6, 5, 5, 4, 4, 3, then 2G at 33ms).
 */
export const GRAVITY_MS_BY_LEVEL: readonly number[] = [
  267, 217, 167, 150, 133, 117, 100, 100, 83, 83, 67, 67, 50, 50, 33, 33, 17,
];

export function gravityMs(level: number): number {
  const last = GRAVITY_MS_BY_LEVEL.length - 1;
  return GRAVITY_MS_BY_LEVEL[Math.max(0, Math.min(level - 1, last))];
}

/**
 * Time a grounded piece may sit before locking ("move reset": every successful
 * move or rotation while grounded restarts the timer, up to MAX_LOCK_RESETS
 * times, after which the piece locks when the timer runs out).
 */
export const LOCK_DELAY_MS = 500;
export const MAX_LOCK_RESETS = 15;

/** Soft drop (down arrow) speed multiplier relative to normal gravity. */
export const SOFT_DROP_FACTOR = 20;

/** Guideline line clear awards, multiplied by level. Index = lines cleared. */
export const LINE_SCORES: readonly number[] = [0, 100, 300, 500, 800];
/** Full T-Spin awards (0..3 lines), multiplied by level. */
export const TSPIN_SCORES: readonly number[] = [400, 800, 1200, 1600];
/** T-Spin Mini awards (0..2 lines), multiplied by level. */
export const TSPIN_MINI_SCORES: readonly number[] = [100, 200, 400];

/** Back-to-back Tetris / T-Spin consecutive clears gate a 1.5x award bonus. */
export const B2B_MULTIPLIER = 1.5;
/** Combo bonus rows: 50 points x combo count x level after the first clear. */
export const COMBO_SCORE = 50;

/** Soft drop earns 1 point per cell, hard drop 2 points per cell. */
export const SOFT_DROP_SCORE = 1;
export const HARD_DROP_SCORE = 2;

/** Lines cleared per level (Fixed Goal Marathon: level up every 10 lines). */
export const LINES_PER_LEVEL = 10;
