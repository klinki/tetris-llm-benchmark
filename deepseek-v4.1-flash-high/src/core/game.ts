/** The complete Guideline game state machine: spawning, gravity, locks, hold, scoring. */

import { Board } from "./board.js";
import {
  HIDDEN_ROWS,
  LOCK_DELAY_MS,
  MAX_LOCK_RESETS,
  NEXT_QUEUE_SIZE,
  SOFT_DROP_INTERVAL_MS,
} from "./constants.js";
import { activeCells, getKicks, spawnPosition } from "./pieces.js";
import { mulberry32, BagRandomizer, type RandomFn } from "./randomizer.js";
import {
  HARD_DROP_POINTS_PER_CELL,
  SOFT_DROP_POINTS_PER_CELL,
  gravityIntervalMs,
  levelForLines,
  scoreClear,
} from "./scoring.js";
import { detectTSpin } from "./tspin.js";
import type { ActivePiece, ClearInfo, GameStatus, PieceType, Rotation } from "./types.js";

export interface GameOptions {
  /** Deterministic seed for the 7-bag randomizer. */
  seed?: number;
  /** Custom random source, takes precedence over `seed`. */
  random?: RandomFn;
}

export class Game {
  readonly board = new Board();

  status: GameStatus = "playing";
  score = 0;
  level = 1;
  lines = 0;
  /** Consecutive clears so far; -1 while the current run has no clear. */
  combo = -1;
  backToBack = false;

  active: ActivePiece | null = null;
  holdType: PieceType | null = null;
  canHold = true;
  nextQueue: PieceType[] = [];
  softDropping = false;
  lastClear: ClearInfo | null = null;

  private readonly randomizer: BagRandomizer;
  private dropTimer = 0;
  private lockTimer = 0;
  private lockResets = 0;
  private lowestY = 0;
  private lastMoveWasRotation = false;
  private lastKickIndex = 0;

  constructor(options: GameOptions = {}) {
    const random =
      options.random ??
      (options.seed !== undefined ? mulberry32(options.seed) : () => Math.random());
    this.randomizer = new BagRandomizer(random);
    this.reset();
  }

  reset(): void {
    this.board.reset();
    this.status = "playing";
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.combo = -1;
    this.backToBack = false;
    this.holdType = null;
    this.canHold = true;
    this.nextQueue = [];
    this.softDropping = false;
    this.lastClear = null;
    this.active = null;
    this.randomizer.reset();
    this.refillQueue();
    this.spawn();
  }

  restart(): void {
    this.reset();
  }

  setSoftDrop(enabled: boolean): void {
    this.softDropping = enabled;
  }

  update(dtMs: number): void {
    if (this.status !== "playing" || !this.active) return;
    const dt = Math.max(0, dtMs);
    if (dt === 0) return;

    const gravity = gravityIntervalMs(this.level);
    const interval = this.softDropping
      ? Math.min(gravity, SOFT_DROP_INTERVAL_MS)
      : gravity;

    this.dropTimer += dt;
    let steps = 0;
    while (this.dropTimer >= interval && steps < 100) {
      steps += 1;
      if (!this.stepDown()) {
        this.dropTimer = 0;
        break;
      }
      if (this.softDropping && interval === SOFT_DROP_INTERVAL_MS) {
        this.score += SOFT_DROP_POINTS_PER_CELL;
      }
      this.dropTimer -= interval;
    }

    if (this.status !== "playing" || !this.active) return;

    if (this.isGrounded()) {
      this.lockTimer += dt;
      if (this.lockTimer >= LOCK_DELAY_MS) this.lockPiece();
    } else {
      this.lockTimer = 0;
    }
  }

  moveLeft(): boolean {
    return this.shift(-1);
  }

  moveRight(): boolean {
    return this.shift(1);
  }

  rotate(direction: 1 | -1): boolean {
    if (!this.canAct() || !this.active) return false;
    const piece = this.active;
    const from = piece.rotation;
    const to = ((from + direction + 4) % 4) as Rotation;
    const kicks = getKicks(piece.type, from, to);

    for (let index = 0; index < kicks.length; index += 1) {
      const kick = kicks[index];
      const candidate: ActivePiece = {
        ...piece,
        rotation: to,
        x: piece.x + kick.x,
        y: piece.y + kick.y,
      };
      if (!this.board.canPlace(activeCells(candidate))) continue;

      piece.rotation = to;
      piece.x = candidate.x;
      piece.y = candidate.y;
      this.lastMoveWasRotation = true;
      this.lastKickIndex = index;
      this.resetLockDelay();
      return true;
    }
    return false;
  }

  rotateClockwise(): boolean {
    return this.rotate(1);
  }

  rotateCounterClockwise(): boolean {
    return this.rotate(-1);
  }

  softDropCell(): boolean {
    if (!this.canAct()) return false;
    const moved = this.stepDown();
    if (moved) this.score += SOFT_DROP_POINTS_PER_CELL;
    return moved;
  }

  hardDrop(): void {
    if (!this.canAct() || !this.active) return;
    const piece = this.active;
    const targetY = this.getGhostY();
    const distance = targetY - piece.y;
    if (distance > 0) {
      piece.y = targetY;
      this.score += distance * HARD_DROP_POINTS_PER_CELL;
      this.lockTimer = 0;
      if (piece.y > this.lowestY) {
        this.lowestY = piece.y;
        this.lockResets = 0;
      }
    }
    this.lockPiece();
  }

  holdPiece(): boolean {
    if (!this.canAct() || !this.active || !this.canHold) return false;
    const current = this.active.type;

    if (this.holdType === null) {
      this.holdType = current;
      this.spawn();
    } else {
      const held = this.holdType;
      this.holdType = current;
      this.spawnPiece(held);
    }

    this.canHold = false;
    return true;
  }

  /** Lowest row the active piece can reach in a straight drop. */
  getGhostY(): number {
    const piece = this.active;
    if (!piece) return 0;
    let dy = 0;
    while (this.board.canPlace(activeCells(piece, 0, dy + 1))) dy += 1;
    return piece.y + dy;
  }

  isGrounded(): boolean {
    if (!this.active) return true;
    return !this.board.canPlace(activeCells(this.active, 0, 1));
  }

  private canAct(): boolean {
    return this.status === "playing" && this.active !== null;
  }

  private stepDown(): boolean {
    const piece = this.active;
    if (!piece) return false;
    if (!this.board.canPlace(activeCells(piece, 0, 1))) return false;

    piece.y += 1;
    this.lockTimer = 0;
    if (piece.y > this.lowestY) {
      this.lowestY = piece.y;
      this.lockResets = 0;
    }
    return true;
  }

  private shift(dx: number): boolean {
    if (!this.canAct() || !this.active) return false;
    const piece = this.active;
    if (!this.board.canPlace(activeCells(piece, dx, 0))) return false;

    piece.x += dx;
    this.lastMoveWasRotation = false;
    this.resetLockDelay();
    return true;
  }

  private resetLockDelay(): void {
    if (this.isGrounded()) {
      if (this.lockResets < MAX_LOCK_RESETS) {
        this.lockResets += 1;
        this.lockTimer = 0;
      }
    } else {
      this.lockTimer = 0;
    }
  }

  private refillQueue(): void {
    while (this.nextQueue.length < NEXT_QUEUE_SIZE) {
      this.nextQueue.push(this.randomizer.next());
    }
  }

  private spawn(): void {
    const type = this.nextQueue.shift();
    if (!type) {
      this.status = "gameover";
      return;
    }
    this.nextQueue.push(this.randomizer.next());
    this.spawnPiece(type);
    this.canHold = true;
  }

  private spawnPiece(type: PieceType): void {
    const { x, y } = spawnPosition(type);
    this.active = { type, rotation: 0, x, y };
    this.dropTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lowestY = y;
    this.lastMoveWasRotation = false;
    this.lastKickIndex = 0;
    if (!this.board.canPlace(activeCells(this.active))) {
      this.status = "gameover";
    }
  }

  private lockPiece(): void {
    const piece = this.active;
    if (!piece) return;

    const tspin = detectTSpin(
      this.board,
      piece,
      this.lastMoveWasRotation,
      this.lastKickIndex,
    );
    const cells = activeCells(piece);
    const lockedOut = cells.every((cell) => cell.y < HIDDEN_ROWS);

    for (const cell of cells) {
      if (cell.y >= 0) this.board.setCell(cell.x, cell.y, piece.type);
    }

    const cleared = this.board.clearLines().length;
    const perfectClear = cleared > 0 && this.board.isPerfectClear();

    this.combo = cleared > 0 ? this.combo + 1 : -1;

    const result = scoreClear({
      lines: cleared,
      tspin,
      perfectClear,
      level: this.level,
      backToBack: this.backToBack,
      combo: this.combo,
    });

    this.score += result.points;
    this.backToBack = result.backToBack;
    this.lines += cleared;
    this.level = levelForLines(this.lines);
    this.lastClear = {
      lines: cleared,
      tspin,
      perfectClear,
      points: result.points,
      combo: this.combo,
      backToBack: this.backToBack,
    };

    this.active = null;
    if (lockedOut) {
      this.status = "gameover";
      return;
    }
    this.spawn();
  }
}
