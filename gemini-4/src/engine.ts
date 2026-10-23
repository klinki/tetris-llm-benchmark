import { BagRandomizer } from './bag.js';
import {
  BUFFER_ROWS,
  COLS,
  getGravityIntervalMs,
  I_WALL_KICKS,
  JLSTZ_WALL_KICKS,
  LINES_PER_LEVEL,
  LOCK_DELAY_MS,
  MAX_LOCK_RESETS,
  NEXT_QUEUE_SIZE,
  PIECE_SHAPES,
  TOTAL_ROWS,
} from './constants.js';
import {
  ActionBanner,
  ActivePiece,
  CellValue,
  GameSnapshot,
  PieceType,
  Point,
  RotationDirection,
  RotationState,
} from './types.js';

export class TetrisEngine {
  private board: CellValue[][] = [];
  private bag: BagRandomizer;
  private activePiece: ActivePiece | null = null;
  private holdPiece: PieceType | null = null;
  private canHold = true;

  private score = 0;
  private highScore = 0;
  private lines = 0;
  private level = 1;
  private combo = -1;
  private backToBack = false;

  private gameOver = false;
  private paused = false;

  private gravityTimerMs = 0;
  private lockTimerMs = 0;
  private lockResets = 0;
  private lowestY = 0;

  private lastMoveWasRotation = false;
  private lastKickIndex = 0;
  private lastAction: ActionBanner | null = null;

  constructor(rng?: () => number, initialHighScore = 0) {
    this.bag = new BagRandomizer(rng);
    this.highScore = initialHighScore;
    this.reset();
  }

  public reset(): void {
    this.board = Array.from({ length: TOTAL_ROWS }, () =>
      Array.from({ length: COLS }, () => null)
    );
    this.bag.reset();
    this.activePiece = null;
    this.holdPiece = null;
    this.canHold = true;

    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.combo = -1;
    this.backToBack = false;

    this.gameOver = false;
    this.paused = false;

    this.gravityTimerMs = 0;
    this.lockTimerMs = 0;
    this.lockResets = 0;
    this.lowestY = 0;
    this.lastMoveWasRotation = false;
    this.lastKickIndex = 0;
    this.lastAction = null;

    this.spawnNextPiece();
  }

  public togglePause(): void {
    if (this.gameOver) return;
    this.paused = !this.paused;
  }

  public setPaused(paused: boolean): void {
    if (this.gameOver) return;
    this.paused = paused;
  }

  public isPaused(): boolean {
    return this.paused;
  }

  public isGameOver(): boolean {
    return this.gameOver;
  }

  /**
   * Advances the game clock by `dtMs` milliseconds.
   */
  public update(dtMs: number, softDropping = false): void {
    if (this.gameOver || this.paused || !this.activePiece) return;

    const gravityInterval = getGravityIntervalMs(this.level);
    const effectiveInterval = softDropping
      ? Math.min(gravityInterval / 20, 40)
      : gravityInterval;

    this.gravityTimerMs += dtMs;

    while (this.gravityTimerMs >= effectiveInterval) {
      this.gravityTimerMs -= effectiveInterval;
      if (this.tryMove(0, 1)) {
        if (softDropping) {
          this.addScore(1);
        }
      } else {
        this.gravityTimerMs = 0;
        break;
      }
    }

    // Lock delay handling when piece rests on a surface
    if (this.isGrounded()) {
      this.lockTimerMs += dtMs;
      if (this.lockTimerMs >= LOCK_DELAY_MS) {
        this.lockActivePiece();
      }
    } else {
      this.lockTimerMs = 0;
    }
  }

  public moveLeft(): boolean {
    return this.tryHorizontalMove(-1);
  }

  public moveRight(): boolean {
    return this.tryHorizontalMove(1);
  }

  public softDrop(): boolean {
    if (this.gameOver || this.paused || !this.activePiece) return false;
    if (this.tryMove(0, 1)) {
      this.addScore(1);
      this.gravityTimerMs = 0;
      return true;
    }
    return false;
  }

  public hardDrop(): number {
    if (this.gameOver || this.paused || !this.activePiece) return 0;
    let droppedRows = 0;
    while (this.tryMove(0, 1)) {
      droppedRows++;
    }
    if (droppedRows > 0) {
      this.addScore(droppedRows * 2);
    }
    this.lockActivePiece();
    return droppedRows;
  }

  public rotate(direction: RotationDirection): boolean {
    if (this.gameOver || this.paused || !this.activePiece) return false;

    const piece = this.activePiece;
    const fromRot = piece.rotation;
    const toRot = (
      direction === 'cw' ? (fromRot + 1) % 4 : (fromRot + 3) % 4
    ) as RotationState;

    const kicks = this.getWallKicks(piece.type, fromRot, toRot);

    for (let i = 0; i < kicks.length; i++) {
      const offset = kicks[i];
      const candidate: ActivePiece = {
        type: piece.type,
        rotation: toRot,
        x: piece.x + offset.x,
        y: piece.y + offset.y,
      };

      if (this.isValidPosition(candidate)) {
        const wasGrounded = this.isGrounded();
        this.activePiece = candidate;
        this.lastMoveWasRotation = true;
        this.lastKickIndex = i;
        this.handleMoveLockReset(wasGrounded);
        return true;
      }
    }

    return false;
  }

  public hold(): boolean {
    if (this.gameOver || this.paused || !this.activePiece || !this.canHold) {
      return false;
    }

    const currentType = this.activePiece.type;
    const previouslyHeld = this.holdPiece;
    this.holdPiece = currentType;
    this.canHold = false;

    if (previouslyHeld === null) {
      this.spawnNextPiece();
    } else {
      this.spawnPieceOfType(previouslyHeld);
    }

    return true;
  }

  public getPieceCells(piece: ActivePiece): Point[] {
    const offsets = PIECE_SHAPES[piece.type][piece.rotation];
    return offsets.map((pt) => ({
      x: piece.x + pt.x,
      y: piece.y + pt.y,
    }));
  }

  public getGhostY(): number | null {
    if (!this.activePiece) return null;
    const testPiece: ActivePiece = { ...this.activePiece };
    while (
      this.isValidPosition({
        ...testPiece,
        y: testPiece.y + 1,
      })
    ) {
      testPiece.y++;
    }
    return testPiece.y;
  }

  public getSnapshot(): GameSnapshot {
    return {
      board: this.board.map((row) => [...row]),
      activePiece: this.activePiece ? { ...this.activePiece } : null,
      ghostY: this.getGhostY(),
      holdPiece: this.holdPiece,
      canHold: this.canHold,
      nextQueue: this.bag.peek(NEXT_QUEUE_SIZE),
      score: this.score,
      highScore: this.highScore,
      lines: this.lines,
      level: this.level,
      combo: Math.max(0, this.combo),
      backToBack: this.backToBack,
      gameOver: this.gameOver,
      paused: this.paused,
      lastAction: this.lastAction,
    };
  }

  /**
   * Test helpers for deterministic state inspection/manipulation
   */
  public setBoardForTest(board: CellValue[][]): void {
    this.board = board.map((r) => [...r]);
  }

  public setActivePieceForTest(piece: ActivePiece): void {
    this.activePiece = { ...piece };
    this.lowestY = piece.y;
    this.lockTimerMs = 0;
    this.lockResets = 0;
    this.lastMoveWasRotation = false;
  }

  private tryHorizontalMove(dx: number): boolean {
    if (this.gameOver || this.paused || !this.activePiece) return false;
    return this.tryMove(dx, 0);
  }

  private tryMove(dx: number, dy: number): boolean {
    if (!this.activePiece) return false;

    const candidate: ActivePiece = {
      ...this.activePiece,
      x: this.activePiece.x + dx,
      y: this.activePiece.y + dy,
    };

    if (!this.isValidPosition(candidate)) {
      return false;
    }

    const wasGrounded = this.isGrounded();
    this.activePiece = candidate;
    this.lastMoveWasRotation = false;

    if (candidate.y > this.lowestY) {
      this.lowestY = candidate.y;
      this.lockResets = 0;
      this.lockTimerMs = 0;
    } else {
      this.handleMoveLockReset(wasGrounded);
    }

    return true;
  }

  private handleMoveLockReset(wasGrounded: boolean): void {
    const nowGrounded = this.isGrounded();
    if ((wasGrounded || nowGrounded) && this.lockResets < MAX_LOCK_RESETS) {
      this.lockTimerMs = 0;
      this.lockResets++;
    }
  }

  private isGrounded(): boolean {
    if (!this.activePiece) return false;
    return !this.isValidPosition({
      ...this.activePiece,
      y: this.activePiece.y + 1,
    });
  }

  private isValidPosition(piece: ActivePiece): boolean {
    const cells = this.getPieceCells(piece);
    for (const cell of cells) {
      if (cell.x < 0 || cell.x >= COLS || cell.y < 0 || cell.y >= TOTAL_ROWS) {
        return false;
      }
      if (this.board[cell.y][cell.x] !== null) {
        return false;
      }
    }
    return true;
  }

  private getWallKicks(
    type: PieceType,
    fromRot: RotationState,
    toRot: RotationState
  ): readonly Point[] {
    if (type === 'O') {
      return [{ x: 0, y: 0 }];
    }
    const key = `${fromRot}->${toRot}`;
    if (type === 'I') {
      return I_WALL_KICKS[key] ?? [{ x: 0, y: 0 }];
    }
    return JLSTZ_WALL_KICKS[key] ?? [{ x: 0, y: 0 }];
  }

  private spawnNextPiece(): void {
    const nextType = this.bag.next();
    this.spawnPieceOfType(nextType);
  }

  private spawnPieceOfType(type: PieceType): void {
    const candidate: ActivePiece = {
      type,
      rotation: 0,
      x: 3,
      y: BUFFER_ROWS - 1,
    };

    // If standard spawn row overlaps, try one row higher in buffer zone
    if (!this.isValidPosition(candidate)) {
      candidate.y = BUFFER_ROWS - 2;
    }

    this.activePiece = candidate;
    this.gravityTimerMs = 0;
    this.lockTimerMs = 0;
    this.lockResets = 0;
    this.lowestY = candidate.y;
    this.lastMoveWasRotation = false;
    this.lastKickIndex = 0;

    // Guideline Block Out condition: newly spawned piece overlaps existing blocks
    if (!this.isValidPosition(candidate)) {
      this.gameOver = true;
    }
  }

  private detectTSpin(piece: ActivePiece): 'none' | 'mini' | 'full' {
    if (piece.type !== 'T' || !this.lastMoveWasRotation) {
      return 'none';
    }

    // 3-corner T-Spin rule around center (piece.x + 1, piece.y + 1)
    const corners: Point[] = [
      { x: piece.x, y: piece.y }, // Top-left
      { x: piece.x + 2, y: piece.y }, // Top-right
      { x: piece.x + 2, y: piece.y + 2 }, // Bottom-right
      { x: piece.x, y: piece.y + 2 }, // Bottom-left
    ];

    const isOccupied = (pt: Point): boolean => {
      if (pt.x < 0 || pt.x >= COLS || pt.y < 0 || pt.y >= TOTAL_ROWS) {
        return true; // Walls/floor count as occupied for T-Spin detection
      }
      return this.board[pt.y][pt.x] !== null;
    };

    const occupiedCount = corners.filter(isOccupied).length;
    if (occupiedCount < 3) {
      return 'none';
    }

    // Front two corners for each rotation state:
    // 0: top-left (0), top-right (1)
    // 1: top-right (1), bottom-right (2)
    // 2: bottom-right (2), bottom-left (3)
    // 3: bottom-left (3), top-left (0)
    const frontCornerA = corners[piece.rotation];
    const frontCornerB = corners[(piece.rotation + 1) % 4];

    if (
      (isOccupied(frontCornerA) && isOccupied(frontCornerB)) ||
      this.lastKickIndex === 4
    ) {
      return 'full';
    }

    return 'mini';
  }

  private lockActivePiece(): void {
    if (!this.activePiece) return;

    const piece = this.activePiece;
    const tSpin = this.detectTSpin(piece);
    const cells = this.getPieceCells(piece);

    let allAboveVisible = true;
    for (const cell of cells) {
      if (cell.y >= 0 && cell.y < TOTAL_ROWS && cell.x >= 0 && cell.x < COLS) {
        this.board[cell.y][cell.x] = piece.type;
      }
      if (cell.y >= BUFFER_ROWS) {
        allAboveVisible = false;
      }
    }

    // Guideline Lock Out condition: piece locks completely above the visible playfield
    if (allAboveVisible) {
      this.gameOver = true;
      return;
    }

    const clearedLines = this.clearFullLines();
    this.scorePlacement(clearedLines, tSpin);

    this.canHold = true;
    this.spawnNextPiece();
  }

  private clearFullLines(): number {
    let cleared = 0;
    const newBoard: CellValue[][] = [];

    for (let r = 0; r < TOTAL_ROWS; r++) {
      const isFull = this.board[r].every((cell) => cell !== null);
      if (isFull) {
        cleared++;
      } else {
        newBoard.push(this.board[r]);
      }
    }

    while (newBoard.length < TOTAL_ROWS) {
      newBoard.unshift(Array.from({ length: COLS }, () => null));
    }

    this.board = newBoard;
    return cleared;
  }

  private scorePlacement(
    clearedLines: number,
    tSpin: 'none' | 'mini' | 'full'
  ): void {
    let basePoints = 0;
    let actionTitle = '';
    let isDifficultClear = false;

    if (tSpin === 'full') {
      if (clearedLines === 0) {
        basePoints = 400;
        actionTitle = 'T-SPIN';
      } else if (clearedLines === 1) {
        basePoints = 800;
        actionTitle = 'T-SPIN SINGLE';
        isDifficultClear = true;
      } else if (clearedLines === 2) {
        basePoints = 1200;
        actionTitle = 'T-SPIN DOUBLE';
        isDifficultClear = true;
      } else if (clearedLines === 3) {
        basePoints = 1600;
        actionTitle = 'T-SPIN TRIPLE';
        isDifficultClear = true;
      }
    } else if (tSpin === 'mini') {
      if (clearedLines === 0) {
        basePoints = 100;
        actionTitle = 'MINI T-SPIN';
      } else if (clearedLines === 1) {
        basePoints = 200;
        actionTitle = 'MINI T-SPIN SINGLE';
        isDifficultClear = true;
      } else if (clearedLines === 2) {
        basePoints = 400;
        actionTitle = 'MINI T-SPIN DOUBLE';
        isDifficultClear = true;
      }
    } else {
      if (clearedLines === 1) {
        basePoints = 100;
        actionTitle = 'SINGLE';
      } else if (clearedLines === 2) {
        basePoints = 300;
        actionTitle = 'DOUBLE';
      } else if (clearedLines === 3) {
        basePoints = 500;
        actionTitle = 'TRIPLE';
      } else if (clearedLines === 4) {
        basePoints = 800;
        actionTitle = 'TETRIS!';
        isDifficultClear = true;
      }
    }

    let totalPoints = basePoints * this.level;
    const subtitles: string[] = [];

    if (clearedLines > 0) {
      this.combo++;
      if (isDifficultClear) {
        if (this.backToBack) {
          totalPoints = Math.floor(totalPoints * 1.5);
          subtitles.push('BACK-TO-BACK ×1.5');
        }
        this.backToBack = true;
      } else {
        this.backToBack = false;
      }

      if (this.combo > 0) {
        const comboBonus = 50 * this.combo * this.level;
        totalPoints += comboBonus;
        subtitles.push(`COMBO ×${this.combo}`);
      }

      this.lines += clearedLines;
      this.level = Math.floor(this.lines / LINES_PER_LEVEL) + 1;
    } else {
      this.combo = -1;
    }

    if (totalPoints > 0) {
      this.addScore(totalPoints);
    }

    if (actionTitle) {
      this.lastAction = {
        title: actionTitle,
        subtitle: subtitles.length > 0 ? subtitles.join(' • ') : undefined,
        timestamp: Date.now(),
      };
    }
  }

  private addScore(points: number): void {
    this.score += points;
    if (this.score > this.highScore) {
      this.highScore = this.score;
    }
  }
}
