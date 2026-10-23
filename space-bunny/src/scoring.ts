/**
 * Guideline scoring and gravity.
 *
 * All functions here are pure so the tests can verify them in isolation.
 */

import type { ClearKind, TSpinKind } from './types.js';

/** Points for 1 to 4 cleared lines. */
export const LINE_SCORE = [0, 100, 300, 500, 800] as const;

/** Points for a T-Spin clearing 0 to 3 lines. */
export const TSPIN_SCORE = [400, 800, 1200, 1600] as const;

/** Points for a mini T-Spin clearing 0 to 2 lines. */
export const TSPIN_MINI_SCORE = [100, 200, 400, 400] as const;

/** Perfect clear bonus for 1 to 4 lines. */
export const PERFECT_CLEAR_SCORE = [0, 800, 1200, 1800, 2000] as const;

/** Multiplier for difficult clears chained back to back. */
export const B2B_MULTIPLIER = 1.5;

/** Combo bonus per combo step. */
export const COMBO_BONUS = 50;

/** Tetrises and every T-Spin qualify for the back-to-back bonus. */
export function isDifficult(kind: ClearKind, lines: number): boolean {
  return lines === 4 || kind !== 'line';
}

/** Maps a T-Spin result onto the scoring table it uses. */
export function clearKindOf(tspin: TSpinKind): ClearKind {
  if (tspin === 'full') return 'tspin';
  if (tspin === 'mini') return 'tspin-mini';
  return 'line';
}

/** Base value of a clear, before level and back-to-back multipliers. */
export function clearScore(kind: ClearKind, lines: number): number {
  switch (kind) {
    case 'tspin':
      return TSPIN_SCORE[Math.min(lines, 3)];
    case 'tspin-mini':
      return TSPIN_MINI_SCORE[Math.min(lines, 2)];
    default:
      return LINE_SCORE[Math.min(lines, 4)];
  }
}

/** Combo bonus; `combo` is the number of chained clears minus one. */
export function comboScore(combo: number, level: number): number {
  if (combo <= 0) return 0;
  return COMBO_BONUS * combo * level;
}

/** Bonus awarded when the field is empty after a clear. */
export function perfectClearScore(lines: number): number {
  return PERFECT_CLEAR_SCORE[Math.min(lines, 4)];
}

/**
 * Guideline gravity: seconds per row are `(0.8 - (level - 1) * 0.007)^(level - 1)`.
 * Returned in milliseconds, which is what the update loop works with.
 */
export function gravityMs(level: number): number {
  const l = Math.max(1, Math.floor(level));
  return 1000 * Math.pow(0.8 - (l - 1) * 0.007, l - 1);
}

/** Formats a score with thin separators for the UI. */
export function formatScore(score: number): string {
  return score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}