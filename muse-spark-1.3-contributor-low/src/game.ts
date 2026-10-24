import { Grid, clearLines, collides, emptyGrid, merge } from "./board.js";
import {
  COLS,
  LINE_SCORES,
  LOCK_DELAY_MS,
  MAX_LOCK_RESETS,
  ROWS,
  SOFT_DROP_FACTOR,
  TSPIN_SCORES,
  secondsPerRow,
} from "./constants.js";
import { PieceKind, Rotation, cellsFor, kicksFor, spawnPosition } from "./pieces.js";
import { Bag } from "./randomizer.js";

export interface ActivePiece {
  kind: PieceKind;
  rotation: Rotation;
  x: number;
  y: number;
}

export type GameStatus = "playing" | "over";

export class Game {
  grid: Grid = emptyGrid();
  bag = new Bag();
  current: ActivePiece;
  holdKind: PieceKind | null = null;
  canHold = true;
  nextQueue: PieceKind[] = [];
  score = 0;
  lines = 0;
  level = 1;
  combo = -1;
  status: GameStatus = "playing";
  softDrop = false;

  /** Last successful rotation used a kick (for T-spin detection); reset on spawn/move. */
  private lastKickIndex = -1;
  private lastActionWasRotate = false;
  /** Time bookkeeping (ms). */
  private fallAccum = 0;
  private lockTimer = 0;
  private lockResets = 0;
  private onGround = false;

  constructor() {
    for (let i = 0; i < 6; i++) this.nextQueue.push(this.bag.next());
    this.current = this.spawnFrom(this.nextQueue.shift()!);
  }

  /** For tests: inject a deterministic queue. */
  setQueue(kinds: PieceKind[]): void {
    this.nextQueue = [...kinds];
  }

  private spawnFrom(kind: PieceKind): ActivePiece {
    const p = spawnPosition(kind);
    return { kind, rotation: 0, x: p.x, y: p.y };
  }

  private refillQueue(): void {
    while (this.nextQueue.length < 6) this.nextQueue.push(this.bag.next());
  }

  spawnNext(): void {
    this.refillQueue();
    const kind = this.nextQueue.shift()!;
    this.refillQueue();
    this.current = this.spawnFrom(kind);
    this.fallAccum = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lastActionWasRotate = false;
    this.lastKickIndex = -1;
    this.canHold = this.canHold; // unchanged; reset on lock
    this.onGround = this.isTouchingGround();
    // Block out: spawned piece collides -> game over.
    if (collides(this.grid, cellsFor(this.current.kind, 0), this.current.x, this.current.y)) {
      this.status = "over";
    }
  }

  cells(): { x: number; y: number }[] {
    const { kind, rotation, x, y } = this.current;
    return cellsFor(kind, rotation).map((c) => ({ x: x + c.x, y: y + c.y }));
  }

  ghostY(): number {
    let y = this.current.y;
    const cells = cellsFor(this.current.kind, this.current.rotation);
    while (!collides(this.grid, cells, this.current.x, y + 1)) y++;
    return y;
  }

  isTouchingGround(): boolean {
    const cells = cellsFor(this.current.kind, this.current.rotation);
    return collides(this.grid, cells, this.current.x, this.current.y + 1);
  }

  tryMove(dx: number, dy: number): boolean {
    if (this.status !== "playing") return false;
    const cells = cellsFor(this.current.kind, this.current.rotation);
    if (collides(this.grid, cells, this.current.x + dx, this.current.y + dy)) return false;
    this.current.x += dx;
    this.current.y += dy;
    if (dx !== 0) {
      this.lastActionWasRotate = false;
      this.onGroundMoveReset();
    }
    if (dy > 0 && this.softDrop) this.score += dy; // soft drop: 1 pt per cell
    this.onGround = this.isTouchingGround();
    if (!this.onGround) this.lockTimer = 0;
    return true;
  }

  tryRotate(dir: 1 | -1): boolean {
    if (this.status !== "playing") return false;
    const from = this.current.rotation;
    const to = ((from + (dir === 1 ? 1 : 3)) % 4) as Rotation;
    const cells = cellsFor(this.current.kind, to);
    const kicks = kicksFor(this.current.kind, from, to);
    for (let i = 0; i < kicks.length; i++) {
      const k = kicks[i];
      if (!collides(this.grid, cells, this.current.x + k.x, this.current.y + k.y)) {
        this.current.rotation = to;
        this.current.x += k.x;
        this.current.y += k.y;
        this.lastActionWasRotate = true;
        this.lastKickIndex = i;
        this.onGroundMoveReset();
        this.onGround = this.isTouchingGround();
        if (!this.onGround) this.lockTimer = 0;
        return true;
      }
    }
    return false;
  }

  private onGroundMoveReset(): void {
    if (this.onGround && this.lockResets < MAX_LOCK_RESETS) {
      this.lockTimer = 0;
      this.lockResets++;
    }
  }

  hold(): boolean {
    if (this.status !== "playing" || !this.canHold) return false;
    const cur = this.current.kind;
    if (this.holdKind === null) {
      this.holdKind = cur;
      this.spawnNextKeepHoldLock();
    } else {
      const tmp = this.holdKind;
      this.holdKind = cur;
      this.current = this.spawnFrom(tmp);
      this.fallAccum = 0;
      this.lockTimer = 0;
      this.lockResets = 0;
      this.lastActionWasRotate = false;
      if (collides(this.grid, cellsFor(this.current.kind, 0), this.current.x, this.current.y)) {
        this.status = "over";
      }
    }
    this.canHold = false;
    return true;
  }

  private spawnNextKeepHoldLock(): void {
    this.refillQueue();
    const kind = this.nextQueue.shift()!;
    this.refillQueue();
    this.current = this.spawnFrom(kind);
    this.fallAccum = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lastActionWasRotate = false;
    if (collides(this.grid, cellsFor(this.current.kind, 0), this.current.x, this.current.y)) {
      this.status = "over";
    }
  }

  hardDrop(): void {
    if (this.status !== "playing") return;
    const gy = this.ghostY();
    const dist = gy - this.current.y;
    this.current.y = gy;
    this.score += dist * 2;
    this.lockPiece();
  }

  /** Advance the simulation by dt milliseconds. */
  update(dtMs: number): void {
    if (this.status !== "playing") return;
    const perRow = secondsPerRow(this.level) * 1000;
    const interval = this.softDrop ? Math.min(perRow / SOFT_DROP_FACTOR, 25) : perRow;
    this.fallAccum += dtMs;
    // Gravity steps
    let guard = 0;
    while (this.fallAccum >= interval && guard++ < ROWS + 4) {
      this.fallAccum -= interval;
      if (!this.tryMove(0, 1)) break;
      if (this.softDrop) {
        // tryMove already added soft-drop points; fallAccum keeps dropping fast
      }
    }
    // Lock delay
    this.onGround = this.isTouchingGround();
    if (this.onGround) {
      this.lockTimer += dtMs;
      if (this.lockTimer >= LOCK_DELAY_MS) this.lockPiece();
    } else {
      this.lockTimer = 0;
    }
  }

  private isTSpin(): boolean {
    if (this.current.kind !== "T" || !this.lastActionWasRotate) return false;
    // 3-corner rule: count occupied corners around the T center.
    // Center of 3x3 box:
    const cx = this.current.x + 1;
    const cy = this.current.y + 1;
    const corners = [
      { x: cx - 1, y: cy - 1 },
      { x: cx + 1, y: cy - 1 },
      { x: cx - 1, y: cy + 1 },
      { x: cx + 1, y: cy + 1 },
    ];
    let filled = 0;
    for (const c of corners) {
      if (c.x < 0 || c.x >= COLS || c.y >= ROWS) filled++;
      else if (c.y >= 0 && this.grid[c.y][c.x] !== null) filled++;
    }
    return filled >= 3;
  }

  private lockPiece(): void {
    const piece = this.current;
    const cells = cellsFor(piece.kind, piece.rotation);
    merge(this.grid, piece.kind, cells, piece.x, piece.y);
    const tspin = this.isTSpin();
    const cleared = clearLines(this.grid);

    // Lock out: all locked cells above the visible field -> game over.
    const allAbove = cells.every((c) => piece.y + c.y < 2);
    if (allAbove && cleared === 0) {
      this.status = "over";
    }

    if (cleared > 0) {
      this.combo++;
      const comboBonus = this.combo > 0 ? 50 * this.combo * this.level : 0;
      if (tspin) {
        const idx = Math.min(cleared, 3);
        this.score += TSPIN_SCORES[idx] * this.level + comboBonus;
      } else {
        this.score += LINE_SCORES[Math.min(cleared, 4)] * this.level + comboBonus;
      }
      this.lines += cleared;
      this.level = Math.floor(this.lines / 10) + 1;
    } else {
      this.combo = -1;
      if (tspin) this.score += TSPIN_SCORES[0] * this.level;
    }

    this.canHold = true;
    this.fallAccum = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    if (this.status === "playing") this.spawnNext();
  }

  restart(): void {
    this.grid = emptyGrid();
    this.bag = new Bag();
    this.nextQueue = [];
    for (let i = 0; i < 6; i++) this.nextQueue.push(this.bag.next());
    this.holdKind = null;
    this.canHold = true;
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.combo = -1;
    this.status = "playing";
    this.softDrop = false;
    this.current = this.spawnFrom(this.nextQueue.shift()!);
    this.fallAccum = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lastActionWasRotate = false;
  }
}
