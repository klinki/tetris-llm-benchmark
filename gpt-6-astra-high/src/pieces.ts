export const TYPES = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'] as const;
export type PieceType = typeof TYPES[number];
export type Cell = readonly [number, number];
export type Rotation = 0 | 1 | 2 | 3;
export interface Piece { type: PieceType; x: number; y: number; rotation: Rotation }

export const COLORS: Record<PieceType, string> = {
  I: '#4dd9ed', J: '#5386f5', L: '#ffa355', O: '#f5d65b',
  S: '#74d994', T: '#bc8cf5', Z: '#f57487',
};

const SPAWN: Record<PieceType, readonly Cell[]> = {
  I: [[0, 1], [1, 1], [2, 1], [3, 1]],
  J: [[0, 0], [0, 1], [1, 1], [2, 1]],
  L: [[2, 0], [0, 1], [1, 1], [2, 1]],
  O: [[1, 0], [2, 0], [1, 1], [2, 1]],
  S: [[1, 0], [2, 0], [0, 1], [1, 1]],
  T: [[1, 0], [0, 1], [1, 1], [2, 1]],
  Z: [[0, 0], [1, 0], [1, 1], [2, 1]],
};

// Rotate around the SRS center: (1,1), or (1.5,1.5) for I.
const SHAPES = Object.fromEntries(TYPES.map(type => {
  const states: Cell[][] = [SPAWN[type].map(cell => [...cell] as Cell)];
  for (let r = 1; r < 4; r++) {
    states.push(type === 'O' ? states[0]! : states[r - 1]!.map(([x, y]) => [
      (type === 'I' ? 3 : 2) - y, x,
    ]));
  }
  return [type, states];
})) as Record<PieceType, Cell[][]>;

export function cells(piece: Piece): Cell[] {
  return SHAPES[piece.type][piece.rotation]!.map(([x, y]) => [x + piece.x, y + piece.y]);
}

export function shape(type: PieceType): readonly Cell[] { return SPAWN[type]; }

// SRS offsets use positive Y upward; the engine converts to board coordinates.
const JLSTZ: Record<string, readonly Cell[]> = {
  '0>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '1>0': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '1>2': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '2>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '2>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '3>2': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '3>0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '0>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
};
const I_KICKS: Record<string, readonly Cell[]> = {
  '0>1': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '1>0': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '1>2': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  '2>1': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '2>3': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '3>2': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '3>0': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '0>3': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
};

export function kicks(type: PieceType, from: Rotation, to: Rotation): readonly Cell[] {
  return type === 'O' ? [[0, 0]] : (type === 'I' ? I_KICKS : JLSTZ)[`${from}>${to}`]!;
}

export class SevenBag {
  private bag: PieceType[] = [];
  constructor(private readonly random: () => number = Math.random) {}

  next(): PieceType {
    if (!this.bag.length) {
      this.bag = [...TYPES];
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j]!, this.bag[i]!];
      }
    }
    return this.bag.pop()!;
  }
}
