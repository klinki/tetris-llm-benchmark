// Tetrimino definitions and Super Rotation System (SRS) data.
// Coordinates use x to the right and y downwards (screen space).

export type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

/** Rotation state: 0 = spawn, 1 = R (clockwise), 2 = 180°, 3 = L (counter-clockwise). */
export type Rotation = 0 | 1 | 2 | 3;

export interface Point {
  readonly x: number;
  readonly y: number;
}

export const PIECE_TYPES: readonly PieceType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

/** Guideline colors. */
export const PIECE_COLORS: Readonly<Record<PieceType, string>> = {
  I: '#00f0f0',
  O: '#f0f000',
  T: '#a000f0',
  S: '#00f000',
  Z: '#f00000',
  J: '#0050f0',
  L: '#f0a000',
};

interface PieceShape {
  /** Size of the square bounding box the piece rotates in. */
  readonly size: number;
  /** Cells in the spawn orientation, relative to the bounding box. */
  readonly cells: readonly Point[];
}

const SHAPES: Readonly<Record<PieceType, PieceShape>> = {
  I: { size: 4, cells: [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }] },
  O: { size: 2, cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }] },
  T: { size: 3, cells: [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }] },
  S: { size: 3, cells: [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }] },
  Z: { size: 3, cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }] },
  J: { size: 3, cells: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }] },
  L: { size: 3, cells: [{ x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }] },
};

/** Rotates a cell clockwise inside a bounding box of the given size. */
function rotateCW(p: Point, size: number): Point {
  return { x: size - 1 - p.y, y: p.x };
}

function buildRotations(shape: PieceShape): readonly (readonly Point[])[] {
  const rotations: Point[][] = [shape.cells.slice()];
  for (let r = 1; r < 4; r++) {
    rotations.push(rotations[r - 1].map((p) => rotateCW(p, shape.size)));
  }
  return rotations;
}

/** Precomputed cells for every piece and rotation state. */
const ROTATIONS: Readonly<Record<PieceType, readonly (readonly Point[])[]>> = {
  I: buildRotations(SHAPES.I),
  O: buildRotations(SHAPES.O),
  T: buildRotations(SHAPES.T),
  S: buildRotations(SHAPES.S),
  Z: buildRotations(SHAPES.Z),
  J: buildRotations(SHAPES.J),
  L: buildRotations(SHAPES.L),
};

export function pieceCells(type: PieceType, rotation: Rotation): readonly Point[] {
  return ROTATIONS[type][rotation];
}

export function boxSize(type: PieceType): number {
  return SHAPES[type].size;
}

// SRS wall kick offsets as listed in the Guideline (x right, y UP).
// Keys are "<from><to>" rotation states. They are converted to y-down below.
type KickTable = Readonly<Record<string, readonly (readonly [number, number])[]>>;

const JLSTZ_KICKS_Y_UP: KickTable = {
  '01': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '10': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '12': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '21': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '23': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '32': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '30': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '03': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
};

const I_KICKS_Y_UP: KickTable = {
  '01': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '10': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '12': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  '21': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '23': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '32': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '30': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '03': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
};

const NO_KICKS: readonly Point[] = [{ x: 0, y: 0 }];

function toScreenSpace(table: KickTable): Readonly<Record<string, readonly Point[]>> {
  const result: Record<string, readonly Point[]> = {};
  for (const key of Object.keys(table)) {
    result[key] = table[key].map(([x, y]) => ({ x, y: -y }));
  }
  return result;
}

const JLSTZ_KICKS = toScreenSpace(JLSTZ_KICKS_Y_UP);
const I_KICKS = toScreenSpace(I_KICKS_Y_UP);

/** Kick offsets (screen space) to try, in order, for a rotation. */
export function kickOffsets(type: PieceType, from: Rotation, to: Rotation): readonly Point[] {
  if (type === 'O') return NO_KICKS;
  const table = type === 'I' ? I_KICKS : JLSTZ_KICKS;
  return table[`${from}${to}`];
}

/** T-piece corner positions inside its 3x3 box, and which two are "front" per rotation. */
export const T_CORNERS: readonly Point[] = [
  { x: 0, y: 0 },
  { x: 2, y: 0 },
  { x: 2, y: 2 },
  { x: 0, y: 2 },
];

/** Indexes into T_CORNERS of the two corners the T is pointing towards. */
export const T_FRONT_CORNERS: Readonly<Record<Rotation, readonly [number, number]>> = {
  0: [0, 1],
  1: [1, 2],
  2: [2, 3],
  3: [3, 0],
};
