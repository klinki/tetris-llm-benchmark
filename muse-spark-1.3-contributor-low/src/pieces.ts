export type PieceKind = "I" | "O" | "T" | "S" | "Z" | "J" | "L";
export type Rotation = 0 | 1 | 2 | 3;

export interface Cell {
  x: number;
  y: number;
}

export const ALL_KINDS: PieceKind[] = ["I", "O", "T", "S", "Z", "J", "L"];

export const COLORS: Record<PieceKind, string> = {
  I: "#00e5ee", // cyan
  O: "#ffd400", // yellow
  T: "#b14aed", // purple
  S: "#2ecc40", // green
  Z: "#ff4136", // red
  J: "#3578e5", // blue
  L: "#ff8c00", // orange
};

/** Spawn-state cells inside the bounding box (box origin at 0,0). */
const SPAWN: Record<PieceKind, Cell[]> = {
  // 4x4 box, second row filled
  I: [
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
    { x: 3, y: 1 },
  ],
  // 3x3 box, top-right 2x2
  O: [
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
  ],
  T: [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
  ],
  S: [
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
  ],
  Z: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
  ],
  J: [
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
  ],
  L: [
    { x: 2, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
  ],
};

function boxSize(kind: PieceKind): number {
  if (kind === "I") return 4;
  return 3; // O uses a 3x3 box but never rotates
}

function rotateCWCells(cells: Cell[], size: number): Cell[] {
  return cells.map(({ x, y }) => ({ x: size - 1 - y, y: x }));
}

/** Precomputed rotation states, normalized so state 0 matches SPAWN exactly. */
const STATES: Record<PieceKind, Cell[][]> = (() => {
  const out = {} as Record<PieceKind, Cell[][]>;
  for (const kind of ALL_KINDS) {
    const size = boxSize(kind);
    const states: Cell[][] = [SPAWN[kind]];
    for (let r = 1; r < 4; r++) {
      if (kind === "O") {
        states.push(SPAWN[kind]);
      } else {
        states.push(rotateCWCells(states[r - 1], size));
      }
    }
    out[kind] = states;
  }
  return out;
})();

export function cellsFor(kind: PieceKind, rotation: Rotation): Cell[] {
  return STATES[kind][rotation];
}

/** Spawn box origin on a 10-wide board. */
export function spawnPosition(kind: PieceKind): Cell {
  return { x: 3, y: 0 };
}

// ---- SRS wall kicks (y-down; wiki uses y-up so signs are flipped) ----

type KickTable = Record<string, Cell[]>;

const JLSTZ_KICKS: KickTable = {
  "0>1": [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: -1 }, { x: 0, y: 2 }, { x: -1, y: 2 }],
  "1>0": [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: -2 }, { x: 1, y: -2 }],
  "1>2": [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: -2 }, { x: 1, y: -2 }],
  "2>1": [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: -1 }, { x: 0, y: 2 }, { x: -1, y: 2 }],
  "2>3": [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 2 }, { x: 0, y: -2 }, { x: 1, y: -2 }],
  "3>2": [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: -2 }, { x: 0, y: 2 }, { x: -1, y: 2 }],
  "3>0": [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: -2 }, { x: 0, y: 2 }, { x: -1, y: 2 }],
  "0>3": [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 2 }, { x: 0, y: -2 }, { x: 1, y: -2 }],
};

const I_KICKS: KickTable = {
  "0>1": [{ x: 0, y: 0 }, { x: -2, y: 0 }, { x: 1, y: 0 }, { x: -2, y: 1 }, { x: 1, y: -2 }],
  "1>0": [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: -1, y: 0 }, { x: 2, y: -1 }, { x: -1, y: 2 }],
  "1>2": [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: 2, y: 0 }, { x: -1, y: -2 }, { x: 2, y: 1 }],
  "2>1": [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: -2, y: 0 }, { x: 1, y: 2 }, { x: -2, y: -1 }],
  "2>3": [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: -1, y: 0 }, { x: 2, y: -1 }, { x: -1, y: 2 }],
  "3>2": [{ x: 0, y: 0 }, { x: -2, y: 0 }, { x: 1, y: 0 }, { x: -2, y: 1 }, { x: 1, y: -2 }],
  "3>0": [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: -2, y: 0 }, { x: 1, y: 2 }, { x: -2, y: -1 }],
  "0>3": [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: 2, y: 0 }, { x: -1, y: -2 }, { x: 2, y: 1 }],
};

export function kicksFor(kind: PieceKind, from: Rotation, to: Rotation): Cell[] {
  if (kind === "O") return [{ x: 0, y: 0 }];
  const key = `${from}>${to}`;
  if (kind === "I") return I_KICKS[key] ?? [{ x: 0, y: 0 }];
  return JLSTZ_KICKS[key] ?? [{ x: 0, y: 0 }];
}
