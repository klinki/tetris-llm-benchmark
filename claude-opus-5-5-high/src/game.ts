import { Bag, type Random } from "./bag.js";
import { Board, BOARD_HEIGHT, VISIBLE_TOP } from "./board.js";
import { getKicks, SHAPES, type Cell, type PieceType, type Rotation } from "./pieces.js";

export const NEXT_QUEUE_SIZE = 5;
export const LOCK_DELAY_MS = 500;
export const MAX_LOCK_RESETS = 15;
export const SOFT_DROP_FACTOR = 20;
export const LINES_PER_LEVEL = 10;
const MAX_GRAVITY_LEVEL = 20;

export interface ActivePiece {
  type: PieceType;
  x: number;
  y: number;
  rotation: Rotation;
}

export type TSpin = "none" | "mini" | "full";
export type GameStatus = "playing" | "paused" | "over";

export interface ClearEvent {
  lines: number;
  tSpin: TSpin;
  backToBack: boolean;
  combo: number;
  points: number;
  /** Game time (ms) at which the clear happened, for display timing. */
  time: number;
}

export interface GameOptions {
  random?: Random;
  startLevel?: number;
}

const LINE_POINTS = [0, 100, 300, 500, 800];
const TSPIN_POINTS = [400, 800, 1200, 1600];
const MINI_TSPIN_POINTS = [100, 200, 400];

/** T piece corners in its 3×3 box, clockwise from top-left. */
const T_CORNERS: readonly Cell[] = [[0, 0], [2, 0], [2, 2], [0, 2]];

/** Guideline gravity: seconds per row = (0.8 - (level - 1) * 0.007) ^ (level - 1). */
export function gravityInterval(level: number): number {
  const l = Math.min(level, MAX_GRAVITY_LEVEL) - 1;
  return Math.pow(0.8 - l * 0.007, l) * 1000;
}

export function scoreFor(lines: number, tSpin: TSpin): number {
  if (tSpin === "full") return TSPIN_POINTS[lines];
  if (tSpin === "mini") return MINI_TSPIN_POINTS[Math.min(lines, 2)];
  return LINE_POINTS[lines];
}

const LINE_NAMES = ["", "Single", "Double", "Triple", "Tetris"];

/** Human readable description such as "Back-to-Back T-Spin Double". */
export function describeClear(clear: ClearEvent): string[] {
  const parts: string[] = [];
  const name = LINE_NAMES[clear.lines];
  if (clear.backToBack) parts.push("Back-to-Back");
  if (clear.tSpin === "full") parts.push(`T-Spin ${name}`.trim());
  else if (clear.tSpin === "mini") parts.push(`Mini T-Spin ${name}`.trim());
  else parts.push(name);
  if (clear.combo > 0) parts.push(`Combo ×${clear.combo}`);
  return parts;
}

/** Pure game logic — no DOM access, so it can run headless in tests. */
export class Game {
  readonly board = new Board();
  active: ActivePiece | null = null;
  held: PieceType | null = null;
  canHold = true;
  score = 0;
  lines = 0;
  level = 1;
  status: GameStatus = "playing";
  lastClear: ClearEvent | null = null;
  /** Elapsed play time in ms. */
  time = 0;
  /** Increments on every visible change so the renderer can skip idle frames. */
  revision = 0;

  private bag: Bag;
  private queue: PieceType[] = [];
  private readonly random: Random;
  private readonly startLevel: number;
  private softDropping = false;
  private gravityTimer = 0;
  private lockTimer = 0;
  private lockResets = 0;
  private lowestY = 0;
  private lastMoveWasRotation = false;
  private lastKickIndex = 0;
  private backToBack = false;
  private combo = -1;

  constructor(options: GameOptions = {}) {
    this.random = options.random ?? Math.random;
    this.startLevel = options.startLevel ?? 1;
    this.bag = new Bag(this.random);
    this.reset();
  }

  reset(): void {
    this.board.reset();
    this.bag = new Bag(this.random);
    this.queue = [];
    this.fillQueue();
    this.held = null;
    this.canHold = true;
    this.score = 0;
    this.lines = 0;
    this.level = this.startLevel;
    this.status = "playing";
    this.lastClear = null;
    this.time = 0;
    this.backToBack = false;
    this.combo = -1;
    this.softDropping = false;
    this.spawn(this.takeNext());
  }

  get nextQueue(): readonly PieceType[] {
    return this.queue;
  }

  // ---- Player actions -------------------------------------------------

  moveLeft(): boolean {
    return this.shift(-1);
  }

  moveRight(): boolean {
    return this.shift(1);
  }

  rotateCW(): boolean {
    return this.rotate(1);
  }

  rotateCCW(): boolean {
    return this.rotate(3);
  }

  setSoftDrop(on: boolean): void {
    const starting = on && !this.softDropping;
    this.softDropping = on;
    // Start moving down right away instead of waiting out the normal gravity tick.
    if (starting) this.gravityTimer = Math.max(this.gravityTimer, this.currentInterval());
  }

  hardDrop(): void {
    const piece = this.playablePiece();
    if (!piece) return;
    const distance = this.ghostY() - piece.y;
    if (distance > 0) {
      piece.y += distance;
      this.score += distance * 2;
      this.lastMoveWasRotation = false;
    }
    this.lock();
  }

  hold(): void {
    const piece = this.playablePiece();
    if (!piece || !this.canHold) return;
    const swapped = this.held;
    this.held = piece.type;
    this.spawn(swapped ?? this.takeNext());
    this.canHold = false;
  }

  togglePause(): void {
    if (this.status === "over") return;
    this.status = this.status === "paused" ? "playing" : "paused";
    this.revision++;
  }

  // ---- Simulation -----------------------------------------------------

  /** Advance the game by `dt` milliseconds. */
  update(dt: number): void {
    const piece = this.playablePiece();
    if (!piece) return;
    this.time += dt;

    this.gravityTimer += dt;
    const interval = this.currentInterval();
    while (this.gravityTimer >= interval) {
      this.gravityTimer -= interval;
      if (!this.fits(piece.type, piece.rotation, piece.x, piece.y + 1)) {
        this.gravityTimer = 0;
        break;
      }
      this.stepDown(piece);
      if (this.softDropping) this.score += 1;
    }

    if (this.isGrounded(piece)) {
      this.lockTimer += dt;
      if (this.lockTimer >= LOCK_DELAY_MS || this.lockResets >= MAX_LOCK_RESETS) this.lock();
    }
  }

  // ---- Queries --------------------------------------------------------

  /** Row the active piece would land on if hard dropped. */
  ghostY(): number {
    const piece = this.active;
    if (!piece) return 0;
    let y = piece.y;
    while (this.fits(piece.type, piece.rotation, piece.x, y + 1)) y++;
    return y;
  }

  fits(type: PieceType, rotation: Rotation, x: number, y: number): boolean {
    for (const [cx, cy] of SHAPES[type][rotation]) {
      if (this.board.isBlocked(x + cx, y + cy)) return false;
    }
    return true;
  }

  // ---- Internals ------------------------------------------------------

  private playablePiece(): ActivePiece | null {
    return this.status === "playing" ? this.active : null;
  }

  private currentInterval(): number {
    const interval = gravityInterval(this.level);
    return this.softDropping ? interval / SOFT_DROP_FACTOR : interval;
  }

  private isGrounded(piece: ActivePiece): boolean {
    return !this.fits(piece.type, piece.rotation, piece.x, piece.y + 1);
  }

  private fillQueue(): void {
    while (this.queue.length < NEXT_QUEUE_SIZE) this.queue.push(this.bag.next());
  }

  private takeNext(): PieceType {
    const type = this.queue.shift()!;
    this.fillQueue();
    return type;
  }

  private spawn(type: PieceType): void {
    // Pieces spawn in the two buffer rows just above the visible field,
    // centred (left-of-centre for 3-wide pieces).
    const x = type === "O" ? 4 : 3;
    const y = VISIBLE_TOP - (type === "I" ? 3 : 2);
    this.active = { type, x, y, rotation: 0 };
    this.gravityTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lowestY = y;
    this.lastMoveWasRotation = false;
    this.revision++;

    if (!this.fits(type, 0, x, y)) {
      this.gameOver(); // block out
      return;
    }
    // Guideline: drop one row immediately if nothing is in the way.
    if (this.fits(type, 0, x, y + 1)) this.stepDown(this.active);
  }

  private stepDown(piece: ActivePiece): void {
    piece.y++;
    this.lastMoveWasRotation = false;
    this.lockTimer = 0;
    if (piece.y > this.lowestY) {
      this.lowestY = piece.y;
      this.lockResets = 0;
    }
    this.revision++;
  }

  private shift(dx: number): boolean {
    const piece = this.playablePiece();
    if (!piece || !this.fits(piece.type, piece.rotation, piece.x + dx, piece.y)) return false;
    const wasGrounded = this.isGrounded(piece);
    piece.x += dx;
    this.lastMoveWasRotation = false;
    this.afterManipulation(wasGrounded);
    return true;
  }

  private rotate(turn: 1 | 3): boolean {
    const piece = this.playablePiece();
    if (!piece) return false;
    const to = ((piece.rotation + turn) % 4) as Rotation;
    const kicks = getKicks(piece.type, piece.rotation, to);
    for (let i = 0; i < kicks.length; i++) {
      const [dx, dy] = kicks[i];
      if (!this.fits(piece.type, to, piece.x + dx, piece.y + dy)) continue;
      const wasGrounded = this.isGrounded(piece);
      piece.x += dx;
      piece.y += dy;
      piece.rotation = to;
      this.lastMoveWasRotation = true;
      this.lastKickIndex = i;
      if (piece.y > this.lowestY) {
        this.lowestY = piece.y;
        this.lockResets = 0;
      }
      this.afterManipulation(wasGrounded);
      return true;
    }
    return false;
  }

  /** Extended placement lock-down: moves on the ground reset the lock timer, up to a limit. */
  private afterManipulation(wasGrounded: boolean): void {
    if (wasGrounded && this.lockResets < MAX_LOCK_RESETS) {
      this.lockResets++;
      this.lockTimer = 0;
    }
    this.revision++;
  }

  private detectTSpin(piece: ActivePiece): TSpin {
    if (piece.type !== "T" || !this.lastMoveWasRotation) return "none";
    const filled = T_CORNERS.map(([cx, cy]) => this.board.isBlocked(piece.x + cx, piece.y + cy));
    if (filled.filter(Boolean).length < 3) return "none";
    // The two corners on the side the T points to.
    const r = piece.rotation;
    const frontFilled = filled[r] && filled[(r + 1) % 4];
    // A rotation using the last (1×2) kick always counts as a full T-Spin.
    return frontFilled || this.lastKickIndex === 4 ? "full" : "mini";
  }

  private lock(): void {
    const piece = this.active!;
    const tSpin = this.detectTSpin(piece);
    let aboveVisible = true;
    for (const [cx, cy] of SHAPES[piece.type][piece.rotation]) {
      const y = piece.y + cy;
      if (y >= 0 && y < BOARD_HEIGHT) this.board.set(piece.x + cx, y, piece.type);
      if (y >= VISIBLE_TOP) aboveVisible = false;
    }
    this.active = null;

    const cleared = this.board.clearLines();
    this.applyScore(cleared, tSpin);

    if (aboveVisible) {
      this.gameOver(); // lock out
      return;
    }
    this.canHold = true;
    this.spawn(this.takeNext());
  }

  private applyScore(lines: number, tSpin: TSpin): void {
    if (lines === 0 && tSpin === "none") {
      this.combo = -1;
      return;
    }

    let points = scoreFor(lines, tSpin) * this.level;
    let backToBack = false;
    if (lines > 0) {
      const difficult = lines === 4 || tSpin !== "none";
      backToBack = difficult && this.backToBack;
      if (backToBack) points = Math.floor(points * 1.5);
      this.backToBack = difficult;
      this.combo++;
      if (this.combo > 0) points += 50 * this.combo * this.level;
    } else {
      this.combo = -1;
    }

    this.score += points;
    this.lastClear = { lines, tSpin, backToBack, combo: Math.max(this.combo, 0), points, time: this.time };
    this.lines += lines;
    this.level = this.startLevel + Math.floor(this.lines / LINES_PER_LEVEL);
  }

  private gameOver(): void {
    this.status = "over";
    this.revision++;
  }
}
