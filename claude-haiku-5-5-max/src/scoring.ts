import { LINES_PER_LEVEL } from './constants.js';
import type { SpinKind } from './tspin.js';

/** Points for clearing 0 to 4 lines, before the level multiplier. */
const LINE_POINTS = [0, 100, 300, 500, 800];

/** T-spin points by lines cleared (0 to 3), before the level multiplier. */
const SPIN_POINTS: Record<'mini' | 'full', readonly number[]> = {
  mini: [100, 200, 400],
  full: [400, 800, 1200, 1600],
};

const COMBO_POINTS = 50;
const SOFT_DROP_POINTS = 1;
const HARD_DROP_POINTS = 2;
const BACK_TO_BACK_MULTIPLIER = 1.5;

/** Tracks score, lines, level, combos and back-to-back using the Guideline table. */
export class Scorer {
  private total = 0;
  private cleared = 0;
  /** Number of consecutive line-clearing locks minus one, or -1 when no combo is running. */
  private combo = -1;
  private backToBack = false;

  get score(): number {
    return this.total;
  }

  get lines(): number {
    return this.cleared;
  }

  get level(): number {
    return Math.floor(this.cleared / LINES_PER_LEVEL) + 1;
  }

  softDrop(cells: number): void {
    this.total += cells * SOFT_DROP_POINTS;
  }

  hardDrop(cells: number): void {
    this.total += cells * HARD_DROP_POINTS;
  }

  /** Scores a locked piece that cleared `lines` rows. Returns the points awarded. */
  lock(lines: number, spin: SpinKind): number {
    const level = this.level;
    const difficult = lines === 4 || (spin !== 'none' && lines > 0);
    let points = basePoints(lines, spin) * level;

    if (lines === 0) {
      this.combo = -1;
    } else {
      if (difficult && this.backToBack) {
        points = Math.floor(points * BACK_TO_BACK_MULTIPLIER);
      }
      this.combo += 1;
      if (this.combo > 0) points += COMBO_POINTS * this.combo * level;
      this.backToBack = difficult;
      this.cleared += lines;
    }

    this.total += points;
    return points;
  }
}

function basePoints(lines: number, spin: SpinKind): number {
  if (spin === 'none') return LINE_POINTS[lines] ?? 0;
  return SPIN_POINTS[spin][lines] ?? 0;
}
