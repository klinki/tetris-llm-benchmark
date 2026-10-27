// Tetromino definitions: shapes, colors and Super Rotation System (SRS)
// wall kick tables. See https://tetris.fandom.com/wiki/Tetris_Guideline

export type PieceKind = "I" | "J" | "L" | "O" | "S" | "T" | "Z";

export interface Cell {
  x: number;
  y: number;
}

export const KINDS: PieceKind[] = ["I", "J", "L", "O", "S", "T", "Z"];

// Guideline colors: each shape has a different color.
export const COLORS: Record<PieceKind, string> = {
  I: "#00f0f0",
  J: "#0000f0",
  L: "#f0a000",
  O: "#f0f000",
  S: "#00f000",
  T: "#a000f0",
  Z: "#f00000",
};

// Shapes in spawn orientation. '.' is empty, a letter is a filled cell.
// I rotates inside a 4x4 box, O inside 2x2, the rest inside 3x3 - as SRS requires.
const BASE_SHAPES: Record<PieceKind, string[]> = {
  I: ["....", "IIII", "....", "...."],
  J: ["J..", "JJJ", "..."],
  L: ["..L", "LLL", "..."],
  O: ["OO", "OO"],
  S: [".SS", "SS.", "..."],
  T: [".T.", "TTT", "..."],
  Z: ["ZZ.", ".ZZ", "..."],
};

// Guideline spawn columns: I and O spawn centered, the rest left of center.
export const SPAWN_X: Record<PieceKind, number> = { I: 3, J: 3, L: 3, O: 4, S: 3, T: 3, Z: 3 };
export const SPAWN_Y = 0; // top of the hidden buffer rows

// Clockwise rotation of a square shape matrix.
function rotateCw(rows: string[]): string[] {
  const n = rows.length;
  const out: string[] = [];
  for (let r = 0; r < n; r++) {
    let line = "";
    for (let c = 0; c < n; c++) line += rows[n - 1 - c][r];
    out.push(line);
  }
  return out;
}

function cellsOf(rows: string[]): Cell[] {
  const cells: Cell[] = [];
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      if (rows[y][x] !== ".") cells.push({ x, y });
    }
  }
  return cells;
}

function buildPieceCells(): Record<PieceKind, Cell[][]> {
  const out = {} as Record<PieceKind, Cell[][]>;
  for (const kind of KINDS) {
    let rows = BASE_SHAPES[kind];
    const states: Cell[][] = [];
    for (let rotation = 0; rotation < 4; rotation++) {
      states.push(cellsOf(rows));
      rows = rotateCw(rows);
    }
    out[kind] = states;
  }
  return out;
}

// PIECE_CELLS[kind][rotation] lists the filled cells of the piece's bounding
// box, with rotation 0 = spawn, 1 = clockwise (R), 2 = 180, 3 = counter-clockwise (L).
export const PIECE_CELLS: Record<PieceKind, Cell[][]> = buildPieceCells();

type Kick = readonly [number, number];

// SRS wall kick offsets as published on the Tetris wiki: (x, y) with +y up.
// The board uses +y down, so callers apply x + dx and y - dy.
// Indexed kicks[from][to]; only quarter-turn transitions are used.
const KICKS_JLSTZ: Kick[][][] = [
  // from spawn state
  [[], [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]], [], [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]]],
  // from R state
  [[[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]], [], [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]], []],
  // from 180 state
  [[], [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]], [], [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]]],
  // from L state
  [[[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]], [], [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]], []],
];

const KICKS_I: Kick[][][] = [
  // from spawn state
  [[], [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]], [], [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]]],
  // from R state
  [[[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]], [], [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]], []],
  // from 180 state
  [[], [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]], [], [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]]],
  // from L state
  [[[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]], [], [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]], []],
];

const NO_KICK: Kick[] = [[0, 0]];

export function getKicks(kind: PieceKind, from: number, to: number): readonly Kick[] {
  if (kind === "O") return NO_KICK; // O has identical states and never kicks
  return (kind === "I" ? KICKS_I : KICKS_JLSTZ)[from][to];
}
