import { BagQueue, kicks, SHAPES, type Kind, type Piece } from './pieces.js';

export const WIDTH = 10;
export const HIDDEN = 20;
export const HEIGHT = HIDDEN + 20;
const emptyRow = (): (Kind | null)[] => Array(WIDTH).fill(null);

export class Game {
  board = Array.from({ length: HEIGHT }, emptyRow);
  queue: BagQueue;
  active!: Piece;
  held: Kind | null = null;
  holdUsed = false;
  over = false;
  score = 0;
  lines = 0;
  combo = -1;
  backToBack = false;
  private fallTime = 0;
  private lockTime = 0;
  private resets = 0;
  private lowest = 0;
  private lastKick: number | null = null;

  constructor(random = Math.random) {
    this.queue = new BagQueue(random);
    this.spawn(this.queue.take());
  }

  get level() {
    return 1 + Math.floor(this.lines / 10);
  }
  get gravity() {
    const n = Math.min(this.level - 1, 19);
    return Math.max(1000 / (60 * 20), 1000 * (0.8 - n * 0.007) ** n);
  }

  private occupied(x: number, y: number) {
    return x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT || this.board[y][x] !== null;
  }

  fits(piece: Piece) {
    return SHAPES[piece.kind][piece.rotation].every(
      ([x, y]) => !this.occupied(piece.x + x, piece.y + y),
    );
  }

  private spawn(kind: Kind) {
    this.active = { kind, x: kind === 'O' ? 4 : 3, y: HIDDEN - 2, rotation: 0 };
    this.lockTime = this.fallTime = this.resets = 0;
    this.lastKick = null;
    if (!this.fits(this.active)) {
      this.over = true;
      return;
    }
    if (!this.grounded()) this.active.y++;
    this.lowest = this.active.y;
  }

  private grounded() {
    return !this.fits({ ...this.active, y: this.active.y + 1 });
  }

  get ghostY() {
    let y = this.active.y;
    while (this.fits({ ...this.active, y: y + 1 })) y++;
    return y;
  }

  private adjust(next: Piece, kick: number | null) {
    if (this.grounded() && this.resets < 15) {
      this.lockTime = 0;
      this.resets++;
    }
    this.active = next;
    this.lastKick = kick;
    this.trackDepth();
  }

  private trackDepth() {
    if (this.active.y > this.lowest) {
      this.lowest = this.active.y;
      this.resets = this.lockTime = 0;
    }
  }

  move(direction: 1 | -1) {
    const next = { ...this.active, x: this.active.x + direction };
    if (this.over || !this.fits(next)) return false;
    this.adjust(next, null);
    return true;
  }

  rotate(direction: 1 | -1) {
    if (this.over) return false;
    const { kind, rotation, x, y } = this.active;
    const offsets = kicks(kind, rotation, direction);
    for (let i = 0; i < offsets.length; i++) {
      const [dx, dy] = offsets[i];
      const next = { kind, rotation: (rotation + direction + 4) % 4, x: x + dx, y: y + dy };
      if (this.fits(next)) {
        this.adjust(next, i);
        return true;
      }
    }
    return false;
  }

  hold() {
    if (this.over || this.holdUsed) return false;
    const next = this.held ?? this.queue.take();
    this.held = this.active.kind;
    this.holdUsed = true;
    this.spawn(next);
    return true;
  }

  stepDown(soft = false) {
    if (this.over || this.grounded()) return false;
    this.active.y++;
    this.lastKick = null;
    this.trackDepth();
    if (soft) this.score++;
    return true;
  }

  hardDrop() {
    if (this.over) return;
    const y = this.ghostY;
    if (y > this.active.y) this.lastKick = null;
    this.score += 2 * (y - this.active.y);
    this.active.y = y;
    this.lock();
  }

  tick(ms: number, soft = false) {
    const interval = this.gravity / (soft ? 20 : 1);
    while (ms > 0 && !this.over) {
      if (this.grounded()) {
        const elapsed = Math.min(ms, Math.max(0, 500 - this.lockTime));
        this.lockTime += elapsed;
        if (this.lockTime >= 500 || this.resets >= 15) this.lock();
        ms -= elapsed;
      } else {
        const elapsed = Math.min(ms, Math.max(0, interval - this.fallTime));
        this.fallTime += elapsed;
        ms -= elapsed;
        if (this.fallTime >= interval) {
          this.fallTime = 0;
          this.stepDown(soft);
        }
      }
    }
  }

  private spin() {
    const { kind, x, y, rotation } = this.active;
    if (kind !== 'T' || this.lastKick === null) return 'none';
    const corners = [
      [0, 0],
      [2, 0],
      [2, 2],
      [0, 2],
    ].map(([dx, dy]) => this.occupied(x + dx, y + dy));
    if (corners.filter(Boolean).length < 3) return 'none';
    return (corners[rotation] && corners[(rotation + 1) % 4]) || this.lastKick === 4
      ? 'full'
      : 'mini';
  }

  private lock() {
    const { kind, rotation, x, y } = this.active;
    const spin = this.spin();
    const cells = SHAPES[kind][rotation];
    for (const [dx, dy] of cells) this.board[y + dy][x + dx] = kind;
    const rows = this.board.filter((row) => row.includes(null));
    const cleared = HEIGHT - rows.length;
    const perfect = cleared > 0 && rows.every((row) => row.every((cell) => cell === null));
    this.board = [...Array.from({ length: cleared }, emptyRow), ...rows];
    const difficult = cleared === 4 || (cleared > 0 && spin !== 'none');
    const base =
      spin === 'full'
        ? [400, 800, 1200, 1600]
        : spin === 'mini'
          ? [100, 200, 400]
          : [0, 100, 300, 500, 800];
    this.score += base[cleared] * this.level * (difficult && this.backToBack ? 1.5 : 1);
    this.combo = cleared ? this.combo + 1 : -1;
    if (this.combo > 0) this.score += 50 * this.combo * this.level;
    if (perfect) {
      const bonus = [0, 800, 1200, 1800, this.backToBack ? 3200 : 2000];
      this.score += bonus[cleared] * this.level;
    }
    if (cleared) this.backToBack = difficult;
    this.lines += cleared;
    this.holdUsed = false;
    if (cells.every(([, dy]) => y + dy < HIDDEN)) {
      this.over = true;
      return;
    }
    this.spawn(this.queue.take());
  }
}
