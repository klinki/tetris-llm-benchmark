/** The game engine: rules, timings, scoring and piece handling. */

import {
  ARE_MS,
  ARR_MS,
  BACK_TO_BACK_MULTIPLIER,
  COMBO_BONUS,
  DAS_MS,
  FIRST_VISIBLE_ROW,
  LINE_SCORES,
  LOCK_DELAY_MS,
  MAX_LOCK_RESETS,
  PERFECT_CLEAR_SCORES,
  PREVIEW_COUNT,
  SOFT_DROP_FACTOR,
  TSPIN_MINI_SCORES,
  TSPIN_SCORES,
  gravityIntervalMs,
} from './constants.js';
import { Board } from './board.js';
import { SevenBag, type RandomSource } from './randomizer.js';
import {
  pieceCells,
  rotationKicks,
  type OffsetList,
  type PieceType,
  type Rotation,
} from './pieces.js';

export type GameStatus = 'ready' | 'playing' | 'paused' | 'gameover';

export type TSpinKind = 'none' | 'mini' | 'full';

export interface ActivePiece {
  type: PieceType;
  rotation: Rotation;
  x: number;
  y: number;
}

/** Spawn positions of the pieces (matrix origin on the board). */
const SPAWN_X: Record<PieceType, number> = { I: 3, J: 3, L: 3, O: 4, S: 3, T: 3, Z: 3 };
/** The I piece spawns in the second row of its matrix, all others in the first. */
const SPAWN_Y: Record<PieceType, number> = {
  I: FIRST_VISIBLE_ROW - 1,
  J: FIRST_VISIBLE_ROW,
  L: FIRST_VISIBLE_ROW,
  O: FIRST_VISIBLE_ROW,
  S: FIRST_VISIBLE_ROW,
  T: FIRST_VISIBLE_ROW,
  Z: FIRST_VISIBLE_ROW,
};

/** Corners of the T piece matrix, relative to the matrix origin. */
const T_CORNERS: OffsetList = [
  { x: 0, y: 0 },
  { x: 2, y: 0 },
  { x: 0, y: 2 },
  { x: 2, y: 2 },
];

/** The two corners the T piece points to, per rotation state. */
const T_FRONT_CORNERS: Record<Rotation, OffsetList> = {
  0: [T_CORNERS[0], T_CORNERS[1]],
  1: [T_CORNERS[1], T_CORNERS[3]],
  2: [T_CORNERS[2], T_CORNERS[3]],
  3: [T_CORNERS[0], T_CORNERS[2]],
};

export class Game {
  board = new Board();

  current: ActivePiece | null = null;
  hold: PieceType | null = null;
  status: GameStatus = 'ready';

  score = 0;
  lines = 0;
  level = 1;
  combo = 0;
  backToBack = false;
  pieces = 0;
  /** Playtime in milliseconds. */
  elapsed = 0;

  private readonly bag: SevenBag;
  private queue: PieceType[] = [];
  private holdUsed = false;
  private softDropHeld = false;
  private direction: -1 | 0 | 1 = 0;
  private dasTimer = 0;
  private dasReached = false;
  private arrTimer = 0;
  private gravityTimer = 0;
  private lockTimer = 0;
  private lockResets = 0;
  private entryTimer = 0;
  private lastMoveWasRotation = false;
  private lastKickIndex = -1;

  constructor(random: RandomSource = Math.random) {
    this.bag = new SevenBag(random);
    this.reset();
    this.status = 'ready';
  }

  /** Pieces waiting in the next queue. */
  get nextQueue(): readonly PieceType[] {
    return this.queue.slice(0, PREVIEW_COUNT);
  }

  /** True while the piece is resting on the stack. */
  get isGrounded(): boolean {
    if (!this.current) return false;
    return !this.board.canPlace(pieceCells(this.current.type, this.current.rotation), this.current.x, this.current.y + 1);
  }

  /** Y position the current piece would land on when dropped straight down. */
  get ghostY(): number {
    if (!this.current) return 0;
    const cells = pieceCells(this.current.type, this.current.rotation);
    let y = this.current.y;
    while (this.board.canPlace(cells, this.current.x, y + 1)) y++;
    return y;
  }

  /** Starts (or restarts) a game. */
  start(): void {
    this.reset();
    this.status = 'playing';
    this.spawnPiece();
  }

  /** Restarts the game after a game over. */
  restart(): void {
    this.start();
  }

  /** Pauses and resumes the game. */
  togglePause(): void {
    if (this.status === 'playing') this.status = 'paused';
    else if (this.status === 'paused') this.status = 'playing';
  }

  private reset(): void {
    this.board = new Board();
    this.queue = [];
    this.current = null;
    this.hold = null;
    this.holdUsed = false;
    this.softDropHeld = false;
    this.direction = 0;
    this.dasTimer = 0;
    this.dasReached = false;
    this.arrTimer = 0;
    this.gravityTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.entryTimer = 0;
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.combo = 0;
    this.backToBack = false;
    this.pieces = 0;
    this.elapsed = 0;
    this.lastMoveWasRotation = false;
    this.lastKickIndex = -1;
  }

  /** Advances the game by the given amount of milliseconds. */
  update(dt: number): void {
    if (this.status !== 'playing') return;
    this.elapsed += dt;

    this.updateAutoShift(dt);

    if (this.entryTimer > 0) {
      this.entryTimer -= dt;
      if (this.entryTimer > 0) return;
      this.entryTimer = 0;
      this.spawnPiece();
      if (this.status !== 'playing') return;
    }

    const piece = this.current;
    if (!piece) return;

    if (this.isGrounded) {
      // The piece rests on the stack and locks down after the lock delay.
      this.lockTimer += dt;
      if (this.lockTimer >= LOCK_DELAY_MS) this.lockPiece();
      return;
    }

    this.lockTimer = 0;
    const interval = gravityIntervalMs(this.level) / (this.softDropHeld ? SOFT_DROP_FACTOR : 1);
    this.gravityTimer += dt;
    while (this.gravityTimer >= interval) {
      this.gravityTimer -= interval;
      if (!this.moveDown()) break;
      if (this.softDropHeld) this.score += 1;
    }
  }

  // --- input -------------------------------------------------------------

  /** Holds or releases the left/right direction key. */
  setDirection(direction: -1 | 1, pressed: boolean): void {
    if (pressed) {
      this.direction = direction;
      this.dasTimer = 0;
      this.dasReached = false;
      this.arrTimer = 0;
      this.shift(direction);
    } else if (this.direction === direction) {
      this.direction = 0;
      this.dasTimer = 0;
      this.dasReached = false;
      this.arrTimer = 0;
    }
  }

  /** Holds or releases the soft drop key. */
  setSoftDrop(pressed: boolean): void {
    this.softDropHeld = pressed;
  }

  /** Moves the piece one cell to the left. */
  moveLeft(): boolean {
    return this.shift(-1);
  }

  /** Moves the piece one cell to the right. */
  moveRight(): boolean {
    return this.shift(1);
  }

  /** Moves the piece one cell down (soft drop). */
  softDrop(): boolean {
    if (!this.current || this.status !== 'playing') return false;
    if (!this.moveDown()) return false;
    this.score += 1;
    this.lastMoveWasRotation = false;
    return true;
  }

  /** Rotates the piece clockwise. */
  rotateClockwise(): boolean {
    return this.rotate(1);
  }

  /** Rotates the piece counter clockwise. */
  rotateCounterClockwise(): boolean {
    return this.rotate(-1);
  }

  /** Drops the piece to the bottom of the stack and locks it. */
  hardDrop(): void {
    if (!this.current || this.status !== 'playing') return;
    let distance = 0;
    while (this.moveDown()) distance++;
    this.score += distance * 2;
    this.lockPiece();
  }

  /** Swaps the active piece with the hold slot. */
  holdPiece(): void {
    if (!this.current || this.holdUsed || this.status !== 'playing') return;
    const current = this.current;
    const stored = this.hold;
    this.hold = current.type;
    if (stored) {
      this.spawnPiece(stored);
    } else {
      this.spawnPiece();
    }
    // The hold can only be used again once the piece locks down.
    this.holdUsed = true;
  }

  // --- piece handling ----------------------------------------------------

  private shift(direction: -1 | 1): boolean {
    const piece = this.current;
    if (!piece || this.status !== 'playing') return false;
    const cells = pieceCells(piece.type, piece.rotation);
    if (!this.board.canPlace(cells, piece.x + direction, piece.y)) return false;
    piece.x += direction;
    this.lastMoveWasRotation = false;
    this.resetLockDelay();
    return true;
  }

  private moveDown(): boolean {
    const piece = this.current;
    if (!piece) return false;
    const cells = pieceCells(piece.type, piece.rotation);
    if (!this.board.canPlace(cells, piece.x, piece.y + 1)) return false;
    piece.y += 1;
    this.resetLockDelay();
    return true;
  }

  private rotate(direction: 1 | -1): boolean {
    const piece = this.current;
    if (!piece || this.status !== 'playing') return false;
    if (piece.type === 'O') return false;

    const from = piece.rotation;
    const to = ((from + direction) % 4 + 4) % 4 as Rotation;
    const cells = pieceCells(piece.type, to);
    const kicks = rotationKicks(piece.type, from, to);

    for (let i = 0; i < kicks.length; i++) {
      const kick = kicks[i];
      if (!this.board.canPlace(cells, piece.x + kick.x, piece.y + kick.y)) continue;
      piece.x += kick.x;
      piece.y += kick.y;
      piece.rotation = to;
      this.lastMoveWasRotation = true;
      this.lastKickIndex = i;
      this.resetLockDelay();
      return true;
    }
    return false;
  }

  /** Restarts the lock delay timer (move reset lock down, limited to 15 times). */
  private resetLockDelay(): void {
    if (!this.isGrounded) return;
    if (this.lockResets >= MAX_LOCK_RESETS) return;
    this.lockResets++;
    this.lockTimer = 0;
  }

  private spawnPiece(type?: PieceType): void {
    const pieceType = type ?? this.takeFromQueue();
    const piece: ActivePiece = {
      type: pieceType,
      rotation: 0,
      x: SPAWN_X[pieceType],
      y: SPAWN_Y[pieceType],
    };
    this.current = piece;
    this.holdUsed = false;
    this.gravityTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lastMoveWasRotation = false;
    this.lastKickIndex = -1;

    const cells = pieceCells(piece.type, piece.rotation);
    if (!this.board.canPlace(cells, piece.x, piece.y)) {
      // Top out: the piece does not fit into the playfield anymore.
      this.current = null;
      this.status = 'gameover';
    }
  }

  private takeFromQueue(): PieceType {
    while (this.queue.length <= PREVIEW_COUNT) {
      this.queue.push(this.bag.next());
    }
    const piece = this.queue.shift();
    if (!piece) throw new Error('The randomizer produced no piece.');
    return piece;
  }

  private lockPiece(): void {
    const piece = this.current;
    if (!piece) return;

    const tspin = this.detectTSpin(piece);
    const cells = pieceCells(piece.type, piece.rotation);
    this.board.place(cells, piece.x, piece.y, Board.valueOf(piece.type));
    const cleared = this.board.clearFullRows();

    this.applyScoring(cleared, tspin);
    this.pieces++;
    this.current = null;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.gravityTimer = 0;
    this.entryTimer = ARE_MS;
  }

  // --- scoring -----------------------------------------------------------

  private detectTSpin(piece: ActivePiece): TSpinKind {
    if (piece.type !== 'T' || !this.lastMoveWasRotation) return 'none';

    let filled = 0;
    for (const corner of T_CORNERS) {
      if (this.board.isBlocked(piece.x + corner.x, piece.y + corner.y)) filled++;
    }
    if (filled < 3) return 'none';

    const front = T_FRONT_CORNERS[piece.rotation];
    const frontFilled = front.every((corner) =>
      this.board.isBlocked(piece.x + corner.x, piece.y + corner.y),
    );
    if (frontFilled || filled === 4) return 'full';
    // The last wall kick of the rotation table lifts the piece over an
    // overhang, which counts as a full T-spin instead of a mini.
    return this.lastKickIndex === 4 ? 'full' : 'mini';
  }

  private applyScoring(cleared: number, tspin: TSpinKind): void {
    let base = 0;
    let difficult = false;

    if (tspin === 'full') {
      base = TSPIN_SCORES[Math.min(cleared, TSPIN_SCORES.length - 1)];
      difficult = cleared > 0;
    } else if (tspin === 'mini') {
      base = TSPIN_MINI_SCORES[Math.min(cleared, TSPIN_MINI_SCORES.length - 1)];
    } else {
      base = LINE_SCORES[Math.min(cleared, LINE_SCORES.length - 1)];
      difficult = cleared === 4;
    }

    if (difficult) {
      if (this.backToBack) base = Math.floor(base * BACK_TO_BACK_MULTIPLIER);
      this.backToBack = true;
    } else if (cleared > 0 && tspin === 'none') {
      // Only a plain line clear breaks the back-to-back chain.
      this.backToBack = false;
    }

    let gained = base * this.level;

    if (cleared > 0) {
      this.combo++;
      if (this.combo > 1) gained += COMBO_BONUS * (this.combo - 1) * this.level;
    } else {
      this.combo = 0;
    }

    if (cleared > 0 && this.board.isEmpty()) {
      gained += PERFECT_CLEAR_SCORES[Math.min(cleared, PERFECT_CLEAR_SCORES.length - 1)] * this.level;
    }

    this.score += gained;
    this.lines += cleared;
    this.level = Math.floor(this.lines / 10) + 1;
  }

  // --- helpers -----------------------------------------------------------

  private updateAutoShift(dt: number): void {
    if (this.direction === 0) return;
    if (!this.dasReached) {
      this.dasTimer += dt;
      if (this.dasTimer < DAS_MS) return;
      this.dasReached = true;
      return;
    }
    this.arrTimer += dt;
    while (this.arrTimer >= ARR_MS) {
      this.arrTimer -= ARR_MS;
      this.shift(this.direction);
    }
  }
}
