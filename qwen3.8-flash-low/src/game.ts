import { Bag } from "./bag.js";
import { Board } from "./board.js";
import {
  createPiece,
  kickOffsets,
  pieceCells,
  type ActivePiece,
  type PieceType,
} from "./pieces.js";

export const BOARD_WIDTH = 10;
export const VISIBLE_ROWS = 20;
/** Two extra rows above the visible field where pieces spawn (Guideline). */
export const HIDDEN_ROWS = 2;
export const BOARD_HEIGHT = VISIBLE_ROWS + HIDDEN_ROWS;

const LOCK_DELAY = 0.5; // seconds a grounded piece can be kept alive by moves/rotations
const MAX_LOCK_RESETS = 15; // Guideline limit on lock-delay resets from shifting/rotating
const SOFT_DROP_FACTOR = 20; // soft drop falls at 20x gravity
const QUEUE_SIZE = 5;
const CLEAR_SCORE = [0, 100, 300, 500, 800];

/** Guideline gravity: seconds per row for the given level. */
export function gravityInterval(level: number): number {
  return Math.pow(0.8 - (level - 1) * 0.007, level - 1);
}

/**
 * The game rules, free of any DOM so it can run headless in tests.
 * Driven by {@link Game.tick} for gravity/lock delay and by the input methods
 * (`move`, `rotate`, `softStep`, `hardDrop`, `holdPiece`).
 */
export class Game {
  readonly board = new Board(BOARD_WIDTH, BOARD_HEIGHT);
  readonly bag: Bag;

  piece: ActivePiece | null = null;
  /** Queue of upcoming pieces (at least QUEUE_SIZE while playing). */
  queue: PieceType[] = [];
  hold: PieceType | null = null;
  /** False from a hold until the held piece locks. */
  canHold = true;

  score = 0;
  best = 0;
  level = 1;
  lines = 0;
  gameOver = false;
  /** While true, gravity runs at 20x speed and pays 1 point per row (set by input). */
  softDropping = false;
  /** Index of the wall-kick offset used by the last successful rotation (-1 without kick). */
  lastKickIndex = -1;

  private gravityTimer = 0;
  private lockTimer = 0;
  private lockResets = 0;
  private combo = 0;
  private backToBack = false;

  constructor(options: { rng?: () => number; best?: number } = {}) {
    this.bag = new Bag(options.rng ?? Math.random);
    this.best = options.best ?? 0;
    this.reset();
  }

  /** Restarts the game, keeping the best score. */
  reset(): void {
    this.board.clear();
    this.queue = [];
    for (let i = 0; i < QUEUE_SIZE; i++) this.queue.push(this.bag.next());
    this.hold = null;
    this.canHold = true;
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.gameOver = false;
    this.softDropping = false;
    this.gravityTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.combo = 0;
    this.backToBack = false;
    this.piece = null;
    this.spawn();
  }

  /** Cells of the active piece, or null when none is in play. */
  cells(): [number, number][] | null {
    return this.piece ? pieceCells(this.piece) : null;
  }

  /** Cells of the ghost piece: the active piece dropped straight to its landing position. */
  ghostCells(): [number, number][] | null {
    if (!this.piece) return null;
    const probe: ActivePiece = { ...this.piece };
    while (this.fits(probe, probe.x, probe.y + 1)) probe.y++;
    return pieceCells(probe);
  }

  /** Advances the simulation by `dt` seconds (gravity, soft drop and lock delay). */
  tick(dt: number): void {
    if (this.gameOver || !this.piece) return;

    if (this.grounded()) {
      this.gravityTimer = 0;
      this.lockTimer += dt;
      if (this.lockTimer >= LOCK_DELAY) this.lockPiece();
      return;
    }

    const interval = gravityInterval(this.level) / (this.softDropping ? SOFT_DROP_FACTOR : 1);
    this.gravityTimer += dt;
    while (this.gravityTimer >= interval && this.piece && !this.grounded()) {
      this.piece.y++;
      if (this.softDropping) this.score += 1;
      this.gravityTimer -= interval;
      this.lockTimer = 0;
      this.lockResets = 0; // reaching a new row re-arms the lock-delay resets
    }
  }

  /** Shifts the piece horizontally by `dx` cells; returns whether it moved. */
  move(dx: number): boolean {
    if (!this.piece || this.gameOver) return false;
    if (!this.fits(this.piece, this.piece.x + dx, this.piece.y)) return false;
    this.piece.x += dx;
    this.resetLockDelay();
    return true;
  }

  /** Rotates the piece 1 = clockwise, -1 = counter-clockwise, applying SRS wall kicks. */
  rotate(dir: 1 | -1): boolean {
    if (!this.piece || this.gameOver) return false;
    const from = this.piece.rot;
    const to = (from + (dir === 1 ? 1 : 3)) % 4;
    for (const [dx, dy] of kickOffsets(this.piece.type, from, to)) {
      const candidate: ActivePiece = { ...this.piece, rot: to };
      if (this.fits(candidate, candidate.x + dx, candidate.y + dy)) {
        candidate.x += dx;
        candidate.y += dy;
        this.piece = candidate;
        this.lastKickIndex = dx === 0 && dy === 0 ? -1 : this.indexOfOffset(dx, dy, this.piece.type, from, to);
        this.resetLockDelay();
        return true;
      }
    }
    return false;
  }

  /** Immediate one-row soft-drop step (key tap); scores when it moves. */
  softStep(): boolean {
    if (!this.piece || this.gameOver || this.grounded()) return false;
    this.piece.y++;
    this.score += 1;
    this.gravityTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    return true;
  }

  /** Drops the piece to the ghost position, scores 2 points per row and locks it. */
  hardDrop(): void {
    if (!this.piece || this.gameOver) return;
    let rows = 0;
    while (this.fits(this.piece, this.piece.x, this.piece.y + 1)) {
      this.piece.y++;
      rows++;
    }
    this.score += rows * 2;
    this.lockPiece();
  }

  /** Swaps the active piece with the held piece (once per piece). */
  holdPiece(): boolean {
    if (!this.piece || !this.canHold || this.gameOver) return false;
    const current = this.piece.type;
    const type = this.hold ?? this.takeFromQueue();
    this.hold = current;
    this.canHold = false;
    this.placeAtSpawn(type);
    return true;
  }

  /** True when the piece cannot move down any further. */
  grounded(): boolean {
    return !this.piece || !this.fits(this.piece, this.piece.x, this.piece.y + 1);
  }

  /** Replaces the next `types` in the preview queue (useful for tests and debugging). */
  prime(types: readonly PieceType[]): void {
    this.queue = [...types, ...this.queue].slice(0, Math.max(QUEUE_SIZE, types.length));
  }

  /** Places the active piece directly (used by tests; no collision checks beyond bounds). */
  setPiece(type: PieceType, rot: number, x: number, y: number): void {
    this.piece = { type, rot, x, y };
    this.gravityTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
  }

  private fits(piece: ActivePiece, x: number, y: number): boolean {
    return this.board.canPlace(pieceCells({ ...piece, x, y }));
  }

  private indexOfOffset(dx: number, dy: number, type: PieceType, from: number, to: number): number {
    const offsets = kickOffsets(type, from, to);
    const i = offsets.findIndex(([ox, oy]) => ox === dx && oy === dy);
    return i;
  }

  private resetLockDelay(): void {
    if (this.lockTimer > 0 && this.lockResets < MAX_LOCK_RESETS) {
      this.lockTimer = 0;
      this.lockResets++;
    }
  }

  private takeFromQueue(): PieceType {
    const type = this.queue.shift()!;
    this.queue.push(this.bag.next());
    return type;
  }

  private spawn(): void {
    this.placeAtSpawn(this.takeFromQueue());
  }

  /** Puts `type` at its Guideline spawn position; blocked spawn tops out the game. */
  private placeAtSpawn(type: PieceType): void {
    this.piece = createPiece(type);
    this.gravityTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    if (!this.fits(this.piece, this.piece.x, this.piece.y)) {
      this.piece = null; // blocked spawn -> top out
      this.gameOver = true;
      this.recordBest();
    }
  }

  private lockPiece(): void {
    if (!this.piece) return;
    const cells = this.cells()!;
    for (const [x, y] of cells) this.board.setCell(x, y, this.piece.type);
    this.piece = null;

    const cleared = this.board.clearFullRows();
    if (cleared > 0) this.combo++;
    else this.combo = 0;
    this.score += this.clearScore(cleared);
    if (cleared > 0) {
      this.lines += cleared;
      this.level = Math.floor(this.lines / 10) + 1;
    }
    if (cleared === 4) this.backToBack = true;
    else if (cleared > 0) this.backToBack = false;

    this.canHold = true;

    // Lock-out: the whole piece came to rest entirely within the hidden spawn rows.
    if (cells.every(([, y]) => y < HIDDEN_ROWS)) {
      this.gameOver = true;
      this.recordBest();
      return;
    }

    this.spawn();
  }

  /** Guideline line-clear scoring with back-to-back and combo bonuses. */
  private clearScore(cleared: number): number {
    if (cleared === 0) return 0;
    let points = CLEAR_SCORE[cleared] * this.level;
    if (cleared === 4 && this.backToBack) points = Math.floor(points * 1.5);
    if (this.combo > 1) points += 50 * (this.combo - 1) * this.level;
    return points;
  }

  private recordBest(): void {
    this.best = Math.max(this.best, this.score);
  }
}
