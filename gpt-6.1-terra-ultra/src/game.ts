/** A dependency-free Guideline-style Tetris engine. Coordinates use a downward y axis. */
export type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
export interface Piece { type: PieceType; rotation: number; x: number; y: number }
export interface Cell { x: number; y: number }

const TYPES: PieceType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
const SPAWN: Record<PieceType, number[][]> = {
  I: [[0, 1], [1, 1], [2, 1], [3, 1]], O: [[1, 0], [2, 0], [1, 1], [2, 1]],
  T: [[1, 0], [0, 1], [1, 1], [2, 1]], S: [[1, 0], [2, 0], [0, 1], [1, 1]],
  Z: [[0, 0], [1, 0], [1, 1], [2, 1]], J: [[0, 0], [0, 1], [1, 1], [2, 1]],
  L: [[2, 0], [0, 1], [1, 1], [2, 1]],
};

/** Return the four occupied cells, including cells above the visible board. */
export function cells(piece: Piece): Cell[] {
  return SPAWN[piece.type].map(([startX, startY]) => {
    let x = startX, y = startY;
    if (piece.type !== 'O') {
      const center = piece.type === 'I' ? 1.5 : 1;
      for (let i = 0; i < piece.rotation; i++) {
        const nextX = center - (y - center);
        y = center + (x - center);
        x = nextX;
      }
    }
    return { x: x + piece.x, y: y + piece.y };
  });
}

// SRS kick offsets from the Guideline, with y inverted for screen coordinates.
const JLSTZ: Record<string, number[][]> = {
  '0>1': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]], '1>0': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
  '1>2': [[0,0],[1,0],[1,1],[0,-2],[1,-2]], '2>1': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  '2>3': [[0,0],[1,0],[1,-1],[0,2],[1,2]], '3>2': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  '3>0': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]], '0>3': [[0,0],[1,0],[1,-1],[0,2],[1,2]],
};
const I_KICKS: Record<string, number[][]> = {
  '0>1': [[0,0],[-2,0],[1,0],[-2,1],[1,-2]], '1>0': [[0,0],[2,0],[-1,0],[2,-1],[-1,2]],
  '1>2': [[0,0],[-1,0],[2,0],[-1,-2],[2,1]], '2>1': [[0,0],[1,0],[-2,0],[1,2],[-2,-1]],
  '2>3': [[0,0],[2,0],[-1,0],[2,-1],[-1,2]], '3>2': [[0,0],[-2,0],[1,0],[-2,1],[1,-2]],
  '3>0': [[0,0],[1,0],[-2,0],[1,2],[-2,-1]], '0>3': [[0,0],[-1,0],[2,0],[-1,-2],[2,1]],
};
type Square = PieceType | null;
const emptyRow = (): Square[] => Array<Square>(10).fill(null);

export class Game {
  board: Square[][] = [];
  active: Piece | null = null;
  next: PieceType[] = [];
  held: PieceType | null = null;
  canHold = true;
  gameOver = false;
  score = 0;
  lines = 0;
  level = 1;
  private hidden: Square[][] = [];
  private gravityElapsed = 0;
  private lockElapsed = 0;
  private lockResets = 0;
  private lastRotation = false;
  private lastKick = 0;
  private combo = -1;
  private backToBack = false;

  constructor(private readonly random: () => number = Math.random) { this.reset(); }

  reset(): void {
    this.board = Array.from({ length: 20 }, emptyRow);
    this.hidden = Array.from({ length: 20 }, emptyRow);
    this.active = null;
    this.next = [];
    this.held = null;
    this.canHold = true;
    this.gameOver = false;
    this.score = this.lines = 0;
    this.level = 1;
    this.combo = -1;
    this.backToBack = false;
    this.refill();
    this.spawn();
  }

  private refill(): void {
    while (this.next.length < 7) {
      const bag = [...TYPES];
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.max(0, Math.min(i, Math.floor(this.random() * (i + 1))));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
      this.next.push(...bag);
    }
  }

  private spawn(type?: PieceType): void {
    if (!type) { type = this.next.shift()!; this.refill(); }
    this.active = { type, rotation: 0, x: 3, y: -2 };
    this.gravityElapsed = this.lockElapsed = this.lockResets = 0;
    this.lastRotation = false;
    this.lastKick = 0;
    if (!this.fits(this.active)) { this.active = null; this.gameOver = true; }
  }

  private occupied(x: number, y: number): boolean {
    if (x < 0 || x >= 10 || y >= 20 || y < -20) return true;
    return y < 0 ? this.hidden[y + 20][x] !== null : this.board[y][x] !== null;
  }

  private fits(piece: Piece): boolean { return cells(piece).every(({x, y}) => !this.occupied(x, y)); }
  private grounded(): boolean { return !!this.active && !this.fits({ ...this.active, y: this.active.y + 1 }); }
  private resetLock(wasGrounded: boolean): void {
    if (wasGrounded && this.lockResets < 15) { this.lockElapsed = 0; this.lockResets++; }
  }

  move(dx: number): boolean {
    if (!this.active || this.gameOver || (dx !== -1 && dx !== 1)) return false;
    const wasGrounded = this.grounded();
    const candidate = { ...this.active, x: this.active.x + dx };
    if (!this.fits(candidate)) return false;
    this.active = candidate;
    this.lastRotation = false;
    this.resetLock(wasGrounded);
    return true;
  }

  rotate(direction: 1 | -1): boolean {
    if (!this.active || this.gameOver || (direction !== 1 && direction !== -1)) return false;
    const wasGrounded = this.grounded();
    const from = this.active.rotation;
    const to = (from + direction + 4) % 4;
    const kicks = this.active.type === 'O' ? [[0,0]] : (this.active.type === 'I' ? I_KICKS : JLSTZ)[`${from}>${to}`];
    for (let i = 0; i < kicks.length; i++) {
      const [x, y] = kicks[i];
      const candidate = { ...this.active, rotation: to, x: this.active.x + x, y: this.active.y + y };
      if (this.fits(candidate)) {
        this.active = candidate;
        this.lastRotation = true;
        this.lastKick = i;
        this.resetLock(wasGrounded);
        return true;
      }
    }
    return false;
  }

  softDrop(): boolean {
    if (!this.active || this.gameOver) return false;
    const candidate = { ...this.active, y: this.active.y + 1 };
    if (!this.fits(candidate)) return false;
    this.active = candidate;
    this.score++;
    this.gravityElapsed = 0;
    this.lockElapsed = 0;
    this.lastRotation = false;
    return true;
  }

  ghost(): Piece | null {
    if (!this.active) return null;
    const ghost = { ...this.active };
    while (this.fits({ ...ghost, y: ghost.y + 1 })) ghost.y++;
    return ghost;
  }

  hardDrop(): void {
    if (!this.active || this.gameOver) return;
    const ghost = this.ghost()!;
    this.score += (ghost.y - this.active.y) * 2;
    this.active = ghost;
    this.lock();
  }

  hold(): void {
    if (!this.active || this.gameOver || !this.canHold) return;
    const type = this.active.type;
    const previous = this.held;
    this.held = type;
    this.canHold = false;
    this.spawn(previous || undefined);
  }

  /** Advance simulated time in milliseconds, including gravity and the 500ms lock delay. */
  update(deltaMs: number): void {
    if (!Number.isFinite(deltaMs) || deltaMs <= 0 || this.gameOver) return;
    let remaining = deltaMs;
    while (remaining > 0 && this.active && !this.gameOver) {
      const grounded = this.grounded();
      const interval = Math.max(1, 1000 * Math.pow(Math.max(0.001, 0.8 - (this.level - 1) * 0.007), this.level - 1));
      const gravityIn = Math.max(0, interval - this.gravityElapsed);
      const lockIn = grounded ? Math.max(0, 500 - this.lockElapsed) : Infinity;
      const step = Math.min(remaining, gravityIn, lockIn);
      this.gravityElapsed += step;
      if (grounded) this.lockElapsed += step;
      remaining -= step;
      if (grounded && this.lockElapsed >= 500) { this.lock(); continue; }
      if (this.gravityElapsed >= interval) {
        this.gravityElapsed -= interval;
        const candidate = { ...this.active, y: this.active.y + 1 };
        if (this.fits(candidate)) { this.active = candidate; this.lockElapsed = 0; }
      }
      if (step === 0 && gravityIn > 0 && lockIn > 0) break;
    }
  }

  private spin(): 'none' | 'mini' | 'full' {
    if (!this.active || this.active.type !== 'T' || !this.lastRotation) return 'none';
    const { x, y, rotation } = this.active;
    const corners = [[x,y], [x+2,y], [x+2,y+2], [x,y+2]].map(([cx,cy]) => this.occupied(cx,cy));
    if (corners.filter(Boolean).length < 3) return 'none';
    const front = [[0,1], [1,2], [2,3], [3,0]][rotation];
    return (corners[front[0]] && corners[front[1]]) || this.lastKick === 4 ? 'full' : 'mini';
  }

  private lock(): void {
    if (!this.active) return;
    const squares = cells(this.active);
    const spin = this.spin();
    if (squares.every(({y}) => y < 0)) { this.active = null; this.gameOver = true; return; }
    for (const {x, y} of squares) {
      if (y < 0) this.hidden[y + 20][x] = this.active.type;
      else this.board[y][x] = this.active.type;
    }
    const all = [...this.hidden, ...this.board];
    const kept = all.filter(row => row.some(cell => cell === null));
    const cleared = all.length - kept.length;
    while (kept.length < 40) kept.unshift(emptyRow());
    this.hidden = kept.slice(0, 20);
    this.board = kept.slice(20);

    const difficult = cleared === 4 || (spin !== 'none' && cleared > 0);
    const chained = difficult && this.backToBack;
    let points = spin === 'full' ? [400,800,1200,1600][cleared] || 0
      : spin === 'mini' ? [100,200,400][cleared] || 0 : [0,100,300,500,800][cleared] || 0;
    if (chained) points *= 1.5;
    if (cleared > 0) {
      this.combo++;
      points += 50 * this.combo;
      if (difficult) this.backToBack = true;
      else this.backToBack = false;
      if (kept.every(row => row.every(cell => cell === null))) {
        points += [0,800,1200,1800, chained ? 3200 : 2000][cleared];
      }
    } else this.combo = -1;
    this.score += points * this.level;
    this.lines += cleared;
    this.level = Math.floor(this.lines / 10) + 1;
    this.canHold = true;
    this.spawn();
  }
}
