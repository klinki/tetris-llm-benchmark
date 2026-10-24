/**
 * Guideline timing and scoring tables.
 *
 * Gravity follows the Guideline formula:
 *   (0.8 - (level - 1) * 0.007) ^ (level - 1) seconds per row.
 */

export type SpinKind = 'none' | 'mini' | 'tspin';

export const LOCK_DELAY_SECONDS = 0.5;
export const MAX_LOCK_RESETS = 15;
export const SOFT_DROP_MULTIPLIER = 20;
export const LEVEL_LINES = 10;
export const COMBO_POINTS = 50;

const LINE_POINTS = [0, 100, 300, 500, 800] as const;
const TSPIN_POINTS = [400, 800, 1200, 1600] as const;
const TSPIN_MINI_POINTS = [100, 200, 400, 400] as const;
const PERFECT_CLEAR_POINTS = [0, 800, 1200, 1800, 2000] as const;

export function gravitySeconds(level: number): number {
  const safeLevel = Math.max(1, Math.floor(level));
  const exponent = safeLevel - 1;
  const base = 0.8 - exponent * 0.007;
  // Very high levels approach 20G; keep the interval finite.
  return Math.max(0.001, Math.pow(Math.max(0.05, base), exponent));
}

/** Base points before the level multiplier, B2B and combo bonuses. */
export function baseClearPoints(lines: number, spin: SpinKind): number {
  const count = Math.max(0, Math.min(4, Math.floor(lines)));
  if (spin === 'tspin') return TSPIN_POINTS[Math.min(3, count)];
  if (spin === 'mini') return TSPIN_MINI_POINTS[Math.min(3, count)];
  return LINE_POINTS[count] ?? 0;
}

export function isDifficultClear(lines: number, spin: SpinKind): boolean {
  return lines > 0 && (lines >= 4 || spin !== 'none');
}

export function perfectClearPoints(lines: number): number {
  return PERFECT_CLEAR_POINTS[Math.max(0, Math.min(4, Math.floor(lines)))] ?? 0;
}
