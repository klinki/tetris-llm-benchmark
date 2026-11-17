import { Board } from './board.js';
import { BagRandomizer } from './randomizer.js';
import { PIECES, getCells } from './pieces.js';
import { comboScore, lineClearScore } from './scoring.js';
import {
  gravityIntervalMs,
  HIDDEN_ROWS,
  LINES_PER_LEVEL,
  LOCK_DELAY_MS,
  MAX_LOCK_RESETS,
  NEXT_COUNT,
} from './constants.js';
import type { ActivePiece, PieceType, Rotation } from './types.js';

/**
 * Pure game logic: no DOM access. Drives gravity, lock delay, SRS movement,
 * hold, scoring and top-out. Rendering and input live in separate modules.
 */
export class Game {
  readonly board = new Board();
  nextQueue: PieceType[] = [];
  current: ActivePiece | null = null;
  holdType: PieceType | null = null;
  canHold = true;
  score = 0;
  lines = 0;
  level = 1;
  gameOver = false;

  private randomizer = new BagRandomizer();
  private gravityMs = 0;
  private lockMs = 0;
  private lockResets = 0;
  private backToBack = false;
  private combo = -1;

  constructor() {
    this.reset();
  }

  reset(): void {
    this.board.reset();
    this.randomizer = new BagRandomizer();
    this.nextQueue = [];
    while (this.nextQueue.length < NEXT_COUNT) this.nextQueue.push(this.randomizer.next());
    this.holdType = null;
    this.canHold = true;
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.gameOver = false;
    this.gravityMs = 0;
    this.lockMs = 0;
    this.lockResets = 0;
    this.backToBack = false;
    this.combo = -1;
    this.current = null;
    this.spawnNext();
  }

  private spawn(type: PieceType): void {
    const def = PIECES[type];
    this.current = { type, rotation: 0, x: def.spawnX, y: def.spawnY };
    this.gravityMs = 0;
    this.lockMs = 0;
    this.lockResets = 0;
    this.canHold = true;
    // Block-out: the spawn position is already occupied.
    if (this.board.collides(getCells(type, 0), def.spawnX, def.spawnY)) {
      this.gameOver = true;
      this.current = null;
    }
  }

  private spawnNext(): void {
    const type = this.nextQueue.shift()!;
    while (this.nextQueue.length < NEXT_COUNT) this.nextQueue.push(this.randomizer.next());
    this.spawn(type);
  }

  private isGrounded(): boolean {
    if (!this.current) return false;
    const cells = getCells(this.current.type, this.current.rotation);
    return this.board.collides(cells, this.current.x, this.current.y + 1);
  }

  /** Reset lock delay, up to the Guideline limit of 15 resets per piece. */
  private resetLock(): void {
    if (this.lockResets < MAX_LOCK_RESETS) {
      this.lockMs = 0;
      this.lockResets++;
    }
  }

  moveHorizontal(dir: -1 | 1): boolean {
    if (this.gameOver || !this.current) return false;
    const cells = getCells(this.current.type, this.current.rotation);
    const nx = this.current.x + dir;
    if (!this.board.collides(cells, nx, this.current.y)) {
      this.current.x = nx;
      this.resetLock();
      return true;
    }
    return false;
  }

  /** Rotate using Super Rotation System wall kicks. `dir`: 1 = CW, -1 = CCW. */
  rotate(dir: 1 | -1): boolean {
    if (this.gameOver || !this.current) return false;
    const def = PIECES[this.current.type];
    if (!def.kicks) return false; // O piece does not rotate.

    const from = this.current.rotation;
    const to = ((from + (dir === 1 ? 1 : 3)) % 4) as Rotation;
    const rotatedCells = getCells(this.current.type, to);
    const kicks = def.kicks[`${from}>${to}`] ?? [[0, 0]];

    for (const [dx, dy] of kicks) {
      const nx = this.current.x + dx;
      const ny = this.current.y - dy; // Kick tables are y-up; board is y-down.
      if (!this.board.collides(rotatedCells, nx, ny)) {
        this.current.x = nx;
        this.current.y = ny;
        this.current.rotation = to;
        this.resetLock();
        return true;
      }
    }
    return false;
  }

  /** Move down one cell and award one soft-drop point. */
  softDrop(): boolean {
    if (this.gameOver || !this.current) return false;
    const cells = getCells(this.current.type, this.current.rotation);
    if (!this.board.collides(cells, this.current.x, this.current.y + 1)) {
      this.current.y++;
      this.score += 1;
      this.gravityMs = 0;
      return true;
    }
    return false;
  }

  /** Drop instantly to the lowest valid position and lock. */
  hardDrop(): void {
    if (this.gameOver || !this.current) return;
    const cells = getCells(this.current.type, this.current.rotation);
    let distance = 0;
    while (!this.board.collides(cells, this.current.x, this.current.y + distance + 1)) {
      distance++;
    }
    this.current.y += distance;
    this.score += distance * 2;
    this.lockPiece();
  }

  /** Swap the active piece with the hold piece (once per lock). */
  hold(): void {
    if (this.gameOver || !this.current || !this.canHold) return;
    const currentType = this.current.type;
    if (this.holdType === null) {
      this.holdType = currentType;
      this.spawnNext();
    } else {
      const swapped = this.holdType;
      this.holdType = currentType;
      this.spawn(swapped);
    }
    this.canHold = false;
  }

  /** Row the ghost piece would land on. */
  ghostY(): number {
    if (!this.current) return 0;
    const cells = getCells(this.current.type, this.current.rotation);
    let distance = 0;
    while (!this.board.collides(cells, this.current.x, this.current.y + distance + 1)) {
      distance++;
    }
    return this.current.y + distance;
  }

  /** Advance gravity and lock-delay timers by `dtMs` milliseconds. */
  update(dtMs: number): void {
    if (this.gameOver || !this.current) return;

    if (this.isGrounded()) {
      this.gravityMs = 0;
      this.lockMs += dtMs;
      if (this.lockMs >= LOCK_DELAY_MS) this.lockPiece();
      return;
    }

    this.lockMs = 0;
    this.gravityMs += dtMs;
    const interval = gravityIntervalMs(this.level);
    while (this.gravityMs >= interval) {
      this.gravityMs -= interval;
      const cells = getCells(this.current.type, this.current.rotation);
      if (!this.board.collides(cells, this.current.x, this.current.y + 1)) {
        this.current.y++;
      } else {
        break;
      }
    }
  }

  private lockPiece(): void {
    const piece = this.current;
    if (!piece) return;
    const cells = getCells(piece.type, piece.rotation);
    this.board.lock(cells, piece.x, piece.y, piece.type);

    // Lock-out: every block of the locked piece is above the visible field.
    if (cells.every((cell) => piece.y + cell.y < HIDDEN_ROWS)) {
      this.gameOver = true;
      this.current = null;
      return;
    }

    const cleared = this.board.clearLines();
    if (cleared > 0) {
      this.score += lineClearScore(cleared, this.level, this.backToBack);
      this.backToBack = cleared === 4;
      this.combo++;
      this.score += comboScore(this.combo, this.level);
      this.lines += cleared;
      this.level = Math.floor(this.lines / LINES_PER_LEVEL) + 1;
    } else {
      this.backToBack = false;
      this.combo = -1;
    }

    this.spawnNext();
  }
}
