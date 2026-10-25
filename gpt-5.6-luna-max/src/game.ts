export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 22;
export const HIDDEN_ROWS = 2;
export const VISIBLE_ROWS = BOARD_HEIGHT - HIDDEN_ROWS;
export const PREVIEW_COUNT = 5;
export const LOCK_DELAY_MS = 500;
export const MAX_LOCK_RESETS = 15;

export type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";
export type Cell = PieceType | null;
export type Rotation = 0 | 1 | 2 | 3;
export type RandomSource = () => number;

export interface Coordinate {
  x: number;
  y: number;
}

export interface ActivePiece {
  type: PieceType;
  rotation: Rotation;
  x: number;
  y: number;
}

export interface ClearResult {
  lines: number;
  tSpin: boolean;
  tSpinMini: boolean;
  perfectClear: boolean;
}

export interface GameSnapshot {
  board: Cell[][];
  active: ActivePiece;
  ghost: ActivePiece;
  hold: PieceType | null;
  next: PieceType[];
  score: number;
  lines: number;
  level: number;
  combo: number;
  backToBack: boolean;
  gameOver: boolean;
  paused: boolean;
  canHold: boolean;
  lastClear: ClearResult | null;
}

export const PIECE_TYPES: readonly PieceType[] = [
  "I",
  "O",
  "T",
  "S",
  "Z",
  "J",
  "L",
];

export const PIECE_COLORS: Readonly<Record<PieceType, string>> = {
  I: "#35c9e8",
  O: "#f5c84b",
  T: "#b66cff",
  S: "#55d66b",
  Z: "#ef5b68",
  J: "#5b83ec",
  L: "#f39b42",
};

type Matrix = number[][];
type Kick = readonly [number, number];

const BASE_SHAPES: Readonly<Record<PieceType, Matrix>> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [0, 1, 1, 0],
    [0, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  T: [
    [0, 1, 0, 0],
    [1, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  S: [
    [0, 1, 1, 0],
    [1, 1, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  Z: [
    [1, 1, 0, 0],
    [0, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  J: [
    [1, 0, 0, 0],
    [1, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  L: [
    [0, 0, 1, 0],
    [1, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
};

function cloneMatrix(matrix: Matrix): Matrix {
  return matrix.map((row) => row.slice());
}

function rotateSquare(matrix: Matrix, size: number): Matrix {
  const result = cloneMatrix(matrix);
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      result[row][column] = matrix[size - 1 - column][row];
    }
  }
  return result;
}

function createRotationStates(type: PieceType): Matrix[] {
  const states: Matrix[] = [];
  let current = cloneMatrix(BASE_SHAPES[type]);
  const size = type === "I" ? 4 : type === "O" ? 0 : 3;

  for (let rotation = 0; rotation < 4; rotation += 1) {
    states.push(cloneMatrix(current));
    if (size > 0) {
      current = rotateSquare(current, size);
    }
  }

  return states;
}

const ROTATION_STATES: Readonly<Record<PieceType, Matrix[]>> = {
  I: createRotationStates("I"),
  O: createRotationStates("O"),
  T: createRotationStates("T"),
  S: createRotationStates("S"),
  Z: createRotationStates("Z"),
  J: createRotationStates("J"),
  L: createRotationStates("L"),
};

export function matrixForPiece(type: PieceType, rotation: Rotation): Matrix {
  return cloneMatrix(ROTATION_STATES[type][rotation]);
}

export function getPieceCells(piece: ActivePiece): Coordinate[] {
  const matrix = ROTATION_STATES[piece.type][piece.rotation];
  const cells: Coordinate[] = [];

  for (let row = 0; row < matrix.length; row += 1) {
    for (let column = 0; column < matrix[row].length; column += 1) {
      if (matrix[row][column] !== 0) {
        cells.push({ x: piece.x + column, y: piece.y + row });
      }
    }
  }

  return cells;
}

const JLSTZ_KICKS: Readonly<Record<string, readonly Kick[]>> = {
  "0>1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "1>0": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "1>2": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "2>1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "2>3": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "3>2": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "3>0": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "0>3": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
};

const I_KICKS: Readonly<Record<string, readonly Kick[]>> = {
  "0>1": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  "1>0": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  "1>2": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  "2>1": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  "2>3": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  "3>2": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  "3>0": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  "0>3": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
};

function kickTests(type: PieceType, from: Rotation, to: Rotation): readonly Kick[] {
  if (type === "O") {
    return [[0, 0]];
  }

  const key = String(from) + ">" + String(to);
  return type === "I" ? I_KICKS[key] : JLSTZ_KICKS[key];
}

const GRAVITY_INTERVALS_MS = [
  1000,
  793,
  618,
  473,
  355,
  262,
  190,
  135,
  99,
  72,
  53,
  39,
  29,
  21,
  16,
];

export function gravityIntervalForLevel(level: number): number {
  const index = Math.max(0, Math.floor(level) - 1);
  return GRAVITY_INTERVALS_MS[Math.min(index, GRAVITY_INTERVALS_MS.length - 1)];
}

function emptyRow(): Cell[] {
  return Array<Cell>(BOARD_WIDTH).fill(null);
}

function emptyBoard(): Cell[][] {
  return Array.from({ length: BOARD_HEIGHT }, () => emptyRow());
}

function cloneBoard(board: Cell[][]): Cell[][] {
  return board.map((row) => row.slice());
}

function clonePiece(piece: ActivePiece): ActivePiece {
  return { ...piece };
}

function normalizedRandomValue(random: RandomSource): number {
  const value = random();
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(0.999999999, Math.max(0, value));
}

function clearScore(lines: number, level: number): number {
  return [0, 100, 300, 500, 800][lines] * level;
}

function tSpinScore(lines: number, level: number, mini: boolean): number {
  const scores = mini ? [100, 200, 0, 0] : [400, 800, 1200, 1600];
  return scores[lines] * level;
}

function isDifficultClear(lines: number, tSpin: boolean): boolean {
  return lines === 4 || (tSpin && lines > 0);
}

export class TetrisGame {
  private readonly random: RandomSource;
  private grid: Cell[][] = emptyBoard();
  private queue: PieceType[] = [];
  private active!: ActivePiece;
  private held: PieceType | null = null;
  private _score = 0;
  private _lines = 0;
  private _level = 1;
  private _combo = -1;
  private _backToBack = false;
  private _gameOver = false;
  private _paused = false;
  private _canHold = true;
  private lockTimer = 0;
  private lockResets = 0;
  private fallAccumulator = 0;
  private lastActionWasRotation = false;
  private lastClearResult: ClearResult | null = null;

  public constructor(random: RandomSource = Math.random) {
    this.random = random;
    this.reset();
  }

  public reset(): void {
    this.grid = emptyBoard();
    this.queue = [];
    this.held = null;
    this._score = 0;
    this._lines = 0;
    this._level = 1;
    this._combo = -1;
    this._backToBack = false;
    this._gameOver = false;
    this._paused = false;
    this._canHold = true;
    this.lastClearResult = null;
    this.fillQueue(PREVIEW_COUNT + 1);
    this.spawnFromQueue();
  }

  public get score(): number {
    return this._score;
  }

  public get lines(): number {
    return this._lines;
  }

  public get level(): number {
    return this._level;
  }

  public get combo(): number {
    return this._combo;
  }

  public get gameOver(): boolean {
    return this._gameOver;
  }

  public get paused(): boolean {
    return this._paused;
  }

  public get canHold(): boolean {
    return this._canHold;
  }

  public togglePause(): boolean {
    if (this._gameOver) {
      return false;
    }
    this._paused = !this._paused;
    return this._paused;
  }

  public getBoard(): Cell[][] {
    return cloneBoard(this.grid);
  }

  public getSnapshot(): GameSnapshot {
    return {
      board: cloneBoard(this.grid),
      active: clonePiece(this.active),
      ghost: clonePiece(this.getGhostPiece()),
      hold: this.held,
      next: this.queue.slice(0, PREVIEW_COUNT),
      score: this._score,
      lines: this._lines,
      level: this._level,
      combo: this._combo,
      backToBack: this._backToBack,
      gameOver: this._gameOver,
      paused: this._paused,
      canHold: this._canHold,
      lastClear: this.lastClearResult ? { ...this.lastClearResult } : null,
    };
  }

  public move(horizontal: -1 | 1): boolean {
    if (this._gameOver || this._paused || (horizontal !== -1 && horizontal !== 1)) {
      return false;
    }

    const wasGrounded = this.isGrounded(this.active);
    const candidate = { ...this.active, x: this.active.x + horizontal };
    if (this.collides(candidate)) {
      return false;
    }

    this.active = candidate;
    this.lastActionWasRotation = false;
    this.updateAfterPlayerAction(wasGrounded);
    return true;
  }

  public rotate(direction: -1 | 1 = 1): boolean {
    if (this._gameOver || this._paused || (direction !== -1 && direction !== 1)) {
      return false;
    }

    const wasGrounded = this.isGrounded(this.active);
    const from = this.active.rotation;
    const to = ((from + (direction === 1 ? 1 : 3)) % 4) as Rotation;

    for (const [kickX, kickY] of kickTests(this.active.type, from, to)) {
      const candidate: ActivePiece = {
        ...this.active,
        rotation: to,
        x: this.active.x + kickX,
        y: this.active.y + kickY,
      };

      if (!this.collides(candidate)) {
        this.active = candidate;
        this.lastActionWasRotation = true;
        this.updateAfterPlayerAction(wasGrounded);
        return true;
      }
    }

    return false;
  }

  public softDrop(): boolean {
    if (this._gameOver || this._paused) {
      return false;
    }

    const wasGrounded = this.isGrounded(this.active);
    const candidate = { ...this.active, y: this.active.y + 1 };
    if (this.collides(candidate)) {
      return false;
    }

    this.active = candidate;
    this._score += 1;
    this.lastActionWasRotation = false;
    this.updateAfterPlayerAction(wasGrounded);
    return true;
  }

  public hardDrop(): number {
    if (this._gameOver || this._paused) {
      return 0;
    }

    let distance = 0;
    while (!this.collides({ ...this.active, y: this.active.y + 1 })) {
      this.active.y += 1;
      distance += 1;
    }

    this._score += distance * 2;
    this.lockPiece();
    return distance;
  }

  public holdPiece(): boolean {
    if (this._gameOver || this._paused || !this._canHold) {
      return false;
    }

    const current = this.active.type;
    const swap = this.held;
    this.held = current;

    if (swap === null) {
      this.spawnFromQueue();
    } else {
      this.activate(swap);
    }

    this._canHold = false;
    this.lastActionWasRotation = false;
    return !this._gameOver;
  }

  public tick(deltaMs: number): void {
    if (this._gameOver || this._paused || !Number.isFinite(deltaMs) || deltaMs <= 0) {
      return;
    }

    let remaining = Math.max(0, deltaMs);

    while (remaining > 0 && !this._gameOver) {
      if (this.isGrounded(this.active)) {
        const timeUntilLock = Math.max(0, LOCK_DELAY_MS - this.lockTimer);
        if (remaining >= timeUntilLock) {
          remaining -= timeUntilLock;
          this.lockPiece();
          continue;
        }

        this.lockTimer += remaining;
        remaining = 0;
        continue;
      }

      const timeUntilFall = Math.max(
        0,
        gravityIntervalForLevel(this._level) - this.fallAccumulator,
      );

      if (remaining < timeUntilFall) {
        this.fallAccumulator += remaining;
        remaining = 0;
        continue;
      }

      remaining -= timeUntilFall;
      this.fallAccumulator = 0;
      const candidate = { ...this.active, y: this.active.y + 1 };
      if (!this.collides(candidate)) {
        this.active = candidate;
      }
    }
  }

  private fillQueue(targetLength: number): void {
    while (this.queue.length < targetLength) {
      const bag = PIECE_TYPES.slice();
      for (let index = bag.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(normalizedRandomValue(this.random) * (index + 1));
        [bag[index], bag[swapIndex]] = [bag[swapIndex], bag[index]];
      }
      this.queue.push(...bag);
    }
  }

  private spawnFromQueue(): void {
    this.fillQueue(1);
    const nextType = this.queue.shift() as PieceType;
    this.activate(nextType);
    this.fillQueue(PREVIEW_COUNT);
  }

  private activate(type: PieceType): void {
    this.active = {
      type,
      rotation: 0,
      x: Math.floor((BOARD_WIDTH - 4) / 2),
      y: 0,
    };
    this.lockTimer = 0;
    this.lockResets = 0;
    this.fallAccumulator = 0;
    this.lastActionWasRotation = false;

    if (this.collides(this.active)) {
      this._gameOver = true;
    }
  }

  private isGrounded(piece: ActivePiece): boolean {
    return this.collides({ ...piece, y: piece.y + 1 });
  }

  private collides(piece: ActivePiece): boolean {
    for (const cell of getPieceCells(piece)) {
      if (cell.x < 0 || cell.x >= BOARD_WIDTH || cell.y >= BOARD_HEIGHT) {
        return true;
      }
      if (cell.y >= 0 && this.grid[cell.y][cell.x] !== null) {
        return true;
      }
    }
    return false;
  }

  private updateAfterPlayerAction(wasGrounded: boolean): void {
    const grounded = this.isGrounded(this.active);
    if (!grounded) {
      this.lockTimer = 0;
      return;
    }

    if (wasGrounded) {
      if (this.lockResets < MAX_LOCK_RESETS) {
        this.lockTimer = 0;
        this.lockResets += 1;
      }
    } else {
      this.lockTimer = 0;
    }
  }

  private isOccupied(x: number, y: number): boolean {
    return x < 0 || x >= BOARD_WIDTH || y < 0 || y >= BOARD_HEIGHT
      ? true
      : this.grid[y][x] !== null;
  }

  private detectTSpin(piece: ActivePiece): { tSpin: boolean; tSpinMini: boolean } {
    if (piece.type !== "T" || !this.lastActionWasRotation) {
      return { tSpin: false, tSpinMini: false };
    }

    const pivotX = piece.x + 1;
    const pivotY = piece.y + 1;
    const corners = [
      this.isOccupied(pivotX - 1, pivotY - 1),
      this.isOccupied(pivotX + 1, pivotY - 1),
      this.isOccupied(pivotX + 1, pivotY + 1),
      this.isOccupied(pivotX - 1, pivotY + 1),
    ];
    const occupiedCorners = corners.filter(Boolean).length;
    if (occupiedCorners < 3) {
      return { tSpin: false, tSpinMini: false };
    }

    const frontCornerIndexes: Record<Rotation, readonly number[]> = {
      0: [0, 1],
      1: [1, 2],
      2: [2, 3],
      3: [3, 0],
    };
    const frontCorners = frontCornerIndexes[piece.rotation]
      .filter((index) => corners[index]).length;

    return {
      tSpin: true,
      tSpinMini: frontCorners < 2,
    };
  }

  private lockPiece(): void {
    const lockedPiece = clonePiece(this.active);
    const spin = this.detectTSpin(lockedPiece);

    for (const cell of getPieceCells(lockedPiece)) {
      if (cell.y >= 0 && cell.y < BOARD_HEIGHT && cell.x >= 0 && cell.x < BOARD_WIDTH) {
        this.grid[cell.y][cell.x] = lockedPiece.type;
      }
    }

    const linesCleared = this.clearLines();
    const perfectClear = linesCleared > 0
      && this.grid.every((row) => row.every((cell) => cell === null));
    const levelBeforeClear = this._level;
    const difficult = isDifficultClear(linesCleared, spin.tSpin);

    let points = spin.tSpin
      ? tSpinScore(linesCleared, levelBeforeClear, spin.tSpinMini)
      : clearScore(linesCleared, levelBeforeClear);

    if (difficult && this._backToBack) {
      points = Math.floor(points * 1.5);
    }

    if (linesCleared > 0) {
      this._combo = this._combo < 0 ? 0 : this._combo + 1;
      points += this._combo > 0 ? this._combo * 50 * levelBeforeClear : 0;
    } else {
      this._combo = -1;
    }

    if (perfectClear) {
      points += [0, 800, 1200, 1800, 2000][linesCleared] * levelBeforeClear;
    }

    this._score += points;
    this._lines += linesCleared;
    this._level = Math.floor(this._lines / 10) + 1;

    if (difficult) {
      this._backToBack = true;
    } else if (linesCleared > 0) {
      this._backToBack = false;
    }

    this.lastClearResult = {
      lines: linesCleared,
      tSpin: spin.tSpin,
      tSpinMini: spin.tSpinMini,
      perfectClear,
    };

    this._canHold = true;
    this.spawnFromQueue();
  }

  private clearLines(): number {
    const remainingRows = this.grid.filter((row) => row.some((cell) => cell === null));
    const cleared = BOARD_HEIGHT - remainingRows.length;
    while (remainingRows.length < BOARD_HEIGHT) {
      remainingRows.unshift(emptyRow());
    }
    this.grid = remainingRows;
    return cleared;
  }

  private getGhostPiece(): ActivePiece {
    const ghost = clonePiece(this.active);
    while (!this.collides({ ...ghost, y: ghost.y + 1 })) {
      ghost.y += 1;
    }
    return ghost;
  }
}
