import type { Cell, PieceType, Rotation } from './types.js';

/**
 * Wall-kick offset tables in SRS coordinates (y points up). Offsets are
 * applied as newX = x + dx, newY = y - dy because the board's y points down.
 * Keys map "fromState>toState" using numeric rotation states (1 = R, 3 = L).
 */
export type KickTable = Record<string, ReadonlyArray<readonly [number, number]>>;

export interface PieceDef {
  /** The four SRS rotation states, each expressed as cells in the piece's box. */
  readonly rotations: readonly (readonly Cell[])[];
  readonly spawnX: number;
  readonly spawnY: number;
  readonly color: string;
  /** null for the O piece, which never rotates. */
  readonly kicks: KickTable | null;
}

const c = (x: number, y: number): Cell => ({ x, y });

/** SRS wall kicks shared by J, L, S, T and Z. */
const JLSTZ_KICKS: KickTable = {
  '0>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '1>0': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '1>2': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '2>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '2>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '3>2': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '3>0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '0>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
};

/** SRS wall kicks for the I piece. */
const I_KICKS: KickTable = {
  '0>1': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '1>0': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '1>2': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  '2>1': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '2>3': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '3>2': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '3>0': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '0>3': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
};

export const PIECES: Record<PieceType, PieceDef> = {
  I: {
    rotations: [
      [c(0, 1), c(1, 1), c(2, 1), c(3, 1)],
      [c(2, 0), c(2, 1), c(2, 2), c(2, 3)],
      [c(0, 2), c(1, 2), c(2, 2), c(3, 2)],
      [c(1, 0), c(1, 1), c(1, 2), c(1, 3)],
    ],
    spawnX: 3,
    spawnY: 0,
    color: '#22d3ee',
    kicks: I_KICKS,
  },
  O: {
    rotations: [
      [c(0, 0), c(1, 0), c(0, 1), c(1, 1)],
      [c(0, 0), c(1, 0), c(0, 1), c(1, 1)],
      [c(0, 0), c(1, 0), c(0, 1), c(1, 1)],
      [c(0, 0), c(1, 0), c(0, 1), c(1, 1)],
    ],
    spawnX: 4,
    spawnY: 0,
    color: '#facc15',
    kicks: null,
  },
  T: {
    rotations: [
      [c(1, 0), c(0, 1), c(1, 1), c(2, 1)],
      [c(1, 0), c(1, 1), c(2, 1), c(1, 2)],
      [c(0, 1), c(1, 1), c(2, 1), c(1, 2)],
      [c(1, 0), c(0, 1), c(1, 1), c(1, 2)],
    ],
    spawnX: 3,
    spawnY: 0,
    color: '#c084fc',
    kicks: JLSTZ_KICKS,
  },
  S: {
    rotations: [
      [c(1, 0), c(2, 0), c(0, 1), c(1, 1)],
      [c(1, 0), c(1, 1), c(2, 1), c(2, 2)],
      [c(1, 1), c(2, 1), c(0, 2), c(1, 2)],
      [c(0, 0), c(0, 1), c(1, 1), c(1, 2)],
    ],
    spawnX: 3,
    spawnY: 0,
    color: '#4ade80',
    kicks: JLSTZ_KICKS,
  },
  Z: {
    rotations: [
      [c(0, 0), c(1, 0), c(1, 1), c(2, 1)],
      [c(2, 0), c(1, 1), c(2, 1), c(1, 2)],
      [c(0, 1), c(1, 1), c(1, 2), c(2, 2)],
      [c(1, 0), c(0, 1), c(1, 1), c(0, 2)],
    ],
    spawnX: 3,
    spawnY: 0,
    color: '#f87171',
    kicks: JLSTZ_KICKS,
  },
  J: {
    rotations: [
      [c(0, 0), c(0, 1), c(1, 1), c(2, 1)],
      [c(1, 0), c(2, 0), c(1, 1), c(1, 2)],
      [c(0, 1), c(1, 1), c(2, 1), c(2, 2)],
      [c(1, 0), c(1, 1), c(0, 2), c(1, 2)],
    ],
    spawnX: 3,
    spawnY: 0,
    color: '#60a5fa',
    kicks: JLSTZ_KICKS,
  },
  L: {
    rotations: [
      [c(2, 0), c(0, 1), c(1, 1), c(2, 1)],
      [c(1, 0), c(1, 1), c(1, 2), c(2, 2)],
      [c(0, 1), c(1, 1), c(2, 1), c(0, 2)],
      [c(0, 0), c(1, 0), c(1, 1), c(1, 2)],
    ],
    spawnX: 3,
    spawnY: 0,
    color: '#fb923c',
    kicks: JLSTZ_KICKS,
  },
};

/** Cells occupied by `type` in rotation state `rotation`. */
export const getCells = (type: PieceType, rotation: Rotation): readonly Cell[] =>
  PIECES[type].rotations[rotation];
