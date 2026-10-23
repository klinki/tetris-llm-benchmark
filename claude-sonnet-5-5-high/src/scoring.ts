/** Guideline scoring and gravity rules. Pure functions, no state. */

export type TSpin = 'none' | 'mini' | 'full';

export const LINES_PER_LEVEL = 10;
export const MAX_LEVEL = 15;
export const SOFT_DROP_FACTOR = 20;

const LINE_POINTS: Record<TSpin, readonly number[]> = {
  none: [0, 100, 300, 500, 800],
  mini: [100, 200, 400],
  full: [400, 800, 1200, 1600],
};
const PERFECT_CLEAR_POINTS = [0, 800, 1200, 1800, 2000];
const BACK_TO_BACK_BONUS = 1.5;
const COMBO_POINTS = 50;

export function levelForLines(lines: number): number {
  return Math.min(MAX_LEVEL, Math.floor(lines / LINES_PER_LEVEL) + 1);
}

/** Milliseconds a piece takes to fall one row: (0.8 - (level - 1) * 0.007) ^ (level - 1) seconds. */
export function gravityInterval(level: number): number {
  return Math.pow(0.8 - (level - 1) * 0.007, level - 1) * 1000;
}

/** Tetrises and line-clearing T-spins are "difficult"; consecutive ones earn a back-to-back bonus. */
export function isDifficult(lines: number, tspin: TSpin): boolean {
  return lines > 0 && (lines === 4 || tspin !== 'none');
}

export interface ClearInput {
  lines: number;
  tspin: TSpin;
  level: number;
  /** The previous line clear was difficult too. */
  backToBack: boolean;
  /** Number of consecutive line-clearing locks before this one (0 for the first clear of a chain). */
  combo: number;
  perfectClear: boolean;
}

export function clearPoints({ lines, tspin, level, backToBack, combo, perfectClear }: ClearInput): number {
  let base = LINE_POINTS[tspin][lines] ?? 0;
  if (backToBack && isDifficult(lines, tspin)) base *= BACK_TO_BACK_BONUS;
  let points = base * level;
  if (lines > 0) points += COMBO_POINTS * combo * level;
  if (perfectClear) {
    const bonus = backToBack && lines === 4 ? 3200 : PERFECT_CLEAR_POINTS[lines];
    points += bonus * level;
  }
  return points;
}

/** Name shown to the player for a lock, e.g. "T-SPIN DOUBLE"; empty when nothing noteworthy happened. */
export function clearName(lines: number, tspin: TSpin): string {
  const names = ['', 'SINGLE', 'DOUBLE', 'TRIPLE', 'TETRIS'];
  if (tspin === 'none') return names[lines];
  const prefix = tspin === 'mini' ? 'T-SPIN MINI' : 'T-SPIN';
  return lines === 0 ? prefix : `${prefix} ${names[lines]}`;
}
