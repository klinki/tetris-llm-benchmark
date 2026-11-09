import { Board, HIDDEN_ROWS, SPAWN_X, SPAWN_Y } from './board.js';
import { PIECE_DEFS, kicksFor } from './pieces.js';
import { BagRandomizer, SequenceRandomizer, type PieceSource } from './randomizer.js';
import { Scoring, gravityIntervalMs } from './scoring.js';
import type { ActivePiece, ClearSummary, PieceType, Point, TSpin } from './types.js';

export const NEXT_COUNT = 5;
export const LOCK_DELAY_MS = 500;
export const MAX_LOCK_RESETS = 15;
const FLASH_MS = 1200;

export interface GameOptions {
  /** Seedable RNG for the 7-bag (defaults to Math.random). */
  rng?: () => number;
  nextCount?: number;
  startLevel?: number;
  /** Scripted pieces instead of the 7-bag (deterministic; used by tests). */
  pieceSequence?: readonly PieceType[];
  /** Advanced: supply a custom piece source. */
  pieceSource?: PieceSource;
}

/** Corner indices [TL, TR, BL, BR] facing the direction the T points to. */
const FRONT_CORNERS: readonly (readonly number[])[] = [
  [0, 1], // rotation 0: points up
  [1, 3], // rotation 1: points right
  [2, 3], // rotation 2: points down
  [0, 2], // rotation 3: points left
];

/**
 * Headless, DOM-free Tetris rules engine. Time is supplied explicitly via
 * update(dtMs), so the same logic runs under requestAnimationFrame in the
 * browser and under fixed steps in the smoke tests.
 */
export class Game {
  readonly board = new Board();
  scoring: Scoring;

  /** The falling piece, or null on block-out. */
  active: ActivePiece | null = null;
  gameOver = false;
  paused = false;
  lastClear: ClearSummary | null = null;

  private readonly source: PieceSource;
  private readonly nextCount: number;
  private readonly startLevel: number;
  private queue: PieceType[] = [];
  private held: PieceType | null = null;
  private canHold = true;
  private gravityAccum = 0;
  private lockTimer = 0;
  private lockResets = 0;
  private grounded = false;
  private lastMoveWasRotation = false;
  private lastKickIndex = 0;
  private flashMs = 0;
  private flashLabel = '';

  constructor(options: GameOptions = {}) {
    this.startLevel = Math.max(1, options.startLevel ?? 1);
    this.nextCount = Math.max(1, options.nextCount ?? NEXT_COUNT);
    this.scoring = new Scoring(this.startLevel);
    if (options.pieceSource) this.source = options.pieceSource;
    else if (options.pieceSequence) this.source = new SequenceRandomizer(options.pieceSequence);
    else this.source = new BagRandomizer(options.rng ?? Math.random);
    this.reset();
  }

  // ---- public state -------------------------------------------------------

  get score(): number { return this.scoring.score; }
  get lines(): number { return this.scoring.lines; }
  get level(): number { return this.scoring.level; }
  get combo(): number { return this.scoring.combo; }
  get nextPieces(): readonly PieceType[] { return this.queue.slice(0, this.nextCount); }
  get holdPiece(): PieceType | null { return this.held; }
  get canHoldPiece(): boolean { return this.canHold; }
  get flashText(): string | null { return this.flashMs > 0 ? this.flashLabel || null : null; }

  /** Absolute board coordinates of the active piece's filled cells. */
  get activeCells(): Point[] {
    return this.active ? this.cellsOf(this.active) : [];
  }

  /** Where the active piece would land if hard-dropped (for the ghost). */
  get ghost(): ActivePiece | null {
    if (!this.active) return null;
    let y = this.active.y;
    while (!this.collides({ ...this.active, y: y + 1 })) y += 1;
    return { ...this.active, y };
  }

  /** Absolute coordinates of any piece's filled cells (used by the renderer). */
  cellsOf(p: ActivePiece): Point[] {
    const def = PIECE_DEFS[p.type];
    const matrix = def.states[p.rotation];
    const cells: Point[] = [];
    for (let y = 0; y < def.size; y += 1) {
      for (let x = 0; x < def.size; x += 1) {
        if (matrix[y][x]) cells.push({ x: p.x + x, y: p.y + y });
      }
    }
    return cells;
  }

  // ---- lifecycle ----------------------------------------------------------

  reset(): void {
    this.board.clear();
    this.scoring = new Scoring(this.startLevel);
    this.source.reset();
    this.queue = [];
    this.held = null;
    this.active = null;
    this.gameOver = false;
    this.paused = false;
    this.lastClear = null;
    this.gravityAccum = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.grounded = false;
    this.lastMoveWasRotation = false;
    this.lastKickIndex = 0;
    this.flashMs = 0;
    this.flashLabel = '';
    this.fillQueue();
    this.spawnNext();
  }

  restart(): void { this.reset(); }

  togglePause(): void {
    if (!this.gameOver) this.paused = !this.paused;
  }

  /**
   * Scenario helper used by the headless tests: place a specific piece at a
   * specific position/rotation. Not used by the browser game.
   */
  placeActive(type: PieceType, rotation: number, x: number, y: number): void {
    this.active = { type, rotation: ((rotation % 4) + 4) % 4, x, y };
    this.gravityAccum = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lastMoveWasRotation = false;
    this.lastKickIndex = 0;
    this.gameOver = false;
    this.canHold = true;
    this.refreshGrounded();
  }

  // ---- time ---------------------------------------------------------------

  update(dtMs: number): void {
    const dt = Math.min(Math.max(dtMs, 0), 1000);
    if (this.flashMs > 0) this.flashMs = Math.max(0, this.flashMs - dt);
    if (this.gameOver || this.paused || !this.active) return;

    this.gravityAccum += dt;
    const interval = gravityIntervalMs(this.scoring.level);
    while (this.gravityAccum >= interval && this.active) {
      this.gravityAccum -= interval;
      if (!this.tryMove(0, 1)) {
        this.gravityAccum = 0;
        break;
      }
      this.onFall();
    }

    this.refreshGrounded();
    if (this.grounded) {
      this.lockTimer += dt;
      if (this.lockTimer >= LOCK_DELAY_MS) this.lockPiece();
    } else {
      this.lockTimer = 0;
    }
  }

  // ---- player actions -----------------------------------------------------

  moveLeft(): boolean { return this.move(-1); }
  moveRight(): boolean { return this.move(1); }
  rotateCW(): boolean { return this.rotate(1); }
  rotateCCW(): boolean { return this.rotate(-1); }

  softDrop(): boolean {
    if (!this.canAct()) return false;
    if (!this.tryMove(0, 1)) {
      this.refreshGrounded();
      return false;
    }
    this.scoring.softDrop(1);
    this.onFall();
    return true;
  }

  hardDrop(): void {
    if (!this.canAct()) return;
    let rows = 0;
    while (this.tryMove(0, 1)) rows += 1;
    if (rows > 0) {
      this.scoring.hardDrop(rows);
      this.onFall();
    } else {
      this.refreshGrounded();
    }
    this.lockPiece();
  }

  hold(): boolean {
    if (!this.canAct() || !this.canHold) return false;
    const current = this.active!.type;
    if (this.held === null) {
      this.held = current;
      this.spawnNext();
    } else {
      const swap = this.held;
      this.held = current;
      this.spawn(swap);
    }
    this.canHold = false; // one hold per piece
    return true;
  }

  // ---- internals ----------------------------------------------------------

  private canAct(): boolean {
    return !this.gameOver && !this.paused && this.active !== null;
  }

  private move(dx: -1 | 1): boolean {
    if (!this.canAct()) return false;
    if (!this.tryMove(dx, 0)) return false;
    this.lastMoveWasRotation = false;
    this.onAdjustment();
    return true;
  }

  private rotate(dir: 1 | -1): boolean {
    if (!this.canAct()) return false;
    const current = this.active!;
    if (current.type === 'O') return false; // the O piece never rotates
    const from = current.rotation;
    const to = (from + dir + 4) % 4;
    const kicks = kicksFor(current.type, from, to);
    for (let i = 0; i < kicks.length; i += 1) {
      const [kx, ky] = kicks[i];
      const candidate: ActivePiece = {
        type: current.type,
        rotation: to,
        x: current.x + kx,
        y: current.y + ky,
      };
      if (!this.collides(candidate)) {
        this.active = candidate;
        this.lastMoveWasRotation = true;
        this.lastKickIndex = i;
        this.onAdjustment();
        return true;
      }
    }
    return false;
  }

  private tryMove(dx: number, dy: number): boolean {
    if (!this.active) return false;
    const candidate: ActivePiece = {
      ...this.active,
      x: this.active.x + dx,
      y: this.active.y + dy,
    };
    if (this.collides(candidate)) return false;
    this.active = candidate;
    return true;
  }

  /** A successful sideways move / rotation refreshes the lock delay. */
  private onAdjustment(): void {
    this.refreshGrounded();
    if (this.grounded && this.lockResets < MAX_LOCK_RESETS) {
      this.lockTimer = 0;
      this.lockResets += 1;
    }
  }

  /** Falling one row resets the move-reset counter and the lock timer. */
  private onFall(): void {
    this.lastMoveWasRotation = false;
    this.lockResets = 0;
    this.lockTimer = 0;
    this.refreshGrounded();
  }

  private refreshGrounded(): void {
    this.grounded = this.active !== null && this.collides({ ...this.active, y: this.active.y + 1 });
  }

  private collides(p: ActivePiece): boolean {
    const def = PIECE_DEFS[p.type];
    const matrix = def.states[p.rotation];
    for (let y = 0; y < def.size; y += 1) {
      for (let x = 0; x < def.size; x += 1) {
        if (matrix[y][x] && this.board.isOccupied(p.x + x, p.y + y)) return true;
      }
    }
    return false;
  }

  private fillQueue(): void {
    while (this.queue.length < this.nextCount + 1) {
      this.queue.push(this.source.next());
    }
  }

  private spawnNext(): void {
    this.fillQueue();
    const type = this.queue.shift()!;
    this.fillQueue();
    this.spawn(type);
  }

  private spawn(type: PieceType): void {
    this.active = { type, rotation: 0, x: SPAWN_X, y: SPAWN_Y };
    this.gravityAccum = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.grounded = false;
    this.lastMoveWasRotation = false;
    this.lastKickIndex = 0;
    this.canHold = true;
    // Block out: the spawn area is occupied.
    if (this.collides(this.active)) {
      this.active = null;
      this.gameOver = true;
    }
  }

  /** Simplified 3-corner T-Spin detection (Guideline corner rule). */
  private detectTSpin(): TSpin {
    const a = this.active;
    if (!a || a.type !== 'T' || !this.lastMoveWasRotation) return 'none';
    const cx = a.x + 1;
    const cy = a.y + 1;
    const filled = [
      this.board.isOccupied(cx - 1, cy - 1),
      this.board.isOccupied(cx + 1, cy - 1),
      this.board.isOccupied(cx - 1, cy + 1),
      this.board.isOccupied(cx + 1, cy + 1),
    ];
    const count = filled.filter(Boolean).length;
    if (count >= 3) return 'full';
    if (count === 2) {
      if (FRONT_CORNERS[a.rotation].every((i) => filled[i])) return 'full';
      if (this.lastKickIndex === 4) return 'mini';
    }
    return 'none';
  }

  private lockPiece(): void {
    const a = this.active;
    if (!a) return;
    const cells = this.cellsOf(a);
    const lockOut = cells.every((c) => c.y < HIDDEN_ROWS);
    const tSpin = this.detectTSpin();
    for (const c of cells) this.board.set(c.x, c.y, a.type);
    const cleared = this.board.clearLines();
    const perfectClear = cleared > 0 && this.board.isEmpty();
    const summary = this.scoring.registerClear({ lines: cleared, tSpin, perfectClear });
    this.lastClear = summary;
    if (summary.label) {
      this.flashLabel = summary.label;
      this.flashMs = FLASH_MS;
    }
    this.active = null;
    this.lastMoveWasRotation = false;
    this.canHold = true;
    if (lockOut) {
      this.gameOver = true;
      return;
    }
    this.spawnNext();
  }
}
