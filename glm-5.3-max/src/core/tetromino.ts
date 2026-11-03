/**
 * Tetromino definitions: spawn shapes, SRS rotation states and wall kick data.
 *
 * Reference: Tetris Guideline / Super Rotation System.
 * Coordinates use x growing right and y growing DOWN (screen direction), so the
 * y values of the published kick tables (which use "positive y = up") are negated.
 */

export type PieceType = "I" | "J" | "L" | "O" | "S" | "T" | "Z";

/** A cell offset [x, y] inside a piece's rotation box. */
export type Cell = readonly [number, number];

/** Rotation states: 0 = spawn, 1 = clockwise, 2 = 180°, 3 = counter-clockwise. */
export type Rotation = 0 | 1 | 2 | 3;

export interface Tetromino {
  readonly type: PieceType;
  /** Side length of the square rotation box (I: 4, J/L/S/T/Z: 3, O: 2). */
  readonly box: number;
  /** Box column where the piece spawns on the 10 wide playfield. */
  readonly spawnX: number;
  /** The four rotation states as cell offsets from the box's top-left corner. */
  readonly states: readonly (readonly Cell[])[];
}

/**
 * Spawn shapes per the guideline: every piece lies horizontally, J/L/T point up
 * (flat side down), the 3 wide pieces spawn rounded to the left (box column 3)
 * while I and O spawn centrally.
 */
const SPAWN: Record<PieceType, { box: number; spawnX: number; cells: Cell[] }> = {
  I: { box: 4, spawnX: 3, cells: [[0, 1], [1, 1], [2, 1], [3, 1]] },
  J: { box: 3, spawnX: 3, cells: [[0, 0], [0, 1], [1, 1], [2, 1]] },
  L: { box: 3, spawnX: 3, cells: [[2, 0], [0, 1], [1, 1], [2, 1]] },
  O: { box: 2, spawnX: 4, cells: [[0, 0], [1, 0], [0, 1], [1, 1]] },
  S: { box: 3, spawnX: 3, cells: [[1, 0], [2, 0], [0, 1], [1, 1]] },
  T: { box: 3, spawnX: 3, cells: [[1, 0], [0, 1], [1, 1], [2, 1]] },
  Z: { box: 3, spawnX: 3, cells: [[0, 0], [1, 0], [1, 1], [2, 1]] },
};

/** Rotates a shape 90° clockwise inside its box (y grows downwards). */
function rotateCW(cells: readonly Cell[], box: number): Cell[] {
  return cells.map(([x, y]) => [box - 1 - y, x] as Cell);
}

function buildStates(type: PieceType): Tetromino {
  const def = SPAWN[type];
  const states: Cell[][] = [def.cells];
  for (let i = 1; i < 4; i++) states.push(rotateCW(states[i - 1], def.box));
  return { type, box: def.box, spawnX: def.spawnX, states };
}

export const PIECES: Record<PieceType, Tetromino> = {
  I: buildStates("I"),
  J: buildStates("J"),
  L: buildStates("L"),
  O: buildStates("O"),
  S: buildStates("S"),
  T: buildStates("T"),
  Z: buildStates("Z"),
};

/** The O piece rotates in place and never needs a kick. */
const NO_KICKS: readonly Cell[] = [[0, 0]];

/**
 * SRS wall kick tests, indexed [from][to], in grid coordinates (y down).
 * Symmetry of the published tables means each list serves two transitions.
 */
const KICK_JLSTZ_TO_CW = [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]] as const; // 0->1 and 2->1
const KICK_JLSTZ_FROM_CW = [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]] as const; // 1->0 and 1->2
const KICK_JLSTZ_TO_CCW = [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]] as const; // 0->3 and 2->3
const KICK_JLSTZ_FROM_CCW = [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]] as const; // 3->0 and 3->2

const KICK_I_TO_CW = [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]] as const; // 0->1 and 3->2
const KICK_I_FROM_CW = [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]] as const; // 1->0 and 2->3
const KICK_I_TO_180 = [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]] as const; // 1->2 and 0->3
const KICK_I_FROM_180 = [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]] as const; // 2->1 and 3->0

const JLSTZ_KICKS: readonly (readonly (readonly Cell[])[])[] = [
  [NO_KICKS, KICK_JLSTZ_TO_CW, NO_KICKS, KICK_JLSTZ_TO_CCW],
  [KICK_JLSTZ_FROM_CW, NO_KICKS, KICK_JLSTZ_FROM_CW, NO_KICKS],
  [NO_KICKS, KICK_JLSTZ_TO_CW, NO_KICKS, KICK_JLSTZ_TO_CCW],
  [KICK_JLSTZ_FROM_CCW, NO_KICKS, KICK_JLSTZ_FROM_CCW, NO_KICKS],
];

const I_KICKS: readonly (readonly (readonly Cell[])[])[] = [
  [NO_KICKS, KICK_I_TO_CW, NO_KICKS, KICK_I_TO_180],
  [KICK_I_FROM_CW, NO_KICKS, KICK_I_TO_180, NO_KICKS],
  [NO_KICKS, KICK_I_FROM_180, NO_KICKS, KICK_I_FROM_CW],
  [KICK_I_FROM_180, NO_KICKS, KICK_I_TO_CW, NO_KICKS],
];

/** Kick tests to try, in order, when rotating a piece from one state to another. */
export function wallKicks(type: PieceType, from: Rotation, to: Rotation): readonly Cell[] {
  if (type === "O") return NO_KICKS;
  return (type === "I" ? I_KICKS : JLSTZ_KICKS)[from][to];
}
