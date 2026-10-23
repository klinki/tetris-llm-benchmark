import { PIECE_TYPES, PieceType, Rotation, ROTATIONS, kicks } from "./pieces.js";

export const COLS = 10;
export const VISIBLE_ROWS = 20;
/** Two hidden rows above the visible field, where pieces spawn. */
export const HIDDEN_ROWS = 2;
export const ROWS = VISIBLE_ROWS + HIDDEN_ROWS;

const LOCK_DELAY_MS = 500;
const MAX_LOCK_RESETS = 15;
const SOFT_DROP_FACTOR = 20;
const NEXT_COUNT = 5;
const LINE_SCORES = [0, 100, 300, 500, 800];

export interface Piece {
  type: PieceType;
  rotation: Rotation;
  x: number;
  y: number;
}

export type Cell = PieceType | null;

export class Game {
  board: Cell[][] = [];
  current!: Piece;
  hold: PieceType | null = null;
  next: PieceType[] = [];
  score = 0;
  lines = 0;
  level = 1;
  gameOver = false;

  private bag: PieceType[] = [];
  private canHold = true;
  private softDropping = false;
  private gravityAcc = 0;
  private lockTimer = 0;
  private lockResets = 0;
  private lowestY = 0;

  constructor(private random: () => number = Math.random) {
    this.restart();
  }

  restart(): void {
    this.board = Array.from({ length: ROWS }, () => new Array<Cell>(COLS).fill(null));
    this.hold = null;
    this.next = [];
    this.bag = [];
    this.score = this.lines = 0;
    this.level = 1;
    this.gameOver = false;
    this.canHold = true;
    this.softDropping = false;
    while (this.next.length < NEXT_COUNT) this.next.push(this.drawFromBag());
    this.spawn(this.next.shift()!);
  }

  /** Seconds a piece takes to fall one row (Guideline gravity curve). */
  get dropInterval(): number {
    return Math.pow(0.8 - (this.level - 1) * 0.007, this.level - 1) * 1000;
  }

  /** Cells of a piece in board coordinates. */
  cells(p: Piece): [number, number][] {
    const out: [number, number][] = [];
    ROWS_OF(p).forEach((row, dy) => row.forEach((v, dx) => v && out.push([p.x + dx, p.y + dy])));
    return out;
  }

  /** The position where the current piece would land on a hard drop. */
  ghost(): Piece {
    const g = { ...this.current };
    while (this.fits({ ...g, y: g.y + 1 })) g.y++;
    return g;
  }

  update(dtMs: number): void {
    if (this.gameOver) return;
    const interval = this.softDropping ? this.dropInterval / SOFT_DROP_FACTOR : this.dropInterval;
    this.gravityAcc += dtMs;
    while (this.gravityAcc >= interval) {
      this.gravityAcc -= interval;
      if (!this.step(this.softDropping ? 1 : 0)) {
        this.gravityAcc = 0;
        break;
      }
    }
    if (this.onGround()) {
      this.lockTimer += dtMs;
      if (this.lockTimer >= LOCK_DELAY_MS) this.lock();
    } else {
      this.lockTimer = 0;
    }
  }

  move(dx: number): boolean {
    if (this.gameOver) return false;
    const moved = { ...this.current, x: this.current.x + dx };
    if (!this.fits(moved)) return false;
    this.current = moved;
    this.resetLockDelay();
    return true;
  }

  /** dir: 1 clockwise, -1 anti-clockwise. */
  rotate(dir: 1 | -1): boolean {
    if (this.gameOver) return false;
    const c = this.current;
    const to = ((c.rotation + dir + 4) % 4) as Rotation;
    for (const [kx, ky] of kicks(c.type, c.rotation, to)) {
      const candidate = { ...c, rotation: to, x: c.x + kx, y: c.y + ky };
      if (this.fits(candidate)) {
        this.current = candidate;
        this.resetLockDelay();
        return true;
      }
    }
    return false;
  }

  setSoftDrop(on: boolean): void {
    this.softDropping = on;
  }

  hardDrop(): void {
    if (this.gameOver) return;
    const g = this.ghost();
    this.score += 2 * (g.y - this.current.y);
    this.current = g;
    this.lock();
  }

  holdPiece(): void {
    if (this.gameOver || !this.canHold) return;
    const type = this.current.type;
    const incoming = this.hold ?? this.next.shift()!;
    if (this.hold === null) this.next.push(this.drawFromBag());
    this.hold = type;
    this.spawn(incoming);
    this.canHold = false;
  }

  private fits(p: Piece): boolean {
    return this.cells(p).every(([x, y]) => x >= 0 && x < COLS && y < ROWS && (y < 0 || !this.board[y][x]));
  }

  private onGround(): boolean {
    return !this.fits({ ...this.current, y: this.current.y + 1 });
  }

  /** Try to move down one row; awards soft drop points. */
  private step(points: number): boolean {
    const moved = { ...this.current, y: this.current.y + 1 };
    if (!this.fits(moved)) return false;
    this.current = moved;
    this.score += points;
    if (moved.y > this.lowestY) {
      this.lowestY = moved.y;
      this.lockResets = 0; // falling to a new lowest row restarts the lock budget
    }
    return true;
  }

  private resetLockDelay(): void {
    if (this.onGround() && this.lockResets < MAX_LOCK_RESETS) {
      this.lockResets++;
      this.lockTimer = 0;
    }
  }

  private lock(): void {
    for (const [x, y] of this.cells(this.current)) if (y >= 0) this.board[y][x] = this.current.type;
    this.clearLines();
    this.canHold = true;
    this.spawn(this.next.shift()!);
    this.next.push(this.drawFromBag());
  }

  private clearLines(): void {
    const kept = this.board.filter((row) => row.some((c) => !c));
    const cleared = ROWS - kept.length;
    if (!cleared) return;
    while (kept.length < ROWS) kept.unshift(new Array<Cell>(COLS).fill(null));
    this.board = kept;
    this.score += LINE_SCORES[cleared] * this.level;
    this.lines += cleared;
    this.level = Math.floor(this.lines / 10) + 1;
  }

  private spawn(type: PieceType): void {
    const width = ROTATIONS[type][0].length;
    this.current = { type, rotation: 0, x: Math.floor((COLS - width) / 2), y: 1 };
    this.gravityAcc = this.lockTimer = this.lockResets = 0;
    this.lowestY = this.current.y;
    if (!this.fits(this.current)) {
      this.gameOver = true;
      return;
    }
    this.step(0); // pieces drop one row immediately when there is room
  }

  /** 7-bag randomizer. */
  private drawFromBag(): PieceType {
    if (this.bag.length === 0) {
      this.bag = [...PIECE_TYPES];
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
      }
    }
    return this.bag.pop()!;
  }
}

function ROWS_OF(p: Piece): number[][] {
  return ROTATIONS[p.type][p.rotation];
}
