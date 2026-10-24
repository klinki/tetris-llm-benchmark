import {
  COLS,
  HIDDEN_ROWS,
  LINE_SCORES,
  LOCK_DELAY_MS,
  MAX_LOCK_RESETS,
  TOTAL_ROWS,
  gravityIntervalSec,
  type PieceType,
} from './constants.js';
import { Board } from './board.js';
import { getCells, getKicks, spawnX, type Rotation } from './pieces.js';
import { Bag } from './randomizer.js';

export interface ActivePiece {
  type: PieceType;
  rotation: Rotation;
  x: number;
  y: number;
}

export class Game {
  board = new Board();
  bag = new Bag();
  current: ActivePiece | null = null;
  held: PieceType | null = null;
  canHold = true;
  next: PieceType[] = [];
  score = 0;
  lines = 0;
  level = 1;
  combo = -1;
  gameOver = false;
  softDrop = false;

  private fallAccMs = 0;
  private lockMs = 0;
  private lockResets = 0;

  constructor(rand?: () => number) {
    if (rand) this.bag = new Bag(rand);
    for (let i = 0; i < 7; i++) this.next.push(this.bag.next());
    this.spawn();
  }

  get queuePreview(): PieceType[] {
    return this.next.slice(0, 5);
  }

  private takeNext(): PieceType {
    const t = this.next.shift()!;
    this.next.push(this.bag.next());
    return t;
  }

  spawn(): void {
    if (this.gameOver) return;
    const type = this.takeNext();
    const piece: ActivePiece = { type, rotation: 0, x: spawnX(type), y: 0 };
    this.current = piece;
    this.fallAccMs = 0;
    this.lockMs = 0;
    this.lockResets = 0;
    // Block-out: spawn collides -> top out.
    if (this.board.collides(type, 0, piece.x, piece.y)) {
      this.gameOver = true;
      this.current = null;
    }
  }

  onGround(): boolean {
    if (!this.current) return false;
    const c = this.current;
    return this.board.collides(c.type, c.rotation, c.x, c.y + 1);
  }

  ghostY(): number {
    if (!this.current) return 0;
    const c = this.current;
    let y = c.y;
    while (!this.board.collides(c.type, c.rotation, c.x, y + 1)) y++;
    return y;
  }

  move(dx: number, dy: number): boolean {
    if (!this.current || this.gameOver) return false;
    const c = this.current;
    if (this.board.collides(c.type, c.rotation, c.x + dx, c.y + dy)) return false;
    c.x += dx;
    c.y += dy;
    if (dy > 0 && this.softDrop) this.score += 1;
    if (dx !== 0) this.resetLockDelay();
    return true;
  }

  rotate(dir: 1 | -1): boolean {
    if (!this.current || this.gameOver) return false;
    const c = this.current;
    const from = c.rotation;
    const to = ((from + dir + 4) % 4) as Rotation;
    for (const [kx, ky] of getKicks(c.type, from, to)) {
      if (!this.board.collides(c.type, to, c.x + kx, c.y + ky)) {
        c.rotation = to;
        c.x += kx;
        c.y += ky;
        this.resetLockDelay();
        return true;
      }
    }
    return false;
  }

  hold(): boolean {
    if (!this.current || this.gameOver || !this.canHold) return false;
    const cur = this.current.type;
    if (this.held === null) {
      this.held = cur;
      this.spawn();
    } else {
      const tmp = this.held;
      this.held = cur;
      this.current = { type: tmp, rotation: 0, x: spawnX(tmp), y: 0 };
      this.fallAccMs = 0;
      this.lockMs = 0;
      this.lockResets = 0;
      if (this.board.collides(tmp, 0, this.current.x, this.current.y)) {
        this.gameOver = true;
        this.current = null;
      }
    }
    this.canHold = false;
    return true;
  }

  hardDrop(): void {
    if (!this.current || this.gameOver) return;
    const c = this.current;
    let dist = 0;
    while (!this.board.collides(c.type, c.rotation, c.x, c.y + 1)) {
      c.y++;
      dist++;
    }
    this.score += dist * 2;
    this.lockPiece();
  }

  private resetLockDelay(): void {
    if (!this.onGround()) return;
    if (this.lockResets >= MAX_LOCK_RESETS) return;
    this.lockMs = 0;
    this.lockResets++;
  }

  private lockPiece(): void {
    if (!this.current) return;
    const c = this.current;
    this.board.lock(c.type, c.rotation, c.x, c.y);
    this.canHold = true;
    const cleared = this.board.clearLines();
    if (cleared > 0) {
      const base = LINE_SCORES[cleared] ?? 0;
      this.score += base * this.level;
      // Guideline-style combo bonus.
      this.combo++;
      if (this.combo > 0) this.score += 50 * this.combo * this.level;
      this.lines += cleared;
      this.level = Math.floor(this.lines / 10) + 1;
    } else {
      this.combo = -1;
    }
    // Lock-out is covered by block-out on next spawn.
    this.spawn();
  }

  /** Advance simulation by dt milliseconds. */
  tick(dtMs: number): void {
    if (this.gameOver || !this.current) return;
    const intervalMs =
      (this.softDrop ? Math.min(gravityIntervalSec(this.level) * 1000, 1000 / 20) : gravityIntervalSec(this.level) * 1000);
    if (this.onGround()) {
      this.lockMs += dtMs;
      // Soft drop still scores while grounded-moving down is blocked; ignore.
      if (this.lockMs >= LOCK_DELAY_MS) this.lockPiece();
      return;
    }
    this.lockMs = 0;
    this.fallAccMs += dtMs;
    while (this.fallAccMs >= intervalMs) {
      this.fallAccMs -= intervalMs;
      const c = this.current!;
      if (!this.board.collides(c.type, c.rotation, c.x, c.y + 1)) {
        c.y++;
        if (this.softDrop) this.score += 1;
      } else {
        break;
      }
    }
  }

  restart(): void {
    this.board = new Board();
    this.bag = new Bag();
    this.current = null;
    this.held = null;
    this.canHold = true;
    this.next = [];
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.combo = -1;
    this.gameOver = false;
    this.softDrop = false;
    this.fallAccMs = 0;
    this.lockMs = 0;
    this.lockResets = 0;
    for (let i = 0; i < 7; i++) this.next.push(this.bag.next());
    this.spawn();
  }

  /** Visible rows for rendering (drops hidden buffer). */
  visibleGrid(): (PieceType | null)[][] {
    return this.board.grid.slice(HIDDEN_ROWS);
  }

  currentCellsAbsolute(): Array<[number, number]> {
    if (!this.current) return [];
    const c = this.current;
    return getCells(c.type, c.rotation).map(([cx, cy]) => [c.x + cx, c.y + cy - HIDDEN_ROWS]);
  }

  ghostCellsAbsolute(): Array<[number, number]> {
    if (!this.current) return [];
    const c = this.current;
    const gy = this.ghostY();
    return getCells(c.type, c.rotation).map(([cx, cy]) => [c.x + cx, gy + cy - HIDDEN_ROWS]);
  }
}

export { COLS, TOTAL_ROWS };
