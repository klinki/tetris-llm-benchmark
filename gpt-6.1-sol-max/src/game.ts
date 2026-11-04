import { occupiedCells, kicksFor, SevenBag } from "./pieces.js";
import type { Cell, Piece, PieceType, Rotation } from "./pieces.js";
import { scoreClear } from "./scoring.js";
import type { ClearResult, Spin } from "./scoring.js";

export const WIDTH = 10;
export const HEIGHT = 20;
export const HIDDEN_ROWS = 20;
export const PREVIEW_COUNT = 5;
export const LOCK_DELAY = 500;
export const MAX_LOCK_RESETS = 15;
export type Board = (PieceType | null)[][];
export type GameStatus = "ready" | "playing" | "paused" | "over";

export type GameEvent =
  | { type: "lock"; cells: Cell[] }
  | { type: "clear"; rows: number[]; result: ClearResult }
  | { type: "level"; level: number }
  | { type: "over" };

export function emptyBoard(): Board {
  return Array.from({ length: HEIGHT + HIDDEN_ROWS }, () => Array<PieceType | null>(WIDTH).fill(null));
}

export function gravityInterval(level: number): number {
  const cappedLevel = Math.min(Math.max(1, level), 30);
  // Tetris Worlds' marathon curve, capped at 20 cells per 60 Hz frame (20G).
  return Math.max(1000 / 1200, 1000 * (0.8 - (cappedLevel - 1) * 0.007) ** (cappedLevel - 1));
}

/** Browser-independent game state. Coordinates -20..-1 form the hidden buffer. */
export class Game {
  board: Board = emptyBoard();
  active: Piece | null = null;
  queue: PieceType[] = [];
  held: PieceType | null = null;
  canHold = true;
  status: GameStatus = "ready";
  score = 0;
  lines = 0;
  level = 1;
  combo = -1;
  backToBack = false;
  pieces = 0;
  elapsed = 0;
  revision = 0;
  lastClear: ClearResult | null = null;

  private readonly bag: SevenBag;
  private events: GameEvent[] = [];
  private gravityElapsed = 0;
  private lockElapsed = 0;
  private lockResets = 0;
  private hasLanded = false;
  private lastRotation: { kick: number } | null = null;

  constructor(random: () => number = Math.random) {
    this.bag = new SevenBag(random);
    this.refillQueue();
  }

  start(): void {
    this.board = emptyBoard();
    this.queue = [];
    this.bag.reset();
    this.held = null;
    this.canHold = true;
    this.status = "playing";
    this.score = this.lines = this.pieces = this.elapsed = 0;
    this.level = 1;
    this.combo = -1;
    this.backToBack = false;
    this.lastClear = null;
    this.events = [];
    this.refillQueue();
    this.spawnNext();
    this.revision++;
  }

  togglePause(): void {
    if (this.status === "playing") this.status = "paused";
    else if (this.status === "paused") this.status = "playing";
    else return;
    this.revision++;
  }

  cellAt(x: number, y: number): PieceType | null {
    return this.board[y + HIDDEN_ROWS]?.[x] ?? null;
  }

  collides(piece: Piece): boolean {
    return occupiedCells(piece).some(([x, y]) => this.blocked(x, y));
  }

  get grounded(): boolean {
    return this.active !== null && this.collides({ ...this.active, y: this.active.y + 1 });
  }

  get ghostY(): number | null {
    if (!this.active) return null;
    let y = this.active.y;
    while (!this.collides({ ...this.active, y: y + 1 })) y++;
    return y;
  }

  move(direction: -1 | 1): boolean {
    if (this.status !== "playing" || !this.active) return false;
    const candidate = { ...this.active, x: this.active.x + direction };
    if (this.collides(candidate)) return false;
    this.active = candidate;
    this.lastRotation = null;
    this.resetLockAfterAction();
    this.revision++;
    return true;
  }

  rotate(direction: -1 | 1): boolean {
    if (this.status !== "playing" || !this.active) return false;
    const from = this.active.rotation;
    const to = ((from + direction + 4) % 4) as Rotation;
    const kicks = kicksFor(this.active.type, from, to);
    for (let index = 0; index < kicks.length; index++) {
      const [dx, dy] = kicks[index]!;
      const candidate = { ...this.active, rotation: to, x: this.active.x + dx, y: this.active.y - dy };
      if (!this.collides(candidate)) {
        this.active = candidate;
        this.lastRotation = { kick: index };
        this.resetLockAfterAction();
        this.revision++;
        return true;
      }
    }
    return false;
  }

  softDrop(): boolean {
    if (this.status !== "playing") return false;
    this.gravityElapsed = 0;
    return this.descend(true);
  }

  hardDrop(): number {
    if (this.status !== "playing" || !this.active) return 0;
    const distance = this.ghostY! - this.active.y;
    this.active.y += distance;
    this.score += distance * 2;
    if (distance > 0) this.lastRotation = null;
    this.lockPiece();
    return distance;
  }

  hold(): boolean {
    if (this.status !== "playing" || !this.active || !this.canHold) return false;
    const outgoing = this.active.type;
    if (this.held) this.spawn(this.held);
    else this.spawnNext();
    this.held = outgoing;
    this.canHold = false;
    this.revision++;
    return true;
  }

  update(delta: number, softDropping = false): void {
    if (this.status !== "playing" || !this.active || !Number.isFinite(delta) || delta <= 0) return;
    // Advance to gravity/lock events so a landing never gets a whole frame of extra lock time.
    let remaining = Math.min(delta, 60_000);
    this.elapsed += remaining;
    const normalInterval = gravityInterval(this.level);
    const interval = softDropping ? normalInterval / 20 : normalInterval;
    while (remaining > 0 && this.status === "playing") {
      const grounded = this.grounded;
      if (grounded) this.hasLanded = true;
      // A grounded piece only needs the lock clock, even at very high gravity.
      const untilGravity = grounded ? Infinity : Math.max(0, interval - this.gravityElapsed);
      const untilLock = grounded ? Math.max(0, LOCK_DELAY - this.lockElapsed) : Infinity;
      const step = Math.min(remaining, untilGravity, untilLock);
      this.gravityElapsed = grounded ? (this.gravityElapsed + step) % interval : this.gravityElapsed + step;
      if (grounded || (this.hasLanded && this.lockResets >= MAX_LOCK_RESETS)) this.lockElapsed += step;
      remaining -= step;

      if (grounded && this.lockElapsed >= LOCK_DELAY) {
        this.lockPiece();
        // Start the next piece on the next update; long frames cannot drop a whole stack.
        return;
      }
      if (this.gravityElapsed >= interval) {
        this.gravityElapsed = Math.max(0, this.gravityElapsed - interval);
        this.descend(softDropping);
      }
    }
  }

  drainEvents(): GameEvent[] {
    const events = this.events;
    this.events = [];
    return events;
  }

  private blocked(x: number, y: number): boolean {
    return x < 0 || x >= WIDTH || y < -HIDDEN_ROWS || y >= HEIGHT || this.cellAt(x, y) !== null;
  }

  private refillQueue(): void {
    while (this.queue.length < PREVIEW_COUNT) this.queue.push(this.bag.next());
  }

  private spawnNext(): void {
    this.spawn(this.queue.shift()!);
    this.refillQueue();
  }

  private spawn(type: PieceType): void {
    this.active = { type, rotation: 0, x: 3, y: -2 };
    this.gravityElapsed = this.lockElapsed = this.lockResets = 0;
    this.hasLanded = false;
    this.lastRotation = null;
    if (this.collides(this.active)) {
      this.endGame();
      return;
    }
    // Guideline spawn is in rows 21/22, followed by an immediate step into view.
    if (!this.collides({ ...this.active, y: -1 })) this.active.y++;
    this.hasLanded = this.grounded;
    this.revision++;
  }

  private descend(manual: boolean): boolean {
    if (!this.active || this.grounded) return false;
    this.active.y++;
    if (manual) this.score++;
    this.lastRotation = null;
    if (this.lockResets < MAX_LOCK_RESETS) this.lockElapsed = 0;
    if (this.grounded) this.hasLanded = true;
    this.revision++;
    return true;
  }

  private resetLockAfterAction(): void {
    if (this.hasLanded && this.lockResets < MAX_LOCK_RESETS) {
      this.lockElapsed = 0;
      this.lockResets++;
    }
    if (this.grounded) this.hasLanded = true;
  }

  private detectSpin(): Spin {
    if (this.active?.type !== "T" || !this.lastRotation) return "none";
    const { x, y, rotation } = this.active;
    const corners = [
      this.blocked(x, y), this.blocked(x + 2, y),
      this.blocked(x, y + 2), this.blocked(x + 2, y + 2),
    ];
    if (corners.filter(Boolean).length < 3) return "none";
    const frontCorners = [[0, 1], [1, 3], [2, 3], [0, 2]][rotation]!;
    return frontCorners.every((index) => corners[index]) || this.lastRotation.kick === 4
      ? "full" : "mini";
  }

  private lockPiece(): void {
    if (!this.active) return;
    const cells = occupiedCells(this.active);
    const spin = this.detectSpin();
    for (const [x, y] of cells) this.board[y + HIDDEN_ROWS]![x] = this.active.type;
    this.pieces++;
    this.events.push({ type: "lock", cells });

    const rows: number[] = [];
    this.board.forEach((row, index) => {
      if (row.every((cell) => cell !== null)) rows.push(index - HIDDEN_ROWS);
    });
    if (rows.length > 0) {
      const remaining = this.board.filter((row) => row.some((cell) => cell === null));
      while (remaining.length < HEIGHT + HIDDEN_ROWS) remaining.unshift(Array<PieceType | null>(WIDTH).fill(null));
      this.board = remaining;
    }
    const result = scoreClear({
      lines: rows.length, spin, level: this.level, combo: this.combo, backToBack: this.backToBack,
      perfectClear: rows.length > 0 && this.board.every((row) => row.every((cell) => cell === null)),
    });
    this.lastClear = result;
    this.score += result.points;
    this.combo = result.combo;
    this.backToBack = result.backToBack;
    this.lines += rows.length;
    if (rows.length || spin !== "none") this.events.push({ type: "clear", rows, result });
    const nextLevel = Math.floor(this.lines / 10) + 1;
    if (nextLevel !== this.level) {
      this.level = nextLevel;
      this.events.push({ type: "level", level: this.level });
    }
    this.canHold = true;
    this.revision++;
    if (cells.every(([, y]) => y < 0)) this.endGame();
    else this.spawnNext();
  }

  private endGame(): void {
    this.status = "over";
    this.active = null;
    this.events.push({ type: "over" });
    this.revision++;
  }
}
