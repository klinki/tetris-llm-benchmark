export type Kind = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';
export type Cell = Kind | null;
export type Point = [number, number];
export interface Piece { kind: Kind; rotation: number; x: number; y: number }
export const WIDTH = 10, HEIGHT = 20, BUFFER = 20;
export const KINDS: Kind[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

// Spawn states use the SRS rotation boxes: 3×3 for JLSTZ, 4×4 for I and O.
const SPAWN: Record<Kind, Point[]> = {
  I: [[0,1],[1,1],[2,1],[3,1]], J: [[0,0],[0,1],[1,1],[2,1]],
  L: [[2,0],[0,1],[1,1],[2,1]], O: [[1,0],[2,0],[1,1],[2,1]],
  S: [[1,0],[2,0],[0,1],[1,1]], T: [[1,0],[0,1],[1,1],[2,1]],
  Z: [[0,0],[1,0],[1,1],[2,1]]
};
export function blocks(kind: Kind, rotation = 0): Point[] {
  let points = SPAWN[kind].map(([x,y]) => [x,y] as Point);
  if (kind === 'O') return points;
  const size = kind === 'I' ? 4 : 3;
  for (let i = 0; i < rotation; i++) points = points.map(([x,y]) => [size - 1 - y, x]);
  return points;
}
// Kick tables use SRS's positive-up coordinates; converted when applied.
const JLSTZ: Record<string, Point[]> = {
  '0>1': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  '1>0': [[0,0],[1,0],[1,-1],[0,2],[1,2]],
  '1>2': [[0,0],[1,0],[1,-1],[0,2],[1,2]],
  '2>1': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  '2>3': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
  '3>2': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  '3>0': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  '0>3': [[0,0],[1,0],[1,1],[0,-2],[1,-2]]
};
const I_KICKS: Record<string, Point[]> = {
  '0>1': [[0,0],[-2,0],[1,0],[-2,-1],[1,2]],
  '1>0': [[0,0],[2,0],[-1,0],[2,1],[-1,-2]],
  '1>2': [[0,0],[-1,0],[2,0],[-1,2],[2,-1]],
  '2>1': [[0,0],[1,0],[-2,0],[1,-2],[-2,1]],
  '2>3': [[0,0],[2,0],[-1,0],[2,1],[-1,-2]],
  '3>2': [[0,0],[-2,0],[1,0],[-2,-1],[1,2]],
  '3>0': [[0,0],[1,0],[-2,0],[1,-2],[-2,1]],
  '0>3': [[0,0],[-1,0],[2,0],[-1,2],[2,-1]]
};

export class Game {
  board: Cell[][] = [];
  current!: Piece;
  queue: Kind[] = [];
  held: Kind | null = null;
  canHold = true;
  score = 0; lines = 0; level = 1; combo = -1; backToBack = false;
  gameOver = false; paused = false;
  message = '';
  private bag: Kind[] = [];
  private gravityTime = 0; private lockTime = 0; private lockResets = 0;
  private lastRotation = false; private lastKick = 0;
  constructor(private random: () => number = Math.random) { this.restart(); }
  restart(): void {
    this.board = Array.from({ length: HEIGHT + BUFFER }, () => Array<Cell>(WIDTH).fill(null));
    this.queue = []; this.bag = []; this.held = null; this.canHold = true;
    this.score = 0; this.lines = 0; this.level = 1; this.combo = -1; this.backToBack = false;
    this.gameOver = false; this.paused = false; this.message = '';
    for (let i = 0; i < 5; i++) this.queue.push(this.takeBag());
    this.spawn();
  }
  private takeBag(): Kind {
    if (!this.bag.length) {
      this.bag = [...KINDS];
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
      }
    }
    return this.bag.pop()!;
  }
  private spawn(kind?: Kind): void {
    const next = kind ?? this.queue.shift()!;
    if (!kind) this.queue.push(this.takeBag());
    this.current = { kind: next, rotation: 0, x: 3, y: -2 };
    this.gravityTime = 0; this.lockTime = 0; this.lockResets = 0; this.lastRotation = false; this.lastKick = 0;
    if (!this.valid(this.current)) { this.gameOver = true; this.message = 'GAME OVER'; }
  }
  valid(piece: Piece): boolean {
    return blocks(piece.kind, piece.rotation).every(([dx,dy]) => {
      const x = piece.x + dx, y = piece.y + dy;
      return x >= 0 && x < WIDTH && y >= -BUFFER && y < HEIGHT && !this.board[y + BUFFER][x];
    });
  }
  private grounded(): boolean { return !this.valid({ ...this.current, y: this.current.y + 1 }); }
  private resetLock(wasGrounded: boolean): void {
    if (wasGrounded && this.lockResets < 15) { this.lockTime = 0; this.lockResets++; }
  }
  move(dx: number): boolean {
    if (this.gameOver || this.paused) return false;
    const wasGrounded = this.grounded(), next = { ...this.current, x: this.current.x + dx };
    if (!this.valid(next)) return false;
    this.current = next; this.lastRotation = false; this.resetLock(wasGrounded); return true;
  }
  rotate(direction: 1 | -1): boolean {
    if (this.gameOver || this.paused) return false;
    const wasGrounded = this.grounded(), from = this.current.rotation, to = (from + direction + 4) % 4;
    const kicks = this.current.kind === 'O' ? [[0,0] as Point] : (this.current.kind === 'I' ? I_KICKS : JLSTZ)[`${from}>${to}`];
    for (let i = 0; i < kicks.length; i++) {
      const [dx,dy] = kicks[i], next = { ...this.current, rotation: to, x: this.current.x + dx, y: this.current.y - dy };
      if (this.valid(next)) { this.current = next; this.lastRotation = true; this.lastKick = i; this.resetLock(wasGrounded); return true; }
    }
    return false;
  }
  softDrop(): boolean {
    if (this.gameOver || this.paused) return false;
    if (!this.stepDown()) return false;
    this.score++; return true;
  }
  private stepDown(): boolean {
    const next = { ...this.current, y: this.current.y + 1 };
    if (!this.valid(next)) return false;
    this.current = next; return true;
  }
  ghostY(): number {
    let y = this.current.y;
    while (this.valid({ ...this.current, y: y + 1 })) y++;
    return y;
  }
  hardDrop(): void {
    if (this.gameOver || this.paused) return;
    const y = this.ghostY(); this.score += (y - this.current.y) * 2;
    this.current.y = y; this.lock();
  }
  hold(): void {
    if (this.gameOver || this.paused || !this.canHold) return;
    const previous = this.held; this.held = this.current.kind; this.canHold = false;
    this.spawn(previous ?? undefined);
  }
  tick(ms: number, soft = false): void {
    if (this.gameOver || this.paused) return;
    // Guideline marathon gravity, in milliseconds per cell.
    const gravity = Math.max(16, Math.pow(0.8 - (this.level - 1) * 0.007, this.level - 1) * 1000);
    this.gravityTime += Math.min(ms, 100);
    const interval = soft ? Math.min(50, gravity) : gravity;
    while (this.gravityTime >= interval) {
      this.gravityTime -= interval;
      if (!this.stepDown()) { this.gravityTime = 0; break; }
      if (soft) this.score++;
    }
    if (this.grounded()) {
      this.lockTime += Math.min(ms, 100);
      if (this.lockTime >= 500) this.lock();
    } else this.lockTime = 0;
  }
  private spin(): 'full' | 'mini' | null {
    if (this.current.kind !== 'T' || !this.lastRotation) return null;
    const {x,y,rotation} = this.current;
    const occupied = (dx: number, dy: number) => {
      const cx = x + dx, cy = y + dy;
      return cx < 0 || cx >= WIDTH || cy >= HEIGHT || cy < -BUFFER || !!this.board[cy + BUFFER][cx];
    };
    const corners = [occupied(0,0), occupied(2,0), occupied(2,2), occupied(0,2)];
    if (corners.filter(Boolean).length < 3) return null;
    const front = [[0,1],[1,2],[2,3],[3,0]][rotation];
    return (corners[front[0]] && corners[front[1]]) || this.lastKick === 4 ? 'full' : 'mini';
  }
  private lock(): void {
    const spin = this.spin();
    const cells = blocks(this.current.kind, this.current.rotation).map(([dx,dy]) => [this.current.x + dx, this.current.y + dy] as Point);
    for (const [x,y] of cells) this.board[y + BUFFER][x] = this.current.kind;
    let cleared = 0;
    for (let y = this.board.length - 1; y >= 0; y--) {
      if (this.board[y].every(Boolean)) { this.board.splice(y, 1); this.board.unshift(Array<Cell>(WIDTH).fill(null)); cleared++; y++; }
    }
    const difficult = cleared === 4 || (spin !== null && cleared > 0);
    let base = spin === 'full' ? ([400,800,1200,1600][cleared] ?? 0) : spin === 'mini' ? ([100,200,400][cleared] ?? 0) : ([0,100,300,500,800][cleared] ?? 0);
    if (difficult && this.backToBack) base *= 1.5;
    if (cleared) {
      this.combo++;
      base += 50 * Math.max(0, this.combo);
      if (this.board.every(row => row.every(cell => !cell))) base += ([0,800,1200,1800, this.backToBack && cleared === 4 ? 3200 : 2000][cleared] ?? 0);
      this.backToBack = difficult;
    } else this.combo = -1;
    this.score += base * this.level;
    this.lines += cleared; this.level = 1 + Math.floor(this.lines / 10);
    const names = ['', 'SINGLE', 'DOUBLE', 'TRIPLE', 'TETRIS'];
    this.message = spin ? `T-SPIN${spin === 'mini' ? ' MINI' : ''}${cleared ? ' ' + names[cleared] : ''}` : names[cleared];
    if (cells.every(([,y]) => y < 0)) { this.gameOver = true; this.message = 'GAME OVER'; return; }
    this.canHold = true; this.spawn();
  }
}
