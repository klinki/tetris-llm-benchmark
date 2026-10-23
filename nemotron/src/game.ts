import { Cell, COLS, COLORS, PieceType, ROWS } from './types';
import { createBoard, clearLines, collides, lockPiece, cell, setCell } from './board';
import {
  ALL_PIECES,
  Piece,
  kicksFor,
  pieceCells,
  spawnPiece,
  SPAWN_Y,
} from './tetromino';

// Guideline score values for clearing 1..4 lines, multiplied by level.
const LINE_SCORE = [0, 40, 100, 300, 1200];

// Gravity: milliseconds per automatic drop for each level (1-indexed).
const GRAVITY_MS: number[] = [
  0,
  816, 724, 632, 540, 448, 356, 264, 172, 108, // 1..9
  88, 80, 72, 64, 56, 48, 40, 32, 28, 24,      // 10..19
  20, 16, 12, 8, 6, 4, 2,                      // 20..26
];

const LOCK_DELAY_MS = 500;
const SOFT_DROP_MS = 50;
const SOFT_DROP_SCORE = 1;
const HARD_DROP_SCORE = 2;

export interface GameState {
  readonly board: Cell[][];
  readonly piece: Piece | null;
  readonly ghost: Piece | null;
  readonly hold: PieceType | null;
  readonly next: readonly PieceType[];
  readonly score: number;
  readonly level: number;
  readonly lines: number;
  readonly gameOver: boolean;
  readonly canHold: boolean;
}

export class Game {
  private board: Cell[][];
  private piece: Piece | null = null;
  private hold: PieceType | null = null;
  private holdUsed = false;
  private nextQueue: PieceType[] = [];
  private bag: PieceType[] = [];

  private lines = 0;
  private score = 0;
  private level = 1;
  private gameOver = false;

  private dropTime = 0;
  private lockTime = 0;
  private softDrop = false;

  constructor() {
    this.board = createBoard();
    this.refillNext();
    this.spawn();
  }

  // ---- public state -------------------------------------------------------

  get state(): GameState {
    return {
      board: this.board,
      piece: this.piece,
      ghost: this.piece ? this.ghost() : null,
      hold: this.hold,
      next: this.nextQueue,
      score: this.score,
      level: this.level,
      lines: this.lines,
      gameOver: this.gameOver,
      canHold: !this.holdUsed && !this.gameOver,
    };
  }

  // ---- bag / next queue ---------------------------------------------------

  private refillNext() {
    while (this.nextQueue.length < 3) {
      if (this.bag.length === 0) {
        this.bag = shuffle([...ALL_PIECES]);
      }
      this.nextQueue.push(this.bag.shift()!);
    }
  }

  private spawn() {
    if (this.nextQueue.length === 0) this.refillNext();
    const type = this.nextQueue.shift()!;
    this.refillNext();
    this.piece = spawnPiece(type);
    this.lockTime = 0;
    this.softDrop = false;
    this.holdUsed = false;

    if (collides(this.board, this.piece!)) {
      // Top-out: spawn cell is blocked.
      this.gameOver = true;
      this.piece = null;
    }
  }

  // ---- movement -----------------------------------------------------------

  private tryMove(dx: number, dy: number): boolean {
    if (!this.piece || this.gameOver) return false;
    const next: Piece = { ...this.piece, x: this.piece.x + dx, y: this.piece.y + dy };
    if (collides(this.board, next)) return false;
    this.piece = next;
    this.lockTime = 0; // reset lock delay on any successful move
    return true;
  }

  moveLeft(): boolean {
    return this.tryMove(-1, 0);
  }

  moveRight(): boolean {
    return this.tryMove(1, 0);
  }

  softDropStart() {
    this.softDrop = true;
  }

  softDropStop() {
    this.softDrop = false;
  }

  // ---- rotation (SRS with wall kicks) -------------------------------------

  rotate(dir: 1 | -1): boolean {
    if (!this.piece || this.gameOver) return false;
    const from = this.piece.rot;
    const to = ((from + dir) % 4 + 4) % 4;
    const kicks = kicksFor(this.piece.type, from, to);
    for (const [kx, ky] of kicks) {
      const next: Piece = {
        ...this.piece,
        rot: to,
        x: this.piece.x + kx,
        y: this.piece.y + ky,
      };
      if (!collides(this.board, next)) {
        this.piece = next;
        this.lockTime = 0; // reset lock delay on rotation
        return true;
      }
    }
    return false;
  }

  rotateCW(): boolean {
    return this.rotate(1);
  }

  rotateCCW(): boolean {
    return this.rotate(-1);
  }

  // ---- hold ---------------------------------------------------------------

  holdPiece(): boolean {
    if (!this.piece || this.gameOver || this.holdUsed) return false;
    const current = this.piece.type;
    if (this.hold === null) {
      this.hold = current;
      this.spawn();
    } else {
      const nextType = this.hold;
      this.hold = current;
      this.piece = spawnPiece(nextType);
      this.holdUsed = true;
      if (collides(this.board, this.piece!)) {
        this.gameOver = true;
        this.piece = null;
      }
    }
    this.holdUsed = true;
    return true;
  }

  // ---- hard drop ----------------------------------------------------------

  hardDrop(): boolean {
    if (!this.piece || this.gameOver) return false;
    let dropped = 0;
    while (this.tryMove(0, 1)) dropped++;
    this.score += dropped * HARD_DROP_SCORE;
    this.lock();
    return true;
  }

  // ---- lock ---------------------------------------------------------------

  private lock() {
    if (!this.piece) return;
    lockPiece(this.board, this.piece);
    const cleared = clearLines(this.board);
    if (cleared > 0) {
      this.lines += cleared;
      this.level = Math.floor(this.lines / 10) + 1;
      this.score += LINE_SCORE[cleared] * this.level;
    }
    this.spawn();
  }

  // ---- ghost --------------------------------------------------------------

  private ghost(): Piece | null {
    if (!this.piece) return null;
    let g = { ...this.piece };
    while (!collides(this.board, { ...g, y: g.y + 1 })) {
      g = { ...g, y: g.y + 1 };
    }
    return g;
  }

  // ---- time step ----------------------------------------------------------

  /**
   * Advance the game by `dt` milliseconds. Handles automatic gravity and the
   * lock-delay timer. Returns true if the piece locked this step.
   */
  step(dt: number): boolean {
    if (this.gameOver || !this.piece) return false;

    const interval = this.softDrop ? SOFT_DROP_MS : gravityMs(this.level);
    this.dropTime += dt;

    while (this.dropTime >= interval) {
      this.dropTime -= interval;
      if (!this.tryMove(0, 1)) {
        // Piece is resting on the floor or another piece: advance lock delay.
        this.lockTime += interval;
        if (this.lockTime >= LOCK_DELAY_MS) {
          this.lock();
          return true;
        }
        // Stop consuming gravity ticks while resting; lock delay keeps counting
        // on subsequent ticks while the piece remains immobile.
        break;
      }
    }

    if (this.softDrop) {
      // Guideline: 1 point per cell soft-dropped.
      this.score += Math.floor(dt / SOFT_DROP_MS) * SOFT_DROP_SCORE;
    }

    return false;
  }

  /** Restart the game. */
  restart() {
    this.board = createBoard();
    this.hold = null;
    this.holdUsed = false;
    this.nextQueue = [];
    this.bag = [];
    this.lines = 0;
    this.score = 0;
    this.level = 1;
    this.gameOver = false;
    this.dropTime = 0;
    this.lockTime = 0;
    this.softDrop = false;
    this.refillNext();
    this.spawn();
  }
}

function gravityMs(level: number): number {
  const idx = Math.min(level, GRAVITY_MS.length - 1);
  return Math.max(GRAVITY_MS[idx], 20);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Expose cell helpers used by rendering/tests.
export { cell, setCell, COLS, ROWS, COLORS };
