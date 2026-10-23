export type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";
export type Rotation = 0 | 1 | 2 | 3;
export type Cell = readonly [x: number, y: number];

export const PIECE_TYPES: readonly PieceType[] = ["I", "O", "T", "S", "Z", "J", "L"];

export const COLORS: Record<PieceType, string> = {
  I: "#00e5ee",
  O: "#f5d90a",
  T: "#b030e0",
  S: "#30d050",
  Z: "#e83030",
  J: "#3050f0",
  L: "#f59a10",
};

// Spawn orientation (y grows downwards) inside the piece's bounding box.
const BASE: Record<PieceType, Cell[]> = {
  I: [[0, 1], [1, 1], [2, 1], [3, 1]],
  O: [[1, 0], [2, 0], [1, 1], [2, 1]],
  T: [[1, 0], [0, 1], [1, 1], [2, 1]],
  S: [[1, 0], [2, 0], [0, 1], [1, 1]],
  Z: [[0, 0], [1, 0], [1, 1], [2, 1]],
  J: [[0, 0], [0, 1], [1, 1], [2, 1]],
  L: [[2, 0], [0, 1], [1, 1], [2, 1]],
};

const boxSize = (type: PieceType) => (type === "I" || type === "O" ? 4 : 3);

function buildShapes(type: PieceType): Cell[][] {
  const n = boxSize(type);
  const shapes = [BASE[type]];
  for (let r = 1; r < 4; r++) {
    const prev = shapes[r - 1];
    // O looks the same in every orientation and rotates around its own centre.
    shapes.push(type === "O" ? prev : prev.map(([x, y]): Cell => [n - 1 - y, x]));
  }
  return shapes;
}

/** SHAPES[type][rotation] -> the four occupied cells relative to the piece origin. */
export const SHAPES: Record<PieceType, Cell[][]> = {
  I: buildShapes("I"), O: buildShapes("O"), T: buildShapes("T"), S: buildShapes("S"),
  Z: buildShapes("Z"), J: buildShapes("J"), L: buildShapes("L"),
};

// Super Rotation System wall kicks, listed as in the Guideline (y grows upwards).
const JLSTZ_KICKS: Record<string, Cell[]> = {
  "01": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "10": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "12": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "21": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "23": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "32": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "30": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "03": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
};

const I_KICKS: Record<string, Cell[]> = {
  "01": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  "10": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  "12": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  "21": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  "23": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  "32": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  "30": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  "03": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
};

/** Kick offsets to try, in order, in screen coordinates (y grows downwards). */
export function kicksFor(type: PieceType, from: Rotation, to: Rotation): Cell[] {
  if (type === "O") return [[0, 0]];
  const table = type === "I" ? I_KICKS : JLSTZ_KICKS;
  return table[`${from}${to}`].map(([x, y]): Cell => [x, -y]);
}
