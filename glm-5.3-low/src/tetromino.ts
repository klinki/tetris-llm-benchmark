export type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export interface Cell {
  readonly x: number;
  readonly y: number;
}

export interface Offset {
  readonly x: number;
  readonly y: number;
}

export interface Tetromino {
  readonly type: PieceType;
  readonly color: string;
  readonly boxSize: number;
  readonly spawnX: number;
  /** Four rotation states: 0 = spawn, 1 = clockwise, 2 = 180°, 3 = counter-clockwise. */
  readonly rotations: readonly (readonly Cell[])[];
  /**
   * Super Rotation System wall kicks, keyed `"from>to"` rotation state.
   * Offsets are in playfield coordinates where y grows downward.
   */
  readonly kicks: Readonly<Record<string, readonly Offset[]>>;
}

const cells = (...points: [number, number][]): Cell[] =>
  points.map(([x, y]) => ({ x, y }));

const off = (...points: [number, number][]): Offset[] =>
  points.map(([x, y]) => ({ x, y }));

/** SRS kicks for J, L, S, T, Z (y grows downward). */
const JLSTZ_KICKS: Readonly<Record<string, readonly Offset[]>> = {
  '0>1': off([0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]),
  '1>0': off([0, 0], [1, 0], [1, 1], [0, -2], [1, -2]),
  '1>2': off([0, 0], [1, 0], [1, 1], [0, -2], [1, -2]),
  '2>1': off([0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]),
  '2>3': off([0, 0], [1, 0], [1, -1], [0, 2], [1, 2]),
  '3>2': off([0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]),
  '3>0': off([0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]),
  '0>3': off([0, 0], [1, 0], [1, -1], [0, 2], [1, 2]),
};

/** SRS kicks for I (y grows downward). */
const I_KICKS: Readonly<Record<string, readonly Offset[]>> = {
  '0>1': off([0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]),
  '1>0': off([0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]),
  '1>2': off([0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]),
  '2>1': off([0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]),
  '2>3': off([0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]),
  '3>2': off([0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]),
  '3>0': off([0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]),
  '0>3': off([0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]),
};

export const PIECES: Readonly<Record<PieceType, Tetromino>> = {
  I: {
    type: 'I',
    color: '#22d3ee',
    boxSize: 4,
    spawnX: 3,
    rotations: [
      cells([0, 1], [1, 1], [2, 1], [3, 1]),
      cells([2, 0], [2, 1], [2, 2], [2, 3]),
      cells([0, 2], [1, 2], [2, 2], [3, 2]),
      cells([1, 0], [1, 1], [1, 2], [1, 3]),
    ],
    kicks: I_KICKS,
  },
  J: {
    type: 'J',
    color: '#5c6bc0',
    boxSize: 3,
    spawnX: 3,
    rotations: [
      cells([0, 0], [0, 1], [1, 1], [2, 1]),
      cells([1, 0], [2, 0], [1, 1], [1, 2]),
      cells([0, 1], [1, 1], [2, 1], [2, 2]),
      cells([1, 0], [1, 1], [0, 2], [1, 2]),
    ],
    kicks: JLSTZ_KICKS,
  },
  L: {
    type: 'L',
    color: '#ffa726',
    boxSize: 3,
    spawnX: 3,
    rotations: [
      cells([2, 0], [0, 1], [1, 1], [2, 1]),
      cells([1, 0], [1, 1], [1, 2], [2, 2]),
      cells([0, 1], [1, 1], [2, 1], [0, 2]),
      cells([0, 0], [1, 0], [1, 1], [1, 2]),
    ],
    kicks: JLSTZ_KICKS,
  },
  O: {
    type: 'O',
    color: '#ffca28',
    boxSize: 4,
    spawnX: 3,
    rotations: [
      cells([1, 0], [2, 0], [1, 1], [2, 1]),
      cells([1, 0], [2, 0], [1, 1], [2, 1]),
      cells([1, 0], [2, 0], [1, 1], [2, 1]),
      cells([1, 0], [2, 0], [1, 1], [2, 1]),
    ],
    kicks: {},
  },
  S: {
    type: 'S',
    color: '#66bb6a',
    boxSize: 3,
    spawnX: 3,
    rotations: [
      cells([1, 0], [2, 0], [0, 1], [1, 1]),
      cells([1, 0], [1, 1], [2, 1], [2, 2]),
      cells([1, 1], [2, 1], [0, 2], [1, 2]),
      cells([0, 0], [0, 1], [1, 1], [1, 2]),
    ],
    kicks: JLSTZ_KICKS,
  },
  T: {
    type: 'T',
    color: '#ab47bc',
    boxSize: 3,
    spawnX: 3,
    rotations: [
      cells([1, 0], [0, 1], [1, 1], [2, 1]),
      cells([1, 0], [1, 1], [2, 1], [1, 2]),
      cells([0, 1], [1, 1], [2, 1], [1, 2]),
      cells([1, 0], [0, 1], [1, 1], [1, 2]),
    ],
    kicks: JLSTZ_KICKS,
  },
  Z: {
    type: 'Z',
    color: '#ef5350',
    boxSize: 3,
    spawnX: 3,
    rotations: [
      cells([0, 0], [1, 0], [1, 1], [2, 1]),
      cells([2, 0], [1, 1], [2, 1], [1, 2]),
      cells([0, 1], [1, 1], [1, 2], [2, 2]),
      cells([1, 0], [0, 1], [1, 1], [0, 2]),
    ],
    kicks: JLSTZ_KICKS,
  },
};

export const PIECE_TYPES: readonly PieceType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
