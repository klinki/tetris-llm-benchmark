export type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";
export type Rotation = 0 | 1 | 2 | 3;
export type Point = readonly [x: number, y: number];

export interface Piece {
  type: PieceType;
  rotation: Rotation;
  /** Top-left corner of the piece's bounding box on the board. */
  x: number;
  y: number;
}

export const PIECE_TYPES: readonly PieceType[] = ["I", "O", "T", "S", "Z", "J", "L"];

export const COLORS: Record<PieceType, string> = {
  I: "#2ee6e6",
  O: "#f5e028",
  T: "#b04fe0",
  S: "#3fd45a",
  Z: "#ee3d3d",
  J: "#3d6bf0",
  L: "#f59a2a",
};

// Spawn orientation of every piece, drawn inside its bounding box.
const SPAWN_SHAPES: Record<PieceType, readonly string[]> = {
  I: ["....", "####", "....", "...."],
  O: ["##", "##"],
  T: [".#.", "###", "..."],
  S: [".##", "##.", "..."],
  Z: ["##.", ".##", "..."],
  J: ["#..", "###", "..."],
  L: ["..#", "###", "..."],
};

function parseShape(rows: readonly string[]): Point[] {
  const points: Point[] = [];
  rows.forEach((row, y) => {
    [...row].forEach((char, x) => {
      if (char === "#") points.push([x, y]);
    });
  });
  return points;
}

function rotateClockwise(points: readonly Point[], size: number): Point[] {
  return points.map(([x, y]) => [size - 1 - y, x]);
}

export interface Shape {
  /** Side length of the square bounding box. */
  size: number;
  /** Block offsets inside the bounding box for rotations 0, R, 2, L. */
  rotations: readonly (readonly Point[])[];
}

function buildShape(type: PieceType): Shape {
  const rows = SPAWN_SHAPES[type];
  const size = rows.length;
  const rotations = [parseShape(rows)];
  for (let i = 1; i < 4; i++) {
    rotations.push(rotateClockwise(rotations[i - 1], size));
  }
  return { size, rotations };
}

export const SHAPES = Object.fromEntries(
  PIECE_TYPES.map((type) => [type, buildShape(type)]),
) as Record<PieceType, Shape>;

/** Absolute board coordinates of the four blocks of a piece. */
export function cellsOf(piece: Piece): Point[] {
  return SHAPES[piece.type].rotations[piece.rotation].map(([x, y]) => [piece.x + x, piece.y + y]);
}

// Super Rotation System wall kicks. Each list is tried in order and the first
// offset where the rotated piece fits wins. Written as on the Guideline wiki
// (y grows upwards); `kicksFor` flips y to match the board (y grows downwards).
type Kicks = readonly Point[];

const JLSTZ_KICKS: Record<string, Kicks> = {
  "01": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "10": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "12": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "21": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "23": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "32": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "30": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "03": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
};

const I_KICKS: Record<string, Kicks> = {
  "01": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  "10": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  "12": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  "21": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  "23": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  "32": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  "30": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  "03": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
};

const NO_KICKS: Kicks = [[0, 0]];

function flipY(kicks: Record<string, Kicks>): Record<string, Kicks> {
  return Object.fromEntries(
    Object.entries(kicks).map(([key, list]) => [key, list.map(([x, y]): Point => [x, -y])]),
  );
}

const KICK_TABLES = { jlstz: flipY(JLSTZ_KICKS), i: flipY(I_KICKS) };

export function kicksFor(type: PieceType, from: Rotation, to: Rotation): Kicks {
  if (type === "O") return NO_KICKS;
  const table = type === "I" ? KICK_TABLES.i : KICK_TABLES.jlstz;
  return table[`${from}${to}`];
}
