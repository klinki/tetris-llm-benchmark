export const COLS = 10;
export const ROWS = 22;
export const HIDDEN_ROWS = 2;

export type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";
export type Cell = PieceType | null;
export interface ActivePiece { type: PieceType; rotation: number; x: number; y: number; }
export interface Score { score: number; lines: number; level: number; }

const SHAPES: Record<PieceType, number[][]> = {
  I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
  O: [[0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
  T: [[0,1,0],[1,1,1],[0,0,0]],
  S: [[0,1,1],[1,1,0],[0,0,0]],
  Z: [[1,1,0],[0,1,1],[0,0,0]],
  J: [[1,0,0],[1,1,1],[0,0,0]],
  L: [[0,0,1],[1,1,1],[0,0,0]]
};
const PIECES: PieceType[] = ["I", "O", "T", "S", "Z", "J", "L"];
const KICKS: Record<string, [number, number][]> = {
  "0>1": [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]], "1>0": [[0,0],[1,0],[1,-1],[0,2],[1,2]],
  "1>2": [[0,0],[1,0],[1,-1],[0,2],[1,2]], "2>1": [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  "2>3": [[0,0],[1,0],[1,1],[0,-2],[1,-2]], "3>2": [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  "3>0": [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]], "0>3": [[0,0],[1,0],[1,1],[0,-2],[1,-2]]
};
const I_KICKS: Record<string, [number, number][]> = {
  "0>1": [[0,0],[-2,0],[1,0],[-2,-1],[1,2]], "1>0": [[0,0],[2,0],[-1,0],[2,1],[-1,-2]],
  "1>2": [[0,0],[-1,0],[2,0],[-1,2],[2,-1]], "2>1": [[0,0],[1,0],[-2,0],[1,-2],[-2,1]],
  "2>3": [[0,0],[2,0],[-1,0],[2,1],[-1,-2]], "3>2": [[0,0],[-2,0],[1,0],[-2,-1],[1,2]],
  "3>0": [[0,0],[1,0],[-2,0],[1,-2],[-2,1]], "0>3": [[0,0],[-1,0],[2,0],[-1,2],[2,-1]]
};

function rotateMatrix(matrix: number[][]): number[][] { return matrix[0]!.map((_, i) => matrix.map(row => row[i]!).reverse()); }
export function cellsFor(piece: ActivePiece): [number, number][] {
  let matrix = SHAPES[piece.type];
  for (let i = 0; i < piece.rotation; i++) matrix = rotateMatrix(matrix);
  const cells: [number, number][] = [];
  matrix.forEach((row, y) => row.forEach((value, x) => { if (value) cells.push([piece.x + x, piece.y + y]); }));
  return cells;
}

export class RandomBag {
  private queue: PieceType[] = [];
  constructor(private random: () => number = Math.random) {}
  next(): PieceType { if (!this.queue.length) this.queue = this.bag(); return this.queue.shift()!; }
  peek(count = 5): PieceType[] { while (this.queue.length < count) this.queue.push(...this.bag()); return this.queue.slice(0, count); }
  private bag(): PieceType[] { const bag = [...PIECES]; for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(this.random() * (i + 1)); [bag[i], bag[j]] = [bag[j]!, bag[i]!]; } return bag; }
}

export class TetrisGame {
  board: Cell[][] = [];
  active!: ActivePiece;
  hold: PieceType | null = null;
  canHold = true;
  next: PieceType[] = [];
  score: Score = { score: 0, lines: 0, level: 1 };
  over = false;
  paused = false;
  dropAccumulator = 0;
  lockAccumulator = 0;
  private bag: RandomBag;
  private justResetHold = false;
  constructor(random?: () => number) { this.bag = new RandomBag(random); this.reset(); }
  reset(): void { this.board = Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(null)); this.hold = null; this.score = { score: 0, lines: 0, level: 1 }; this.over = false; this.paused = false; this.canHold = true; this.next = []; this.spawn(); }
  spawn(type = this.bag.next()): void { this.next = this.bag.peek(5); this.active = { type, rotation: 0, x: type === "I" ? 3 : 3, y: 0 }; this.canHold = !this.justResetHold; this.justResetHold = false; if (this.collides(this.active)) this.over = true; }
  collides(piece: ActivePiece): boolean { return cellsFor(piece).some(([x,y]) => x < 0 || x >= COLS || y >= ROWS || (y >= 0 && this.board[y]![x])); }
  move(dx: number): boolean { if (this.over || this.paused) return false; const candidate = { ...this.active, x: this.active.x + dx }; if (this.collides(candidate)) return false; this.active = candidate; this.lockAccumulator = 0; return true; }
  softDrop(): boolean { if (this.over || this.paused) return false; const candidate = { ...this.active, y: this.active.y + 1 }; if (!this.collides(candidate)) { this.active = candidate; this.score.score += 1; return true; } return false; }
  hardDrop(): void { if (this.over || this.paused) return; while (this.softDrop()) { /* soft drop awards one point per row */ } this.lock(); }
  rotate(direction: 1 | -1): boolean { if (this.over || this.paused || this.active.type === "O") return false; const from = this.active.rotation; const to = (from + direction + 4) % 4; const key = `${from}>${to}`; const kicks = this.active.type === "I" ? I_KICKS[key] : KICKS[key]; for (const [dx,dy] of kicks ?? [[0,0]]) { const candidate = { ...this.active, rotation: to, x: this.active.x + dx, y: this.active.y - dy }; if (!this.collides(candidate)) { this.active = candidate; this.lockAccumulator = 0; return true; } } return false; }
  holdPiece(): void { if (this.over || this.paused || !this.canHold) return; const held = this.hold; this.hold = this.active.type; this.justResetHold = true; this.canHold = false; if (held) this.spawn(held); else this.spawn(); }
  tick(ms: number): void { if (this.over || this.paused) return; const gravity = Math.max(70, 800 - (this.score.level - 1) * 65); this.dropAccumulator += ms; while (this.dropAccumulator >= gravity) { this.dropAccumulator -= gravity; if (!this.softDrop()) { this.lockAccumulator += gravity; break; } this.lockAccumulator = 0; } if (this.collides({ ...this.active, y: this.active.y + 1 })) { this.lockAccumulator += ms; if (this.lockAccumulator >= 500) this.lock(); } else this.lockAccumulator = 0; }
  lock(): void { if (this.over) return; for (const [x,y] of cellsFor(this.active)) if (y >= 0) this.board[y]![x] = this.active.type; const cleared = this.clearLines(); const points = [0,100,300,500,800][cleared] ?? 0; this.score.score += points * this.score.level; this.score.lines += cleared; this.score.level = Math.floor(this.score.lines / 10) + 1; this.canHold = true; this.spawn(); }
  clearLines(): number { let cleared = 0; this.board = this.board.filter(row => { if (row.every(Boolean)) { cleared++; return false; } return true; }); while (this.board.length < ROWS) this.board.unshift(Array<Cell>(COLS).fill(null)); return cleared; }
  ghost(): ActivePiece { let ghost = { ...this.active }; while (!this.collides({ ...ghost, y: ghost.y + 1 })) ghost.y++; return ghost; }
}
