export const TYPES = ["I", "J", "L", "O", "S", "T", "Z"] as const;
export type Kind = (typeof TYPES)[number];
export type Point = readonly [x: number, y: number];
export type Cell = Kind | null;

export interface Piece {
  kind: Kind;
  x: number;
  y: number;
  rotation: number;
}

// The square frames preserve the SRS rotation centers, including the I's half-cell pivot.
const spawnFrames: Record<Kind, string[]> = {
  I: ["....", "IIII", "....", "...."],
  J: ["J..", "JJJ", "..."],
  L: ["..L", "LLL", "..."],
  O: [".OO.", ".OO.", "....", "...."],
  S: [".SS", "SS.", "..."],
  T: [".T.", "TTT", "..."],
  Z: ["ZZ.", ".ZZ", "..."],
};

function orientations(kind: Kind): Point[][] {
  const frame = spawnFrames[kind];
  let cells: Point[] = [];
  frame.forEach((row, y) => [...row].forEach((cell, x) => {
    if (cell !== ".") cells.push([x, y]);
  }));
  const states: Point[][] = [];
  for (let rotation = 0; rotation < 4; rotation++) {
    states.push(cells);
    if (kind !== "O") cells = cells.map(([x, y]) => [frame.length - 1 - y, x]);
  }
  return states;
}

const shapes = Object.fromEntries(TYPES.map(kind => [kind, orientations(kind)])) as Record<Kind, Point[][]>;

export function cells(kind: Kind, rotation = 0): readonly Point[] {
  return shapes[kind][rotation];
}

// These tables use the Guideline's positive-up y axis. The board uses positive-down.
const rightA: Point[] = [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]];
const rightB: Point[] = [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]];
const leftA: Point[] = [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]];
const leftB: Point[] = [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]];
const standardKicks: Record<string, Point[]> = {
  "0>1": rightA, "1>0": rightB, "1>2": rightB, "2>1": rightA,
  "2>3": leftA, "3>2": leftB, "3>0": leftB, "0>3": leftA,
};

const iA: Point[] = [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]];
const iB: Point[] = [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]];
const iC: Point[] = [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]];
const iD: Point[] = [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]];
const iKicks: Record<string, Point[]> = {
  "0>1": iA, "1>0": iB, "1>2": iC, "2>1": iD,
  "2>3": iB, "3>2": iA, "3>0": iD, "0>3": iC,
};

export function kickTests(kind: Kind, from: number, to: number): readonly Point[] {
  if (kind === "O") return [[0, 0]];
  return (kind === "I" ? iKicks : standardKicks)[`${from}>${to}`];
}

export class SevenBag {
  private bag: Kind[] = [];

  constructor(private readonly random: () => number = Math.random) {}

  take(): Kind {
    if (this.bag.length === 0) {
      this.bag = [...TYPES];
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
      }
    }
    return this.bag.pop()!;
  }
}
