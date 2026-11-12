/** Tetromino definitions: shapes, rotation states, colours and SRS wall kicks. */

export type PieceType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

/** Rotation states: 0 = spawn, 1 = clockwise, 2 = upside down, 3 = counter clockwise. */
export type Rotation = 0 | 1 | 2 | 3;

/** A cell offset inside a piece matrix. */
export interface Offset {
  readonly x: number;
  readonly y: number;
}

/** A list of cell offsets. */
export type OffsetList = ReadonlyArray<Offset>;

export interface PieceDefinition {
  /** Size of the (square) piece matrix. */
  readonly size: number;
  /** Cells of every rotation state, relative to the matrix origin. */
  readonly states: ReadonlyArray<OffsetList>;
  /** Colour used to draw the piece. */
  readonly color: string;
}

export const PIECE_ORDER: readonly PieceType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

/** Spawn matrices of the pieces, in their flat side down orientation. */
const BASE_SHAPES: Record<PieceType, readonly string[]> = {
  I: ['....', 'XXXX', '....', '....'],
  J: ['X..', 'XXX', '...'],
  L: ['..X', 'XXX', '...'],
  O: ['XX', 'XX'],
  S: ['.XX', 'XX.', '...'],
  T: ['.X.', 'XXX', '...'],
  Z: ['XX.', '.XX', '...'],
};

/** Guideline colours. */
const PIECE_COLORS: Record<PieceType, string> = {
  I: '#31c7ef',
  J: '#005ad8',
  L: '#ff9a00',
  O: '#f7f500',
  S: '#00a300',
  Z: '#ff4b4b',
  T: '#c000c0',
};

function parseMatrix(rows: readonly string[]): Offset[] {
  const cells: Offset[] = [];
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] !== '.') cells.push({ x, y });
    }
  });
  return cells;
}

/** Rotates a cell set 90 degrees clockwise inside a `size` x `size` matrix. */
function rotateCells(cells: OffsetList, size: number): Offset[] {
  return cells.map(({ x, y }) => ({ x: size - 1 - y, y: x }));
}

function buildStates(type: PieceType): ReadonlyArray<OffsetList> {
  const base = parseMatrix(BASE_SHAPES[type]);
  const size = BASE_SHAPES[type].length;
  const states: Offset[][] = [base];
  for (let i = 1; i < 4; i++) {
    states.push(rotateCells(states[i - 1], size));
  }
  return states;
}

function buildDefinitions(): Record<PieceType, PieceDefinition> {
  const definitions = {} as Record<PieceType, PieceDefinition>;
  for (const type of PIECE_ORDER) {
    definitions[type] = {
      size: BASE_SHAPES[type].length,
      states: buildStates(type),
      color: PIECE_COLORS[type],
    };
  }
  return definitions;
}

export const PIECES: Record<PieceType, PieceDefinition> = buildDefinitions();

/** Cells of a piece in the given rotation state. */
export function pieceCells(type: PieceType, rotation: Rotation): OffsetList {
  return PIECES[type].states[rotation];
}

/** Colour of a piece. */
export function pieceColor(type: PieceType): string {
  return PIECES[type].color;
}

/**
 * Wall kick data of the Super Rotation System.
 *
 * The tables follow the Tetris Guideline notation (positive x to the right,
 * positive y upwards) and are converted here to board coordinates where the y
 * axis points downwards.
 */
const KICKS_Y_UP: Record<string, readonly (readonly [number, number])[]> = {
  // J, L, S, T and Z
  '0>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '1>0': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '1>2': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '2>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '2>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '3>2': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '3>0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '0>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  // I
  'I0>1': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  'I1>0': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  'I1>2': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  'I2>1': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  'I2>3': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  'I3>2': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  'I3>0': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  'I0>3': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
};

const KICKS: Record<string, OffsetList> = {};
for (const [key, kicks] of Object.entries(KICKS_Y_UP)) {
  KICKS[key] = kicks.map(([x, y]) => ({ x, y: -y }));
}

/**
 * Wall kick offsets for a rotation, in board coordinates (y points down).
 * The O piece never kicks.
 */
export function rotationKicks(type: PieceType, from: Rotation, to: Rotation): OffsetList {
  if (type === 'O') return [{ x: 0, y: 0 }];
  const prefix = type === 'I' ? 'I' : '';
  return KICKS[`${prefix}${from}>${to}`] ?? [{ x: 0, y: 0 }];
}
