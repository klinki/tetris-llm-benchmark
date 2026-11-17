import { bounds, KINDS, shape, type Kind, type Point } from './pieces.js';

export const WIDTH = 11;
export const HEIGHT = 18;
export const LOCK_DELAY = 450;
const LOCK_RESETS = 8;
const KICKS: readonly Point[] = [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1], [-2, 0], [2, 0], [-1, -1], [1, -1]];

export type Piece = { kind: Kind; x: number; y: number; turn: number };
type Cell = Kind | null;

export function* sevenBag(random: () => number = Math.random): Generator<Kind, never> {
  for (;;) {
    const bag = [...KINDS];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    yield* bag;
  }
}

export class Game {
  readonly board: Cell[][] = Array.from({ length: HEIGHT }, () => Array<Cell>(WIDTH).fill(null));
  active: Piece;
  held: Kind | null = null;
  canHold = true;
  over = false;
  score = 0;
  lines = 0;
  streak = 0;

  private readonly bag: Generator<Kind, never>;
  private readonly queue: Kind[] = [];
  private fallTime = 0;
  private lockTime = 0;
  private lockResets = 0;

  constructor(random?: () => number) {
    this.bag = sevenBag(random);
    this.active = this.spawn(this.takeNext());
  }

  get next(): readonly Kind[] {
    return this.queue;
  }

  get level(): number {
    return 1 + Math.floor(this.lines / 6);
  }

  get gravity(): number {
    return Math.max(85, 860 * 0.8 ** (this.level - 1));
  }

  get landing(): Piece {
    const piece = { ...this.active };
    while (this.fits(piece, piece.x, piece.y + 1)) piece.y++;
    return piece;
  }

  get grounded(): boolean {
    return !this.fits(this.active, this.active.x, this.active.y + 1);
  }

  move(direction: -1 | 1): boolean {
    const { x, y } = this.active;
    return this.adjust(x + direction, y, this.active.turn);
  }

  rotate(direction: -1 | 1): boolean {
    const { kind, x, y, turn } = this.active;
    if (kind === 'cross') return false;
    const target = (turn + direction + 4) % 4;
    for (const [dx, dy] of KICKS) {
      if (this.adjust(x + dx, y + dy, target)) return true;
    }
    return false;
  }

  softDrop(): boolean {
    if (this.over || !this.descend()) return false;
    this.score++;
    return true;
  }

  hardDrop(): boolean {
    if (this.over) return false;
    const landing = this.landing;
    this.score += (landing.y - this.active.y) * 2;
    this.active = landing;
    this.lock();
    return true;
  }

  hold(): boolean {
    if (this.over || !this.canHold) return false;
    const replacement = this.held ?? this.takeNext();
    this.held = this.active.kind;
    this.active = this.spawn(replacement);
    this.canHold = false;
    return true;
  }

  advance(elapsed: number): boolean {
    let changed = false;
    while (elapsed > 0 && !this.over) {
      if (this.grounded) {
        const untilLock = LOCK_DELAY - this.lockTime;
        if (elapsed < untilLock) {
          this.lockTime += elapsed;
          break;
        }
        elapsed -= untilLock;
        this.lock();
      } else {
        const untilFall = this.gravity - this.fallTime;
        if (elapsed < untilFall) {
          this.fallTime += elapsed;
          break;
        }
        elapsed -= untilFall;
        this.descend();
      }
      changed = true;
    }
    return changed;
  }

  private takeNext(): Kind {
    while (this.queue.length < 4) this.queue.push(this.bag.next().value);
    return this.queue.shift()!;
  }

  private spawn(kind: Kind): Piece {
    const { left, right, top } = bounds(shape(kind));
    const piece = { kind, x: Math.floor((WIDTH - (right - left + 1)) / 2) - left, y: Math.abs(top), turn: 0 };
    this.fallTime = 0;
    this.lockTime = 0;
    this.lockResets = 0;
    this.over = !this.fits(piece);
    return piece;
  }

  private fits(piece: Piece, x = piece.x, y = piece.y, turn = piece.turn): boolean {
    return shape(piece.kind, turn).every(([dx, dy]) => {
      const column = x + dx;
      const row = y + dy;
      return column >= 0 && column < WIDTH && row >= 0 && row < HEIGHT && this.board[row][column] === null;
    });
  }

  private adjust(x: number, y: number, turn: number): boolean {
    if (this.over || !this.fits(this.active, x, y, turn)) return false;
    if (this.grounded && this.lockResets < LOCK_RESETS) {
      this.lockTime = 0;
      this.lockResets++;
    }
    Object.assign(this.active, { x, y, turn });
    return true;
  }

  private descend(): boolean {
    if (this.grounded) return false;
    this.active.y++;
    this.fallTime = 0;
    return true;
  }

  private lock(): void {
    const { kind, x, y, turn } = this.active;
    for (const [dx, dy] of shape(kind, turn)) this.board[y + dy][x + dx] = kind;

    const remaining = this.board.filter((row) => row.includes(null));
    const cleared = HEIGHT - remaining.length;
    if (cleared > 0) {
      this.streak++;
      this.score += (100 * cleared ** 2 + 50 * (this.streak - 1)) * this.level;
      this.lines += cleared;
      const empty = Array.from({ length: cleared }, () => Array<Cell>(WIDTH).fill(null));
      this.board.splice(0, HEIGHT, ...empty, ...remaining);
    } else {
      this.streak = 0;
    }

    this.canHold = true;
    this.active = this.spawn(this.takeNext());
  }
}
