export const TYPES = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'] as const;
export type Kind = (typeof TYPES)[number];
export type Cell = readonly [number, number];
export interface Piece {
  kind: Kind;
  x: number;
  y: number;
  rotation: number;
}

const spawn: Record<Kind, Cell[]> = {
  I: [
    [0, 1],
    [1, 1],
    [2, 1],
    [3, 1]
  ],
  J: [
    [0, 0],
    [0, 1],
    [1, 1],
    [2, 1]
  ],
  L: [
    [2, 0],
    [0, 1],
    [1, 1],
    [2, 1]
  ],
  O: [
    [1, 0],
    [2, 0],
    [1, 1],
    [2, 1]
  ],
  S: [
    [1, 0],
    [2, 0],
    [0, 1],
    [1, 1]
  ],
  T: [
    [1, 0],
    [0, 1],
    [1, 1],
    [2, 1]
  ],
  Z: [
    [0, 0],
    [1, 0],
    [1, 1],
    [2, 1]
  ]
};

function rotations(kind: Kind): Cell[][] {
  const states = [spawn[kind]];
  const edge = kind === 'I' ? 3 : 2;
  for (let i = 1; i < 4; i++) {
    states.push(
      kind === 'O' ? spawn.O : states[i - 1].map(([x, y]) => [edge - y, x])
    );
  }
  return states;
}
const shapes = Object.fromEntries(
  TYPES.map((k) => [k, rotations(k)])
) as Record<Kind, Cell[][]>;
export function cells(piece: Piece): Cell[] {
  return shapes[piece.kind][piece.rotation];
}

// SRS kick coordinates use positive y upwards. The board uses positive y downwards.
const normal: Record<string, Cell[]> = {
  '01': [
    [0, 0],
    [-1, 0],
    [-1, 1],
    [0, -2],
    [-1, -2]
  ],
  '10': [
    [0, 0],
    [1, 0],
    [1, -1],
    [0, 2],
    [1, 2]
  ],
  '12': [
    [0, 0],
    [1, 0],
    [1, -1],
    [0, 2],
    [1, 2]
  ],
  '21': [
    [0, 0],
    [-1, 0],
    [-1, 1],
    [0, -2],
    [-1, -2]
  ],
  '23': [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, -2],
    [1, -2]
  ],
  '32': [
    [0, 0],
    [-1, 0],
    [-1, -1],
    [0, 2],
    [-1, 2]
  ],
  '30': [
    [0, 0],
    [-1, 0],
    [-1, -1],
    [0, 2],
    [-1, 2]
  ],
  '03': [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, -2],
    [1, -2]
  ]
};
const long: Record<string, Cell[]> = {
  '01': [
    [0, 0],
    [-2, 0],
    [1, 0],
    [-2, -1],
    [1, 2]
  ],
  '10': [
    [0, 0],
    [2, 0],
    [-1, 0],
    [2, 1],
    [-1, -2]
  ],
  '12': [
    [0, 0],
    [-1, 0],
    [2, 0],
    [-1, 2],
    [2, -1]
  ],
  '21': [
    [0, 0],
    [1, 0],
    [-2, 0],
    [1, -2],
    [-2, 1]
  ],
  '23': [
    [0, 0],
    [2, 0],
    [-1, 0],
    [2, 1],
    [-1, -2]
  ],
  '32': [
    [0, 0],
    [-2, 0],
    [1, 0],
    [-2, -1],
    [1, 2]
  ],
  '30': [
    [0, 0],
    [1, 0],
    [-2, 0],
    [1, -2],
    [-2, 1]
  ],
  '03': [
    [0, 0],
    [-1, 0],
    [2, 0],
    [-1, 2],
    [2, -1]
  ]
};
export function kicks(kind: Kind, from: number, to: number): Cell[] {
  if (kind === 'O') return [[0, 0]];
  return (kind === 'I' ? long : normal)[String(from) + to];
}

export function bag(random: () => number): Kind[] {
  const pieces = [...TYPES];
  for (let i = pieces.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
  }
  return pieces;
}
