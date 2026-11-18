import { cells, kickTests, SevenBag } from "./pieces.js";
import type { Cell, Kind, Piece } from "./pieces.js";

export const WIDTH = 10;
export const HEIGHT = 20;
export const HIDDEN = 20;
export const LOCK_DELAY = 500;
const MOVE_LIMIT = 15;
const NEXT_COUNT = 3;
const emptyRow = (): Cell[] => Array<Cell>(WIDTH).fill(null);

export type Spin = "none" | "mini" | "full";
export interface Placement {
  rows: number[];
  points: number;
  spin: Spin;
  backToBack: boolean;
  perfect: boolean;
}

export function gravityInterval(level: number): number {
  const exponent = Math.min(level - 1, 19);
  return Math.max(1000 / (60 * 20), 1000 * (0.8 - exponent * 0.007) ** exponent);
}

export class Game {
  board = Array.from({ length: HEIGHT + HIDDEN }, emptyRow);
  active!: Piece;
  readonly next: Kind[];
  held: Kind | null = null;
  canHold = true;
  over = false;
  score = 0;
  lines = 0;
  combo = -1;
  backToBack = false;
  lastPlacement: Placement | null = null;

  private readonly bag: SevenBag;
  private fallElapsed = 0;
  private lockElapsed = 0;
  private lockMoves = 0;
  private touchedDown = false;
  private lowestY = 0;
  private lastKick = -1;

  constructor(random: () => number = Math.random) {
    this.bag = new SevenBag(random);
    this.next = Array.from({ length: NEXT_COUNT }, () => this.bag.take());
    this.spawn(this.takeNext());
  }

  get level(): number {
    return 1 + Math.floor(this.lines / 10);
  }

  private takeNext(): Kind {
    const next = this.next.shift()!;
    this.next.push(this.bag.take());
    return next;
  }

  private spawn(kind: Kind): void {
    this.active = { kind, x: 3, y: HIDDEN - 2, rotation: 0 };
    this.fallElapsed = 0;
    this.lockElapsed = 0;
    this.lockMoves = 0;
    this.lastKick = -1;
    if (!this.fits(this.active.x, this.active.y)) {
      this.over = true;
      return;
    }
    if (!this.grounded) this.active.y++;
    this.lowestY = this.active.y;
    this.touchedDown = this.grounded;
  }

  private fits(x: number, y: number, rotation = this.active.rotation): boolean {
    return cells(this.active.kind, rotation).every(([dx, dy]) => {
      const col = x + dx;
      const row = y + dy;
      return col >= 0 && col < WIDTH && row >= 0 && row < this.board.length && this.board[row][col] === null;
    });
  }

  get grounded(): boolean {
    return !this.fits(this.active.x, this.active.y + 1);
  }

  get ghostY(): number {
    let y = this.active.y;
    while (this.fits(this.active.x, y + 1)) y++;
    return y;
  }

  private updateContact(manipulated: boolean): void {
    if (this.active.y > this.lowestY) {
      this.lowestY = this.active.y;
      this.lockElapsed = 0;
      this.lockMoves = 0;
      this.touchedDown = false;
    } else if (manipulated && this.touchedDown) {
      this.lockElapsed = 0;
      this.lockMoves++;
    }
    if (this.grounded) {
      this.touchedDown = true;
      if (this.lockMoves >= MOVE_LIMIT) this.lock();
    }
  }

  move(direction: -1 | 1): boolean {
    const { x, y } = this.active;
    if (this.over || !this.fits(x + direction, y)) return false;
    this.active.x += direction;
    this.lastKick = -1;
    this.updateContact(true);
    return true;
  }

  rotate(direction: -1 | 1): boolean {
    if (this.over) return false;
    const { kind, rotation, x, y } = this.active;
    const target = (rotation + direction + 4) % 4;
    for (const [index, [dx, dy]] of kickTests(kind, rotation, target).entries()) {
      if (this.fits(x + dx, y - dy, target)) {
        this.active = { kind, x: x + dx, y: y - dy, rotation: target };
        this.lastKick = index;
        this.updateContact(true);
        return true;
      }
    }
    return false;
  }

  private descend(scored: boolean): void {
    this.active.y++;
    this.lastKick = -1;
    this.fallElapsed = 0;
    if (scored) this.score++;
    this.updateContact(false);
  }

  softDrop(): boolean {
    if (this.over || this.grounded) return false;
    this.descend(true);
    return true;
  }

  hardDrop(): void {
    if (this.over) return;
    const distance = this.ghostY - this.active.y;
    this.score += 2 * distance;
    if (distance > 0) this.lastKick = -1;
    this.active.y += distance;
    this.lock();
  }

  hold(): boolean {
    if (this.over || !this.canHold) return false;
    const incoming = this.held ?? this.takeNext();
    this.held = this.active.kind;
    this.canHold = false;
    this.spawn(incoming);
    return true;
  }

  // Spend elapsed time at the current speed. Only time after contact counts toward locking.
  advance(milliseconds: number, softDropping = false): void {
    if (!Number.isFinite(milliseconds)) return;
    let remaining = milliseconds;
    while (remaining > 0 && !this.over) {
      if (this.grounded) {
        const untilLock = LOCK_DELAY - this.lockElapsed;
        if (remaining < untilLock) {
          this.lockElapsed += remaining;
          return;
        }
        remaining -= untilLock;
        this.lock();
      } else {
        const speed = softDropping ? 20 : 1;
        const untilFall = (gravityInterval(this.level) - this.fallElapsed) / speed;
        if (remaining < untilFall) {
          this.fallElapsed += remaining * speed;
          return;
        }
        remaining -= untilFall;
        this.descend(softDropping);
      }
    }
  }

  private spinType(): Spin {
    if (this.active.kind !== "T" || this.lastKick < 0) return "none";
    // Clockwise order from top left. The first two corners face north at rotation zero.
    const corners = [[0, 0], [2, 0], [2, 2], [0, 2]].map(([dx, dy]) => {
      const col = this.active.x + dx;
      const row = this.active.y + dy;
      return this.board[row]?.[col] !== null;
    });
    if (corners.filter(Boolean).length < 3) return "none";
    const front = this.active.rotation;
    return (corners[front] && corners[(front + 1) % 4]) || this.lastKick === 4 ? "full" : "mini";
  }

  private lock(): void {
    const { kind, x, y, rotation } = this.active;
    const spin = this.spinType();
    const blocks = cells(kind, rotation);
    for (const [dx, dy] of blocks) this.board[y + dy][x + dx] = kind;

    const rows: number[] = [];
    const survivors = this.board.filter((row, index) => {
      if (row.includes(null)) return true;
      rows.push(index);
      return false;
    });
    if (rows.length) this.board = [...rows.map(emptyRow), ...survivors];
    this.lastPlacement = this.scorePlacement(rows, spin);
    this.canHold = true;
    if (blocks.every(([, dy]) => y + dy < HIDDEN)) {
      this.over = true;
    } else {
      this.spawn(this.takeNext());
    }
  }

  private scorePlacement(rows: number[], spin: Spin): Placement {
    const count = rows.length;
    const difficult = count === 4 || (count > 0 && spin !== "none");
    const bonus = difficult && this.backToBack;
    const perfect = count > 0 && this.board.every(row => row.every(cell => cell === null));
    const base = {
      none: [0, 100, 300, 500, 800],
      mini: [100, 200, 400],
      full: [400, 800, 1200, 1600],
    }[spin][count];
    this.combo = count ? this.combo + 1 : -1;
    let points = base * (bonus ? 1.5 : 1) + Math.max(0, this.combo) * 50;
    if (perfect) points += [0, 800, 1200, 1800, bonus ? 3200 : 2000][count];
    points *= this.level;
    this.score += points;
    this.lines += count;
    if (count) this.backToBack = difficult;
    return { rows, points, spin, backToBack: bonus, perfect };
  }
}
