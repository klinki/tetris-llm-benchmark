import { cells, kicks, SevenBag, type Piece, type PieceType, type Rotation } from './pieces.js';
import { scoreClear, type Spin } from './scoring.js';

export const WIDTH = 10;
export const HEIGHT = 20;
export const HIDDEN_ROWS = 20;
export const TOTAL_ROWS = HEIGHT + HIDDEN_ROWS;
export const LOCK_DELAY = 500;
export const MAX_LOCK_RESETS = 15;
export const MAX_LEVEL = 15;
export type Cell = PieceType | null;
export type Status = 'ready' | 'playing' | 'paused' | 'over';
export const emptyBoard = (): Cell[][] => Array.from({ length: TOTAL_ROWS }, () => Array<Cell>(WIDTH).fill(null));

export class Game {
  board = emptyBoard();
  active: Piece | null = null;
  queue: PieceType[] = [];
  held: PieceType | null = null;
  canHold = true;
  status: Status = 'ready';
  score = 0;
  lines = 0;
  level = 1;
  combo = -1;
  backToBack = false;
  elapsed = 0;
  piecesPlaced = 0;
  revision = 0;
  lastClear = { id: 0, label: '', points: 0, combo: -1, rows: [] as number[] };

  private bag: SevenBag;
  private fallTime = 0;
  private lockTime = 0;
  private lockResets = 0;
  private touchedGround = false;
  private rotationKick: number | null = null;

  constructor(private readonly random: () => number = Math.random) {
    this.bag = new SevenBag(random);
  }

  get gravityMs(): number {
    return 1000 * (0.8 - (this.level - 1) * 0.007) ** (this.level - 1);
  }

  get grounded(): boolean {
    return this.active !== null && this.collides({ ...this.active, y: this.active.y + 1 });
  }

  start(startLevel = 1): void {
    this.board = emptyBoard();
    this.bag = new SevenBag(this.random);
    this.queue = [];
    this.held = null;
    this.canHold = true;
    this.score = this.lines = this.elapsed = this.piecesPlaced = 0;
    this.level = Math.max(1, Math.min(MAX_LEVEL, Math.floor(startLevel) || 1));
    this.combo = -1;
    this.backToBack = false;
    this.lastClear = { id: 0, label: '', points: 0, combo: -1, rows: [] };
    this.status = 'playing';
    this.spawn(this.takeNext());
  }

  pause(): void {
    if (this.status === 'playing') this.status = 'paused';
    else if (this.status === 'paused') this.status = 'playing';
    this.revision++;
  }

  collides(piece: Piece): boolean {
    return cells(piece).some(([x, y]) =>
      x < 0 || x >= WIDTH || y < 0 || y >= TOTAL_ROWS || this.board[y][x] !== null);
  }

  ghost(): Piece | null {
    if (!this.active) return null;
    const ghost = { ...this.active };
    while (!this.collides({ ...ghost, y: ghost.y + 1 })) ghost.y++;
    return ghost;
  }

  move(direction: -1 | 1): boolean {
    if (this.status !== 'playing' || !this.active) return false;
    const next = { ...this.active, x: this.active.x + direction };
    if (this.collides(next)) return false;
    this.trackGround();
    this.active = next;
    this.rotationKick = null;
    this.resetLock();
    this.revision++;
    return true;
  }

  rotate(direction: -1 | 1): boolean {
    if (this.status !== 'playing' || !this.active) return false;
    const rotation = ((this.active.rotation + direction + 4) % 4) as Rotation;
    const offsets = kicks(this.active.type, this.active.rotation, rotation);
    for (let i = 0; i < offsets.length; i++) {
      const [dx, dy] = offsets[i];
      const next = { ...this.active, rotation, x: this.active.x + dx, y: this.active.y - dy };
      if (this.collides(next)) continue;
      this.trackGround();
      this.active = next;
      this.rotationKick = i;
      this.resetLock();
      this.revision++;
      return true;
    }
    return false;
  }

  softDrop(): boolean {
    if (this.status !== 'playing') return false;
    if (!this.stepDown()) return false;
    this.score++;
    this.fallTime = 0;
    return true;
  }

  hardDrop(): void {
    if (this.status !== 'playing' || !this.active) return;
    const ghost = this.ghost()!;
    const distance = ghost.y - this.active.y;
    this.score += distance * 2;
    if (distance > 0) this.rotationKick = null;
    this.active = ghost;
    this.lock();
  }

  hold(): boolean {
    if (this.status !== 'playing' || !this.active || !this.canHold) return false;
    const incoming = this.held ?? this.takeNext();
    this.held = this.active.type;
    this.canHold = false;
    this.spawn(incoming);
    return true;
  }

  // Consume time up to the next fall or lock event, so landing midway through a
  // frame gets exactly 500ms of lock delay, independent of the display refresh rate.
  tick(deltaMs: number, softDropping = false): void {
    if (this.status !== 'playing' || !Number.isFinite(deltaMs) || deltaMs <= 0) return;
    let remaining = Math.min(deltaMs, 1000);
    while (remaining > 0 && this.status === 'playing') {
      this.trackGround();
      if (this.grounded) {
        const step = Math.min(remaining, LOCK_DELAY - this.lockTime);
        this.lockTime += step;
        this.elapsed += step;
        remaining -= step;
        this.fallTime = 0;
        if (this.lockTime >= LOCK_DELAY) this.lock();
      } else {
        const interval = softDropping ? this.gravityMs / 20 : this.gravityMs;
        const step = Math.min(remaining, Math.max(0, interval - this.fallTime));
        this.fallTime += step;
        this.elapsed += step;
        remaining -= step;
        if (this.fallTime >= interval) {
          this.fallTime = 0;
          if (this.stepDown() && softDropping) this.score++;
        }
      }
    }
  }

  private stepDown(): boolean {
    if (!this.active || this.grounded) return false;
    this.active.y++;
    this.rotationKick = null;
    this.trackGround();
    this.revision++;
    return true;
  }

  private trackGround(): void {
    if (this.grounded) this.touchedGround = true;
  }

  private resetLock(): void {
    if (this.touchedGround && this.lockResets < MAX_LOCK_RESETS) {
      this.lockTime = 0;
      this.lockResets++;
    }
    this.trackGround();
  }

  private takeNext(): PieceType {
    while (this.queue.length < 6) this.queue.push(this.bag.next());
    return this.queue.shift()!;
  }

  private spawn(type: PieceType): void {
    this.active = { type, rotation: 0, x: 3, y: HIDDEN_ROWS - 2 };
    this.fallTime = this.lockTime = this.lockResets = 0;
    this.touchedGround = false;
    this.rotationKick = null;
    if (this.collides(this.active)) {
      this.status = 'over';
      this.active = null;
    } else {
      // Guideline entry: start in the buffer, then immediately step toward view.
      if (!this.collides({ ...this.active, y: this.active.y + 1 })) this.active.y++;
      this.trackGround();
    }
    this.revision++;
  }

  private detectSpin(): Spin {
    if (!this.active || this.active.type !== 'T' || this.rotationKick === null) return 'none';
    const { x, y, rotation } = this.active;
    const occupied = (dx: number, dy: number): boolean => {
      const cx = x + dx, cy = y + dy;
      return cx < 0 || cx >= WIDTH || cy < 0 || cy >= TOTAL_ROWS || this.board[cy][cx] !== null;
    };
    const corners = [occupied(0, 0), occupied(2, 0), occupied(2, 2), occupied(0, 2)];
    if (corners.filter(Boolean).length < 3) return 'none';
    return (corners[rotation] && corners[(rotation + 1) % 4]) || this.rotationKick === 4 ? 'full' : 'mini';
  }

  private lock(): void {
    if (!this.active) return;
    const spin = this.detectSpin();
    const blocks = cells(this.active);
    for (const [x, y] of blocks) this.board[y][x] = this.active.type;
    this.piecesPlaced++;
    const rows: number[] = [];
    this.board.forEach((row, y) => { if (row.every(cell => cell !== null)) rows.push(y); });
    const remaining = this.board.filter((_, y) => !rows.includes(y));
    this.board = [...Array.from({ length: rows.length }, () => Array<Cell>(WIDTH).fill(null)), ...remaining];
    const perfect = rows.length > 0 && this.board.every(row => row.every(cell => cell === null));
    const result = scoreClear(rows.length, spin, this.level, this.combo, this.backToBack, perfect);
    this.score += result.points;
    this.combo = result.combo;
    this.backToBack = result.backToBack;
    this.lines += rows.length;
    this.level = Math.min(MAX_LEVEL, Math.max(this.level, 1 + Math.floor(this.lines / 10)));
    if (result.label) this.lastClear = { id: this.lastClear.id + 1, ...result, rows };
    if (blocks.every(([, y]) => y < HIDDEN_ROWS)) {
      this.status = 'over';
      this.active = null;
      this.revision++;
      return;
    }
    this.canHold = true;
    this.spawn(this.takeNext());
  }
}
