import { HIDDEN_ROWS, LOCK_DELAY, MAX_LOCK_RESETS, SPAWN_X, SPAWN_Y } from './constants.js';
import type { PieceType, Spin } from './constants.js';
import { Board } from './board.js';
import { cellsOf, kickTable } from './pieces.js';
import { SevenBag } from './randomizer.js';
import type { Rng } from './rng.js';
import { mulberry32 } from './rng.js';
import {
  comboPoints,
  gravitySeconds,
  levelFor,
  perfectClearBonus,
  pointsForClear,
  softDropSeconds,
} from './scoring.js';

export interface ActivePiece {
  type: PieceType;
  rot: number; // 0 spawn, 1 clockwise, 2 180, 3 counter-clockwise
  x: number;
  y: number;
}

export interface ClearResult {
  lines: number;
  spin: Spin;
  points: number;
  perfectClear: boolean;
}

/**
 * The whole game state: board, falling piece, hold, next queue, scoring.
 * Pure logic, no DOM - the renderer draws it and the input handler drives it.
 */
export class Game {
  readonly board = new Board();
  readonly bag: SevenBag;

  current: ActivePiece | null = null;
  hold: PieceType | null = null;
  canHold = true;

  score = 0;
  lines = 0;
  level = 1;
  combo = -1;
  backToBack = false;
  gameOver = false;

  /** Short feedback text (e.g. "TETRIS!"), shown for a moment after a clear. */
  message = '';
  messageTimer = 0;
  lastClear: ClearResult | null = null;

  /** True when the last successful action was a rotation (needed for T-spins). */
  lastActionWasRotation = false;
  /** Kick offset index used by the last rotation; index 4 can upgrade a mini T-spin. */
  lastKickIndex = -1;

  private fallTimer = 0;
  private lockTimer = 0;
  private lockResets = 0;
  private softDropping = false;

  constructor(rng: Rng = mulberry32(Date.now())) {
    this.bag = new SevenBag(rng);
    this.restart();
  }

  restart(): void {
    this.board.reset();
    this.bag.reset();
    this.hold = null;
    this.canHold = true;
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.combo = -1;
    this.backToBack = false;
    this.gameOver = false;
    this.message = '';
    this.messageTimer = 0;
    this.lastClear = null;
    this.softDropping = false;
    this.spawnNext();
  }

  /** Upcoming pieces for the next queue. */
  peekNext(count: number): PieceType[] {
    return this.bag.peek(count);
  }

  /** Advances gravity, lock delay and message timers. */
  update(seconds: number): void {
    if (this.messageTimer > 0) {
      this.messageTimer = Math.max(0, this.messageTimer - seconds);
      if (this.messageTimer === 0) this.message = '';
    }
    if (this.gameOver || !this.current) return;

    if (this.canFall()) {
      this.lockTimer = 0;
      this.fallTimer += seconds;
      const interval = this.softDropping ? softDropSeconds(this.level) : gravitySeconds(this.level);
      let steps = 0;
      while (this.fallTimer >= interval && steps++ < ROW_LIMIT) {
        this.fallTimer -= interval;
        if (!this.stepDown(this.softDropping)) break;
      }
    } else {
      this.fallTimer = 0;
      this.lockTimer += seconds;
      if (this.lockTimer >= LOCK_DELAY) this.lockPiece();
    }
  }

  moveHorizontal(dir: number): boolean {
    const p = this.current;
    if (!p || this.gameOver) return false;
    if (this.board.collides(cellsOf(p.type, p.rot), p.x + dir, p.y)) return false;
    p.x += dir;
    this.lastActionWasRotation = false;
    this.resetLockDelay();
    return true;
  }

  /** Rotates the piece; the SRS kick table decides how far it may be shifted. */
  rotate(dir: number): boolean {
    const p = this.current;
    if (!p || this.gameOver) return false;
    const to = (p.rot + dir + 4) % 4;
    const kicks = kickTable(p.type, p.rot, to);
    for (let i = 0; i < kicks.length; i++) {
      const [dx, dy] = kicks[i];
      if (this.board.collides(cellsOf(p.type, to), p.x + dx, p.y + dy)) continue;
      p.x += dx;
      p.y += dy;
      p.rot = to;
      this.lastActionWasRotation = true;
      this.lastKickIndex = i;
      this.resetLockDelay();
      return true;
    }
    return false;
  }

  /** Starts/stops the soft drop (down arrow); starting it moves one cell at once. */
  setSoftDrop(on: boolean): void {
    if (this.gameOver) return;
    if (on && !this.softDropping) {
      this.softDropping = true;
      this.stepDown(true);
    } else if (!on) {
      this.softDropping = false;
    }
  }

  /** Drops the piece to the bottom (2 points per cell) and locks it immediately.
   * A hard drop is a "lock now" command, so it does not invalidate a T-spin. */
  hardDrop(): void {
    const p = this.current;
    if (!p || this.gameOver) return;
    const distance = this.board.dropDistance(cellsOf(p.type, p.rot), p.x, p.y);
    if (distance > 0) p.y += distance;
    this.score += distance * 2;
    this.lockPiece();
  }

  /** Swaps the current piece with the hold slot; once per piece. */
  holdPiece(): void {
    const p = this.current;
    if (!p || this.gameOver || !this.canHold) return;
    const swapped = this.hold;
    this.hold = p.type;
    this.canHold = false;
    if (swapped === null) this.spawnNext();
    else this.spawn(swapped);
  }

  /** Row where the current piece would land (for the ghost). */
  ghostY(): number {
    const p = this.current;
    if (!p) return 0;
    return p.y + this.board.dropDistance(cellsOf(p.type, p.rot), p.x, p.y);
  }

  private spawnNext(): void {
    this.spawn(this.bag.next());
  }

  private spawn(type: PieceType): void {
    this.current = { type, rot: 0, x: SPAWN_X, y: SPAWN_Y };
    this.fallTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lastActionWasRotation = false;
    this.lastKickIndex = -1;
    if (this.board.collides(cellsOf(type, 0), SPAWN_X, SPAWN_Y)) {
      this.gameOver = true; // block out: spawn is blocked
      this.showMessage('GAME OVER');
    }
  }

  private canFall(): boolean {
    const p = this.current;
    return !!p && !this.board.collides(cellsOf(p.type, p.rot), p.x, p.y + 1);
  }

  private stepDown(soft: boolean): boolean {
    const p = this.current;
    if (!p || this.board.collides(cellsOf(p.type, p.rot), p.x, p.y + 1)) return false;
    p.y++;
    this.lastActionWasRotation = false;
    if (soft) this.score += 1;
    return true;
  }

  /** Lock delay restarts on moves/rotations while resting, up to 15 times. */
  private resetLockDelay(): void {
    if (!this.canFall() && this.lockResets < MAX_LOCK_RESETS) {
      this.lockTimer = 0;
      this.lockResets++;
    }
  }

  private lockPiece(): void {
    const p = this.current;
    if (!p) return;
    const cells = cellsOf(p.type, p.rot);
    const spin = this.detectSpin();
    const lockedOut = cells.every(([, cy]) => p.y + cy < HIDDEN_ROWS);

    this.board.lock(cells, p.x, p.y, p.type);
    const cleared = this.board.clearLines();
    this.applyScoring(cleared, spin);

    this.canHold = true;
    this.current = null;

    if (lockedOut) {
      this.gameOver = true; // lock out: piece locked entirely above the field
      this.showMessage('GAME OVER');
      return;
    }
    this.spawnNext();
  }

  /** T-spin detection: last action was a rotation and 3 of the 4 corners are filled. */
  private detectSpin(): Spin {
    const p = this.current;
    if (!p || p.type !== 'T' || !this.lastActionWasRotation) return 'none';
    const cx = p.x + 1;
    const cy = p.y + 1;
    const corners: [number, number][] = [
      [cx - 1, cy - 1], // top left
      [cx + 1, cy - 1], // top right
      [cx - 1, cy + 1], // bottom left
      [cx + 1, cy + 1], // bottom right
    ];
    const filled = corners.map(([x, y]) => this.board.isOccupied(x, y));
    if (filled.filter(Boolean).length < 3) return 'none';
    const front = FRONT_CORNERS[p.rot % 4];
    const bothFrontFilled = front.every((i) => filled[i]);
    return bothFrontFilled || this.lastKickIndex === 4 ? 'full' : 'mini';
  }

  private applyScoring(cleared: number, spin: Spin): void {
    if (cleared === 0) {
      this.combo = -1;
      this.lastClear = null;
      return;
    }
    const level = this.level;
    const countsForB2B = (cleared === 4 && spin === 'none') || spin !== 'none';
    const isBackToBack = countsForB2B && this.backToBack;

    let points = pointsForClear(cleared, spin, level);
    if (isBackToBack) points = Math.floor(points * 1.5);
    const perfectClear = this.board.isPerfectClear();
    if (perfectClear) points += perfectClearBonus(cleared, spin, level);
    this.combo += 1;
    if (this.combo > 0) points += comboPoints(this.combo, level);

    this.score += points;
    this.lines += cleared;
    this.level = levelFor(this.lines);
    this.backToBack = countsForB2B;
    this.lastClear = { lines: cleared, spin, points, perfectClear };
    this.showClearMessage(cleared, spin, isBackToBack, perfectClear);
  }

  private showClearMessage(cleared: number, spin: Spin, b2b: boolean, perfectClear: boolean): void {
    const parts: string[] = [];
    if (spin === 'full') parts.push('T-SPIN');
    else if (spin === 'mini') parts.push('MINI T-SPIN');
    parts.push(['', 'SINGLE', 'DOUBLE', 'TRIPLE', 'TETRIS!'][cleared] ?? '');
    if (b2b) parts.push('B2B');
    if (perfectClear) parts.push('PERFECT CLEAR!');
    this.showMessage(parts.join(' '));
  }

  private showMessage(text: string): void {
    this.message = text;
    this.messageTimer = 2;
  }
}

/** Front corner indices of the T piece per rotation state (see detectSpin). */
const FRONT_CORNERS: readonly (readonly number[])[] = [
  [0, 1], // pointing up: top left + top right
  [1, 3], // pointing right: top right + bottom right
  [2, 3], // pointing down: bottom left + bottom right
  [0, 2], // pointing left: top left + bottom left
];

/** Safety cap on gravity steps per update call. */
const ROW_LIMIT = 22;
