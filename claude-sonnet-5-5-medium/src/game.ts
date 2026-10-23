import { PIECE_TYPES, SHAPES, kicksFor, type PieceType, type Rotation } from "./pieces.js";

export const COLS = 10;
export const ROWS = 22; // the top HIDDEN rows are the spawn buffer above the visible field
export const HIDDEN = 2;
export const PREVIEW_COUNT = 5;

const LOCK_DELAY_MS = 500;
const MAX_LOCK_RESETS = 15;
const SOFT_DROP_FACTOR = 20;

export interface Piece {
  type: PieceType;
  rot: Rotation;
  x: number;
  y: number;
}

type Spin = "none" | "mini" | "full";

const LINE_SCORES = [0, 100, 300, 500, 800];
const TSPIN_SCORES = [400, 800, 1200, 1600];
const TSPIN_MINI_SCORES = [100, 200, 400];

export class Game {
  board: (PieceType | null)[] = [];
  active!: Piece;
  held: PieceType | null = null;
  queue: PieceType[] = [];
  score = 0;
  lines = 0;
  level = 1;
  gameOver = false;
  /** Label of the most recent scoring clear, for display. */
  message = "";
  softDrop = false;

  private canHold = true;
  private combo = -1;
  private backToBack = false;
  private gravityAcc = 0;
  private lockTimer = 0;
  private lockResets = 0;
  private lowestY = 0;
  private lastMoveWasRotation = false;
  private lastKickIndex = 0;
  private bag: PieceType[] = [];

  constructor(private readonly random: () => number = Math.random) {
    this.restart();
  }

  restart(): void {
    this.board = new Array(COLS * ROWS).fill(null);
    this.held = null;
    this.queue = [];
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.gameOver = false;
    this.message = "";
    this.softDrop = false;
    this.canHold = true;
    this.combo = -1;
    this.backToBack = false;
    this.bag = [];
    this.fillQueue();
    this.spawn(this.nextType());
  }

  // ---- player actions ----

  moveLeft(): boolean {
    return this.shift(-1);
  }

  moveRight(): boolean {
    return this.shift(1);
  }

  rotate(direction: 1 | -1): boolean {
    if (this.gameOver) return false;
    const { type, rot, x, y } = this.active;
    const to = ((rot + direction + 4) % 4) as Rotation;
    const kicks = kicksFor(type, rot, to);
    for (let i = 0; i < kicks.length; i++) {
      const candidate = { type, rot: to, x: x + kicks[i][0], y: y + kicks[i][1] };
      if (!this.fits(candidate)) continue;
      this.active = candidate;
      this.lastMoveWasRotation = true;
      this.lastKickIndex = i;
      this.afterPlayerMove();
      return true;
    }
    return false;
  }

  hardDrop(): void {
    if (this.gameOver) return;
    while (this.tryMove(0, 1)) this.score += 2;
    this.lock();
  }

  hold(): void {
    if (this.gameOver || !this.canHold) return;
    const previous = this.held;
    this.held = this.active.type;
    this.spawn(previous ?? this.nextType());
    this.canHold = false;
  }

  /** Advance time by dt milliseconds. */
  update(dt: number): void {
    if (this.gameOver) return;

    const interval = this.gravityInterval() / (this.softDrop ? SOFT_DROP_FACTOR : 1);
    this.gravityAcc += dt;
    while (this.gravityAcc >= interval) {
      if (!this.tryMove(0, 1)) {
        this.gravityAcc = 0;
        break;
      }
      this.gravityAcc -= interval;
      if (this.softDrop) this.score += 1;
      this.trackLowest();
    }

    if (this.isGrounded()) {
      this.lockTimer += dt;
      if (this.lockTimer >= LOCK_DELAY_MS) this.lock();
    } else {
      this.lockTimer = 0;
    }
  }

  // ---- queries ----

  cellsOf(piece: Piece): [number, number][] {
    return SHAPES[piece.type][piece.rot].map(([cx, cy]) => [piece.x + cx, piece.y + cy]);
  }

  /** Where the active piece would land if hard dropped. */
  ghost(): Piece {
    let piece = this.active;
    while (this.fits({ ...piece, y: piece.y + 1 })) piece = { ...piece, y: piece.y + 1 };
    return piece;
  }

  /** Seconds-per-row curve from the Guideline, in milliseconds. */
  gravityInterval(): number {
    return Math.max(1, Math.pow(0.8 - (this.level - 1) * 0.007, this.level - 1) * 1000);
  }

  // ---- internals ----

  private shift(dx: number): boolean {
    if (this.gameOver || !this.tryMove(dx, 0)) return false;
    this.afterPlayerMove();
    return true;
  }

  private fits(piece: Piece): boolean {
    return this.cellsOf(piece).every(
      ([x, y]) => x >= 0 && x < COLS && y >= 0 && y < ROWS && this.board[y * COLS + x] === null,
    );
  }

  private tryMove(dx: number, dy: number): boolean {
    const moved = { ...this.active, x: this.active.x + dx, y: this.active.y + dy };
    if (!this.fits(moved)) return false;
    this.active = moved;
    this.lastMoveWasRotation = false;
    return true;
  }

  private isGrounded(): boolean {
    return !this.fits({ ...this.active, y: this.active.y + 1 });
  }

  private trackLowest(): void {
    if (this.active.y > this.lowestY) {
      this.lowestY = this.active.y;
      this.lockResets = 0;
    }
  }

  /** Extended placement lock delay: a move or rotation on the ground restarts the timer. */
  private afterPlayerMove(): void {
    this.trackLowest();
    if (this.isGrounded() && this.lockResets < MAX_LOCK_RESETS) {
      this.lockTimer = 0;
      this.lockResets++;
    }
  }

  private fillQueue(): void {
    while (this.queue.length < PREVIEW_COUNT + 1) {
      if (this.bag.length === 0) this.bag = this.shuffled();
      this.queue.push(this.bag.pop()!);
    }
  }

  private shuffled(): PieceType[] {
    const bag = [...PIECE_TYPES];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    return bag;
  }

  private nextType(): PieceType {
    const type = this.queue.shift()!;
    this.fillQueue();
    return type;
  }

  private spawn(type: PieceType): void {
    this.active = { type, rot: 0, x: 3, y: 0 };
    this.gravityAcc = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lastMoveWasRotation = false;
    if (!this.fits(this.active)) {
      this.gameOver = true;
      return;
    }
    this.tryMove(0, 1); // Guideline: a new piece drops one row immediately if it can
    this.lowestY = this.active.y;
  }

  private lock(): void {
    const spin = this.detectTSpin();
    const cells = this.cellsOf(this.active);
    for (const [x, y] of cells) this.board[y * COLS + x] = this.active.type;

    const lockedOutOfView = cells.every(([, y]) => y < HIDDEN);
    const cleared = this.clearLines();
    this.scoreLock(cleared, spin);
    this.canHold = true;
    this.spawn(this.nextType());
    if (lockedOutOfView) this.gameOver = true;
  }

  private clearLines(): number {
    const kept: (PieceType | null)[] = [];
    let cleared = 0;
    for (let y = 0; y < ROWS; y++) {
      const row = this.board.slice(y * COLS, (y + 1) * COLS);
      if (row.every((c) => c !== null)) cleared++;
      else kept.push(...row);
    }
    this.board = new Array<PieceType | null>(cleared * COLS).fill(null).concat(kept);
    return cleared;
  }

  /** Three-corner T-Spin test; a spin counts as mini unless both front corners are filled. */
  private detectTSpin(): Spin {
    const { type, rot, x, y } = this.active;
    if (type !== "T" || !this.lastMoveWasRotation) return "none";
    const filled = (cx: number, cy: number) =>
      cx < 0 || cx >= COLS || cy >= ROWS || (cy >= 0 && this.board[cy * COLS + cx] !== null);
    const corner = (cx: number, cy: number) => filled(x + cx, y + cy);
    const corners = { a: corner(0, 0), b: corner(2, 0), c: corner(2, 2), d: corner(0, 2) };
    if (Object.values(corners).filter(Boolean).length < 3) return "none";
    const [front1, front2] = [
      [corners.a, corners.b], // pointing up
      [corners.b, corners.c], // right
      [corners.d, corners.c], // down
      [corners.a, corners.d], // left
    ][rot];
    return (front1 && front2) || this.lastKickIndex === 4 ? "full" : "mini";
  }

  private scoreLock(cleared: number, spin: Spin): void {
    let points = 0;
    if (spin === "full") points = TSPIN_SCORES[cleared];
    else if (spin === "mini") points = TSPIN_MINI_SCORES[cleared];
    else points = LINE_SCORES[cleared];
    points *= this.level;

    if (cleared > 0) {
      const difficult = spin !== "none" || cleared === 4;
      if (difficult && this.backToBack) points = Math.floor(points * 1.5);
      this.backToBack = difficult;
      this.combo++;
      if (this.combo > 0) points += 50 * this.combo * this.level;
      this.lines += cleared;
      this.level = 1 + Math.floor(this.lines / 10);
      this.message = this.describe(cleared, spin);
    } else {
      this.combo = -1;
      if (spin !== "none") this.message = this.describe(cleared, spin);
    }
    this.score += points;
  }

  private describe(cleared: number, spin: Spin): string {
    const names = ["", "Single", "Double", "Triple", "Tetris"];
    const spinLabel = spin === "none" ? "" : spin === "mini" ? "Mini T-Spin " : "T-Spin ";
    return `${spinLabel}${names[cleared]}`.trim();
  }
}
