export type TSpin = 'none' | 'mini' | 'full';

export const BACK_TO_BACK_MULTIPLIER = 1.5;
export const COMBO_POINTS = 50;

/** Guideline points per lock, before multiplying by the level; indexed by lines cleared. */
const BASE_POINTS: Readonly<Record<TSpin, readonly number[]>> = {
  none: [0, 100, 300, 500, 800],
  mini: [100, 200, 400],
  full: [400, 800, 1200, 1600],
};

const CLEAR_NAMES = ['', 'Single', 'Double', 'Triple', 'Tetris'];
const T_SPIN_NAMES: Readonly<Record<TSpin, string>> = { none: '', mini: 'T-Spin Mini', full: 'T-Spin' };

export function basePoints(lines: number, tSpin: TSpin): number {
  return BASE_POINTS[tSpin][lines] ?? 0;
}

/** Display name such as "Tetris" or "T-Spin Double". */
export function clearName(lines: number, tSpin: TSpin): string {
  return [T_SPIN_NAMES[tSpin], CLEAR_NAMES[lines]].filter(Boolean).join(' ');
}

/** Tetrises and line-clearing T-Spins are "difficult" and chain Back-to-Back bonuses. */
export function isDifficult(lines: number, tSpin: TSpin): boolean {
  return lines === 4 || (lines > 0 && tSpin !== 'none');
}
