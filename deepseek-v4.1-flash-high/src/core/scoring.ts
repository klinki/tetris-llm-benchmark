/** Guideline gravity, level progression and scoring. */

import { MIN_GRAVITY_MS } from "./constants.js";
import type { TSpinKind } from "./types.js";

/** Seconds per row fall, from the Guideline formula. */
export function gravityIntervalMs(level: number): number {
  const clamped = Math.max(1, Math.min(level, 20));
  const seconds = Math.pow(0.8 - (clamped - 1) * 0.007, clamped - 1);
  return Math.max(MIN_GRAVITY_MS, seconds * 1000);
}

/** One level per ten cleared lines. */
export function levelForLines(lines: number): number {
  return 1 + Math.floor(Math.max(0, lines) / 10);
}

const LINE_SCORES: Record<number, number> = {
  1: 100,
  2: 300,
  3: 500,
  4: 800,
};

/** Base points before the level multiplier, back-to-back and combo. */
export function baseClearScore(lines: number, tspin: TSpinKind): number {
  if (tspin === "full") {
    switch (lines) {
      case 0:
        return 400;
      case 1:
        return 800;
      case 2:
        return 1200;
      case 3:
        return 1600;
      default:
        break;
    }
  }
  if (tspin === "mini") {
    switch (lines) {
      case 0:
        return 100;
      case 1:
        return 200;
      case 2:
        return 400;
      default:
        break;
    }
  }
  return LINE_SCORES[lines] ?? 0;
}

const PERFECT_CLEAR_BONUS: Record<number, number> = { 1: 800, 2: 1200, 3: 1800, 4: 2000 };
const PERFECT_CLEAR_BONUS_B2B: Record<number, number> = { 1: 1200, 2: 1500, 3: 2800, 4: 3200 };

export interface ScoreInput {
  lines: number;
  tspin: TSpinKind;
  perfectClear: boolean;
  /** Level at the moment the piece locked. */
  level: number;
  /** Whether the previous cleared line set was difficult (tetris or full T-spin). */
  backToBack: boolean;
  /** Consecutive line clears so far, 0 for the first clear of a run. */
  combo: number;
}

export interface ScoreResult {
  points: number;
  backToBack: boolean;
}

/** Applies level, back-to-back bonus, combo bonus and perfect clear bonus. */
export function scoreClear(input: ScoreInput): ScoreResult {
  const { lines, tspin, level, perfectClear } = input;
  let points = baseClearScore(lines, tspin) * level;
  const wasBackToBack = input.backToBack;
  let backToBack = wasBackToBack;

  if (lines > 0) {
    const difficult = lines === 4 || tspin === "full";
    if (wasBackToBack && difficult) points = Math.floor(points * 1.5);
    backToBack = difficult;

    if (input.combo > 0) points += 50 * input.combo * level;
    if (perfectClear) {
      const bonus = wasBackToBack ? PERFECT_CLEAR_BONUS_B2B : PERFECT_CLEAR_BONUS;
      points += (bonus[lines] ?? 0) * level;
    }
  }

  return { points, backToBack };
}

/** Points awarded for the distance a piece is soft-dropped. */
export const SOFT_DROP_POINTS_PER_CELL = 1;

/** Points awarded for the distance a piece is hard-dropped. */
export const HARD_DROP_POINTS_PER_CELL = 2;
