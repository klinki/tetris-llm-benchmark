import { Bag } from "./bag.js";
import { Board, VISIBLE } from "./board.js";
import { CELLS, KICKS, PIECE_IDS, SPAWN, type Piece, type PieceType } from "./tetromino.js";

export const LOCK_DELAY = 0.5; // seconds a grounded piece stays movable
export const NEXT_COUNT = 3; // pieces shown in the next queue

const SOFT_DROP_INTERVAL = 1 / 40; // seconds per cell while soft dropping
const LINE_SCORES = [0, 100, 300, 500, 800]; // guideline: single..tetris, x level
const LINES_PER_LEVEL = 10;
const FPS = 60;

/** Guideline gravity: frames per row for level 1..30+, level 30+ = 20G. */
const GRAVITY_FRAMES = [
  48, 43, 38, 33, 28, 23, 18, 13, 8, 6, 5, 5, 5, 4, 4, 4, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
  1,
];

/**
 * Guideline-following game state machine. Pure logic: no DOM access, so it
 * runs in Node for tests and is driven by main.ts in the browser.
 */
export class Game {
  readonly board = new Board();
  score = 0;
  lines = 0;
  level = 1;
  over = false;

  active: Piece | null = null;
  hold: PieceType | null = null;

  /** Internal: the upcoming pieces. Exposed so tests can fix the sequence. */
  readonly queue: PieceType[] = [];

  private readonly bag = new Bag();
  private holdUsed = false;
  private gravity = 0; // accumulated seconds toward the next auto-fall
  private lock = 0; // accumulated seconds the current piece has been grounded
  private grounded = false;
  private soft = false;

  constructor() {
    this.refillQueue();
    this.spawn();
  }

  restart(): void {
    this.board.reset();
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.over = false;
    this.hold = null;
    this.holdUsed = false;
    this.active = null;
    this.queue.length = 0;
    this.refillQueue();
    this.spawn();
  }

  /** Advance the simulation by dt seconds. */
  update(dt: number): void {
    if (this.over || !this.active) return;
    if (this.grounded) {
      this.lock += dt;
      if (this.lock >= LOCK_DELAY) this.lockPiece();
      return;
    }
    this.gravity += dt;
    const interval = this.soft
      ? Math.min(this.gravityInterval(), SOFT_DROP_INTERVAL)
      : this.gravityInterval();
    while (this.gravity >= interval) {
      this.gravity -= interval;
      if (!this.stepDown()) break;
      if (this.soft) this.score += 1; // guideline: 1 point per soft-dropped cell
    }
  }

  setSoftDrop(on: boolean): void {
    this.soft = on;
  }

  move(dir: -1 | 1): boolean {
    const p = this.active;
    if (!p || this.over) return false;
    if (this.board.collides(p, p.x + dir, p.y)) return false;
    p.x += dir;
    this.resetLockTimer();
    return true;
  }

  /** dir: 1 = clockwise, -1 = counter-clockwise. Applies SRS wall kicks. */
  rotate(dir: 1 | -1): boolean {
    const p = this.active;
    if (!p || this.over) return false;
    if (p.type === "O") return true; // rotationally symmetric
    const from = p.state;
    const to = (from + dir + 4) % 4;
    const cells = CELLS[p.type][to];
    for (const [dx, dy] of KICKS[p.type][from][to]) {
      if (!this.board.collidesCells(cells, p.x + dx, p.y - dy)) {
        p.x += dx;
        p.y -= dy; // kick dy is guideline-up: +y = up
        p.state = to;
        this.resetLockTimer();
        return true;
      }
    }
    return false;
  }

  hardDrop(): void {
    const p = this.active;
    if (!p || this.over) return;
    while (this.stepDown()) this.score += 2; // guideline: 2 points per cell
    this.lockPiece();
  }

  holdPiece(): void {
    const p = this.active;
    if (!p || this.over || this.holdUsed) return;
    this.holdUsed = true;
    this.active = null;
    if (this.hold === null) {
      this.hold = p.type;
      this.spawn();
    } else {
      const held = this.hold;
      this.hold = p.type;
      this.spawnType(held);
    }
  }

  /** Row (board coordinates) the active piece would land at. */
  ghostY(): number {
    const p = this.active;
    if (!p) return 0;
    let y = p.y;
    while (!this.board.collides(p, p.x, y + 1)) y++;
    return y;
  }

  private refillQueue(): void {
    for (let i = 0; i < NEXT_COUNT; i++) this.queue.push(this.bag.next());
  }

  private spawn(): void {
    const type = this.queue.shift()!;
    this.queue.push(this.bag.next());
    this.spawnType(type);
  }

  private spawnType(type: PieceType): void {
    const { x, y } = SPAWN[type];
    const piece: Piece = { type, state: 0, x, y };
    if (this.board.collides(piece, x, y)) {
      // Top out: the spawn area is blocked.
      this.over = true;
      this.active = null;
      return;
    }
    this.active = piece;
    this.gravity = 0;
    this.lock = 0;
    this.grounded = false;
  }

  private gravityInterval(): number {
    const frames = GRAVITY_FRAMES[Math.min(this.level - 1, GRAVITY_FRAMES.length - 1)];
    return frames / FPS;
  }

  private stepDown(): boolean {
    const p = this.active!;
    if (this.board.collides(p, p.x, p.y + 1)) {
      this.grounded = true;
      return false;
    }
    p.y++;
    return true;
  }

  private resetLockTimer(): void {
    this.lock = 0;
  }

  private lockPiece(): void {
    const p = this.active!;
    this.board.merge(p, p.x, p.y, PIECE_IDS.indexOf(p.type) + 1);

    const n = this.board.clearFullRows();
    if (n > 0) {
      this.score += LINE_SCORES[Math.min(n, 4)] * this.level;
      this.lines += n;
      this.level = Math.floor(this.lines / LINES_PER_LEVEL) + 1;
    }

    // Guideline lock out: a piece locking entirely above the visible field.
    let allHidden = true;
    for (const [, dy] of CELLS[p.type][p.state]) {
      if (p.y + dy >= VISIBLE) {
        allHidden = false;
        break;
      }
    }
    if (allHidden) this.over = true;

    this.active = null;
    this.holdUsed = false;
    if (!this.over) this.spawn();
  }
}
