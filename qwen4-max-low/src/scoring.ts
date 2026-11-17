// Guideline scoring for line clears, T-Spins, back-to-back and perfect clears.
import {
  B2B_MULTIPLIER,
  LINE_SCORES,
  PERFECT_CLEAR_B2B_TETRIS,
  PERFECT_CLEAR_SCORES,
  TSPIN_MINI_SCORES,
  TSPIN_SCORES,
} from "./constants.js";

export type TSpinKind = "none" | "mini" | "full";

export interface ClearResult {
  points: number;
  /** Whether this clear continues a back-to-back chain (Tetris / T-Spin). */
  difficult: boolean;
}

/**
 * Score a lock that cleared `lines` rows. `tSpin` describes the detected spin,
 * `backToBack` whether the previous difficult clear is still chained.
 */
export function scoreClear(
  lines: number,
  tSpin: TSpinKind,
  backToBack: boolean,
  level: number,
  perfectClear: boolean,
): ClearResult {
  const difficult = lines === 4 || (tSpin !== "none" && lines > 0);

  let base: number;
  if (tSpin === "full") {
    base = TSPIN_SCORES[Math.min(lines, 3)];
  } else if (tSpin === "mini") {
    base = TSPIN_MINI_SCORES[Math.min(lines, 2)];
  } else {
    base = LINE_SCORES[Math.min(lines, 4)];
  }

  let points = base * level;
  if (difficult && backToBack) points = Math.floor(points * B2B_MULTIPLIER);

  if (perfectClear && lines > 0) {
    const pc = lines === 4 && backToBack ? PERFECT_CLEAR_B2B_TETRIS : PERFECT_CLEAR_SCORES[lines];
    points += pc * level;
  }

  return { points, difficult };
}
