import { Bag, rotationKicks, SHAPES } from "./pieces.js";
import type { Kind, Piece, Point, Rotation } from "./pieces.js";

export const WIDTH = 10;
export const HEIGHT = 20;
export const HIDDEN_ROWS = 20;
export const PREVIEW_COUNT = 5;
export const LINES_PER_LEVEL = 10;
export const MAX_LEVEL = 15;

const LOCK_DELAY = 500;
const LOCK_MOVE_LIMIT = 15;
const LINE_POINTS = [0, 100, 300, 500, 800];
const SPIN_POINTS = [400, 800, 1200, 1600];
const MINI_POINTS = [100, 200, 400];

type Cell = Kind | null;
type Spin = "full" | "mini" | null;

const corners: readonly Point[] = [[0, 0], [2, 0], [2, 2], [0, 2]];
const emptyRow = (): Cell[] => Array<Cell>(WIDTH).fill(null);

export class Game {
  readonly board = Array.from({ length: HEIGHT + HIDDEN_ROWS }, emptyRow);
  active: Piece | null = null;
  held: Kind | null = null;
  canHold = true;
  score = 0;
  lines = 0;

  private readonly bag: Bag;
  private readonly queue: Kind[] = [];
  private fallTime = 0;
  private lockTime = 0;
  private lockMoves = 0;
  private touchedSurface = false;
  private lowestY = 0;
  private lastKick: number | null = null;
  private combo = -1;
  private backToBack = false;

  constructor(random: () => number = Math.random) {
    this.bag = new Bag(random);
    this.spawn(this.takeNext());
  }

  get next(): readonly Kind[] {
    return this.queue;
  }

  get level(): number {
    return Math.min(MAX_LEVEL, 1 + Math.floor(this.lines / LINES_PER_LEVEL));
  }

  get gameOver(): boolean {
    return this.active === null;
  }

  get gravityInterval(): number {
    const steps = this.level - 1;
    return 1000 * (0.8 - steps * 0.007) ** steps;
  }

  move(direction: -1 | 1): boolean {
    if (!this.active) return false;
    const moved = { ...this.active, x: this.active.x + direction };
    if (!this.fits(moved)) return false;

    this.active = moved;
    this.lastKick = null;
    this.afterManipulation();
    return true;
  }

  rotate(direction: -1 | 1): boolean {
    if (!this.active) return false;
    const { kind, rotation, x, y } = this.active;
    const facing = ((rotation + direction + 4) % 4) as Rotation;
    const kicks = rotationKicks(kind, rotation, facing);

    for (const [index, [dx, dy]] of kicks.entries()) {
      const turned = { kind, rotation: facing, x: x + dx, y: y + dy };
      if (!this.fits(turned)) continue;

      this.active = turned;
      this.lastKick = index;
      this.afterManipulation();
      return true;
    }
    return false;
  }

  softDrop(): boolean {
    return this.descend(true);
  }

  hardDrop(): boolean {
    const landing = this.ghost();
    if (!this.active || !landing) return false;

    const distance = landing.y - this.active.y;
    if (distance > 0) this.lastKick = null;
    this.score += 2 * distance;
    this.active = landing;
    this.lock();
    return true;
  }

  hold(): boolean {
    if (!this.active || !this.canHold) return false;
    const incoming = this.held ?? this.takeNext();
    this.held = this.active.kind;
    this.canHold = false;
    this.spawn(incoming);
    return true;
  }

  ghost(): Piece | null {
    if (!this.active) return null;

    const landing = { ...this.active };
    while (!this.collides(landing, landing.x, landing.y + 1)) landing.y++;
    return landing;
  }

  // Process gravity and lock delay in order, including when a tick crosses a landing.
  tick(elapsed: number, softDrop = false): boolean {
    let changed = false;
    while (this.active && elapsed > 0) {
      if (this.grounded(this.active)) {
        const wait = LOCK_DELAY - this.lockTime;
        if (elapsed < wait) {
          this.lockTime += elapsed;
          break;
        }
        elapsed -= wait;
        this.lock();
        changed = true;
      } else {
        const interval = this.gravityInterval / (softDrop ? 20 : 1);
        const wait = Math.max(0, interval - this.fallTime);
        if (elapsed < wait) {
          this.fallTime += elapsed;
          break;
        }
        elapsed -= wait;
        this.descend(softDrop);
        changed = true;
      }
    }
    return changed;
  }

  private takeNext(): Kind {
    while (this.queue.length < PREVIEW_COUNT + 1) this.queue.push(this.bag.take());
    return this.queue.shift()!;
  }

  private spawn(kind: Kind): void {
    const piece: Piece = { kind, rotation: 0, x: 3, y: -2 };
    if (!this.fits(piece)) {
      this.active = null;
      return;
    }

    const entered = { ...piece, y: piece.y + 1 };
    this.active = this.fits(entered) ? entered : piece;
    this.lowestY = this.active.y;
    this.fallTime = 0;
    this.lockTime = 0;
    this.lockMoves = 0;
    this.touchedSurface = this.grounded(this.active);
    this.lastKick = null;
  }

  private occupied(x: number, y: number): boolean {
    return x < 0 || x >= WIDTH || y < -HIDDEN_ROWS || y >= HEIGHT ||
      this.board[y + HIDDEN_ROWS][x] !== null;
  }

  private collides(piece: Piece, x: number, y: number): boolean {
    return SHAPES[piece.kind][piece.rotation].some(([dx, dy]) => this.occupied(x + dx, y + dy));
  }

  private fits(piece: Piece): boolean {
    return !this.collides(piece, piece.x, piece.y);
  }

  private grounded(piece: Piece): boolean {
    return this.collides(piece, piece.x, piece.y + 1);
  }

  private descend(softDrop: boolean): boolean {
    if (!this.active || this.grounded(this.active)) return false;
    this.active = { ...this.active, y: this.active.y + 1 };
    this.fallTime = 0;
    this.lastKick = null;
    if (softDrop) this.score++;

    this.checkNewDepth();
    this.checkLanding();
    return true;
  }

  private afterManipulation(): void {
    const lower = this.checkNewDepth();
    if (!lower && this.touchedSurface) {
      this.lockMoves++;
      if (this.grounded(this.active!)) this.lockTime = 0;
    }
    this.checkLanding();
  }

  private checkNewDepth(): boolean {
    const { y } = this.active!;
    if (y <= this.lowestY) return false;

    this.lowestY = y;
    this.lockTime = 0;
    this.lockMoves = 0;
    this.touchedSurface = false;
    return true;
  }

  private checkLanding(): void {
    if (this.active && this.grounded(this.active)) {
      this.touchedSurface = true;
      this.fallTime = 0;
      if (this.lockMoves >= LOCK_MOVE_LIMIT) this.lock();
    }
  }

  private spinType(piece: Piece): Spin {
    if (piece.kind !== "T" || this.lastKick === null) return null;
    const blocked = corners.map(([x, y]) => this.occupied(piece.x + x, piece.y + y));
    if (blocked.filter(Boolean).length < 3) return null;

    const frontFilled = blocked[piece.rotation] && blocked[(piece.rotation + 1) % 4];
    return frontFilled || this.lastKick === 4 ? "full" : "mini";
  }

  private lock(): void {
    const piece = this.active!;
    const cells = SHAPES[piece.kind][piece.rotation];
    const spin = this.spinType(piece);
    for (const [x, y] of cells) this.board[piece.y + y + HIDDEN_ROWS][piece.x + x] = piece.kind;

    const cleared = this.clearRows();
    this.awardPoints(cleared, spin);
    this.lines += cleared;

    if (cleared === 0 && cells.every(([, y]) => piece.y + y < 0)) {
      this.active = null;
      return;
    }

    this.canHold = true;
    this.spawn(this.takeNext());
  }

  private clearRows(): number {
    let write = this.board.length - 1;
    for (let read = write; read >= 0; read--) {
      if (this.board[read].includes(null)) this.board[write--] = this.board[read];
    }

    const cleared = write + 1;
    while (write >= 0) this.board[write--] = emptyRow();
    return cleared;
  }

  private awardPoints(cleared: number, spin: Spin): void {
    const points = spin === "full" ? SPIN_POINTS : spin === "mini" ? MINI_POINTS : LINE_POINTS;
    const difficult = cleared === 4 || (cleared > 0 && spin !== null);
    const multiplier = difficult && this.backToBack ? 1.5 : 1;

    this.combo = cleared > 0 ? this.combo + 1 : -1;
    this.score += (points[cleared] * multiplier + 50 * Math.max(0, this.combo)) * this.level;
    if (cleared > 0) this.backToBack = difficult;
  }
}
