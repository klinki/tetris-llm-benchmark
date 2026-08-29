import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  HARD_DROP_POINTS,
  LOCK_DELAY_MS,
  MAX_LOCK_RESETS,
  NEXT_QUEUE_LENGTH,
  SCORE_TABLE,
  SOFT_DROP_POINTS,
  getKickTests,
  gravityIntervalMs,
} from "./constants.js";
import { Board } from "./board.js";
import { createPiece, copyPiece, rotatePiece } from "./pieces.js";
import { SevenBag } from "./randomizer.js";
import type {
  ActivePiece,
  GameSnapshot,
  LockResult,
  PieceType,
  Rotation,
  TSpinKind,
} from "./types.js";

export type RotationDirection = 1 | -1;

/**
 * The rules-only portion of the game. It has no DOM dependencies, which keeps
 * input/rendering separate from collision, timing, and scoring logic.
 */
export class TetrisGame {
  public readonly board: Board;
  public current: ActivePiece;
  public holdPiece: PieceType | null = null;
  public nextQueue: PieceType[] = [];
  public score = 0;
  public lines = 0;
  public level = 1;
  /** -1 means no active combo; 0 is the first consecutive clear. */
  public combo = -1;
  public backToBack = false;
  public gameOver = false;

  private readonly bag: SevenBag;
  private holdUsed = false;
  private gravityAccumulator = 0;
  private lockElapsed = 0;
  private lockResets = 0;
  private lastActionWasRotation = false;

  public constructor(random: () => number = Math.random) {
    this.board = new Board(BOARD_WIDTH, BOARD_HEIGHT);
    this.bag = new SevenBag(random);
    this.current = createPiece("I");
    this.restart();
  }

  public get canHold(): boolean {
    return !this.holdUsed && !this.gameOver;
  }

  public restart(): void {
    this.board.reset();
    this.bag.reset();
    this.holdPiece = null;
    this.nextQueue = [];
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.combo = -1;
    this.backToBack = false;
    this.gameOver = false;
    this.holdUsed = false;
    this.gravityAccumulator = 0;
    this.lockElapsed = 0;
    this.lockResets = 0;
    this.lastActionWasRotation = false;

    this.current = createPiece(this.bag.next());
    this.fillNextQueue();
    this.gameOver = !this.board.canPlace(this.current);
  }

  /** Advances gravity and lock delay by a number of elapsed milliseconds. */
  public update(deltaMs: number): void {
    if (this.gameOver || !Number.isFinite(deltaMs) || deltaMs <= 0) {
      return;
    }

    // A suspended tab can produce a very large frame delta. Processing it is
    // correct, but bounding it prevents a surprising chain of instant locks.
    let remaining = Math.min(deltaMs, 1000);

    while (remaining > 0 && !this.gameOver) {
      if (!this.canMoveDown()) {
        const timeToLock = LOCK_DELAY_MS - this.lockElapsed;
        if (remaining < timeToLock) {
          this.lockElapsed += remaining;
          return;
        }

        remaining -= Math.max(0, timeToLock);
        this.lockCurrentPiece();
        continue;
      }

      const interval = gravityIntervalMs(this.level);
      const timeToFall = interval - this.gravityAccumulator;
      if (remaining < timeToFall) {
        this.gravityAccumulator += remaining;
        return;
      }

      remaining -= Math.max(0, timeToFall);
      this.gravityAccumulator = 0;
      this.current.y += 1;

      // Falling onto the floor starts a fresh lock delay. A normal gravity
      // step never consumes one of the finite movement-based resets.
      if (!this.canMoveDown()) {
        this.lockElapsed = 0;
      }
    }
  }

  /** Alias kept small and convenient for callers using a game-loop vocabulary. */
  public tick(deltaMs: number): void {
    this.update(deltaMs);
  }

  public move(horizontal: -1 | 1): boolean {
    if (this.gameOver || (horizontal !== -1 && horizontal !== 1)) {
      return false;
    }

    const candidate: ActivePiece = {
      ...this.current,
      x: this.current.x + horizontal,
    };
    if (!this.board.canPlace(candidate)) {
      return false;
    }

    this.applySuccessfulAction(candidate, false);
    return true;
  }

  public rotate(direction: RotationDirection): boolean {
    if (this.gameOver || (direction !== -1 && direction !== 1)) {
      return false;
    }

    const from = this.current.rotation;
    const to = (((from + direction) % 4) + 4) % 4 as Rotation;
    const rotated = rotatePiece(this.current, direction);

    for (const [kickX, kickY] of getKickTests(this.current.type, from, to)) {
      const candidate: ActivePiece = {
        ...rotated,
        x: rotated.x + kickX,
        // SRS kick Y is positive upwards; screen coordinates grow down.
        y: rotated.y - kickY,
      };

      if (this.board.canPlace(candidate)) {
        this.applySuccessfulAction(candidate, true);
        return true;
      }
    }

    return false;
  }

  /** Moves one row and awards the Guideline soft-drop point when successful. */
  public softDrop(): boolean {
    if (this.gameOver) {
      return false;
    }

    const candidate: ActivePiece = { ...this.current, y: this.current.y + 1 };
    if (!this.board.canPlace(candidate)) {
      this.lockElapsed = Math.max(this.lockElapsed, 0);
      return false;
    }

    this.current = candidate;
    this.score += SOFT_DROP_POINTS;
    this.gravityAccumulator = 0;
    if (!this.canMoveDown()) {
      this.lockElapsed = 0;
    }
    return true;
  }

  /** Drops to the ghost position, awards two points per row, and locks now. */
  public hardDrop(): number {
    if (this.gameOver) {
      return 0;
    }

    const ghost = this.getGhostPiece();
    const distance = ghost.y - this.current.y;
    this.current = ghost;
    this.score += distance * HARD_DROP_POINTS;
    this.lockCurrentPiece();
    return distance;
  }

  /** Holds once per falling piece, swapping with the held piece when present. */
  public hold(): boolean {
    if (!this.canHold) {
      return false;
    }

    const fallingType = this.current.type;
    if (this.holdPiece === null) {
      this.holdPiece = fallingType;
      this.current = createPiece(this.takeNextPiece());
    } else {
      const swappedType = this.holdPiece;
      this.holdPiece = fallingType;
      this.current = createPiece(swappedType);
    }

    this.holdUsed = true;
    this.resetPieceTimers();
    this.gameOver = !this.board.canPlace(this.current);
    return true;
  }

  public getGhostPiece(): ActivePiece {
    let ghost = copyPiece(this.current);
    while (this.board.canPlace({ ...ghost, y: ghost.y + 1 })) {
      ghost = { ...ghost, y: ghost.y + 1 };
    }
    return ghost;
  }

  public getSnapshot(): GameSnapshot {
    return {
      board: this.board.getGrid(),
      current: copyPiece(this.current),
      ghost: this.getGhostPiece(),
      hold: this.holdPiece,
      next: [...this.nextQueue],
      score: this.score,
      lines: this.lines,
      level: this.level,
      combo: this.combo,
      backToBack: this.backToBack,
      canHold: this.canHold,
      gameOver: this.gameOver,
    };
  }

  /** Locks the active piece and returns the resulting scoring event. */
  public lockCurrentPiece(): LockResult {
    if (this.gameOver) {
      return { linesCleared: 0, tSpin: "none", perfectClear: false, scoreAwarded: 0 };
    }

    const tSpin = this.detectTSpin(this.current);
    const beforeScore = this.score;
    const { overflow } = this.board.lock(this.current);
    const linesCleared = this.board.clearLines();
    const perfectClear = !overflow && this.board.isEmpty();

    if (overflow) {
      this.gameOver = true;
      this.resetPieceTimers();
      return {
        linesCleared,
        tSpin,
        perfectClear,
        scoreAwarded: 0,
      };
    }

    this.awardLineScore(linesCleared, tSpin, perfectClear);
    this.holdUsed = false;
    this.current = createPiece(this.takeNextPiece());
    this.resetPieceTimers();
    this.gameOver = !this.board.canPlace(this.current);

    return {
      linesCleared,
      tSpin,
      perfectClear,
      scoreAwarded: this.score - beforeScore,
    };
  }

  private applySuccessfulAction(candidate: ActivePiece, wasRotation: boolean): void {
    const wasGrounded = !this.canMoveDown();
    this.current = candidate;
    const isGrounded = !this.canMoveDown();

    if (wasGrounded && this.lockResets < MAX_LOCK_RESETS) {
      this.lockElapsed = 0;
      this.lockResets += 1;
    } else if (!wasGrounded && isGrounded) {
      this.lockElapsed = 0;
    }

    this.lastActionWasRotation = wasRotation;
  }

  private canMoveDown(): boolean {
    return this.board.canPlace({ ...this.current, y: this.current.y + 1 });
  }

  private detectTSpin(piece: ActivePiece): TSpinKind {
    if (piece.type !== "T" || !this.lastActionWasRotation) {
      return "none";
    }

    const pivotX = piece.x + 1;
    const pivotY = piece.y + 1;
    const corners = [
      [pivotX - 1, pivotY - 1],
      [pivotX + 1, pivotY - 1],
      [pivotX - 1, pivotY + 1],
      [pivotX + 1, pivotY + 1],
    ];
    const occupiedCorners = corners.filter(([x, y]) => {
      return x < 0 || x >= this.board.width || y < 0 || y >= this.board.height || this.board.getCell(x, y) !== null;
    });

    if (occupiedCorners.length < 3) {
      return "none";
    }

    // The two corners in the direction the T faces distinguish mini spins.
    const frontCornerIndexes: Record<Rotation, [number, number]> = {
      0: [0, 1],
      1: [1, 3],
      2: [2, 3],
      3: [0, 2],
    };
    const frontOccupied = frontCornerIndexes[piece.rotation].filter((index) => {
      const [x, y] = corners[index];
      return x < 0 || x >= this.board.width || y < 0 || y >= this.board.height || this.board.getCell(x, y) !== null;
    }).length;

    return frontOccupied >= 2 ? "full" : "mini";
  }

  private awardLineScore(linesCleared: number, tSpin: TSpinKind, perfectClear: boolean): void {
    const levelAtClear = this.level;
    const difficultClear = linesCleared === 4 || (tSpin === "full" && linesCleared > 0);
    let base = this.baseScore(linesCleared, tSpin);

    if (difficultClear && this.backToBack) {
      base = Math.floor(base * 1.5);
    }

    if (linesCleared > 0) {
      this.combo += 1;
      if (this.combo > 0) {
        base += 50 * this.combo * levelAtClear;
      }
    } else {
      this.combo = -1;
    }

    if (perfectClear && linesCleared > 0) {
      base += SCORE_TABLE.perfectClear[linesCleared] ?? 0;
    }

    this.score += base * levelAtClear;
    this.lines += linesCleared;
    this.level = Math.floor(this.lines / 10) + 1;

    if (difficultClear) {
      this.backToBack = true;
    } else if (linesCleared > 0) {
      this.backToBack = false;
    }
  }

  private baseScore(linesCleared: number, tSpin: TSpinKind): number {
    if (tSpin === "mini") {
      return SCORE_TABLE.tSpinMini[Math.min(linesCleared, 2)];
    }
    if (tSpin === "full") {
      return SCORE_TABLE.tSpin[Math.min(linesCleared, 3)];
    }

    switch (linesCleared) {
      case 1:
        return SCORE_TABLE.single;
      case 2:
        return SCORE_TABLE.double;
      case 3:
        return SCORE_TABLE.triple;
      case 4:
        return SCORE_TABLE.tetris;
      default:
        return 0;
    }
  }

  private takeNextPiece(): PieceType {
    this.fillNextQueue();
    const next = this.nextQueue.shift() as PieceType;
    this.fillNextQueue();
    return next;
  }

  private fillNextQueue(): void {
    while (this.nextQueue.length < NEXT_QUEUE_LENGTH) {
      this.nextQueue.push(this.bag.next());
    }
  }

  private resetPieceTimers(): void {
    this.gravityAccumulator = 0;
    this.lockElapsed = 0;
    this.lockResets = 0;
    this.lastActionWasRotation = false;
  }
}

export { TetrisGame as Game };
