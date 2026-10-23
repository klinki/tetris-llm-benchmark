/**
 * Tetromino shapes and the Super Rotation System.
 *
 * Every piece is described by its four rotation states as a small grid of
 * blocks. Pieces live in an SRS box - 3x3 for JLSTZ, 4x4 for I, 2x2 for O -
 * exactly like the SRS diagrams do, so rotation offsets transfer directly
 * between the states.
 */

import type { Cell, PieceType, Rotation, TSpinKind } from './types.js';

/** All pieces in a fixed order; the randomizer shuffles this list. */
export const PIECE_ORDER: readonly PieceType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

/** Builds the block list of one rotation state from `[x, y]` pairs. */
function cells(...blocks: readonly [number, number][]): readonly Cell[] {
  return blocks.map(([x, y]) => ({ x, y }));
}

/** Cells of each piece, one entry per rotation state. */
const SHAPES: Record<PieceType, readonly (readonly Cell[])[]> = {
  I: [
    cells([0, 1], [1, 1], [2, 1], [3, 1]),
    cells([2, 0], [2, 1], [2, 2], [2, 3]),
    cells([0, 2], [1, 2], [2, 2], [3, 2]),
    cells([1, 0], [1, 1], [1, 2], [1, 3]),
  ],
  J: [
    cells([0, 0], [0, 1], [1, 1], [2, 1]),
    cells([1, 0], [2, 0], [1, 1], [1, 2]),
    cells([0, 1], [1, 1], [2, 1], [2, 2]),
    cells([1, 0], [1, 1], [1, 2], [0, 2]),
  ],
  L: [
    cells([2, 0], [0, 1], [1, 1], [2, 1]),
    cells([1, 0], [1, 1], [1, 2], [2, 2]),
    cells([0, 1], [1, 1], [2, 1], [1, 2]),
    cells([0, 0], [0, 1], [1, 1], [1, 2]),
  ],
  O: [
    cells([0, 0], [1, 0], [0, 1], [1, 1]),
    cells([0, 0], [1, 0], [0, 1], [1, 1]),
    cells([0, 0], [1, 0], [0, 1], [1, 1]),
    cells([0, 0], [1, 0], [0, 1], [1, 1]),
  ],
  S: [
    cells([1, 0], [2, 0], [0, 1], [1, 1]),
    cells([1, 0], [1, 1], [2, 1], [2, 2]),
    cells([1, 1], [2, 1], [0, 2], [1, 2]),
    cells([0, 0], [0, 1], [1, 1], [1, 2]),
  ],
  T: [
    cells([1, 0], [0, 1], [1, 1], [2, 1]),
    cells([1, 0], [0, 1], [1, 1], [1, 2]),
    cells([0, 0], [1, 0], [2, 0], [1, 1]),
    cells([1, 0], [1, 1], [2, 1], [1, 2]),
  ],
  Z: [
    cells([0, 0], [1, 0], [1, 1], [2, 1]),
    cells([2, 0], [1, 1], [2, 1], [1, 2]),
    cells([0, 1], [1, 1], [1, 2], [2, 2]),
    cells([1, 0], [0, 1], [1, 1], [0, 2]),
  ],
};

/** Cells of a piece in a given rotation state. */
export function pieceCells(type: PieceType, rotation: Rotation): readonly Cell[] {
  return SHAPES[type][rotation];
}

/** Size of the SRS box a piece rotates in. */
export function pieceBox(type: PieceType): { width: number; height: number } {
  switch (type) {
    case 'I':
      return { width: 4, height: 4 };
    case 'O':
      return { width: 2, height: 2 };
    default:
      return { width: 3, height: 3 };
  }
}

/**
 * Where a piece spawns: the rotation-0 box is centred on the field and sits on
 * the two hidden rows, so a piece becomes visible without moving. JLSTZ use
 * columns 4-6 (1-indexed), the I piece columns 4-7 and the O piece 5-6.
 */
export function spawnPosition(type: PieceType): Cell {
  switch (type) {
    case 'I':
      // The horizontal I keeps its blocks one row below the top of its box.
      return { x: 3, y: 0 };
    case 'O':
      return { x: 4, y: 0 };
    default:
      return { x: 3, y: 0 };
  }
}

/**
 * Bounding box of a piece in its spawn state, with cells moved to the origin.
 * Used to draw the piece previews of the hold and next panels.
 */
export function previewBox(
  type: PieceType,
): { width: number; height: number; cells: readonly Cell[] } {
  const cells = pieceCells(type, 0);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const c of cells) {
    minX = Math.min(minX, c.x);
    minY = Math.min(minY, c.y);
    maxX = Math.max(maxX, c.x);
    maxY = Math.max(maxY, c.y);
  }
  return {
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    cells: cells.map((c) => ({ x: c.x - minX, y: c.y - minY })),
  };
}

/**
 * Super Rotation System wall kicks, written exactly as they appear in the
 * Tetris Guideline: y points *up*. The tables are flipped once at load time so
 * the rest of the code can work with screen coordinates (y points down).
 *
 * Indexed as [from][to] with rotations 0 / R / 2 / L.
 */
const JLSTZ_KICKS_Y_UP: readonly (readonly (readonly [number, number][])[])[] = [
  [
    [],
    [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
    [],
    [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  ],
  [
    [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
    [],
    [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
    [],
  ],
  [
    [],
    [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
    [],
    [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  ],
  [
    [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
    [],
    [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
    [],
  ],
];

const I_KICKS_Y_UP: readonly (readonly (readonly [number, number][])[])[] = [
  [
    [],
    [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
    [],
    [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  ],
  [
    [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
    [],
    [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
    [],
  ],
  [
    [],
    [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
    [],
    [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  ],
  [
    [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
    [],
    [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
    [],
  ],
];

/** The O piece never moves while rotating. */
const O_KICKS: readonly (readonly (readonly Cell[])[])[] = [
  [cells([0, 0]), cells([0, 0]), cells([0, 0]), cells([0, 0])],
  [cells([0, 0]), cells([0, 0]), cells([0, 0]), cells([0, 0])],
  [cells([0, 0]), cells([0, 0]), cells([0, 0]), cells([0, 0])],
  [cells([0, 0]), cells([0, 0]), cells([0, 0]), cells([0, 0])],
];

function flipKicks(
  table: readonly (readonly (readonly [number, number][])[])[],
): readonly (readonly (readonly Cell[])[])[] {
  return table.map((row) => row.map((kicks) => kicks.map(([x, y]) => ({ x, y: -y }))));
}

const JLSTZ_KICKS = flipKicks(JLSTZ_KICKS_Y_UP);
const I_KICKS = flipKicks(I_KICKS_Y_UP);

/** Number of wall kick offsets tested per rotation. */
const KICKS_LENGTH = JLSTZ_KICKS_Y_UP[0][1].length;

/**
 * Wall kick candidates for a rotation, in the order they must be tried.
 *
 * Counter clockwise rotations mirror the clockwise table of the opposite
 * transition: the Guideline derives them by flipping the table horizontally,
 * which turns "rotate right" into "rotate left" at the mirrored wall.
 */
export function kickOffsets(
  type: PieceType,
  from: Rotation,
  to: Rotation,
  clockwise: boolean,
): readonly Cell[] {
  const table = type === 'I' ? I_KICKS : type === 'O' ? O_KICKS : JLSTZ_KICKS;
  const kicks = clockwise ? table[from][to] : table[to][from];
  return clockwise ? kicks : kicks.map((offset) => ({ x: -offset.x, y: offset.y }));
}

/**
 * Corners of the T piece box, per rotation state, ordered
 * front-left, front-right, back-right, back-left ("front" being the side the
 * T points at).
 */
const T_CORNERS: Record<Rotation, readonly Cell[]> = {
  0: [
    { x: 0, y: 0 },
    { x: 2, y: 0 },
    { x: 2, y: 2 },
    { x: 0, y: 2 },
  ],
  1: [
    { x: 0, y: 0 },
    { x: 0, y: 2 },
    { x: 2, y: 2 },
    { x: 2, y: 0 },
  ],
  2: [
    { x: 0, y: 2 },
    { x: 2, y: 2 },
    { x: 2, y: 0 },
    { x: 0, y: 0 },
  ],
  3: [
    { x: 2, y: 0 },
    { x: 2, y: 2 },
    { x: 0, y: 2 },
    { x: 0, y: 0 },
  ],
};

/**
 * Three corner rule T-Spin detection.
 *
 * `kick` is the index of the wall kick offset that made the rotation work, or
 * `null` when the last action was not a rotation. Only the last kick offset
 * can move the piece into a slot, so reaching it is an unambiguous full
 * T-Spin; any other kick falls back to the three corner rule, which asks for
 * both corners the T points at plus one behind to be covered by the stack.
 */
export function detectTSpin(
  type: PieceType,
  rotation: Rotation,
  x: number,
  y: number,
  kick: number | null,
  isOccupied: (cellX: number, cellY: number) => boolean,
): TSpinKind {
  if (type !== 'T' || kick === null) return 'none';
  if (kick >= KICKS_LENGTH - 1) return 'full';
  const corners = T_CORNERS[rotation].map((c) => isOccupied(x + c.x, y + c.y));
  const [frontLeft, frontRight, backRight, backLeft] = corners;
  if (!frontLeft || !frontRight) return 'none';
  if (!backRight && !backLeft) return 'none';
  return 'mini';
}