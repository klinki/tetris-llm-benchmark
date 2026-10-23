import type { Board } from './board.js';
import type { Cell, Rotation } from './pieces.js';

export type Spin = 'none' | 'mini' | 'full';

const LINE_POINTS = [0, 100, 300, 500, 800];
const MINI_T_SPIN_POINTS = [100, 200, 400];
const T_SPIN_POINTS = [400, 800, 1200, 1600];
const ALL_CLEAR_POINTS = [0, 800, 1200, 1800, 2000];

export const LINE_CLEAR_NAMES = ['', 'Single', 'Double', 'Triple', 'Tetris'];
export const COMBO_POINTS = 50;

// The T's centre sits at box (1, 1), so its four diagonal corners are the box corners.
const CORNERS: readonly Cell[] = [[0, 0], [2, 0], [0, 2], [2, 2]];

// The two corners on the side the T points to, for each rotation.
const FRONT_CORNERS: Record<Rotation, readonly [Cell, Cell]> = {
  0: [[0, 0], [2, 0]],
  1: [[2, 0], [2, 2]],
  2: [[0, 2], [2, 2]],
  3: [[0, 0], [0, 2]],
};

/**
 * Three-corner T-spin rule, checked before the T is locked. At least three of the
 * four corners must be blocked (by a block or the board edge). The spin is a mini
 * when the two front corners are not both blocked, unless the fifth SRS kick was used.
 */
export function detectTSpin(
  board: Board,
  rotation: Rotation,
  x: number,
  y: number,
  kickIndex: number,
): Spin {
  const blocked = ([dx, dy]: Cell): boolean => !board.isFree(x + dx, y + dy);
  if (CORNERS.filter(blocked).length < 3) return 'none';
  const [first, second] = FRONT_CORNERS[rotation];
  if ((blocked(first) && blocked(second)) || kickIndex === 4) return 'full';
  return 'mini';
}

/** Points for clearing `lines` rows, before the level and back-to-back multipliers. */
export function basePoints(lines: number, spin: Spin): number {
  if (spin === 'full') return T_SPIN_POINTS[Math.min(lines, 3)];
  if (spin === 'mini') return MINI_T_SPIN_POINTS[Math.min(lines, 2)];
  return LINE_POINTS[lines];
}

export function allClearPoints(lines: number): number {
  return ALL_CLEAR_POINTS[lines];
}

/** Clears that earn the back-to-back bonus: Tetrises and T-spins that clear lines. */
export function isDifficult(lines: number, spin: Spin): boolean {
  return lines === 4 || (spin !== 'none' && lines > 0);
}
