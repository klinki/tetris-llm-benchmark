import type { PieceType } from './constants.js';

export type Rotation = 0 | 1 | 2 | 3;

// Base spawn orientations. I is 4x4, O is 2x2, rest are 3x3.
const BASE: Record<PieceType, string[]> = {
  I: ['....', 'XXXX', '....', '....'],
  O: ['XX', 'XX'],
  T: ['.X.', 'XXX', '...'],
  S: ['.XX', 'XX.', '...'],
  Z: ['XX.', '.XX', '...'],
  J: ['X..', 'XXX', '...'],
  L: ['..X', 'XXX', '...'],
};

function rotateCW(matrix: string[]): string[] {
  const n = matrix.length;
  const out: string[] = [];
  for (let y = 0; y < n; y++) {
    let row = '';
    for (let x = 0; x < n; x++) row += matrix[n - 1 - x][y];
    out.push(row);
  }
  return out;
}

function cellsOfMatrix(matrix: string[]): Array<[number, number]> {
  const cells: Array<[number, number]> = [];
  for (let y = 0; y < matrix.length; y++)
    for (let x = 0; x < matrix[y].length; x++)
      if (matrix[y][x] === 'X') cells.push([x, y]);
  return cells;
}

/** Cells of a piece in a given rotation, relative to bounding-box origin. */
export function getCells(type: PieceType, rotation: Rotation): Array<[number, number]> {
  let m = BASE[type];
  for (let i = 0; i < rotation; i++) m = rotateCW(m);
  return cellsOfMatrix(m);
}

export function boxSize(type: PieceType): number {
  return BASE[type].length;
}

type Kick = [number, number];

// SRS kicks converted to y-down coordinates (spec uses y-up, so y is negated).
const JLSTZ_KICKS: Record<string, Kick[]> = {
  '0->1': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  '1->0': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
  '1->2': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
  '2->1': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  '2->3': [[0,0],[1,0],[1,-1],[0,2],[1,2]],
  '3->2': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  '3->0': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  '0->3': [[0,0],[1,0],[1,-1],[0,2],[1,2]],
};

const I_KICKS: Record<string, Kick[]> = {
  '0->1': [[0,0],[-2,0],[1,0],[-2,1],[1,-2]],
  '1->0': [[0,0],[2,0],[-1,0],[2,-1],[-1,2]],
  '1->2': [[0,0],[-1,0],[2,0],[-1,-2],[2,1]],
  '2->1': [[0,0],[1,0],[-2,0],[1,2],[-2,-1]],
  '2->3': [[0,0],[2,0],[-1,0],[2,-1],[-1,2]],
  '3->2': [[0,0],[-2,0],[1,0],[-2,1],[1,-2]],
  '3->0': [[0,0],[1,0],[-2,0],[1,2],[-2,-1]],
  '0->3': [[0,0],[-1,0],[2,0],[-1,-2],[2,1]],
};

export function getKicks(type: PieceType, from: Rotation, to: Rotation): Kick[] {
  if (type === 'O') return [[0, 0]];
  const key = `${from}->${to}`;
  if (type === 'I') return I_KICKS[key] ?? [[0, 0]];
  return JLSTZ_KICKS[key] ?? [[0, 0]];
}

/** Clockwise spawn x so the piece starts centered. */
export function spawnX(type: PieceType): number {
  if (type === 'O') return 4;
  return 3;
}
