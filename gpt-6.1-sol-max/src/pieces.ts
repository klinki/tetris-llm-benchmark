export const PIECE_TYPES = ["I", "J", "L", "O", "S", "T", "Z"] as const;
export type PieceType = (typeof PIECE_TYPES)[number];
export type Rotation = 0 | 1 | 2 | 3;
export type Cell = readonly [x: number, y: number];

export interface Piece {
  type: PieceType;
  rotation: Rotation;
  x: number;
  y: number;
}

export const COLORS: Record<PieceType, string> = {
  I: "#67d5e8",
  J: "#658af5",
  L: "#f2a663",
  O: "#efd16d",
  S: "#89c99a",
  T: "#b89beb",
  Z: "#ed8793",
};

const SPAWN_CELLS: Record<PieceType, readonly Cell[]> = {
  I: [[0, 1], [1, 1], [2, 1], [3, 1]],
  J: [[0, 0], [0, 1], [1, 1], [2, 1]],
  L: [[2, 0], [0, 1], [1, 1], [2, 1]],
  O: [[1, 0], [2, 0], [1, 1], [2, 1]],
  S: [[1, 0], [2, 0], [0, 1], [1, 1]],
  T: [[1, 0], [0, 1], [1, 1], [2, 1]],
  Z: [[0, 0], [1, 0], [1, 1], [2, 1]],
};

// Rotate around (1, 1) for JLSTZ and (1.5, 1.5) for I. O stays put.
function rotationsFor(type: PieceType): readonly (readonly Cell[])[] {
  const states: (readonly Cell[])[] = [SPAWN_CELLS[type]];
  for (let rotation = 1; rotation < 4; rotation++) {
    const previous = states[rotation - 1]!;
    states.push(type === "O" ? previous : previous.map(([x, y]) => [
      (type === "I" ? 3 : 2) - y, x,
    ] as const));
  }
  return states;
}

const SHAPES: Record<PieceType, readonly (readonly Cell[])[]> = {
  I: rotationsFor("I"), J: rotationsFor("J"), L: rotationsFor("L"),
  O: rotationsFor("O"), S: rotationsFor("S"), T: rotationsFor("T"), Z: rotationsFor("Z"),
};

export function cellsFor(type: PieceType, rotation: Rotation = 0): readonly Cell[] {
  return SHAPES[type][rotation]!;
}

export function occupiedCells(piece: Piece): Cell[] {
  return cellsFor(piece.type, piece.rotation).map(([x, y]) => [x + piece.x, y + piece.y]);
}

// SRS tables use positive Y upwards; the engine converts to screen coordinates.
const JLSTZ_KICKS: Record<string, readonly Cell[]> = {
  "0>1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "1>0": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "1>2": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "2>1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "2>3": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "3>2": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "3>0": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "0>3": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
};

const I_KICKS: Record<string, readonly Cell[]> = {
  "0>1": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  "1>0": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  "1>2": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  "2>1": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  "2>3": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  "3>2": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  "3>0": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  "0>3": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
};

export function kicksFor(type: PieceType, from: Rotation, to: Rotation): readonly Cell[] {
  if (type === "O") return [[0, 0]];
  return (type === "I" ? I_KICKS : JLSTZ_KICKS)[`${from}>${to}`]!;
}

export class SevenBag {
  private bag: PieceType[] = [];

  constructor(private readonly random: () => number = Math.random) {}

  reset(): void {
    this.bag = [];
  }

  next(): PieceType {
    if (this.bag.length === 0) {
      this.bag = [...PIECE_TYPES];
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j]!, this.bag[i]!];
      }
    }
    return this.bag.pop()!;
  }
}
