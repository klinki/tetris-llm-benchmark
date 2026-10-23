import { Board, VISIBLE_TOP } from './board.js';
import { PieceSource } from './bag.js';
import { kickTests, pieceCells, type PieceType, type Rotation } from './pieces.js';
import {
  allClearPoints,
  basePoints,
  COMBO_POINTS,
  detectTSpin,
  isDifficult,
  LINE_CLEAR_NAMES,
  type Spin,
} from './scoring.js';

export const PREVIEW_COUNT = 5;

const SPAWN_ROW = 18;
const LOCK_DELAY = 0.5;
const MAX_LOCK_RESETS = 15;
const SOFT_DROP_INTERVAL = 0.05;
const SOFT_DROP_POINTS_PER_ROW = 1;
const HARD_DROP_POINTS_PER_ROW = 2;
const LINES_PER_LEVEL = 10;
const MAX_GRAVITY_LEVEL = 20;

export interface Piece {
  type: PieceType;
  rotation: Rotation;
  /** Column of the piece's box, and row of the box (y grows downward). */
  x: number;
  y: number;
}

export interface GameOptions {
  /** Source of randomness for the bag shuffle, returning values in [0, 1). */
  random?: () => number;
  /** Fixed piece order used instead of the bag (cycles). Meant for tests. */
  sequence?: readonly PieceType[];
}

/** Seconds per row of gravity at a level, from the Guideline formula. */
export function gravityInterval(level: number): number {
  const capped = Math.min(level, MAX_GRAVITY_LEVEL);
  return (0.8 - (capped - 1) * 0.007) ** (capped - 1);
}

export class Game {
  readonly board = new Board();
  private readonly source: PieceSource;

  private piece!: Piece;
  private queue: PieceType[] = [];
  private held: PieceType | null = null;
  private holdUsed = false;

  private scoreValue = 0;
  private linesValue = 0;
  private combo = -1;
  private backToBack = false;
  private over = false;
  private event = '';

  private softDropping = false;
  private gravityTimer = 0;
  private lockTimer = 0;
  private lockResets = 0;
  private lowestY = SPAWN_ROW;
  private lastRotated = false;
  private lastKickIndex = 0;

  constructor(options: GameOptions = {}) {
    this.source = new PieceSource(options.random, options.sequence);
    this.reset();
  }

  get active(): Readonly<Piece> {
    return this.piece;
  }

  /** The upcoming pieces, nearest first. */
  get next(): readonly PieceType[] {
    return this.queue.slice(0, PREVIEW_COUNT);
  }

  get heldPiece(): PieceType | null {
    return this.held;
  }

  get canHold(): boolean {
    return !this.holdUsed && !this.over;
  }

  get score(): number {
    return this.scoreValue;
  }

  get lines(): number {
    return this.linesValue;
  }

  get level(): number {
    return Math.floor(this.linesValue / LINES_PER_LEVEL) + 1;
  }

  get isOver(): boolean {
    return this.over;
  }

  /** Description of the last lock, such as "T-Spin Double B2B". Empty when nothing notable happened. */
  get lastEvent(): string {
    return this.event;
  }

  /** Row where the active piece would land if hard dropped. */
  get ghostY(): number {
    const { type, rotation, x } = this.piece;
    const shape = pieceCells(type, rotation);
    let y = this.piece.y;
    while (this.board.fits(shape, x, y + 1)) y++;
    return y;
  }

  /** Advances time by `dt` seconds: gravity, soft drop and the lock delay. */
  update(dt: number): void {
    if (this.over) return;

    if (this.isGrounded()) {
      this.gravityTimer = 0;
      this.lockTimer += dt;
      if (this.lockTimer >= LOCK_DELAY) this.lockPiece();
      return;
    }

    this.lockTimer = 0;
    const gravity = gravityInterval(this.level);
    const interval = this.softDropping ? Math.min(gravity, SOFT_DROP_INTERVAL) : gravity;
    this.gravityTimer += dt;
    while (this.gravityTimer >= interval && this.moveDown()) {
      this.gravityTimer -= interval;
      if (this.softDropping) this.scoreValue += SOFT_DROP_POINTS_PER_ROW;
    }
  }

  moveHorizontal(direction: -1 | 1): boolean {
    if (this.over) return false;
    const { type, rotation, x, y } = this.piece;
    if (!this.board.fits(pieceCells(type, rotation), x + direction, y)) return false;
    this.piece.x += direction;
    this.lastRotated = false;
    this.resetLockOnMove();
    return true;
  }

  /** Rotates clockwise (1) or anti-clockwise (-1), trying SRS wall kicks in order. */
  rotate(direction: 1 | -1): boolean {
    if (this.over) return false;
    const { type, rotation: from, x, y } = this.piece;
    const to = ((from + direction + 4) % 4) as Rotation;
    const tests = kickTests(type, from, to);
    for (let i = 0; i < tests.length; i++) {
      const [dx, dyUp] = tests[i];
      const nextX = x + dx;
      const nextY = y - dyUp;
      if (this.board.fits(pieceCells(type, to), nextX, nextY)) {
        this.piece.rotation = to;
        this.piece.x = nextX;
        this.piece.y = nextY;
        this.lastRotated = true;
        this.lastKickIndex = i;
        this.resetLockOnMove();
        return true;
      }
    }
    return false;
  }

  hardDrop(): void {
    if (this.over) return;
    let rows = 0;
    while (this.moveDown()) rows++;
    this.scoreValue += rows * HARD_DROP_POINTS_PER_ROW;
    this.lockPiece();
  }

  /** Swaps the active piece with the held one (or stores it). Allowed once per spawned piece. */
  hold(): void {
    if (this.over || this.holdUsed) return;
    const current = this.piece.type;
    if (this.held === null) {
      this.held = current;
      this.spawn(this.takeNext());
    } else {
      const incoming = this.held;
      this.held = current;
      this.spawn(incoming);
    }
    this.holdUsed = true;
  }

  setSoftDrop(on: boolean): void {
    this.softDropping = on;
  }

  /** Starts a new game after game over. Does nothing while a game is running. */
  restart(): void {
    if (this.over) this.reset();
  }

  private reset(): void {
    this.board.clear();
    this.queue = [];
    this.held = null;
    this.holdUsed = false;
    this.scoreValue = 0;
    this.linesValue = 0;
    this.combo = -1;
    this.backToBack = false;
    this.over = false;
    this.event = '';
    this.softDropping = false;
    this.spawn(this.takeNext());
  }

  private takeNext(): PieceType {
    while (this.queue.length <= PREVIEW_COUNT) this.queue.push(this.source.next());
    return this.queue.shift()!;
  }

  private spawn(type: PieceType): void {
    // O sits on columns 4-5; every other shape starts on column 3.
    const x = type === 'O' ? 4 : 3;
    this.piece = { type, rotation: 0, x, y: SPAWN_ROW };
    this.lowestY = SPAWN_ROW;
    this.lockResets = 0;
    this.lockTimer = 0;
    this.gravityTimer = 0;
    this.lastRotated = false;
    if (!this.fits(type, 0, x, SPAWN_ROW)) this.over = true;
  }

  private fits(type: PieceType, rotation: Rotation, x: number, y: number): boolean {
    return this.board.fits(pieceCells(type, rotation), x, y);
  }

  private isGrounded(): boolean {
    return !this.fits(this.piece.type, this.piece.rotation, this.piece.x, this.piece.y + 1);
  }

  private moveDown(): boolean {
    const { type, rotation, x, y } = this.piece;
    if (!this.fits(type, rotation, x, y + 1)) return false;
    this.piece.y++;
    this.lastRotated = false;
    this.lockTimer = 0;
    // Reaching a new lowest row earns fresh lock resets.
    if (this.piece.y > this.lowestY) {
      this.lowestY = this.piece.y;
      this.lockResets = 0;
    }
    return true;
  }

  /** Move reset: a successful move or rotation on the ground restarts the lock delay, up to a limit. */
  private resetLockOnMove(): void {
    if (this.isGrounded() && this.lockResets < MAX_LOCK_RESETS) {
      this.lockTimer = 0;
      this.lockResets++;
    }
  }

  private lockPiece(): void {
    const { type, rotation, x, y } = this.piece;
    const spin: Spin =
      type === 'T' && this.lastRotated ? detectTSpin(this.board, rotation, x, y, this.lastKickIndex) : 'none';

    let lockOut = true;
    for (const [dx, dy] of pieceCells(type, rotation)) {
      this.board.set(x + dx, y + dy, type);
      if (y + dy >= VISIBLE_TOP) lockOut = false;
    }
    if (lockOut) {
      this.over = true;
      return;
    }

    this.scoreClear(spin);
    this.holdUsed = false;
    this.spawn(this.takeNext());
  }

  private scoreClear(spin: Spin): void {
    const level = this.level;
    const lines = this.board.clearFullRows();
    const labels: string[] = [];
    if (spin !== 'none') labels.push(spin === 'full' ? 'T-Spin' : 'T-Spin Mini');

    let points = basePoints(lines, spin) * level;
    if (lines === 0) {
      this.combo = -1;
    } else {
      const difficult = isDifficult(lines, spin);
      labels.push(LINE_CLEAR_NAMES[lines]);
      if (difficult && this.backToBack) {
        points = Math.floor(points * 1.5);
        labels.push('B2B');
      }
      this.backToBack = difficult;

      this.combo++;
      if (this.combo > 0) {
        points += COMBO_POINTS * this.combo * level;
        labels.push(`${this.combo}x Combo`);
      }
      if (this.board.isEmpty()) {
        points += allClearPoints(lines) * level;
        labels.push('All Clear');
      }
    }

    this.event = labels.join(' ');
    this.scoreValue += points;
    this.linesValue += lines;
  }
}
