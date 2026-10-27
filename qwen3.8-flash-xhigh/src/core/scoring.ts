/** Guideline scoring: action values, back-to-back, combo and perfect clears. */

export type TSpin = 'none' | 'full' | 'mini';

export interface ClearContext {
  /** Rows cleared by the lock (0..4). */
  lines: number;
  /** How the piece entered its final position. */
  tspin: TSpin;
  /** Board is empty after the clear (perfect clear). */
  perfect: boolean;
  /** The previous line clear was a difficult one (Tetris or T-spin). */
  wasB2B: boolean;
  /** Consecutive line-clearing pieces, 1 for the first clear. */
  comboCount: number;
  level: number;
}

const LINE_SCORES = [0, 100, 300, 500, 800];
const TSPIN_SCORES = [400, 800, 1200, 1600]; // index = lines cleared
const MINI_TSPIN_SCORES = [100, 200, 400, 600];
const PERFECT_SCORES = [0, 2000, 3000, 4000, 8000];
const B2B_PERFECT_SCORE = 10000;
const COMBO_UNIT = 50;

/** A difficult clear continues the back-to-back chain. */
export function isDifficult(lines: number, tspin: TSpin): boolean {
  return lines > 0 && (lines === 4 || tspin !== 'none');
}

/**
 * Points awarded for locking a piece: Guideline clear values with T-spin
 * bonuses, a x1.5 back-to-back multiplier for chained difficult clears,
 * perfect-clear values that replace the normal clear value, and a combo
 * bonus of 50 x (combo-1). Everything scales with the level.
 */
export function clearPoints(ctx: ClearContext): number {
  const difficult = isDifficult(ctx.lines, ctx.tspin);

  let base: number;
  if (ctx.perfect && ctx.lines > 0) {
    // Perfect clears have their own table; B2B perfect is baked into the value.
    base = difficult && ctx.wasB2B ? B2B_PERFECT_SCORE : PERFECT_SCORES[ctx.lines];
  } else if (ctx.tspin !== 'none' && ctx.lines <= 3) {
    base = (ctx.tspin === 'full' ? TSPIN_SCORES : MINI_TSPIN_SCORES)[ctx.lines];
  } else {
    base = LINE_SCORES[ctx.lines] ?? 0;
  }

  const multiplier = !ctx.perfect && difficult && ctx.wasB2B ? 1.5 : 1;
  const comboBonus = ctx.comboCount >= 2 ? COMBO_UNIT * (ctx.comboCount - 1) : 0;

  return Math.floor(base * multiplier + comboBonus) * ctx.level;
}
