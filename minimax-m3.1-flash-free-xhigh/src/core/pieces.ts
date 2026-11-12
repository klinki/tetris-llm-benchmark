import type { ActivePiece, Cell, PieceDef, PieceType, Rotation } from './types.js';

/** All piece types, in the order used by the bag randomiser. */
export const PIECE_TYPES: readonly PieceType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

/** Cells of every piece in its spawn state, inside its own rotation box. */
const BASE_CELLS: Record<PieceType, readonly Cell[]> = {
  I: [
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
    { x: 3, y: 1 },
  ],
  J: [
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
  ],
  L: [
    { x: 2, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
  ],
  O: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
  ],
  S: [
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
  ],
  T: [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
  ],
  Z: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
  ],
};

/** Size of the rotation box of every piece. */
const SIZES: Record<PieceType, number> = { I: 4, J: 3, L: 3, O: 2, S: 3, T: 3, Z: 3 };

/** Colour of every piece. */
const COLORS: Record<PieceType, string> = {
  I: '#22d3ee',
  J: '#3b82f6',
  L: '#fb923c',
  O: '#facc15',
  S: '#4ade80',
  T: '#c084fc',
  Z: '#f87171',
};

/** Column the piece is spawned in. */
const SPAWN_X: Record<PieceType, number> = { I: 3, J: 3, L: 3, O: 4, S: 3, T: 3, Z: 3 };

/**
 * Row the piece is spawned in. Every piece spawns with its lowest cells on
 * the top row of the visible field, so a stack that reaches it blocks the
 * spawn and ends the game.
 */
const SPAWN_Y: Record<PieceType, number> = { I: -1, J: -1, L: -1, O: -1, S: -1, T: -1, Z: -1 };

/** Rotates cells a quarter turn clockwise inside their box. */
function rotateCells(cells: readonly Cell[], size: number): Cell[] {
  return cells.map((cell) => ({ x: size - 1 - cell.y, y: cell.x }));
}

/** Builds the four rotation states of a piece. */
function buildStates(type: PieceType): readonly (readonly Cell[])[] {
  const size = SIZES[type];
  const states: (readonly Cell[])[] = [];
  let current: readonly Cell[] = BASE_CELLS[type];
  for (let rotation = 0; rotation < 4; rotation++) {
    states.push(current);
    current = rotateCells(current, size);
  }
  return states;
}

/** Definition of every piece. */
export const PIECES: Record<PieceType, PieceDef> = PIECE_TYPES.reduce(
  (pieces, type) => {
    pieces[type] = {
      type,
      size: SIZES[type],
      states: buildStates(type),
      color: COLORS[type],
      spawnX: SPAWN_X[type],
      spawnY: SPAWN_Y[type],
    };
    return pieces;
  },
  {} as Record<PieceType, PieceDef>,
);

/** Cells of a piece in the given rotation state, in its local box. */
export function pieceCells(type: PieceType, rotation: Rotation): readonly Cell[] {
  return PIECES[type].states[rotation];
}

/** Cells of an active piece in board coordinates. */
export function absoluteCells(piece: ActivePiece): Cell[] {
  return pieceCells(piece.type, piece.rotation).map((cell) => ({
    x: cell.x + piece.x,
    y: cell.y + piece.y,
  }));
}
