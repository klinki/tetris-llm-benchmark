import { BagRandomizer } from './randomizer.js';
import {
  getCells,
  spawnX,
  spawnY,
  kicksFor,
  type PieceType,
  type Rotation,
} from './tetromino.js';

export const COLS = 10;
export const VISIBLE_ROWS = 20;
export const HIDDEN_ROWS = 2;
export const ROWS = VISIBLE_ROWS + HIDDEN_ROWS;

export const LOCK_DELAY_MS = 500;
export const MAX_LOCK_RESETS = 15;
export const SOFT_DROP_INTERVAL_MS = 50;
export const MAX_LEVEL = 20;

export type Cell = PieceType | null;
export type Board = Cell[][];

export interface ActivePiece {
  type: PieceType;
  rotation: Rotation;
  x: number;
  y: number;
}

export type LastAction = 'move' | 'rotate' | 'drop' | null;

/** Gravity in milliseconds per row, following the Guideline curve. */
export function gravityMs(level: number): number {
  const clamped = Math.max(1, Math.min(level, MAX_LEVEL));
  const seconds = Math.pow(0.8 - (clamped - 1) * 0.007, clamped - 1);
  return Math.max(1, seconds * 1000);
}

function createBoard(): Board {
  return Array.from({ length: ROWS }, () =>
    Array<Cell>(COLS).fill(null),
  );
}

export class Game {
  board: Board = createBoard();
  active: ActivePiece | null = null;
  queue: PieceType[] = [];
  holdType: PieceType | null = null;
  canHold = true;

  score = 0;
  lines = 0;
  level = 1;
  combo = 0;
  b2b = false;

  gameOver = false;
  softDropping = false;
  lastAction: LastAction = null;

  private readonly randomizer: BagRandomizer;
  private gravityAccum = 0;
  private lockTimer = 0;
  private lockResets = 0;

  constructor(rng: () => number = Math.random) {
    this.randomizer = new BagRandomizer(rng);
    this.restart();
  }

  restart(): void {
    this.board = createBoard();
    this.holdType = null;
    this.canHold = true;
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.combo = 0;
    this.b2b = false;
    this.gameOver = false;
    this.softDropping = false;
    this.lastAction = null;
    this.gravityAccum = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.queue = this.randomizer.peek(5);
    this.spawn();
  }

  /** Advance the simulation by `dt` milliseconds. */
  update(dt: number): void {
    if (this.gameOver || !this.active || dt <= 0) {
      return;
    }

    const gravity = this.softDropping
      ? Math.min(gravityMs(this.level), SOFT_DROP_INTERVAL_MS)
      : gravityMs(this.level);

    this.gravityAccum += dt;

    while (
      this.gravityAccum >= gravity &&
      !this.gameOver &&
      this.active
    ) {
      if (!this.stepDown()) {
        // Resting on the stack: discard accumulated gravity so moving off a
        // ledge does not trigger an instant burst of drops.
        this.gravityAccum = 0;
        break;
      }

      this.gravityAccum -= gravity;
      if (this.softDropping) {
        this.score += 1;
      }
    }

    if (this.active && this.isGrounded()) {
      this.lockTimer += dt;
      if (this.lockTimer >= LOCK_DELAY_MS) {
        this.lockPiece();
      }
    } else {
      this.lockTimer = 0;
    }
  }

  move(direction: -1 | 1): boolean {
    if (!this.active || this.gameOver) {
      return false;
    }

    if (!this.tryMove(direction, 0)) {
      return false;
    }

    this.lastAction = 'move';
    return true;
  }

  rotate(direction: -1 | 1): boolean {
    if (!this.active || this.gameOver) {
      return false;
    }

    const piece = this.active;
    const from = piece.rotation;
    const to = ((from + direction + 4) % 4) as Rotation;
    const wasGrounded = this.isGrounded();

    for (const [kickX, kickY] of kicksFor(piece.type, from, to)) {
      const x = piece.x + kickX;
      const y = piece.y + kickY;

      if (!this.collides(piece.type, to, x, y)) {
        piece.x = x;
        piece.y = y;
        piece.rotation = to;
        this.afterMove(wasGrounded);
        this.lastAction = 'rotate';
        return true;
      }
    }

    return false;
  }

  hardDrop(): void {
    if (!this.active || this.gameOver) {
      return;
    }

    let dropped = 0;
    while (this.tryMove(0, 1)) {
      dropped += 1;
    }

    this.score += dropped * 2;
    this.lastAction = 'drop';
    this.lockPiece();
  }

  hold(): void {
    if (!this.active || !this.canHold || this.gameOver) {
      return;
    }

    const current = this.active.type;
    const swapped = this.holdType;
    this.holdType = current;
    this.canHold = false;

    if (swapped) {
      this.replacePiece(swapped);
    } else {
      const next = this.randomizer.next();
      this.queue = this.randomizer.peek(5);
      this.replacePiece(next);
    }
  }

  /** Y position the active piece would land at, or null when inactive. */
  ghostY(): number | null {
    if (!this.active) {
      return null;
    }

    const piece = this.active;
    let y = piece.y;

    while (!this.collides(piece.type, piece.rotation, piece.x, y + 1)) {
      y += 1;
    }

    return y;
  }

  /** Whether the active piece is resting on the stack or floor. */
  isGrounded(): boolean {
    const piece = this.active;
    if (!piece) {
      return false;
    }

    return this.collides(piece.type, piece.rotation, piece.x, piece.y + 1);
  }

  /** All board coordinates occupied by the active piece. */
  activeCells(): readonly (readonly [number, number])[] {
    const piece = this.active;
    if (!piece) {
      return [];
    }

    return getCells(piece.type, piece.rotation).map(
      ([x, y]) => [piece.x + x, piece.y + y] as const,
    );
  }

  private spawn(): void {
    const type = this.randomizer.next();
    this.queue = this.randomizer.peek(5);
    this.replacePiece(type);
  }

  private replacePiece(type: PieceType): void {
    this.active = {
      type,
      rotation: 0,
      x: spawnX(type),
      y: spawnY(type),
    };
    this.gravityAccum = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lastAction = null;

    if (this.collides(type, 0, this.active.x, this.active.y)) {
      this.active = null;
      this.gameOver = true;
    }
  }

  private stepDown(): boolean {
    if (!this.tryMove(0, 1)) {
      return false;
    }

    this.lastAction = 'move';
    return true;
  }

  private tryMove(dx: number, dy: number): boolean {
    const piece = this.active;
    if (!piece) {
      return false;
    }

    if (
      this.collides(
        piece.type,
        piece.rotation,
        piece.x + dx,
        piece.y + dy,
      )
    ) {
      return false;
    }

    const wasGrounded = this.isGrounded();
    piece.x += dx;
    piece.y += dy;
    this.afterMove(wasGrounded);
    return true;
  }

  private afterMove(wasGrounded: boolean): void {
    if (!this.isGrounded()) {
      // Airborne again: lock delay starts over.
      this.lockTimer = 0;
      this.lockResets = 0;
      return;
    }

    if (!wasGrounded) {
      // Just landed.
      this.lockTimer = 0;
      this.lockResets = 0;
      return;
    }

    // Movement or rotation while grounded refreshes the lock delay, but the
    // Guideline caps how many times this may happen.
    if (this.lockResets < MAX_LOCK_RESETS) {
      this.lockResets += 1;
      this.lockTimer = 0;
    }
  }

  private collides(
    type: PieceType,
    rotation: Rotation,
    x: number,
    y: number,
  ): boolean {
    for (const [cellX, cellY] of getCells(type, rotation)) {
      const boardX = x + cellX;
      const boardY = y + cellY;

      if (boardX < 0 || boardX >= COLS || boardY >= ROWS) {
        return true;
      }

      if (boardY >= 0 && this.board[boardY][boardX] !== null) {
        return true;
      }
    }

    return false;
  }

  private lockPiece(): void {
    const piece = this.active;
    if (!piece) {
      return;
    }

    const cells = this.activeCells();
    const tspin = this.detectTSpin(piece);
    const lockedAboveField = cells.every(([, y]) => y < HIDDEN_ROWS);

    for (const [x, y] of cells) {
      if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
        this.board[y][x] = piece.type;
      }
    }

    this.active = null;

    const cleared = this.clearLines();
    this.applyScore(cleared, tspin);

    this.canHold = true;
    this.lockTimer = 0;
    this.lockResets = 0;

    if (lockedAboveField) {
      this.gameOver = true;
      return;
    }

    this.spawn();
  }

  private clearLines(): number {
    let cleared = 0;

    for (let y = ROWS - 1; y >= 0; y -= 1) {
      if (this.board[y].every((cell) => cell !== null)) {
        this.board.splice(y, 1);
        this.board.unshift(Array<Cell>(COLS).fill(null));
        cleared += 1;
        y += 1;
      }
    }

    return cleared;
  }

  private detectTSpin(piece: ActivePiece): boolean {
    if (piece.type !== 'T' || this.lastAction !== 'rotate') {
      return false;
    }

    // Three-corner rule, using the corners of the T's 3x3 bounding box.
    const corners: readonly (readonly [number, number])[] = [
      [0, 0],
      [2, 0],
      [0, 2],
      [2, 2],
    ];
    let filled = 0;

    for (const [cornerX, cornerY] of corners) {
      const x = piece.x + cornerX;
      const y = piece.y + cornerY;

      if (
        x < 0 ||
        x >= COLS ||
        y >= ROWS ||
        (y >= 0 && this.board[y][x] !== null)
      ) {
        filled += 1;
      }
    }

    return filled >= 3;
  }

  private applyScore(cleared: number, tspin: boolean): void {
    if (cleared === 0 && !tspin) {
      this.combo = 0;
      return;
    }

    let points: number;

    if (tspin) {
      points = cleared === 0 ? 400 : [0, 800, 1200, 1600][cleared];
    } else {
      points = [0, 100, 300, 500, 800][cleared];
    }

    const difficult = cleared === 4 || (tspin && cleared > 0);

    if (difficult && this.b2b) {
      points = Math.floor(points * 1.5);
    }

    if (cleared > 0) {
      if (this.combo > 0) {
        points += 50 * this.combo * this.level;
      }
      this.combo += 1;
    } else {
      this.combo = 0;
    }

    if (cleared > 0) {
      this.b2b = difficult;
    }

    this.score += points * this.level;
    this.lines += cleared;
    this.level = Math.min(
      MAX_LEVEL,
      Math.floor(this.lines / 10) + 1,
    );
  }
}
