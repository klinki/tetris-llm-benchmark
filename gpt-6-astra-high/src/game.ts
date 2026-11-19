import { cells, kicks, SevenBag, type Piece, type PieceType, type Rotation } from './pieces.js';

export const WIDTH = 10;
export const HEIGHT = 40;
export const HIDDEN = 20;
export const LOCK_DELAY = 500;
export const MAX_LOCK_RESETS = 15;
export type Board = (PieceType | null)[][];
export type Status = 'ready' | 'playing' | 'paused' | 'over';
type Spin = 'none' | 'mini' | 'full';

export class Game {
  board: Board = [];
  active: Piece | null = null;
  queue: PieceType[] = [];
  held: PieceType | null = null;
  canHold = true;
  status: Status = 'ready';
  score = 0;
  lines = 0;
  combo = -1;
  backToBack = false;
  pieces = 0;
  elapsed = 0;
  lastClear = '';
  lockTime = 0;
  lockResets = 0;
  private gravityTime = 0;
  private lastRotation: { kick: number } | null = null;
  private bag: SevenBag;

  constructor(private readonly random: () => number = Math.random) {
    this.bag = new SevenBag(random);
    this.reset();
  }

  get level(): number { return Math.floor(this.lines / 10) + 1; }
  get gravityInterval(): number {
    const level = Math.min(this.level, 20);
    return Math.max(1000 / 1200, 1000 * (0.8 - (level - 1) * 0.007) ** (level - 1));
  }

  reset(): void {
    this.board = Array.from({ length: HEIGHT }, () => Array<PieceType | null>(WIDTH).fill(null));
    this.active = null;
    this.queue = [];
    this.held = null;
    this.canHold = true;
    this.status = 'ready';
    this.score = this.lines = this.pieces = this.elapsed = 0;
    this.combo = -1;
    this.backToBack = false;
    this.lastClear = '';
    this.lockTime = this.lockResets = this.gravityTime = 0;
    this.lastRotation = null;
    this.bag = new SevenBag(this.random);
    this.fillQueue();
  }

  start(): void {
    if (this.status === 'paused') { this.status = 'playing'; return; }
    if (this.status === 'playing') return;
    this.reset();
    this.status = 'playing';
    this.spawn();
  }

  pause(): void { if (this.status === 'playing') this.status = 'paused'; }

  fits(piece: Piece): boolean {
    return cells(piece).every(([x, y]) => x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT && !this.board[y]![x]);
  }

  get grounded(): boolean {
    return !!this.active && !this.fits({ ...this.active, y: this.active.y + 1 });
  }

  ghost(): Piece | null {
    if (!this.active) return null;
    const ghost = { ...this.active };
    while (this.fits({ ...ghost, y: ghost.y + 1 })) ghost.y++;
    return ghost;
  }

  move(direction: -1 | 1): boolean {
    if (this.status !== 'playing' || !this.active) return false;
    const next = { ...this.active, x: this.active.x + direction };
    if (!this.fits(next)) return false;
    this.resetLock(this.grounded);
    this.active = next;
    this.lastRotation = null;
    return true;
  }

  rotate(direction: -1 | 1): boolean {
    if (this.status !== 'playing' || !this.active) return false;
    const rotation = ((this.active.rotation + direction + 4) % 4) as Rotation;
    const tests = kicks(this.active.type, this.active.rotation, rotation);
    for (let i = 0; i < tests.length; i++) {
      const [dx, dy] = tests[i]!;
      const next = { ...this.active, rotation, x: this.active.x + dx, y: this.active.y - dy };
      if (!this.fits(next)) continue;
      this.resetLock(this.grounded);
      this.active = next;
      this.lastRotation = { kick: i };
      return true;
    }
    return false;
  }

  softDrop(): boolean {
    if (this.status !== 'playing') return false;
    if (!this.fall()) return false;
    this.score++;
    this.gravityTime = 0;
    return true;
  }

  hardDrop(): void {
    if (this.status !== 'playing' || !this.active) return;
    const ghost = this.ghost()!;
    const distance = ghost.y - this.active.y;
    this.score += distance * 2;
    if (distance > 0) this.lastRotation = null;
    this.active = ghost;
    this.lock();
  }

  hold(): void {
    if (this.status !== 'playing' || !this.active || !this.canHold) return;
    const outgoing = this.active.type;
    const incoming = this.held;
    this.held = outgoing;
    this.spawn(incoming ?? undefined);
    this.canHold = false;
  }

  update(milliseconds: number, softDropping = false): void {
    if (this.status !== 'playing' || !Number.isFinite(milliseconds) || milliseconds <= 0) return;
    // Small deterministic steps keep landing and lock timing independent of frame rate.
    let remaining = milliseconds;
    while (remaining > 0 && this.status === 'playing') {
      const step = Math.min(10, remaining);
      remaining -= step;
      this.elapsed += step;
      const wasGrounded = this.grounded;
      const interval = this.gravityInterval / (softDropping ? 20 : 1);
      this.gravityTime += step;
      while (this.gravityTime >= interval) {
        this.gravityTime -= interval;
        if (!this.fall()) { this.gravityTime = 0; break; }
        if (softDropping) this.score++;
      }
      if (wasGrounded && this.grounded) this.lockTime += step;
      if (this.grounded && this.lockTime >= LOCK_DELAY) this.lock();
    }
  }

  private fillQueue(): void { while (this.queue.length < 5) this.queue.push(this.bag.next()); }

  private spawn(type?: PieceType): void {
    this.active = { type: type ?? this.queue.shift()!, x: 3, y: HIDDEN - 2, rotation: 0 };
    this.fillQueue();
    this.gravityTime = this.lockTime = this.lockResets = 0;
    this.lastRotation = null;
    if (!this.fits(this.active)) { this.status = 'over'; return; }
    // Enter the visible playfield immediately when there is room.
    if (this.fits({ ...this.active, y: this.active.y + 1 })) this.active.y++;
  }

  private fall(): boolean {
    if (!this.active || !this.fits({ ...this.active, y: this.active.y + 1 })) return false;
    this.active.y++;
    this.lastRotation = null;
    return true;
  }

  private resetLock(wasGrounded: boolean): void {
    if (wasGrounded && this.lockResets < MAX_LOCK_RESETS) {
      this.lockTime = 0;
      this.lockResets++;
    }
  }

  private spin(): Spin {
    if (!this.active || this.active.type !== 'T' || !this.lastRotation) return 'none';
    const { x, y, rotation } = this.active;
    const occupied = (dx: number, dy: number): boolean => {
      const px = x + dx, py = y + dy;
      return px < 0 || px >= WIDTH || py < 0 || py >= HEIGHT || !!this.board[py]![px];
    };
    const corners = [occupied(0, 0), occupied(2, 0), occupied(2, 2), occupied(0, 2)];
    if (corners.filter(Boolean).length < 3) return 'none';
    return (corners[rotation] && corners[(rotation + 1) % 4]) || this.lastRotation.kick === 4 ? 'full' : 'mini';
  }

  private lock(): void {
    if (!this.active) return;
    const spin = this.spin();
    const occupied = cells(this.active);
    for (const [x, y] of occupied) this.board[y]![x] = this.active.type;
    this.pieces++;
    const remaining = this.board.filter(row => row.some(cell => !cell));
    const cleared = HEIGHT - remaining.length;
    while (remaining.length < HEIGHT) remaining.unshift(Array<PieceType | null>(WIDTH).fill(null));
    this.board = remaining;
    this.award(cleared, spin);
    // Lock-out applies to pieces entirely above the visible field, unless a clear rescues them.
    if (!cleared && occupied.every(([, y]) => y < HIDDEN)) { this.status = 'over'; return; }
    this.canHold = true;
    this.spawn();
  }

  private award(count: number, spin: Spin): void {
    const level = this.level;
    const difficult = count > 0 && (count === 4 || spin !== 'none');
    const chained = difficult && this.backToBack;
    const table = spin === 'full' ? [400, 800, 1200, 1600] : spin === 'mini' ? [100, 200, 400] : [0, 100, 300, 500, 800];
    this.score += (table[count] ?? 0) * level * (chained ? 1.5 : 1);
    this.combo = count > 0 ? this.combo + 1 : -1;
    if (this.combo > 0) this.score += 50 * this.combo * level;
    if (count > 0) this.backToBack = difficult;
    const names = ['', 'SINGLE', 'DOUBLE', 'TRIPLE', 'TETRIS'];
    this.lastClear = [chained ? 'BACK-TO-BACK' : '', spin === 'full' ? 'T-SPIN' : spin === 'mini' ? 'MINI T-SPIN' : '', names[count], this.combo > 0 ? `${this.combo} COMBO` : ''].filter(Boolean).join(' · ');
    if (count > 0 && this.board.every(row => row.every(cell => !cell))) {
      this.score += (count === 4 && chained ? 3200 : [0, 800, 1200, 1800, 2000][count]!) * level;
      this.lastClear = 'PERFECT CLEAR';
    }
    this.lines += count;
  }
}
