import { Board, HIDDEN_ROWS, pieceCells } from './board.js';
import { BagRandomizer } from './randomizer.js';
import { kicksFor, Rotation, Tetromino } from './pieces.js';

export type GameStatus = 'playing' | 'over';

export interface ActivePiece {
  type: Tetromino;
  rotation: Rotation;
  x: number;
  y: number;
}

/** Supplies the endless stream of upcoming pieces. */
export interface PieceSource {
  next(): Tetromino;
}

export interface TSpinResult {
  mini: boolean;
}

const LOCK_DELAY_MS = 500;
const MAX_LOCK_RESETS = 15;
const NEXT_QUEUE_LENGTH = 5;
const SOFT_DROP_FACTOR = 20;
/** update() is simulated in slices so lock timing stays accurate for large dt. */
const UPDATE_SLICE_MS = 50;

const SPAWN_X: Record<Tetromino, number> = { I: 3, O: 4, T: 3, S: 3, Z: 3, J: 3, L: 3 };

const LINE_CLEAR_POINTS = [0, 100, 300, 500, 800];
const TSPIN_POINTS = [400, 800, 1200, 1600];
const MINI_TSPIN_POINTS = [100, 200, 400];
const CLEAR_NAMES = ['', 'SINGLE', 'DOUBLE', 'TRIPLE', 'TETRIS'];

/** Milliseconds per row for a level, per the Guideline gravity curve. */
export function gravityMs(level: number): number {
  const secondsPerRow = Math.pow(0.8 - (level - 1) * 0.007, level - 1);
  return Math.max(secondsPerRow * 1000, 1);
}

/**
 * Guideline game state machine: gravity, lock delay with move resets, SRS
 * rotation, 7-bag randomizer, hold, next queue, scoring and top-out rules.
 * Pure logic with no DOM dependencies so it runs headless in the tests.
 */
export class Game {
  readonly board = new Board();
  status: GameStatus = 'playing';
  active: ActivePiece | null = null;
  hold: Tetromino | null = null;
  canHold = true;
  readonly queue: Tetromino[] = [];
  score = 0;
  lines = 0;
  level = 1;
  /** Consecutive clears minus one; -1 means the last piece cleared nothing. */
  combo = -1;
  backToBack = false;
  softDropping = false;
  lastClearLabel: string | null = null;
  /** Increments on every scored action; lets the UI detect new labels. */
  clearCount = 0;
  lastActionWasRotation = false;

  private lastKickIndex = 0;
  private readonly source: PieceSource;
  private gravityAcc = 0;
  private lockTimer = 0;
  private lockResets = 0;
  private lowestY = 0;

  constructor(source: PieceSource = new BagRandomizer()) {
    this.source = source;
    this.reset();
  }

  reset(): void {
    this.board.clear();
    this.status = 'playing';
    this.hold = null;
    this.canHold = true;
    this.queue.length = 0;
    this.refillQueue();
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.combo = -1;
    this.backToBack = false;
    this.softDropping = false;
    this.lastClearLabel = null;
    this.clearCount = 0;
    this.spawnPiece();
  }

  /** Moves the piece sideways. Returns false when the move was blocked. */
  move(dx: number): boolean {
    const piece = this.active;
    if (this.status !== 'playing' || !piece) return false;
    if (!this.board.fits(piece.type, piece.rotation, piece.x + dx, piece.y)) return false;
    piece.x += dx;
    this.lastActionWasRotation = false;
    this.onSuccessfulShift();
    return true;
  }

  /** Rotates clockwise (1) or counter-clockwise (-1) using SRS wall kicks. */
  rotate(dir: 1 | -1): boolean {
    const piece = this.active;
    if (this.status !== 'playing' || !piece) return false;
    const to = ((piece.rotation + dir + 4) % 4) as Rotation;
    const kicks = kicksFor(piece.type, piece.rotation, to);
    for (let i = 0; i < kicks.length; i++) {
      const [dx, dy] = kicks[i];
      if (this.board.fits(piece.type, to, piece.x + dx, piece.y + dy)) {
        piece.rotation = to;
        piece.x += dx;
        piece.y += dy;
        this.lastActionWasRotation = true;
        this.lastKickIndex = i;
        this.onSuccessfulShift();
        return true;
      }
    }
    return false;
  }

  /** Drops the piece to its ghost position and locks it immediately. */
  hardDrop(): void {
    const piece = this.active;
    if (this.status !== 'playing' || !piece) return;
    const target = this.ghostY();
    this.score += 2 * (target - piece.y);
    piece.y = target;
    this.lockPiece();
  }

  /** Stores the current piece and plays the held one (once per piece). */
  holdPiece(): void {
    const piece = this.active;
    if (this.status !== 'playing' || !piece || !this.canHold) return;
    this.canHold = false;
    const previous = this.hold;
    this.hold = piece.type;
    this.active = null;
    if (previous) this.spawnPiece(previous);
    else this.spawnPiece();
  }

  /** Advances the game by dtMs of simulated time. */
  update(dtMs: number): void {
    let remaining = Math.max(dtMs, 0);
    while (remaining > 0) {
      this.tick(Math.min(remaining, UPDATE_SLICE_MS));
      remaining -= UPDATE_SLICE_MS;
      if (this.status !== 'playing' || !this.active) return;
    }
  }

  /** Row the active piece would land on if dropped now (ghost position). */
  ghostY(): number {
    const piece = this.active;
    if (!piece) return 0;
    let y = piece.y;
    while (this.board.fits(piece.type, piece.rotation, piece.x, y + 1)) y++;
    return y;
  }

  /**
   * Pulls the next piece (or the given one, when swapping from hold) and
   * places it at the spawn position. Ends the game on a blocked spawn.
   */
  private spawnPiece(type?: Tetromino): void {
    let next: Tetromino;
    if (type === undefined) {
      next = this.queue.shift()!;
      this.refillQueue();
    } else {
      next = type;
    }
    const x = SPAWN_X[next];
    if (!this.board.fits(next, 0, x, 0)) {
      this.active = null;
      this.status = 'over';
      return;
    }
    this.active = { type: next, rotation: 0, x, y: 0 };
    this.gravityAcc = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lowestY = 0;
    this.lastActionWasRotation = false;
    this.lastKickIndex = 0;
  }

  private tick(dtMs: number): void {
    const piece = this.active;
    if (!piece || this.status !== 'playing') return;
    const step = this.fallIntervalMs();
    this.gravityAcc += dtMs;
    while (this.gravityAcc >= step) {
      if (!this.board.fits(piece.type, piece.rotation, piece.x, piece.y + 1)) {
        this.gravityAcc = 0;
        break;
      }
      this.gravityAcc -= step;
      piece.y += 1;
      if (this.softDropping) this.score += 1;
      // Falling to a new lowest row restarts the lock delay allowance.
      if (piece.y > this.lowestY) {
        this.lowestY = piece.y;
        this.lockTimer = 0;
        this.lockResets = 0;
      }
    }
    if (this.board.fits(piece.type, piece.rotation, piece.x, piece.y + 1)) {
      this.lockTimer = 0; // airborne: the lock delay is paused
    } else {
      this.lockTimer += dtMs;
      if (this.lockTimer >= LOCK_DELAY_MS) this.lockPiece();
    }
  }

  private fallIntervalMs(): number {
    const base = gravityMs(this.level);
    return this.softDropping ? base / SOFT_DROP_FACTOR : base;
  }

  /** A successful grounded move/rotation resets the lock delay (max 15). */
  private onSuccessfulShift(): void {
    const piece = this.active;
    if (!piece) return;
    if (this.board.fits(piece.type, piece.rotation, piece.x, piece.y + 1)) return;
    if (this.lockResets < MAX_LOCK_RESETS) {
      this.lockTimer = 0;
      this.lockResets += 1;
    }
  }

  private refillQueue(): void {
    while (this.queue.length < NEXT_QUEUE_LENGTH) this.queue.push(this.source.next());
  }

  private lockPiece(): void {
    const piece = this.active!;
    const spin = this.detectTSpin(piece);
    const cells = pieceCells(piece.type, piece.rotation, piece.x, piece.y);
    const aboveField = cells.some((cell) => cell[1] < 0);
    const allHidden = cells.every((cell) => cell[1] < HIDDEN_ROWS);
    this.active = null;
    if (aboveField || allHidden) {
      this.status = 'over'; // lock out: the piece is (entirely) above the field
      return;
    }
    this.board.lock(piece.type, piece.rotation, piece.x, piece.y);
    const cleared = this.board.clearFullRows();
    this.applyScoring(cleared, spin);
    this.spawnPiece();
    this.canHold = true;
  }

  private applyScoring(cleared: number, spin: TSpinResult | null): void {
    let label: string | null = null;
    let points = 0;
    if (cleared > 0) {
      this.combo += 1;
      const qualifies = cleared === 4 || spin !== null;
      if (spin) {
        points = spin.mini ? MINI_TSPIN_POINTS[cleared] ?? 400 : TSPIN_POINTS[cleared];
        label = `${spin.mini ? 'MINI T-SPIN' : 'T-SPIN'} ${CLEAR_NAMES[cleared]}`;
      } else {
        points = LINE_CLEAR_POINTS[cleared];
        label = CLEAR_NAMES[cleared];
      }
      if (qualifies && this.backToBack) {
        points = Math.floor(points * 1.5);
        label = `B2B ${label}`;
      }
      this.backToBack = qualifies;
      points *= this.level;
      if (this.combo > 0) points += 50 * this.combo * this.level;
      this.lines += cleared;
      this.level = Math.floor(this.lines / 10) + 1;
    } else {
      this.combo = -1;
      if (spin) {
        points = (spin.mini ? MINI_TSPIN_POINTS[0] : TSPIN_POINTS[0]) * this.level;
        label = spin.mini ? 'MINI T-SPIN' : 'T-SPIN';
      }
    }
    this.score += points;
    this.lastClearLabel = label;
    if (label !== null) this.clearCount += 1;
  }

  /**
   * Three-corner T-spin detection: the last action was a rotation and at
   * least three corners of the T's 3x3 box are occupied. Full T-spins have
   * both "front" corners (the pair the T points at) filled, or were twisted
   * into place by the final SRS kick.
   */
  private detectTSpin(piece: ActivePiece): TSpinResult | null {
    if (piece.type !== 'T' || !this.lastActionWasRotation) return null;
    const nw = this.board.isBlocked(piece.x, piece.y);
    const ne = this.board.isBlocked(piece.x + 2, piece.y);
    const sw = this.board.isBlocked(piece.x, piece.y + 2);
    const se = this.board.isBlocked(piece.x + 2, piece.y + 2);
    const filled = [nw, ne, sw, se].filter(Boolean).length;
    if (filled < 3) return null;
    const frontByRotation: [boolean, boolean][] = [
      [nw, ne], // rotation 0: the T points up
      [ne, se], // rotation 1: the T points right
      [sw, se], // rotation 2: the T points down
      [nw, sw], // rotation 3: the T points left
    ];
    const front = frontByRotation[piece.rotation];
    const frontBoth = front[0] && front[1];
    return { mini: !frontBoth && this.lastKickIndex !== 4 };
  }
}
