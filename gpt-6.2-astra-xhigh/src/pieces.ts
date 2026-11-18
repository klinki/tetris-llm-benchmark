export const TYPES = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'] as const;
export type Kind = (typeof TYPES)[number];
export type Point = readonly [number, number];
export interface Piece {
  kind: Kind;
  rotation: number;
  x: number;
  y: number;
}

const layouts: Record<Kind, string[]> = {
  I: ['....', 'IIII', '....', '....'],
  J: ['J..', 'JJJ', '...'],
  L: ['..L', 'LLL', '...'],
  O: ['OO', 'OO'],
  S: ['.SS', 'SS.', '...'],
  T: ['.T.', 'TTT', '...'],
  Z: ['ZZ.', '.ZZ', '...'],
};

function orientations(kind: Kind): Point[][] {
  const layout = layouts[kind];
  const states: Point[][] = [[]];
  layout.forEach((row, y) =>
    [...row].forEach((cell, x) => {
      if (cell !== '.') states[0].push([x, y]);
    }),
  );
  for (let i = 1; i < 4; i++) {
    states.push(states[i - 1].map(([x, y]) => [layout.length - 1 - y, x]));
  }
  return states;
}

export const SHAPES = Object.fromEntries(TYPES.map((kind) => [kind, orientations(kind)])) as Record<
  Kind,
  Point[][]
>;

// SRS offsets expressed in board coordinates (positive y points down).
const A: Point[] = [
  [0, 0],
  [-1, 0],
  [-1, -1],
  [0, 2],
  [-1, 2],
];
const B: Point[] = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, -2],
  [1, -2],
];
const C: Point[] = [
  [0, 0],
  [1, 0],
  [1, -1],
  [0, 2],
  [1, 2],
];
const D: Point[] = [
  [0, 0],
  [-1, 0],
  [-1, 1],
  [0, -2],
  [-1, -2],
];
const jltsz: Point[][][] = [
  [A, C],
  [B, B],
  [C, A],
  [D, D],
];

const IA: Point[] = [
  [0, 0],
  [-2, 0],
  [1, 0],
  [-2, 1],
  [1, -2],
];
const IB: Point[] = [
  [0, 0],
  [2, 0],
  [-1, 0],
  [2, -1],
  [-1, 2],
];
const IC: Point[] = [
  [0, 0],
  [-1, 0],
  [2, 0],
  [-1, -2],
  [2, 1],
];
const ID: Point[] = [
  [0, 0],
  [1, 0],
  [-2, 0],
  [1, 2],
  [-2, -1],
];
const iKicks: Point[][][] = [
  [IA, IC],
  [IC, IB],
  [IB, ID],
  [ID, IA],
];

export function kicks(kind: Kind, rotation: number, direction: 1 | -1): Point[] {
  if (kind === 'O') return [[0, 0]];
  return (kind === 'I' ? iKicks : jltsz)[rotation][direction === 1 ? 0 : 1];
}

export class BagQueue {
  pieces: Kind[] = [];
  constructor(private random: () => number) {
    this.fill();
  }

  private fill() {
    while (this.pieces.length < 6) {
      const bag = [...TYPES];
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
      this.pieces.push(...bag);
    }
  }

  take(): Kind {
    const next = this.pieces.shift()!;
    this.fill();
    return next;
  }
}
