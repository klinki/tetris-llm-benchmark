import { Bag, kicks, shapes, type Kind, type Point, type Rotation } from './pieces.js';

export const WIDTH = 10;
export const HEIGHT = 20;
const HIDDEN_ROWS = 20;
const LOCK_DELAY = 500;
const LOCK_RESETS = 15;
const PREVIEW_COUNT = 5;
const SOFT_DROP_MULTIPLIER = 20;

export interface Piece {
  kind: Kind;
  x: number;
  y: number;
  rotation: Rotation;
}

type Cell = Kind | null;
type Spin = 'none' | 'mini' | 'full';

const linePoints = [0, 100, 300, 500, 800];
const miniPoints = [100, 200, 400];
const spinPoints = [400, 800, 1200, 1600];

function emptyRow(): Cell[] {
  return Array<Cell>(WIDTH).fill(null);
}

export function cells(piece: Piece): Point[] {
  return shapes[piece.kind][piece.rotation].map(([x, y]) => [piece.x + x, piece.y + y]);
}

export function gravityInterval(level: number): number {
  const step = Math.min(level, 15) - 1;
  return 1000 * (0.8 - step * 0.007) ** step;
}

export class Game {
  readonly board = Array.from({ length: HEIGHT + HIDDEN_ROWS }, emptyRow);
  readonly next: Kind[] = [];
  active: Piece;
  held: Kind | null = null;
  canHold = true;
  over = false;
  score = 0;
  lines = 0;
  combo = -1;
  backToBack = false;
  // The view uses this to detect a fresh spawn even when two kinds match.
  turn = 0;

  private readonly bag: Bag;
  private fallTime = 0;
  private lockTime = 0;
  private resets = 0;
  private touchedSurface = false;
  private lowestY = 0;
  private lastKick: number | null = null;

  constructor(random: () => number = Math.random) {
    this.bag = new Bag(random);
    for (let i = 0; i < PREVIEW_COUNT; i++) this.next.push(this.bag.take());
    this.active = this.takeNext();
    this.spawn(this.active);
  }

  get level(): number {
    return 1 + Math.floor(this.lines / 10);
  }

  cellAt(x: number, y: number): Cell {
    return this.board[y + HIDDEN_ROWS]?.[x] ?? null;
  }

  private occupied(x: number, y: number): boolean {
    return x < 0 || x >= WIDTH || y < -HIDDEN_ROWS || y >= HEIGHT || this.cellAt(x, y) !== null;
  }

  fits(piece: Piece): boolean {
    return cells(piece).every(([x, y]) => !this.occupied(x, y));
  }

  get ghost(): Piece {
    let landing = this.active;
    while (this.fits({ ...landing, y: landing.y + 1 })) {
      landing = { ...landing, y: landing.y + 1 };
    }
    return landing;
  }

  private get grounded(): boolean {
    return !this.fits({ ...this.active, y: this.active.y + 1 });
  }

  move(dx: -1 | 1): boolean {
    const moved = this.tryMove({ ...this.active, x: this.active.x + dx });
    if (moved) {
      this.lastKick = null;
      this.lockAtResetLimit();
    }
    return moved;
  }

  rotate(direction: -1 | 1): boolean {
    const { kind, rotation, x, y } = this.active;
    const target = ((rotation + direction + 4) % 4) as Rotation;
    return kicks(kind, rotation, target).some(([dx, dy], index) => {
      if (!this.tryMove({ kind, rotation: target, x: x + dx, y: y - dy })) return false;
      this.lastKick = index;
      this.lockAtResetLimit();
      return true;
    });
  }

  private tryMove(piece: Piece): boolean {
    if (this.over || !this.fits(piece)) return false;
    this.touchedSurface ||= this.grounded;
    this.active = piece;
    if (piece.y > this.lowestY) {
      this.lowestY = piece.y;
      this.resets = 0;
      this.lockTime = 0;
    } else if (this.touchedSurface && this.resets < LOCK_RESETS) {
      this.resets++;
      this.lockTime = 0;
    }
    return true;
  }

  private lockAtResetLimit(): void {
    if (this.resets >= LOCK_RESETS && this.grounded) this.lock();
  }

  private stepDown(soft: boolean): boolean {
    const piece = { ...this.active, y: this.active.y + 1 };
    if (this.over || !this.fits(piece)) return false;
    this.active = piece;
    this.lastKick = null;
    if (piece.y > this.lowestY) {
      this.lowestY = piece.y;
      this.resets = 0;
      this.lockTime = 0;
    }
    if (soft) this.score++;
    return true;
  }

  softDrop(): void {
    this.stepDown(true);
    this.fallTime = 0;
    if (!this.over) this.lockAtResetLimit();
  }

  hardDrop(): void {
    if (this.over) return;
    const landing = this.ghost;
    const distance = landing.y - this.active.y;
    if (distance > 0) this.lastKick = null;
    this.score += distance * 2;
    this.active = landing;
    this.lock();
  }

  hold(): void {
    if (this.over || !this.canHold) return;
    const replacement = this.held;
    this.held = this.active.kind;
    this.canHold = false;
    this.spawn(replacement === null ? this.takeNext() : this.makePiece(replacement));
  }

  update(elapsed: number, soft = false): void {
    if (this.over || elapsed < 0 || !Number.isFinite(elapsed)) return;
    // Consume time up to the next drop or lock, including frame time after landing.
    while (!this.over) {
      if (this.grounded) {
        this.touchedSurface = true;
        this.fallTime = 0;
        const untilLock = this.resets >= LOCK_RESETS ? 0 : LOCK_DELAY - this.lockTime;
        if (elapsed < untilLock) {
          this.lockTime += elapsed;
          return;
        }
        elapsed -= untilLock;
        this.lock();
      } else {
        const naturalInterval = gravityInterval(this.level);
        const interval = soft ? naturalInterval / SOFT_DROP_MULTIPLIER : naturalInterval;
        const untilFall = Math.max(0, interval - this.fallTime);
        if (elapsed < untilFall) {
          this.fallTime += elapsed;
          return;
        }
        elapsed -= untilFall;
        this.fallTime = 0;
        this.stepDown(soft);
      }
    }
  }

  private makePiece(kind: Kind): Piece {
    return { kind, rotation: 0, x: 3, y: -2 };
  }

  private takeNext(): Piece {
    const kind = this.next.shift()!;
    this.next.push(this.bag.take());
    return this.makePiece(kind);
  }

  private spawn(piece: Piece): void {
    this.active = piece;
    this.turn++;
    this.fallTime = 0;
    this.lockTime = 0;
    this.resets = 0;
    this.touchedSurface = false;
    this.lowestY = piece.y;
    this.lastKick = null;
    // Check the entry position before descending into the visible field.
    if (!this.fits(piece)) {
      this.over = true;
    } else {
      this.stepDown(false);
    }
  }

  private spinType(): Spin {
    if (this.active.kind !== 'T' || this.lastKick === null) return 'none';
    const { x, y, rotation } = this.active;
    const corners = [
      this.occupied(x, y), this.occupied(x + 2, y),
      this.occupied(x + 2, y + 2), this.occupied(x, y + 2),
    ];
    if (corners.filter(Boolean).length < 3) return 'none';
    const frontFilled = corners[rotation] && corners[(rotation + 1) % 4];
    return frontFilled || this.lastKick === 4 ? 'full' : 'mini';
  }

  private lock(): void {
    const spin = this.spinType();
    const placed = cells(this.active);
    for (const [x, y] of placed) this.board[y + HIDDEN_ROWS][x] = this.active.kind;
    const remaining = this.board.filter(row => row.includes(null));
    const cleared = this.board.length - remaining.length;
    if (cleared) {
      this.board.splice(0, this.board.length, ...Array.from({ length: cleared }, emptyRow), ...remaining);
    }

    this.addPlacementScore(cleared, spin);
    this.canHold = true;
    if (placed.every(([, y]) => y < 0)) {
      this.over = true;
      return;
    }
    this.spawn(this.takeNext());
  }

  private addPlacementScore(cleared: number, spin: Spin): void {
    const table = spin === 'full' ? spinPoints : spin === 'mini' ? miniPoints : linePoints;
    const difficult = cleared === 4 || (cleared > 0 && spin !== 'none');
    const multiplier = difficult && this.backToBack ? 1.5 : 1;
    this.score += (table[cleared] ?? spinPoints[cleared]) * this.level * multiplier;
    if (cleared) {
      this.combo++;
      this.score += 50 * this.combo * this.level;
      this.backToBack = difficult;
    } else {
      this.combo = -1;
    }
    this.lines += cleared;
  }
}
