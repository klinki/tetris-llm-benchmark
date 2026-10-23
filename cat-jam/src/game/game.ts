import {
  TICK_MS,
  LOCK_DELAY_MS,
  MAX_LOCK_RESETS,
  GRAVITY_FRAMES,
  SOFT_DROP_POINTS,
  HARD_DROP_POINTS,
} from './constants.js';
import { Board } from './board.js';
import { Bag } from './bag.js';
import { Queue } from './queue.js';
import { SHAPES, SPAWN_Y, spawnX, kicksFor, type Cell, type PieceType, type Rotation } from './pieces.js';
import { lineClearScore, levelForLines } from './scoring.js';

export type GameState = 'playing' | 'gameover';

export interface ActivePiece {
  type: PieceType;
  rotation: Rotation;
  x: number;
  y: number;
}

/**
 * Guideline Tetris game state machine. Pure logic with no rendering or input
 * dependencies, so it can be driven headlessly from tests.
 */
export class Game {
  readonly board = new Board();
  private readonly bag: Bag;
  private readonly queue: Queue;

  active: ActivePiece | null = null;
  holdPiece: PieceType | null = null;
  canHold = true;
  state: GameState = 'playing';

  score = 0;
  lines = 0;
  level = 1;
  combo = -1;
  time = 0;

  private softDrop = false;
  private dropTimer = 0;
  private lockTimer = 0;
  private lockResets = 0;

  constructor(rng?: () => number) {
    this.bag = new Bag(rng);
    this.queue = new Queue(this.bag);
    this.spawnFromQueue();
  }

  // --- simulation -----------------------------------------------------------

  update(dtMs: number): void {
    if (this.state !== 'playing' || !this.active) return;
    this.time += dtMs;

    const interval = this.softDrop ? this.softDropInterval() : this.gravityInterval();
    this.dropTimer += dtMs;
    while (this.dropTimer >= interval) {
      this.dropTimer -= interval;
      this.stepDown();
    }

    if (this.isGrounded()) {
      this.lockTimer += dtMs;
      if (this.lockTimer >= LOCK_DELAY_MS) this.lockPiece();
    } else {
      this.lockTimer = 0;
    }
  }

  moveLeft(): boolean {
    return this.tryMove(-1, 0, true);
  }

  moveRight(): boolean {
    return this.tryMove(1, 0, true);
  }

  rotateClockwise(): boolean {
    return this.tryRotate(1);
  }

  rotateCounterClockwise(): boolean {
    return this.tryRotate(-1);
  }

  setSoftDrop(active: boolean): void {
    this.softDrop = active;
    if (active) this.dropTimer = 0;
  }

  hardDrop(): void {
    if (this.state !== 'playing' || !this.active) return;
    let distance = 0;
    while (!this.board.collides(this.shape(), this.active.x, this.active.y + 1)) {
      this.active.y += 1;
      distance++;
    }
    this.score += distance * HARD_DROP_POINTS;
    this.lockPiece();
  }

  hold(): void {
    if (this.state !== 'playing' || !this.active || !this.canHold) return;
    const current = this.active.type;
    const held = this.holdPiece;
    this.holdPiece = current;
    const next = held ?? this.queue.shift();
    if (!this.spawn(next)) return;
    this.canHold = false;
    this.resetLockTimer();
  }

  restart(): void {
    this.board.clear();
    this.bag.reset();
    this.queue.reset();
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.combo = -1;
    this.time = 0;
    this.holdPiece = null;
    this.canHold = true;
    this.softDrop = false;
    this.dropTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.state = 'playing';
    this.spawnFromQueue();
  }

  /** Upcoming pieces, used by the renderer. */
  nextPieces(): PieceType[] {
    return this.queue.snapshot();
  }

  /** Row where the active piece would land if dropped straight down. */
  ghostY(): number {
    if (!this.active) return 0;
    let y = this.active.y;
    while (!this.board.collides(this.shape(), this.active.x, y + 1)) y++;
    return y;
  }

  // --- internals ------------------------------------------------------------

  private shape(): Cell[] {
    return SHAPES[this.active!.type][this.active!.rotation];
  }

  private tryMove(dx: number, dy: number, manual: boolean): boolean {
    if (this.state !== 'playing' || !this.active) return false;
    const nx = this.active.x + dx;
    const ny = this.active.y + dy;
    if (this.board.collides(this.shape(), nx, ny)) return false;
    this.active.x = nx;
    this.active.y = ny;
    if (manual) this.resetLockTimer();
    return true;
  }

  private tryRotate(direction: 1 | -1): boolean {
    if (this.state !== 'playing' || !this.active || this.active.type === 'O') return false;
    const from = this.active.rotation;
    const to = (((from + direction) % 4) + 4) % 4 as Rotation;
    const kicks = kicksFor(this.active.type, from, to);
    for (const [dx, dyUp] of kicks) {
      const dy = -dyUp; // SRS tables use +Y up; the board uses +Y down.
      const nx = this.active.x + dx;
      const ny = this.active.y + dy;
      if (!this.board.collides(SHAPES[this.active.type][to], nx, ny)) {
        this.active.rotation = to;
        this.active.x = nx;
        this.active.y = ny;
        this.resetLockTimer();
        return true;
      }
    }
    return false;
  }

  private stepDown(): void {
    if (this.state !== 'playing' || !this.active) return;
    if (this.tryMove(0, 1, false) && this.softDrop) {
      this.score += SOFT_DROP_POINTS;
    }
  }

  private isGrounded(): boolean {
    if (!this.active) return false;
    return this.board.collides(this.shape(), this.active.x, this.active.y + 1);
  }

  private resetLockTimer(): void {
    if (!this.isGrounded()) return;
    if (this.lockResets >= MAX_LOCK_RESETS) return;
    this.lockResets++;
    this.lockTimer = 0;
  }

  private spawnFromQueue(): void {
    const type = this.queue.shift();
    if (!this.spawn(type)) return;
    this.canHold = true;
  }

  /** Places `type` at its spawn position. False when the spawn is blocked. */
  private spawn(type: PieceType): boolean {
    this.active = { type, rotation: 0, x: spawnX(type), y: SPAWN_Y };
    this.dropTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    if (this.board.collides(SHAPES[type][0], this.active.x, this.active.y)) {
      this.state = 'gameover';
      return false;
    }
    return true;
  }

  private lockPiece(): void {
    if (this.state !== 'playing' || !this.active) return;
    const { type } = this.active;
    const lockedAboveField = this.board.lock(type, this.shape(), this.active.x, this.active.y);
    const cleared = this.board.clearLines();
    this.applyLineScore(cleared.length);
    this.lines += cleared.length;
    this.level = levelForLines(this.lines);
    this.active = null;

    if (lockedAboveField) {
      this.state = 'gameover';
      return;
    }
    this.spawnFromQueue();
  }

  private applyLineScore(count: number): void {
    if (count <= 0) {
      this.combo = -1;
      return;
    }
    this.combo += 1;
    this.score += lineClearScore(count, this.level, this.combo);
  }

  private gravityInterval(): number {
    const frames = GRAVITY_FRAMES[Math.min(this.level, GRAVITY_FRAMES.length) - 1];
    return frames * TICK_MS;
  }

  private softDropInterval(): number {
    return Math.max(1, this.gravityInterval() / 20);
  }
}
