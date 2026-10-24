export type PieceKind = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

export const ALL_KINDS: PieceKind[] = ["I", "O", "T", "S", "Z", "J", "L"];

export const COLORS: Record<PieceKind, string> = {
  I: "#00e5ee",
  O: "#f5d020",
  T: "#a855f7",
  S: "#22c55e",
  Z: "#ef4444",
  J: "#3b82f6",
  L: "#f97316",
};

export interface ActivePiece {
  kind: PieceKind;
  rotation: number; // 0 = spawn, 1 = R, 2 = 180, 3 = L
  x: number; // board x of bounding-box top-left
  y: number; // board y of bounding-box top-left (0 = top hidden row)
}

// Spawn matrices. 1 = filled. J/L/S/T/Z use 3x3, I uses 4x4, O uses 2x2.
const SPAWN: Record<PieceKind, number[][]> = {
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
};

export function boxSize(kind: PieceKind): number {
  if (kind === "I") return 4;
  if (kind === "O") return 2;
  return 3;
}

function rotateCW(m: number[][]): number[][] {
  const n = m.length;
  const out: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      out[r][c] = m[n - 1 - c][r];
    }
  }
  return out;
}

/** Cells of a piece as (dx, dy) offsets from the bounding-box top-left. */
export function cellsFor(kind: PieceKind, rotation: number): Array<{ x: number; y: number }> {
  let m = SPAWN[kind];
  const rot = ((rotation % 4) + 4) % 4;
  for (let i = 0; i < rot; i++) m = rotateCW(m);
  const cells: Array<{ x: number; y: number }> = [];
  for (let r = 0; r < m.length; r++) {
    for (let c = 0; c < m[r].length; c++) {
      if (m[r][c]) cells.push({ x: c, y: r });
    }
  }
  return cells;
}

export function spawnX(kind: PieceKind): number {
  // Center the bounding box: 3-wide at col 3, 4-wide at col 3, 2-wide at col 4.
  if (kind === "O") return 4;
  return 3;
}

export function spawnY(): number {
  return 0;
}

type Kick = [number, number];

// Kicks in screen coords: +x right, +y down (converted from Guideline +y up).
const JLSTZ_KICKS: Record<string, Kick[]> = {
  "0-1": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "1-0": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "1-2": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "2-1": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "2-3": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "3-2": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "3-0": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "0-3": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
};

const I_KICKS: Record<string, Kick[]> = {
  "0-1": [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  "1-0": [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  "1-2": [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
  "2-1": [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  "2-3": [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  "3-2": [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  "3-0": [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  "0-3": [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
};

export function kicksFor(kind: PieceKind, from: number, to: number): Kick[] {
  if (kind === "O") return [[0, 0]];
  const key = `${from}-${to}`;
  if (kind === "I") return I_KICKS[key] ?? [[0, 0]];
  return JLSTZ_KICKS[key] ?? [[0, 0]];
}

/** Fisher-Yates shuffled 7-bag containing each kind exactly once. */
export function shuffledBag(): PieceKind[] {
  const bag = [...ALL_KINDS];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}
