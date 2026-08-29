import type { PieceType, Rotation } from "./types.js";

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
export const NEXT_QUEUE_LENGTH = 5;
export const LOCK_DELAY_MS = 500;
export const MAX_LOCK_RESETS = 15;
export const SOFT_DROP_POINTS = 1;
export const HARD_DROP_POINTS = 2;

/**
 * Guideline gravity expressed as frames per cell at 60 frames per second.
 * Levels beyond the table use the fastest (one frame) gravity.
 */
const GRAVITY_FRAMES = [48, 43, 38, 33, 28, 23, 18, 13, 8, 6, 5, 4, 3, 2, 1];

export function gravityIntervalMs(level: number): number {
  const safeLevel = Math.max(1, Math.floor(level));
  const index = Math.min(safeLevel - 1, GRAVITY_FRAMES.length - 1);
  return (GRAVITY_FRAMES[index] * 1000) / 60;
}

export const PIECE_COLORS: Record<PieceType, string> = {
  I: "#2dd4e8",
  J: "#4d7cff",
  L: "#ff9f43",
  O: "#f6d743",
  S: "#4ddc7b",
  T: "#b26cff",
  Z: "#f45b69",
};

export const PIECE_NAMES: Record<PieceType, string> = {
  I: "I",
  J: "J",
  L: "L",
  O: "O",
  S: "S",
  T: "T",
  Z: "Z",
};

export type ShapeMatrix = readonly (readonly number[])[];

function matrix(rows: string[]): ShapeMatrix {
  return rows.map((row) => [...row].map((cell) => (cell === "." ? 0 : 1)));
}

/**
 * SRS states. The JLSTZ pieces use the upper-left 3x3 portion of this 4x4
 * matrix, while I and O use the full 4x4 SRS box.
 */
export const SHAPES: Record<PieceType, readonly ShapeMatrix[]> = {
  I: [
    matrix(["....", "IIII", "....", "...."]),
    matrix(["..I.", "..I.", "..I.", "..I."]),
    matrix(["....", "....", "IIII", "...."]),
    matrix([".I..", ".I..", ".I..", ".I.."]),
  ],
  J: [
    matrix(["J...", "JJJ.", "....", "...."]),
    matrix([".JJ.", ".J..", ".J..", "...."]),
    matrix(["....", "JJJ.", "..J.", "...."]),
    matrix([".J..", ".J..", "JJ..", "...."]),
  ],
  L: [
    matrix(["..L.", "LLL.", "....", "...."]),
    matrix([".L..", ".L..", ".LL.", "...."]),
    matrix(["....", "LLL.", "L...", "...."]),
    matrix(["LL..", ".L..", ".L..", "...."]),
  ],
  O: [
    matrix([".OO.", ".OO.", "....", "...."]),
    matrix([".OO.", ".OO.", "....", "...."]),
    matrix([".OO.", ".OO.", "....", "...."]),
    matrix([".OO.", ".OO.", "....", "...."]),
  ],
  S: [
    matrix([".SS.", "SS..", "....", "...."]),
    matrix([".S..", ".SS.", "..S.", "...."]),
    matrix(["....", ".SS.", "SS..", "...."]),
    matrix(["S...", "SS..", ".S..", "...."]),
  ],
  T: [
    matrix([".T..", "TTT.", "....", "...."]),
    matrix([".T..", ".TT.", ".T..", "...."]),
    matrix(["....", "TTT.", ".T..", "...."]),
    matrix([".T..", "TT..", ".T..", "...."]),
  ],
  Z: [
    matrix(["ZZ..", ".ZZ.", "....", "...."]),
    matrix(["..Z.", ".ZZ.", ".Z..", "...."]),
    matrix(["....", "ZZ..", ".ZZ.", "...."]),
    matrix([".Z..", "ZZ..", "Z...", "...."]),
  ],
};

export function normalizeRotation(rotation: number): Rotation {
  return (((rotation % 4) + 4) % 4) as Rotation;
}

export const SCORE_TABLE = {
  single: 100,
  double: 300,
  triple: 500,
  tetris: 800,
  tSpinMini: [100, 200, 400] as const,
  tSpin: [400, 800, 1200, 1600] as const,
  perfectClear: [0, 800, 1200, 1800, 2000] as const,
};

/** SRS kick offsets use positive Y upwards, as in the Guideline tables. */
export type Kick = readonly [x: number, y: number];

const NO_KICK: readonly Kick[] = [[0, 0]];

const JLSTZ_KICKS: Record<string, readonly Kick[]> = {
  "0>1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "1>0": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "1>2": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "2>1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "2>3": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "3>2": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "3>0": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "0>3": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
};

const I_KICKS: Record<string, readonly Kick[]> = {
  "0>1": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  "1>0": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  "1>2": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  "2>1": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  "2>3": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  "3>2": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  "3>0": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  "0>3": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
};

export function getKickTests(type: PieceType, from: Rotation, to: Rotation): readonly Kick[] {
  if (type === "O") {
    return NO_KICK;
  }

  const key = `${from}>${to}`;
  return type === "I" ? I_KICKS[key] ?? NO_KICK : JLSTZ_KICKS[key] ?? NO_KICK;
}
