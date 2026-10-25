export const BOARD_WIDTH = 10;
export const VISIBLE_HEIGHT = 20;
export const HIDDEN_ROWS = 4;
export const BOARD_HEIGHT = VISIBLE_HEIGHT + HIDDEN_ROWS;

export type PieceType = "I" | "J" | "L" | "O" | "S" | "T" | "Z";
export type Cell = PieceType | null;
export type Board = Cell[][];
export type GameStatus = "playing" | "paused" | "over";
export type ClearKind = "none" | "single" | "double" | "triple" | "tetris" | "t-spin" | "t-spin-mini";

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface ActivePiece {
  type: PieceType;
  x: number;
  y: number;
  rotation: number;
}

export interface GameSnapshot {
  readonly board: Board;
  readonly active: ActivePiece;
  readonly ghostY: number;
  readonly next: readonly PieceType[];
  readonly held: PieceType | null;
  readonly score: number;
  readonly lines: number;
  readonly level: number;
  readonly combo: number;
  readonly backToBack: boolean;
  readonly status: GameStatus;
  readonly lastClear: ClearKind;
}

export type RandomSource = () => number;

const TYPES: readonly PieceType[] = ["I", "J", "L", "O", "S", "T", "Z"];

// SRS spawn orientations in a 4×4 local coordinate system.
const SHAPES: Readonly<Record<PieceType, readonly (readonly Point[])[]>> = {
  I: [
    [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }],
    [{ x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }],
    [{ x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }],
    [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 1, y: 3 }],
  ],
  J: rotations([{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }]),
  L: rotations([{ x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }]),
  O: [
    [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
  ],
  S: rotations([{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }]),
  T: rotations([{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }]),
  Z: rotations([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }]),
};

function rotations(spawn: readonly Point[]): readonly (readonly Point[])[] {
  const states: Point[][] = [spawn.map((p) => ({ ...p }))];
  for (let i = 1; i < 4; i += 1) {
    const previous = states[i - 1]!;
    states.push(previous.map(({ x, y }) => ({ x: 2 - y, y: x })));
  }
  return states;
}

// SRS kick data uses positive y upward; board coordinates use positive y downward.
const JLSTZ_KICKS: Readonly<Record<string, readonly Point[]>> = {
  "0>1": [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: 1 }, { x: 0, y: -2 }, { x: -1, y: -2 }],
  "1>0": [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: -1 }, { x: 0, y: 2 }, { x: 1, y: 2 }],
  "1>2": [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: -1 }, { x: 0, y: 2 }, { x: 1, y: 2 }],
  "2>1": [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: 1 }, { x: 0, y: -2 }, { x: -1, y: -2 }],
  "2>3": [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: -2 }, { x: 1, y: -2 }],
  "3>2": [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: -1 }, { x: 0, y: 2 }, { x: -1, y: 2 }],
  "3>0": [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: -1 }, { x: 0, y: 2 }, { x: -1, y: 2 }],
  "0>3": [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: -2 }, { x: 1, y: -2 }],
};

const I_KICKS: Readonly<Record<string, readonly Point[]>> = {
  "0>1": [{ x: 0, y: 0 }, { x: -2, y: 0 }, { x: 1, y: 0 }, { x: -2, y: -1 }, { x: 1, y: 2 }],
  "1>0": [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: -1, y: 0 }, { x: 2, y: 1 }, { x: -1, y: -2 }],
  "1>2": [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: 2, y: 0 }, { x: -1, y: 2 }, { x: 2, y: -1 }],
  "2>1": [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: -2, y: 0 }, { x: 1, y: -2 }, { x: -2, y: 1 }],
  "2>3": [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: -1, y: 0 }, { x: 2, y: 1 }, { x: -1, y: -2 }],
  "3>2": [{ x: 0, y: 0 }, { x: -2, y: 0 }, { x: 1, y: 0 }, { x: -2, y: -1 }, { x: 1, y: 2 }],
  "3>0": [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: -2, y: 0 }, { x: 1, y: -2 }, { x: -2, y: 1 }],
  "0>3": [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: 2, y: 0 }, { x: -1, y: 2 }, { x: 2, y: -1 }],
};

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_HEIGHT }, () => Array<Cell>(BOARD_WIDTH).fill(null));
}

export function cellsFor(piece: ActivePiece): Point[] {
  return SHAPES[piece.type][piece.rotation]!.map(({ x, y }) => ({ x: x + piece.x, y: y + piece.y }));
}

export class TetrisGame {
  board: Board = createEmptyBoard();
  active: ActivePiece = { type: "T", x: 3, y: 2, rotation: 0 };
  next: PieceType[] = [];
  held: PieceType | null = null;
  score = 0;
  lines = 0;
  level = 1;
  combo = -1;
  backToBack = false;
  status: GameStatus = "playing";
  lastClear: ClearKind = "none";

  private bag: PieceType[] = [];
  private holdAvailable = true;
  private gravityElapsed = 0;
  private lockElapsed = 0;
  private lockResets = 0;
  private lastActionWasRotation = false;
  private lastKickIndex = 0;

  constructor(private readonly random: RandomSource = Math.random) {
    this.fillQueue();
    this.spawn(this.next.shift()!);
    this.fillQueue();
  }

  get snapshot(): GameSnapshot {
    return {
      board: this.board,
      active: { ...this.active },
      ghostY: this.getGhostY(),
      next: this.next.slice(0, 5),
      held: this.held,
      score: this.score,
      lines: this.lines,
      level: this.level,
      combo: this.combo,
      backToBack: this.backToBack,
      status: this.status,
      lastClear: this.lastClear,
    };
  }

  restart(): void {
    this.board = createEmptyBoard();
    this.next = [];
    this.bag = [];
    this.held = null;
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.combo = -1;
    this.backToBack = false;
    this.status = "playing";
    this.lastClear = "none";
    this.holdAvailable = true;
    this.fillQueue();
    this.spawn(this.next.shift()!);
    this.fillQueue();
  }

  togglePause(): void {
    if (this.status === "playing") this.status = "paused";
    else if (this.status === "paused") this.status = "playing";
  }

  update(deltaMs: number): void {
    if (this.status !== "playing") return;
    const cappedDelta = Math.min(deltaMs, 100);
    this.gravityElapsed += cappedDelta;
    const interval = this.gravityInterval();
    while (this.gravityElapsed >= interval) {
      this.gravityElapsed -= interval;
      if (!this.tryMove(0, 1, false)) break;
    }

    if (this.isGrounded()) {
      this.lockElapsed += cappedDelta;
      if (this.lockElapsed >= 500) this.lock();
    } else {
      this.lockElapsed = 0;
    }
  }

  move(horizontal: -1 | 1): boolean {
    if (this.status !== "playing") return false;
    return this.tryMove(horizontal, 0, true);
  }

  softDrop(): boolean {
    if (this.status !== "playing") return false;
    const moved = this.tryMove(0, 1, false);
    if (moved) this.score += 1;
    return moved;
  }

  hardDrop(): number {
    if (this.status !== "playing") return 0;
    const distance = this.getGhostY() - this.active.y;
    this.active.y += distance;
    this.score += distance * 2;
    this.lastActionWasRotation = false;
    this.lock();
    return distance;
  }

  rotate(direction: 1 | -1): boolean {
    if (this.status !== "playing") return false;
    const from = this.active.rotation;
    const to = (from + direction + 4) % 4;
    if (this.active.type === "O") {
      const wasGrounded = this.isGrounded();
      this.active.rotation = to;
      this.lastActionWasRotation = true;
      this.resetLockAfterAction(wasGrounded);
      return true;
    }

    const kicks = (this.active.type === "I" ? I_KICKS : JLSTZ_KICKS)[`${from}>${to}`] ?? [{ x: 0, y: 0 }];
    for (let index = 0; index < kicks.length; index += 1) {
      const kick = kicks[index]!;
      const candidate = {
        ...this.active,
        rotation: to,
        x: this.active.x + kick.x,
        y: this.active.y - kick.y,
      };
      if (!this.collides(candidate)) {
        const wasGrounded = this.isGrounded();
        this.active = candidate;
        this.lastActionWasRotation = true;
        this.lastKickIndex = index;
        this.resetLockAfterAction(wasGrounded);
        return true;
      }
    }
    return false;
  }

  hold(): boolean {
    if (this.status !== "playing" || !this.holdAvailable) return false;
    const outgoing = this.active.type;
    if (this.held === null) {
      this.held = outgoing;
      this.spawn(this.next.shift()!);
      this.fillQueue();
    } else {
      const incoming = this.held;
      this.held = outgoing;
      this.spawn(incoming);
    }
    this.holdAvailable = false;
    return true;
  }

  getGhostY(): number {
    let y = this.active.y;
    while (!this.collides({ ...this.active, y: y + 1 })) y += 1;
    return y;
  }

  private spawn(type: PieceType): void {
    this.active = { type, x: 3, y: 2, rotation: 0 };
    this.gravityElapsed = 0;
    this.lockElapsed = 0;
    this.lockResets = 0;
    this.lastActionWasRotation = false;
    this.lastKickIndex = 0;
    if (this.collides(this.active)) this.status = "over";
  }

  private tryMove(dx: number, dy: number, resetLock: boolean): boolean {
    const candidate = { ...this.active, x: this.active.x + dx, y: this.active.y + dy };
    if (this.collides(candidate)) return false;
    const wasGrounded = this.isGrounded();
    this.active = candidate;
    this.lastActionWasRotation = false;
    if (resetLock) this.resetLockAfterAction(wasGrounded);
    return true;
  }

  private resetLockAfterAction(wasGrounded: boolean): void {
    if (wasGrounded && this.lockResets < 15) {
      this.lockElapsed = 0;
      this.lockResets += 1;
    }
  }

  private isGrounded(): boolean {
    return this.collides({ ...this.active, y: this.active.y + 1 });
  }

  private collides(piece: ActivePiece): boolean {
    return cellsFor(piece).some(({ x, y }) =>
      x < 0 || x >= BOARD_WIDTH || y >= BOARD_HEIGHT || (y >= 0 && this.board[y]![x] !== null),
    );
  }

  private lock(): void {
    const tspin = this.detectTSpin();
    let aboveBoard = false;
    for (const { x, y } of cellsFor(this.active)) {
      if (y < 0) aboveBoard = true;
      else this.board[y]![x] = this.active.type;
    }

    const cleared = this.clearLines();
    this.applyScoring(cleared, tspin);
    if (aboveBoard) {
      this.status = "over";
      return;
    }

    this.holdAvailable = true;
    this.spawn(this.next.shift()!);
    this.fillQueue();
  }

  private clearLines(): number {
    const remaining = this.board.filter((row) => row.some((cell) => cell === null));
    const cleared = BOARD_HEIGHT - remaining.length;
    this.board = [
      ...Array.from({ length: cleared }, () => Array<Cell>(BOARD_WIDTH).fill(null)),
      ...remaining,
    ];
    return cleared;
  }

  private detectTSpin(): "none" | "mini" | "full" {
    if (this.active.type !== "T" || !this.lastActionWasRotation) return "none";
    const centerX = this.active.x + 1;
    const centerY = this.active.y + 1;
    const corners = [
      { x: centerX - 1, y: centerY - 1 },
      { x: centerX + 1, y: centerY - 1 },
      { x: centerX - 1, y: centerY + 1 },
      { x: centerX + 1, y: centerY + 1 },
    ];
    const occupied = corners.map(({ x, y }) =>
      x < 0 || x >= BOARD_WIDTH || y >= BOARD_HEIGHT || (y >= 0 && this.board[y]![x] !== null),
    );
    if (occupied.filter(Boolean).length < 3) return "none";
    const frontIndices = [[0, 1], [1, 3], [2, 3], [0, 2]][this.active.rotation]!;
    const frontFilled = frontIndices.every((index) => occupied[index]);
    return frontFilled || this.lastKickIndex === 4 ? "full" : "mini";
  }

  private applyScoring(cleared: number, tspin: "none" | "mini" | "full"): void {
    const scoringLevel = this.level;
    let base = 0;
    let difficult = false;
    if (tspin === "full") {
      const values = [400, 800, 1200, 1600];
      base = values[cleared] ?? 0;
      this.lastClear = "t-spin";
      difficult = cleared > 0;
    } else if (tspin === "mini") {
      base = cleared === 0 ? 100 : 200;
      this.lastClear = "t-spin-mini";
      difficult = cleared > 0;
    } else {
      const values = [0, 100, 300, 500, 800];
      base = values[cleared] ?? 0;
      this.lastClear = (["none", "single", "double", "triple", "tetris"] as const)[cleared] ?? "none";
      difficult = cleared === 4;
    }

    if (difficult && this.backToBack) base = Math.floor(base * 1.5);
    if (cleared > 0) {
      this.combo += 1;
      if (this.combo > 0) base += 50 * this.combo;
      this.lines += cleared;
      this.level = Math.floor(this.lines / 10) + 1;
      if (difficult) this.backToBack = true;
      else this.backToBack = false;
    } else {
      this.combo = -1;
    }
    this.score += base * scoringLevel;
  }

  private gravityInterval(): number {
    // Guideline gravity curve, converted from frames per cell at 60 Hz.
    const level = Math.min(this.level, 20);
    const secondsPerCell = Math.pow(0.8 - (level - 1) * 0.007, level - 1);
    return Math.max(16.67, secondsPerCell * 1000);
  }

  private fillQueue(): void {
    while (this.next.length < 6) {
      if (this.bag.length === 0) this.bag = this.shuffleBag();
      this.next.push(this.bag.shift()!);
    }
  }

  private shuffleBag(): PieceType[] {
    const bag = [...TYPES];
    for (let i = bag.length - 1; i > 0; i -= 1) {
      const j = Math.floor(this.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j]!, bag[i]!];
    }
    return bag;
  }
}
