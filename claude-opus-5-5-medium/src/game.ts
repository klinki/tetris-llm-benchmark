// Pure game logic: no DOM access, so it can run headless in tests.
import { Bag, RandomFn } from "./bag.js";
import { PIECE_TYPES, PieceType, Rotation, kickTests, pieceCells, pieceSize } from "./pieces.js";

export const WIDTH = 10;
export const VISIBLE_HEIGHT = 20;
export const HIDDEN_ROWS = 20; // buffer zone above the visible field
export const HEIGHT = VISIBLE_HEIGHT + HIDDEN_ROWS;
export const NEXT_COUNT = 5;

const LOCK_DELAY_MS = 500;
const MAX_LOCK_RESETS = 15;
const SOFT_DROP_FACTOR = 20;
const LINES_PER_LEVEL = 10;
const MAX_GRAVITY_LEVEL = 20;

const LINE_SCORES = [0, 100, 300, 500, 800];
const TSPIN_MINI_SCORES = [100, 200, 400];
const TSPIN_SCORES = [400, 800, 1200, 1600];
const CLEAR_NAMES = ["", "SINGLE", "DOUBLE", "TRIPLE", "TETRIS"];

export type TSpin = "none" | "mini" | "full";

export interface ActivePiece {
  type: PieceType;
  rotation: Rotation;
  x: number;
  y: number;
}

/** Seconds per row for the given level, per the Guideline gravity curve. */
export function gravitySeconds(level: number): number {
  const l = Math.min(level, MAX_GRAVITY_LEVEL) - 1;
  return Math.pow(0.8 - l * 0.007, l);
}

export class Game {
  /** Row-major board; 0 = empty, otherwise index into PIECE_TYPES + 1. */
  readonly board = new Uint8Array(WIDTH * HEIGHT);
  active: ActivePiece | null = null;
  holdPiece: PieceType | null = null;
  holdUsed = false;
  score = 0;
  level = 1;
  lines = 0;
  combo = -1;
  backToBack = false;
  gameOver = false;
  paused = false;
  softDropping = false;
  /** Latest notable clear, e.g. "T-SPIN DOUBLE", for display. */
  message = "";

  private bag: Bag;
  private gravityAcc = 0;
  private lockTimer = 0;
  private lockResets = 0;
  private lowestY = 0;
  private lastMoveRotation = false;
  private lastKickIndex = 0;

  constructor(private readonly random: RandomFn = Math.random) {
    this.bag = new Bag(random);
    this.reset();
  }

  reset(): void {
    this.board.fill(0);
    this.bag = new Bag(this.random);
    this.holdPiece = null;
    this.holdUsed = false;
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.combo = -1;
    this.backToBack = false;
    this.gameOver = false;
    this.paused = false;
    this.softDropping = false;
    this.message = "";
    this.spawn(this.bag.next());
  }

  get nextPieces(): readonly PieceType[] {
    return this.bag.peek(NEXT_COUNT);
  }

  cell(x: number, y: number): number {
    return this.board[y * WIDTH + x];
  }

  /** True if the cell is outside the field or occupied. */
  isBlocked(x: number, y: number): boolean {
    return x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT || this.board[y * WIDTH + x] !== 0;
  }

  collides(type: PieceType, rotation: Rotation, x: number, y: number): boolean {
    for (const [cx, cy] of pieceCells(type, rotation)) {
      if (this.isBlocked(x + cx, y + cy)) return true;
    }
    return false;
  }

  /** Row the active piece would land on if hard dropped. */
  ghostY(): number {
    const p = this.active;
    if (!p) return 0;
    let y = p.y;
    while (!this.collides(p.type, p.rotation, p.x, y + 1)) y++;
    return y;
  }

  // ---- player actions ----

  moveLeft(): boolean {
    return this.tryShift(-1);
  }

  moveRight(): boolean {
    return this.tryShift(1);
  }

  /** dir: 1 = clockwise, -1 = anticlockwise. */
  rotate(dir: 1 | -1): boolean {
    const p = this.active;
    if (!this.canAct() || !p) return false;
    const to = ((p.rotation + dir + 4) % 4) as Rotation;
    const tests = kickTests(p.type, p.rotation, to);
    for (let i = 0; i < tests.length; i++) {
      const [dx, dy] = tests[i];
      if (!this.collides(p.type, to, p.x + dx, p.y + dy)) {
        p.rotation = to;
        p.x += dx;
        p.y += dy;
        this.lastMoveRotation = true;
        this.lastKickIndex = i;
        this.afterMove();
        return true;
      }
    }
    return false;
  }

  hardDrop(): void {
    const p = this.active;
    if (!this.canAct() || !p) return;
    const target = this.ghostY();
    const distance = target - p.y;
    if (distance > 0) {
      p.y = target;
      this.lastMoveRotation = false;
    }
    this.score += 2 * distance;
    this.lock();
  }

  hold(): void {
    const p = this.active;
    if (!this.canAct() || !p || this.holdUsed) return;
    const next = this.holdPiece ?? this.bag.next();
    this.holdPiece = p.type;
    this.holdUsed = true;
    this.spawn(next);
  }

  setSoftDrop(on: boolean): void {
    this.softDropping = on;
  }

  togglePause(): void {
    if (!this.gameOver) this.paused = !this.paused;
  }

  // ---- time ----

  update(dtMs: number): void {
    const p = this.active;
    if (!this.canAct() || !p) return;

    if (this.isGrounded()) {
      this.gravityAcc = 0;
      this.lockTimer += dtMs;
      if (this.lockTimer >= LOCK_DELAY_MS) this.lock();
      return;
    }

    let interval = gravitySeconds(this.level) * 1000;
    if (this.softDropping) interval /= SOFT_DROP_FACTOR;
    this.gravityAcc += dtMs;
    while (this.gravityAcc >= interval) {
      this.gravityAcc -= interval;
      if (!this.fall()) {
        this.gravityAcc = 0;
        break;
      }
      if (this.softDropping) this.score += 1;
    }
  }

  // ---- internals ----

  private canAct(): boolean {
    return !this.gameOver && !this.paused && this.active !== null;
  }

  private isGrounded(): boolean {
    const p = this.active!;
    return this.collides(p.type, p.rotation, p.x, p.y + 1);
  }

  private tryShift(dx: number): boolean {
    const p = this.active;
    if (!this.canAct() || !p) return false;
    if (this.collides(p.type, p.rotation, p.x + dx, p.y)) return false;
    p.x += dx;
    this.lastMoveRotation = false;
    this.afterMove();
    return true;
  }

  private fall(): boolean {
    const p = this.active!;
    if (this.collides(p.type, p.rotation, p.x, p.y + 1)) return false;
    p.y++;
    this.lastMoveRotation = false;
    if (p.y > this.lowestY) {
      // Reaching a new lowest row restores the move-reset allowance.
      this.lowestY = p.y;
      this.lockResets = 0;
      this.lockTimer = 0;
    }
    return true;
  }

  /** Move-reset lock delay: limited number of resets per piece. */
  private afterMove(): void {
    if (this.lockTimer > 0 && this.lockResets < MAX_LOCK_RESETS) {
      this.lockTimer = 0;
      this.lockResets++;
    }
  }

  private spawn(type: PieceType): void {
    const x = Math.floor((WIDTH - pieceSize(type)) / 2);
    const y = HIDDEN_ROWS - 2;
    this.active = { type, rotation: 0, x, y };
    this.gravityAcc = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lowestY = y;
    this.lastMoveRotation = false;
    if (this.collides(type, 0, x, y)) {
      // Block out: the new piece overlaps the stack.
      this.gameOver = true;
      return;
    }
    // The Guideline drops the piece one row immediately if nothing is in the way.
    this.fall();
  }

  private lock(): void {
    const p = this.active!;
    const tSpin = this.detectTSpin();
    let aboveVisible = true;
    const value = PIECE_TYPES.indexOf(p.type) + 1;
    for (const [cx, cy] of pieceCells(p.type, p.rotation)) {
      const y = p.y + cy;
      this.board[y * WIDTH + p.x + cx] = value;
      if (y >= HIDDEN_ROWS) aboveVisible = false;
    }
    this.active = null;

    const cleared = this.clearLines();
    this.applyScore(cleared, tSpin);

    if (aboveVisible) {
      // Lock out: piece locked entirely above the visible field.
      this.gameOver = true;
      return;
    }
    this.holdUsed = false;
    this.spawn(this.bag.next());
  }

  /** Three-corner T-spin rule. */
  private detectTSpin(): TSpin {
    const p = this.active!;
    if (p.type !== "T" || !this.lastMoveRotation) return "none";
    const corners = [
      this.isBlocked(p.x, p.y), // top-left
      this.isBlocked(p.x + 2, p.y), // top-right
      this.isBlocked(p.x + 2, p.y + 2), // bottom-right
      this.isBlocked(p.x, p.y + 2), // bottom-left
    ];
    if (corners.filter(Boolean).length < 3) return "none";
    // The two corners next to the pointing side are "front" corners.
    const front = corners[p.rotation] && corners[(p.rotation + 1) % 4];
    return front || this.lastKickIndex === 4 ? "full" : "mini";
  }

  private clearLines(): number {
    let cleared = 0;
    for (let y = HEIGHT - 1; y >= 0; y--) {
      const row = this.board.subarray(y * WIDTH, (y + 1) * WIDTH);
      if (row.every((c) => c !== 0)) {
        cleared++;
      } else if (cleared > 0) {
        this.board.copyWithin((y + cleared) * WIDTH, y * WIDTH, (y + 1) * WIDTH);
      }
    }
    this.board.fill(0, 0, cleared * WIDTH);
    return cleared;
  }

  private applyScore(cleared: number, tSpin: TSpin): void {
    let base: number;
    if (tSpin === "full") base = TSPIN_SCORES[cleared];
    else if (tSpin === "mini") base = TSPIN_MINI_SCORES[Math.min(cleared, 2)];
    else base = LINE_SCORES[cleared];

    const parts: string[] = [];
    if (tSpin !== "none") parts.push(tSpin === "mini" ? "T-SPIN MINI" : "T-SPIN");
    if (cleared > 0) parts.push(CLEAR_NAMES[cleared]);

    if (cleared > 0) {
      const difficult = cleared === 4 || tSpin !== "none";
      if (difficult && this.backToBack) {
        base *= 1.5;
        parts.unshift("BACK-TO-BACK");
      }
      this.backToBack = difficult;
      this.combo++;
      if (this.combo > 0) {
        base += 50 * this.combo;
        parts.push(`COMBO ${this.combo}`);
      }
    } else {
      this.combo = -1;
    }

    this.score += Math.floor(base * this.level);
    if (parts.length > 0) this.message = parts.join(" ");

    this.lines += cleared;
    this.level = Math.floor(this.lines / LINES_PER_LEVEL) + 1;
  }
}
