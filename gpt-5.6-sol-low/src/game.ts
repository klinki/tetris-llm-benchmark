export const COLS = 10;
export const ROWS = 22;
export const VISIBLE_ROWS = 20;

export type PieceName = "I" | "J" | "L" | "O" | "S" | "T" | "Z";
export type Cell = PieceName | null;
export type Board = Cell[][];
export interface ActivePiece { name: PieceName; rotation: number; x: number; y: number; }

export const COLORS: Record<PieceName, string> = {
  I: "#47e8ff", J: "#5479ff", L: "#ff9e45", O: "#ffe152", S: "#55e88a", T: "#b967ff", Z: "#ff5576"
};

const SHAPES: Record<PieceName, number[][][]> = {
  I: [
    [[0,0],[1,0],[2,0],[3,0]], [[2,-1],[2,0],[2,1],[2,2]], [[0,1],[1,1],[2,1],[3,1]], [[1,-1],[1,0],[1,1],[1,2]]
  ],
  J: [
    [[0,0],[0,1],[1,1],[2,1]], [[1,0],[2,0],[1,1],[1,2]], [[0,1],[1,1],[2,1],[2,2]], [[1,0],[1,1],[0,2],[1,2]]
  ],
  L: [
    [[2,0],[0,1],[1,1],[2,1]], [[1,0],[1,1],[1,2],[2,2]], [[0,1],[1,1],[2,1],[0,2]], [[0,0],[1,0],[1,1],[1,2]]
  ],
  O: [
    [[1,0],[2,0],[1,1],[2,1]], [[1,0],[2,0],[1,1],[2,1]], [[1,0],[2,0],[1,1],[2,1]], [[1,0],[2,0],[1,1],[2,1]]
  ],
  S: [
    [[1,0],[2,0],[0,1],[1,1]], [[1,0],[1,1],[2,1],[2,2]], [[1,1],[2,1],[0,2],[1,2]], [[0,0],[0,1],[1,1],[1,2]]
  ],
  T: [
    [[1,0],[0,1],[1,1],[2,1]], [[1,0],[1,1],[2,1],[1,2]], [[0,1],[1,1],[2,1],[1,2]], [[1,0],[0,1],[1,1],[1,2]]
  ],
  Z: [
    [[0,0],[1,0],[1,1],[2,1]], [[2,0],[1,1],[2,1],[1,2]], [[0,1],[1,1],[1,2],[2,2]], [[1,0],[0,1],[1,1],[0,2]]
  ]
};

const JLSTZ_KICKS: Record<string, number[][]> = {
  "0>1": [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]], "1>0": [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
  "1>2": [[0,0],[1,0],[1,1],[0,-2],[1,-2]], "2>1": [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  "2>3": [[0,0],[1,0],[1,-1],[0,2],[1,2]], "3>2": [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  "3>0": [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]], "0>3": [[0,0],[1,0],[1,-1],[0,2],[1,2]]
};
const I_KICKS: Record<string, number[][]> = {
  "0>1": [[0,0],[-2,0],[1,0],[-2,1],[1,-2]], "1>0": [[0,0],[2,0],[-1,0],[2,-1],[-1,2]],
  "1>2": [[0,0],[-1,0],[2,0],[-1,-2],[2,1]], "2>1": [[0,0],[1,0],[-2,0],[1,2],[-2,-1]],
  "2>3": [[0,0],[2,0],[-1,0],[2,-1],[-1,2]], "3>2": [[0,0],[-2,0],[1,0],[-2,1],[1,-2]],
  "3>0": [[0,0],[1,0],[-2,0],[1,2],[-2,-1]], "0>3": [[0,0],[-1,0],[2,0],[-1,-2],[2,1]]
};

export function emptyBoard(): Board { return Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(null)); }
export function cells(piece: ActivePiece): number[][] { return SHAPES[piece.name][piece.rotation].map(([x,y]) => [x + piece.x, y + piece.y]); }

export class TetrisGame {
  board: Board = emptyBoard();
  active!: ActivePiece;
  next: PieceName[] = [];
  holdPiece: PieceName | null = null;
  canHold = true;
  score = 0;
  lines = 0;
  level = 1;
  gameOver = false;
  paused = false;
  combo = -1;
  backToBack = false;
  lastAction = "READY";
  private bag: PieceName[] = [];
  private rng: () => number;

  constructor(rng: () => number = Math.random) { this.rng = rng; this.fillQueue(); this.spawn(); }

  private shuffledBag(): PieceName[] {
    const bag: PieceName[] = ["I","J","L","O","S","T","Z"];
    for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(this.rng() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; }
    return bag;
  }
  private fillQueue(): void { while (this.next.length < 5) { if (!this.bag.length) this.bag = this.shuffledBag(); this.next.push(this.bag.shift()!); } }
  spawn(name?: PieceName): void {
    if (!name) { name = this.next.shift()!; this.fillQueue(); }
    this.active = { name, rotation: 0, x: 3, y: name === "I" ? 1 : 0 };
    this.canHold = true;
    if (!this.valid(this.active)) { this.gameOver = true; this.lastAction = "GAME OVER"; }
  }
  valid(piece: ActivePiece): boolean { return cells(piece).every(([x,y]) => x >= 0 && x < COLS && y >= 0 && y < ROWS && !this.board[y][x]); }
  move(dx: number, dy: number): boolean {
    if (this.gameOver || this.paused) return false;
    const moved = { ...this.active, x: this.active.x + dx, y: this.active.y + dy };
    if (!this.valid(moved)) return false;
    this.active = moved;
    return true;
  }
  rotate(direction: 1 | -1): boolean {
    if (this.gameOver || this.paused || this.active.name === "O") return false;
    const from = this.active.rotation;
    const to = (from + direction + 4) % 4;
    const table = this.active.name === "I" ? I_KICKS : JLSTZ_KICKS;
    for (const [dx, dy] of table[`${from}>${to}`]) {
      const turned = { ...this.active, rotation: to, x: this.active.x + dx, y: this.active.y - dy };
      if (this.valid(turned)) { this.active = turned; return true; }
    }
    return false;
  }
  ghostY(): number { let y = this.active.y; while (this.valid({ ...this.active, y: y + 1 })) y++; return y; }
  hardDrop(): void {
    if (this.gameOver || this.paused) return;
    const distance = this.ghostY() - this.active.y;
    this.active.y += distance;
    this.score += distance * 2;
    this.lock();
  }
  hold(): void {
    if (!this.canHold || this.gameOver || this.paused) return;
    const current = this.active.name;
    if (this.holdPiece) { const swap = this.holdPiece; this.holdPiece = current; this.spawn(swap); }
    else { this.holdPiece = current; this.spawn(); }
    this.canHold = false;
    this.lastAction = "HOLD";
  }
  lock(): void {
    cells(this.active).forEach(([x,y]) => { if (y >= 0) this.board[y][x] = this.active.name; });
    const cleared = this.clearLines();
    this.applyScore(cleared);
    this.spawn();
  }
  private clearLines(): number {
    let cleared = 0;
    this.board = this.board.filter(row => { if (row.every(Boolean)) { cleared++; return false; } return true; });
    while (this.board.length < ROWS) this.board.unshift(Array<Cell>(COLS).fill(null));
    return cleared;
  }
  private applyScore(count: number): void {
    const base = [0, 100, 300, 500, 800][count] * this.level;
    const difficult = count === 4;
    this.score += difficult && this.backToBack ? Math.floor(base * 1.5) : base;
    if (count) { this.combo++; if (this.combo > 0) this.score += 50 * this.combo * this.level; this.lines += count; this.level = Math.floor(this.lines / 10) + 1; this.lastAction = count === 4 ? "TETRIS" : `${count} LINE${count > 1 ? "S" : ""}`; }
    else { this.combo = -1; this.lastAction = "LOCK"; }
    this.backToBack = difficult ? true : (count ? false : this.backToBack);
  }
  gravityMs(): number { return Math.max(45, 1000 * Math.pow(0.8 - (this.level - 1) * 0.007, this.level - 1)); }
  restart(): void { this.board = emptyBoard(); this.next = []; this.bag = []; this.holdPiece = null; this.score = 0; this.lines = 0; this.level = 1; this.gameOver = false; this.paused = false; this.combo = -1; this.backToBack = false; this.lastAction = "READY"; this.fillQueue(); this.spawn(); }
}
