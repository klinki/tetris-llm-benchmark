export const WIDTH = 10;
export const HEIGHT = 22;
export const HIDDEN_ROWS = 2;

export type PieceName = "I" | "O" | "T" | "S" | "Z" | "J" | "L";
export type Cell = PieceName | null;
export type Piece = { type: PieceName; x: number; y: number; rotation: number };

type Point = readonly [number, number];
type RotationSet = readonly (readonly Point[])[];

export const COLORS: Record<PieceName, string> = {
  I: "#28d7f2", O: "#ffc72c", T: "#a970ff", S: "#55d66b",
  Z: "#ff5c78", J: "#4e8cff", L: "#ff9f43"
};

const SHAPES: Record<PieceName, RotationSet> = {
  I: [
    [[0, 1], [1, 1], [2, 1], [3, 1]], [[2, 0], [2, 1], [2, 2], [2, 3]],
    [[0, 2], [1, 2], [2, 2], [3, 2]], [[1, 0], [1, 1], [1, 2], [1, 3]]
  ],
  O: [
    [[1, 0], [2, 0], [1, 1], [2, 1]], [[1, 0], [2, 0], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [2, 1]], [[1, 0], [2, 0], [1, 1], [2, 1]]
  ],
  T: [
    [[1, 0], [0, 1], [1, 1], [2, 1]], [[1, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [1, 2]], [[1, 0], [0, 1], [1, 1], [1, 2]]
  ],
  S: [
    [[1, 0], [2, 0], [0, 1], [1, 1]], [[1, 0], [1, 1], [2, 1], [2, 2]],
    [[1, 1], [2, 1], [0, 2], [1, 2]], [[0, 0], [0, 1], [1, 1], [1, 2]]
  ],
  Z: [
    [[0, 0], [1, 0], [1, 1], [2, 1]], [[2, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [1, 2], [2, 2]], [[1, 0], [0, 1], [1, 1], [0, 2]]
  ],
  J: [
    [[0, 0], [0, 1], [1, 1], [2, 1]], [[1, 0], [2, 0], [1, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [2, 2]], [[1, 0], [1, 1], [0, 2], [1, 2]]
  ],
  L: [
    [[2, 0], [0, 1], [1, 1], [2, 1]], [[1, 0], [1, 1], [1, 2], [2, 2]],
    [[0, 1], [1, 1], [2, 1], [0, 2]], [[0, 0], [1, 0], [1, 1], [1, 2]]
  ]
};

// SRS tables use upward-positive Y; the board uses downward-positive Y.
const JLSTZ_KICKS: Record<string, Point[]> = {
  "0>1": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "1>0": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "1>2": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "2>1": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "2>3": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "3>2": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "3>0": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "0>3": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]]
};
const I_KICKS: Record<string, Point[]> = {
  "0>1": [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  "1>0": [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  "1>2": [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
  "2>1": [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  "2>3": [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  "3>2": [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  "3>0": [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  "0>3": [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]]
};

export class TetrisGame {
  board: Cell[][] = [];
  active!: Piece;
  queue: PieceName[] = [];
  held: PieceName | null = null;
  canHold = true;
  score = 0;
  lines = 0;
  level = 1;
  combo = -1;
  backToBack = false;
  gameOver = false;
  private bag: PieceName[] = [];
  private random: () => number;

  constructor(random = Math.random) { this.random = random; this.restart(); }

  restart(): void {
    this.board = Array.from({ length: HEIGHT }, () => Array<Cell>(WIDTH).fill(null));
    this.queue = []; this.bag = []; this.held = null; this.canHold = true;
    this.score = 0; this.lines = 0; this.level = 1; this.combo = -1; this.backToBack = false; this.gameOver = false;
    this.fillQueue(); this.spawn();
  }

  private fillQueue(): void { while (this.queue.length < 6) this.queue.push(this.nextFromBag()); }
  private nextFromBag(): PieceName {
    if (!this.bag.length) {
      this.bag = ["I", "O", "T", "S", "Z", "J", "L"];
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1)); [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
      }
    }
    return this.bag.pop()!;
  }

  private spawn(type?: PieceName): void {
    const next = type ?? this.queue.shift()!;
    this.fillQueue();
    this.active = { type: next, x: 3, y: 0, rotation: 0 };
    if (!this.fits(this.active)) this.gameOver = true;
  }

  cells(piece = this.active): Point[] { return SHAPES[piece.type][piece.rotation].map(([x, y]) => [piece.x + x, piece.y + y]); }
  fits(piece: Piece): boolean {
    return this.cells(piece).every(([x, y]) => x >= 0 && x < WIDTH && y < HEIGHT && (y < 0 || !this.board[y][x]));
  }
  move(dx: number, dy = 0): boolean {
    if (this.gameOver) return false;
    const moved = { ...this.active, x: this.active.x + dx, y: this.active.y + dy };
    if (!this.fits(moved)) return false;
    this.active = moved; return true;
  }
  rotate(direction: 1 | -1): boolean {
    if (this.gameOver || this.active.type === "O") return false;
    const from = this.active.rotation, to = (from + direction + 4) % 4;
    const table = this.active.type === "I" ? I_KICKS : JLSTZ_KICKS;
    for (const [dx, upward] of table[`${from}>${to}`]) {
      const candidate = { ...this.active, rotation: to, x: this.active.x + dx, y: this.active.y - upward };
      if (this.fits(candidate)) { this.active = candidate; return true; }
    }
    return false;
  }
  softDrop(): boolean { const moved = this.move(0, 1); if (moved) this.score += 1; return moved; }
  hardDrop(): number {
    let distance = 0; while (this.move(0, 1)) distance++;
    this.score += distance * 2; this.lock(); return distance;
  }
  hold(): boolean {
    if (this.gameOver || !this.canHold) return false;
    const outgoing = this.active.type; this.canHold = false;
    if (this.held) { const incoming = this.held; this.held = outgoing; this.spawn(incoming); }
    else { this.held = outgoing; this.spawn(); }
    return true;
  }
  ghostY(): number { let y = this.active.y; while (this.fits({ ...this.active, y: y + 1 })) y++; return y; }
  lock(): number {
    if (this.gameOver) return 0;
    for (const [x, y] of this.cells()) if (y >= 0) this.board[y][x] = this.active.type;
    const remaining = this.board.filter(row => row.some(cell => !cell));
    const cleared = HEIGHT - remaining.length;
    while (remaining.length < HEIGHT) remaining.unshift(Array<Cell>(WIDTH).fill(null));
    this.board = remaining;
    if (cleared) {
      this.combo++;
      const difficult = cleared === 4;
      const base = [0, 100, 300, 500, 800][cleared] * this.level;
      this.score += this.backToBack && difficult ? Math.floor(base * 1.5) : base;
      if (this.combo > 0) this.score += 50 * this.combo * this.level;
      this.backToBack = difficult;
      this.lines += cleared; this.level = Math.floor(this.lines / 10) + 1;
    } else { this.combo = -1; }
    this.canHold = true; this.spawn(); return cleared;
  }
  gravityMs(): number { return Math.max(50, 1000 * Math.pow(0.8 - (this.level - 1) * 0.007, this.level - 1)); }
}
