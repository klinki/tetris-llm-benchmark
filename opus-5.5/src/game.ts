// Pure game logic: no DOM access, driven entirely by player actions and update(dt).

import { Bag, RandomSource } from './bag.js';
import {
  boxSize,
  kickOffsets,
  pieceCells,
  PieceType,
  Point,
  Rotation,
  T_CORNERS,
  T_FRONT_CORNERS,
} from './pieces.js';

export const BOARD_WIDTH = 10;
export const VISIBLE_HEIGHT = 20;
/** Total rows including the buffer zone above the visible playfield. */
export const BOARD_HEIGHT = 40;
export const HIDDEN_ROWS = BOARD_HEIGHT - VISIBLE_HEIGHT;
export const NEXT_QUEUE_SIZE = 5;
export const LOCK_DELAY_MS = 500;
export const MAX_LOCK_RESETS = 15;
export const SOFT_DROP_FACTOR = 20;
export const LINES_PER_LEVEL = 10;
export const MAX_GRAVITY_LEVEL = 20;

export type Cell = PieceType | null;
export type GameStatus = 'playing' | 'paused' | 'gameover';
export type TSpin = 'none' | 'mini' | 'full';

export interface ActivePiece {
  type: PieceType;
  rotation: Rotation;
  /** Top-left corner of the piece's bounding box on the board. */
  x: number;
  y: number;
}

export interface ClearResult {
  lines: number;
  tSpin: TSpin;
  points: number;
  backToBack: boolean;
  combo: number;
  perfectClear: boolean;
  label: string;
}

/** Guideline gravity: seconds per row = (0.8 - (level - 1) * 0.007) ^ (level - 1). */
export function gravityIntervalMs(level: number): number {
  const l = Math.min(Math.max(level, 1), MAX_GRAVITY_LEVEL);
  return Math.pow(0.8 - (l - 1) * 0.007, l - 1) * 1000;
}

const LINE_POINTS = [0, 100, 300, 500, 800];
const T_SPIN_POINTS = [400, 800, 1200, 1600];
const T_SPIN_MINI_POINTS = [100, 200, 400];
const PERFECT_CLEAR_POINTS = [0, 800, 1200, 1800, 2000];
const B2B_PERFECT_TETRIS_POINTS = 3200;
const LINE_NAMES = ['', 'SINGLE', 'DOUBLE', 'TRIPLE', 'TETRIS'];

/** Base points for an action, before level multiplier and bonuses. */
export function actionPoints(lines: number, tSpin: TSpin): number {
  if (tSpin === 'full') return T_SPIN_POINTS[lines];
  if (tSpin === 'mini') return T_SPIN_MINI_POINTS[lines];
  return LINE_POINTS[lines];
}

/** "Difficult" clears maintain back-to-back chains. */
export function isDifficult(lines: number, tSpin: TSpin): boolean {
  return lines === 4 || (lines > 0 && tSpin !== 'none');
}

function emptyRow(): Cell[] {
  return new Array<Cell>(BOARD_WIDTH).fill(null);
}

export class Game {
  board: Cell[][] = [];
  active: ActivePiece | null = null;
  hold: PieceType | null = null;
  holdUsed = false;
  queue: PieceType[] = [];
  status: GameStatus = 'playing';
  score = 0;
  lines = 0;
  level = 1;
  /** -1 means no combo in progress. */
  combo = -1;
  backToBack = false;
  lastClear: ClearResult | null = null;
  /** Milliseconds since lastClear was set (for UI messages). */
  lastClearAge = 0;

  private bag: Bag;
  private gravityAccumulator = 0;
  private lockTimer = 0;
  private lockResets = 0;
  private lowestY = 0;
  private softDropping = false;
  private lastMoveWasRotation = false;
  private lastKickIndex = 0;

  constructor(private readonly random: RandomSource = Math.random) {
    this.bag = new Bag(random);
    this.restart();
  }

  restart(): void {
    this.bag = new Bag(this.random);
    this.board = Array.from({ length: BOARD_HEIGHT }, emptyRow);
    this.queue = Array.from({ length: NEXT_QUEUE_SIZE }, () => this.bag.next());
    this.hold = null;
    this.holdUsed = false;
    this.status = 'playing';
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.combo = -1;
    this.backToBack = false;
    this.lastClear = null;
    this.lastClearAge = 0;
    this.softDropping = false;
    this.spawn(this.takeNext());
  }

  togglePause(): void {
    if (this.status === 'playing') this.status = 'paused';
    else if (this.status === 'paused') this.status = 'playing';
  }

  // ---- Player actions -------------------------------------------------------

  moveLeft(): boolean {
    return this.shift(-1);
  }

  moveRight(): boolean {
    return this.shift(1);
  }

  rotateClockwise(): boolean {
    return this.rotate(1);
  }

  rotateCounterClockwise(): boolean {
    return this.rotate(-1);
  }

  setSoftDrop(enabled: boolean): void {
    if (enabled && !this.softDropping) {
      // Avoid instantly cashing in accumulated normal-gravity time at soft-drop speed.
      this.gravityAccumulator = Math.min(this.gravityAccumulator, this.gravityInterval(true));
    }
    this.softDropping = enabled;
  }

  hardDrop(): void {
    const piece = this.playableActive();
    if (!piece) return;
    const distance = this.dropDistance(piece);
    if (distance > 0) {
      piece.y += distance;
      this.lastMoveWasRotation = false;
    }
    this.score += 2 * distance;
    this.lockPiece();
  }

  holdPiece(): boolean {
    const piece = this.playableActive();
    if (!piece || this.holdUsed) return false;
    const next = this.hold ?? this.takeNext();
    this.hold = piece.type;
    this.spawn(next);
    this.holdUsed = true;
    return true;
  }

  // ---- Time -----------------------------------------------------------------

  update(dtMs: number): void {
    if (this.status !== 'playing') return;
    this.lastClearAge += dtMs;
    const piece = this.active;
    if (!piece) return;

    if (this.isGrounded(piece)) {
      this.gravityAccumulator = 0;
      this.lockTimer += dtMs;
      if (this.lockTimer >= LOCK_DELAY_MS) this.lockPiece();
      return;
    }

    const interval = this.gravityInterval(this.softDropping);
    this.gravityAccumulator += dtMs;
    while (this.gravityAccumulator >= interval) {
      this.gravityAccumulator -= interval;
      if (!this.tryMove(piece, 0, 1)) break;
      if (this.softDropping) this.score += 1;
      if (this.isGrounded(piece)) {
        this.gravityAccumulator = 0;
        break;
      }
    }
  }

  // ---- Queries --------------------------------------------------------------

  /** Board cells occupied by a piece. */
  cellsOf(piece: ActivePiece): Point[] {
    return pieceCells(piece.type, piece.rotation).map((c) => ({ x: piece.x + c.x, y: piece.y + c.y }));
  }

  /** Where the active piece would land (the ghost piece). */
  ghost(): ActivePiece | null {
    const piece = this.active;
    if (!piece) return null;
    return { ...piece, y: piece.y + this.dropDistance(piece) };
  }

  // ---- Internals ------------------------------------------------------------

  private playableActive(): ActivePiece | null {
    return this.status === 'playing' ? this.active : null;
  }

  private gravityInterval(softDrop: boolean): number {
    const interval = gravityIntervalMs(this.level);
    return softDrop ? interval / SOFT_DROP_FACTOR : interval;
  }

  private takeNext(): PieceType {
    const next = this.queue.shift()!;
    this.queue.push(this.bag.next());
    return next;
  }

  private spawn(type: PieceType): void {
    const piece: ActivePiece = {
      type,
      rotation: 0,
      // I and O spawn in the middle columns, the rest in the left-middle.
      x: Math.floor((BOARD_WIDTH - boxSize(type)) / 2),
      // Spawn in the two rows just above the visible playfield.
      y: HIDDEN_ROWS - 2,
    };
    this.gravityAccumulator = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lastMoveWasRotation = false;
    this.lastKickIndex = 0;

    if (this.collides(piece.type, piece.rotation, piece.x, piece.y)) {
      // Block out: the new piece overlaps existing blocks.
      this.active = null;
      this.status = 'gameover';
      return;
    }
    // Guideline: drop one row immediately if nothing is in the way.
    if (!this.collides(piece.type, piece.rotation, piece.x, piece.y + 1)) piece.y += 1;
    this.lowestY = piece.y;
    this.active = piece;
  }

  private collides(type: PieceType, rotation: Rotation, x: number, y: number): boolean {
    for (const c of pieceCells(type, rotation)) {
      const bx = x + c.x;
      const by = y + c.y;
      if (bx < 0 || bx >= BOARD_WIDTH || by < 0 || by >= BOARD_HEIGHT) return true;
      if (this.board[by][bx] !== null) return true;
    }
    return false;
  }

  private isOccupied(x: number, y: number): boolean {
    if (x < 0 || x >= BOARD_WIDTH || y < 0 || y >= BOARD_HEIGHT) return true;
    return this.board[y][x] !== null;
  }

  private isGrounded(piece: ActivePiece): boolean {
    return this.collides(piece.type, piece.rotation, piece.x, piece.y + 1);
  }

  private dropDistance(piece: ActivePiece): number {
    let distance = 0;
    while (!this.collides(piece.type, piece.rotation, piece.x, piece.y + distance + 1)) distance++;
    return distance;
  }

  private tryMove(piece: ActivePiece, dx: number, dy: number): boolean {
    if (this.collides(piece.type, piece.rotation, piece.x + dx, piece.y + dy)) return false;
    piece.x += dx;
    piece.y += dy;
    this.lastMoveWasRotation = false;
    this.trackLowestRow(piece);
    return true;
  }

  /** Reaching a new lowest row restores the lock delay and its reset budget. */
  private trackLowestRow(piece: ActivePiece): void {
    if (piece.y > this.lowestY) {
      this.lowestY = piece.y;
      this.lockResets = 0;
      this.lockTimer = 0;
    }
  }

  private shift(dx: number): boolean {
    const piece = this.playableActive();
    if (!piece) return false;
    const wasGrounded = this.isGrounded(piece);
    if (!this.tryMove(piece, dx, 0)) return false;
    this.afterManipulation(piece, wasGrounded);
    return true;
  }

  private rotate(direction: 1 | -1): boolean {
    const piece = this.playableActive();
    if (!piece) return false;
    const from = piece.rotation;
    const to = ((from + direction + 4) % 4) as Rotation;
    const kicks = kickOffsets(piece.type, from, to);
    for (let i = 0; i < kicks.length; i++) {
      const x = piece.x + kicks[i].x;
      const y = piece.y + kicks[i].y;
      if (this.collides(piece.type, to, x, y)) continue;
      const wasGrounded = this.isGrounded(piece);
      piece.rotation = to;
      piece.x = x;
      piece.y = y;
      this.lastMoveWasRotation = true;
      this.lastKickIndex = i;
      this.trackLowestRow(piece);
      this.afterManipulation(piece, wasGrounded);
      return true;
    }
    return false;
  }

  /** Extended placement lock-down: up to MAX_LOCK_RESETS moves/rotations reset the lock delay. */
  private afterManipulation(piece: ActivePiece, wasGrounded: boolean): void {
    const grounded = this.isGrounded(piece);
    if (!wasGrounded && !grounded) return;
    if (this.lockResets < MAX_LOCK_RESETS) {
      this.lockResets++;
      this.lockTimer = 0;
    } else if (grounded) {
      this.lockPiece();
    }
  }

  private detectTSpin(piece: ActivePiece): TSpin {
    if (piece.type !== 'T' || !this.lastMoveWasRotation) return 'none';
    const occupied = T_CORNERS.map((c) => this.isOccupied(piece.x + c.x, piece.y + c.y));
    if (occupied.filter(Boolean).length < 3) return 'none';
    const [a, b] = T_FRONT_CORNERS[piece.rotation];
    if (occupied[a] && occupied[b]) return 'full';
    // The fifth SRS kick (e.g. TST twist) always counts as a full T-spin.
    return this.lastKickIndex === 4 ? 'full' : 'mini';
  }

  private lockPiece(): void {
    const piece = this.active;
    if (!piece) return;
    const tSpin = this.detectTSpin(piece);
    let entirelyHidden = true;
    for (const { x, y } of this.cellsOf(piece)) {
      this.board[y][x] = piece.type;
      if (y >= HIDDEN_ROWS) entirelyHidden = false;
    }
    this.active = null;

    const cleared = this.clearFullRows();
    this.applyScore(cleared, tSpin);

    if (entirelyHidden) {
      // Lock out: the piece locked completely above the visible playfield.
      this.status = 'gameover';
      return;
    }
    this.holdUsed = false;
    this.spawn(this.takeNext());
  }

  private clearFullRows(): number {
    const remaining = this.board.filter((row) => row.some((cell) => cell === null));
    const cleared = BOARD_HEIGHT - remaining.length;
    for (let i = 0; i < cleared; i++) remaining.unshift(emptyRow());
    this.board = remaining;
    return cleared;
  }

  private applyScore(lines: number, tSpin: TSpin): void {
    if (lines === 0 && tSpin === 'none') {
      this.combo = -1;
      return;
    }

    const level = this.level;
    const difficult = isDifficult(lines, tSpin);
    const backToBack = difficult && this.backToBack;
    let points = actionPoints(lines, tSpin) * level;
    if (backToBack) points = Math.floor(points * 1.5);

    let perfectClear = false;
    if (lines > 0) {
      this.combo++;
      points += 50 * this.combo * level;
      this.backToBack = difficult;
      perfectClear = this.board.every((row) => row.every((cell) => cell === null));
      if (perfectClear) {
        const bonus = lines === 4 && backToBack ? B2B_PERFECT_TETRIS_POINTS : PERFECT_CLEAR_POINTS[lines];
        points += bonus * level;
      }
      this.lines += lines;
      this.level = Math.floor(this.lines / LINES_PER_LEVEL) + 1;
    } else {
      // A T-spin without lines ends the combo but leaves back-to-back untouched.
      this.combo = -1;
    }

    this.score += points;
    this.lastClear = {
      lines,
      tSpin,
      points,
      backToBack,
      combo: Math.max(this.combo, 0),
      perfectClear,
      label: describeClear(lines, tSpin),
    };
    this.lastClearAge = 0;
  }
}

function describeClear(lines: number, tSpin: TSpin): string {
  const name = LINE_NAMES[lines];
  if (tSpin === 'none') return name;
  const prefix = tSpin === 'mini' ? 'T-SPIN MINI' : 'T-SPIN';
  return name ? `${prefix} ${name}` : prefix;
}
