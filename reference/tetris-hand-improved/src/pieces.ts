/** Tetromino data: shapes, colors, and Super Rotation System kick tables. */
export const KINDS = ["I", "J", "L", "O", "S", "T", "Z"] as const;
export type Kind = (typeof KINDS)[number];
export type Rotation = 0 | 1 | 2 | 3;
/** Board coordinates: x grows rightward, y grows downward. */
export type Point = readonly [x: number, y: number];

export const COLORS: Readonly<Record<Kind, string>> = {
  I: "#5fd3dc",
  J: "#6f8ff0",
  L: "#f0a65a",
  O: "#ecd35f",
  S: "#79d68a",
  T: "#b68cf0",
  Z: "#ec6f78",
};

/** Spawn orientation inside the 3×3 box (4×4 for I and O), as in the Guideline. */
const SPAWN: Readonly<Record<Kind, readonly Point[]>> = {
  I: [[0, 1], [1, 1], [2, 1], [3, 1]],
  J: [[0, 0], [0, 1], [1, 1], [2, 1]],
  L: [[2, 0], [0, 1], [1, 1], [2, 1]],
  O: [[1, 0], [2, 0], [1, 1], [2, 1]],
  S: [[1, 0], [2, 0], [0, 1], [1, 1]],
  T: [[1, 0], [0, 1], [1, 1], [2, 1]],
  Z: [[0, 0], [1, 0], [1, 1], [2, 1]],
};

/** Rotates clockwise about the box centre; O is symmetric and never changes. */
function rotations(kind: Kind): readonly (readonly Point[])[] {
  const edge = kind === "I" ? 3 : 2;
  const states = [SPAWN[kind]];
  for (let r = 1; r < 4; r++) {
    const previous = states[r - 1]!;
    states.push(kind === "O" ? previous : previous.map(([x, y]) => [edge - y, x] as const));
  }
  return states;
}

const SHAPES = Object.fromEntries(KINDS.map((kind) => [kind, rotations(kind)])) as Record<
  Kind,
  readonly (readonly Point[])[]
>;

export function shape(kind: Kind, rotation: Rotation = 0): readonly Point[] {
  return SHAPES[kind][rotation]!;
}

/**
 * SRS kick offsets in the wiki's notation (x right, y UP), tried in order.
 * Key is `${from}>${to}`. https://tetris.wiki/Super_Rotation_System
 */
type KickTable = Readonly<Record<string, readonly Point[]>>;
const JLSTZ_KICKS: KickTable = {
  "0>1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "1>0": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "1>2": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "2>1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "2>3": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "3>2": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "3>0": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "0>3": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
};
const I_KICKS: KickTable = {
  "0>1": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  "1>0": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  "1>2": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  "2>1": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  "2>3": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  "3>2": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  "3>0": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  "0>3": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
};

/** Kick candidates converted to board coordinates (y down). O has no kicks. */
export function kicks(kind: Kind, from: Rotation, to: Rotation): readonly Point[] {
  if (kind === "O") return [[0, 0]];
  const table = kind === "I" ? I_KICKS : JLSTZ_KICKS;
  return table[`${from}>${to}`]!.map(([x, y]) => [x, -y] as const);
}

/** Seeded 7-bag randomizer: every run of seven pieces contains each tetromino once. */
export class SevenBag {
  private bag: Kind[] = [];
  constructor(private readonly random: () => number = Math.random) {}
  next(): Kind {
    if (this.bag.length === 0) {
      this.bag = [...KINDS];
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j]!, this.bag[i]!];
      }
    }
    return this.bag.pop()!;
  }
}
