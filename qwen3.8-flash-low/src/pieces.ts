/** Tetromino definitions: shapes, rotations, colors, spawn positions and SRS kick tables. */

export type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

/** An active piece on the board: type, rotation state (0, 1=R, 2, 3=L) and bounding-box position. */
export interface ActivePiece {
  type: PieceType;
  rot: number;
  /** Column of the bounding box top-left cell. */
  x: number;
  /** Row of the bounding box top-left cell (row 0 is the highest, hidden, spawn row). */
  y: number;
}

export const PIECES: readonly PieceType[] = ["I", "O", "T", "S", "Z", "J", "L"];

/** Guideline colors: one distinct color per tetromino. */
export const COLORS: Record<PieceType, string> = {
  I: "#3ec6d6",
  O: "#f2b632",
  T: "#a256d8",
  S: "#4cc94c",
  Z: "#e04545",
  J: "#4563e0",
  L: "#f08030",
};

/**
 * Rotation states 0, R(1), 2, L(3) as matrices (1 = filled cell), matching the
 * Super Rotation System spawn orientations. JLSTZ use 3x3 boxes, I uses 4x4, O uses 2x2.
 */
const ROTATIONS: Record<PieceType, readonly number[][][]> = {
  I: [
    [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
    ],
    [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
    ],
  ],
  O: [
    [
      [1, 1],
      [1, 1],
    ],
    [
      [1, 1],
      [1, 1],
    ],
    [
      [1, 1],
      [1, 1],
    ],
    [
      [1, 1],
      [1, 1],
    ],
  ],
  T: [
    [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 1],
      [0, 1, 0],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [0, 1, 0],
    ],
    [
      [0, 1, 0],
      [1, 1, 0],
      [0, 1, 0],
    ],
  ],
  S: [
    [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 1],
      [0, 0, 1],
    ],
    [
      [0, 0, 0],
      [0, 1, 1],
      [1, 1, 0],
    ],
    [
      [1, 0, 0],
      [1, 1, 0],
      [0, 1, 0],
    ],
  ],
  Z: [
    [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
    ],
    [
      [0, 0, 0],
      [1, 1, 0],
      [0, 1, 1],
    ],
    [
      [0, 1, 0],
      [1, 1, 0],
      [1, 0, 0],
    ],
  ],
  J: [
    [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 1, 1],
      [0, 1, 0],
      [0, 1, 0],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [0, 0, 1],
    ],
    [
      [0, 1, 0],
      [0, 1, 0],
      [1, 1, 0],
    ],
  ],
  L: [
    [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 1],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [1, 0, 0],
    ],
    [
      [1, 1, 0],
      [0, 1, 0],
      [0, 1, 0],
    ],
  ],
};

/** Column of the bounding box when a piece spawns (Guideline: pieces spawn centered). */
const SPAWN_COLUMN: Record<PieceType, number> = {
  I: 3,
  O: 4,
  T: 3,
  S: 3,
  Z: 3,
  J: 3,
  L: 3,
};

/**
 * SRS wall-kick offsets, keyed by `fromTo` rotation states (0, 1=R, 2, 3=L).
 * Stored in screen coordinates (x right, y down); the classic tables use
 * y-up offsets, which were negated here.
 */
const KICKS_JLSTZ: Record<string, readonly (readonly [number, number])[]> = {
  "01": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "10": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "12": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "21": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "23": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "32": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "30": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "03": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
};

const KICKS_I: Record<string, readonly (readonly [number, number])[]> = {
  "01": [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  "10": [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  "12": [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
  "21": [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  "23": [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  "32": [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  "30": [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  "03": [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
};

/** The wall-kick offsets to test for a rotation of `piece` from state `from` to state `to`. */
export function kickOffsets(piece: PieceType, from: number, to: number): readonly (readonly [number, number])[] {
  if (piece === "O") return [[0, 0]];
  const key = `${from}${to}`;
  return piece === "I" ? KICKS_I[key] : KICKS_JLSTZ[key];
}

/** Absolute board cells `[x, y]` occupied by `piece` in its current position and rotation. */
export function pieceCells(piece: ActivePiece): [number, number][] {
  const matrix = ROTATIONS[piece.type][piece.rot];
  const cells: [number, number][] = [];
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix.length; c++) {
      if (matrix[r][c]) cells.push([piece.x + c, piece.y + r]);
    }
  }
  return cells;
}

/** A freshly spawned (rotation 0) piece for `type`, dropping into the hidden spawn rows. */
export function createPiece(type: PieceType): ActivePiece {
  return { type, rot: 0, x: SPAWN_COLUMN[type], y: 0 };
}

/** Bounding-cell list of a piece type in rotation 0, used to draw hold/next previews. */
export function piecePreviewCells(type: PieceType): [number, number][] {
  return pieceCells(createPiece(type)).map(([x, y]) => [x - SPAWN_COLUMN[type], y]);
}
