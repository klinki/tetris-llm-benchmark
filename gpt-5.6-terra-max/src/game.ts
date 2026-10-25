export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 22;
export const HIDDEN_ROWS = 2;
export const VISIBLE_ROWS = BOARD_HEIGHT - HIDDEN_ROWS;
export const LOCK_DELAY_MS = 500;

export type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";
export type BoardCell = PieceType | null;
export type GamePhase = "playing" | "gameover";
export type GameCommand =
  | "left"
  | "right"
  | "softDrop"
  | "hardDrop"
  | "rotateClockwise"
  | "rotateCounterClockwise"
  | "hold"
  | "restart";

export interface Piece {
  type: PieceType;
  rotation: number;
  x: number;
  y: number;
}

export interface Cell {
  x: number;
  y: number;
  type: PieceType;
}

type Kick = [number, number];
type LastAction = "move" | "rotate" | null;

const PIECE_TYPES: PieceType[] = ["I", "O", "T", "S", "Z", "J", "L"];

export const PIECE_COLORS: Record<PieceType, string> = {
  I: "#3de4ef",
  O: "#ffd34e",
  T: "#a879ff",
  S: "#62e77e",
  Z: "#ff6072",
  J: "#4d82ff",
  L: "#ffad4f"
};

const SHAPES: Record<PieceType, Array<Array<[number, number]>>> = {
  I: [
    [[0, 1], [1, 1], [2, 1], [3, 1]],
    [[2, 0], [2, 1], [2, 2], [2, 3]],
    [[0, 2], [1, 2], [2, 2], [3, 2]],
    [[1, 0], [1, 1], [1, 2], [1, 3]]
  ],
  O: [
    [[1, 0], [2, 0], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [2, 1]]
  ],
  T: [
    [[1, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [1, 2]],
    [[1, 0], [0, 1], [1, 1], [1, 2]]
  ],
  S: [
    [[1, 0], [2, 0], [0, 1], [1, 1]],
    [[1, 0], [1, 1], [2, 1], [2, 2]],
    [[1, 1], [2, 1], [0, 2], [1, 2]],
    [[0, 0], [0, 1], [1, 1], [1, 2]]
  ],
  Z: [
    [[0, 0], [1, 0], [1, 1], [2, 1]],
    [[2, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [1, 2], [2, 2]],
    [[1, 0], [0, 1], [1, 1], [0, 2]]
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
  ]
};

const NORMAL_KICKS: Record<string, Kick[]> = {
  "0>1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "1>0": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "1>2": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "2>1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "2>3": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "3>2": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "3>0": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "0>3": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]]
};

const I_KICKS: Record<string, Kick[]> = {
  "0>1": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  "1>0": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  "1>2": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  "2>1": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  "2>3": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  "3>2": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  "3>0": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  "0>3": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]]
};

function createBoard(): BoardCell[][] {
  return Array.from({ length: BOARD_HEIGHT }, () =>
    Array<BoardCell>(BOARD_WIDTH).fill(null)
  );
}

function rotationKey(from: number, to: number): string {
  return String(from) + ">" + String(to);
}

function gravityForLevel(level: number): number {
  const seconds = Math.pow(0.8 - (level - 1) * 0.007, level - 1);
  return Math.max(16, seconds * 1000);
}

export function getPieceCells(piece: Piece): Cell[] {
  const rotation = ((piece.rotation % 4) + 4) % 4;
  return SHAPES[piece.type][rotation].map(([x, y]) => ({
    x: piece.x + x,
    y: piece.y + y,
    type: piece.type
  }));
}

export class TetrisGame {
  public board: BoardCell[][] = createBoard();
  public active: Piece | null = null;
  public queue: PieceType[] = [];
  public hold: PieceType | null = null;
  public holdUsed = false;
  public score = 0;
  public lines = 0;
  public level = 1;
  public combo = -1;
  public backToBack = false;
  public phase: GamePhase = "playing";
  public lastClear = "READY";
  public lastScore = 0;

  private gravityElapsed = 0;
  private lockElapsed = 0;
  private lockResets = 0;
  private lastAction: LastAction = null;
  private readonly random: () => number;

  public constructor(random: () => number = Math.random) {
    this.random = random;
    this.restart();
  }

  public restart(): void {
    this.board = createBoard();
    this.active = null;
    this.queue = [];
    this.hold = null;
    this.holdUsed = false;
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.combo = -1;
    this.backToBack = false;
    this.phase = "playing";
    this.lastClear = "READY";
    this.lastScore = 0;
    this.gravityElapsed = 0;
    this.lockElapsed = 0;
    this.lockResets = 0;
    this.lastAction = null;
    this.fillQueue(5);
    this.spawnNext();
  }

  public handle(command: GameCommand): boolean {
    if (command === "restart") {
      if (this.phase === "gameover") {
        this.restart();
        return true;
      }
      return false;
    }

    if (this.phase !== "playing" || !this.active) {
      return false;
    }

    switch (command) {
      case "left":
        return this.playerMove(-1, 0);
      case "right":
        return this.playerMove(1, 0);
      case "softDrop":
        return this.softDrop();
      case "hardDrop":
        this.hardDrop();
        return true;
      case "rotateClockwise":
        return this.rotate(1);
      case "rotateCounterClockwise":
        return this.rotate(-1);
      case "hold":
        return this.holdPiece();
    }
  }

  public tick(deltaMs: number): void {
    if (this.phase !== "playing" || !this.active) {
      return;
    }

    const elapsed = Math.max(0, Math.min(deltaMs, 1000));
    this.gravityElapsed += elapsed;
    const interval = gravityForLevel(this.level);

    while (this.gravityElapsed >= interval && this.active) {
      this.gravityElapsed -= interval;
      if (!this.moveInternal(0, 1)) {
        this.gravityElapsed = 0;
        break;
      }
    }

    if (!this.active) {
      return;
    }

    if (this.isGrounded()) {
      this.lockElapsed += elapsed;
      if (this.lockElapsed >= LOCK_DELAY_MS) {
        this.lockPiece();
      }
    } else {
      this.lockElapsed = 0;
    }
  }

  public getGhostPiece(): Piece | null {
    if (!this.active) {
      return null;
    }

    const ghost = { ...this.active };
    while (this.isValid({ ...ghost, y: ghost.y + 1 })) {
      ghost.y += 1;
    }
    return ghost;
  }

  public isValid(piece: Piece): boolean {
    return getPieceCells(piece).every((cell) => {
      if (cell.x < 0 || cell.x >= BOARD_WIDTH || cell.y >= BOARD_HEIGHT) {
        return false;
      }
      return cell.y < 0 || this.board[cell.y][cell.x] === null;
    });
  }

  private fillQueue(minimum: number): void {
    while (this.queue.length < minimum) {
      const bag = [...PIECE_TYPES];
      for (let index = bag.length - 1; index > 0; index -= 1) {
        const safeRandom = Math.max(0, Math.min(0.999999, this.random()));
        const selected = Math.floor(safeRandom * (index + 1));
        [bag[index], bag[selected]] = [bag[selected], bag[index]];
      }
      this.queue.push(...bag);
    }
  }

  private spawnNext(): void {
    this.fillQueue(1);
    const type = this.queue.shift();
    if (!type) {
      return;
    }
    this.fillQueue(5);
    this.spawn(type);
  }

  private spawn(type: PieceType): void {
    const candidate: Piece = { type, rotation: 0, x: 3, y: 0 };
    this.gravityElapsed = 0;
    this.lockElapsed = 0;
    this.lockResets = 0;
    this.lastAction = null;

    if (!this.isValid(candidate)) {
      this.active = null;
      this.phase = "gameover";
      this.lastClear = "TOP OUT";
      this.lastScore = 0;
      return;
    }

    this.active = candidate;
  }

  private playerMove(dx: number, dy: number): boolean {
    if (!this.active) {
      return false;
    }

    const groundedBefore = this.isGrounded();
    if (!this.moveInternal(dx, dy)) {
      return false;
    }

    this.lastAction = "move";
    this.resetLockAfterAction(groundedBefore);
    return true;
  }

  private moveInternal(dx: number, dy: number): boolean {
    if (!this.active) {
      return false;
    }

    const candidate = {
      ...this.active,
      x: this.active.x + dx,
      y: this.active.y + dy
    };

    if (!this.isValid(candidate)) {
      return false;
    }

    this.active = candidate;
    return true;
  }

  private softDrop(): boolean {
    const moved = this.playerMove(0, 1);
    if (moved) {
      this.score += 1;
      this.lastScore = 1;
    }
    return moved;
  }

  private hardDrop(): void {
    if (!this.active) {
      return;
    }

    let distance = 0;
    while (this.moveInternal(0, 1)) {
      distance += 1;
    }

    if (distance > 0) {
      this.score += distance * 2;
      this.lastScore = distance * 2;
      this.lastAction = "move";
    }
    this.lockPiece();
  }

  private rotate(direction: 1 | -1): boolean {
    if (!this.active) {
      return false;
    }

    const groundedBefore = this.isGrounded();
    const from = this.active.rotation;
    const to = (from + direction + 4) % 4;
    const kicks = this.active.type === "I"
      ? I_KICKS[rotationKey(from, to)]
      : NORMAL_KICKS[rotationKey(from, to)];

    for (const [offsetX, offsetYUp] of kicks || [[0, 0]]) {
      const candidate = {
        ...this.active,
        rotation: to,
        x: this.active.x + offsetX,
        y: this.active.y - offsetYUp
      };
      if (this.isValid(candidate)) {
        this.active = candidate;
        this.lastAction = "rotate";
        this.resetLockAfterAction(groundedBefore);
        return true;
      }
    }
    return false;
  }

  private holdPiece(): boolean {
    if (!this.active || this.holdUsed) {
      return false;
    }

    const outgoing = this.active.type;
    this.holdUsed = true;
    if (this.hold === null) {
      this.hold = outgoing;
      this.spawnNext();
    } else {
      const incoming = this.hold;
      this.hold = outgoing;
      this.spawn(incoming);
    }
    return true;
  }

  private resetLockAfterAction(groundedBefore: boolean): void {
    if (!this.active) {
      return;
    }

    if (!this.isGrounded()) {
      this.lockElapsed = 0;
      return;
    }

    if (groundedBefore && this.lockResets < 15) {
      this.lockElapsed = 0;
      this.lockResets += 1;
    }
  }

  private isGrounded(): boolean {
    const active = this.active;
    return active !== null && !this.isValid({
      ...active,
      y: active.y + 1
    });
  }

  private lockPiece(): void {
    if (!this.active || this.phase !== "playing") {
      return;
    }

    const piece = this.active;
    const tSpin = this.isTSpin(piece);
    const cells = getPieceCells(piece);
    if (cells.some((cell) => cell.y < 0)) {
      this.active = null;
      this.phase = "gameover";
      this.lastClear = "TOP OUT";
      return;
    }

    for (const cell of cells) {
      this.board[cell.y][cell.x] = cell.type;
    }

    this.active = null;
    const cleared = this.clearLines();
    this.applyScoring(cleared, tSpin);
    this.holdUsed = false;
    this.gravityElapsed = 0;
    this.lockElapsed = 0;
    this.lockResets = 0;
    this.spawnNext();
  }

  private isTSpin(piece: Piece): boolean {
    if (piece.type !== "T" || this.lastAction !== "rotate") {
      return false;
    }

    const pivotX = piece.x + 1;
    const pivotY = piece.y + 1;
    const corners = [
      [pivotX - 1, pivotY - 1],
      [pivotX + 1, pivotY - 1],
      [pivotX - 1, pivotY + 1],
      [pivotX + 1, pivotY + 1]
    ];

    const occupiedCorners = corners.filter(([x, y]) => {
      if (x < 0 || x >= BOARD_WIDTH || y >= BOARD_HEIGHT) {
        return true;
      }
      return y >= 0 && this.board[y][x] !== null;
    });
    return occupiedCorners.length >= 3;
  }

  private clearLines(): number {
    const remaining = this.board.filter((row) => row.some((cell) => cell === null));
    const cleared = BOARD_HEIGHT - remaining.length;
    if (cleared > 0) {
      this.board = [
        ...Array.from({ length: cleared }, () => Array<BoardCell>(BOARD_WIDTH).fill(null)),
        ...remaining
      ];
    }
    return cleared;
  }

  private applyScoring(cleared: number, tSpin: boolean): void {
    const multiplier = this.level;
    let points = 0;

    if (tSpin) {
      points = [400, 800, 1200, 1600][cleared] || 0;
      this.lastClear = ["T-SPIN", "T-SPIN SINGLE", "T-SPIN DOUBLE", "T-SPIN TRIPLE"][cleared] || "T-SPIN";
    } else {
      points = [0, 100, 300, 500, 800][cleared] || 0;
      this.lastClear = ["LOCKED", "SINGLE", "DOUBLE", "TRIPLE", "TETRIS"][cleared] || "LOCKED";
    }

    const difficult = (tSpin && cleared > 0) || cleared === 4;
    if (difficult && this.backToBack) {
      points += Math.floor(points / 2);
    }
    if (difficult) {
      this.backToBack = true;
    } else if (cleared > 0) {
      this.backToBack = false;
    }

    if (cleared > 0) {
      this.combo += 1;
      if (this.combo > 0) {
        points += this.combo * 50;
      }
    } else {
      this.combo = -1;
    }

    this.lastScore = points * multiplier;
    this.score += this.lastScore;
    this.lines += cleared;
    this.level = Math.floor(this.lines / 10) + 1;
  }
}
