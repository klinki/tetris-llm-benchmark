export type Kind = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';
export type Point = readonly [number, number];
export type Rotation = 0 | 1 | 2 | 3;
export interface Piece { kind: Kind; rotation: Rotation; x: number; y: number }

export const KINDS: readonly Kind[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
export const COLORS: Record<Kind, string> = {
  I: '#60d3e6', J: '#6185ed', L: '#f2aa5b', O: '#edce65',
  S: '#91cc78', T: '#b18adb', Z: '#eb7c89',
};
const SPAWN: Record<Kind, readonly Point[]> = {
  I: [[0, 1], [1, 1], [2, 1], [3, 1]],
  J: [[0, 0], [0, 1], [1, 1], [2, 1]],
  L: [[2, 0], [0, 1], [1, 1], [2, 1]],
  O: [[1, 0], [2, 0], [1, 1], [2, 1]],
  S: [[1, 0], [2, 0], [0, 1], [1, 1]],
  T: [[1, 0], [0, 1], [1, 1], [2, 1]],
  Z: [[0, 0], [1, 0], [1, 1], [2, 1]],
};

// SRS rotates J/L/S/T/Z about (1,1), and I about (1.5,1.5).
const SHAPES = Object.fromEntries(KINDS.map(kind => {
  const states: Point[][] = [SPAWN[kind].map(([x, y]) => [x, y])];
  for (let i = 1; i < 4; i++) {
    states.push(kind === 'O' ? states[0]! : states[i - 1]!.map(([x, y]) => [kind === 'I' ? 3 - y : 2 - y, x]));
  }
  return [kind, states];
})) as Record<Kind, Point[][]>;

export function shape(kind: Kind, rotation: Rotation = 0): readonly Point[] {
  return SHAPES[kind][rotation]!;
}
export function cells(piece: Piece): Point[] {
  return shape(piece.kind, piece.rotation).map(([x, y]) => [x + piece.x, y + piece.y]);
}

// Kick offsets use the SRS convention: positive Y points upward.
const COMMON_KICKS: Record<string, readonly Point[]> = {
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
export function kicks(kind: Kind, from: Rotation, to: Rotation): readonly Point[] {
  return kind === 'O' ? [[0, 0]] : (kind === 'I' ? I_KICKS : COMMON_KICKS)[`${from}>${to}`]!;
}

/** Every consecutive bag contains each of the seven pieces exactly once. */
export class Bag {
  private bag: Kind[] = [];
  constructor(private readonly random: () => number = Math.random) {}
  next(): Kind {
    if (!this.bag.length) {
      this.bag = [...KINDS];
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j]!, this.bag[i]!];
      }
    }
    return this.bag.pop()!;
  }
}
