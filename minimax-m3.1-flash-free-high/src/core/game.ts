import { Board } from './board.js';
import {
  FIRST_VISIBLE_ROW,
  HARD_DROP_POINTS,
  LINES_PER_LEVEL,
  LOCK_DELAY,
  MAX_LEVEL,
  MAX_LOCK_RESETS,
  SOFT_DROP_INTERVAL,
  SOFT_DROP_POINTS,
} from './constants.js';
import { getKicks } from './kicks.js';
import { cellsOf, SPAWN, type Piece, type PieceType } from './pieces.js';
import { PieceBag, type RandomSource } from './randomizer.js';
import { scoreClear, type TSpin } from './scoring.js';

/** Status of the game. */
export type GameStatus = 'playing' | 'gameover';

/** Number of pieces shown in the next queue. */
export const QUEUE_SIZE = 5;

/** Events emitted by the engine, consumed by the presentation layer. */
export type GameEvent =
  | { type: 'spawn'; piece: PieceType }
  | { type: 'move'; direction: -1 | 1 }
  | { type: 'rotate'; direction: 1 | -1 }
  | { type: 'hold'; piece: PieceType }
  | { type: 'softdrop'; distance: number }
  | { type: 'harddrop'; distance: number }
  | { type: 'lock'; lines: number; tspin: TSpin; points: number }
  | { type: 'clear'; lines: number; tspin: TSpin }
  | { type: 'levelup'; level: number }
  | { type: 'topout' };

/** The Tetris engine. Pure logic, no DOM and no timers of its own. */
export class Game {
  readonly board = new Board();
  readonly bag: PieceBag;

  /** The piece that is currently falling. */
  current: Piece | null = null;
  /** Upcoming pieces. */
  readonly queue: PieceType[] = [];
  /** The piece stored by hold. */
  hold: PieceType | null = null;
  /** True while the held piece cannot be swapped again. */
  holdUsed = false;

  score = 0;
  lines = 0;
  level = 1;
  combo = -1;
  backToBack = false;
  status: GameStatus = 'playing';

  /** Events produced since the last {@link drainEvents} call. */
  private events: GameEvent[] = [];

  private gravityAcc = 0;
  private softAcc = 0;
  private lockTimer = 0;
  private lockResets = 0;
  private grounded = false;
  private softDropping = false;
  private lastActionWasRotation = false;

  constructor(random: RandomSource = Math.random) {
    this.bag = new PieceBag(random);
    this.reset();
  }

  /** Starts a new game. */
  reset(): void {
    this.board.clear();
    this.queue.length = 0;
    this.current = null;
    this.hold = null;
    this.holdUsed = false;
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.combo = -1;
    this.backToBack = false;
    this.status = 'playing';
    this.events = [];
    this.gravityAcc = 0;
    this.softAcc = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.grounded = false;
    this.softDropping = false;
    this.lastActionWasRotation = false;
    this.fillQueue();
    this.spawn(this.takeFromQueue());
  }

  /** Returns and clears the pending events. */
  drainEvents(): GameEvent[] {
    const events = this.events;
    this.events = [];
    return events;
  }

  /** Time (ms) a piece needs to fall one cell at the current level. */
  gravityInterval(): number {
    const level = this.level;
    const seconds = Math.pow(0.8 - (level - 1) * 0.007, level - 1);
    // The guideline caps the gravity at level 15 (0.007 s per row).
    return Math.max(seconds * 1000, 7);
  }

  /** Advances the game by the given number of milliseconds. */
  update(deltaMs: number): void {
    if (this.status !== 'playing' || !this.current) return;
    const dt = Math.min(deltaMs, 250);

    if (this.softDropping) {
      this.softAcc += dt;
      while (this.softAcc >= SOFT_DROP_INTERVAL) {
        this.softAcc -= SOFT_DROP_INTERVAL;
        if (!this.stepDown(true)) break;
      }
    } else {
      const interval = this.gravityInterval();
      this.gravityAcc += dt;
      while (this.gravityAcc >= interval) {
        this.gravityAcc -= interval;
        if (!this.stepDown(false)) break;
      }
    }

    // A piece is grounded when it cannot fall any further.
    const piece = this.current;
    if (piece) {
      this.grounded = this.board.collides(piece.type, piece.rotation, piece.x, piece.y + 1);
    }

    if (this.grounded) {
      this.lockTimer += dt;
      if (this.lockTimer >= LOCK_DELAY) this.lockCurrent();
    } else {
      this.lockTimer = 0;
    }
  }

  /** Enables or disables soft dropping. */
  setSoftDrop(active: boolean): void {
    this.softDropping = active;
    if (!active) this.softAcc = 0;
  }

  /** Moves the current piece one cell to the left. */
  moveLeft(): boolean {
    return this.moveHorizontal(-1);
  }

  /** Moves the current piece one cell to the right. */
  moveRight(): boolean {
    return this.moveHorizontal(1);
  }

  /** Rotates the current piece clockwise (1) or counter clockwise (-1). */
  rotate(direction: 1 | -1): boolean {
    const piece = this.current;
    if (!piece || this.status !== 'playing') return false;
    const from = piece.rotation;
    const to = (from + (direction === 1 ? 1 : 3)) % 4;
    const kicks = getKicks(piece.type, from, to);
    for (let i = 0; i < kicks.length; i++) {
      const kick = kicks[i]!;
      const x = piece.x + kick[0];
      const y = piece.y + kick[1];
      if (!this.board.collides(piece.type, to, x, y)) {
        piece.x = x;
        piece.y = y;
        piece.rotation = to;
        this.lastActionWasRotation = true;
        this.onPieceMoved();
        this.events.push({ type: 'rotate', direction });
        return true;
      }
    }
    return false;
  }

  /** Drops the current piece to the bottom and locks it immediately. */
  hardDrop(): void {
    const piece = this.current;
    if (!piece || this.status !== 'playing') return;
    let distance = 0;
    while (!this.board.collides(piece.type, piece.rotation, piece.x, piece.y + 1)) {
      piece.y++;
      distance++;
    }
    if (distance > 0) {
      this.score += distance * HARD_DROP_POINTS;
      this.events.push({ type: 'harddrop', distance });
    }
    this.lockCurrent();
  }

  /** Swaps the current piece with the held piece. */
  holdPiece(): void {
    const piece = this.current;
    if (!piece || this.status !== 'playing' || this.holdUsed) return;
    const previous = this.hold;
    this.hold = piece.type;
    this.holdUsed = true;
    this.events.push({ type: 'hold', piece: piece.type });
    if (previous) {
      this.spawn(previous);
    } else {
      this.spawn(this.takeFromQueue());
    }
  }

  /** Position the current piece would land on. */
  ghost(): Piece | null {
    const piece = this.current;
    if (!piece) return null;
    let y = piece.y;
    while (!this.board.collides(piece.type, piece.rotation, piece.x, y + 1)) y++;
    return { ...piece, y };
  }

  /** The pieces shown in the next queue. */
  nextQueue(): readonly PieceType[] {
    return this.queue.slice(0, QUEUE_SIZE);
  }

  private moveHorizontal(direction: -1 | 1): boolean {
    const piece = this.current;
    if (!piece || this.status !== 'playing') return false;
    const x = piece.x + direction;
    if (this.board.collides(piece.type, piece.rotation, x, piece.y)) return false;
    piece.x = x;
    this.lastActionWasRotation = false;
    this.onPieceMoved();
    this.events.push({ type: 'move', direction });
    return true;
  }

  /** Moves the piece one cell down, returns false when it is blocked. */
  private stepDown(scored: boolean): boolean {
    const piece = this.current;
    if (!piece) return false;
    if (this.board.collides(piece.type, piece.rotation, piece.x, piece.y + 1)) {
      this.grounded = true;
      return false;
    }
    piece.y++;
    this.grounded = false;
    if (scored) this.score += SOFT_DROP_POINTS;
    return true;
  }

  /** Handles the lock delay reset after a move or rotation. */
  private onPieceMoved(): void {
    const piece = this.current;
    if (!piece) return;
    if (!this.board.collides(piece.type, piece.rotation, piece.x, piece.y + 1)) return;
    if (this.lockResets >= MAX_LOCK_RESETS) return;
    this.lockResets++;
    this.lockTimer = 0;
  }

  /** Locks the current piece, clears lines and spawns the next piece. */
  private lockCurrent(): void {
    const piece = this.current;
    if (!piece) return;

    const tspin = this.detectTSpin(piece);
    const rows = this.board.lock(piece);
    const cleared = rows.length;

    const result = scoreClear({
      lines: cleared,
      tspin,
      level: this.level,
      combo: this.combo,
      backToBack: this.backToBack,
    });
    this.score += result.points;
    this.combo = result.combo;
    this.backToBack = result.backToBack;

    this.board.clearRows(rows);
    if (cleared > 0) {
      this.lines += cleared;
      this.events.push({ type: 'clear', lines: cleared, tspin });
    }
    this.events.push({ type: 'lock', lines: cleared, tspin, points: result.points });

    const previousLevel = this.level;
    this.level = Math.min(MAX_LEVEL, Math.floor(this.lines / LINES_PER_LEVEL) + 1);
    if (this.level > previousLevel) this.events.push({ type: 'levelup', level: this.level });

    // Lock out: the whole piece came to rest above the visible playfield.
    const lockedOut = cellsOf(piece.type, piece.rotation).every(
      ([, cy]) => piece.y + cy < FIRST_VISIBLE_ROW,
    );

    this.current = null;
    this.grounded = false;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lastActionWasRotation = false;
    this.holdUsed = false;

    if (lockedOut) {
      this.topOut();
      return;
    }
    this.spawn(this.takeFromQueue());
  }

  /** Detects a T-spin using the three corner rule. */
  private detectTSpin(piece: Piece): TSpin {
    if (piece.type !== 'T' || !this.lastActionWasRotation) return 'none';
    const corners: ReadonlyArray<readonly [number, number]> = [
      [0, 0],
      [2, 0],
      [0, 2],
      [2, 2],
    ];
    const filled = corners.map(([cx, cy]) => this.board.isBlocked(piece.x + cx, piece.y + cy));
    if (filled.filter(Boolean).length < 3) return 'none';
    const frontPairs: ReadonlyArray<readonly (readonly [number, number])[]> = [
      [
        [0, 0],
        [2, 0],
      ],
      [
        [2, 0],
        [2, 2],
      ],
      [
        [0, 2],
        [2, 2],
      ],
      [
        [0, 0],
        [0, 2],
      ],
    ];
    const front = frontPairs[piece.rotation]!;
    const frontFilled = front.every(([cx, cy]) => this.board.isBlocked(piece.x + cx, piece.y + cy));
    return frontFilled ? 'full' : 'mini';
  }

  /** Places a new piece of the given type on the board. */
  private spawn(type: PieceType): void {
    const spawn = SPAWN[type];
    const piece: Piece = { type, rotation: 0, x: spawn.x, y: spawn.y };
    if (this.board.collides(type, 0, piece.x, piece.y)) {
      this.current = null;
      this.topOut();
      return;
    }
    this.current = piece;
    this.grounded = false;
    this.gravityAcc = 0;
    this.softAcc = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lastActionWasRotation = false;
    this.events.push({ type: 'spawn', piece: type });
  }

  /** Takes the next piece from the queue, refilling the queue if needed. */
  private takeFromQueue(): PieceType {
    this.fillQueue();
    return this.queue.shift()!;
  }

  /** Keeps the queue filled with at least {@link QUEUE_SIZE} upcoming pieces. */
  private fillQueue(): void {
    while (this.queue.length <= QUEUE_SIZE) this.queue.push(this.bag.next());
  }

  /** Ends the game. */
  private topOut(): void {
    this.status = 'gameover';
    this.events.push({ type: 'topout' });
  }
}
