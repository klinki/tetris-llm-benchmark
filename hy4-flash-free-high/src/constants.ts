/** Playfield is 10 columns wide (Tetris Guideline). */
export const BOARD_WIDTH = 10;

/** 20 visible rows plus a 20-row hidden buffer above the field. */
export const BOARD_HEIGHT = 40;
export const VISIBLE_ROWS = 20;
export const HIDDEN_ROWS = BOARD_HEIGHT - VISIBLE_ROWS;

/** Rendering size of one cell, in pixels. */
export const CELL_SIZE = 30;

/** Guideline lock delay and the maximum number of move/rotate resets. */
export const LOCK_DELAY_MS = 500;
export const MAX_LOCK_RESETS = 15;

/** Number of upcoming pieces shown in the next queue. */
export const NEXT_COUNT = 5;

/** Base points awarded for clearing 1, 2, 3 or 4 lines at level 1. */
export const LINE_SCORES = [0, 100, 300, 500, 800] as const;

/** Lines needed per level increase. */
export const LINES_PER_LEVEL = 10;

/**
 * Guideline gravity: (0.8 - (level - 1) * 0.007) ^ (level - 1) seconds per cell.
 * Clamped to at least 1 ms so very high levels behave like "20G" without
 * producing an endless loop in the update step.
 */
export function gravityIntervalMs(level: number): number {
  const l = Math.max(1, level);
  const base = 0.8 - (l - 1) * 0.007;
  if (base <= 0) return 1;
  return Math.max(1, Math.pow(base, l - 1) * 1000);
}
