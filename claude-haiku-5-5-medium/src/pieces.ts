import { PIECE_TYPES, PieceType, Rotation, Vec } from './types.js';

// Spawn-orientation shapes, 1 = filled. Other rotations are derived by rotating clockwise.
const SHAPES: Record<PieceType, number[][]> = {
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

export const COLORS: Record<PieceType, string> = {
  I: '#00f0f0',
  O: '#f0f000',
  T: '#a000f0',
  S: '#00f000',
  Z: '#f00000',
  J: '#0000f0',
  L: '#f0a000',
};

function rotateClockwise(m: number[][]): number[][] {
  const n = m.length;
  return m.map((_, r) => m.map((__, c) => m[n - 1 - c][r]));
}

function buildOffsets(): Record<PieceType, Vec[][]> {
  const result = {} as Record<PieceType, Vec[][]>;
  for (const type of PIECE_TYPES) {
    let matrix = SHAPES[type];
    const states: Vec[][] = [];
    for (let r = 0; r < 4; r++) {
      const cells: Vec[] = [];
      matrix.forEach((row, y) => row.forEach((filled, x) => {
        if (filled) cells.push({ x, y });
      }));
      states.push(cells);
      matrix = rotateClockwise(matrix);
    }
    result[type] = states;
  }
  return result;
}

const OFFSETS = buildOffsets();

export function pieceCells(type: PieceType, rotation: Rotation): readonly Vec[] {
  return OFFSETS[type][rotation];
}

// Super Rotation System wall kicks. The wiki writes offsets with y pointing up, so they are
// flipped here to match screen coordinates (y pointing down).
type KickPairs = [number, number][];
const toScreen = (pairs: KickPairs): Vec[] => pairs.map(([x, y]) => ({ x, y: -y }));

function kickTable(entries: Record<string, KickPairs>): Record<string, readonly Vec[]> {
  return Object.fromEntries(Object.entries(entries).map(([key, pairs]) => [key, toScreen(pairs)]));
}

const JLSTZ_KICKS = kickTable({
  '0>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '1>0': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '1>2': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '2>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '2>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '3>2': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '3>0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '0>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
});

const I_KICKS = kickTable({
  '0>1': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '1>0': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '1>2': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  '2>1': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '2>3': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '3>2': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '3>0': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '0>3': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
});

// The O piece looks the same in every rotation, so it never needs a kick.
const NO_KICK: readonly Vec[] = [{ x: 0, y: 0 }];

export function wallKicks(type: PieceType, from: Rotation, to: Rotation): readonly Vec[] {
  if (type === 'O') return NO_KICK;
  const table = type === 'I' ? I_KICKS : JLSTZ_KICKS;
  return table[`${from}>${to}`];
}
