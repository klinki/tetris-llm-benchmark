import {
  COLS,
  LINE_SCORES,
  LOCK_DELAY,
  MAX_LOCK_RESETS,
  NEXT_COUNT,
  TSPIN_SCORES,
  TOTAL_ROWS,
  fallIntervalForLevel,
} from "./constants.js";
import { Board } from "./board.js";
import {
  cellsFor,
  kicksFor,
  shuffledBag,
  spawnX,
  spawnY,
  type ActivePiece,
  type PieceKind,
} from "./tetromino.js";

export class Game {
  board = new Board();
  bag: PieceKind[] = [];
  nextQueue: PieceKind[] = [];
  current: ActivePiece | null = null;
  hold: PieceKind | null = null;
  canHold = true;

  score = 0;
  level = 1;
  lines = 0;
  combo = -1;
  backToBack = false;
  gameOver = false;

  softDrop = false;
  fallTimer = 0;
  lockTimer = 0;
  lockResets = 0;
  lastActionRotate = false;

  constructor() {
    this.reset();
  }

  reset(): void {
    this.board.reset();
    this.bag = [];
    this.nextQueue = [];
    this.hold = null;
    this.canHold = true;
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.combo = -1;
    this.backToBack = false;
    this.gameOver = false;
    this.softDrop = false;
    this.fallTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lastActionRotate = false;
    this.refillQueue();
    this.spawn();
  }

  private refillQueue(): void {
    while (this.nextQueue.length < NEXT_COUNT + 1) {
      if (this.bag.length === 0) this.bag = shuffledBag();
      const kind = this.bag.pop();
      if (kind) this.nextQueue.push(kind);
    }
  }

  /** For tests: force the upcoming sequence. */
  setNextQueue(kinds: PieceKind[]): void {
    this.nextQueue = [...kinds];
  }

  spawn(): void {
    this.refillQueue();
    const kind = this.nextQueue.shift();
    this.refillQueue();
    if (!kind) {
      this.current = null;
      return;
    }
    const piece: ActivePiece = { kind, rotation: 0, x: spawnX(kind), y: spawnY() };
    // Top-out: blocked spawn ends the game.
    if (this.board.collides(piece.kind, piece.rotation, piece.x, piece.y)) {
      this.current = piece;
      this.gameOver = true;
      return;
    }
    this.current = piece;
    this.fallTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lastActionRotate = false;
  }

  get fallInterval(): number {
    const base = fallIntervalForLevel(this.level);
    if (this.softDrop) return Math.min(base / 20, 0.02);
    return base;
  }

  isOnGround(): boolean {
    if (!this.current) return false;
    const p = this.current;
    return this.board.collides(p.kind, p.rotation, p.x, p.y + 1);
  }

  private resetLockOnAction(): void {
    if (!this.isOnGround()) {
      this.lockTimer = 0;
      return;
    }
    if (this.lockResets < MAX_LOCK_RESETS) {
      this.lockTimer = 0;
      this.lockResets++;
    }
  }

  tryMove(dx: number, dy: number): boolean {
    if (this.gameOver || !this.current) return false;
    const p = this.current;
    if (this.board.collides(p.kind, p.rotation, p.x + dx, p.y + dy)) return false;
    p.x += dx;
    p.y += dy;
    if (dx !== 0) {
      this.lastActionRotate = false;
      this.resetLockOnAction();
    }
    return true;
  }

  /** dir: +1 clockwise, -1 counter-clockwise. */
  tryRotate(dir: 1 | -1): boolean {
    if (this.gameOver || !this.current) return false;
    const p = this.current;
    const from = p.rotation;
    const to = (((from + dir) % 4) + 4) % 4;
    for (const [kx, ky] of kicksFor(p.kind, from, to)) {
      if (!this.board.collides(p.kind, to, p.x + kx, p.y + ky)) {
        p.rotation = to;
        p.x += kx;
        p.y += ky;
        this.lastActionRotate = true;
        this.resetLockOnAction();
        return true;
      }
    }
    return false;
  }

  holdPiece(): boolean {
    if (this.gameOver || !this.current || !this.canHold) return false;
    const cur = this.current.kind;
    if (this.hold === null) {
      this.hold = cur;
      this.canHold = false;
      this.spawn();
    } else {
      const swapped = this.hold;
      this.hold = cur;
      this.canHold = false;
      const piece: ActivePiece = { kind: swapped, rotation: 0, x: spawnX(swapped), y: spawnY() };
      if (this.board.collides(piece.kind, piece.rotation, piece.x, piece.y)) {
        this.current = piece;
        this.gameOver = true;
        return true;
      }
      this.current = piece;
      this.fallTimer = 0;
      this.lockTimer = 0;
      this.lockResets = 0;
      this.lastActionRotate = false;
    }
    return true;
  }

  ghostY(): number {
    if (!this.current) return 0;
    const p = this.current;
    let y = p.y;
    while (!this.board.collides(p.kind, p.rotation, p.x, y + 1)) y++;
    return y;
  }

  hardDrop(): void {
    if (this.gameOver || !this.current) return;
    const p = this.current;
    let dist = 0;
    while (!this.board.collides(p.kind, p.rotation, p.x, p.y + 1)) {
      p.y++;
      dist++;
    }
    this.score += dist * 2;
    this.lastActionRotate = false;
    this.lockCurrent();
  }

  update(dt: number): void {
    if (this.gameOver || !this.current) return;
    if (dt <= 0) return;
    dt = Math.min(dt, 0.1);

    // Soft drop points: award while falling faster.
    const wasSoft = this.softDrop;

    this.fallTimer += dt;
    let interval = this.fallInterval;
    while (this.fallTimer >= interval) {
      this.fallTimer -= interval;
      const p = this.current;
      if (!p) break;
      if (!this.board.collides(p.kind, p.rotation, p.x, p.y + 1)) {
        p.y++;
        this.lockTimer = 0;
        if (wasSoft) this.score += 1;
        this.lastActionRotate = false;
      } else {
        break;
      }
      interval = this.fallInterval;
    }

    if (this.isOnGround()) {
      this.lockTimer += dt;
      if (this.lockTimer >= LOCK_DELAY) {
        this.lockCurrent();
      }
    } else {
      this.lockTimer = 0;
    }
  }

  /** True when the current T piece sits in a T-spin slot (3-corner rule). */
  isTspin(): boolean {
    const p = this.current;
    if (!p || p.kind !== "T" || !this.lastActionRotate) return false;
    // Pivot = center of the 3x3 box.
    const px = p.x + 1;
    const py = p.y + 1;
    const corners: Array<[number, number]> = [
      [px - 1, py - 1],
      [px + 1, py - 1],
      [px - 1, py + 1],
      [px + 1, py + 1],
    ];
    let filled = 0;
    for (const [x, y] of corners) {
      if (x < 0 || x >= COLS || y >= TOTAL_ROWS) filled++;
      else if (y >= 0 && this.board.grid[y][x] !== null) filled++;
    }
    return filled >= 3;
  }

  private lockCurrent(): void {
    const p = this.current;
    if (!p) return;
    const tspin = this.isTspin();
    this.board.lock(p.kind, p.rotation, p.x, p.y);
    const cleared = this.board.clearLines();
    this.applyScore(cleared, tspin);
    this.canHold = true;
    this.fallTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lastActionRotate = false;
    if (this.gameOver) return;
    this.spawn();
  }

  private applyScore(cleared: number, tspin: boolean): void {
    const difficult = cleared === 4 || (tspin && cleared > 0);
    if (cleared > 0) {
      let base: number;
      if (tspin) {
        base = TSPIN_SCORES[Math.min(cleared, 3)] ?? 0;
      } else {
        base = LINE_SCORES[cleared] ?? cleared * 200;
      }
      if (difficult && this.backToBack) base = Math.floor(base * 1.5);
      this.score += base * this.level;
      this.backToBack = difficult ? true : tspin ? this.backToBack : false;
      if (!tspin && !difficult) this.backToBack = false;

      this.combo += 1;
      if (this.combo > 0) this.score += 50 * this.combo * this.level;

      this.lines += cleared;
      this.level = Math.floor(this.lines / 10) + 1;
    } else {
      this.combo = -1;
      if (tspin) this.score += TSPIN_SCORES[0] * this.level;
    }
  }

  /** Board cells of the active piece in absolute coords. */
  currentCells(): Array<{ x: number; y: number }> {
    if (!this.current) return [];
    const p = this.current;
    return cellsFor(p.kind, p.rotation).map((c) => ({ x: p.x + c.x, y: p.y + c.y }));
  }

  ghostCells(): Array<{ x: number; y: number }> {
    if (!this.current) return [];
    const p = this.current;
    const gy = this.ghostY();
    return cellsFor(p.kind, p.rotation).map((c) => ({ x: p.x + c.x, y: gy + c.y }));
  }
}
