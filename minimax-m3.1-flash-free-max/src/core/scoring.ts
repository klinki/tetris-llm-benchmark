import { MAX_LEVEL } from './constants.js';

/** Guideline points for clearing 0, 1, 2, 3 or 4 lines. */
export const LINE_CLEAR_POINTS = [0, 100, 300, 500, 800];

/** Bonus for every additional line of a combo. */
export const COMBO_BONUS = 50;

/** Bonus for every additional link of a back-to-back chain. */
export const B2B_BONUS = 50;

/** Multiplier applied to the base points of a chained difficult clear. */
export const B2B_MULTIPLIER = 1.5;

export const SOFT_DROP_POINTS = 1;
export const HARD_DROP_POINTS = 2;

/** Triples and tetrises are the difficult clears that keep a chain alive. */
export function isDifficultClear(lines: number): boolean {
  return lines >= 3;
}

/** The level a player reaches after clearing the given amount of lines. */
export function levelForLines(lines: number): number {
  return Math.min(MAX_LEVEL, Math.floor(lines / 10) + 1);
}

/**
 * Points of a line clear: base points times the level, a combo bonus for
 * consecutive clears and a back-to-back bonus for chained difficult clears.
 */
export function lineClearPoints(
  lines: number,
  level: number,
  combo: number,
  b2bStreak: number,
): number {
  let points = LINE_CLEAR_POINTS[lines] * level;
  if (isDifficultClear(lines) && b2bStreak >= 2) {
    points = points * B2B_MULTIPLIER + B2B_BONUS * (b2bStreak - 1) * level;
  }
  if (combo > 0) points += COMBO_BONUS * combo * level;
  return Math.floor(points);
}
