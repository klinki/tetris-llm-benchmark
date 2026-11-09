import type { ClearResult, ClearSummary } from './types.js';

/** One level for every ten cleared lines (Guideline). */
export function levelForLines(lines: number, startLevel = 1): number {
  return startLevel + Math.floor(lines / 10);
}

/**
 * Guideline gravity: seconds per row = (0.8 - (level-1)*0.007)^(level-1).
 * Returns milliseconds; levels 20+ are effectively instantaneous.
 */
export function gravityIntervalMs(level: number): number {
  if (level >= 20) return 1;
  const base = 0.8 - (level - 1) * 0.007;
  return Math.max(1, Math.pow(base, level - 1) * 1000);
}

const BASE: Record<number, number> = { 0: 0, 1: 100, 2: 300, 3: 500, 4: 800 };
const TSPIN_FULL: Record<number, number> = { 0: 400, 1: 800, 2: 1200, 3: 1600 };
const TSPIN_MINI: Record<number, number> = { 0: 100, 1: 200, 2: 400 };
const ALL_CLEAR: Record<number, number> = { 1: 800, 2: 1200, 3: 1800, 4: 2000 };
const LINE_LABELS = ['', 'SINGLE', 'DOUBLE', 'TRIPLE', 'TETRIS'];

/** Guideline scoring: line clears, T-Spins, combos, B2B, drops, all clear. */
export class Scoring {
  score = 0;
  lines = 0;
  level: number;
  /** -1 before the first clear; the 2nd consecutive clear onwards scores. */
  combo = -1;
  backToBack = false;

  constructor(private readonly startLevel = 1) {
    this.level = Math.max(1, startLevel);
  }

  softDrop(rows: number): void {
    this.score += rows; // 1 point per row
  }

  hardDrop(rows: number): void {
    this.score += rows * 2; // 2 points per row
  }

  registerClear(result: ClearResult): ClearSummary {
    const { lines, tSpin, perfectClear } = result;
    let points = 0;
    let label = '';

    if (lines > 0) {
      let table = BASE;
      let difficult = lines === 4;
      if (tSpin === 'full') {
        table = TSPIN_FULL;
        label = `T-SPIN ${LINE_LABELS[lines]}`;
        difficult = true;
      } else if (tSpin === 'mini') {
        table = TSPIN_MINI;
        label = `T-SPIN MINI ${LINE_LABELS[lines]}`;
        difficult = true;
      } else {
        label = LINE_LABELS[lines];
      }
      points = (table[lines] ?? BASE[lines] ?? 0) * this.level;

      // Back-to-back: +50% on consecutive "difficult" clears.
      if (difficult && this.backToBack) {
        points = Math.floor(points * 1.5);
        label = `B2B ${label}`;
      }
      this.backToBack = difficult;

      // Combo: 50 * combo * level, from the 2nd consecutive clear onwards.
      this.combo += 1;
      if (this.combo > 0) {
        points += 50 * this.combo * this.level;
        if (this.combo >= 2) label += `  COMBO x${this.combo}`;
      }

      this.lines += lines;
      this.level = levelForLines(this.lines, this.startLevel);

      if (perfectClear) {
        points += (ALL_CLEAR[lines] ?? 0) * this.level;
        label += '  ALL CLEAR';
      }
    } else {
      // A lock with no line clear breaks the combo but preserves B2B.
      this.combo = -1;
      if (tSpin === 'full') {
        points = TSPIN_FULL[0] * this.level;
        label = 'T-SPIN';
      } else if (tSpin === 'mini') {
        points = TSPIN_MINI[0] * this.level;
        label = 'T-SPIN MINI';
      }
    }

    this.score += points;
    return { points, label, lines };
  }
}
