export const COLS = 10;
export const VISIBLE_ROWS = 20;
export const HIDDEN_ROWS = 2;
export const ROWS = VISIBLE_ROWS + HIDDEN_ROWS;
export const LOCK_DELAY_MS = 500;
export const MAX_LOCK_RESETS = 15;

export const PIECE_TYPES = ["I", "O", "T", "J", "L", "S", "Z"] as const;
export type PieceType = (typeof PIECE_TYPES)[number];
export type Cell = PieceType | null;
export type Board = Cell[][];

export interface Piece {
  type: PieceType;
  x: number;
  y: number;
  rotation: number;
}

export interface GameState {
  board: Board;
  active: Piece;
  queue: PieceType[];
  bag: PieceType[];
  hold: PieceType | null;
  holdUsed: boolean;
  score: number;
  lines: number;
  level: number;
  combo: number;
  backToBack: boolean;
  gameOver: boolean;
  gravityClock: number;
  lockClock: number;
  lockResets: number;
  lastAction: "move" | "rotate" | "drop";
  lastKick: number;
  notice: string;
  noticeClock: number;
  randomState: number;
}

type Offset = readonly [number, number];
export type SpinKind = "none" | "mini" | "full";

const SHAPES: Record<PieceType, readonly Offset[]> = {
  I: [[0, 1], [1, 1], [2, 1], [3, 1]],
  O: [[1, 0], [2, 0], [1, 1], [2, 1]],
  T: [[1, 0], [0, 1], [1, 1], [2, 1]],
  J: [[0, 0], [0, 1], [1, 1], [2, 1]],
  L: [[2, 0], [0, 1], [1, 1], [2, 1]],
  S: [[1, 0], [2, 0], [0, 1], [1, 1]],
  Z: [[0, 0], [1, 0], [1, 1], [2, 1]],
};

const JLSTZ_KICKS: Record<string, readonly Offset[]> = {
  "0>1": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "1>0": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "1>2": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "2>1": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "2>3": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "3>2": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "3>0": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "0>3": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
};

const I_KICKS: Record<string, readonly Offset[]> = {
  "0>1": [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  "1>0": [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  "1>2": [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
  "2>1": [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  "2>3": [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  "3>2": [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  "3>0": [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  "0>3": [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
};

export function createEmptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(null));
}

function randomNext(state: GameState): number {
  let value = state.randomState >>> 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  state.randomState = value >>> 0;
  return state.randomState / 0x1_0000_0000;
}

function refillQueue(state: GameState): void {
  while (state.queue.length < 7) {
    if (state.bag.length === 0) {
      state.bag = [...PIECE_TYPES];
      for (let i = state.bag.length - 1; i > 0; i -= 1) {
        const j = Math.floor(randomNext(state) * (i + 1));
        [state.bag[i], state.bag[j]] = [state.bag[j], state.bag[i]];
      }
    }
    state.queue.push(state.bag.pop()!);
  }
}

export function cellsFor(type: PieceType, rotation = 0): Offset[] {
  if (type === "O") return [...SHAPES.O];
  const boxSize = type === "I" ? 4 : 3;
  let cells = SHAPES[type].map(([x, y]) => [x, y] as Offset);
  for (let turn = 0; turn < ((rotation % 4) + 4) % 4; turn += 1) {
    cells = cells.map(([x, y]) => [boxSize - 1 - y, x] as Offset);
  }
  return cells;
}

function spawnPiece(type: PieceType): Piece {
  return { type, x: 3, y: 0, rotation: 0 };
}

export function createGame(seed = Date.now()): GameState {
  const normalizedSeed = (Math.floor(seed) >>> 0) || 0x6d2b79f5;
  const state: GameState = {
    board: createEmptyBoard(),
    active: { type: "T", x: 3, y: 0, rotation: 0 },
    queue: [],
    bag: [],
    hold: null,
    holdUsed: false,
    score: 0,
    lines: 0,
    level: 1,
    combo: -1,
    backToBack: false,
    gameOver: false,
    gravityClock: 0,
    lockClock: 0,
    lockResets: 0,
    lastAction: "move",
    lastKick: 0,
    notice: "",
    noticeClock: 0,
    randomState: normalizedSeed,
  };
  refillQueue(state);
  state.active = spawnPiece(takeNext(state));
  return state;
}

function takeNext(state: GameState): PieceType {
  refillQueue(state);
  return state.queue.shift()!;
}

export function canPlace(board: Board, piece: Piece): boolean {
  for (const [dx, dy] of cellsFor(piece.type, piece.rotation)) {
    const x = piece.x + dx;
    const y = piece.y + dy;
    if (x < 0 || x >= COLS || y >= ROWS) return false;
    if (y >= 0 && board[y][x] !== null) return false;
  }
  return true;
}

function resetLockAfterAction(state: GameState, wasGrounded: boolean): void {
  if (wasGrounded && state.lockResets < MAX_LOCK_RESETS) {
    state.lockClock = 0;
    state.lockResets += 1;
  }
}

export function moveHorizontal(state: GameState, direction: -1 | 1): boolean {
  if (state.gameOver) return false;
  const wasGrounded = !canPlace(state.board, { ...state.active, y: state.active.y + 1 });
  const moved = { ...state.active, x: state.active.x + direction };
  if (!canPlace(state.board, moved)) return false;
  state.active = moved;
  state.lastAction = "move";
  resetLockAfterAction(state, wasGrounded);
  return true;
}

export function rotate(state: GameState, direction: 1 | -1): boolean {
  if (state.gameOver || state.active.type === "O") return false;
  const wasGrounded = !canPlace(state.board, { ...state.active, y: state.active.y + 1 });
  const from = state.active.rotation;
  const to = (from + direction + 4) % 4;
  const key = `${from}>${to}`;
  const kicks = state.active.type === "I" ? I_KICKS[key] : JLSTZ_KICKS[key];
  if (!kicks) return false;
  for (let i = 0; i < kicks.length; i += 1) {
    const [dx, dy] = kicks[i];
    const candidate = { ...state.active, rotation: to, x: state.active.x + dx, y: state.active.y + dy };
    if (canPlace(state.board, candidate)) {
      state.active = candidate;
      state.lastAction = "rotate";
      state.lastKick = i;
      resetLockAfterAction(state, wasGrounded);
      return true;
    }
  }
  return false;
}

function gravityInterval(level: number): number {
  // Guideline gravity progression: one extra cell per second through level 9,
  // then an increasingly fast exponential curve.
  if (level <= 9) return 1000 / level;
  const cellsPerSecond = Math.min(120, 9 * Math.pow(1.32, level - 9));
  return Math.max(16, 1000 / cellsPerSecond);
}

function descend(state: GameState, soft = false): boolean {
  const candidate = { ...state.active, y: state.active.y + 1 };
  if (!canPlace(state.board, candidate)) return false;
  state.active = candidate;
  if (soft) state.score += 1;
  state.lockClock = 0;
  state.lastAction = soft ? "move" : state.lastAction;
  return true;
}

export function softDrop(state: GameState): boolean {
  if (state.gameOver) return false;
  return descend(state, true);
}

function spinAtLock(state: GameState): SpinKind {
  const piece = state.active;
  if (piece.type !== "T" || state.lastAction !== "rotate") return "none";
  const cx = piece.x + 1;
  const cy = piece.y + 1;
  const corners: Offset[] = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
  const occupied = corners.map(([dx, dy]) => {
    const x = cx + dx;
    const y = cy + dy;
    return x < 0 || x >= COLS || y >= ROWS || (y >= 0 && state.board[y][x] !== null);
  });
  if (occupied.filter(Boolean).length < 3) return "none";
  const frontByRotation: readonly number[][] = [[0, 1], [1, 3], [2, 3], [0, 2]];
  const [frontA, frontB] = frontByRotation[piece.rotation];
  if ((occupied[frontA] && occupied[frontB]) || state.lastKick === 4) return "full";
  return "mini";
}

function clearRows(board: Board): number {
  let cleared = 0;
  for (let y = ROWS - 1; y >= 0; y -= 1) {
    if (board[y].every((cell) => cell !== null)) {
      board.splice(y, 1);
      board.unshift(Array<Cell>(COLS).fill(null));
      cleared += 1;
      y += 1;
    }
  }
  return cleared;
}

function scoreForClear(lines: number, spin: SpinKind): number {
  if (spin === "full") return [400, 800, 1200, 1600][Math.min(lines, 3)];
  if (spin === "mini") return [100, 200, 400][Math.min(lines, 2)];
  return [0, 100, 300, 500, 800][Math.min(lines, 4)];
}

function lockPiece(state: GameState): void {
  const spin = spinAtLock(state);
  let toppedOut = false;
  for (const [dx, dy] of cellsFor(state.active.type, state.active.rotation)) {
    const x = state.active.x + dx;
    const y = state.active.y + dy;
    if (y < 0) {
      toppedOut = true;
    } else {
      state.board[y][x] = state.active.type;
    }
  }
  if (toppedOut) {
    state.gameOver = true;
    state.notice = "TOP OUT";
    state.noticeClock = 5000;
    return;
  }

  const cleared = clearRows(state.board);
  const scoringLevel = state.level;
  const base = scoreForClear(cleared, spin);
  const difficult = cleared > 0 && (cleared === 4 || spin !== "none");
  const getsBackToBack = difficult && state.backToBack;
  let earned = base * scoringLevel;
  if (getsBackToBack) earned += Math.floor(base * scoringLevel * 0.5);
  if (cleared > 0) {
    state.combo += 1;
    earned += 50 * state.combo * scoringLevel;
    state.lines += cleared;
    state.level = Math.floor(state.lines / 10) + 1;
    state.backToBack = difficult ? true : false;
  } else {
    state.combo = -1;
  }

  const perfect = cleared > 0 && state.board.every((row) => row.every((cell) => cell === null));
  if (perfect) earned += [0, 800, 1200, 1800, 2000][cleared] * scoringLevel;
  state.score += earned;

  if (perfect) state.notice = "PERFECT CLEAR!";
  else if (spin !== "none" && cleared > 0) state.notice = `${spin === "full" ? "T-SPIN" : "MINI T-SPIN"} ${["ZERO", "SINGLE", "DOUBLE", "TRIPLE"][cleared]}!`;
  else if (cleared === 4) state.notice = "TETRIS!";
  else if (cleared > 0) state.notice = ["", "SINGLE", "DOUBLE", "TRIPLE"][cleared];
  else if (spin !== "none") state.notice = spin === "full" ? "T-SPIN" : "MINI T-SPIN";
  else state.notice = "";
  state.noticeClock = state.notice ? 1500 : 0;

  state.active = spawnPiece(takeNext(state));
  state.holdUsed = false;
  state.gravityClock = 0;
  state.lockClock = 0;
  state.lockResets = 0;
  state.lastAction = "move";
  state.lastKick = 0;
  if (!canPlace(state.board, state.active)) {
    state.gameOver = true;
    state.notice = "BLOCKED SPAWN";
    state.noticeClock = 5000;
  }
}

export function hardDrop(state: GameState): number {
  if (state.gameOver) return 0;
  let distance = 0;
  while (canPlace(state.board, { ...state.active, y: state.active.y + 1 })) {
    state.active.y += 1;
    distance += 1;
  }
  state.score += distance * 2;
  if (state.lastAction !== "rotate") state.lastAction = "drop";
  lockPiece(state);
  return distance;
}

export function holdPiece(state: GameState): boolean {
  if (state.gameOver || state.holdUsed) return false;
  const outgoing = state.active.type;
  const incoming = state.hold;
  state.hold = outgoing;
  state.active = spawnPiece(incoming ?? takeNext(state));
  state.holdUsed = true;
  state.gravityClock = 0;
  state.lockClock = 0;
  state.lockResets = 0;
  state.lastAction = "move";
  state.lastKick = 0;
  if (!canPlace(state.board, state.active)) {
    state.gameOver = true;
    state.notice = "BLOCKED SPAWN";
    state.noticeClock = 5000;
  }
  return true;
}

export function updateGame(state: GameState, elapsedMs: number): void {
  if (state.noticeClock > 0) {
    state.noticeClock = Math.max(0, state.noticeClock - elapsedMs);
    if (state.noticeClock === 0 && !state.gameOver) state.notice = "";
  }
  if (state.gameOver) return;
  const delta = Math.min(Math.max(elapsedMs, 0), 100);
  state.gravityClock += delta;
  const interval = gravityInterval(state.level);
  while (state.gravityClock >= interval) {
    state.gravityClock -= interval;
    if (!descend(state)) {
      state.gravityClock = 0;
      break;
    }
  }
  if (!canPlace(state.board, { ...state.active, y: state.active.y + 1 })) {
    state.lockClock += delta;
    if (state.lockClock >= LOCK_DELAY_MS) lockPiece(state);
  } else {
    state.lockClock = 0;
  }
}

