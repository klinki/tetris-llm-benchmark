export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
export const LOCK_DELAY_MS = 500;
export const MAX_LOCK_RESETS = 15;

export const PIECE_KINDS = ["I", "J", "L", "O", "S", "T", "Z"] as const;
export type PieceKind = (typeof PIECE_KINDS)[number];
export type Rotation = 0 | 1 | 2 | 3;
export type Cell = PieceKind | null;
export type Board = Cell[][];
export type Point = readonly [number, number];

export interface ActivePiece {
  kind: PieceKind;
  x: number;
  y: number;
  rotation: Rotation;
}

export interface GameEvent {
  id: number;
  label: string;
  lines: number;
}

export interface GameSnapshot {
  board: Board;
  active: ActivePiece | null;
  ghostY: number | null;
  hold: PieceKind | null;
  holdUsed: boolean;
  next: PieceKind[];
  score: number;
  lines: number;
  level: number;
  combo: number;
  backToBack: boolean;
  gameOver: boolean;
  paused: boolean;
  event: GameEvent;
}

export interface GameOptions {
  rng?: () => number;
  initialBoard?: Board;
  sequence?: PieceKind[];
}

export const PIECE_COLORS: Record<PieceKind, string> = {
  I: "#35d9ff",
  J: "#5271ff",
  L: "#ff9f35",
  O: "#ffd93d",
  S: "#53e084",
  T: "#bd6cff",
  Z: "#ff5577"
};

const SHAPES: Record<PieceKind, readonly (readonly Point[])[]> = {
  I: [
    [[0, 1], [1, 1], [2, 1], [3, 1]],
    [[2, 0], [2, 1], [2, 2], [2, 3]],
    [[0, 2], [1, 2], [2, 2], [3, 2]],
    [[1, 0], [1, 1], [1, 2], [1, 3]]
  ],
  J: [
    [[0, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [2, 2]],
    [[1, 0], [1, 1], [0, 2], [1, 2]]
  ],
  L: [
    [[2, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [1, 2], [2, 2]],
    [[0, 1], [1, 1], [2, 1], [0, 2]],
    [[0, 0], [1, 0], [1, 1], [1, 2]]
  ],
  O: [
    [[1, 0], [2, 0], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [2, 1]]
  ],
  S: [
    [[1, 0], [2, 0], [0, 1], [1, 1]],
    [[1, 0], [1, 1], [2, 1], [2, 2]],
    [[1, 1], [2, 1], [0, 2], [1, 2]],
    [[0, 0], [0, 1], [1, 1], [1, 2]]
  ],
  T: [
    [[1, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [1, 2]],
    [[1, 0], [0, 1], [1, 1], [1, 2]]
  ],
  Z: [
    [[0, 0], [1, 0], [1, 1], [2, 1]],
    [[2, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [1, 2], [2, 2]],
    [[1, 0], [0, 1], [1, 1], [0, 2]]
  ]
};

type KickTable = Record<string, readonly Point[]>;

const JLSTZ_KICKS: KickTable = {
  "0>1": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "1>0": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "1>2": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "2>1": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "2>3": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "3>2": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "3>0": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "0>3": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]]
};

const I_KICKS: KickTable = {
  "0>1": [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  "1>0": [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  "1>2": [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
  "2>1": [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  "2>3": [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  "3>2": [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  "3>0": [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  "0>3": [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]]
};

export function emptyBoard(): Board {
  return Array.from({ length: BOARD_HEIGHT }, () => Array<Cell>(BOARD_WIDTH).fill(null));
}

export function getPieceCells(piece: ActivePiece): Point[] {
  const shape = SHAPES[piece.kind][piece.rotation]!;
  return shape.map(([x, y]) => [piece.x + x, piece.y + y] as const);
}

export function createSevenBag(rng: () => number = Math.random): PieceKind[] {
  const bag = [...PIECE_KINDS];
  for (let index = bag.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [bag[index], bag[swapIndex]] = [bag[swapIndex]!, bag[index]!];
  }
  return bag;
}

export function gravityInterval(level: number): number {
  const base = Math.max(0.05, 0.8 - (level - 1) * 0.007);
  return Math.max(20, 1000 * Math.pow(base, level - 1));
}

function cloneBoard(board: Board): Board {
  if (board.length !== BOARD_HEIGHT || board.some((row) => row.length !== BOARD_WIDTH)) {
    throw new Error(`Board must be ${BOARD_WIDTH}x${BOARD_HEIGHT}.`);
  }
  return board.map((row) => [...row]);
}

function spawnPiece(kind: PieceKind): ActivePiece {
  return { kind, x: 3, y: -1, rotation: 0 };
}

export class TetrisGame {
  private board: Board;
  private active: ActivePiece | null = null;
  private queue: PieceKind[] = [];
  private preset: PieceKind[];
  private rng: () => number;
  private gravityElapsed = 0;
  private lockElapsed = 0;
  private lockResets = 0;
  private holdPiece: PieceKind | null = null;
  private holdLocked = false;
  private lastMoveWasRotation = false;
  private eventId = 0;

  score = 0;
  lines = 0;
  level = 1;
  combo = -1;
  backToBack = false;
  gameOver = false;
  paused = false;
  event: GameEvent = { id: 0, label: "READY", lines: 0 };

  constructor(options: GameOptions = {}) {
    this.rng = options.rng ?? Math.random;
    this.preset = [...(options.sequence ?? [])];
    this.board = options.initialBoard ? cloneBoard(options.initialBoard) : emptyBoard();
    this.spawnNext();
  }

  snapshot(): GameSnapshot {
    return {
      board: this.board.map((row) => [...row]),
      active: this.active ? { ...this.active } : null,
      ghostY: this.active ? this.getGhostY() : null,
      hold: this.holdPiece,
      holdUsed: this.holdLocked,
      next: this.queue.slice(0, 5),
      score: this.score,
      lines: this.lines,
      level: this.level,
      combo: this.combo,
      backToBack: this.backToBack,
      gameOver: this.gameOver,
      paused: this.paused,
      event: { ...this.event }
    };
  }

  reset(options: Pick<GameOptions, "sequence"> = {}): void {
    this.board = emptyBoard();
    this.active = null;
    this.queue = [];
    this.preset = [...(options.sequence ?? [])];
    this.gravityElapsed = 0;
    this.lockElapsed = 0;
    this.lockResets = 0;
    this.holdPiece = null;
    this.holdLocked = false;
    this.lastMoveWasRotation = false;
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.combo = -1;
    this.backToBack = false;
    this.gameOver = false;
    this.paused = false;
    this.event = { id: ++this.eventId, label: "READY", lines: 0 };
    this.spawnNext();
  }

  tick(elapsedMs: number): void {
    if (this.gameOver || this.paused || !this.active) return;
    const elapsed = Math.max(0, Math.min(elapsedMs, 100));
    this.gravityElapsed += elapsed;
    const interval = gravityInterval(this.level);

    while (this.gravityElapsed >= interval) {
      this.gravityElapsed -= interval;
      if (!this.stepDown(false)) {
        this.gravityElapsed = 0;
        break;
      }
    }

    if (this.isGrounded()) {
      this.lockElapsed += elapsed;
      if (this.lockElapsed >= LOCK_DELAY_MS) this.lockPiece();
    } else {
      this.lockElapsed = 0;
    }
  }

  move(direction: -1 | 1): boolean {
    if (!this.canPlay() || !this.active) return false;
    const wasGrounded = this.isGrounded();
    const candidate = { ...this.active, x: this.active.x + direction };
    if (this.collides(candidate)) return false;
    this.active = candidate;
    this.lastMoveWasRotation = false;
    this.resetLockDelay(wasGrounded);
    return true;
  }

  softDrop(): boolean {
    if (!this.canPlay()) return false;
    const moved = this.stepDown(true);
    if (moved) this.score += 1;
    return moved;
  }

  hardDrop(): number {
    if (!this.canPlay() || !this.active) return 0;
    let distance = 0;
    while (this.stepDown(true)) distance += 1;
    this.score += distance * 2;
    this.lockPiece();
    return distance;
  }

  rotate(direction: 1 | -1): boolean {
    if (!this.canPlay() || !this.active) return false;
    const wasGrounded = this.isGrounded();
    const from = this.active.rotation;
    const to = ((from + direction + 4) % 4) as Rotation;
    const table = this.active.kind === "I" ? I_KICKS : JLSTZ_KICKS;
    const kicks = this.active.kind === "O" ? ([[0, 0]] as const) : (table[`${from}>${to}`] ?? [[0, 0]]);

    for (const [kickX, kickY] of kicks) {
      const candidate: ActivePiece = {
        ...this.active,
        x: this.active.x + kickX,
        y: this.active.y + kickY,
        rotation: to
      };
      if (!this.collides(candidate)) {
        this.active = candidate;
        this.lastMoveWasRotation = true;
        this.resetLockDelay(wasGrounded);
        return true;
      }
    }
    return false;
  }

  hold(): boolean {
    if (!this.canPlay() || !this.active || this.holdLocked) return false;
    const outgoing = this.active.kind;
    if (this.holdPiece) {
      const incoming = this.holdPiece;
      this.holdPiece = outgoing;
      this.active = spawnPiece(incoming);
      this.prepareSpawn();
    } else {
      this.holdPiece = outgoing;
      this.spawnNext(false);
    }
    this.holdLocked = true;
    this.lastMoveWasRotation = false;
    return !this.gameOver;
  }

  togglePause(): boolean {
    if (this.gameOver) return this.paused;
    this.paused = !this.paused;
    return this.paused;
  }

  private canPlay(): boolean {
    return !this.gameOver && !this.paused;
  }

  private fillQueue(): void {
    while (this.queue.length < 7) {
      if (this.preset.length > 0) this.queue.push(this.preset.shift()!);
      else this.queue.push(...createSevenBag(this.rng));
    }
  }

  private spawnNext(resetHold = true): void {
    this.fillQueue();
    this.active = spawnPiece(this.queue.shift()!);
    this.fillQueue();
    if (resetHold) this.holdLocked = false;
    this.prepareSpawn();
  }

  private prepareSpawn(): void {
    this.gravityElapsed = 0;
    this.lockElapsed = 0;
    this.lockResets = 0;
    this.lastMoveWasRotation = false;
    if (this.active && this.collides(this.active)) {
      this.gameOver = true;
      this.active = null;
      this.setEvent("TOP OUT", 0);
    }
  }

  private stepDown(manual: boolean): boolean {
    if (!this.active) return false;
    const candidate = { ...this.active, y: this.active.y + 1 };
    if (this.collides(candidate)) return false;
    this.active = candidate;
    if (!manual) this.lastMoveWasRotation = false;
    return true;
  }

  private resetLockDelay(wasGrounded: boolean): void {
    if (wasGrounded && this.lockResets < MAX_LOCK_RESETS) {
      this.lockElapsed = 0;
      this.lockResets += 1;
    }
  }

  private isGrounded(): boolean {
    if (!this.active) return false;
    return this.collides({ ...this.active, y: this.active.y + 1 });
  }

  private collides(piece: ActivePiece): boolean {
    return getPieceCells(piece).some(([x, y]) =>
      x < 0 || x >= BOARD_WIDTH || y >= BOARD_HEIGHT || (y >= 0 && this.board[y]?.[x] !== null)
    );
  }

  private getGhostY(): number {
    if (!this.active) return 0;
    let ghostY = this.active.y;
    while (!this.collides({ ...this.active, y: ghostY + 1 })) ghostY += 1;
    return ghostY;
  }

  private isTSpin(piece: ActivePiece): boolean {
    if (piece.kind !== "T" || !this.lastMoveWasRotation) return false;
    const pivotX = piece.x + 1;
    const pivotY = piece.y + 1;
    const corners: Point[] = [
      [pivotX - 1, pivotY - 1], [pivotX + 1, pivotY - 1],
      [pivotX - 1, pivotY + 1], [pivotX + 1, pivotY + 1]
    ];
    const occupied = corners.filter(([x, y]) =>
      x < 0 || x >= BOARD_WIDTH || y < 0 || y >= BOARD_HEIGHT || this.board[y]?.[x] !== null
    ).length;
    return occupied >= 3;
  }

  private lockPiece(): void {
    if (!this.active || this.gameOver) return;
    const piece = this.active;
    const cells = getPieceCells(piece);
    if (cells.some(([, y]) => y < 0)) {
      this.gameOver = true;
      this.active = null;
      this.setEvent("TOP OUT", 0);
      return;
    }

    const tSpin = this.isTSpin(piece);
    for (const [x, y] of cells) this.board[y]![x] = piece.kind;
    const cleared = this.clearLines();
    this.applyScoring(cleared, tSpin);
    this.spawnNext();
  }

  private clearLines(): number {
    let cleared = 0;
    for (let row = BOARD_HEIGHT - 1; row >= 0; row -= 1) {
      if (this.board[row]!.every((cell) => cell !== null)) {
        this.board.splice(row, 1);
        this.board.unshift(Array<Cell>(BOARD_WIDTH).fill(null));
        cleared += 1;
        row += 1;
      }
    }
    return cleared;
  }

  private applyScoring(cleared: number, tSpin: boolean): void {
    const normalScores = [0, 100, 300, 500, 800];
    const tSpinScores = [400, 800, 1200, 1600];
    const difficult = cleared === 4 || (tSpin && cleared > 0);
    let base = (tSpin ? tSpinScores[cleared] : normalScores[cleared]) ?? 0;

    if (difficult && this.backToBack) base = Math.floor(base * 1.5);
    if (cleared > 0) {
      this.combo += 1;
      base += 50 * Math.max(0, this.combo);
      if (this.board.every((row) => row.every((cell) => cell === null))) {
        base += [0, 800, 1200, 1800, 2000][cleared] ?? 0;
      }
      if (difficult) this.backToBack = true;
      else this.backToBack = false;
    } else {
      this.combo = -1;
    }

    this.score += base * this.level;
    this.lines += cleared;
    this.level = Math.floor(this.lines / 10) + 1;

    let label = "LOCKED";
    if (tSpin) label = cleared ? `T-SPIN ${this.lineName(cleared)}` : "T-SPIN";
    else if (cleared) label = this.lineName(cleared);
    if (cleared === 4) label = "TETRIS";
    this.setEvent(label, cleared);
  }

  private lineName(lines: number): string {
    return ["", "SINGLE", "DOUBLE", "TRIPLE", "TETRIS"][lines] ?? "CLEAR";
  }

  private setEvent(label: string, lines: number): void {
    this.event = { id: ++this.eventId, label, lines };
  }
}
