// Board dimensions, palette, timings and scoring constants.
// Values follow the Tetris Guideline.
import type { PieceType } from "./types.js";

/** Playfield width in cells. */
export const COLS = 10;
/** Number of rows shown to the player. */
export const VISIBLE_ROWS = 20;
/** Hidden rows above the visible field, used for spawning and wall kicks. */
export const HIDDEN_ROWS = 4;
/** Total internal board height. */
export const ROWS = VISIBLE_ROWS + HIDDEN_ROWS;
/** Index of the first visible row. */
export const FIRST_VISIBLE_ROW = HIDDEN_ROWS;

/** Distinct guideline color for each tetromino. */
export const COLORS: Record<PieceType, string> = {
  I: "#31c7ef",
  O: "#f7d308",
  T: "#ad4d9c",
  S: "#42b642",
  Z: "#ef2029",
  J: "#5a65ad",
  L: "#ef7921",
};

/** Seconds a piece rests on the stack before it locks. */
export const LOCK_DELAY = 0.5;
/** Maximum move/rotate resets of the lock delay before a forced lock. */
export const MAX_LOCK_RESETS = 15;

/** Delayed Auto Shift: wait before a held left/right key starts repeating. */
export const DAS = 0.17;
/** Auto Repeat Rate: interval between repeats once DAS has elapsed. */
export const ARR = 0.05;

/** Soft drop is this many times faster than normal gravity. */
export const SOFT_DROP_FACTOR = 20;
/** Minimum gravity interval (seconds per row) so high levels stay playable. */
export const MIN_GRAVITY = 1 / 60;

/** How many pieces are shown in the next queue. */
export const NEXT_QUEUE_SIZE = 5;
/** Lines needed to advance one level. */
export const LINES_PER_LEVEL = 10;

/** Base score for clearing 0..4 lines, multiplied by the current level. */
export const LINE_SCORES = [0, 100, 300, 500, 800] as const;
/** Points per cell for a soft drop. */
export const SOFT_DROP_POINTS = 1;
/** Points per cell for a hard drop. */
export const HARD_DROP_POINTS = 2;
/** Combo bonus: 50 x combo x level. */
export const COMBO_POINTS = 50;
/** Back-to-back multiplier for difficult clears (Tetris / T-Spin). */
export const B2B_MULTIPLIER = 1.5;

/** T-Spin base scores (no lines, single, double, triple), multiplied by level. */
export const TSPIN_SCORES = [400, 800, 1200, 1600] as const;
/** Mini T-Spin base scores (no lines, single, double), multiplied by level. */
export const TSPIN_MINI_SCORES = [100, 200, 400] as const;
/** Perfect clear bonuses by lines cleared (single..tetris), multiplied by level. */
export const PERFECT_CLEAR_SCORES = [0, 800, 1200, 1800, 2000] as const;
/** Back-to-back Tetris perfect clear bonus, multiplied by level. */
export const PERFECT_CLEAR_B2B_TETRIS = 3200;

/**
 * Guideline gravity: seconds per row = (0.8 - (level - 1) * 0.007) ^ (level - 1).
 */
export function gravityInterval(level: number): number {
  const base = 0.8 - (level - 1) * 0.007;
  const seconds = Math.pow(base, level - 1);
  return Math.max(MIN_GRAVITY, seconds);
}
