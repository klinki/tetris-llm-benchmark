import { COLS, PieceType, Piece, Point } from './types';
export { Piece };

// Each piece is defined by its 4 rotations. Cells are (x, y) offsets relative to
// the piece origin (y increases downward). Rotations are consistent 90° steps
// around the origin, which is what the SRS kick tables expect.
const SHAPES: Record<PieceType, Point[][]> = {
  I: [
    [{ x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }],
    [{ x: 0, y: -1 }, { x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }],
    [{ x: -1, y: 1 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    [{ x: 0, y: -2 }, { x: 0, y: -1 }, { x: 0, y: 0 }, { x: 0, y: 1 }],
  ],
  J: [
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }],
    [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: -1, y: 2 }],
    [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 0 }],
    [{ x: -1, y: 0 }, { x: -1, y: 1 }, { x: -1, y: 2 }, { x: 0, y: 0 }],
  ],
  L: [
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 1 }],
    [{ x: 0, y: 2 }, { x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 2 }],
    [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: -1, y: 1 }],
  ],
  O: [
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
  ],
  S: [
    [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
    [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 2 }],
    [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }],
    [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }],
  ],
  T: [
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }],
    [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 1 }],
    [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 0 }],
    [{ x: 0, y: 1 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }],
  ],
  Z: [
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    [{ x: 2, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }],
    [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 2 }],
    [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 0, y: 2 }],
  ],
};

// Spawn column for each piece type so it appears centered at the top.
export const SPAWN_X: Record<PieceType, number> = {
  I: 4,
  J: 4,
  L: 4,
  O: 4,
  S: 4,
  T: 4,
  Z: 4,
};

// Pieces spawn at the top of the board so top-out (blocked spawn) is detected.
export const SPAWN_Y = 0;

export function cellsOf(type: PieceType, rot: number): Point[] {
  return SHAPES[type][rot];
}

// SRS wall kick offsets (dx, dy) applied to the piece origin when rotating.
// Keyed by "from,to" with a "I" prefix for the I piece.
const KICKS: Record<string, [number, number][]> = {
  // Non-I pieces
  '0,1': [[0, 0], [-1, 0], [-1, 1], [0, 2], [-1, 2]],
  '1,0': [[0, 0], [1, 0], [1, -1], [0, -2], [1, -2]],
  '1,2': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '2,1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '2,3': [[0, 0], [-1, 0], [-1, 1], [0, 2], [-1, 2]],
  '3,2': [[0, 0], [1, 0], [1, -1], [0, -2], [1, -2]],
  '3,0': [[0, 0], [1, 0], [1, -1], [0, -2], [1, -2]],
  '0,3': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  // I piece
  'I0,1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  'I1,0': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  'I1,2': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  'I2,1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  'I2,3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  'I3,2': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  'I3,0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  'I0,3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
};

export function kicksFor(type: PieceType, from: number, to: number): [number, number][] {
  const prefix = type === 'I' ? 'I' : '';
  return KICKS[`${prefix}${from},${to}`] ?? [[0, 0]];
}

export function pieceCells(piece: Piece): Point[] {
  return cellsOf(piece.type, piece.rot).map(({ x, y }) => ({
    x: piece.x + x,
    y: piece.y + y,
  }));
}

export function spawnPiece(type: PieceType): Piece {
  return { type, x: SPAWN_X[type], y: SPAWN_Y, rot: 0 };
}

export const ALL_PIECES: PieceType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
