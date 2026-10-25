/**
 * Tetromino definitions following the Tetris Guideline:
 * spawn orientations, SRS rotation states, wall kick tables and colors.
 */

export type PieceType = "I" | "J" | "L" | "O" | "S" | "T" | "Z";

export const PIECE_TYPES: PieceType[] = ["I", "J", "L", "O", "S", "T", "Z"];

/** Guideline colors, one per shape. */
export const COLORS: Record<PieceType, string> = {
  I: "#00f0f0",
  J: "#3838f0",
  L: "#f0a000",
  O: "#f0f000",
  S: "#00f000",
  T: "#a000f0",
  Z: "#f00000",
};

/** Color ids written into the board grid (0 means empty). */
export const COLOR_IDS: Record<PieceType, number> = {
  I: 1,
  J: 2,
  L: 3,
  O: 4,
  S: 5,
  T: 6,
  Z: 7,
};

/** Palette indexed by color id, for rendering locked cells. */
export const PALETTE: string[] = ["", ...PIECE_TYPES.map((t) => COLORS[t])];

/** Spawn orientation (rotation state 0) of each piece, per SRS. */
const SPAWN_STATES: Record<PieceType, number[][]> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
};

function rotateCW(m: number[][]): number[][] {
  const n = m.length;
  const out: number[][] = [];
  for (let r = 0; r < n; r++) {
    const row: number[] = [];
    for (let c = 0; c < n; c++) row.push(m[n - 1 - c][r]);
    out.push(row);
  }
  return out;
}

function buildStates(): Record<PieceType, number[][][]> {
  const out = {} as Record<PieceType, number[][][]>;
  for (const type of PIECE_TYPES) {
    const states = [SPAWN_STATES[type]];
    for (let i = 1; i < 4; i++) states.push(rotateCW(states[i - 1]));
    out[type] = states;
  }
  return out;
}

/** STATES[type][rotation] -> square matrix of the piece. */
export const STATES: Record<PieceType, number[][][]> = buildStates();

/** Guideline spawn position: pieces enter in the hidden rows, centered. */
export const SPAWN_ROW = 0;
export const SPAWN_COL: Record<PieceType, number> = {
  I: 3,
  J: 3,
  L: 3,
  O: 4,
  S: 3,
  T: 3,
  Z: 3,
};

/**
 * Super Rotation System wall kicks, keyed by "fromTo" rotation states.
 * Offsets are [x, y] with y pointing up, as in the SRS tables;
 * apply them as col + x, row - y.
 */
export type KickTable = Record<string, [number, number][]>;

export const KICKS_JLSTZ: KickTable = {
  "01": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "10": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "12": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "21": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "23": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "32": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "30": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "03": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
};

export const KICKS_I: KickTable = {
  "01": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  "10": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  "12": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  "21": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  "23": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  "32": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  "30": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  "03": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
};
