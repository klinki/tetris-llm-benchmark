export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
export const PIECES = ["I", "J", "L", "O", "S", "T", "Z"] as const;
export type PieceType = (typeof PIECES)[number];
export type Cell = PieceType | null;
export type Board = Cell[][];
export type Rotation = 0 | 1 | 2 | 3;

export interface ActivePiece {
  type: PieceType;
  rotation: Rotation;
  x: number;
  y: number;
}

export interface StepResult {
  locked: boolean;
  cleared: number;
  gameOver: boolean;
  event: string;
}

const SHAPES: Record<PieceType, readonly (readonly [number, number])[]> = {
  I: [[0, 1], [1, 1], [2, 1], [3, 1]],
  J: [[0, 0], [0, 1], [1, 1], [2, 1]],
  L: [[2, 0], [0, 1], [1, 1], [2, 1]],
  O: [[1, 0], [2, 0], [1, 1], [2, 1]],
  S: [[1, 0], [2, 0], [0, 1], [1, 1]],
  T: [[1, 0], [0, 1], [1, 1], [2, 1]],
  Z: [[0, 0], [1, 0], [1, 1], [2, 1]],
};

type KickTable = Record<string, readonly (readonly [number, number])[]>;

// SRS y coordinates are inverted here because the browser board grows downward.
const JLSTZ_KICKS: KickTable = {
  "0>1": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "1>0": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "1>2": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "2>1": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "2>3": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "3>2": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "3>0": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "0>3": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
};
const I_KICKS: KickTable = {
  "0>1": [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  "1>0": [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  "1>2": [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
  "2>1": [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  "2>3": [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  "3>2": [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  "3>0": [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  "0>3": [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
};

export function emptyBoard(): Board {
  return Array.from({ length: BOARD_HEIGHT }, () => Array<Cell>(BOARD_WIDTH).fill(null));
}

export function cellsFor(piece: ActivePiece): [number, number][] {
  const size = piece.type === "I" ? 4 : 3;
  return SHAPES[piece.type].map(([startX, startY]) => {
    if (piece.type === "O") return [piece.x + startX, piece.y + startY];
    let x = startX;
    let y = startY;
    for (let count = 0; count < piece.rotation; count += 1) [x, y] = [size - 1 - y, x];
    return [piece.x + x, piece.y + y];
  });
}

export function canPlace(board: Board, piece: ActivePiece): boolean {
  return cellsFor(piece).every(([x, y]) => x >= 0 && x < BOARD_WIDTH && y < BOARD_HEIGHT && (y < 0 || board[y][x] === null));
}

class SevenBag {
  private bag: PieceType[] = [];
  constructor(private readonly random: () => number) {}
  next(): PieceType {
    if (this.bag.length === 0) {
      this.bag = [...PIECES];
      for (let i = this.bag.length - 1; i > 0; i -= 1) {
        const j = Math.floor(this.random() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
      }
    }
    return this.bag.pop()!;
  }
}

export class TetrisGame {
  board: Board = emptyBoard();
  active: ActivePiece | null = null;
  queue: PieceType[] = [];
  hold: PieceType | null = null;
  canHold = true;
  score = 0;
  lines = 0;
  level = 1;
  gameOver = false;
  combo = -1;
  backToBack = false;
  lastAction: "move" | "rotate" | "drop" = "move";
  private readonly randomizer: SevenBag;

  constructor(random: () => number = Math.random) {
    this.randomizer = new SevenBag(random);
    this.reset();
  }

  reset(): void {
    this.board = emptyBoard();
    this.queue = [];
    this.hold = null;
    this.canHold = true;
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.gameOver = false;
    this.combo = -1;
    this.backToBack = false;
    this.lastAction = "move";
    this.fillQueue();
    this.spawn();
  }

  gravityMs(): number {
    const speed = 1000 * Math.pow(0.8 - (this.level - 1) * 0.007, this.level - 1);
    return Math.max(50, speed);
  }

  move(dx: number, dy: number, scoring = false): boolean {
    if (!this.active || this.gameOver) return false;
    const candidate = { ...this.active, x: this.active.x + dx, y: this.active.y + dy };
    if (!canPlace(this.board, candidate)) return false;
    this.active = candidate;
    this.lastAction = "move";
    if (scoring && dy > 0) this.score += dy;
    return true;
  }

  rotate(direction: 1 | -1): boolean {
    if (!this.active || this.gameOver || this.active.type === "O") return false;
    const from = this.active.rotation;
    const to = ((from + direction + 4) % 4) as Rotation;
    const table = this.active.type === "I" ? I_KICKS : JLSTZ_KICKS;
    for (const [dx, dy] of table[`${from}>${to}`]) {
      const candidate = { ...this.active, rotation: to, x: this.active.x + dx, y: this.active.y + dy };
      if (canPlace(this.board, candidate)) {
        this.active = candidate;
        this.lastAction = "rotate";
        return true;
      }
    }
    return false;
  }

  hardDrop(): StepResult {
    if (!this.active || this.gameOver) return { locked: false, cleared: 0, gameOver: this.gameOver, event: "" };
    let distance = 0;
    while (this.move(0, 1)) distance += 1;
    this.score += distance * 2;
    this.lastAction = "drop";
    return this.lock();
  }

  tickGravity(): StepResult {
    if (this.move(0, 1)) return { locked: false, cleared: 0, gameOver: false, event: "" };
    return this.lock();
  }

  holdPiece(): boolean {
    if (!this.active || !this.canHold || this.gameOver) return false;
    const current = this.active.type;
    if (this.hold === null) {
      this.hold = current;
      this.active = null;
      this.spawn();
    } else {
      const swap = this.hold;
      this.hold = current;
      this.spawn(swap);
    }
    this.canHold = false;
    return true;
  }

  private fillQueue(): void {
    while (this.queue.length < 7) this.queue.push(this.randomizer.next());
  }

  private spawn(forced?: PieceType): void {
    const type = forced ?? this.queue.shift()!;
    this.fillQueue();
    const piece: ActivePiece = { type, rotation: 0, x: 3, y: 0 };
    if (!canPlace(this.board, piece)) {
      this.active = null;
      this.gameOver = true;
      return;
    }
    this.active = piece;
    this.lastAction = "move";
  }

  private lock(): StepResult {
    if (!this.active) return { locked: false, cleared: 0, gameOver: this.gameOver, event: "" };
    const piece = this.active;
    const tSpin = this.isTSpin(piece);
    for (const [x, y] of cellsFor(piece)) if (y >= 0 && y < BOARD_HEIGHT) this.board[y][x] = piece.type;
    this.active = null;
    const cleared = this.clearLines();
    const event = this.scoreLock(cleared, tSpin);
    this.canHold = true;
    this.spawn();
    return { locked: true, cleared, gameOver: this.gameOver, event };
  }

  private clearLines(): number {
    const remaining = this.board.filter((row) => row.some((cell) => cell === null));
    const cleared = BOARD_HEIGHT - remaining.length;
    while (remaining.length < BOARD_HEIGHT) remaining.unshift(Array<Cell>(BOARD_WIDTH).fill(null));
    this.board = remaining;
    return cleared;
  }

  private isTSpin(piece: ActivePiece): boolean {
    if (piece.type !== "T" || this.lastAction !== "rotate") return false;
    const centerX = piece.x + 1;
    const centerY = piece.y + 1;
    const corners = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
    return corners.filter(([dx, dy]) => {
      const x = centerX + dx;
      const y = centerY + dy;
      return x < 0 || x >= BOARD_WIDTH || y >= BOARD_HEIGHT || (y >= 0 && this.board[y][x] !== null);
    }).length >= 3;
  }

  private scoreLock(cleared: number, tSpin: boolean): string {
    const level = this.level;
    let base = 0;
    let label = "";
    const difficult = tSpin || cleared === 4;
    if (tSpin) {
      base = [400, 800, 1200, 1600][cleared] ?? 0;
      label = `T-SPIN${cleared ? ` ${["", "SINGLE", "DOUBLE", "TRIPLE"][cleared]}` : ""}`;
    } else {
      base = [0, 100, 300, 500, 800][cleared] ?? 0;
      label = ["", "SINGLE", "DOUBLE", "TRIPLE", "TETRIS"][cleared] ?? "";
    }
    if (base > 0 && difficult && this.backToBack) base = Math.floor(base * 1.5);
    if (cleared > 0) {
      this.combo += 1;
      if (this.combo > 0) this.score += 50 * this.combo * level;
      this.backToBack = difficult;
    } else {
      this.combo = -1;
      if (!difficult) this.backToBack = false;
    }
    this.score += base * level;
    this.lines += cleared;
    this.level = Math.floor(this.lines / 10) + 1;
    if (this.combo > 0) label += ` · COMBO ${this.combo}`;
    return label;
  }
}
