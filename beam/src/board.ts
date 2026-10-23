import { SHAPES, SPAWN_COL, getKicks, PIECE_NAMES, type PieceName } from "./pieces.js";

export const COLS = 10;
export const ROWS = 20;
export const TOTAL_ROWS = ROWS + 2;

export type Board = number[][];

export interface PieceState {
  piece: PieceName;
  rot: number;
  x: number;
  y: number;
}

export function emptyBoard(): Board {
  return Array.from({ length: TOTAL_ROWS }, () => new Array(COLS).fill(0));
}

export function spawn(pieceName: PieceName): PieceState {
  return { piece: pieceName, rot: 0, x: SPAWN_COL[pieceName], y: 0 };
}

export function fits(board: Board, state: PieceState): boolean {
  const shape = SHAPES[state.piece][state.rot];
  for (let dy = 0; dy < shape.length; dy++) {
    for (let dx = 0; dx < shape[dy].length; dx++) {
      if (shape[dy][dx] === 0) continue;
      const x = state.x + dx;
      const y = state.y + dy;
      if (x < 0 || x >= COLS) return false;
      if (y < 0) return false;
      if (y >= TOTAL_ROWS) return false;
      if (board[y][x] !== 0) return false;
    }
  }
  return true;
}

export function move(board: Board, state: PieceState, dx: number, dy: number): PieceState | null {
  const next = { ...state, x: state.x + dx, y: state.y + dy };
  return fits(board, next) ? next : null;
}

export function rotate(board: Board, state: PieceState, dir: number): PieceState | null {
  const fromRot = state.rot;
  const toRot = (state.rot + dir + 4) % 4;
  const kicks = getKicks(state.piece, fromRot, toRot);
  for (const [kx, ky] of kicks) {
    const next = { ...state, rot: toRot, x: state.x + kx, y: state.y + ky };
    if (fits(board, next)) return next;
  }
  return null;
}

export function hardDrop(board: Board, state: PieceState): PieceState {
  let cur = state;
  while (true) {
    const next = move(board, cur, 0, 1);
    if (next === null) return cur;
    cur = next;
  }
}

export function lock(board: Board, state: PieceState): void {
  const shape = SHAPES[state.piece][state.rot];
  for (let dy = 0; dy < shape.length; dy++) {
    for (let dx = 0; dx < shape[dy].length; dx++) {
      if (shape[dy][dx] === 0) continue;
      board[state.y + dy][state.x + dx] = shape[dy][dx];
    }
  }
}

export function clearLines(board: Board): number {
  let cleared = 0;
  for (let y = TOTAL_ROWS - 1; y >= 0; y--) {
    if (board[y].every((c) => c !== 0)) {
      board.splice(y, 1);
      board.unshift(new Array(COLS).fill(0));
      cleared++;
      y++;
    }
  }
  return cleared;
}

export function lineScore(lines: number, level: number): number {
  const base = ({ 0: 0, 1: 40, 2: 100, 3: 300, 4: 1200 } as Record<number, number>)[lines] ?? 0;
  return base * (level + 1);
}

export function gravityMs(level: number): number {
  const table = [
    800, 720, 630, 550, 470, 380, 300, 220, 130, 100,
    80, 80, 80, 70, 70, 70, 50, 50, 50, 30,
  ];
  if (level >= table.length) return 30;
  return table[level];
}

// Ghost piece: landing y for current piece
export function ghostY(board: Board, state: PieceState): number {
  let y = state.y;
  while (true) {
    const next = { ...state, y: y + 1 };
    if (fits(board, next)) y++;
    else break;
  }
  return y;
}

export interface GameState {
  board: Board;
  rng: () => number;
  bag: ReturnType<typeof import("./pieces.js").createBag> | null;
  current: PieceState | null;
  next: PieceName[];
  hold: PieceName | null;
  canHold: boolean;
  score: number;
  lines: number;
  level: number;
  isOver: boolean;
  // lock delay
  lockTimer: number | null;
  lockResets: number;
}

export function newGame(rng: () => number) {
  const bag = (null as any);
  return {
    board: emptyBoard(),
    rng,
    bag: null as any,
    current: null as PieceState | null,
    next: [] as PieceName[],
    hold: null as PieceName | null,
    canHold: true,
    score: 0,
    lines: 0,
    level: 0,
    isOver: false,
    lockTimer: null as number | null,
    lockResets: 0,
  };
}

// Helper to fill next queue
export function ensureNext(game: any, count = 5) {
  if (!game.bag) {
    // attach bag lazily
    // import at runtime
  }
}