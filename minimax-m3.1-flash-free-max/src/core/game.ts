import { Board } from './board.js';
import {
  BUFFER_ROWS,
  LOCK_DELAY_MS,
  MAX_LOCK_RESETS,
  PREVIEW_COUNT,
  SOFT_DROP_FACTOR,
} from './constants.js';
import { gravityMsPerRow } from './gravity.js';
import { getCells, getKickOffsets, SPAWN_POSITIONS } from './pieces.js';
import { SevenBag } from './randomizer.js';
import {
  HARD_DROP_POINTS,
  SOFT_DROP_POINTS,
  isDifficultClear,
  levelForLines,
  lineClearPoints,
} from './scoring.js';
import type { GameStatus, Piece, PieceType, Rotation } from './types.js';

export interface GameOptions {
  /** Randomizer handing out the pieces, replaceable for deterministic tests. */
  randomizer?: SevenBag;
}

/**
 * The rules of the game: spawning, movement, rotation, hold, gravity, lock
 * delay, line clears and scoring. The class knows nothing about the browser,
 * which keeps it testable outside of a page.
 */
export class Game {
  readonly board = new Board();

  /** The falling piece, `null` while the game is over. */
  current: Piece | null = null;

  /** The piece kept in the hold slot. */
  hold: PieceType | null = null;

  status: GameStatus = 'playing';
  score = 0;
  lines = 0;
  level = 1;

  /** Number of consecutive line clears, `-1` when the last piece cleared nothing. */
  combo = -1;

  /** Number of consecutive difficult clears, `0` when the chain is broken. */
  b2bStreak = 0;

  private readonly randomizer: SevenBag;
  private readonly queue: PieceType[] = [];
  private holdUsed = false;
  private dropTimer = 0;
  private lockTimer = 0;
  private lockResets = 0;
  private softDrop = false;

  constructor(options: GameOptions = {}) {
    this.randomizer = options.randomizer ?? new SevenBag();
  }

  /** Starts a new game on an empty board. */
  reset(): void {
    this.board.clear();
    this.current = null;
    this.hold = null;
    this.holdUsed = false;
    this.queue.length = 0;
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.combo = -1;
    this.b2bStreak = 0;
    this.dropTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.softDrop = false;
    this.status = 'playing';
    this.spawnNext();
  }

  /** The pieces that are about to appear. */
  get next(): readonly PieceType[] {
    return this.queue.slice(0, PREVIEW_COUNT);
  }

  /** The position the falling piece takes when it drops straight down. */
  get ghost(): Piece | null {
    let piece = this.current;
    if (!piece) return null;
    while (!this.board.collides({ ...piece, y: piece.y + 1 })) {
      piece = { ...piece, y: piece.y + 1 };
    }
    return piece;
  }

  /** Advances the game by the given amount of milliseconds. */
  tick(deltaMs: number): void {
    if (this.status !== 'playing' || !this.current) return;

    const gravity = gravityMsPerRow(this.level);
    const interval = this.softDrop ? gravity / SOFT_DROP_FACTOR : gravity;
    this.dropTimer += deltaMs;
    while (this.dropTimer >= interval) {
      this.dropTimer -= interval;
      if (!this.stepDown()) break;
    }

    if (this.isGrounded()) {
      this.lockTimer += deltaMs;
      if (this.lockTimer >= LOCK_DELAY_MS) this.lockPiece();
    } else {
      this.lockTimer = 0;
    }
  }

  /** Moves the falling piece one column to the left. */
  moveLeft(): boolean {
    return this.move(-1);
  }

  /** Moves the falling piece one column to the right. */
  moveRight(): boolean {
    return this.move(1);
  }

  /**
   * Rotates the falling piece. The Super Rotation System wall kicks are tried
   * until one of them results in a free position.
   */
  rotate(direction: 1 | -1): boolean {
    const piece = this.current;
    if (!piece) return false;

    const from = piece.rotation;
    const to = (((from + direction) % 4) + 4) % 4 as Rotation;
    for (const offset of getKickOffsets(piece.type, from, to)) {
      const rotated: Piece = {
        type: piece.type,
        rotation: to,
        x: piece.x + offset.x,
        y: piece.y + offset.y,
      };
      if (!this.board.collides(rotated)) {
        this.current = rotated;
        this.onPieceMoved();
        return true;
      }
    }
    return false;
  }

  /** Drops the falling piece to the bottom and locks it right away. */
  hardDrop(): void {
    let piece = this.current;
    if (!piece) return;

    let distance = 0;
    while (!this.board.collides({ ...piece, y: piece.y + 1 })) {
      piece = { ...piece, y: piece.y + 1 };
      distance += 1;
    }
    this.current = piece;
    this.score += distance * HARD_DROP_POINTS;
    this.lockPiece();
  }

  /** Turns the soft drop on or off. */
  setSoftDrop(active: boolean): void {
    if (this.softDrop === active) return;
    this.softDrop = active;
    this.dropTimer = 0;
  }

  /**
   * Swaps the falling piece with the one in the hold slot. The slot can only
   * be used once per piece, it is released when the next piece is locked.
   */
  holdPiece(): boolean {
    if (this.holdUsed || !this.current) return false;

    const held = this.hold;
    this.hold = this.current.type;
    this.holdUsed = true;
    if (held === null) {
      this.spawnNext();
    } else {
      this.spawn(held);
    }
    return true;
  }

  /** Switches between playing and paused. */
  togglePause(): void {
    if (this.status === 'playing') {
      this.status = 'paused';
    } else if (this.status === 'paused') {
      this.status = 'playing';
    }
  }

  private move(delta: number): boolean {
    const piece = this.current;
    if (!piece) return false;

    const moved: Piece = { ...piece, x: piece.x + delta };
    if (this.board.collides(moved)) return false;

    this.current = moved;
    this.onPieceMoved();
    return true;
  }

  /** Moves the piece one row down, returns false when it is resting on a surface. */
  private stepDown(): boolean {
    const piece = this.current;
    if (!piece) return false;

    const moved: Piece = { ...piece, y: piece.y + 1 };
    if (this.board.collides(moved)) return false;

    this.current = moved;
    if (this.softDrop) this.score += SOFT_DROP_POINTS;
    return true;
  }

  /**
   * Moving or rotating a resting piece postpones the lock, but only a limited
   * number of times so pieces cannot be kept alive forever.
   */
  private onPieceMoved(): void {
    if (!this.isGrounded()) return;
    if (this.lockResets < MAX_LOCK_RESETS) {
      this.lockResets += 1;
      this.lockTimer = 0;
    } else {
      this.lockTimer = LOCK_DELAY_MS;
    }
  }

  /** True when the falling piece cannot move down any further. */
  private isGrounded(): boolean {
    const piece = this.current;
    if (!piece) return false;
    return this.board.collides({ ...piece, y: piece.y + 1 });
  }

  /** Freezes the falling piece, clears lines and spawns the next one. */
  private lockPiece(): void {
    const piece = this.current;
    if (!piece) return;

    const aboveField = getCells(piece.type, piece.rotation).every(
      (cell) => piece.y + cell.y < BUFFER_ROWS,
    );
    this.board.lock(piece);
    this.applyClear(this.board.clearLines());

    if (aboveField) {
      // Lock out: the piece came to rest completely above the visible field.
      this.status = 'gameover';
      this.current = null;
      return;
    }
    this.holdUsed = false;
    this.spawnNext();
  }

  /** Hands out the next piece of the queue and puts it on the board. */
  private spawnNext(): void {
    this.fillQueue();
    const type = this.queue.shift() as PieceType;
    this.fillQueue();
    this.spawn(type);
  }

  /** Puts a piece on its spawn position, ending the game when it is blocked. */
  private spawn(type: PieceType): void {
    const position = SPAWN_POSITIONS[type];
    const piece: Piece = { type, rotation: 0, x: position.x, y: position.y };

    this.current = piece;
    this.dropTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;

    if (this.board.collides(piece)) {
      // Blocked spawn: the stack reached the top of the field.
      this.status = 'gameover';
      this.current = null;
    }
  }

  private fillQueue(): void {
    while (this.queue.length < PREVIEW_COUNT + 1) {
      this.queue.push(this.randomizer.next());
    }
  }

  /** Updates score, combo, back-to-back chain and level after a lock. */
  private applyClear(cleared: number): void {
    if (cleared === 0) {
      this.combo = -1;
      this.b2bStreak = 0;
      return;
    }

    this.lines += cleared;
    this.combo += 1;
    const streak = isDifficultClear(cleared) ? this.b2bStreak + 1 : 0;
    this.score += lineClearPoints(cleared, this.level, this.combo, streak);
    this.b2bStreak = streak;
    this.level = levelForLines(this.lines);
  }
}
