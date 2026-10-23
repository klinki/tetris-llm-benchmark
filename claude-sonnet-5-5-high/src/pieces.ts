/** Tetromino shapes, colors and Super Rotation System (SRS) kick tables. */

export type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
/** 0 = spawn, 1 = clockwise (R), 2 = 180 degrees, 3 = counter-clockwise (L). */
export type Rotation = 0 | 1 | 2 | 3;
export type Point = readonly [x: number, y: number];

export const PIECE_TYPES: readonly PieceType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

export const COLORS: Record<PieceType, string> = {
  I: '#00e5ee',
  O: '#f5e000',
  T: '#b040f0',
  S: '#30d030',
  Z: '#ee3030',
  J: '#3a5cff',
  L: '#ff9a00',
};

/** Spawn orientation of every piece, drawn in its SRS bounding box (y grows downwards). */
const SPAWN_SHAPES: Record<PieceType, readonly string[]> = {
  I: ['....', 'XXXX', '....', '....'],
  O: ['XX', 'XX'],
  T: ['.X.', 'XXX', '...'],
  S: ['.XX', 'XX.', '...'],
  Z: ['XX.', '.XX', '...'],
  J: ['X..', 'XXX', '...'],
  L: ['..X', 'XXX', '...'],
};

/** Side length of the bounding box the piece rotates in. */
export function boxSize(type: PieceType): number {
  return SPAWN_SHAPES[type].length;
}

function parseShape(rows: readonly string[]): Point[] {
  const cells: Point[] = [];
  rows.forEach((row, y) => [...row].forEach((ch, x) => ch === 'X' && cells.push([x, y])));
  return cells;
}

function rotateClockwise(cells: readonly Point[], size: number): Point[] {
  return cells.map(([x, y]) => [size - 1 - y, x] as const);
}

function buildRotations(type: PieceType): readonly (readonly Point[])[] {
  const size = boxSize(type);
  const states: Point[][] = [parseShape(SPAWN_SHAPES[type])];
  for (let r = 1; r < 4; r++) states.push(rotateClockwise(states[r - 1], size));
  return states;
}

const ROTATIONS = Object.fromEntries(PIECE_TYPES.map((t) => [t, buildRotations(t)])) as Record<
  PieceType,
  readonly (readonly Point[])[]
>;

/** Cells of a piece in its bounding box, relative to the box's top-left corner. */
export function pieceCells(type: PieceType, rotation: Rotation): readonly Point[] {
  return ROTATIONS[type][rotation];
}

// SRS wall kicks. Entries are tested in order, indexed by the rotation the piece rotates *from*.
// Written the way the Guideline publishes them (y grows upwards); `kicksFor` flips y for our board.
type KickTable = readonly (readonly Point[])[];

const JLSTZ_CW: KickTable = [
  [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]], // 0>R
  [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]], // R>2
  [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]], // 2>L
  [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]], // L>0
];
const JLSTZ_CCW: KickTable = [
  [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]], // 0>L
  [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]], // R>0
  [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]], // 2>R
  [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]], // L>2
];
const I_CW: KickTable = [
  [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]], // 0>R
  [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]], // R>2
  [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]], // 2>L
  [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]], // L>0
];
const I_CCW: KickTable = [
  [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]], // 0>L
  [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]], // R>0
  [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]], // 2>R
  [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]], // L>2
];
const O_KICKS: KickTable = [[[0, 0]], [[0, 0]], [[0, 0]], [[0, 0]]];

const flipY = (table: KickTable): KickTable =>
  table.map((tests) => tests.map(([x, y]) => [x, -y] as const));

const KICKS = {
  I: { cw: flipY(I_CW), ccw: flipY(I_CCW) },
  O: { cw: O_KICKS, ccw: O_KICKS },
  other: { cw: flipY(JLSTZ_CW), ccw: flipY(JLSTZ_CCW) },
};

/** Offsets to try, in order, when rotating from `from` (board coordinates, y grows downwards). */
export function kicksFor(type: PieceType, from: Rotation, clockwise: boolean): readonly Point[] {
  const set = type === 'I' ? KICKS.I : type === 'O' ? KICKS.O : KICKS.other;
  return (clockwise ? set.cw : set.ccw)[from];
}
