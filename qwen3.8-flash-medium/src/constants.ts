/** Playfield dimensions (Guideline: 10 wide, 20 visible rows plus hidden buffer). */
export const COLS = 10
export const VISIBLE_ROWS = 20
export const HIDDEN_ROWS = 2
export const ROWS = VISIBLE_ROWS + HIDDEN_ROWS

/** Number of upcoming pieces shown in the preview queue. */
export const NEXT_COUNT = 5

/** Lock delay per the Guideline: 500 ms, resettable by moving up to 15 times. */
export const LOCK_DELAY_MS = 500
export const MAX_LOCK_RESETS = 15

/** Soft drop moves at 20 cells per second. */
export const SOFT_DROP_INTERVAL_MS = 50

/** Guideline line clear scores (index = number of rows), multiplied by level. */
export const CLEAR_SCORES = [0, 100, 300, 500, 800]
export const COMBO_SCORE = 50
export const SOFT_DROP_SCORE = 1
export const HARD_DROP_SCORE = 2

export const LINES_PER_LEVEL = 10
export const MAX_LEVEL = 20

/**
 * Guideline gravity: seconds to fall one row at a given level,
 * following the formula (0.8 - (level - 1) * 0.007) ^ (level - 1).
 */
export function gravityIntervalMs(level: number): number {
  const secondsPerRow = Math.pow(0.8 - (level - 1) * 0.007, level - 1)
  return Math.max(1, secondsPerRow * 1000)
}
