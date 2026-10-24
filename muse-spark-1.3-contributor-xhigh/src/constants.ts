export const COLS = 10;
export const HIDDEN_ROWS = 2;
export const VISIBLE_ROWS = 20;
export const TOTAL_ROWS = HIDDEN_ROWS + VISIBLE_ROWS;

export const NEXT_COUNT = 5;

/** Seconds a piece may rest on the stack before locking. */
export const LOCK_DELAY = 0.5;
/** Max times move/rotate may reset the lock timer per piece. */
export const MAX_LOCK_RESETS = 15;

/** Delayed Auto Shift: delay before auto-repeat starts. */
export const DAS_DELAY = 0.15;
/** Auto-shift repeat interval while held. */
export const ARR_INTERVAL = 0.05;

/** Guideline gravity: seconds per row for a level (1-based). */
export function fallIntervalForLevel(level: number): number {
  const lv = Math.max(1, level);
  const t = Math.pow(0.8 - (lv - 1) * 0.007, lv - 1);
  // Clamp to something playable at very high levels.
  return Math.max(0.008, t);
}

/** Guideline line-clear scores (times level). Index = lines cleared. */
export const LINE_SCORES = [0, 100, 300, 500, 800];

/** T-spin scores (times level), index = lines cleared. */
export const TSPIN_SCORES = [400, 800, 1200, 1600];
