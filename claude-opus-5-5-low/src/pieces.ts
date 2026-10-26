// Tetromino definitions and Super Rotation System (SRS) data.

export type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";
export const PIECE_TYPES: readonly PieceType[] = ["I", "O", "T", "S", "Z", "J", "L"];

/** Guideline colors. */
export const COLORS: Record<PieceType, string> = {
  I: "#00f0f0",
  O: "#f0f000",
  T: "#a000f0",
  S: "#00f000",
  Z: "#f00000",
  J: "#0000f0",
  L: "#f0a000",
};

/** Spawn-orientation shapes in their SRS bounding boxes (row-major, y down). */
const SPAWN_SHAPES: Record<PieceType, string[]> = {
  I: ["....", "####", "....", "...."],
  O: ["##", "##"],
  T: [".#.", "###", "..."],
  S: [".##", "##.", "..."],
  Z: ["##.", ".##", "..."],
  J: ["#..", "###", "..."],
  L: ["..#", "###", "..."],
};

export type Cell = readonly [x: number, y: number];

function rotateCW(cells: Cell[], size: number): Cell[] {
  return cells.map(([x, y]) => [size - 1 - y, x] as const);
}

/** SHAPES[type][rotation] = occupied cells relative to the bounding box. */
export const SHAPES: Record<PieceType, Cell[][]> = {} as Record<PieceType, Cell[][]>;
for (const type of PIECE_TYPES) {
  const rows = SPAWN_SHAPES[type];
  let cells: Cell[] = [];
  rows.forEach((row, y) => [...row].forEach((c, x) => c === "#" && cells.push([x, y])));
  const states = [cells];
  for (let r = 1; r < 4; r++) states.push((cells = rotateCW(cells, rows.length)));
  SHAPES[type] = states;
}

// Wall kick offsets from the Guideline (x right, y up), keyed "from>to".
const KICKS_JLSTZ: Record<string, Cell[]> = {
  "0>1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "1>0": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "1>2": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "2>1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "2>3": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "3>2": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "3>0": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "0>3": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
};
const KICKS_I: Record<string, Cell[]> = {
  "0>1": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  "1>0": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  "1>2": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  "2>1": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  "2>3": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  "3>2": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  "3>0": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  "0>3": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
};

/** Kick tests converted to board coordinates (y down). */
export function kicks(type: PieceType, from: number, to: number): Cell[] {
  if (type === "O") return [[0, 0]];
  const table = type === "I" ? KICKS_I : KICKS_JLSTZ;
  return table[`${from}>${to}`].map(([x, y]) => [x, -y] as const);
}

/** 7-bag randomizer. */
export class Bag {
  private bag: PieceType[] = [];
  constructor(private random: () => number = Math.random) {}

  next(): PieceType {
    if (this.bag.length === 0) {
      const b = [...PIECE_TYPES];
      for (let i = b.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [b[i], b[j]] = [b[j], b[i]];
      }
      this.bag = b;
    }
    return this.bag.pop()!;
  }
}
