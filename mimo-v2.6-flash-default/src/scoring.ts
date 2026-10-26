import { SOFT_DROP_FACTOR } from './constants.js';
import type { Spin } from './constants.js';

/** Guideline points for clearing lines, multiplied by the current level. */
export function pointsForClear(lines: number, spin: Spin, level: number): number {
  let base: number;
  if (spin === 'full') {
    base = [0, 800, 1200, 1600, 0][lines] ?? 0; // T-spin single/double/triple
  } else if (spin === 'mini') {
    base = [0, 100, 200, 0, 0][lines] ?? 0; // mini T-spin single/double
  } else {
    base = [0, 100, 300, 500, 800][lines] ?? 0; // single/double/triple/tetris
  }
  return base * level;
}

/** Extra points when the board is empty after a clear. */
export function perfectClearBonus(lines: number, spin: Spin, level: number): number {
  if (spin === 'none') return ([0, 100, 300, 500, 800][lines] ?? 0) * level;
  return ([0, 800, 1200, 1600, 0][lines] ?? 0) * level;
}

/** Combo bonus: 50 x combo x level for consecutive clears (combo counts from 1). */
export function comboPoints(combo: number, level: number): number {
  return Math.max(combo, 0) * 50 * level;
}

/** Level rises every 10 lines cleared. */
export function levelFor(lines: number): number {
  return Math.floor(lines / 10) + 1;
}

/** Guideline gravity: seconds per row, `(0.8 - (level-1) * 0.007) ^ (level-1)`. */
export function gravitySeconds(level: number): number {
  const l = Math.max(1, level);
  const base = 0.8 - (l - 1) * 0.007;
  if (base <= 0.01) return 1 / 60; // very fast levels are capped at one row per frame
  return Math.max(Math.pow(base, l - 1), 1 / 60);
}

/** Soft drop runs 20x gravity, never slower than one row per frame. */
export function softDropSeconds(level: number): number {
  return Math.max(gravitySeconds(level) / SOFT_DROP_FACTOR, 1 / 60);
}
