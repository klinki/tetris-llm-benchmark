export type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export const PIECE_TYPES: readonly PieceType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

/** Rotation state: 0 = spawn, 1 = clockwise (R), 2 = 180°, 3 = counter-clockwise (L). */
export type Rotation = 0 | 1 | 2 | 3;

/** Board coordinates: x grows to the right, y grows downwards. */
export type Point = readonly [x: number, y: number];

/** A piece in play: `x`/`y` locate the top-left corner of its bounding box. */
export interface ActivePiece {
  readonly type: PieceType;
  readonly rotation: Rotation;
  readonly x: number;
  readonly y: number;
}

/** Guideline colors: cyan I, yellow O, purple T, green S, red Z, blue J, orange L. */
export const COLORS: Readonly<Record<PieceType, string>> = {
  I: '#2fd3f0',
  O: '#f7d308',
  T: '#a347d1',
  S: '#4cc94c',
  Z: '#ef3340',
  J: '#3d6fe0',
  L: '#f58a1f',
};

/** Spawn orientation of each piece inside its SRS bounding box. */
const SPAWN_SHAPES: Readonly<Record<PieceType, readonly string[]>> = {
  I: ['....', 'IIII', '....', '....'],
  O: ['OO', 'OO'],
  T: ['.T.', 'TTT', '...'],
  S: ['.SS', 'SS.', '...'],
  Z: ['ZZ.', '.ZZ', '...'],
  J: ['J..', 'JJJ', '...'],
  L: ['..L', 'LLL', '...'],
};

function mapValues<K extends string, V, R>(record: Readonly<Record<K, V>>, fn: (value: V) => R): Record<K, R> {
  const result = {} as Record<K, R>;
  for (const key in record) result[key] = fn(record[key]);
  return result;
}

/** Rotates the spawn shape clockwise inside its box to get all four SRS states. */
function buildRotations(rows: readonly string[]): Point[][] {
  const size = rows.length;
  let cells: Point[] = [];
  rows.forEach((row, y) => [...row].forEach((char, x) => char !== '.' && cells.push([x, y])));

  const states = [cells];
  for (let r = 1; r < 4; r++) {
    cells = cells.map(([x, y]) => [size - 1 - y, x]);
    states.push(cells);
  }
  return states;
}

/** Cell offsets within the bounding box, indexed by piece type and rotation. */
export const SHAPES: Readonly<Record<PieceType, readonly (readonly Point[])[]>> = mapValues(
  SPAWN_SHAPES,
  buildRotations,
);

export function pieceCells(piece: ActivePiece): Point[] {
  return SHAPES[piece.type][piece.rotation].map(([x, y]) => [piece.x + x, piece.y + y]);
}

type KickTable = Readonly<Record<string, readonly Point[]>>;

/** Converts a kick table from the wiki's y-up notation to the board's y-down axis. */
function toBoardAxis(table: KickTable): KickTable {
  return mapValues(table, (kicks) => kicks.map(([x, y]): Point => [x, -y]));
}

// Super Rotation System wall kicks, as listed on https://tetris.fandom.com/wiki/SRS.
// Keys are "<from><to>" rotation states; tests are tried in order.
const JLSTZ_KICKS = toBoardAxis({
  '01': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '10': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '12': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '21': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '23': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '32': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '30': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '03': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
});

const I_KICKS = toBoardAxis({
  '01': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '10': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '12': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  '21': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '23': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '32': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '30': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '03': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
});

const NO_KICKS: readonly Point[] = [[0, 0]];

/** Offsets to try, in order, when rotating a piece from one state to another. */
export function kicksFor(type: PieceType, from: Rotation, to: Rotation): readonly Point[] {
  if (type === 'O') return NO_KICKS;
  return (type === 'I' ? I_KICKS : JLSTZ_KICKS)[`${from}${to}`];
}
