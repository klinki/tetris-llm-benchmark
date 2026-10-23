import { Board } from './board.js';
import { LOCK_DELAY, MAX_LOCK_RESETS, NEXT_QUEUE_SIZE, SOFT_DROP_INTERVAL } from './constants.js';
import { spawnPiece, type PieceState, type PieceType, type Rotation } from './pieces.js';
import { createSevenBag } from './random.js';
import { Scorer } from './scoring.js';
import { kickOffsets } from './srs.js';
import { detectTSpin, type SpinKind } from './tspin.js';

export type GameStatus = 'playing' | 'over';

/** Returns the type of the next piece each time it is called. */
export type PieceSource = () => PieceType;

export interface GameOptions {
  /** Defaults to a seven-bag randomizer. Tests pass a fixed sequence. */
  source?: PieceSource;
}

/** From this level on, gravity stays at the 20G speed. */
const MAX_GRAVITY_LEVEL = 20;

/** Seconds per row of natural gravity at a level (Guideline formula). */
export function gravityInterval(level: number): number {
  const capped = Math.min(level, MAX_GRAVITY_LEVEL);
  return Math.pow(0.8 - (capped - 1) * 0.007, capped - 1);
}

/**
 * The rules of one game: movement, rotation with wall kicks, gravity, lock
 * delay, hold, line clears, and top-out. It has no DOM dependencies, so the
 * same code runs in the browser and in headless tests.
 */
export class Game {
  readonly board = new Board();
  private scorer = new Scorer();
  private readonly source: PieceSource;
  private queue: PieceType[] = [];
  private heldPiece: PieceType | null = null;
  private holdAvailable = true;
  private piece: PieceState | null = null;
  private state: GameStatus = 'playing';

  /** Time accumulated towards the next gravity step. */
  private gravityTimer = 0;
  /** Time the active piece has spent touching down. */
  private lockTimer = 0;
  /** Lock-delay resets used since the piece last reached a new lowest row. */
  private lockResets = 0;
  private lowestRow = 0;
  private softDropping = false;
  private lastActionWasRotation = false;
  private lastKickIndex = 0;

  constructor(options: GameOptions = {}) {
    this.source = options.source ?? createSevenBag();
    this.start();
  }

  get status(): GameStatus {
    return this.state;
  }

  /** The piece being controlled, or null when the game is over. */
  get active(): PieceState | null {
    return this.piece;
  }

  get held(): PieceType | null {
    return this.heldPiece;
  }

  /** False after a hold until the next piece locks. */
  get canHold(): boolean {
    return this.holdAvailable;
  }

  /** Upcoming piece types, next first. */
  get nextPieces(): readonly PieceType[] {
    return this.queue;
  }

  get score(): number {
    return this.scorer.score;
  }

  get lines(): number {
    return this.scorer.lines;
  }

  get level(): number {
    return this.scorer.level;
  }

  /** Advances gravity and the lock delay by `dt` seconds. */
  update(dt: number): void {
    if (!this.piece) return;

    this.gravityTimer += dt;
    const interval = this.dropInterval();
    while (this.gravityTimer >= interval) {
      this.gravityTimer -= interval;
      if (!this.translate(0, 1)) {
        this.gravityTimer = 0;
        break;
      }
      if (this.softDropping) this.scorer.softDrop(1);
    }

    if (!this.isGrounded()) {
      this.lockTimer = 0;
      return;
    }
    this.lockTimer += dt;
    if (this.lockTimer >= LOCK_DELAY) this.lockPiece();
  }

  /** Moves the active piece one column left (-1) or right (1). */
  move(dx: -1 | 1): void {
    if (this.translate(dx, 0)) this.resetLockDelay();
  }

  /** Rotates clockwise (1) or counter-clockwise (-1), trying the wall kicks in order. */
  rotate(direction: 1 | -1): void {
    const piece = this.piece;
    if (!piece) return;
    const to = ((piece.rotation + direction + 4) % 4) as Rotation;
    const kicks = kickOffsets(piece.type, piece.rotation, to);
    for (const [index, [dx, dy]] of kicks.entries()) {
      // Kick offsets use +y up, so the row change is negated.
      const rotated: PieceState = { ...piece, rotation: to, x: piece.x + dx, y: piece.y - dy };
      if (this.board.canPlace(rotated)) {
        this.piece = rotated;
        this.lastActionWasRotation = true;
        this.lastKickIndex = index;
        this.trackLowestRow(rotated.y);
        this.resetLockDelay();
        return;
      }
    }
  }

  /** Turns soft drop on or off. While it is on, the piece falls faster and each row scores a point. */
  setSoftDrop(on: boolean): void {
    this.softDropping = on;
  }

  /** Drops the active piece straight to its landing row and locks it immediately. */
  hardDrop(): void {
    const piece = this.piece;
    if (!piece) return;
    const rows = this.landingRow() - piece.y;
    if (rows > 0) this.lastActionWasRotation = false;
    this.piece = { ...piece, y: piece.y + rows };
    this.scorer.hardDrop(rows);
    this.lockPiece();
  }

  /** Swaps the active piece with the held one, or stores it if nothing is held. Allowed once per lock. */
  hold(): void {
    const piece = this.piece;
    if (!piece || !this.holdAvailable) return;
    const previous = this.heldPiece;
    this.heldPiece = piece.type;
    this.holdAvailable = false;
    this.spawn(previous ?? this.takeNext());
  }

  /** Starts a new game, but only after game over. */
  restart(): void {
    if (this.state === 'over') this.start();
  }

  /** The row the active piece would occupy if it were dropped now. Used for the ghost piece. */
  landingRow(): number {
    const piece = this.piece;
    if (!piece) return 0;
    let y = piece.y;
    while (this.board.canPlace({ ...piece, y: y + 1 })) y++;
    return y;
  }

  private start(): void {
    this.board.clear();
    this.scorer = new Scorer();
    this.queue = [];
    this.heldPiece = null;
    this.holdAvailable = true;
    this.state = 'playing';
    this.softDropping = false;
    this.fillQueue();
    this.spawn(this.takeNext());
  }

  private fillQueue(): void {
    while (this.queue.length < NEXT_QUEUE_SIZE) this.queue.push(this.source());
  }

  private takeNext(): PieceType {
    const type = this.queue.shift()!;
    this.fillQueue();
    return type;
  }

  /** Puts a new piece at the spawn position. If it overlaps the stack, the game is over (top-out). */
  private spawn(type: PieceType): void {
    const piece = spawnPiece(type);
    this.gravityTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lowestRow = piece.y;
    this.lastActionWasRotation = false;
    this.lastKickIndex = 0;
    if (this.board.canPlace(piece)) {
      this.piece = piece;
    } else {
      this.piece = null;
      this.state = 'over';
    }
  }

  /** Writes the active piece into the stack, clears full rows, scores, and spawns the next piece. */
  private lockPiece(): void {
    const piece = this.piece;
    if (!piece) return;
    const spin: SpinKind = this.lastActionWasRotation
      ? detectTSpin(this.board, piece, this.lastKickIndex)
      : 'none';
    this.board.place(piece);
    this.scorer.lock(this.board.clearLines(), spin);
    this.holdAvailable = true;
    this.spawn(this.takeNext());
  }

  /** Moves the active piece by (dx, dy) if the destination is open. Returns whether it moved. */
  private translate(dx: number, dy: number): boolean {
    const piece = this.piece;
    if (!piece) return false;
    const moved: PieceState = { ...piece, x: piece.x + dx, y: piece.y + dy };
    if (!this.board.canPlace(moved)) return false;
    this.piece = moved;
    this.lastActionWasRotation = false;
    this.trackLowestRow(moved.y);
    return true;
  }

  /** Reaching a new lowest row restores the lock-delay resets, as in the Guideline. */
  private trackLowestRow(row: number): void {
    if (row > this.lowestRow) {
      this.lowestRow = row;
      this.lockResets = 0;
    }
  }

  /** A player move or rotation while touching down restarts the lock delay, up to MAX_LOCK_RESETS times. */
  private resetLockDelay(): void {
    if (this.isGrounded() && this.lockResets < MAX_LOCK_RESETS) {
      this.lockTimer = 0;
      this.lockResets += 1;
    }
  }

  private isGrounded(): boolean {
    const piece = this.piece;
    return piece !== null && !this.board.canPlace({ ...piece, y: piece.y + 1 });
  }

  /** Seconds per row for the current level, quickened while soft drop is held. */
  private dropInterval(): number {
    const gravity = gravityInterval(this.level);
    return this.softDropping ? Math.min(gravity, SOFT_DROP_INTERVAL) : gravity;
  }
}
