import { createBag, PIECE_NAMES, type PieceName } from "./pieces.js";
import {
  emptyBoard, spawn, fits, move, rotate, hardDrop, lock, clearLines,
  lineScore, gravityMs, ghostY, newGame as newGameState, COLS, ROWS, TOTAL_ROWS,
  type Board, type PieceState, type GameState,
} from "./board.js";

export { COLS, ROWS, TOTAL_ROWS };

export function initGame(rng: () => number): GameState {
  const g = newGameState(rng) as any;
  g.bag = createBag(rng);
  // fill next queue
  for (let i = 0; i < 5; i++) g.next.push(g.bag.next());
  spawnNext(g);
  return g;
}

export function spawnNext(game: GameState): void {
  const g = game as any;
  if (g.next.length < 5) {
    while (g.next.length < 5) g.next.push(g.bag.next());
  }
  const name = g.next.shift();
  g.next.push(g.bag.next());
  g.current = spawn(name);
  g.canHold = true;
  if (!fits(g.board, g.current)) {
    g.isOver = true;
  }
  g.lockTimer = null;
  g.lockResets = 0;
}

export function holdPiece(game: GameState): void {
  const g = game as any;
  if (!g.canHold || !g.current || g.isOver) return;
  const curName = g.current.piece;
  if (g.hold === null) {
    g.hold = curName;
    spawnNext(g);
  } else {
    const h = g.hold;
    g.hold = curName;
    g.current = spawn(h);
    if (!fits(g.board, g.current)) g.isOver = true;
  }
  g.canHold = false;
  g.lockTimer = null;
  g.lockResets = 0;
}

export function tryMove(game: GameState, dx: number, dy: number): boolean {
  const g = game as any;
  if (!g.current || g.isOver) return false;
  const n = move(g.board, g.current, dx, dy);
  if (n) { g.current = n; resetLockDelay(g, true); return true; }
  return false;
}

export function tryRotate(game: GameState, dir: number): boolean {
  const g = game as any;
  if (!g.current || g.isOver) return false;
  const n = rotate(g.board, g.current, dir);
  if (n) { g.current = n; resetLockDelay(g, true); return true; }
  return false;
}

export function softDrop(game: GameState): number {
  const g = game as any;
  if (!g.current || g.isOver) return 0;
  const n = move(g.board, g.current, 0, 1);
  if (n) { g.current = n; return 1; } // 1 point? guideline soft drop 1 per cell
  return 0;
}

export function hardDropPiece(game: GameState): void {
  const g = game as any;
  if (!g.current || g.isOver) return;
  const dropped = hardDrop(g.board, g.current);
  const distance = dropped.y - g.current.y;
  g.score += distance * 2;
  g.current = dropped;
  lockPiece(game);
}

export function lockPiece(game: GameState): void {
  const g = game as any;
  if (!g.current || g.isOver) return;
  lock(g.board, g.current);
  const cleared = clearLines(g.board);
  if (cleared > 0) {
    g.score += lineScore(cleared, g.level);
    g.lines += cleared;
    g.level = Math.floor(g.lines / 10);
  }
  spawnNext(g);
}

const MAX_LOCK_RESETS = 15;
export function resetLockDelay(game: GameState, moved: boolean): void {
  const g = game as any;
  if (g.lockTimer === null) return;
  if (moved && g.lockResets < MAX_LOCK_RESETS) {
    g.lockTimer = Date.now();
    g.lockResets++;
  }
}

export function isOnGround(game: GameState): boolean {
  const g = game as any;
  if (!g.current) return false;
  return move(g.board, g.current, 0, 1) === null;
}

export function getGhostY(game: GameState): number {
  const g = game as any;
  if (!g.current) return 0;
  return ghostY(g.board, g.current);
}

export function updateLockDelay(game: GameState, now: number, lockDelayMs: number): void {
  const g = game as any;
  if (!g.current || g.isOver) return;
  if (!isOnGround(g)) { g.lockTimer = null; return; }
  if (g.lockTimer === null) g.lockTimer = now;
  if (now - g.lockTimer >= lockDelayMs) {
    lockPiece(g);
  }
}

export function tickGravity(game: GameState, now: number, lastDrop: { t: number }): void {
  const g = game as any;
  if (!g.current || g.isOver) return;
  if (isOnGround(g)) return;
  const ms = gravityMs(g.level);
  if (now - lastDrop.t >= ms) {
    // drop one
    const n = move(g.board, g.current, 0, 1);
    if (n) g.current = n;
    lastDrop.t = now;
  }
}