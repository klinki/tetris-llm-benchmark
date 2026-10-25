import { Bag, cells, kicks } from './pieces.js';
import type { Kind, Piece, Rotation } from './pieces.js';

export const WIDTH = 10;
export const HEIGHT = 20;
export const HIDDEN = 20;
export const LOCK_DELAY = 500;
export const MAX_LOCK_RESETS = 15;
export type Cell = Kind | null;
export type Phase = 'ready' | 'playing' | 'paused' | 'over';
export type Spin = 'none' | 'mini' | 'full';
export interface ClearEvent {
  id: number;
  rows: number[];
  lines: number;
  label: string;
  points: number;
  combo: number;
  backToBack: boolean;
  perfect: boolean;
}

/** Pure game state. No DOM, timers, storage, or rendering dependencies. */
export class Game {
  board: Cell[][] = this.emptyBoard();
  active: Piece | null = null;
  queue: Kind[] = [];
  held: Kind | null = null;
  canHold = true;
  phase: Phase = 'ready';
  score = 0;
  lines = 0;
  level = 1;
  elapsed = 0;
  pieces = 0;
  combo = -1;
  backToBack = false;
  event: ClearEvent | null = null;
  revision = 0;
  private bag: Bag;
  private gravityTime = 0;
  private lockTime = 0;
  private lockResets = 0;
  private touchedGround = false;
  private lastRotation: { kick: number } | null = null;
  private eventId = 0;

  constructor(private readonly random: () => number = Math.random) {
    this.bag = new Bag(random);
    this.fillQueue();
  }
  private emptyBoard(): Cell[][] {
    return Array.from({ length: HEIGHT + HIDDEN }, () => Array<Cell>(WIDTH).fill(null));
  }
  private fillQueue(): void {
    while (this.queue.length < 7) this.queue.push(this.bag.next());
  }
  start(): void {
    this.board = this.emptyBoard();
    this.bag = new Bag(this.random);
    this.queue = [];
    this.fillQueue();
    this.held = null;
    this.canHold = true;
    this.score = this.lines = this.elapsed = this.pieces = 0;
    this.level = 1;
    this.combo = -1;
    this.backToBack = false;
    this.event = null;
    this.phase = 'playing';
    this.spawn(this.takeNext());
  }
  pause(): void {
    if (this.phase === 'playing') this.phase = 'paused';
    else if (this.phase === 'paused') this.phase = 'playing';
    this.revision++;
  }
  /** Tetris Worlds marathon curve, capped at 20 cells per 60Hz frame. */
  get gravityInterval(): number {
    const level = Math.min(this.level, 20);
    return Math.max(1000 / 1200, Math.pow(0.8 - (level - 1) * 0.007, level - 1) * 1000);
  }
  get grounded(): boolean {
    return this.active !== null && !this.fits({ ...this.active, y: this.active.y + 1 });
  }
  get lockProgress(): number { return this.lockTime / LOCK_DELAY; }
  cell(x: number, y: number): Cell {
    return this.board[y + HIDDEN]?.[x] ?? null;
  }
  fits(piece: Piece): boolean {
    return cells(piece).every(([x, y]) => x >= 0 && x < WIDTH && y >= -HIDDEN && y < HEIGHT && !this.cell(x, y));
  }
  ghost(): Piece | null {
    if (!this.active) return null;
    const ghost = { ...this.active };
    while (this.fits({ ...ghost, y: ghost.y + 1 })) ghost.y++;
    return ghost;
  }
  private takeNext(): Kind {
    const kind = this.queue.shift()!;
    this.fillQueue();
    return kind;
  }
  private spawn(kind: Kind): void {
    this.active = { kind, rotation: 0, x: 3, y: -1 };
    this.gravityTime = this.lockTime = this.lockResets = 0;
    this.touchedGround = false;
    this.lastRotation = null;
    if (!this.fits(this.active)) this.phase = 'over';
    else if (this.fits({ ...this.active, y: 0 })) this.active.y = 0;
    this.revision++;
  }
  private adjustLock(wasGrounded: boolean): void {
    if ((wasGrounded || this.touchedGround) && this.lockResets < MAX_LOCK_RESETS) {
      this.lockTime = 0;
      this.lockResets++;
    }
    if (this.grounded) this.touchedGround = true;
  }
  move(direction: -1 | 1): boolean {
    if (this.phase !== 'playing' || !this.active) return false;
    const next = { ...this.active, x: this.active.x + direction };
    if (!this.fits(next)) return false;
    const grounded = this.grounded;
    this.active = next;
    this.lastRotation = null;
    this.adjustLock(grounded);
    this.revision++;
    return true;
  }
  rotate(direction: -1 | 1): boolean {
    if (this.phase !== 'playing' || !this.active) return false;
    const from = this.active.rotation;
    const to = ((from + direction + 4) % 4) as Rotation;
    const grounded = this.grounded;
    const offsets = kicks(this.active.kind, from, to);
    for (let i = 0; i < offsets.length; i++) {
      const [dx, dy] = offsets[i]!;
      const next = { ...this.active, rotation: to, x: this.active.x + dx, y: this.active.y - dy };
      if (!this.fits(next)) continue;
      this.active = next;
      this.lastRotation = { kick: i };
      this.adjustLock(grounded);
      this.revision++;
      return true;
    }
    return false;
  }
  softDrop(): boolean {
    if (!this.descend()) return false;
    this.score++;
    this.gravityTime = 0;
    return true;
  }
  private descend(): boolean {
    if (this.phase !== 'playing' || !this.active) return false;
    const next = { ...this.active, y: this.active.y + 1 };
    if (!this.fits(next)) return false;
    this.active = next;
    this.lastRotation = null;
    // Before the move-reset limit, arriving on a lower surface gets a full delay.
    if (this.lockResets < MAX_LOCK_RESETS) this.lockTime = 0;
    this.revision++;
    return true;
  }
  hardDrop(): boolean {
    if (this.phase !== 'playing' || !this.active) return false;
    const ghost = this.ghost()!;
    const distance = ghost.y - this.active.y;
    this.score += distance * 2;
    if (distance > 0) this.lastRotation = null;
    this.active = ghost;
    this.lock();
    return true;
  }
  hold(): boolean {
    if (this.phase !== 'playing' || !this.active || !this.canHold) return false;
    const previous = this.held;
    this.held = this.active.kind;
    this.spawn(previous ?? this.takeNext());
    this.canHold = false;
    return true;
  }
  /** Substeps keep gravity and lock timing independent of the display's frame rate. */
  update(milliseconds: number): void {
    if (this.phase !== 'playing' || !Number.isFinite(milliseconds) || milliseconds <= 0) return;
    let remaining = milliseconds;
    while (remaining > 0 && this.phase === 'playing') {
      const step = Math.min(remaining, 1000 / 120);
      remaining -= step;
      this.elapsed += step;
      this.gravityTime += step;
      while (this.gravityTime + 1e-7 >= this.gravityInterval) {
        this.gravityTime -= this.gravityInterval;
        if (!this.descend()) { this.gravityTime = 0; break; }
      }
      if (this.grounded) {
        this.touchedGround = true;
        this.lockTime += step;
        if (this.lockTime + 1e-7 >= LOCK_DELAY) this.lock();
      }
    }
  }
  private spin(): Spin {
    if (this.active?.kind !== 'T' || !this.lastRotation) return 'none';
    const { x, y, rotation } = this.active;
    const occupied = (dx: number, dy: number): boolean => {
      const cx = x + dx, cy = y + dy;
      return cx < 0 || cx >= WIDTH || cy >= HEIGHT || cy < -HIDDEN || !!this.cell(cx, cy);
    };
    const corners = [occupied(0, 0), occupied(2, 0), occupied(2, 2), occupied(0, 2)];
    if (corners.filter(Boolean).length < 3) return 'none';
    const fronts: Record<Rotation, readonly [number, number]> = { 0: [0, 1], 1: [1, 2], 2: [2, 3], 3: [3, 0] };
    const [a, b] = fronts[rotation];
    return (corners[a] && corners[b]) || this.lastRotation.kick === 4 ? 'full' : 'mini';
  }
  private lock(): void {
    if (!this.active) return;
    const positions = cells(this.active);
    const spin = this.spin();
    for (const [x, y] of positions) this.board[y + HIDDEN]![x] = this.active.kind;
    this.pieces++;
    // Lock-out applies when all four blocks lock above the visible matrix.
    if (positions.every(([, y]) => y < 0)) {
      this.phase = 'over';
      this.revision++;
      return;
    }
    const rows: number[] = [];
    this.board.forEach((row, index) => { if (row.every(Boolean)) rows.push(index - HIDDEN); });
    const remaining = this.board.filter(row => !row.every(Boolean));
    while (remaining.length < HEIGHT + HIDDEN) remaining.unshift(Array<Cell>(WIDTH).fill(null));
    this.board = remaining;
    this.award(rows, spin);
    this.canHold = true;
    this.spawn(this.takeNext());
  }
  private award(rows: number[], spin: Spin): void {
    const count = rows.length;
    const difficult = count > 0 && (count === 4 || spin !== 'none');
    const b2b = difficult && this.backToBack;
    let base = spin === 'full' ? [400, 800, 1200, 1600][count]! : spin === 'mini' ? [100, 200, 400][count]! : [0, 100, 300, 500, 800][count]!;
    if (b2b) base *= 1.5;
    this.combo = count ? this.combo + 1 : -1;
    const perfect = count > 0 && this.board.every(row => row.every(cell => cell === null));
    const perfectBonus = perfect ? (count === 4 && b2b ? 3200 : [0, 800, 1200, 1800, 2000][count]!) : 0;
    const points = (base + Math.max(0, this.combo) * 50 + perfectBonus) * this.level;
    this.score += points;
    if (count) this.backToBack = difficult;
    this.lines += count;
    this.level = Math.floor(this.lines / 10) + 1;
    const clearName = ['', 'SINGLE', 'DOUBLE', 'TRIPLE', 'TETRIS'][count]!;
    const label = spin === 'none' ? clearName : `${spin === 'mini' ? 'MINI ' : ''}T-SPIN${count ? ' ' + clearName : ''}`;
    this.event = { id: ++this.eventId, rows, lines: count, label, points, combo: this.combo, backToBack: b2b, perfect };
  }
}
