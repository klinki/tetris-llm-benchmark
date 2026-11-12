import { B2B_MULTIPLIER, COMBO_POINTS } from './constants.js';

/** Kind of T-spin that was performed. */
export type TSpin = 'none' | 'mini' | 'full';

/** Base points for a regular line clear. */
const LINE_SCORES = [0, 100, 300, 500, 800];
/** Base points for a full T-spin (0..4 lines). */
const TSPIN_SCORES = [400, 800, 1200, 1600];
/** Base points for a mini T-spin (0..4 lines). */
const MINI_TSPIN_SCORES = [100, 200, 400, 800];

/** Input of {@link scoreClear}. */
export interface ClearInput {
  /** Number of cleared lines. */
  lines: number;
  /** T-spin status of the locked piece. */
  tspin: TSpin;
  /** Current level. */
  level: number;
  /** Current combo counter (-1 when there is no combo). */
  combo: number;
  /** Whether the previous clear was a back-to-back difficult clear. */
  backToBack: boolean;
}

/** Result of scoring a lock. */
export interface ClearResult {
  /** Points awarded for the lock. */
  points: number;
  /** New combo counter. */
  combo: number;
  /** New back-to-back state. */
  backToBack: boolean;
  /** Whether this clear keeps (or extends) a back-to-back chain. */
  difficult: boolean;
}

/** Scores a lock and returns the updated combo / back-to-back state. */
export function scoreClear(input: ClearInput): ClearResult {
  const { lines, tspin, level, combo, backToBack } = input;

  let base = 0;
  if (tspin === 'full') base = TSPIN_SCORES[Math.min(lines, 4)]!;
  else if (tspin === 'mini') base = MINI_TSPIN_SCORES[Math.min(lines, 4)]!;
  else base = LINE_SCORES[Math.min(lines, 4)]!;

  // A tetris or a T-spin with lines is a "difficult" clear.
  const difficult = lines === 4 || (tspin !== 'none' && lines > 0);
  let points = base * level;

  if (difficult && backToBack) {
    points = Math.floor(points * B2B_MULTIPLIER);
  }

  let nextCombo = combo;
  if (lines > 0) {
    nextCombo = combo + 1;
    if (nextCombo > 0) points += COMBO_POINTS * nextCombo * level;
  } else {
    nextCombo = -1;
  }

  return {
    points,
    combo: nextCombo,
    backToBack: difficult ? backToBack || difficult : false,
    difficult,
  };
}
