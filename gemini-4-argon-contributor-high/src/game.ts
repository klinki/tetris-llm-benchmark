import { BagRandomizer } from './bag.js';
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  clearFullLines,
  cloneBoard,
  createEmptyBoard,
  isValidPiecePosition,
} from './board.js';
import { getPieceCells, getWallKicks } from './tetrominoes.js';
import {
  ActivePiece,
  CellValue,
  GameState,
  LockResult,
  Point,
  RotationState,
  TetrominoType,
} from './types.js';

export const SPAWN_X = 3;
export const SPAWN_Y = 0;
export const LOCK_DELAY_MS = 500;
export const MAX_LOCK_RESETS = 15;
export const NEXT_QUEUE_SIZE = 5;

/**
 * Guideline gravity formula:
 * Time per row (seconds) = (0.8 - ((level - 1) * 0.007)) ^ (level - 1)
 */
export function getGravityIntervalMs(level: number): number {
  const clampedLevel = Math.max(1, Math.min(level, 29));
  const secondsPerRow = Math.pow(
    0.8 - (clampedLevel - 1) * 0.007,
    clampedLevel - 1
  );
  return Math.max(10, secondsPerRow * 1000);
}

export interface TetrisGameOptions {
  rng?: () => number;
  startLevel?: number;
  seedQueue?: TetrominoType[];
}

export class TetrisGame {
  public board: CellValue[][];
  public activePiece: ActivePiece | null = null;
  public holdPiece: TetrominoType | null = null;
  public canHold: boolean = true;
  public nextQueue: TetrominoType[] = [];
  public score: number = 0;
  public lines: number = 0;
  public level: number = 1;
  public combo: number = -1;
  public backToBack: boolean = false;
  public gameOver: boolean = false;
  public paused: boolean = false;
  public lockTimer: number = 0;
  public lockResets: number = 0;
  public lastAction: string = '';

  private readonly bag: BagRandomizer;
  private readonly startLevel: number;
  private gravityTimer: number = 0;
  private lowestY: number = 0;
  private lastMoveWasRotation: boolean = false;
  private lastKickIndex: number = 0;

  constructor(options: TetrisGameOptions = {}) {
    this.bag = new BagRandomizer(options.rng);
    this.startLevel = Math.max(1, options.startLevel ?? 1);
    this.board = createEmptyBoard(BOARD_WIDTH, BOARD_HEIGHT);
    this.reset(options.seedQueue);
  }

  /**
   * Resets the game to a fresh initial state.
   */
  public reset(seedQueue?: TetrominoType[]): void {
    this.board = createEmptyBoard(BOARD_WIDTH, BOARD_HEIGHT);
    this.holdPiece = null;
    this.canHold = true;
    this.score = 0;
    this.lines = 0;
    this.level = this.startLevel;
    this.combo = -1;
    this.backToBack = false;
    this.gameOver = false;
    this.paused = false;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.gravityTimer = 0;
    this.lowestY = 0;
    this.lastMoveWasRotation = false;
    this.lastKickIndex = 0;
    this.lastAction = '';

    this.bag.reset(seedQueue);
    this.spawnNextPiece();
  }

  /**
   * Alias for reset() used when restarting the game.
   */
  public restart(seedQueue?: TetrominoType[]): void {
    this.reset(seedQueue);
  }

  /**
   * Returns current gravity drop interval in milliseconds.
   */
  public getDropIntervalMs(): number {
    return getGravityIntervalMs(this.level);
  }

  /**
   * Checks if a piece configuration is valid on the current board.
   */
  public isValidPosition(
    x: number,
    y: number,
    rotation: RotationState,
    type?: TetrominoType
  ): boolean {
    const pieceType = type ?? this.activePiece?.type;
    if (!pieceType) {
      return false;
    }
    return isValidPiecePosition(this.board, pieceType, x, y, rotation);
  }

  /**
   * Returns true if the active piece is resting on the floor or a locked block.
   */
  public isGrounded(): boolean {
    if (!this.activePiece) {
      return false;
    }
    return !this.isValidPosition(
      this.activePiece.x,
      this.activePiece.y + 1,
      this.activePiece.rotation,
      this.activePiece.type
    );
  }

  /**
   * Computes the Y coordinate of the ghost piece (landing position).
   */
  public getGhostY(): number {
    if (!this.activePiece) {
      return 0;
    }
    let ghostY = this.activePiece.y;
    while (
      this.isValidPosition(
        this.activePiece.x,
        ghostY + 1,
        this.activePiece.rotation,
        this.activePiece.type
      )
    ) {
      ghostY++;
    }
    return ghostY;
  }

  /**
   * Returns the ghost piece with its projected landing coordinates.
   */
  public getGhostPiece(): ActivePiece | null {
    if (!this.activePiece) {
      return null;
    }
    return {
      ...this.activePiece,
      y: this.getGhostY(),
    };
  }

  /**
   * Spawns the next piece from the 7-bag queue.
   */
  private spawnNextPiece(): void {
    const nextType = this.bag.next();
    this.nextQueue = this.bag.peek(NEXT_QUEUE_SIZE);
    this.spawnPiece(nextType);
  }

  /**
   * Spawns a specific tetromino type at the top of the playfield.
   * Triggers top-out (gameOver = true) if the spawn position is obstructed.
   */
  public spawnPiece(type: TetrominoType): boolean {
    this.activePiece = {
      type,
      x: SPAWN_X,
      y: SPAWN_Y,
      rotation: 0,
    };
    this.gravityTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lowestY = SPAWN_Y;
    this.lastMoveWasRotation = false;
    this.lastKickIndex = 0;

    if (!this.isValidPosition(SPAWN_X, SPAWN_Y, 0, type)) {
      this.gameOver = true;
      this.lastAction = 'GAME OVER';
      return false;
    }
    return true;
  }

  /**
   * Applies Extended Placement Lock Down reset logic when a piece moves or rotates.
   */
  private handlePostMoveOrRotate(wasGrounded: boolean): void {
    if (!this.activePiece) {
      return;
    }
    if (this.activePiece.y > this.lowestY) {
      this.lowestY = this.activePiece.y;
      this.lockResets = 0;
    }

    const nowGrounded = this.isGrounded();
    if (wasGrounded || nowGrounded) {
      if (this.lockResets < MAX_LOCK_RESETS) {
        if (wasGrounded || this.lockTimer > 0) {
          this.lockResets++;
        }
        this.lockTimer = 0;
      }
    } else {
      this.lockTimer = 0;
    }
  }

  /**
   * Moves the active piece one cell left if unobstructed.
   */
  public moveLeft(): boolean {
    if (this.gameOver || this.paused || !this.activePiece) {
      return false;
    }
    const wasGrounded = this.isGrounded();
    const nextX = this.activePiece.x - 1;
    if (
      this.isValidPosition(
        nextX,
        this.activePiece.y,
        this.activePiece.rotation,
        this.activePiece.type
      )
    ) {
      this.activePiece.x = nextX;
      this.lastMoveWasRotation = false;
      this.handlePostMoveOrRotate(wasGrounded);
      return true;
    }
    return false;
  }

  /**
   * Moves the active piece one cell right if unobstructed.
   */
  public moveRight(): boolean {
    if (this.gameOver || this.paused || !this.activePiece) {
      return false;
    }
    const wasGrounded = this.isGrounded();
    const nextX = this.activePiece.x + 1;
    if (
      this.isValidPosition(
        nextX,
        this.activePiece.y,
        this.activePiece.rotation,
        this.activePiece.type
      )
    ) {
      this.activePiece.x = nextX;
      this.lastMoveWasRotation = false;
      this.handlePostMoveOrRotate(wasGrounded);
      return true;
    }
    return false;
  }

  /**
   * Moves the active piece one cell down.
   * When `isSoftDrop` is true, awards 1 point per cell dropped (Guideline).
   */
  public moveDown(isSoftDrop: boolean = false): boolean {
    if (this.gameOver || this.paused || !this.activePiece) {
      return false;
    }
    const nextY = this.activePiece.y + 1;
    if (
      this.isValidPosition(
        this.activePiece.x,
        nextY,
        this.activePiece.rotation,
        this.activePiece.type
      )
    ) {
      this.activePiece.y = nextY;
      this.lastMoveWasRotation = false;
      this.gravityTimer = 0;
      this.lockTimer = 0;
      if (this.activePiece.y > this.lowestY) {
        this.lowestY = this.activePiece.y;
        this.lockResets = 0;
      }
      if (isSoftDrop) {
        this.score += 1;
      }
      return true;
    }
    return false;
  }

  /**
   * Performs a soft drop (one cell down + 1 score point if moved).
   */
  public softDrop(): boolean {
    return this.moveDown(true);
  }

  /**
   * Performs a hard drop to the ghost piece position, awards 2 points per cell dropped,
   * and immediately locks the piece.
   */
  public hardDrop(): number {
    if (this.gameOver || this.paused || !this.activePiece) {
      return 0;
    }
    const ghostY = this.getGhostY();
    const distance = Math.max(0, ghostY - this.activePiece.y);
    if (distance > 0) {
      this.activePiece.y = ghostY;
      this.lastMoveWasRotation = false;
      this.score += distance * 2;
    }
    this.lockPiece();
    return distance;
  }

  /**
   * Rotates the active piece using SRS and Wall Kicks.
   * @param direction 1 for clockwise, -1 for counter-clockwise
   */
  public rotate(direction: 1 | -1): boolean {
    if (this.gameOver || this.paused || !this.activePiece) {
      return false;
    }
    const wasGrounded = this.isGrounded();
    const fromRotation = this.activePiece.rotation;
    const toRotation = (((fromRotation + direction) % 4 + 4) % 4) as RotationState;
    const kicks = getWallKicks(this.activePiece.type, fromRotation, toRotation);

    for (let i = 0; i < kicks.length; i++) {
      const kick = kicks[i]!;
      const nextX = this.activePiece.x + kick.x;
      const nextY = this.activePiece.y + kick.y;

      if (
        this.isValidPosition(
          nextX,
          nextY,
          toRotation,
          this.activePiece.type
        )
      ) {
        this.activePiece.x = nextX;
        this.activePiece.y = nextY;
        this.activePiece.rotation = toRotation;
        this.lastMoveWasRotation = true;
        this.lastKickIndex = i;
        this.handlePostMoveOrRotate(wasGrounded);
        return true;
      }
    }

    return false;
  }

  /**
   * Rotates the active piece 90 degrees clockwise.
   */
  public rotateClockwise(): boolean {
    return this.rotate(1);
  }

  /**
   * Rotates the active piece 90 degrees counter-clockwise (anti-clockwise).
   */
  public rotateCounterClockwise(): boolean {
    return this.rotate(-1);
  }

  /**
   * Alias for rotateCounterClockwise().
   */
  public rotateAntiClockwise(): boolean {
    return this.rotate(-1);
  }

  /**
   * Holds the current active piece or swaps it with the already held piece.
   * Can only be used once per piece lock.
   */
  public hold(): boolean {
    if (this.gameOver || this.paused || !this.activePiece || !this.canHold) {
      return false;
    }
    const currentType = this.activePiece.type;
    const previousHold = this.holdPiece;
    this.holdPiece = currentType;
    this.canHold = false;

    if (previousHold === null) {
      this.spawnNextPiece();
    } else {
      this.spawnPiece(previousHold);
    }
    return true;
  }

  /**
   * Detects T-Spin and Mini T-Spin using the Guideline 3-corner T rule.
   */
  private detectTSpin(): { isTSpin: boolean; isMiniTSpin: boolean } {
    if (
      !this.activePiece ||
      this.activePiece.type !== 'T' ||
      !this.lastMoveWasRotation
    ) {
      return { isTSpin: false, isMiniTSpin: false };
    }

    const centerX = this.activePiece.x + 1;
    const centerY = this.activePiece.y + 1;

    const isOccupied = (cx: number, cy: number): boolean => {
      if (cx < 0 || cx >= BOARD_WIDTH || cy >= BOARD_HEIGHT) {
        return true;
      }
      if (cy < 0) {
        return false;
      }
      return this.board[cy]?.[cx] !== null;
    };

    const corners: [boolean, boolean, boolean, boolean] = [
      isOccupied(centerX - 1, centerY - 1), // Top-Left
      isOccupied(centerX + 1, centerY - 1), // Top-Right
      isOccupied(centerX + 1, centerY + 1), // Bottom-Right
      isOccupied(centerX - 1, centerY + 1), // Bottom-Left
    ];

    const occupiedCount = corners.filter(Boolean).length;
    if (occupiedCount < 3) {
      return { isTSpin: false, isMiniTSpin: false };
    }

    // Front corners relative to T's pointing direction (0=N, 1=E, 2=S, 3=W)
    const frontCornerPairs: Record<RotationState, [number, number]> = {
      0: [0, 1],
      1: [1, 2],
      2: [2, 3],
      3: [3, 0],
    };
    const [f1, f2] = frontCornerPairs[this.activePiece.rotation];
    const bothFrontOccupied = Boolean(corners[f1] && corners[f2]);

    // Kick test 5 (index 4, the 1x2 TST kick) upgrades a Mini T-Spin to a full T-Spin
    if (bothFrontOccupied || this.lastKickIndex === 4) {
      return { isTSpin: true, isMiniTSpin: false };
    }
    return { isTSpin: false, isMiniTSpin: true };
  }

  /**
   * Locks the active piece into the board, evaluates line clears and Guideline scoring,
   * resets hold availability, and spawns the next piece.
   */
  public lockPiece(): LockResult {
    if (!this.activePiece || this.gameOver) {
      return {
        locked: false,
        clearedLines: 0,
        clearedRowIndices: [],
        scoreGained: 0,
        isTSpin: false,
        isMiniTSpin: false,
        backToBack: this.backToBack,
        combo: this.combo,
        actionLabel: '',
        gameOver: this.gameOver,
      };
    }

    const { isTSpin, isMiniTSpin } = this.detectTSpin();
    const cells = getPieceCells(
      this.activePiece.type,
      this.activePiece.x,
      this.activePiece.y,
      this.activePiece.rotation
    );

    let visibleCellsLocked = 0;
    for (const cell of cells) {
      if (
        cell.y >= 0 &&
        cell.y < BOARD_HEIGHT &&
        cell.x >= 0 &&
        cell.x < BOARD_WIDTH
      ) {
        this.board[cell.y]![cell.x] = this.activePiece.type;
        visibleCellsLocked++;
      }
    }

    // Lock out: piece locked completely above the visible matrix
    if (visibleCellsLocked === 0) {
      this.gameOver = true;
      this.lastAction = 'GAME OVER';
      return {
        locked: true,
        clearedLines: 0,
        clearedRowIndices: [],
        scoreGained: 0,
        isTSpin: false,
        isMiniTSpin: false,
        backToBack: this.backToBack,
        combo: this.combo,
        actionLabel: 'GAME OVER',
        gameOver: true,
      };
    }

    const clearedRowIndices = clearFullLines(this.board);
    const clearedLines = clearedRowIndices.length;

    let baseScore = 0;
    let actionLabel = '';

    if (isTSpin) {
      const tSpinScores = [400, 800, 1200, 1600];
      const tSpinLabels = [
        'T-SPIN',
        'T-SPIN SINGLE',
        'T-SPIN DOUBLE',
        'T-SPIN TRIPLE',
      ];
      baseScore = (tSpinScores[clearedLines] ?? 0) * this.level;
      actionLabel = tSpinLabels[clearedLines] ?? 'T-SPIN';
    } else if (isMiniTSpin) {
      const miniScores = [100, 200, 400, 0];
      const miniLabels = [
        'MINI T-SPIN',
        'MINI T-SPIN SINGLE',
        'MINI T-SPIN DOUBLE',
        '',
      ];
      baseScore = (miniScores[clearedLines] ?? 0) * this.level;
      actionLabel = miniLabels[clearedLines] ?? 'MINI T-SPIN';
    } else if (clearedLines > 0) {
      const lineScores = [0, 100, 300, 500, 800];
      const lineLabels = ['', 'SINGLE', 'DOUBLE', 'TRIPLE', 'TETRIS!'];
      baseScore = (lineScores[clearedLines] ?? 0) * this.level;
      actionLabel = lineLabels[clearedLines] ?? '';
    }

    const isDifficultClear =
      clearedLines === 4 || ((isTSpin || isMiniTSpin) && clearedLines > 0);
    let b2bApplied = false;

    if (clearedLines > 0) {
      if (isDifficultClear && this.backToBack) {
        baseScore = Math.floor(baseScore * 1.5);
        b2bApplied = true;
        actionLabel = `B2B ${actionLabel}`;
      }
      this.backToBack = isDifficultClear;
      this.combo += 1;
      const comboBonus = this.combo > 0 ? 50 * this.combo * this.level : 0;
      const totalGained = baseScore + comboBonus;
      this.score += totalGained;
      this.lines += clearedLines;
      this.level = Math.max(this.startLevel, Math.floor(this.lines / 10) + 1);
      baseScore = totalGained;
    } else {
      this.combo = -1;
      this.score += baseScore;
    }

    if (actionLabel) {
      this.lastAction = actionLabel;
    }

    this.canHold = true;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.gravityTimer = 0;

    this.spawnNextPiece();

    return {
      locked: true,
      clearedLines,
      clearedRowIndices,
      scoreGained: baseScore,
      isTSpin,
      isMiniTSpin,
      backToBack: b2bApplied,
      combo: this.combo,
      actionLabel,
      gameOver: this.gameOver,
    };
  }

  /**
   * Advances game timers (gravity & lock delay) by `deltaMs` milliseconds.
   */
  public tick(deltaMs: number): void {
    if (this.gameOver || this.paused || !this.activePiece || deltaMs <= 0) {
      return;
    }

    let remaining = deltaMs;
    const dropInterval = this.getDropIntervalMs();

    while (remaining > 0 && !this.gameOver && this.activePiece) {
      if (this.isGrounded()) {
        const neededToLock = Math.max(0, LOCK_DELAY_MS - this.lockTimer);
        if (remaining >= neededToLock) {
          this.lockTimer += neededToLock;
          remaining -= neededToLock;
          this.lockPiece();
          // Stop processing leftover time after locking so the newly spawned piece starts fresh
          break;
        } else {
          this.lockTimer += remaining;
          remaining = 0;
        }
      } else {
        this.lockTimer = 0;
        const neededToDrop = Math.max(1, dropInterval - this.gravityTimer);
        if (remaining >= neededToDrop) {
          remaining -= neededToDrop;
          this.gravityTimer = 0;
          this.moveDown(false);
        } else {
          this.gravityTimer += remaining;
          remaining = 0;
        }
      }
    }
  }

  /**
   * Alias for tick(deltaMs).
   */
  public update(deltaMs: number): void {
    this.tick(deltaMs);
  }

  /**
   * Processes a keyboard input by key/code according to the README controls.
   */
  public handleKey(key: string, code: string = ''): boolean {
    if (
      code === 'KeyR' ||
      key === 'r' ||
      key === 'R'
    ) {
      this.restart();
      return true;
    }

    if (this.gameOver) {
      return false;
    }

    if (code === 'ArrowLeft' || key === 'ArrowLeft' || key === 'Left') {
      return this.moveLeft();
    }
    if (code === 'ArrowRight' || key === 'ArrowRight' || key === 'Right') {
      return this.moveRight();
    }
    if (
      code === 'ArrowUp' ||
      key === 'ArrowUp' ||
      key === 'Up' ||
      code === 'KeyX' ||
      key === 'x' ||
      key === 'X'
    ) {
      return this.rotateClockwise();
    }
    if (
      code === 'KeyZ' ||
      key === 'z' ||
      key === 'Z' ||
      code === 'ControlLeft' ||
      key === 'Control'
    ) {
      return this.rotateCounterClockwise();
    }
    if (code === 'ArrowDown' || key === 'ArrowDown' || key === 'Down') {
      return this.softDrop();
    }
    if (code === 'Space' || key === ' ' || key === 'Spacebar') {
      this.hardDrop();
      return true;
    }
    if (code === 'KeyC' || key === 'c' || key === 'C') {
      return this.hold();
    }

    return false;
  }

  /**
   * Returns a snapshot of the full game state.
   */
  public getState(): GameState {
    return {
      board: cloneBoard(this.board),
      activePiece: this.activePiece ? { ...this.activePiece } : null,
      ghostY: this.activePiece ? this.getGhostY() : null,
      holdPiece: this.holdPiece,
      canHold: this.canHold,
      nextQueue: [...this.nextQueue],
      score: this.score,
      lines: this.lines,
      level: this.level,
      combo: this.combo,
      backToBack: this.backToBack,
      gameOver: this.gameOver,
      paused: this.paused,
      lockTimer: this.lockTimer,
      lockResets: this.lockResets,
      lastAction: this.lastAction,
    };
  }
}
