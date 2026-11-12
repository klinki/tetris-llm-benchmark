import { Bag } from './bag.js';
import { Board } from './board.js';
import {
  LINES_PER_LEVEL,
  LOCK_DELAY_MS,
  LOCK_RESET_LIMIT,
  MIN_SOFT_DROP_MS,
  NEXT_COUNT,
  SCORE,
  SOFT_DROP_FACTOR,
  gravityMs,
} from './constants.js';
import { kicksFor } from './kicks.js';
import { PIECES, absoluteCells } from './pieces.js';
import type { ActivePiece, Cell, ClearInfo, GameStatus, PieceType, Rotation, TSpinKind } from './types.js';

/** Corners of the rotation box of the T piece, used to detect a T-spin. */
const CORNERS: readonly Cell[] = [
  { x: 0, y: 0 },
  { x: 2, y: 0 },
  { x: 0, y: 2 },
  { x: 2, y: 2 },
];

/**
 * The two corners the T piece points at, per rotation state. A T-spin is
 * only a full one when both of them are filled.
 */
const FRONT_CORNERS: Record<Rotation, readonly Cell[]> = {
  0: [
    { x: 0, y: 0 },
    { x: 2, y: 0 },
  ],
  1: [
    { x: 2, y: 0 },
    { x: 2, y: 2 },
  ],
  2: [
    { x: 0, y: 2 },
    { x: 2, y: 2 },
  ],
  3: [
    { x: 0, y: 0 },
    { x: 0, y: 2 },
  ],
};

/** Options of the game. */
export interface GameOptions {
  /** Source of randomness used by the bag randomiser. */
  random?: () => number;
}

/**
 * The game itself. It knows nothing about the browser, so it can be played
 * and tested headlessly.
 */
export class Game {
  /** The playfield. */
  readonly board = new Board();

  private readonly bag: Bag;
  private active: ActivePiece | null = null;
  private queue: PieceType[] = [];
  private held: PieceType | null = null;
  private holdUsed = false;
  private rotatedLast = false;
  private softDropping = false;
  private gravityAcc = 0;
  private lockTimer = 0;
  private lockResets = 0;
  private combo = -1;
  private backToBack = false;

  /** Current score. */
  score = 0;
  /** Amount of lines cleared so far. */
  lines = 0;
  /** Current level, one level for every ten cleared lines. */
  level = 1;
  /** State of the game. */
  status: GameStatus = 'playing';
  /** Description of the last line clear. */
  lastClear: ClearInfo | null = null;

  constructor(options: GameOptions = {}) {
    this.bag = new Bag(options.random);
    this.reset();
  }

  /** The piece that is currently falling. */
  get current(): ActivePiece | null {
    return this.active;
  }

  /** The piece waiting in the hold slot. */
  get heldPiece(): PieceType | null {
    return this.held;
  }

  /** The pieces that are going to spawn next. */
  get nextQueue(): readonly PieceType[] {
    return this.queue;
  }

  /** True while the hold slot may still be used. */
  get canHold(): boolean {
    return !this.holdUsed;
  }

  /** True when the game is over. */
  get isOver(): boolean {
    return this.status === 'gameover';
  }

  /** True when the game is paused. */
  get isPaused(): boolean {
    return this.status === 'paused';
  }

  /** Starts a new game. */
  reset(): void {
    this.board.clear();
    this.bag.reset();
    this.active = null;
    this.queue = [];
    this.held = null;
    this.holdUsed = false;
    this.rotatedLast = false;
    this.softDropping = false;
    this.gravityAcc = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.combo = -1;
    this.backToBack = false;
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.status = 'playing';
    this.lastClear = null;
    this.refillQueue();
    this.spawn(this.takeFromQueue());
  }

  /** Replaces the pieces that spawn next. */
  setNextQueue(pieces: PieceType[]): void {
    this.queue = pieces.slice(0, NEXT_COUNT);
    this.refillQueue();
  }

  /** Pauses and resumes the game. */
  togglePause(): void {
    if (this.status === 'playing') {
      this.status = 'paused';
    } else if (this.status === 'paused') {
      this.status = 'playing';
    }
  }

  /** Turns the soft drop on or off. */
  setSoftDrop(active: boolean): void {
    if (this.softDropping === active) {
      return;
    }
    this.softDropping = active;
    this.gravityAcc = 0;
  }

  /** Advances the game by the given amount of milliseconds. */
  update(dt: number): void {
    if (this.status !== 'playing' || !this.active) {
      return;
    }
    this.applyGravity(dt);
    this.updateLockDelay(dt);
  }

  /** Moves the falling piece to the left or to the right. */
  move(dx: number): boolean {
    const piece = this.active;
    if (!piece || this.status !== 'playing') {
      return false;
    }
    if (!this.board.fits(piece.type, piece.rotation, piece.x + dx, piece.y)) {
      return false;
    }
    piece.x += dx;
    this.rotatedLast = false;
    this.afterAction();
    return true;
  }

  /** Rotates the falling piece, clockwise or anti clockwise. */
  rotate(direction: 1 | -1): boolean {
    const piece = this.active;
    if (!piece || this.status !== 'playing') {
      return false;
    }
    const from = piece.rotation;
    const to = ((from + (direction === 1 ? 1 : 3)) % 4) as Rotation;
    for (const kick of kicksFor(piece.type, from, to)) {
      const x = piece.x + kick.x;
      const y = piece.y + kick.y;
      if (this.board.fits(piece.type, to, x, y)) {
        piece.x = x;
        piece.y = y;
        piece.rotation = to;
        this.rotatedLast = true;
        this.afterAction();
        return true;
      }
    }
    return false;
  }

  /** Drops the falling piece to the bottom of the playfield and locks it. */
  hardDrop(): void {
    const piece = this.active;
    if (!piece || this.status !== 'playing') {
      return;
    }
    let distance = 0;
    while (this.board.fits(piece.type, piece.rotation, piece.x, piece.y + 1)) {
      piece.y++;
      distance++;
    }
    this.score += distance * SCORE.hardDrop;
    this.lockPiece();
  }

  /** Puts the falling piece into the hold slot and takes the other one out. */
  hold(): boolean {
    const piece = this.active;
    if (!piece || this.status !== 'playing' || this.holdUsed) {
      return false;
    }
    this.holdUsed = true;
    const current = piece.type;
    if (this.held) {
      const swapped = this.held;
      this.held = current;
      this.spawn(swapped);
    } else {
      this.held = current;
      this.spawn(this.takeFromQueue());
    }
    return true;
  }

  /** Spawns a piece at its spawn position. */
  spawn(type: PieceType): void {
    const def = PIECES[type];
    const piece: ActivePiece = { type, rotation: 0, x: def.spawnX, y: def.spawnY };
    this.active = piece;
    this.gravityAcc = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.rotatedLast = false;
    if (!this.board.fits(piece.type, piece.rotation, piece.x, piece.y)) {
      this.gameOver();
    }
  }

  /** Row the falling piece would land on, used to draw the ghost piece. */
  ghostY(): number {
    const piece = this.active;
    if (!piece) {
      return 0;
    }
    let y = piece.y;
    while (this.board.fits(piece.type, piece.rotation, piece.x, y + 1)) {
      y++;
    }
    return y;
  }

  /** Takes the next piece out of the queue and refills it. */
  private takeFromQueue(): PieceType {
    const piece = this.queue.shift();
    if (!piece) {
      throw new Error('The next queue is empty');
    }
    this.refillQueue();
    return piece;
  }

  private refillQueue(): void {
    while (this.queue.length < NEXT_COUNT) {
      this.queue.push(this.bag.next());
    }
  }

  private applyGravity(dt: number): void {
    const natural = gravityMs(this.level);
    const interval = this.softDropping
      ? Math.max(natural / SOFT_DROP_FACTOR, MIN_SOFT_DROP_MS)
      : natural;
    this.gravityAcc += dt;
    while (this.gravityAcc >= interval) {
      this.gravityAcc -= interval;
      if (!this.stepDown(this.softDropping)) {
        break;
      }
    }
  }

  /** Moves the piece one row down, returns false when it is blocked. */
  private stepDown(byPlayer: boolean): boolean {
    const piece = this.active;
    if (!piece) {
      return false;
    }
    if (!this.board.fits(piece.type, piece.rotation, piece.x, piece.y + 1)) {
      return false;
    }
    piece.y++;
    if (byPlayer) {
      this.score += SCORE.softDrop;
      this.rotatedLast = false;
    }
    // The piece reached a new lowest row, the lock delay starts over.
    this.resetLockDelay(false);
    return true;
  }

  private updateLockDelay(dt: number): void {
    const piece = this.active;
    if (!piece) {
      return;
    }
    if (this.board.fits(piece.type, piece.rotation, piece.x, piece.y + 1)) {
      this.lockTimer = 0;
      return;
    }
    this.lockTimer += dt;
    if (this.lockTimer >= LOCK_DELAY_MS) {
      this.lockPiece();
    }
  }

  /** Called after a move or a rotation of a piece that rests on the ground. */
  private afterAction(): void {
    const piece = this.active;
    if (!piece) {
      return;
    }
    if (!this.board.fits(piece.type, piece.rotation, piece.x, piece.y + 1)) {
      this.resetLockDelay(true);
    }
  }

  /** Restarts the lock delay, the reset counter only grows on player input. */
  private resetLockDelay(countAsReset: boolean): void {
    if (countAsReset) {
      if (this.lockResets >= LOCK_RESET_LIMIT) {
        return;
      }
      this.lockResets++;
    } else {
      this.lockResets = 0;
    }
    this.lockTimer = 0;
  }

  private lockPiece(): void {
    const piece = this.active;
    if (!piece) {
      return;
    }
    const cells = absoluteCells(piece);
    const tspin = this.detectTSpin(piece);
    this.board.lock(piece.type, cells);
    const lockedOut = cells.every((cell) => cell.y < 0);
    const cleared = this.board.clearLines();
    this.applyScore(cleared, tspin);
    this.active = null;
    if (lockedOut) {
      this.gameOver();
      return;
    }
    this.holdUsed = false;
    this.spawn(this.takeFromQueue());
  }

  /**
   * Detects a T-spin with the three corner rule: three of the four corners
   * of the rotation box have to be blocked by the playfield.
   */
  private detectTSpin(piece: ActivePiece): TSpinKind | null {
    if (piece.type !== 'T' || !this.rotatedLast) {
      return null;
    }
    let filled = 0;
    for (const corner of CORNERS) {
      if (this.board.isSolid(piece.x + corner.x, piece.y + corner.y)) {
        filled++;
      }
    }
    if (filled < 3) {
      return null;
    }
    let frontFilled = 0;
    for (const corner of FRONT_CORNERS[piece.rotation]) {
      if (this.board.isSolid(piece.x + corner.x, piece.y + corner.y)) {
        frontFilled++;
      }
    }
    return frontFilled === 2 ? 'full' : 'mini';
  }

  private applyScore(cleared: number, tspin: TSpinKind | null): void {
    if (cleared === 0 && !tspin) {
      this.combo = -1;
      this.lastClear = null;
      return;
    }

    const level = this.level;
    const wasBackToBack = this.backToBack;

    let base = SCORE.lines[cleared] ?? 0;
    if (tspin === 'full') {
      base = SCORE.tspin[cleared] ?? 0;
    } else if (tspin === 'mini') {
      base = SCORE.tspinMini[cleared] ?? 0;
    }

    const difficult = cleared === 4 || tspin !== null;
    let backToBack = wasBackToBack;
    if (cleared > 0) {
      if (wasBackToBack && difficult) {
        base = Math.floor(base * SCORE.backToBack);
      }
      backToBack = difficult;
    }

    if (cleared > 0) {
      this.combo++;
      this.lines += cleared;
      this.level = Math.floor(this.lines / LINES_PER_LEVEL) + 1;
    } else {
      this.combo = -1;
    }

    let gained = base * level;
    if (cleared > 0 && this.combo > 0) {
      gained += SCORE.combo * this.combo * level;
    }

    const perfectClear = cleared > 0 && this.board.isEmpty();
    if (perfectClear) {
      const bonus =
        wasBackToBack && cleared === 4 ? SCORE.perfectClearB2BTetris : (SCORE.perfectClear[cleared] ?? 0);
      gained += bonus * level;
    }

    this.score += gained;
    this.backToBack = backToBack;
    this.lastClear = {
      lines: cleared,
      tspin,
      combo: this.combo,
      perfectClear,
      backToBack: wasBackToBack && difficult,
    };
  }

  private gameOver(): void {
    this.status = 'gameover';
    this.active = null;
    this.softDropping = false;
  }
}
