// Super Rotation System wall-kick tables.
// Offsets are [dx, dy] with y growing downward (the wiki's y-up values negated).
// States: 0 = spawn, 1 = R, 2 = 180, 3 = L.
import type { PieceType, Rotation } from "./types.js";

type Kick = readonly [number, number];
type KickTable = Record<string, readonly Kick[]>;

/** Kicks for J, L, S, T, Z. */
const JLSTZ: KickTable = {
  "01": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "10": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "12": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "21": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "23": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "32": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "30": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "03": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
};

/** Kicks for the I piece. */
const I: KickTable = {
  "01": [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  "10": [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  "12": [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
  "21": [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  "23": [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  "32": [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  "30": [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  "03": [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
};

/**
 * Ordered wall-kick offsets to try when rotating `type` from `from` to `to`.
 * The first offset is always (0, 0) (the basic rotation). O never kicks.
 */
export function getKicks(type: PieceType, from: Rotation, to: Rotation): readonly Kick[] {
  if (type === "O") return [[0, 0]];
  const table = type === "I" ? I : JLSTZ;
  return table[`${from}${to}`] ?? [[0, 0]];
}

/** Rotate a state clockwise (+1) or counter-clockwise (-1). */
export function rotateState(state: Rotation, dir: 1 | -1): Rotation {
  return (((state + dir) % 4) + 4) % 4 as Rotation;
}
