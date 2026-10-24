import { boxSize, cells, kickTests, type Offset, type PieceType, type Rotation } from './pieces.js';
import { BagRandomizer, type Randomizer } from './random.js';

export const COLS = 10;
/** Rows above the visible field where pieces spawn. */
export const HIDDEN_ROWS = 2;
export const ROWS = HIDDEN_ROWS + 20;
export const NEXT_COUNT = 5;

const LOCK_DELAY = 0.5;
const MAX_LOCK_RESETS = 15;
const SOFT_DROP_ROW_TIME = 0.05;
const MAX_LEVEL = 20;

const LINE_SCORES = [0, 100, 300, 500, 800];
const TSPIN_SCORES = [400, 800, 1200, 1600];
const MINI_TSPIN_SCORES = [100, 200, 400];
const PERFECT_CLEAR_SCORES = [800, 1200, 1800, 2000];
const CLEAR_NAMES = ['', 'SINGLE', 'DOUBLE', 'TRIPLE', 'TETRIS'];

// T piece 3x3 box: centre is (1, 1). The four diagonal corners, and the two on the side
// the T is pointing towards for each rotation state.
const CORNERS: Offset[] = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
const FRONT_CORNERS: Offset[][] = [
  [[-1, -1], [1, -1]],
  [[1, -1], [1, 1]],
  [[-1, 1], [1, 1]],
  [[-1, -1], [-1, 1]],
];

export type Cell = PieceType | null;

export interface ActivePiece {
  type: PieceType;
  rot: Rotation;
  x: number;
  y: number;
}

type Spin = 'none' | 'mini' | 'full';

const emptyRow = (): Cell[] => Array<Cell>(COLS).fill(null);

export class Game {
  readonly board: Cell[][];
  readonly queue: PieceType[] = [];
  current: ActivePiece;
  held: PieceType | null = null;
  canHold = true;
  score = 0;
  lines = 0;
  /** Number of consecutive clearing locks minus one; -1 means no active combo. */
  combo = -1;
  backToBack = false;
  over = false;
  softDropping = false;
  /** Label of the most recent scoring event, e.g. "T-SPIN DOUBLE". */
  lastEvent = '';

  private readonly random: Randomizer;
  private gravityTimer = 0;
  private lockTimer = 0;
  private lockResets = 0;
  private lowestY = 0;
  private lastMoveWasRotation = false;
  private lastKick = 0;

  constructor(random: Randomizer = new BagRandomizer()) {
    this.random = random;
    this.board = Array.from({ length: ROWS }, emptyRow);
    for (let i = 0; i < NEXT_COUNT; i++) this.queue.push(this.random.next());
    this.current = this.spawn(this.takeNext());
  }

  level(): number {
    return Math.min(Math.floor(this.lines / 10) + 1, MAX_LEVEL);
  }

  /** Seconds per row of gravity: (0.8 - (level - 1) * 0.007) ^ (level - 1). */
  gravityRowTime(): number {
    const level = this.level();
    return Math.pow(0.8 - (level - 1) * 0.007, level - 1);
  }

  /** Row the current piece would land on if hard dropped. */
  ghostY(): number {
    let y = this.current.y;
    while (!this.collides({ ...this.current, y: y + 1 })) y++;
    return y;
  }

  update(dt: number): void {
    if (this.over) return;

    if (this.isGrounded()) {
      this.gravityTimer = 0;
      this.lockTimer += dt;
      if (this.lockTimer >= LOCK_DELAY) this.lock();
      return;
    }

    this.lockTimer = 0;
    const rowTime = this.softDropping
      ? Math.min(SOFT_DROP_ROW_TIME, this.gravityRowTime())
      : this.gravityRowTime();
    this.gravityTimer += dt;
    while (this.gravityTimer >= rowTime && this.tryMove(0, 1)) {
      this.gravityTimer -= rowTime;
      if (this.softDropping) this.score += 1;
    }
  }

  move(dx: -1 | 1): void {
    if (this.over) return;
    if (this.tryMove(dx, 0)) this.resetLockIfGrounded();
  }

  rotate(dir: 1 | -1): void {
    if (this.over) return;
    const from = this.current.rot;
    const to = (((from + dir) % 4) + 4) % 4 as Rotation;
    const tests = kickTests(this.current.type, from, to);
    for (let i = 0; i < tests.length; i++) {
      const [dx, dy] = tests[i];
      // Kick tables use y-up; the board uses y-down.
      const next: ActivePiece = { ...this.current, rot: to, x: this.current.x + dx, y: this.current.y - dy };
      if (!this.collides(next)) {
        this.current = next;
        this.lastKick = i;
        this.lastMoveWasRotation = true;
        this.resetLockIfGrounded();
        return;
      }
    }
  }

  hardDrop(): void {
    if (this.over) return;
    let rows = 0;
    while (this.tryMove(0, 1)) rows++;
    this.score += rows * 2;
    this.lock();
  }

  hold(): void {
    if (this.over || !this.canHold) return;
    const type = this.current.type;
    if (this.held === null) {
      this.current = this.spawn(this.takeNext());
    } else {
      this.current = this.spawn(this.held);
    }
    this.held = type;
    this.canHold = false;
  }

  private takeNext(): PieceType {
    this.queue.push(this.random.next());
    return this.queue.shift() as PieceType;
  }

  private spawn(type: PieceType): ActivePiece {
    const piece: ActivePiece = { type, rot: 0, x: Math.floor((COLS - boxSize(type)) / 2), y: 0 };
    this.gravityTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lowestY = piece.y;
    this.lastMoveWasRotation = false;
    this.lastKick = 0;
    if (this.collides(piece)) this.over = true; // blocked spawn: top out
    return piece;
  }

  private collides(p: ActivePiece): boolean {
    return cells(p.type, p.rot).some(([dx, dy]) => {
      const x = p.x + dx;
      const y = p.y + dy;
      return x < 0 || x >= COLS || y >= ROWS || (y >= 0 && this.board[y][x] !== null);
    });
  }

  private tryMove(dx: number, dy: number): boolean {
    const next: ActivePiece = { ...this.current, x: this.current.x + dx, y: this.current.y + dy };
    if (this.collides(next)) return false;
    this.current = next;
    this.lastMoveWasRotation = false;
    if (dy > 0 && next.y > this.lowestY) {
      this.lowestY = next.y;
      this.lockResets = 0;
    }
    return true;
  }

  private isGrounded(): boolean {
    return this.collides({ ...this.current, y: this.current.y + 1 });
  }

  /** Guideline lock delay: moves and rotations restart the timer, up to 15 times per row. */
  private resetLockIfGrounded(): void {
    if (this.isGrounded() && this.lockResets < MAX_LOCK_RESETS) {
      this.lockTimer = 0;
      this.lockResets++;
    }
  }

  private lock(): void {
    const p = this.current;
    const spin = this.detectSpin(p);

    let fullyHidden = true;
    for (const [dx, dy] of cells(p.type, p.rot)) {
      const y = p.y + dy;
      if (y >= 0) this.board[y][p.x + dx] = p.type;
      if (y >= HIDDEN_ROWS) fullyHidden = false;
    }
    if (fullyHidden) {
      this.over = true; // lock out: locked entirely above the visible field
      return;
    }

    const cleared = this.clearLines();
    this.scoreLock(cleared, spin);
    this.canHold = true;
    this.current = this.spawn(this.takeNext());
  }

  private detectSpin(p: ActivePiece): Spin {
    if (p.type !== 'T' || !this.lastMoveWasRotation) return 'none';
    const cx = p.x + 1;
    const cy = p.y + 1;
    const blocked = ([dx, dy]: Offset): boolean => {
      const x = cx + dx;
      const y = cy + dy;
      return x < 0 || x >= COLS || y >= ROWS || (y >= 0 && this.board[y][x] !== null);
    };
    if (CORNERS.filter(blocked).length < 3) return 'none';
    const frontBlocked = FRONT_CORNERS[p.rot].every(blocked);
    // A kick using the fifth SRS test is always treated as a full T-spin.
    return frontBlocked || this.lastKick === 4 ? 'full' : 'mini';
  }

  private clearLines(): number {
    const kept = this.board.filter((row) => row.some((c) => c === null));
    const cleared = ROWS - kept.length;
    while (kept.length < ROWS) kept.unshift(emptyRow());
    this.board.splice(0, ROWS, ...kept);
    return cleared;
  }

  private scoreLock(n: number, spin: Spin): void {
    const level = this.level();
    const difficult = n === 4 || (spin !== 'none' && n > 0);

    let base: number;
    if (spin === 'full') base = TSPIN_SCORES[n];
    else if (spin === 'mini') base = MINI_TSPIN_SCORES[Math.min(n, 2)];
    else base = LINE_SCORES[n];
    let points = base * level;

    let label = spin === 'full' ? 'T-SPIN' : spin === 'mini' ? 'T-SPIN MINI' : '';
    if (n > 0) {
      label = `${label} ${CLEAR_NAMES[n]}`.trim();
      if (difficult && this.backToBack) {
        points = Math.floor(points * 1.5);
        label += ' B2B';
      }
      this.backToBack = difficult;

      this.combo++;
      if (this.combo > 0) points += 50 * this.combo * level;

      if (this.board.every((row) => row.every((c) => c === null))) {
        points += PERFECT_CLEAR_SCORES[n - 1] * level;
        label = 'PERFECT CLEAR';
      }
      this.lines += n;
    } else {
      this.combo = -1;
    }

    this.score += points;
    this.lastEvent = label;
  }
}
