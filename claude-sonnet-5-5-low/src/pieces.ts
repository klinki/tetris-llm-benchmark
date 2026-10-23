export type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";
export type Rotation = 0 | 1 | 2 | 3;
export type Matrix = number[][];

export const PIECE_TYPES: PieceType[] = ["I", "O", "T", "S", "Z", "J", "L"];

export const COLORS: Record<PieceType, string> = {
  I: "#00e5ee", O: "#f2d600", T: "#a537d6", S: "#2ecc40", Z: "#e8352e", J: "#2f5fe8", L: "#f28a1c",
};

const SHAPES: Record<PieceType, Matrix> = {
  I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
  S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
  Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
  J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
  L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
};

function rotateCW(m: Matrix): Matrix {
  const n = m.length;
  return m.map((_, y) => m.map((_, x) => m[n - 1 - x][y]));
}

/** ROTATIONS[type][rotation] is the shape matrix for that orientation. */
export const ROTATIONS: Record<PieceType, Matrix[]> = {} as Record<PieceType, Matrix[]>;
for (const t of PIECE_TYPES) {
  const states = [SHAPES[t]];
  for (let i = 1; i < 4; i++) states.push(rotateCW(states[i - 1]));
  ROTATIONS[t] = states;
}

// Super Rotation System kicks, written as in the Guideline (y up): "from>to" -> offsets.
const KICKS_JLSTZ: Record<string, number[][]> = {
  "0>1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "1>0": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "1>2": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "2>1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "2>3": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "3>2": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "3>0": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "0>3": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
};
const KICKS_I: Record<string, number[][]> = {
  "0>1": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  "1>0": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  "1>2": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  "2>1": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  "2>3": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  "3>2": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  "3>0": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  "0>3": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
};

/** Kick offsets in board coordinates (y down). The O piece never kicks. */
export function kicks(type: PieceType, from: Rotation, to: Rotation): number[][] {
  if (type === "O") return [[0, 0]];
  const table = type === "I" ? KICKS_I : KICKS_JLSTZ;
  return table[`${from}>${to}`].map(([x, y]) => [x, -y]);
}
