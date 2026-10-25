/** Coordinates use positive y downwards; rows 0–19 are visible. */
export const WIDTH = 10;
export const HEIGHT = 20;
export const HIDDEN = 20;
export const TYPES = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'] as const;
export type Kind = typeof TYPES[number];
export type Cell = Kind | null;
export type Point = readonly [number, number];
export interface Piece { kind: Kind; x: number; y: number; rotation: number }
export const COLORS: Record<Kind, string> = {
  I: '#39cfe2', J: '#567cf4', L: '#f6a44d', O: '#f5d75e', S: '#65d79b', T: '#ae80ef', Z: '#ef7389',
};
const SPAWN: Record<Kind, readonly Point[]> = {
  I: [[0, 1], [1, 1], [2, 1], [3, 1]],
  J: [[0, 0], [0, 1], [1, 1], [2, 1]],
  L: [[2, 0], [0, 1], [1, 1], [2, 1]],
  O: [[1, 0], [2, 0], [1, 1], [2, 1]],
  S: [[1, 0], [2, 0], [0, 1], [1, 1]],
  T: [[1, 0], [0, 1], [1, 1], [2, 1]],
  Z: [[0, 0], [1, 0], [1, 1], [2, 1]],
};
export function blocks(kind: Kind, rotation = 0): Point[] {
  let result = SPAWN[kind].map(([x, y]) => [x, y] as Point);
  if (kind === 'O') return result;
  const edge = kind === 'I' ? 3 : 2;
  for (let r = 0; r < rotation; r++) result = result.map(([x, y]) => [edge - y, x]);
  return result;
}
// Official SRS offsets, expressed with positive y upwards.
const KICKS: Record<string, readonly Point[]> = {
  '0>1': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  '1>0': [[0,0],[1,0],[1,-1],[0,2],[1,2]],
  '1>2': [[0,0],[1,0],[1,-1],[0,2],[1,2]],
  '2>1': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  '2>3': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
  '3>2': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  '3>0': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  '0>3': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
};
const I_KICKS: Record<string, readonly Point[]> = {
  '0>1': [[0,0],[-2,0],[1,0],[-2,-1],[1,2]],
  '1>0': [[0,0],[2,0],[-1,0],[2,1],[-1,-2]],
  '1>2': [[0,0],[-1,0],[2,0],[-1,2],[2,-1]],
  '2>1': [[0,0],[1,0],[-2,0],[1,-2],[-2,1]],
  '2>3': [[0,0],[2,0],[-1,0],[2,1],[-1,-2]],
  '3>2': [[0,0],[-2,0],[1,0],[-2,-1],[1,2]],
  '3>0': [[0,0],[1,0],[-2,0],[1,-2],[-2,1]],
  '0>3': [[0,0],[-1,0],[2,0],[-1,2],[2,-1]],
};
export class Bag {
  private bag: Kind[] = [];
  constructor(private random: () => number = Math.random) {}
  next(): Kind {
    if (!this.bag.length) {
      this.bag = [...TYPES];
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
      }
    }
    return this.bag.pop()!;
  }
}
export class Game {
  board: Cell[][] = [];
  active!: Piece;
  queue: Kind[] = [];
  held: Kind | null = null;
  holdUsed = false;
  score = 0;
  lines = 0;
  combo = -1;
  backToBack = false;
  over = false;
  paused = false;
  message = 'Make your move';
  pieces = 0;
  elapsed = 0;
  private bag: Bag;
  private fallTime = 0;
  private lockTime = 0;
  private lockResets = 0;
  private lastRotation = false;
  private kickIndex = 0;
  constructor(private random: () => number = Math.random) {
    this.bag = new Bag(random);
    this.reset();
  }
  get level(): number { return Math.floor(this.lines / 10) + 1; }
  get gravity(): number { return Math.max(5, 1000 * Math.pow(Math.max(0.05, 0.8 - (this.level - 1) * 0.007), this.level - 1)); }
  get running(): boolean { return !this.over && !this.paused; }
  reset(): void {
    this.board = Array.from({ length: HEIGHT + HIDDEN }, () => Array<Cell>(WIDTH).fill(null));
    this.bag = new Bag(this.random);
    this.queue = Array.from({ length: 6 }, () => this.bag.next());
    this.held = null;
    this.holdUsed = false;
    this.score = this.lines = this.pieces = this.elapsed = 0;
    this.combo = -1;
    this.backToBack = this.over = this.paused = false;
    this.message = 'Make your move';
    this.spawn();
  }
  cell(x: number, y: number): Cell | undefined { return this.board[y + HIDDEN]?.[x]; }
  fits(piece: Piece): boolean {
    return blocks(piece.kind, piece.rotation).every(([x, y]) => {
      x += piece.x; y += piece.y;
      return x >= 0 && x < WIDTH && y >= -HIDDEN && y < HEIGHT && !this.cell(x, y);
    });
  }
  private spawn(kind?: Kind): void {
    const next = kind ?? this.queue.shift()!;
    if (!kind) this.queue.push(this.bag.next());
    this.active = { kind: next, x: 3, y: -1, rotation: 0 };
    this.fallTime = this.lockTime = this.lockResets = 0;
    this.lastRotation = false;
    this.kickIndex = 0;
    if (!this.fits(this.active)) { this.over = true; this.message = 'Game over'; }
  }
  get grounded(): boolean { return !this.fits({ ...this.active, y: this.active.y + 1 }); }
  private resetLock(wasGrounded: boolean): void {
    if (wasGrounded && this.lockResets < 15) { this.lockTime = 0; this.lockResets++; }
  }
  move(dx: number): boolean {
    if (!this.running) return false;
    const next = { ...this.active, x: this.active.x + dx };
    if (!this.fits(next)) return false;
    const grounded = this.grounded;
    this.active = next;
    this.lastRotation = false;
    this.resetLock(grounded);
    return true;
  }
  rotate(direction: 1 | -1): boolean {
    if (!this.running) return false;
    const rotation = (this.active.rotation + direction + 4) % 4;
    const table = this.active.kind === 'I' ? I_KICKS : KICKS;
    const offsets: readonly Point[] = this.active.kind === 'O' ? [[0,0]] : table[`${this.active.rotation}>${rotation}`];
    const grounded = this.grounded;
    for (let i = 0; i < offsets.length; i++) {
      const [dx, dy] = offsets[i];
      const next = { ...this.active, rotation, x: this.active.x + dx, y: this.active.y - dy };
      if (this.fits(next)) {
        this.active = next;
        this.lastRotation = true;
        this.kickIndex = i;
        this.resetLock(grounded);
        return true;
      }
    }
    return false;
  }
  softDrop(): boolean {
    if (!this.running || this.grounded) return false;
    this.active.y++;
    this.score++;
    this.lastRotation = false;
    this.fallTime = 0;
    return true;
  }
  ghostY(): number {
    let y = this.active.y;
    while (this.fits({ ...this.active, y: y + 1 })) y++;
    return y;
  }
  hardDrop(): void {
    if (!this.running) return;
    const y = this.ghostY();
    const distance = y - this.active.y;
    this.score += distance * 2;
    if (distance) this.lastRotation = false;
    this.active.y = y;
    this.lock();
  }
  hold(): void {
    if (!this.running || this.holdUsed) return;
    const previous = this.held;
    this.held = this.active.kind;
    this.spawn(previous ?? undefined);
    this.holdUsed = true;
  }
  private spin(): 'full' | 'mini' | null {
    if (this.active.kind !== 'T' || !this.lastRotation) return null;
    const { x, y, rotation } = this.active;
    const occupied = (dx: number, dy: number) => {
      const cx = x + dx, cy = y + dy;
      return cx < 0 || cx >= WIDTH || cy >= HEIGHT || cy < -HIDDEN || !!this.cell(cx, cy);
    };
    const corners = [occupied(0,0), occupied(2,0), occupied(2,2), occupied(0,2)];
    if (corners.filter(Boolean).length < 3) return null;
    const fronts = [[0,1], [1,2], [2,3], [3,0]][rotation];
    return (corners[fronts[0]] && corners[fronts[1]]) || this.kickIndex === 4 ? 'full' : 'mini';
  }
  private lock(): void {
    const spin = this.spin();
    const cells = blocks(this.active.kind, this.active.rotation).map(([x, y]) => [x + this.active.x, y + this.active.y] as Point);
    for (const [x, y] of cells) this.board[y + HIDDEN][x] = this.active.kind;
    const remaining = this.board.filter(row => row.some(cell => cell === null));
    const count = this.board.length - remaining.length;
    this.board = [...Array.from({ length: count }, () => Array<Cell>(WIDTH).fill(null)), ...remaining];
    const level = this.level;
    const difficult = count > 0 && (count === 4 || spin !== null);
    const wasBackToBack = this.backToBack;
    let points = spin === 'full' ? [400, 800, 1200, 1600][count] : spin === 'mini' ? [100, 200, 400][count] : [0,100,300,500,800][count];
    if (difficult && this.backToBack) points *= 1.5;
    if (count) {
      this.combo++;
      points += 50 * this.combo;
      this.backToBack = difficult;
      if (this.board.every(row => row.every(cell => cell === null))) {
        points += count === 4 && wasBackToBack ? 3200 : [0,800,1200,1800,2000][count];
        this.message = 'Perfect clear!';
      } else {
        const name = spin ? `${spin === 'mini' ? 'Mini ' : ''}T-spin` : ['','','','', 'Tetris!'][count];
        this.message = `${difficult && wasBackToBack ? 'Back-to-back · ' : ''}${name || ['','Single','Double','Triple'][count]}${this.combo > 0 ? ` · ${this.combo} combo` : ''}`;
      }
    } else { this.combo = -1; this.message = spin ? 'T-spin' : 'Keep the flow'; }
    this.score += points * level;
    this.lines += count;
    this.pieces++;
    // A piece locking entirely above the visible field also tops out.
    if (cells.every(([, y]) => y < 0)) { this.over = true; this.message = 'Game over'; return; }
    this.holdUsed = false;
    this.spawn();
  }
  tick(ms: number, soft = false): void {
    if (!this.running || ms <= 0) return;
    this.elapsed += ms;
    // Small steps preserve landing and lock timing, even on a slow frame.
    let remaining = Math.min(ms, 1000);
    while (remaining > 0 && this.running) {
      const step = Math.min(remaining, 10);
      remaining -= step;
      this.fallTime += step;
      const interval = soft ? Math.min(40, this.gravity / 20) : this.gravity;
      while (this.fallTime >= interval && !this.grounded) {
        this.fallTime -= interval;
        this.active.y++;
        this.lastRotation = false;
        if (soft) this.score++;
      }
      if (this.grounded) {
        this.fallTime = 0;
        this.lockTime += step;
        if (this.lockTime >= 500) this.lock();
      } else this.lockTime = 0;
    }
  }
}
