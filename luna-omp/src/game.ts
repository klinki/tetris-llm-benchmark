export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 22;
export const HIDDEN_ROWS = 2;
export const VISIBLE_HEIGHT = BOARD_HEIGHT - HIDDEN_ROWS;
export const LOCK_DELAY_MS = 500;
export const MAX_LOCK_RESETS = 15;

export type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";
export type Rotation = 0 | 1 | 2 | 3;
export type Cell = PieceType;
export type RotationDirection = 1 | -1;
type TSpinType = "none" | "mini" | "full";
 
export interface Point {
  x: number;
  y: number;
}

export interface Piece {
  type: PieceType;
  x: number;
  y: number;
  rotation: Rotation;
}

export interface GameState {
  board: readonly (readonly (Cell | null)[])[];
  current: Piece | null;
  ghost: Piece | null;
  hold: PieceType | null;
  next: readonly PieceType[];
  score: number;
  lines: number;
  level: number;
  combo: number;
  backToBack: boolean;
  paused: boolean;
  gameOver: boolean;
  grounded: boolean;
}

export type StateListener = (state: GameState) => void;
export type Random = () => number;

const PIECES: readonly PieceType[] = ["I", "J", "L", "O", "S", "T", "Z"];

/** Colors are intentionally kept with the engine so renderers cannot disagree. */
export const PIECE_COLORS: Readonly<Record<PieceType, string>> = {
  I: "#25c9e8",
  J: "#3d6ff2",
  L: "#f08b32",
  O: "#f2d64b",
  S: "#4cc96b",
  T: "#b45be5",
  Z: "#e84c5a",
};

export const PIECE_NAMES: Readonly<Record<PieceType, string>> = {
  I: "I",
  J: "J",
  L: "L",
  O: "O",
  S: "S",
  T: "T",
  Z: "Z",
};

/* Coordinates use a top-left origin. SRS's positive-y-up kick values are
 * converted to screen coordinates in the kick tables below. */
const JLSTZ_ROTATIONS: Readonly<Record<Rotation, readonly Point[]>> = {
  0: [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
  ],
  1: [
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
    { x: 1, y: 2 },
  ],
  2: [
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
    { x: 1, y: 2 },
  ],
  3: [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 1, y: 2 },
  ],
};

const PIECE_ROTATIONS: Readonly<Record<PieceType, Readonly<Record<Rotation, readonly Point[]>>>> = {
  J: {
    0: [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    1: [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ],
    2: [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
    ],
    3: [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
    ],
  },
  L: {
    0: [
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    1: [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ],
    2: [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 0, y: 2 },
    ],
    3: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ],
  },
  S: {
    0: [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
    1: [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
    ],
    2: [
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
    ],
    3: [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ],
  },
  Z: {
    0: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    1: [
      { x: 2, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
    ],
    2: [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ],
    3: [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 0, y: 2 },
    ],
  },
  T: {
    0: [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    1: [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
    ],
    2: [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
    ],
    3: [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ],
  },
  I: {
    0: [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 1 },
    ],
    1: [
      { x: 2, y: 0 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
      { x: 2, y: 3 },
    ],
    2: [
      { x: 0, y: 2 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
      { x: 3, y: 2 },
    ],
    3: [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 1, y: 3 },
    ],
  },
  O: {
    0: [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    1: [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    2: [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    3: [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
  },
};

const KICK_KEYS = [
  "0>1",
  "1>0",
  "1>2",
  "2>1",
  "2>3",
  "3>2",
  "3>0",
  "0>3",
] as const;
type KickKey = (typeof KICK_KEYS)[number];

const JLSTZ_KICKS: Readonly<Record<KickKey, readonly Point[]>> = {
  "0>1": [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: -1 }, { x: 0, y: 2 }, { x: -1, y: 2 }],
  "1>0": [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: -2 }, { x: 1, y: -2 }],
  "1>2": [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: -2 }, { x: 1, y: -2 }],
  "2>1": [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: -1 }, { x: 0, y: 2 }, { x: -1, y: 2 }],
  "2>3": [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: -1 }, { x: 0, y: 2 }, { x: 1, y: 2 }],
  "3>2": [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: 1 }, { x: 0, y: -2 }, { x: -1, y: -2 }],
  "3>0": [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: 1 }, { x: 0, y: -2 }, { x: -1, y: -2 }],
  "0>3": [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: -1 }, { x: 0, y: 2 }, { x: 1, y: 2 }],
};

const I_KICKS: Readonly<Record<KickKey, readonly Point[]>> = {
  "0>1": [{ x: 0, y: 0 }, { x: -2, y: 0 }, { x: 1, y: 0 }, { x: -2, y: 1 }, { x: 1, y: -2 }],
  "1>0": [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: -1, y: 0 }, { x: 2, y: -1 }, { x: -1, y: 2 }],
  "1>2": [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: 2, y: 0 }, { x: -1, y: -2 }, { x: 2, y: 1 }],
  "2>1": [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: -2, y: 0 }, { x: 1, y: 2 }, { x: -2, y: -1 }],
  "2>3": [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: -1, y: 0 }, { x: 2, y: -1 }, { x: -1, y: 2 }],
  "3>2": [{ x: 0, y: 0 }, { x: -2, y: 0 }, { x: 1, y: 0 }, { x: -2, y: 1 }, { x: 1, y: -2 }],
  "3>0": [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: -2, y: 0 }, { x: 1, y: 2 }, { x: -2, y: -1 }],
  "0>3": [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: 2, y: 0 }, { x: -1, y: -2 }, { x: 2, y: 1 }],
};

const LINE_SCORES = [0, 100, 300, 500, 800] as const;
const T_SPIN_SCORES = [400, 800, 1200, 1600] as const;
const T_SPIN_MINI_SCORES = [100, 200, 400] as const;
const GRAVITY_MS = [800, 717, 633, 550, 467, 383, 300, 217, 133, 100, 83, 67, 50, 33, 17] as const;


function kickTable(type: PieceType, from: Rotation, to: Rotation): readonly Point[] {
  if (type === "O") return [{ x: 0, y: 0 }];
  const key = `${from}>${to}` as KickKey;
  return type === "I" ? I_KICKS[key] : JLSTZ_KICKS[key];
}


function shuffleBag(random: Random): PieceType[] {
  const bag = [...PIECES];
  for (let i = bag.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [bag[i], bag[j]] = [bag[j]!, bag[i]!];
  }
  return bag;
}

function pieceCells(piece: Piece): Point[] {
  return PIECE_ROTATIONS[piece.type][piece.rotation].map((point) => ({
    x: piece.x + point.x,
    y: piece.y + point.y,
  }));
}


export class TetrisGame {
  private board: (Cell | null)[][] = Array.from({ length: BOARD_HEIGHT }, () => Array<Cell | null>(BOARD_WIDTH).fill(null));
  private currentPiece: Piece | null = null;
  private holdType: PieceType | null = null;
  private queue: PieceType[] = [];
  private canHoldPiece = true;
  private gravityTimer = 0;
  private lockTimer = 0;
  private lockResets = 0;
  private lastActionWasRotation = false;
  private scoreValue = 0;
  private linesValue = 0;
  private comboValue = -1;
  private backToBackValue = false;
  private pausedValue = false;
  private gameOverValue = false;
  private listeners = new Set<StateListener>();

  public constructor(private readonly random: Random = Math.random) {
    this.restart();
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  public restart(): void {
    this.board = Array.from({ length: BOARD_HEIGHT }, () => Array<Cell | null>(BOARD_WIDTH).fill(null));
    this.currentPiece = null;
    this.holdType = null;
    this.queue = [];
    this.canHoldPiece = true;
    this.gravityTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lastActionWasRotation = false;
    this.scoreValue = 0;
    this.linesValue = 0;
    this.comboValue = -1;
    this.backToBackValue = false;
    this.pausedValue = false;
    this.gameOverValue = false;
    this.fillQueue();
    this.spawnNext();
    this.emit();
  }

  public togglePause(): boolean {
    if (this.gameOverValue) return false;
    this.pausedValue = !this.pausedValue;
    this.emit();
    return this.pausedValue;
  }

  public tick(deltaMs: number): void {
    if (this.pausedValue || this.gameOverValue || !this.currentPiece || deltaMs <= 0) return;
    const gravity = GRAVITY_MS[Math.min(this.level - 1, GRAVITY_MS.length - 1)]!;
    this.gravityTimer += deltaMs;

    while (this.gravityTimer >= gravity) {
      this.gravityTimer -= gravity;
      if (!this.tryMove(0, 1, false)) {
        break;
      }
    }

    if (this.currentPiece && !this.canPlace({ ...this.currentPiece, y: this.currentPiece.y + 1 })) {
      this.lockTimer += deltaMs;
      if (this.lockTimer >= LOCK_DELAY_MS) this.lockPiece();
    } else if (this.currentPiece) {
      this.lockTimer = 0;
    }
    this.emit();
  }

  public move(horizontal: -1 | 1): boolean {
    if (!this.isActive()) return false;
    return this.tryMove(horizontal, 0, true);
  }

  public softDrop(): boolean {
    if (!this.isActive()) return false;
    const moved = this.tryMove(0, 1, true);
    if (moved) this.scoreValue += 1;
    this.emit();
    return moved;
  }

  public hardDrop(): number {
    if (!this.isActive() || !this.currentPiece) return 0;
    const distance = this.getDropDistance(this.currentPiece);
    this.currentPiece.y += distance;
    this.scoreValue += distance * 2;
    this.lockPiece();
    this.emit();
    return distance;
  }

  public rotate(direction: RotationDirection): boolean {
    if (!this.isActive() || !this.currentPiece) return false;
    const from = this.currentPiece.rotation;
    const to = ((from + (direction === 1 ? 1 : 3)) % 4) as Rotation;
    for (const kick of kickTable(this.currentPiece.type, from, to)) {
      const candidate: Piece = {
        ...this.currentPiece,
        rotation: to,
        x: this.currentPiece.x + kick.x,
        y: this.currentPiece.y + kick.y,
      };
      if (this.canPlace(candidate)) {
        this.currentPiece = candidate;
        this.lastActionWasRotation = true;
        this.resetLockDelay();
        this.emit();
        return true;
      }
    }
    return false;
  }

  public hold(): boolean {
    if (!this.isActive() || !this.currentPiece || !this.canHoldPiece) return false;
    const activeType = this.currentPiece.type;
    const replacement = this.holdType;
    this.holdType = activeType;
    this.canHoldPiece = false;
    this.gravityTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lastActionWasRotation = false;

    if (replacement === null) {
      this.fillQueue();
      const nextType = this.queue.shift();
      if (nextType === undefined) {
        this.endGame();
      } else {
        this.currentPiece = this.createSpawnPiece(nextType);
        this.fillQueue();
        if (!this.canPlace(this.currentPiece)) this.endGame();
      }
    } else {
      this.currentPiece = this.createSpawnPiece(replacement);
      if (!this.canPlace(this.currentPiece)) this.endGame();
    }
    this.emit();
    return !this.gameOverValue;
  }

  public getState(): GameState {
    const current = this.currentPiece ? { ...this.currentPiece } : null;
    return {
      board: this.board.map((row) => [...row]),
      current,
      ghost: current ? { ...current, y: current.y + this.getDropDistance(current) } : null,
      hold: this.holdType,
      next: [...this.queue],
      score: this.scoreValue,
      lines: this.linesValue,
      level: this.level,
      combo: this.comboValue,
      backToBack: this.backToBackValue,
      paused: this.pausedValue,
      gameOver: this.gameOverValue,
      grounded: current ? !this.canPlace({ ...current, y: current.y + 1 }) : false,
    };
  }

  public get level(): number {
    return Math.floor(this.linesValue / 10) + 1;
  }

  public getCurrentCells(): Point[] {
    return this.currentPiece ? pieceCells(this.currentPiece) : [];
  }

  public getPieceCells(type: PieceType, rotation: Rotation = 0): Point[] {
    return PIECE_ROTATIONS[type][rotation].map((point) => ({ ...point }));
  }

  public debugSetBoard(board: readonly (readonly (Cell | null)[])[]): void {
    if (board.length !== BOARD_HEIGHT || board.some((row) => row.length !== BOARD_WIDTH)) {
      throw new Error(`Board must be ${BOARD_WIDTH}x${BOARD_HEIGHT}`);
    }
    this.board = board.map((row) => [...row]);
    this.emit();
  }

  private getDropDistance(piece: Piece): number {
    let distance = 0;
    while (this.canPlace({ ...piece, y: piece.y + distance + 1 })) distance += 1;
    return distance;
  }

  private isActive(): boolean {
    return !this.pausedValue && !this.gameOverValue && this.currentPiece !== null;
  }

  private tryMove(dx: number, dy: number, resetLock: boolean): boolean {
    if (!this.currentPiece) return false;
    const candidate = { ...this.currentPiece, x: this.currentPiece.x + dx, y: this.currentPiece.y + dy };
    if (!this.canPlace(candidate)) return false;
    this.currentPiece = candidate;
    this.lastActionWasRotation = false;
    if (resetLock) this.resetLockDelay();
    this.emit();
    return true;
  }

  private resetLockDelay(): void {
    if (this.currentPiece && !this.canPlace({ ...this.currentPiece, y: this.currentPiece.y + 1 }) && this.lockResets < MAX_LOCK_RESETS) {
      this.lockTimer = 0;
      this.lockResets += 1;
    }
  }

  private canPlace(piece: Piece): boolean {
    return pieceCells(piece).every(({ x, y }) => x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT && this.board[y]?.[x] === null);
  }

  private fillQueue(): void {
    while (this.queue.length < 5) this.queue.push(...shuffleBag(this.random));
  }

  private createSpawnPiece(type: PieceType): Piece {
    return { type, x: type === "I" ? 3 : 3, y: 0, rotation: 0 };
  }

  private spawnNext(): void {
    this.fillQueue();
    const type = this.queue.shift();
    if (type === undefined) {
      this.endGame();
      return;
    }
    this.currentPiece = this.createSpawnPiece(type);
    this.canHoldPiece = true;
    this.gravityTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lastActionWasRotation = false;
    this.fillQueue();
    if (!this.canPlace(this.currentPiece)) this.endGame();
  }

  private endGame(): void {
    this.gameOverValue = true;
    this.currentPiece = null;
  }

  private lockPiece(): void {
    if (!this.currentPiece) return;
    const lockedPiece = { ...this.currentPiece };
    const tSpin = this.getTSpinType(lockedPiece);
    for (const { x, y } of pieceCells(lockedPiece)) {
      if (y < 0) {
        this.endGame();
        return;
      }
      if (y >= 0 && y < BOARD_HEIGHT) this.board[y]![x] = lockedPiece.type;
    }

    const cleared = this.clearLines();
    this.applyScore(cleared, tSpin, this.isPerfectClear());
    this.linesValue += cleared;
    this.spawnNext();
  }

  private clearLines(): number {
    const remaining = this.board.filter((row) => row.some((cell) => cell === null));
    const cleared = BOARD_HEIGHT - remaining.length;
    while (remaining.length < BOARD_HEIGHT) remaining.unshift(Array<Cell | null>(BOARD_WIDTH).fill(null));
    this.board = remaining;
    return cleared;
  }

  private isPerfectClear(): boolean {
    return this.board.every((row) => row.every((cell) => cell === null));
  }

  private getTSpinType(piece: Piece): TSpinType {
    if (piece.type !== "T" || !this.lastActionWasRotation) return "none";
    const centerX = piece.x + 1;
    const centerY = piece.y + 1;
    let occupiedCorners = 0;
    const corners = [
      { x: -1, y: -1 },
      { x: 1, y: -1 },
      { x: -1, y: 1 },
      { x: 1, y: 1 },
    ];
    for (const offset of corners) {
      const x = centerX + offset.x;
      const y = centerY + offset.y;
      if (x < 0 || x >= BOARD_WIDTH || y < 0 || y >= BOARD_HEIGHT || this.board[y]?.[x] !== null) occupiedCorners += 1;
    }
    if (occupiedCorners < 3) return "none";

    const frontCorners = piece.rotation === 0
      ? [{ x: -1, y: -1 }, { x: 1, y: -1 }]
      : piece.rotation === 1
        ? [{ x: 1, y: -1 }, { x: 1, y: 1 }]
        : piece.rotation === 2
          ? [{ x: -1, y: 1 }, { x: 1, y: 1 }]
          : [{ x: -1, y: -1 }, { x: -1, y: 1 }];
    const occupiedFrontCorners = frontCorners.filter((offset) => {
      const x = centerX + offset.x;
      const y = centerY + offset.y;
      return x < 0 || x >= BOARD_WIDTH || y < 0 || y >= BOARD_HEIGHT || this.board[y]?.[x] !== null;
    }).length;
    return occupiedFrontCorners < 2 ? "mini" : "full";
  }

  private applyScore(cleared: number, tSpin: TSpinType, perfectClear: boolean): void {
    const level = this.level;
    const difficult = tSpin !== "none" && cleared > 0 || cleared === 4;
    let points = 0;
    if (tSpin === "full") points = (T_SPIN_SCORES[cleared] ?? T_SPIN_SCORES[3]!) * level;
    else if (tSpin === "mini") points = (T_SPIN_MINI_SCORES[cleared] ?? T_SPIN_MINI_SCORES[2]!) * level;
    else points = (LINE_SCORES[cleared] ?? 0) * level;

    if (difficult && this.backToBackValue) points = Math.floor(points * 1.5);
    if (cleared > 0) {
      this.comboValue += 1;
      points += Math.max(0, this.comboValue) * 50 * level;
    } else {
      this.comboValue = -1;
    }
    if (difficult) this.backToBackValue = true;
    else if (cleared > 0) this.backToBackValue = false;
    if (perfectClear && cleared > 0) points += [0, 800, 1200, 1800, 2000][cleared]! * level;
    this.scoreValue += points;
  }

  private emit(): void {
    const state = this.getState();
    for (const listener of this.listeners) listener(state);
  }
}

export function getGravityInterval(level: number): number {
  return GRAVITY_MS[Math.max(0, Math.min(level - 1, GRAVITY_MS.length - 1))]!;
}

export function getSpawnCells(type: PieceType): Point[] {
  return PIECE_ROTATIONS[type][0].map((point) => ({ ...point }));
}

export const ALL_PIECES: readonly PieceType[] = PIECES;
