import { Board, HIDDEN_ROWS } from './board.js';
import { kicksFor, pieceCells, type PieceType, type Point, type Rotation } from './pieces.js';
import { SevenBag } from './randomizer.js';
import {
  SOFT_DROP_FACTOR,
  clearName,
  clearPoints,
  gravityInterval,
  isDifficult,
  levelForLines,
  type TSpin,
} from './scoring.js';

export const LOCK_DELAY = 500;
export const MAX_LOCK_RESETS = 15;
export const PREVIEW_COUNT = 5;
const BANNER_DURATION = 2000;

export type Status = 'playing' | 'paused' | 'gameover';

export interface Piece {
  type: PieceType;
  rotation: Rotation;
  /** Top-left corner of the piece's bounding box on the board. */
  x: number;
  y: number;
}

// Corners of the T piece's 3x3 box that its nose points towards, per rotation. The opposite pair is the back.
const T_FRONT_CORNERS: readonly (readonly [Point, Point])[] = [
  [[0, 0], [2, 0]],
  [[2, 0], [2, 2]],
  [[2, 2], [0, 2]],
  [[0, 2], [0, 0]],
];

/** Headless Tetris rules: no DOM, no timers. Drive it with commands and `update(dtMs)`. */
export class Game {
  readonly board = new Board();
  current!: Piece;
  held: PieceType | null = null;
  queue: PieceType[] = [];
  status: Status = 'playing';
  score = 0;
  lines = 0;
  level = 1;
  /** Lines of text describing the last lock, e.g. "BACK-TO-BACK", "TETRIS". */
  banner: string[] = [];

  private bag!: SevenBag;
  private holdUsed = false;
  private combo = 0;
  private backToBack = false;
  private softDrop = false;
  private gravityAcc = 0;
  private lockTimer = 0;
  private lockResets = 0;
  private lowestY = 0;
  private lastMoveWasRotation = false;
  private lastKickIndex = 0;
  private bannerTimer = 0;

  constructor(private readonly random: () => number = Math.random) {
    this.restart();
  }

  restart(): void {
    this.board.clear();
    this.bag = new SevenBag(this.random);
    this.queue = Array.from({ length: PREVIEW_COUNT }, () => this.bag.next());
    this.held = null;
    this.status = 'playing';
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.banner = [];
    this.holdUsed = false;
    this.combo = 0;
    this.backToBack = false;
    this.softDrop = false;
    this.spawn(this.nextFromQueue());
  }

  // ---- Commands -------------------------------------------------------------------------------

  moveLeft(): boolean {
    return this.shift(-1);
  }

  moveRight(): boolean {
    return this.shift(1);
  }

  rotate(clockwise: boolean): boolean {
    if (this.status !== 'playing') return false;
    const p = this.current;
    const to = ((p.rotation + (clockwise ? 1 : 3)) % 4) as Rotation;
    const kicks = kicksFor(p.type, p.rotation, clockwise);
    for (let i = 0; i < kicks.length; i++) {
      const [dx, dy] = kicks[i];
      if (this.board.collides(p.type, to, p.x + dx, p.y + dy)) continue;
      p.rotation = to;
      p.x += dx;
      p.y += dy;
      this.lastMoveWasRotation = true;
      this.lastKickIndex = i;
      this.afterPlayerMove();
      return true;
    }
    return false;
  }

  setSoftDrop(active: boolean): void {
    this.softDrop = active;
  }

  hardDrop(): void {
    if (this.status !== 'playing') return;
    const distance = this.ghostY() - this.current.y;
    if (distance > 0) {
      this.current.y += distance;
      this.lastMoveWasRotation = false;
      this.score += 2 * distance;
    }
    this.lockPiece();
  }

  holdPiece(): void {
    if (this.status !== 'playing' || this.holdUsed) return;
    const incoming = this.held ?? this.nextFromQueue();
    this.held = this.current.type;
    this.holdUsed = true;
    this.spawn(incoming);
  }

  togglePause(): void {
    if (this.status === 'playing') this.status = 'paused';
    else if (this.status === 'paused') this.status = 'playing';
  }

  // ---- Time -----------------------------------------------------------------------------------

  update(dt: number): void {
    if (this.status !== 'playing') return;
    this.bannerTimer = Math.max(0, this.bannerTimer - dt);
    if (this.bannerTimer === 0) this.banner = [];

    if (this.isGrounded()) {
      this.gravityAcc = 0;
      this.lockTimer += dt;
      if (this.lockTimer >= LOCK_DELAY) this.lockPiece();
      return;
    }

    this.lockTimer = 0;
    const interval = gravityInterval(this.level) / (this.softDrop ? SOFT_DROP_FACTOR : 1);
    this.gravityAcc += dt;
    while (this.gravityAcc >= interval) {
      this.gravityAcc -= interval;
      this.stepDown();
      if (this.softDrop) this.score += 1;
      if (this.isGrounded()) {
        this.gravityAcc = 0;
        break;
      }
    }
  }

  // ---- Queries --------------------------------------------------------------------------------

  /** Row the current piece would land on if dropped straight down. */
  ghostY(): number {
    const { type, rotation, x } = this.current;
    let y = this.current.y;
    while (!this.board.collides(type, rotation, x, y + 1)) y++;
    return y;
  }

  // ---- Internals ------------------------------------------------------------------------------

  private shift(dx: -1 | 1): boolean {
    if (this.status !== 'playing') return false;
    const p = this.current;
    if (this.board.collides(p.type, p.rotation, p.x + dx, p.y)) return false;
    p.x += dx;
    this.lastMoveWasRotation = false;
    this.afterPlayerMove();
    return true;
  }

  private stepDown(): void {
    const p = this.current;
    p.y++;
    this.lastMoveWasRotation = false;
    if (p.y > this.lowestY) {
      this.lowestY = p.y;
      this.lockResets = 0;
    }
  }

  private isGrounded(): boolean {
    const p = this.current;
    return this.board.collides(p.type, p.rotation, p.x, p.y + 1);
  }

  /** Moving or rotating a resting piece restarts the lock delay, a limited number of times. */
  private afterPlayerMove(): void {
    if (this.current.y > this.lowestY) {
      this.lowestY = this.current.y;
      this.lockResets = 0;
    }
    if (this.isGrounded() && this.lockResets < MAX_LOCK_RESETS) {
      this.lockResets++;
      this.lockTimer = 0;
    }
  }

  private nextFromQueue(): PieceType {
    this.queue.push(this.bag.next());
    return this.queue.shift()!;
  }

  private spawn(type: PieceType): void {
    const piece: Piece = { type, rotation: 0, x: type === 'O' ? 4 : 3, y: 0 };
    this.current = piece;
    this.gravityAcc = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lastMoveWasRotation = false;
    if (this.board.collides(type, 0, piece.x, piece.y)) {
      this.status = 'gameover'; // block out
      return;
    }
    if (!this.isGrounded()) this.stepDown(); // a new piece drops one row immediately
    this.lowestY = piece.y;
  }

  private lockPiece(): void {
    const p = this.current;
    const tspin = this.detectTSpin();
    const aboveField = pieceCells(p.type, p.rotation).every(([, dy]) => p.y + dy < HIDDEN_ROWS);

    this.board.place(p.type, p.rotation, p.x, p.y);
    const cleared = this.board.clearLines();
    this.scoreLock(cleared, tspin);
    this.holdUsed = false;

    if (aboveField && cleared === 0) {
      this.status = 'gameover'; // lock out
      return;
    }
    this.spawn(this.nextFromQueue());
  }

  private scoreLock(lines: number, tspin: TSpin): void {
    const perfectClear = lines > 0 && this.board.isEmpty();
    this.score += clearPoints({
      lines,
      tspin,
      level: this.level,
      backToBack: this.backToBack,
      combo: this.combo,
      perfectClear,
    });

    const banner: string[] = [];
    if (lines > 0 && this.backToBack && isDifficult(lines, tspin)) banner.push('BACK-TO-BACK');
    const name = clearName(lines, tspin);
    if (name) banner.push(name);
    if (lines > 0 && this.combo > 0) banner.push(`${this.combo} COMBO`);
    if (perfectClear) banner.push('PERFECT CLEAR');
    if (banner.length > 0) {
      this.banner = banner;
      this.bannerTimer = BANNER_DURATION;
    }

    if (lines > 0) {
      this.combo++;
      this.backToBack = isDifficult(lines, tspin);
    } else {
      this.combo = 0; // a T-spin without lines leaves back-to-back untouched
    }
    this.lines += lines;
    this.level = levelForLines(this.lines);
  }

  /** Three-corner T-spin rule; only valid if the last successful move was a rotation. */
  private detectTSpin(): TSpin {
    const p = this.current;
    if (p.type !== 'T' || !this.lastMoveWasRotation) return 'none';
    const occupied = (corners: readonly Point[]) =>
      corners.filter(([cx, cy]) => this.board.isBlocked(p.x + cx, p.y + cy)).length;
    const front = occupied(T_FRONT_CORNERS[p.rotation]);
    const back = occupied(T_FRONT_CORNERS[(p.rotation + 2) % 4]);
    if (front + back < 3) return 'none';
    // The last kick test (the long diagonal) always counts as a full T-spin.
    return front === 2 || this.lastKickIndex === 4 ? 'full' : 'mini';
  }
}
