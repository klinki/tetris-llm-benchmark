// Core game state and rules, following the Tetris Guideline:
// 7-bag randomizer, SRS wall kicks, hold, next queue, lock delay,
// Guideline scoring and gravity, and top-out on a blocked spawn.
import { Board, BUFFER_ROWS } from './board.js';
import { Cells, kicksFor, PIECE_TYPES, shapeCells } from './pieces.js';
import type { PieceType } from './pieces.js';
import { BagRandomizer } from './randomizer.js';

export type GameState = 'playing' | 'over';

export interface FallingPiece {
  type: PieceType;
  rotation: number; // 0..3
  x: number;        // bounding box top-left column
  y: number;        // bounding box top-left row
}

export const NEXT_COUNT = 5;      // pieces shown in the next queue
export const LOCK_DELAY = 0.5;    // seconds a piece rests before locking
export const MAX_LOCK_RESETS = 15; // guideline move-reset limit

// Guideline line clear scores, multiplied by level.
const LINE_SCORES = [0, 100, 300, 500, 800];

// Guideline gravity: seconds for a piece to fall one row.
export function gravityInterval(level: number): number {
  return Math.pow(0.8 - (level - 1) * 0.007, level - 1);
}

function spawnPosition(type: PieceType): { x: number; y: number } {
  // Pieces spawn horizontally centered, flat side down, in the hidden buffer.
  return { x: type === 'O' ? 4 : 3, y: BUFFER_ROWS - 2 };
}

export function pieceCells(piece: FallingPiece): Cells {
  return shapeCells(piece.type, piece.rotation).map(
    ([ox, oy]) => [piece.x + ox, piece.y + oy] as [number, number]
  );
}

export class Game {
  readonly board = new Board();
  private bag!: BagRandomizer;

  piece: FallingPiece | null = null;
  nextQueue: PieceType[] = [];
  holdType: PieceType | null = null;
  canHold = true;

  score = 0;
  lines = 0;
  level = 1;
  combo = -1;
  state: GameState = 'playing';
  softDropping = false;

  private fallTimer = 0;
  private lockTimer = 0;
  private lockResets = 0;

  constructor(private rng: () => number = Math.random) {
    this.restart();
  }

  restart(): void {
    this.bag = new BagRandomizer(this.rng);
    this.board.reset();
    this.nextQueue = [];
    for (let i = 0; i < NEXT_COUNT; i++) this.nextQueue.push(this.bag.next());
    this.holdType = null;
    this.canHold = true;
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.combo = -1;
    this.state = 'playing';
    this.softDropping = false;
    this.fallTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.spawnNext();
  }

  private spawn(type: PieceType): FallingPiece {
    return { type, rotation: 0, ...spawnPosition(type) };
  }

  private spawnNext(): void {
    const type = this.nextQueue.shift()!;
    this.nextQueue.push(this.bag.next());
    this.piece = this.spawn(type);
    this.fallTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    if (!this.board.isFree(pieceCells(this.piece))) this.gameOver();
  }

  private gameOver(): void {
    this.state = 'over';
    this.piece = null;
  }

  private canPlace(piece: FallingPiece): boolean {
    return this.board.isFree(pieceCells(piece));
  }

  private isGrounded(): boolean {
    return !!this.piece && !this.canPlace({ ...this.piece, y: this.piece.y + 1 });
  }

  // Resets lock delay after a successful move/rotation, with the guideline cap.
  private resetLockDelay(): void {
    if (this.isGrounded() && this.lockResets < MAX_LOCK_RESETS) {
      this.lockTimer = 0;
      this.lockResets++;
    }
  }

  move(dx: number): boolean {
    if (this.state !== 'playing' || !this.piece) return false;
    const moved = { ...this.piece, x: this.piece.x + dx };
    if (!this.canPlace(moved)) return false;
    this.piece = moved;
    this.resetLockDelay();
    return true;
  }

  // dir: 1 = clockwise, -1 = counter-clockwise. Uses SRS wall kicks.
  rotate(dir: 1 | -1): boolean {
    if (this.state !== 'playing' || !this.piece) return false;
    const from = this.piece.rotation;
    const to = (from + dir + 4) % 4;
    for (const [kx, ky] of kicksFor(this.piece.type, from, to)) {
      const candidate = { ...this.piece, rotation: to, x: this.piece.x + kx, y: this.piece.y + ky };
      if (this.canPlace(candidate)) {
        this.piece = candidate;
        this.resetLockDelay();
        return true;
      }
    }
    return false;
  }

  // Returns the row the piece would land on (for the ghost piece).
  ghostY(): number {
    if (!this.piece) return 0;
    let y = this.piece.y;
    while (this.board.isFree(pieceCells({ ...this.piece, y: y + 1 }))) y++;
    return y;
  }

  hardDrop(): void {
    if (this.state !== 'playing' || !this.piece) return;
    const distance = this.ghostY() - this.piece.y;
    this.piece.y += distance;
    this.score += 2 * distance;
    this.lock();
  }

  hold(): void {
    if (this.state !== 'playing' || !this.piece || !this.canHold) return;
    const current = this.piece.type;
    if (this.holdType !== null) {
      const swap = this.spawn(this.holdType);
      this.holdType = current;
      this.piece = swap;
      this.fallTimer = 0;
      this.lockTimer = 0;
      this.lockResets = 0;
      if (!this.canPlace(swap)) this.gameOver();
    } else {
      this.holdType = current;
      this.spawnNext();
    }
    this.canHold = false;
  }

  // Advances gravity and lock delay by dt seconds.
  update(dt: number): void {
    if (this.state !== 'playing' || !this.piece) return;

    const interval = this.softDropping
      ? gravityInterval(this.level) / 20
      : gravityInterval(this.level);
    this.fallTimer += dt;
    while (this.fallTimer >= interval && this.piece) {
      this.fallTimer -= interval;
      const moved: FallingPiece = { ...this.piece, y: this.piece.y + 1 };
      if (!this.canPlace(moved)) {
        this.fallTimer = 0;
        break;
      }
      this.piece = moved;
      if (this.softDropping) this.score += 1;
    }

    if (this.isGrounded()) {
      this.lockTimer += dt;
      if (this.lockTimer >= LOCK_DELAY || this.lockResets >= MAX_LOCK_RESETS) {
        this.lock();
      }
    } else {
      this.lockTimer = 0;
    }
  }

  private lock(): void {
    const piece = this.piece;
    if (!piece) return;

    const cells = pieceCells(piece);
    const value = PIECE_TYPES.indexOf(piece.type) + 1;
    for (const [x, y] of cells) this.board.set(x, y, value);

    const lockOut = cells.every(([, y]) => y < BUFFER_ROWS);
    const cleared = this.board.clearLines();
    if (cleared > 0) {
      this.combo++;
      this.score += LINE_SCORES[cleared] * this.level;
      if (this.combo > 0) this.score += 50 * this.combo * this.level;
      this.lines += cleared;
      this.level = Math.floor(this.lines / 10) + 1;
    } else {
      this.combo = -1;
    }

    if (lockOut) {
      this.gameOver();
      return;
    }
    this.canHold = true;
    this.spawnNext();
  }
}
