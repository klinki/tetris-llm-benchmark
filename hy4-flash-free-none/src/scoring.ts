import { CLEAR_POINTS } from './constants';

export type ClearType = 'none' | 'single' | 'double' | 'triple' | 'tetris';

export interface ScoringState {
  score: number;
  level: number;
  lines: number;
}

/** Map a number of cleared lines to its Guideline clear type. */
export function clearType(lines: number): ClearType {
  switch (lines) {
    case 0: return 'none';
    case 1: return 'single';
    case 2: return 'double';
    case 3: return 'triple';
    case 4: return 'tetris';
    default: return 'tetris';
  }
}

/**
 * Guideline scoring table (level multiplier applied to all line-clear scores):
 *   Single 100, Double 300, Triple 500, Tetris 800
 *   Combo: 50 * combo * level
 *   Back-to-back tetris: x1.5
 *   Soft drop: 1 point per cell, hard drop: 2 points per cell.
 *   T-spin scoring is omitted here (kept simple per the README).
 */
export class Scoring {
  score = 0;
  level = 1;
  lines = 0;
  combo = -1;
  backToBack = false;

  reset(): void {
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.combo = -1;
    this.backToBack = false;
  }

  /** Apply a line clear and return the points earned. */
  applyClear(cleared: number): number {
    let gained = 0;
    if (cleared > 0) {
      this.combo++;
      const base = CLEAR_POINTS[cleared] ?? CLEAR_POINTS[4];
      gained = base * this.level;

      // Back-to-back: consecutive tetrises get a 1.5x bonus.
      const isTetris = cleared === 4;
      if (this.backToBack && isTetris) {
        gained = Math.floor(gained * 1.5);
      }
      this.backToBack = isTetris;

      // Combo bonus (combo starts at 0 for the first clear).
      if (this.combo > 0) {
        gained += 50 * this.combo * this.level;
      }

      this.lines += cleared;
      this.level = Math.floor(this.lines / 10) + 1;
      this.score += gained;
    } else {
      this.combo = -1;
    }
    return gained;
  }

  addSoftDrop(cells: number): void {
    this.score += cells;
  }

  addHardDrop(cells: number): void {
    this.score += cells * 2;
  }

  snapshot(): ScoringState {
    return { score: this.score, level: this.level, lines: this.lines };
  }
}
