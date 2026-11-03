/**
 * Guideline numbers: the gravity curve, level progression and scoring table.
 */

export type TSpinKind = "none" | "mini" | "full";

/**
 * Seconds a piece takes to fall one row at the given level, following the
 * guideline marathon curve (0.8 - (level - 1) * 0.007) ^ (level - 1).
 * The curve is capped at level 20 where it is effectively 20G.
 */
export function gravitySeconds(level: number): number {
  const capped = Math.min(level, 20);
  return Math.pow(0.8 - (capped - 1) * 0.007, capped - 1);
}

/** Fixed goal: the level rises every 10 cleared lines. */
export function levelForLines(lines: number): number {
  return Math.floor(lines / 10) + 1;
}

/** Base points before the level multiplier. */
export const LINE_CLEAR_POINTS = [0, 100, 300, 500, 800]; // single, double, triple, tetris
export const TSPIN_POINTS = [400, 800, 1200, 1600]; // T-spin with 0..3 lines
export const MINI_TSPIN_POINTS = [100, 200, 1200]; // mini T-spin with 0..2 lines

export const BACK_TO_BACK_MULTIPLIER = 1.5; // applies to Tetris and T-spin clears
export const COMBO_POINTS = 50; // x combo count x level
export const SOFT_DROP_POINTS = 1; // per cell
export const HARD_DROP_POINTS = 2; // per cell
