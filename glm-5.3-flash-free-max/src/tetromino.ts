/**
 * Tetromino geometry: spawn shapes, rotation within the bounding box, and the
 * Super Rotation System (SRS) wall kick tables, following the Tetris Guideline
 * (https://tetris.fandom.com/wiki/SRS).
 */

import type { Field } from "./field.js";

export type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";
export type Rotation = 0 | 1 | 2 | 3; // 0 = spawn, 1 = CW, 2 = 180, 3 = CCW

export const PIECE_TYPES: readonly PieceType[] = [
  "I", "O", "T", "S", "Z", "J", "L",
];

/** Guideline piece colors: one distinct color per shape. */
export const COLORS: Record<PieceType, string> = {
  I: "#31c7ef", // cyan
  O: "#f7d308", // yellow
  T: "#ad4d9c", // purple
  S: "#42b642", // green
  Z: "#ef2029", // red
  J: "#5a65ad", // blue
  L: "#ef7921", // orange
};

/** Ghost pieces share the shape's color at reduced opacity. */
export const GHOST_ALPHA = 0.28;

interface ShapeDef {
  box: number; // rotation bounding box side (I: 4, O: 2, others: 3)
  spawn: ReadonlyArray<readonly [number, number]>; // cells in rotation state 0
  x: number; // spawn column of the box
}

/**
 * Spawn shapes in SRS orientation. The I sits on the second row of its 4x4 box
 * so that box rotation reproduces all four SRS states exactly; the O is a 2x2
 * box (rotation maps it onto itself, so it never kicks).
 */
const SHAPES: Record<PieceType, ShapeDef> = {
  I: { box: 4, spawn: [[0, 1], [1, 1], [2, 1], [3, 1]], x: 3 },
  O: { box: 2, spawn: [[0, 0], [1, 0], [0, 1], [1, 1]], x: 4 },
  T: { box: 3, spawn: [[1, 0], [0, 1], [1, 1], [2, 1]], x: 3 },
  S: { box: 3, spawn: [[1, 0], [2, 0], [0, 1], [1, 1]], x: 3 },
  Z: { box: 3, spawn: [[0, 0], [1, 0], [1, 1], [2, 1]], x: 3 },
  J: { box: 3, spawn: [[0, 0], [0, 1], [1, 1], [2, 1]], x: 3 },
  L: { box: 3, spawn: [[2, 0], [0, 1], [1, 1], [2, 1]], x: 3 },
};

/** Precompute every rotation state once; cells are box offsets [x, y]. */
const ROTATIONS: Record<PieceType, ReadonlyArray<ReadonlyArray<readonly [number, number]>>> = {} as Record<
  PieceType,
  ReadonlyArray<ReadonlyArray<readonly [number, number]>>
>;
for (const type of PIECE_TYPES) {
  const { box, spawn } = SHAPES[type];
  const states: Array<Array<readonly [number, number]>> = [spawn.map((c) => c)];
  for (let r = 1; r < 4; r++) {
    const prev = states[r - 1];
    states.push(prev.map(([x, y]) => [box - 1 - y, x] as readonly [number, number]));
  }
  ROTATIONS[type] = states;
}

export function cellsOf(type: PieceType, rotation: Rotation): ReadonlyArray<readonly [number, number]> {
  return ROTATIONS[type][rotation];
}

export function boxSize(type: PieceType): number {
  return SHAPES[type].box;
}

export function spawnX(type: PieceType): number {
  return SHAPES[type].x;
}

/** Spawn row of the piece box: flat side down on the skyline. */
export const SPAWN_Y = 1;

/** A piece currently falling or held somewhere else by the game. */
export interface ActivePiece {
  type: PieceType;
  x: number; // left edge of the rotation box
  y: number; // top edge of the rotation box
  rot: Rotation;
}

export type SpinDir = "cw" | "ccw";

/**
 * Offset [x, y] applied per failed rotation test.
 * Screen convention: positive y points DOWN (the guideline tables use
 * positive y = up, so every entry below has the sign of y flipped).
 */
type KickSet = Record<string, ReadonlyArray<readonly [number, number]>>;

const JLSTZ_KICKS: KickSet = {
  "0>1": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "1>0": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "1>2": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "2>1": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "2>3": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "3>2": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "3>0": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "0>3": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
};

const I_KICKS: KickSet = {
  "0>1": [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  "1>0": [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  "1>2": [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
  "2>1": [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  "2>3": [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  "3>2": [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  "3>0": [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  "0>3": [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
};

export function kickOffsets(
  type: PieceType,
  from: Rotation,
  to: Rotation,
): ReadonlyArray<readonly [number, number]> {
  if (type === "O") return [[0, 0]];
  return (type === "I" ? I_KICKS : JLSTZ_KICKS)[`${from}>${to}`];
}

// ---------------------------------------------------------------------------
// Movement helpers (piece geometry against a field)
// ---------------------------------------------------------------------------

export function shifted(piece: ActivePiece, dx: number, dy: number): ActivePiece {
  return { ...piece, x: piece.x + dx, y: piece.y + dy };
}

/** Piece with y increased by 1, downward. */
export function droppedOne(piece: ActivePiece): ActivePiece {
  return shifted(piece, 0, 1);
}

/** Piece as it would rest if it fell straight down (for ghost / hard drop). */
export function ghostPiece(field: Field, piece: ActivePiece): ActivePiece {
  let p = piece;
  while (fits(field, droppedOne(p))) p = droppedOne(p);
  return p;
}

export function rotateTarget(piece: ActivePiece, dir: SpinDir): Rotation {
  const next = dir === "cw" ? piece.rot + 1 : piece.rot + 3;
  return (next % 4) as Rotation;
}

/**
 * True when `target`'s cells all land on empty space. Cells above the top of
 * the field (y < 0) are open, matching the Guideline's overhang headroom.
 */
export function fits(field: Field, target: ActivePiece): boolean {
  const cells = cellsOf(target.type, target.rot);
  for (const [dx, dy] of cells) {
    if (!field.isOpen(target.x + dx, target.y + dy)) return false;
  }
  return true;
}

/**
 * Attempt an SRS rotation: try each table offset until the rotated piece fits.
 * Returns the placed piece and the index of the test that succeeded, or null
 * when every test fails (rotation did not happen).
 */
export function attemptRotation(
  field: Field,
  piece: ActivePiece,
  dir: SpinDir,
): { piece: ActivePiece; kickIndex: number } | null {
  const rot = rotateTarget(piece, dir);
  const kicks = kickOffsets(piece.type, piece.rot, rot);
  for (let i = 0; i < kicks.length; i++) {
    const [dx, dy] = kicks[i];
    const target: ActivePiece = { ...piece, x: piece.x + dx, y: piece.y + dy, rot };
    if (fits(field, target)) return { piece: target, kickIndex: i };
  }
  return null;
}
