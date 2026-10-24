export const COLS = 10;
export const ROWS = 22; // 20 visible + 2 hidden buffer rows on top
export const HIDDEN_ROWS = 2;
export const VISIBLE_ROWS = 20;

export const LOCK_DELAY_MS = 500;
export const MAX_LOCK_RESETS = 15;

export const DAS_MS = 150;
export const ARR_MS = 40;
export const SOFT_DROP_FACTOR = 20;

export const NEXT_COUNT = 5;

/** Guideline gravity: seconds per row for a level (1-indexed). */
export function secondsPerRow(level: number): number {
  const l = Math.min(Math.max(level, 1), 20);
  return Math.pow(0.8 - (l - 1) * 0.007, l - 1);
}

export const LINE_SCORES = [0, 100, 300, 500, 800];
export const TSPIN_SCORES = [400, 800, 1200, 1600]; // 0, single, double, triple
