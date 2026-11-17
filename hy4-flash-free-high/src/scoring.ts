import { LINE_SCORES } from './constants.js';

/** Guideline line-clear score, including the 1.5x back-to-back Tetris bonus. */
export function lineClearScore(lines: number, level: number, backToBack: boolean): number {
  if (lines < 1 || lines > 4) return 0;
  let points = LINE_SCORES[lines] * level;
  if (backToBack && lines === 4) points *= 1.5;
  return Math.round(points);
}

/** Guideline combo bonus. `combo` is the number of consecutive clears minus one. */
export function comboScore(combo: number, level: number): number {
  return combo > 0 ? 50 * combo * level : 0;
}
