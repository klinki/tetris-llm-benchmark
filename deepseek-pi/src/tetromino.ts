/**
 * Tetromino data: shapes, colors, spawn positions and Super Rotation System
 * wall kicks, as defined by the Tetris Guideline.
 */

export type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

/** All piece types; also the draw order of the 7-bag randomizer. */
export const TYPES: readonly PieceType[] = ["I", "O", "T", "S", "Z", "J", "L"];

/** A piece placed on the board: frame origin in board cells plus rotation state. */
export interface Piece {
  readonly type: PieceType;
  state: number; // 0..3, increasing = clockwise
  x: number; // column of the 4x4 frame origin
  y: number; // row of the 4x4 frame origin
}

/**
 * Rotation states as 4x4 grids: [state][row][col], 1 = filled.
 * States are the canonical SRS orientations; state index increases clockwise.
 */
const SHAPES: Readonly<Record<PieceType, ReadonlyArray<ReadonlyArray<ReadonlyArray<number>>>>> = {
  I: [
    [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0]],
    [[0, 0, 0, 0], [0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0]],
    [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]],
  ],
  O: [
    [[0, 1, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, 1, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, 1, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, 1, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
  ],
  T: [
    [[0, 1, 0, 0], [1, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, 1, 0, 0], [0, 1, 1, 0], [0, 1, 0, 0], [0, 0, 0, 0]],
    [[0, 0, 0, 0], [1, 1, 1, 0], [0, 1, 0, 0], [0, 0, 0, 0]],
    [[0, 1, 0, 0], [1, 1, 0, 0], [0, 1, 0, 0], [0, 0, 0, 0]],
  ],
  S: [
    [[0, 1, 1, 0], [1, 1, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, 1, 0, 0], [0, 1, 1, 0], [0, 0, 1, 0], [0, 0, 0, 0]],
    [[0, 0, 0, 0], [0, 1, 1, 0], [1, 1, 0, 0], [0, 0, 0, 0]],
    [[1, 0, 0, 0], [1, 1, 0, 0], [0, 1, 0, 0], [0, 0, 0, 0]],
  ],
  Z: [
    [[1, 1, 0, 0], [0, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, 0, 1, 0], [0, 1, 1, 0], [0, 1, 0, 0], [0, 0, 0, 0]],
    [[0, 0, 0, 0], [1, 1, 0, 0], [0, 1, 1, 0], [0, 0, 0, 0]],
    [[0, 1, 0, 0], [1, 1, 0, 0], [1, 0, 0, 0], [0, 0, 0, 0]],
  ],
  J: [
    [[1, 0, 0, 0], [1, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, 1, 1, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 0, 0, 0]],
    [[0, 0, 0, 0], [1, 1, 1, 0], [0, 0, 1, 0], [0, 0, 0, 0]],
    [[0, 1, 0, 0], [0, 1, 0, 0], [1, 1, 0, 0], [0, 0, 0, 0]],
  ],
  L: [
    [[0, 0, 1, 0], [1, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 1, 0], [0, 0, 0, 0]],
    [[0, 0, 0, 0], [1, 1, 1, 0], [1, 0, 0, 0], [0, 0, 0, 0]],
    [[1, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 0, 0, 0]],
  ],
};

/** Filled-cell offsets ([col, row]) per piece and rotation state. */
export const CELLS: Readonly<
  Record<PieceType, ReadonlyArray<ReadonlyArray<readonly [number, number]>>>
> = {
  I: cellsOf("I"),
  O: cellsOf("O"),
  T: cellsOf("T"),
  S: cellsOf("S"),
  Z: cellsOf("Z"),
  J: cellsOf("J"),
  L: cellsOf("L"),
};

function cellsOf(type: PieceType): ReadonlyArray<ReadonlyArray<readonly [number, number]>> {
  return SHAPES[type].map((state) => {
    const out: Array<readonly [number, number]> = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (state[r][c]) out.push([c, r]);
      }
    }
    return out;
  });
}

/** Guideline colors, one per shape. */
export const COLORS: Readonly<Record<PieceType, string>> = {
  I: "#00f0f0",
  O: "#f0f000",
  T: "#a000f0",
  S: "#00f000",
  Z: "#f00000",
  J: "#0000f0",
  L: "#f0a000",
};

/** Board cell values are 1..7; PIECE_IDS maps a value back to its type. */
export const PIECE_IDS: readonly PieceType[] = ["I", "O", "T", "S", "Z", "J", "L"];

/**
 * Spawn positions (frame origin). The board has two hidden rows on top;
 * pieces spawn top-aligned at the first visible row so they are fully
 * visible from the start. Columns follow SRS spawn (JLSTZ/I centered,
 * O offset one to the right).
 */
export const SPAWN: Readonly<Record<PieceType, { readonly x: number; readonly y: number }>> = {
  I: { x: 3, y: 1 },
  O: { x: 4, y: 2 },
  T: { x: 3, y: 2 },
  S: { x: 3, y: 2 },
  Z: { x: 3, y: 2 },
  J: { x: 3, y: 2 },
  L: { x: 3, y: 2 },
};

/** A wall-kick offset: [dx, dy] in cells, dy > 0 means up. */
type Kick = readonly [number, number];

/**
 * SRS wall-kick tables, keyed "from>to" with from/to rotation states.
 * dy is in guideline convention (+y = up).
 */
const JLSTZ_KICKS: Readonly<Record<string, readonly Kick[]>> = {
  "0>1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "1>0": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "1>2": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "2>1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "2>3": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "3>2": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "3>0": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "0>3": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
};

const I_KICKS: Readonly<Record<string, readonly Kick[]>> = {
  "0>1": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  "1>0": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  "1>2": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  "2>1": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  "2>3": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  "3>2": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  "3>0": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  "0>3": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
};

/** KICKS[type][from][to] = list of offsets to try, in order. */
export const KICKS: Readonly<
  Record<PieceType, ReadonlyArray<ReadonlyArray<readonly Kick[]>>>
> = {
  I: buildKicks(I_KICKS),
  O: buildKicks({}), // O is rotationally symmetric: rotation is a no-op
  T: buildKicks(JLSTZ_KICKS),
  S: buildKicks(JLSTZ_KICKS),
  Z: buildKicks(JLSTZ_KICKS),
  J: buildKicks(JLSTZ_KICKS),
  L: buildKicks(JLSTZ_KICKS),
};

function buildKicks(
  entries: Readonly<Record<string, readonly Kick[]>>
): ReadonlyArray<ReadonlyArray<readonly Kick[]>> {
  const table: Array<Array<Kick[]>> = [];
  for (let a = 0; a < 4; a++) {
    const row: Array<Kick[]> = [];
    for (let b = 0; b < 4; b++) row.push([]);
    table.push(row);
  }
  for (const [key, list] of Object.entries(entries)) {
    table[Number(key[0])][Number(key[2])] = [...list];
  }
  return table;
}
