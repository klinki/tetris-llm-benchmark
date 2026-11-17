export const kinds = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'] as const;
export type Kind = typeof kinds[number];
export type Point = readonly [x: number, y: number];
export type Rotation = 0 | 1 | 2 | 3;

export const shapes: Record<Kind, Point[][]> = {
  I: [
    [[0, 1], [1, 1], [2, 1], [3, 1]],
    [[2, 0], [2, 1], [2, 2], [2, 3]],
    [[0, 2], [1, 2], [2, 2], [3, 2]],
    [[1, 0], [1, 1], [1, 2], [1, 3]],
  ],
  J: rotations([[0, 0], [0, 1], [1, 1], [2, 1]]),
  L: rotations([[2, 0], [0, 1], [1, 1], [2, 1]]),
  O: Array.from({ length: 4 }, () => [[1, 0], [2, 0], [1, 1], [2, 1]]),
  S: rotations([[1, 0], [2, 0], [0, 1], [1, 1]]),
  T: rotations([[1, 0], [0, 1], [1, 1], [2, 1]]),
  Z: rotations([[0, 0], [1, 0], [1, 1], [2, 1]]),
};

function rotations(start: Point[]): Point[][] {
  const states = [start];
  for (let i = 1; i < 4; i++) {
    states.push(states[i - 1].map(([x, y]) => [2 - y, x]));
  }
  return states;
}

// SRS kick offsets use positive y upwards.
const commonKicks: Record<string, Point[]> = {
  '0>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '1>0': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '1>2': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '2>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '2>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '3>2': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '3>0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '0>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
};

const iKicks: Record<string, Point[]> = {
  '0>1': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '1>0': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '1>2': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  '2>1': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '2>3': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '3>2': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '3>0': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '0>3': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
};

export function kicks(kind: Kind, from: Rotation, to: Rotation): Point[] {
  if (kind === 'O') return [[0, 0]];
  return (kind === 'I' ? iKicks : commonKicks)[`${from}>${to}`];
}

export class Bag {
  private remaining: Kind[] = [];

  constructor(private readonly random: () => number = Math.random) {}

  take(): Kind {
    if (this.remaining.length === 0) {
      this.remaining = [...kinds];
      for (let i = this.remaining.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [this.remaining[i], this.remaining[j]] = [this.remaining[j], this.remaining[i]];
      }
    }
    return this.remaining.pop()!;
  }
}
