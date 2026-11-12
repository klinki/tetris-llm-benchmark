/** The seven tetromino types. */
export type PieceType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

/** Every piece type in a stable order. */
export const PIECE_TYPES: readonly PieceType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

/** Colour of every piece type (Guideline palette). */
export const PIECE_COLORS: Record<PieceType, string> = {
  I: '#31c7ef',
  J: '#1a5fdc',
  L: '#ef8b18',
  O: '#f3d20f',
  S: '#43c83e',
  T: '#a838bf',
  Z: '#e11d2e',
};

/** A single cell of a piece, relative to the piece bounding box. */
export type Cell = readonly [x: number, y: number];

/** A piece instance: type, rotation state and position of its bounding box. */
export interface Piece {
  type: PieceType;
  /** Rotation state, 0 = spawn orientation, 1..3 = 90° steps clockwise. */
  rotation: number;
  /** Left column of the piece bounding box. */
  x: number;
  /** Top row of the piece bounding box. */
  y: number;
}

/** Spawn position of a piece (top-left corner of its bounding box). */
export interface Spawn {
  x: number;
  y: number;
}

/**
 * Base (spawn) orientation of every piece.
 *
 * The matrices follow the Super Rotation System layout: JLSTZ use a 3x3 box,
 * I uses a 4x4 box and O uses a 2x2 box. Rotation states are derived from
 * these matrices by rotating the cells around the centre of the box.
 */
const BASE_SHAPES: Record<PieceType, { cells: readonly Cell[]; box: number }> = {
  I: {
    box: 4,
    cells: [
      [0, 1],
      [1, 1],
      [2, 1],
      [3, 1],
    ],
  },
  J: {
    box: 3,
    cells: [
      [0, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
  },
  L: {
    box: 3,
    cells: [
      [2, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
  },
  O: {
    box: 2,
    cells: [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ],
  },
  S: {
    box: 3,
    cells: [
      [1, 0],
      [2, 0],
      [0, 1],
      [1, 1],
    ],
  },
  T: {
    box: 3,
    cells: [
      [1, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
  },
  Z: {
    box: 3,
    cells: [
      [0, 0],
      [1, 0],
      [1, 1],
      [2, 1],
    ],
  },
};

/** Rotates the given cells 90° clockwise around the centre of the box. */
function rotateCells(cells: readonly Cell[], box: number): Cell[] {
  const centre = (box - 1) / 2;
  return cells.map(([x, y]) => {
    const dx = x - centre;
    const dy = y - centre;
    return [Math.round(centre - dy), Math.round(centre + dx)] as Cell;
  });
}

function buildStates(type: PieceType): Cell[][] {
  const base = BASE_SHAPES[type];
  // The O piece never changes its shape, only its (unused) rotation state.
  if (type === 'O') {
    return [base.cells.slice(), base.cells.slice(), base.cells.slice(), base.cells.slice()];
  }
  const states: Cell[][] = [];
  let current = base.cells.slice();
  for (let i = 0; i < 4; i++) {
    states.push(current);
    current = rotateCells(current, base.box);
  }
  return states;
}

/** All four rotation states of every piece, index = rotation state. */
export const SHAPES: Record<PieceType, Cell[][]> = {
  I: buildStates('I'),
  J: buildStates('J'),
  L: buildStates('L'),
  O: buildStates('O'),
  S: buildStates('S'),
  T: buildStates('T'),
  Z: buildStates('Z'),
};

/** Size of the bounding box of every piece. */
export const BOX_SIZE: Record<PieceType, number> = {
  I: 4,
  J: 3,
  L: 3,
  O: 2,
  S: 3,
  T: 3,
  Z: 3,
};

/** Spawn position of every piece. */
export const SPAWN: Record<PieceType, Spawn> = {
  I: { x: 3, y: 1 },
  J: { x: 3, y: 1 },
  L: { x: 3, y: 1 },
  O: { x: 4, y: 2 },
  S: { x: 3, y: 1 },
  T: { x: 3, y: 1 },
  Z: { x: 3, y: 1 },
};

/** Returns the occupied cells of a piece in the given rotation state. */
export function cellsOf(type: PieceType, rotation: number): readonly Cell[] {
  return SHAPES[type][((rotation % 4) + 4) % 4];
}
