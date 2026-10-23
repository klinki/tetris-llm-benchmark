import { LINE_SCORES, COMBO_SCORE, LINES_PER_LEVEL } from './constants.js';

/** Guideline score for clearing `count` lines at `level` with combo index `combo`. */
export function lineClearScore(count: number, level: number, combo: number): number {
  if (count <= 0) return 0;
  const base = (LINE_SCORES[count] ?? 0) * level;
  const comboBonus = COMBO_SCORE * Math.max(combo, 0) * level;
  return base + comboBonus;
}

/** Guideline level derived from the number of cleared lines. */
export function levelForLines(lines: number): number {
  return 1 + Math.floor(lines / LINES_PER_LEVEL);
}
