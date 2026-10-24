export type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

/** 0 = spawn, 1 = right (clockwise), 2 = 180°, 3 = left */
export type Rotation = 0 | 1 | 2 | 3;

/** [x, y] offset inside the piece's bounding box, y pointing down */
export type Offset = readonly [number, number];

export const PIECE_TYPES: readonly PieceType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

export const COLORS: Record<PieceType, string> = {
  I: '#00f0f0',
  O: '#f0f000',
  T: '#a000f0',
  S: '#00f000',
  Z: '#f00000',
  J: '#0000f0',
  L: '#f0a000',
};

const SPAWN_SHAPES: Record<PieceType, number[][]> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
};

const rotateCW = (m: number[][]): number[][] => m[0].map((_, c) => m.map((row) => row[c]).reverse());

const toOffsets = (m: number[][]): Offset[] => {
  const out: Offset[] = [];
  m.forEach((row, y) => row.forEach((v, x) => {
    if (v) out.push([x, y]);
  }));
  return out;
};

// Pre-computed filled cells for every piece and rotation state.
const SHAPES = Object.fromEntries(
  PIECE_TYPES.map((type) => {
    const states: Offset[][] = [];
    let m = SPAWN_SHAPES[type];
    for (let r = 0; r < 4; r++) {
      states.push(toOffsets(m));
      m = rotateCW(m);
    }
    return [type, states];
  }),
) as Record<PieceType, Offset[][]>;

export function cells(type: PieceType, rot: Rotation): readonly Offset[] {
  return SHAPES[type][rot];
}

export function boxSize(type: PieceType): number {
  return SPAWN_SHAPES[type].length;
}

// SRS wall kick tests, from the Tetris wiki. Offsets are [x, y] with y pointing UP,
// as published. The game flips the sign of y when applying them.
const NO_KICK: Offset[] = [[0, 0]];

const JLSTZ_KICKS: Record<string, Offset[]> = {
  '0>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '1>0': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '1>2': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '2>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '2>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '3>2': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '3>0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '0>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
};

const I_KICKS: Record<string, Offset[]> = {
  '0>1': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '1>0': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '1>2': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  '2>1': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '2>3': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '3>2': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '3>0': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '0>3': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
};

/** Kick tests to try, in order, when rotating from `from` to `to`. */
export function kickTests(type: PieceType, from: Rotation, to: Rotation): readonly Offset[] {
  if (type === 'O') return NO_KICK;
  const key = `${from}>${to}`;
  return (type === 'I' ? I_KICKS : JLSTZ_KICKS)[key];
}
