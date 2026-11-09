import type { Kick, PieceType } from './types.js';

/** The seven Guideline tetrominoes. */
export const PIECE_TYPES: readonly PieceType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

/** Standard Guideline colours — one distinct colour per shape. */
export const COLORS: Record<PieceType, string> = {
  I: '#31d7e6', // cyan
  J: '#3d6cf5', // blue
  L: '#f5a623', // orange
  O: '#f7d51d', // yellow
  S: '#4bd35d', // green
  T: '#b45cf0', // purple
  Z: '#f25050', // red
};

/**
 * Super Rotation System spawn states. Each piece lives in a square box
 * (3x3 for J/L/S/T/Z, 4x4 for I/O); 1 marks a filled cell, row 0 is the top.
 */
const SPAWN: Record<PieceType, number[][]> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
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
  O: [
    [0, 1, 1, 0],
    [0, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
};

export interface PieceDef {
  readonly type: PieceType;
  readonly size: number;
  /** states[rotation][y][x] for rotation 0..3. */
  readonly states: readonly number[][][];
  readonly color: string;
}

/** Rotate a square matrix 90° clockwise: out[y][x] = in[n-1-x][y]. */
function rotateCW(m: number[][]): number[][] {
  const n = m.length;
  const out: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  for (let y = 0; y < n; y += 1) {
    for (let x = 0; x < n; x += 1) {
      out[y][x] = m[n - 1 - x][y];
    }
  }
  return out;
}

function buildStates(type: PieceType): number[][][] {
  const spawn = SPAWN[type];
  const states: number[][][] = [spawn];
  for (let r = 1; r < 4; r += 1) {
    // The O piece never rotates, so all four states are identical.
    states.push(type === 'O' ? spawn : rotateCW(states[r - 1]));
  }
  return states;
}

function makeDefs(): Record<PieceType, PieceDef> {
  const defs = {} as Record<PieceType, PieceDef>;
  for (const type of PIECE_TYPES) {
    defs[type] = {
      type,
      size: SPAWN[type].length,
      states: buildStates(type),
      color: COLORS[type],
    };
  }
  return defs;
}

export const PIECE_DEFS: Record<PieceType, PieceDef> = makeDefs();

/**
 * SRS wall-kick offsets, already converted to board coordinates (y down).
 * Each list is tried in order for a given rotation transition; the first
 * test is always (0, 0). J/L/S/T/Z share one table, I has its own.
 */
const NO_KICKS: readonly Kick[] = [[0, 0]];

export const JLSTZ_KICKS: Record<string, readonly Kick[]> = {
  '0>1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '1>0': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '1>2': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '2>1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '2>3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '3>2': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '3>0': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '0>3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
};

export const I_KICKS: Record<string, readonly Kick[]> = {
  '0>1': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  '1>0': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  '1>2': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
  '2>1': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  '2>3': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  '3>2': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  '3>0': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  '0>3': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
};

export function kicksFor(type: PieceType, from: number, to: number): readonly Kick[] {
  if (type === 'O') return NO_KICKS;
  const table = type === 'I' ? I_KICKS : JLSTZ_KICKS;
  return table[`${from}>${to}`] ?? NO_KICKS;
}
