/** Super Rotation System wall-kick tables.
 *  Offsets are [dx, dy] with y growing downwards; indexed by the rotation
 *  state the piece is rotating FROM. Test order matters: the first offset
 *  that fits is used, and its index is needed for T-spin detection. */

import type { PieceType } from './pieces.js';

export type Kick = readonly [number, number];

const JLSTZ_CW: readonly (readonly Kick[])[] = [
  [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],   // 0 -> R
  [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],     // R -> 2
  [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],      // 2 -> L
  [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],  // L -> 0
];

const JLSTZ_CCW: readonly (readonly Kick[])[] = [
  [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],      // 0 -> L
  [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],     // R -> 0
  [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],   // 2 -> R
  [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],  // L -> 2
];

const I_CW: readonly (readonly Kick[])[] = [
  [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],    // 0 -> R
  [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],    // R -> 2
  [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],    // 2 -> L
  [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],    // L -> 0
];

const I_CCW: readonly (readonly Kick[])[] = [
  [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],    // 0 -> L
  [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],    // R -> 0
  [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],    // 2 -> R
  [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],    // L -> 2
];

const NO_KICK: readonly Kick[] = [[0, 0]];

/** Kick offsets to try when rotating `type` from state `from` by `dir`
 *  (+1 clockwise, -1 counter-clockwise). */
export function kicksFor(type: PieceType, from: number, dir: 1 | -1): readonly Kick[] {
  if (type === 'O') return NO_KICK;
  if (type === 'I') return dir > 0 ? I_CW[from] : I_CCW[from];
  return dir > 0 ? JLSTZ_CW[from] : JLSTZ_CCW[from];
}