export const KINDS = ["I", "J", "L", "O", "S", "T", "Z"] as const;
export type Kind = (typeof KINDS)[number];
export type Point = readonly [x: number, y: number];
export type Rotation = 0 | 1 | 2 | 3;

export interface Piece {
  readonly kind: Kind;
  readonly rotation: Rotation;
  readonly x: number;
  readonly y: number;
}

const spawnShape: Record<Kind, readonly Point[]> = {
  I: [[0, 1], [1, 1], [2, 1], [3, 1]],
  J: [[0, 0], [0, 1], [1, 1], [2, 1]],
  L: [[2, 0], [0, 1], [1, 1], [2, 1]],
  O: [[1, 0], [2, 0], [1, 1], [2, 1]],
  S: [[1, 0], [2, 0], [0, 1], [1, 1]],
  T: [[1, 0], [0, 1], [1, 1], [2, 1]],
  Z: [[0, 0], [1, 0], [1, 1], [2, 1]],
};

function rotations(kind: Kind): readonly (readonly Point[])[] {
  const facings = [spawnShape[kind]];
  const lastIndex = kind === "I" ? 3 : 2;
  for (let i = 0; i < 3; i++) {
    facings.push(kind === "O" ? facings[i] : facings[i].map(([x, y]) => [lastIndex - y, x]));
  }
  return facings;
}

export const SHAPES = {
  I: rotations("I"), J: rotations("J"), L: rotations("L"), O: rotations("O"),
  S: rotations("S"), T: rotations("T"), Z: rotations("Z"),
};

// Offsets follow SRS with positive y pointing down the board.
const commonKicks: Record<string, readonly Point[]> = {
  "01": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "10": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "12": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "21": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "23": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "32": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "30": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "03": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
};

const iKicks: Record<string, readonly Point[]> = {
  "01": [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  "10": [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  "12": [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
  "21": [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  "23": [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  "32": [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  "30": [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  "03": [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
};

const noKick = [[0, 0]] as const;

export function rotationKicks(kind: Kind, from: Rotation, to: Rotation): readonly Point[] {
  if (kind === "O") return noKick;
  return (kind === "I" ? iKicks : commonKicks)[`${from}${to}`];
}

export class Bag {
  private pieces: Kind[] = [];

  constructor(private readonly random: () => number = Math.random) {}

  take(): Kind {
    if (this.pieces.length === 0) {
      this.pieces = [...KINDS];
      for (let i = this.pieces.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [this.pieces[i], this.pieces[j]] = [this.pieces[j], this.pieces[i]];
      }
    }
    return this.pieces.pop()!;
  }
}
