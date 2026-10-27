// Tetromino definitions and Super Rotation System (SRS) data.
// Coordinates use x to the right and y downwards.

export type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";
export type Rotation = 0 | 1 | 2 | 3; // 0 = spawn, 1 = R, 2 = 180, 3 = L

export const PIECE_TYPES: readonly PieceType[] = ["I", "O", "T", "S", "Z", "J", "L"];

/** Guideline colours. */
export const PIECE_COLORS: Record<PieceType, string> = {
  I: "#00e5ff",
  O: "#ffd600",
  T: "#aa00ff",
  S: "#00e676",
  Z: "#ff1744",
  J: "#2962ff",
  L: "#ff9100",
};

interface Shape {
  size: number; // side of the bounding box
  cells: ReadonlyArray<readonly [number, number]>; // spawn orientation
}

const SHAPES: Record<PieceType, Shape> = {
  I: { size: 4, cells: [[0, 1], [1, 1], [2, 1], [3, 1]] },
  O: { size: 2, cells: [[0, 0], [1, 0], [0, 1], [1, 1]] },
  T: { size: 3, cells: [[1, 0], [0, 1], [1, 1], [2, 1]] },
  S: { size: 3, cells: [[1, 0], [2, 0], [0, 1], [1, 1]] },
  Z: { size: 3, cells: [[0, 0], [1, 0], [1, 1], [2, 1]] },
  J: { size: 3, cells: [[0, 0], [0, 1], [1, 1], [2, 1]] },
  L: { size: 3, cells: [[2, 0], [0, 1], [1, 1], [2, 1]] },
};

export type Cells = ReadonlyArray<readonly [number, number]>;

function rotateCW(cells: Cells, size: number): Cells {
  return cells.map(([x, y]) => [size - 1 - y, x] as const);
}

/** Precomputed cells for every piece type and rotation state. */
const ROTATED: Record<PieceType, Cells[]> = {} as Record<PieceType, Cells[]>;
for (const type of PIECE_TYPES) {
  const { size, cells } = SHAPES[type];
  const states: Cells[] = [cells];
  for (let r = 1; r < 4; r++) states.push(rotateCW(states[r - 1], size));
  ROTATED[type] = states;
}

export function pieceCells(type: PieceType, rotation: Rotation): Cells {
  return ROTATED[type][rotation];
}

export function pieceSize(type: PieceType): number {
  return SHAPES[type].size;
}

// SRS wall kick tests, written as in the Guideline (y up) and keyed "from>to".
type Kicks = Record<string, ReadonlyArray<readonly [number, number]>>;

const JLSTZ_KICKS: Kicks = {
  "0>1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "1>0": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "1>2": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "2>1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "2>3": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "3>2": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "3>0": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "0>3": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
};

const I_KICKS: Kicks = {
  "0>1": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  "1>0": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  "1>2": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  "2>1": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  "2>3": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  "3>2": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  "3>0": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  "0>3": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
};

/** Flips the y axis so the tables match y-down board coordinates. */
function toBoardCoords(table: Kicks): Kicks {
  const out: Kicks = {};
  for (const key in table) out[key] = table[key].map(([dx, dy]) => [dx, -dy] as const);
  return out;
}

const JLSTZ_BOARD_KICKS = toBoardCoords(JLSTZ_KICKS);
const I_BOARD_KICKS = toBoardCoords(I_KICKS);
const NO_KICKS: Cells = [[0, 0]];

/** Kick offsets to try, in order, when rotating from one state to another. */
export function kickTests(type: PieceType, from: Rotation, to: Rotation): Cells {
  if (type === "O") return NO_KICKS;
  const table = type === "I" ? I_BOARD_KICKS : JLSTZ_BOARD_KICKS;
  return table[`${from}>${to}`];
}
