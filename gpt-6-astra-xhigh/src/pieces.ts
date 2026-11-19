export const TYPES = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'] as const;
export type PieceType = typeof TYPES[number];
export type Rotation = 0 | 1 | 2 | 3;
export type Point = readonly [number, number];
export interface Piece {
  type: PieceType;
  rotation: Rotation;
  x: number;
  y: number;
}

export const COLORS: Record<PieceType, string> = {
  I: '#57dce8', J: '#5685ff', L: '#ffa65a', O: '#f2d85d',
  S: '#70d995', T: '#b68afa', Z: '#f4738b',
};

const SPAWN: Record<PieceType, readonly Point[]> = {
  I: [[0, 1], [1, 1], [2, 1], [3, 1]],
  J: [[0, 0], [0, 1], [1, 1], [2, 1]],
  L: [[2, 0], [0, 1], [1, 1], [2, 1]],
  O: [[1, 0], [2, 0], [1, 1], [2, 1]],
  S: [[1, 0], [2, 0], [0, 1], [1, 1]],
  T: [[1, 0], [0, 1], [1, 1], [2, 1]],
  Z: [[0, 0], [1, 0], [1, 1], [2, 1]],
};

// Precompute rotations around the SRS center (1,1), or (1.5,1.5) for I.
function rotations(type: PieceType): readonly (readonly Point[])[] {
  const states: Point[][] = [SPAWN[type].map(([x, y]) => [x, y])];
  for (let i = 1; i < 4; i++) {
    states.push(type === 'O' ? states[0] : states[i - 1].map(([x, y]) =>
      [type === 'I' ? 3 - y : 2 - y, x] as Point));
  }
  return states;
}
export const SHAPES: Record<PieceType, readonly (readonly Point[])[]> = {
  I: rotations('I'), J: rotations('J'), L: rotations('L'), O: rotations('O'),
  S: rotations('S'), T: rotations('T'), Z: rotations('Z'),
};

// SRS kick offsets use positive Y upward; the engine inverts Y for the board.
const JLSTZ_KICKS: Record<string, readonly Point[]> = {
  '0>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '1>0': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '1>2': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '2>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '2>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '3>2': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '3>0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '0>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
};
const I_KICKS: Record<string, readonly Point[]> = {
  '0>1': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '1>0': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '1>2': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  '2>1': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '2>3': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '3>2': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '3>0': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '0>3': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
};

export function kicks(type: PieceType, from: Rotation, to: Rotation): readonly Point[] {
  if (type === 'O') return [[0, 0]];
  return (type === 'I' ? I_KICKS : JLSTZ_KICKS)[`${from}>${to}`];
}

export function cells(piece: Piece): Point[] {
  return SHAPES[piece.type][piece.rotation].map(([x, y]) => [piece.x + x, piece.y + y]);
}

export class SevenBag {
  private bag: PieceType[] = [];

  constructor(private readonly random: () => number = Math.random) {}

  next(): PieceType {
    if (!this.bag.length) {
      this.bag = [...TYPES];
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
      }
    }
    return this.bag.pop()!;
  }
}
