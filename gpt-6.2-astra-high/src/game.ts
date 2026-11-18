import { bag, cells, kicks, type Kind, type Piece } from './pieces.js';

export const WIDTH = 10,
  VISIBLE = 20,
  HIDDEN = 20,
  HEIGHT = VISIBLE + HIDDEN;
const emptyRow = (): (Kind | null)[] => Array(WIDTH).fill(null);
const LOCK_DELAY = 500,
  MAX_RESETS = 15;

export class Game {
  board = Array.from({ length: HEIGHT }, emptyRow);
  queue: Kind[] = [];
  active!: Piece;
  held: Kind | null = null;
  holdUsed = false;
  over = false;
  score = 0;
  lines = 0;
  combo = -1;
  backToBack = false;
  revision = 0;
  private fallTime = 0;
  private lockTime = 0;
  private resets = 0;
  private lowest = 0;
  private lastKick = -1;

  constructor(private readonly random = Math.random) {
    this.spawn(this.next());
  }
  get level() {
    return 1 + Math.floor(this.lines / 10);
  }
  get gravity() {
    const n = Math.min(this.level, 20) - 1;
    return Math.max(1000 / 1200, 1000 * (0.8 - 0.007 * n) ** n);
  }

  private next(): Kind {
    while (this.queue.length < 6) this.queue.push(...bag(this.random));
    return this.queue.shift()!;
  }
  private spawn(kind: Kind) {
    this.active = { kind, x: 3, y: HIDDEN - 2, rotation: 0 };
    this.over = !this.fits(this.active);
    if (!this.over && this.fits(this.active, 0, 1)) this.active.y++;
    this.fallTime = this.lockTime = this.resets = 0;
    this.lowest = this.active.y;
    this.lastKick = -1;
    this.revision++;
  }
  private occupied(x: number, y: number) {
    return (
      x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT || this.board[y][x] !== null
    );
  }
  private fits(piece: Piece, dx = 0, dy = 0) {
    return cells(piece).every(
      ([x, y]) => !this.occupied(piece.x + x + dx, piece.y + y + dy)
    );
  }
  get ghostY() {
    let distance = 0;
    while (this.fits(this.active, 0, distance + 1)) distance++;
    return this.active.y + distance;
  }
  private updateDepth() {
    if (this.active.y > this.lowest) {
      this.lowest = this.active.y;
      this.lockTime = this.resets = 0;
    }
  }
  private manipulate(piece: Piece, kick: number) {
    if (!this.fits(this.active, 0, 1) && this.resets < MAX_RESETS) {
      this.lockTime = 0;
      this.resets++;
    }
    this.active = piece;
    this.lastKick = kick;
    this.updateDepth();
    this.revision++;
    return true;
  }
  move(dx: -1 | 1) {
    if (this.over || !this.fits(this.active, dx)) return false;
    return this.manipulate({ ...this.active, x: this.active.x + dx }, -1);
  }
  rotate(direction: -1 | 1) {
    if (this.over) return false;
    const { kind, rotation, x, y } = this.active;
    const to = (rotation + direction + 4) % 4;
    const offsets = kicks(kind, rotation, to);
    for (const [index, [dx, dy]] of offsets.entries()) {
      const candidate = { kind, x: x + dx, y: y - dy, rotation: to };
      if (this.fits(candidate)) return this.manipulate(candidate, index);
    }
    return false;
  }
  private descend() {
    this.active.y++;
    this.lastKick = -1;
    this.updateDepth();
    this.revision++;
  }
  softDrop() {
    if (this.over || !this.fits(this.active, 0, 1)) return false;
    this.descend();
    this.score++;
    this.fallTime = 0;
    return true;
  }
  hardDrop() {
    if (this.over) return;
    const y = this.ghostY;
    if (y !== this.active.y) this.lastKick = -1;
    this.score += 2 * (y - this.active.y);
    this.active.y = y;
    this.lock();
  }
  hold() {
    if (this.over || this.holdUsed) return false;
    const next = this.held ?? this.next();
    this.held = this.active.kind;
    this.holdUsed = true;
    this.spawn(next);
    return true;
  }
  tick(ms: number) {
    while (ms > 0 && !this.over) {
      if (!this.fits(this.active, 0, 1)) {
        const wait = Math.min(ms, LOCK_DELAY - this.lockTime);
        this.lockTime += wait;
        ms -= wait;
        if (this.lockTime >= LOCK_DELAY) this.lock();
      } else {
        const wait = Math.min(ms, this.gravity - this.fallTime);
        this.fallTime += wait;
        ms -= wait;
        if (this.fallTime >= this.gravity) {
          this.fallTime = 0;
          this.descend();
        }
      }
    }
  }
  private spin(): 'full' | 'mini' | null {
    if (this.active.kind !== 'T' || this.lastKick < 0) return null;
    const { x, y, rotation } = this.active;
    const corners = [
      [0, 0],
      [2, 0],
      [2, 2],
      [0, 2]
    ].map(([a, b]) => this.occupied(x + a, y + b));
    if (corners.filter(Boolean).length < 3) return null;
    return (corners[rotation] && corners[(rotation + 1) % 4]) ||
      this.lastKick === 4
      ? 'full'
      : 'mini';
  }
  private lock() {
    const spin = this.spin();
    for (const [x, y] of cells(this.active))
      this.board[this.active.y + y][this.active.x + x] = this.active.kind;
    const remaining = this.board.filter((row) => row.includes(null));
    const count = HEIGHT - remaining.length;
    this.board = [...Array.from({ length: count }, emptyRow), ...remaining];

    const base =
      spin === 'full'
        ? [400, 800, 1200, 1600]
        : spin === 'mini'
          ? [100, 200, 400]
          : [0, 100, 300, 500, 800];
    const difficult = count > 0 && (count === 4 || !!spin);
    let points = base[count] * (difficult && this.backToBack ? 1.5 : 1);
    this.combo = count ? this.combo + 1 : -1;
    if (count) {
      points += 50 * this.combo;
      if (remaining.every((row) => row.every((cell) => cell === null))) {
        points +=
          count === 4 && this.backToBack
            ? 3200
            : [0, 800, 1200, 1800, 2000][count];
      }
      this.backToBack = difficult;
    }
    this.score += points * this.level;
    this.lines += count;
    this.holdUsed = false;
    this.spawn(this.next());
  }
}
