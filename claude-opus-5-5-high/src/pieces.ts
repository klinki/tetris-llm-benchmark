// Tetrimino definitions following the Super Rotation System (SRS).
// Coordinates are [x, y] with y growing downwards, relative to the
// piece's bounding box.

export type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

/** Rotation state: 0 = spawn, 1 = right (CW), 2 = reverse, 3 = left (CCW). */
export type Rotation = 0 | 1 | 2 | 3;

export type Cell = readonly [x: number, y: number];

export const PIECE_TYPES: readonly PieceType[] = ["I", "O", "T", "S", "Z", "J", "L"];

/** Guideline colors. */
export const PIECE_COLORS: Readonly<Record<PieceType, string>> = {
  I: "#00e5ff", // cyan
  O: "#ffd600", // yellow
  T: "#b04dff", // purple
  S: "#2ee05a", // green
  Z: "#ff3b3b", // red
  J: "#2f6bff", // blue
  L: "#ff9100", // orange
};

/** Spawn-state shapes drawn inside their SRS bounding box. */
const SPAWN_SHAPES: Readonly<Record<PieceType, readonly string[]>> = {
  I: ["....", "####", "....", "...."],
  O: ["##", "##"],
  T: [".#.", "###", "..."],
  S: [".##", "##.", "..."],
  Z: ["##.", ".##", "..."],
  J: ["#..", "###", "..."],
  L: ["..#", "###", "..."],
};

function parseShape(rows: readonly string[]): Cell[] {
  const cells: Cell[] = [];
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) if (row[x] === "#") cells.push([x, y]);
  });
  return cells;
}

/** Rotate cells clockwise inside an n×n box. */
function rotateCW(cells: readonly Cell[], n: number): Cell[] {
  return cells.map(([x, y]) => [n - 1 - y, x] as const);
}

function buildRotations(type: PieceType): readonly (readonly Cell[])[] {
  const shape = SPAWN_SHAPES[type];
  const states = [parseShape(shape)];
  for (let i = 1; i < 4; i++) states.push(rotateCW(states[i - 1], shape.length));
  return states;
}

/** SHAPES[type][rotation] -> list of occupied cells. */
export const SHAPES: Readonly<Record<PieceType, readonly (readonly Cell[])[]>> = Object.fromEntries(
  PIECE_TYPES.map((t) => [t, buildRotations(t)]),
) as Record<PieceType, readonly (readonly Cell[])[]>;

// SRS wall kick data, as published on the Tetris wiki (y points UP here).
// Key is `${from}${to}`.
type KickTable = Readonly<Record<string, readonly Cell[]>>;

const JLSTZ_KICKS: KickTable = {
  "01": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "10": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "12": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "21": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "23": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "32": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "30": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "03": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
};

const I_KICKS: KickTable = {
  "01": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  "10": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  "12": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  "21": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  "23": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  "32": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  "30": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  "03": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
};

const NO_KICKS: readonly Cell[] = [[0, 0]];

/** Flip the y axis so the tables match y-down board coordinates. */
function toBoardCoords(table: KickTable): KickTable {
  return Object.fromEntries(
    Object.entries(table).map(([key, kicks]) => [key, kicks.map(([x, y]) => [x, -y] as const)]),
  );
}

const BOARD_JLSTZ_KICKS = toBoardCoords(JLSTZ_KICKS);
const BOARD_I_KICKS = toBoardCoords(I_KICKS);

/** Kick offsets to try in order, in y-down board coordinates. */
export function getKicks(type: PieceType, from: Rotation, to: Rotation): readonly Cell[] {
  if (type === "O") return NO_KICKS;
  const table = type === "I" ? BOARD_I_KICKS : BOARD_JLSTZ_KICKS;
  return table[`${from}${to}`];
}
