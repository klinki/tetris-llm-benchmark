import {
  COLS,
  HIDDEN_ROWS,
  NEXT_QUEUE_SIZE,
  SHAPE_DEFINITIONS,
  ShapeId,
  gravityForLevel,
  LOCK_DELAY_FRAMES,
  MAX_LOCK_RESETS,
} from './constants';
import { Board } from './board';
import { Randomizer } from './randomizer';
import { Scoring } from './scoring';
import { ActivePiece, RenderState } from './types';

/** The spawn column of the bounding box for newly generated pieces. */
const SPAWN_X = 3;

/** Compute a spawn row so the piece's bottom cells sit on the first visible row. */
function spawnYFor(shape: ShapeId): number {
  const cells = SHAPE_DEFINITIONS[shape].cells[0];
  const maxLocalY = Math.max(...cells.map((c) => c[1]));
  return HIDDEN_ROWS - maxLocalY;
}

/**
 * Core game engine. All logic is deterministic given a seed and a sequence
 * of inputs, and is completely independent of the DOM so it can be tested
 * in Node. Rendering/input are handled by separate modules.
 */
export class Game {
  board = new Board();
  scoring = new Scoring();
  randomizer: Randomizer;

  active: ActivePiece | null = null;
  hold: ShapeId | null = null;
  canHold = true;
  next: ShapeId[] = [];
  gameOver = false;

  /** Gravity accumulator in frames. */
  private gravityCounter = 0;
  /** Lock delay countdown in frames. */
  private lockTimer = 0;
  /** How many times lock delay has been reset for the current piece. */
  private lockResets = 0;
  /** Whether the piece is currently resting on the stack (grounded). */
  private grounded = false;

  constructor(seed?: number) {
    this.randomizer = new Randomizer(seed);
    this.reset(seed);
  }

  /** Start a fresh game. */
  reset(seed?: number): void {
    this.board.clear();
    this.scoring.reset();
    this.randomizer = new Randomizer(seed);
    this.next = [];
    this.hold = null;
    this.canHold = true;
    this.active = null;
    this.gameOver = false;
    this.gravityCounter = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.grounded = false;

    this.fillQueue();
    this.spawnNext();
  }

  /** Ensure the next queue has at least NEXT_QUEUE_SIZE pieces. */
  private fillQueue(): void {
    while (this.next.length < NEXT_QUEUE_SIZE) {
      this.next.push(this.randomizer.next());
    }
  }

  /** Move a piece from the next queue into active play. */
  private spawnNext(): void {
    this.fillQueue();
    const shape = this.next.shift()!;
    this.fillQueue();
    const piece: ActivePiece = {
      shape,
      rotation: 0,
      x: SPAWN_X,
      y: spawnYFor(shape),
    };
    // Top-out if the newly spawned piece overlaps the stack (blocked spawn).
    if (this.board.collides(piece) || !this.board.fitsInSpawn(piece)) {
      this.active = piece;
      this.gameOver = true;
      return;
    }
    this.active = piece;
    this.resetLockState();
  }

  private resetLockState(): void {
    this.gravityCounter = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.grounded = false;
  }

  /** Try to move the active piece horizontally. */
  move(dx: number): boolean {
    if (this.gameOver || !this.active) return false;
    const candidate = { ...this.active, x: this.active.x + dx };
    if (this.board.collides(candidate)) return false;
    this.active = candidate;
    this.onMoveOrRotate();
    return true;
  }

  /** Rotate the active piece clockwise (direction 1) or CCW (-1). */
  rotate(direction: 1 | -1): boolean {
    if (this.gameOver || !this.active) return false;
    if (this.active.shape === 'O') {
      // O never changes orientation, but still counts as a successful action.
      return true;
    }
    const rotated = this.board.tryRotate(this.active, direction);
    if (!rotated) return false;
    this.active = rotated;
    this.onMoveOrRotate();
    return true;
  }

  /** Soft drop by one cell. Returns the number of cells dropped. */
  softDrop(): number {
    if (this.gameOver || !this.active) return 0;
    const candidate = { ...this.active, y: this.active.y + 1 };
    if (this.board.collides(candidate)) {
      // Grounded: do not reset lock delay for soft drops onto the floor.
      this.grounded = true;
      return 0;
    }
    this.active = candidate;
    this.scoring.addSoftDrop(1);
    // Moving down never resets lock delay.
    return 1;
  }

  /** Hard drop: slam the piece down and lock immediately. */
  hardDrop(): void {
    if (this.gameOver || !this.active) return;
    const target = this.board.ghostPose(this.active);
    const cells = target.y - this.active.y;
    this.scoring.addHardDrop(cells);
    this.active = target;
    this.lockPiece();
  }

  /** Hold the current piece, swapping with the stored hold piece. */
  holdPiece(): boolean {
    if (this.gameOver || !this.active || !this.canHold) return false;
    const current = this.active.shape;
    if (this.hold === null) {
      this.hold = current;
      this.spawnNext();
    } else {
      const swap = this.hold;
      this.hold = current;
      const piece: ActivePiece = {
        shape: swap,
        rotation: 0,
        x: SPAWN_X,
        y: spawnYFor(swap),
      };
      if (this.board.collides(piece) || !this.board.fitsInSpawn(piece)) {
        this.active = piece;
        this.gameOver = true;
        return true;
      }
      this.active = piece;
      this.resetLockState();
    }
    this.canHold = false;
    return true;
  }

  /** Called after a successful move/rotation: may reset lock delay. */
  private onMoveOrRotate(): void {
    // Guideline move-reset rule: lock delay resets up to MAX_LOCK_RESETS times
    // while the piece is grounded.
    if (this.grounded && this.lockResets < MAX_LOCK_RESETS) {
      this.lockTimer = 0;
      this.lockResets++;
    }
    // Re-evaluate grounded state based on the new position.
    if (this.active && !this.board.collides({ ...this.active, y: this.active.y + 1 })) {
      this.grounded = false;
    } else {
      this.grounded = true;
    }
  }

  /** Lock the active piece into the board and proceed to the next piece. */
  private lockPiece(): void {
    if (!this.active) return;
    const cleared = this.board.lock(this.active);
    this.scoring.applyClear(cleared);

    if (this.board.isToppedOut()) {
      this.gameOver = true;
      this.active = null;
      return;
    }
    this.spawnNext();
  }

  /**
   * Advance the game by one frame (1/60 s). Handles gravity and lock delay.
   */
  tick(): void {
    if (this.gameOver || !this.active) return;

    // Determine if the piece is grounded.
    const canFall = !this.board.collides({ ...this.active, y: this.active.y + 1 });
    if (!canFall) {
      this.grounded = true;
    }

    if (canFall) {
      // Gravity: accumulate frames and drop rows when due.
      const gravity = gravityForLevel(this.scoring.level);
      this.gravityCounter++;
      if (this.gravityCounter >= gravity) {
        this.gravityCounter = 0;
        this.active = { ...this.active, y: this.active.y + 1 };
        // Falling naturally also means we are no longer grounded.
        this.grounded = !this.board.collides({ ...this.active, y: this.active.y + 1 });
      }
      // While airborne, lock timer stays inactive.
      this.lockTimer = 0;
      return;
    }

    // Grounded: run the lock delay countdown.
    this.lockTimer++;
    if (this.lockTimer >= LOCK_DELAY_FRAMES) {
      this.lockPiece();
    }
  }

  /** Produce a snapshot for rendering. */
  getRenderState(): RenderState {
    return {
      board: this.board.grid.map((row) => row.slice()),
      active: this.active ? { ...this.active } : null,
      ghost: this.active ? this.board.ghostPose(this.active) : null,
      hold: this.hold,
      next: this.next.slice(),
      score: this.scoring.score,
      level: this.scoring.level,
      lines: this.scoring.lines,
      gameOver: this.gameOver,
      canHold: this.canHold,
    };
  }

  /** Utility used by tests: bounding-box spawn column. */
  static get spawnX(): number {
    return SPAWN_X;
  }

  /** Utility used by tests: shape definition lookup. */
  static shapeSize(shape: ShapeId): number {
    return SHAPE_DEFINITIONS[shape].size;
  }

  /** Utility used by tests: board columns. */
  static get columns(): number {
    return COLS;
  }
}
