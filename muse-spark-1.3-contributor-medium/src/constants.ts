export const COLS = 10;
export const ROWS = 20;
export const HIDDEN_ROWS = 2;
export const TOTAL_ROWS = ROWS + HIDDEN_ROWS;

export const LOCK_DELAY_MS = 500;
export const MAX_LOCK_RESETS = 15;

export type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export const COLORS: Record<PieceType, string> = {
  I: '#00e5ff',
  O: '#ffd600',
  T: '#c651ff',
  S: '#00e676',
  Z: '#ff3d5a',
  J: '#4d7cff',
  L: '#ff9100',
};

export const LINE_SCORES = [0, 100, 300, 500, 800];

/** Guideline gravity: seconds per row for a level. */
export function gravityIntervalSec(level: number): number {
  const l = Math.max(1, Math.min(level, 20));
  return Math.pow(0.8 - (l - 1) * 0.007, l - 1);
}
