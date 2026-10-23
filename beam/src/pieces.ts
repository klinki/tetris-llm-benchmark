// Tetromino definitions and SRS rotation system.

const T = 1, J = 2, L = 3, S = 4, Z = 5, I = 6, O = 7;

export const PIECE_IDS = { T, J, L, S, Z, I, O } as const;

export type PieceName = "T" | "J" | "L" | "S" | "Z" | "I" | "O";

export const PIECE_NAMES: PieceName[] = ["T", "J", "L", "S", "Z", "I", "O"];

export const SHAPES: Record<PieceName, number[][][]> = {
  T: [
    [[0, T, 0], [T, T, T], [0, 0, 0]],
    [[0, T, 0], [0, T, T], [0, T, 0]],
    [[0, 0, 0], [T, T, T], [0, T, 0]],
    [[0, T, 0], [T, T, 0], [0, T, 0]],
  ],
  J: [
    [[J, 0, 0], [J, J, J], [0, 0, 0]],
    [[0, J, J], [0, J, 0], [0, J, 0]],
    [[0, 0, 0], [J, J, J], [0, 0, J]],
    [[0, J, 0], [0, J, 0], [J, J, 0]],
  ],
  L: [
    [[0, 0, L], [L, L, L], [0, 0, 0]],
    [[0, L, 0], [0, L, 0], [0, L, L]],
    [[0, 0, 0], [L, L, L], [L, 0, 0]],
    [[L, L, 0], [0, L, 0], [0, L, 0]],
  ],
  S: [
    [[0, S, S], [S, S, 0], [0, 0, 0]],
    [[0, S, 0], [0, S, S], [0, 0, S]],
    [[0, 0, 0], [0, S, S], [S, S, 0]],
    [[S, 0, 0], [S, S, 0], [0, S, 0]],
  ],
  Z: [
    [[Z, Z, 0], [0, Z, Z], [0, 0, 0]],
    [[0, 0, Z], [0, Z, Z], [0, Z, 0]],
    [[0, 0, 0], [Z, Z, 0], [0, Z, Z]],
    [[0, Z, 0], [Z, Z, 0], [Z, 0, 0]],
  ],
  I: [
    [[0, 0, 0, 0], [I, I, I, I], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, 0, I, 0], [0, 0, I, 0], [0, 0, I, 0], [0, 0, I, 0]],
    [[0, 0, 0, 0], [0, 0, 0, 0], [I, I, I, I], [0, 0, 0, 0]],
    [[0, I, 0, 0], [0, I, 0, 0], [0, I, 0, 0], [0, I, 0, 0]],
  ],
  O: [
    [[0, O, O, 0], [0, O, O, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, O, O, 0], [0, O, O, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, O, O, 0], [0, O, O, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, O, O, 0], [0, O, O, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
  ],
};

export const SPAWN_COL: Record<PieceName, number> = {
  T: 3, J: 3, L: 3, S: 3, Z: 3, I: 3, O: 3,
};

const KICKS_JLSTZ: Record<string, number[][]> = {
  "0->1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "1->0": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "1->2": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "2->1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "2->3": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "3->2": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "3->0": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "0->3": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
};

const KICKS_I: Record<string, number[][]> = {
  "0->1": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  "1->0": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  "1->2": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  "2->1": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  "2->3": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  "3->2": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  "3->0": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  "0->3": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
};

export function getKicks(piece: string, fromRot: number, toRot: number): number[][] {
  if (piece === "O") return [[0, 0]];
  const key = `${fromRot}->${toRot}`;
  const table = piece === "I" ? KICKS_I : KICKS_JLSTZ;
  return (table[key] || [[0, 0]]).map(([dx, dy]) => [dx, -dy]);
}

export function createBag(rng: () => number) {
  let bag: string[] = [];
  function refill() {
    bag = [...PIECE_NAMES];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
  }
  return {
    next(): PieceName {
      if (bag.length === 0) refill();
      return bag.shift() as PieceName;
    },
  };
}

export function rotateCW(matrix: number[][]): number[][] {
  const n = matrix.length;
  const out = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      out[x][n - 1 - y] = matrix[y][x];
    }
  }
  return out;
}

// Colors for rendering
export const PIECE_COLORS: Record<PieceName, string> = {
  T: "#a000f0",
  J: "#0000f0",
  L: "#f0a000",
  S: "#00f000",
  Z: "#f00000",
  I: "#00f0f0",
  O: "#f0f000",
};