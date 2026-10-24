// Core Tetris Guideline logic. No DOM dependencies so it can run headless in tests.

export type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";
export type Rotation = 0 | 1 | 2 | 3;

export const COLS = 10;
export const ROWS = 22; // 20 visible + 2 hidden on top
export const HIDDEN_ROWS = 2;
export const LOCK_DELAY_MS = 500;
export const MAX_LOCK_RESETS = 15;
export const NEXT_COUNT = 5;

export type BoardGrid = (PieceType | 0)[][];

export interface ActivePiece {
  type: PieceType;
  rotation: Rotation;
  x: number; // top-left of bounding box
  y: number;
}

type Vec = [number, number];

const BASE_CELLS: Record<PieceType, Vec[]> = {
  I: [[0, 1], [1, 1], [2, 1], [3, 1]],
  O: [[0, 0], [1, 0], [0, 1], [1, 1]],
  T: [[1, 0], [0, 1], [1, 1], [2, 1]],
  S: [[1, 0], [2, 0], [0, 1], [1, 1]],
  Z: [[0, 0], [1, 0], [1, 1], [2, 1]],
  J: [[0, 0], [0, 1], [1, 1], [2, 1]],
  L: [[2, 0], [0, 1], [1, 1], [2, 1]],
};

const BOX_SIZE: Record<PieceType, number> = {
  I: 4,
  O: 2,
  T: 3,
  S: 3,
  Z: 3,
  J: 3,
  L: 3,
};

function rotateCW([x, y]: Vec, size: number): Vec {
  return [size - 1 - y, x];
}

export function getCells(type: PieceType, rotation: Rotation): Vec[] {
  const size = BOX_SIZE[type];
  let cells = BASE_CELLS[type].map((c) => [...c] as Vec);
  for (let i = 0; i < rotation; i++) {
    cells = cells.map((c) => rotateCW(c, size));
  }
  return cells;
}

// SRS wall kicks, screen coords (x right, y down).
// Source: Tetris Guideline; y negated from wiki (which uses y-up).
type KickTable = Record<string, Vec[]>;

const JLSTZ_KICKS: KickTable = {
  "0-1": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "1-0": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "1-2": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "2-1": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "2-3": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "3-2": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "3-0": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "0-3": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
};

const I_KICKS: KickTable = {
  "0-1": [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  "1-0": [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  "1-2": [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
  "2-1": [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  "2-3": [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  "3-2": [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  "3-0": [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  "0-3": [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
};

function kicksFor(type: PieceType, from: Rotation, to: Rotation): Vec[] {
  if (type === "O") return [[0, 0]];
  const key = `${from}-${to}`;
  if (type === "I") return I_KICKS[key] ?? [[0, 0]];
  return JLSTZ_KICKS[key] ?? [[0, 0]];
}

export function spawnPosition(type: PieceType): { x: number; y: number } {
  if (type === "O") return { x: 4, y: 0 };
  if (type === "I") return { x: 3, y: 0 };
  return { x: 3, y: 0 };
}

/** Gravity interval in ms for a 1G-style guideline curve. */
export function gravityIntervalMs(level: number): number {
  const l = Math.max(1, level);
  const t = Math.pow(0.8 - (l - 1) * 0.007, l - 1);
  return Math.max(16, t * 1000);
}

export interface LockResult {
  cleared: number;
  tspin: boolean;
  gained: number;
}

export class TetrisGame {
  board: BoardGrid;
  active: ActivePiece | null = null;
  nextQueue: PieceType[] = [];
  holdType: PieceType | null = null;
  canHold = true;
  score = 0;
  lines = 0;
  level = 1;
  combo = -1;
  b2b = false;
  gameOver = false;
  softDropping = false;

  fallTimer = 0;
  lockTimer = 0;
  lockResets = 0;
  lastActionWasRotate = false;

  private rng: () => number;
  private bag: PieceType[] = [];

  constructor(rng: () => number = Math.random) {
    this.rng = rng;
    this.board = this.emptyBoard();
    this.reset();
  }

  reset(): void {
    this.board = this.emptyBoard();
    this.nextQueue = [];
    this.bag = [];
    this.holdType = null;
    this.canHold = true;
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.combo = -1;
    this.b2b = false;
    this.gameOver = false;
    this.fallTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lastActionWasRotate = false;
    this.softDropping = false;
    this.refillQueue();
    this.spawn();
  }

  private emptyBoard(): BoardGrid {
    const b: BoardGrid = [];
    for (let y = 0; y < ROWS; y++) b.push(new Array(COLS).fill(0));
    return b;
  }

  private shuffledBag(): PieceType[] {
    const pieces: PieceType[] = ["I", "O", "T", "S", "Z", "J", "L"];
    for (let i = pieces.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
    }
    return pieces;
  }

  private refillQueue(): void {
    while (this.nextQueue.length < 14) {
      if (this.bag.length === 0) this.bag = this.shuffledBag();
      this.nextQueue.push(this.bag.pop() as PieceType);
    }
  }

  collides(type: PieceType, rotation: Rotation, px: number, py: number): boolean {
    for (const [cx, cy] of getCells(type, rotation)) {
      const x = px + cx;
      const y = py + cy;
      if (x < 0 || x >= COLS || y >= ROWS) return true;
      if (y < 0) continue;
      if (this.board[y][x] !== 0) return true;
    }
    return false;
  }

  onGround(): boolean {
    if (!this.active) return false;
    return this.collides(this.active.type, this.active.rotation, this.active.x, this.active.y + 1);
  }

  spawn(): boolean {
    if (this.gameOver) return false;
    this.refillQueue();
    const type = this.nextQueue.shift() as PieceType;
    this.refillQueue();
    const { x, y } = spawnPosition(type);
    this.active = { type, rotation: 0, x, y };
    this.fallTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lastActionWasRotate = false;
    if (this.collides(type, 0, x, y)) {
      // Blocked spawn => top out per Guideline.
      this.gameOver = true;
      return false;
    }
    return true;
  }

  activeCells(): Vec[] {
    if (!this.active) return [];
    return getCells(this.active.type, this.active.rotation).map(([cx, cy]) => [
      this.active!.x + cx,
      this.active!.y + cy,
    ]);
  }

  ghostY(): number {
    if (!this.active) return 0;
    let y = this.active.y;
    while (!this.collides(this.active.type, this.active.rotation, this.active.x, y + 1)) y++;
    return y;
  }

  ghostCells(): Vec[] {
    if (!this.active) return [];
    const gy = this.ghostY();
    return getCells(this.active.type, this.active.rotation).map(([cx, cy]) => [
      this.active!.x + cx,
      gy + cy,
    ]);
  }

  private resetLockIfGrounded(): void {
    if (this.onGround() && this.lockResets < MAX_LOCK_RESETS) {
      this.lockTimer = 0;
      this.lockResets++;
    }
  }

  move(dx: number, dy: number): boolean {
    if (this.gameOver || !this.active) return false;
    const { type, rotation, x, y } = this.active;
    if (!this.collides(type, rotation, x + dx, y + dy)) {
      this.active.x += dx;
      this.active.y += dy;
      if (dx !== 0) {
        this.lastActionWasRotate = false;
        this.resetLockIfGrounded();
      }
      if (dy > 0 && this.softDropping) {
        // soft drop points are handled in tick; direct calls count too
      }
      return true;
    }
    return false;
  }

  rotate(dir: 1 | -1): boolean {
    if (this.gameOver || !this.active) return false;
    const from = this.active.rotation;
    const to = ((from + dir + 4) % 4) as Rotation;
    for (const [kx, ky] of kicksFor(this.active.type, from, to)) {
      const nx = this.active.x + kx;
      const ny = this.active.y + ky;
      if (!this.collides(this.active.type, to, nx, ny)) {
        this.active.rotation = to;
        this.active.x = nx;
        this.active.y = ny;
        this.lastActionWasRotate = true;
        this.resetLockIfGrounded();
        return true;
      }
    }
    return false;
  }

  hold(): boolean {
    if (this.gameOver || !this.active || !this.canHold) return false;
    const cur = this.active.type;
    if (this.holdType === null) {
      this.holdType = cur;
      this.canHold = false;
      this.spawnHoldReplacement();
      return true;
    }
    const swapped = this.holdType;
    this.holdType = cur;
    const { x, y } = spawnPosition(swapped);
    this.active = { type: swapped, rotation: 0, x, y };
    this.fallTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lastActionWasRotate = false;
    this.canHold = false;
    if (this.collides(swapped, 0, x, y)) this.gameOver = true;
    return true;
  }

  private spawnHoldReplacement(): void {
    this.refillQueue();
    const type = this.nextQueue.shift() as PieceType;
    this.refillQueue();
    const { x, y } = spawnPosition(type);
    this.active = { type, rotation: 0, x, y };
    this.fallTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lastActionWasRotate = false;
    if (this.collides(type, 0, x, y)) this.gameOver = true;
  }

  hardDrop(): LockResult | null {
    if (this.gameOver || !this.active) return null;
    const gy = this.ghostY();
    const dist = gy - this.active.y;
    this.active.y = gy;
    this.score += dist * 2;
    return this.lockPiece();
  }

  /** Advance gravity + lock delay by dt milliseconds. */
  tick(dtMs: number): LockResult | null {
    if (this.gameOver || !this.active) return null;
    const dt = Math.max(0, Math.min(dtMs, 250));
    if (this.onGround()) {
      this.lockTimer += dt;
      if (this.lockTimer >= LOCK_DELAY_MS) {
        return this.lockPiece();
      }
    } else {
      this.lockTimer = 0;
    }

    let interval = gravityIntervalMs(this.level);
    if (this.softDropping) interval = Math.min(interval / 20, 50);
    this.fallTimer += dt;
    while (this.fallTimer >= interval) {
      this.fallTimer -= interval;
      if (!this.collides(this.active.type, this.active.rotation, this.active.x, this.active.y + 1)) {
        this.active.y += 1;
        if (this.softDropping) this.score += 1;
        if (this.onGround()) {
          // entering ground starts lock timer fresh
        }
      } else {
        break;
      }
    }
    return null;
  }

  private isTSpin(): boolean {
    if (!this.active || this.active.type !== "T" || !this.lastActionWasRotate) return false;
    const cells = getCells("T", this.active.rotation);
    // T center within 3x3 box is (x+1, y+1)
    const cx = this.active.x + 1;
    const cy = this.active.y + 1;
    const corners: Vec[] = [[cx - 1, cy - 1], [cx + 1, cy - 1], [cx - 1, cy + 1], [cx + 1, cy + 1]];
    let filled = 0;
    for (const [x, y] of corners) {
      if (x < 0 || x >= COLS || y >= ROWS || y < 0) {
        filled++;
        continue;
      }
      if (this.board[y][x] !== 0) filled++;
    }
    return filled >= 3;
  }

  private lockPiece(): LockResult {
    const tspin = this.isTSpin();
    // stamp cells
    if (this.active) {
      for (const [x, y] of this.activeCells()) {
        if (y >= 0 && y < ROWS && x >= 0 && x < COLS) this.board[y][x] = this.active.type;
      }
    }
    const clearedRows: number[] = [];
    for (let y = 0; y < ROWS; y++) {
      if (this.board[y].every((c) => c !== 0)) clearedRows.push(y);
    }
    for (const y of clearedRows) {
      this.board.splice(y, 1);
      this.board.unshift(new Array(COLS).fill(0));
    }
    const cleared = clearedRows.length;
    const gained = this.scoreLines(cleared, tspin);
    this.lines += cleared;
    this.level = Math.floor(this.lines / 10) + 1;
    this.canHold = true;
    this.active = null;
    this.fallTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lastActionWasRotate = false;
    this.spawn();
    return { cleared, tspin, gained };
  }

  private scoreLines(cleared: number, tspin: boolean): number {
    let gained = 0;
    const lvl = this.level;
    const difficult = tspin || cleared === 4;

    if (tspin) {
      if (cleared === 0) gained = 400 * lvl;
      else if (cleared === 1) gained = 800 * lvl;
      else if (cleared === 2) gained = 1200 * lvl;
      else gained = 1600 * lvl;
    } else {
      if (cleared === 1) gained = 100 * lvl;
      else if (cleared === 2) gained = 300 * lvl;
      else if (cleared === 3) gained = 500 * lvl;
      else if (cleared === 4) gained = 800 * lvl;
    }

    if (difficult && cleared > 0) {
      if (this.b2b) gained = Math.floor(gained * 1.5);
      this.b2b = true;
    } else if (cleared > 0) {
      this.b2b = false;
    }

    if (cleared > 0) {
      this.combo += 1;
      if (this.combo > 0) gained += 50 * this.combo * lvl;
    } else {
      this.combo = -1;
    }

    this.score += gained;
    return gained;
  }
}
