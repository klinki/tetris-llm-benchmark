import type { Offset, PieceType, Rotation } from './pieces.js';

/*
 * Super Rotation System wall kicks. Each table is keyed by "from>to" rotation
 * states. Offsets are [x, y] with +y pointing up, as in the SRS reference; the
 * board's rows grow downward, so the y value is negated when it is applied.
 * Kicks are tried in order and the first placement that fits wins.
 */

const JLSTZ_KICKS: Readonly<Record<string, readonly Offset[]>> = {
  '0>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '1>0': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '1>2': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '2>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '2>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '3>2': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '3>0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '0>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
};

const I_KICKS: Readonly<Record<string, readonly Offset[]>> = {
  '0>1': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '1>0': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '1>2': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  '2>1': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '2>3': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '3>2': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '3>0': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '0>3': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
};

/** The O piece never changes shape, so rotating it never needs a kick. */
const NO_KICK: readonly Offset[] = [[0, 0]];

/** Kick offsets to try, in order, when rotating `type` from `from` to `to`. */
export function kickOffsets(type: PieceType, from: Rotation, to: Rotation): readonly Offset[] {
  if (type === 'O') return NO_KICK;
  const table = type === 'I' ? I_KICKS : JLSTZ_KICKS;
  return table[`${from}>${to}`] ?? NO_KICK;
}
