import { Board } from './board.js';
import { Bag } from './bag.js';
import { STATES, kicksFor, type Kind } from './pieces.js';

export const LOCK_DELAY_MS = 500;
export const MAX_LOCK_RESETS = 15;

const SPAWN_Y = -1; // lowest spawn cell sits on the skyline: pieces drop in from above
const SOFT_DROP_FACTOR = 20; // guideline: soft drop is at least 20x gravity

const LINE_SCORES = [0, 100, 300, 500, 800];
const TSPIN_SCORES = [400, 800, 1200, 1600]; // incl. the T-spin with no lines bonus
const COMBO_BONUS = 50;

interface ActivePiece {
  kind: Kind;
  x: number;
  y: number;
  rot: number;
}

/**
 * Guideline gravity as seconds per cell; the level caps at 20.
 * Classic "Tetris Worlds" curve: (0.8 - (level - 1) * 0.007) ^ (level - 1).
 */
export function gravityIntervalMs(level: number): number {
  const l = Math.min(Math.max(level, 1), 20);
  return Math.pow(0.8 - (l - 1) * 0.007, l - 1) * 1000;
}

/**
 * All game state and rules, fully DOM-free so it is testable headlessly.
 * `update(dt)` advances gravity, soft drop and lock delay; every entry point
 * (move/rotate/hardDrop/hold) is a no-op once the game is over.
 */
export class Game {
  board: Board;
  bag: Bag;

  over = false;
  score = 0;
  lines = 0;
  level = 1;
  combo = -1;
  b2b = false; // the last clear was "difficult" (tetris or T-spin), enabling the back-to-back bonus

  holdKind: Kind | null = null;
  canHold = true;
  piece!: ActivePiece;

  softHeld = false; // set by the input layer while ArrowDown is down
  lastActionRotation = false; // needed for T-spin detection: last successful action was a rotation

  private fallTimer = 0;
  private lockTimer = 0;
  private lockResets = 0; // guideline move counter: at most 15 lock delay resets per piece
  private lowestY = SPAWN_Y;
  private readonly initialQueue: Kind[];

  constructor(board: Board = new Board(), initialQueue: Kind[] = []) {
    this.board = board;
    this.bag = new Bag();
    this.initialQueue = initialQueue.slice();
    this.startRound();
  }

  /** `restart` starts a new game, clearing the board too. */
  restart(): void {
    this.board.reset();
    this.startRound();
  }

  /** Rewinds scores and RNG, then spawns the first piece. */
  private startRound(): void {
    this.bag = new Bag(this.initialQueue);
    this.over = false;
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.combo = -1;
    this.b2b = false;
    this.holdKind = null;
    this.canHold = true;
    this.spawn();
  }

  get cells(): readonly [number, number][] {
    return STATES[this.piece.kind][this.piece.rot];
  }

  get grounded(): boolean {
    return this.board.collides(this.cells, this.piece.x, this.piece.y + 1);
  }

  /** Row the piece would rest on if dropped straight down (for the ghost piece). */
  get ghostY(): number {
    let y = this.piece.y;
    while (!this.board.collides(this.cells, this.piece.x, y + 1)) y++;
    return y;
  }

  move(dx: -1 | 1): void {
    if (this.over) return;
    const { kind, x, y, rot } = this.piece;
    if (this.board.collides(STATES[kind][rot], x + dx, y)) return;
    this.piece.x = x + dx;
    this.lastActionRotation = false;
    this.onSuccessfulMove();
  }

  /** dir = 1 rotates clockwise, -1 counter-clockwise, and takes SRS wall kicks into account. */
  rotate(dir: 1 | -1): void {
    if (this.over || this.piece.kind === 'O') return;
    const from = this.piece.rot;
    const to = (from + (dir === 1 ? 1 : 3)) % 4;
    for (const [kx, ky] of kicksFor(this.piece.kind, from, to)) {
      const x = this.piece.x + kx;
      const y = this.piece.y - ky; // kick data is authored with y up
      if (!this.board.collides(STATES[this.piece.kind][to], x, y)) {
        this.piece.rot = to;
        this.piece.x = x;
        this.piece.y = y;
        this.lastActionRotation = true;
        this.onSuccessfulMove();
        return;
      }
    }
  }

  hardDrop(): void {
    if (this.over) return;
    let cells = 0;
    while (!this.grounded) {
      this.piece.y++;
      cells++;
    }
    this.score += cells * 2;
    this.lock();
  }

  /** Swap the current piece with the hold slot; only once per piece per the Guideline. */
  hold(): void {
    if (this.over || !this.canHold) return;
    const swapped = this.holdKind;
    this.holdKind = this.piece.kind;
    this.setPiece(swapped ?? this.bag.next());
    this.canHold = false;
  }

  update(dt: number): void {
    if (this.over) return;

    const interval = gravityIntervalMs(this.level) / (this.softHeld ? SOFT_DROP_FACTOR : 1);
    this.fallTimer += dt;
    while (this.fallTimer >= interval) {
      this.fallTimer -= interval;
      if (!this.stepDown()) {
        this.fallTimer = 0;
        break;
      }
    }

    if (this.grounded) {
      this.lockTimer += dt;
      if (this.lockTimer >= LOCK_DELAY_MS) this.lock();
    }
  }

  /** One cell of natural or soft-drop gravity. */
  private stepDown(): boolean {
    if (this.grounded) return false;
    this.piece.y++;
    if (this.softHeld) this.score += 1; // reward soft drop cells
    this.lastActionRotation = false;
    this.lockTimer = 0;
    if (this.piece.y > this.lowestY) {
      this.lowestY = this.piece.y;
      this.lockResets = 0; // falling to a new lowest row restores the move resets
    }
    return true;
  }

  private lock(): void {
    const tspin = this.isTSpin();
    const cleared = this.board.lock(this.cells, this.piece.x, this.piece.y, this.piece.kind);

    if (cleared > 0) {
      this.combo++;
      const difficult = tspin || cleared === 4;
      let pts = (tspin ? TSPIN_SCORES[cleared] : LINE_SCORES[cleared]) * this.level;
      if (difficult && this.b2b) pts += Math.floor(pts / 2); // back-to-back bonus
      if (this.combo > 0) pts += COMBO_BONUS * this.combo * this.level;
      this.b2b = difficult;
      this.score += pts;
    } else {
      this.combo = -1;
      if (tspin) this.score += TSPIN_SCORES[0] * this.level; // T-spin without lines still scores
    }

    this.lines += cleared;
    this.level = Math.floor(this.lines / 10) + 1;
    this.canHold = true;
    this.spawn();
  }

  private isTSpin(): boolean {
    if (this.piece.kind !== 'T' || !this.lastActionRotation) return false;
    // 3-corner rule: at least three of the four diagonal cells around the T's center occupied
    const corners: [number, number][] = [[0, 0], [2, 0], [0, 2], [2, 2]];
    let filled = 0;
    for (const [dx, dy] of corners) {
      if (this.board.isOccupied(this.piece.x + dx, this.piece.y + dy)) filled++;
    }
    return filled >= 3;
  }

  private spawn(): void {
    this.canHold = true;
    this.setPiece(this.bag.next());
  }

  private setPiece(kind: Kind): void {
    this.piece = { kind, x: kind === 'O' ? 4 : 3, y: SPAWN_Y, rot: 0 };
    this.fallTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lowestY = SPAWN_Y;
    this.lastActionRotation = false;
    // The game top's out on a blocked spawn
    this.over = this.board.collides(this.cells, this.piece.x, this.piece.y);
  }

  /** Guideline lock delay: moving or rotating while grounded restarts the delay, capped. */
  private onSuccessfulMove(): void {
    if (this.grounded && this.lockResets < MAX_LOCK_RESETS) {
      this.lockTimer = 0;
      this.lockResets++;
    }
  }
}
