// Pure game logic, independent of rendering and input.
import { Bag, kicks, PieceType, SHAPES } from "./pieces.js";

export const COLS = 10;
export const VISIBLE_ROWS = 20;
export const ROWS = 40; // 20 hidden buffer rows above the visible field
export const HIDDEN_ROWS = ROWS - VISIBLE_ROWS;
export const NEXT_COUNT = 5;
const LOCK_DELAY = 500; // ms
const MAX_LOCK_RESETS = 15;
const SOFT_DROP_FACTOR = 20;

export interface Piece {
  type: PieceType;
  x: number;
  y: number;
  rot: number;
}

export type Board = (PieceType | null)[][];

export interface ClearEvent {
  lines: number;
  tSpin: "none" | "mini" | "full";
  points: number;
  backToBack: boolean;
  combo: number;
}

/** Seconds per row for a given level (Guideline formula). */
export function gravityInterval(level: number): number {
  return Math.pow(0.8 - (level - 1) * 0.007, level - 1) * 1000;
}

export class Game {
  board: Board = [];
  current!: Piece;
  hold: PieceType | null = null;
  canHold = true;
  queue: PieceType[] = [];
  score = 0;
  lines = 0;
  level = 1;
  combo = -1;
  backToBack = false;
  gameOver = false;
  softDrop = false;
  lastClear: ClearEvent | null = null;

  private bag: Bag;
  private fallTimer = 0;
  private lockTimer = 0;
  private lockResets = 0;
  private lowestY = 0;
  private lastMoveWasRotation = false;
  private lastKickIndex = 0;

  constructor(private random: () => number = Math.random) {
    this.bag = new Bag(random);
    this.reset();
  }

  reset(): void {
    this.board = Array.from({ length: ROWS }, () => Array<PieceType | null>(COLS).fill(null));
    this.bag = new Bag(this.random);
    this.queue = [];
    for (let i = 0; i < NEXT_COUNT; i++) this.queue.push(this.bag.next());
    Object.assign(this, { hold: null, canHold: true, score: 0, lines: 0, level: 1,
      combo: -1, backToBack: false, gameOver: false, softDrop: false, lastClear: null });
    this.spawn(this.takeNext());
  }

  // --- Queries ---------------------------------------------------------

  cells(p: Piece): [number, number][] {
    return SHAPES[p.type][p.rot].map(([cx, cy]) => [p.x + cx, p.y + cy]);
  }

  fits(p: Piece): boolean {
    return this.cells(p).every(([x, y]) =>
      x >= 0 && x < COLS && y >= 0 && y < ROWS && this.board[y][x] === null);
  }

  ghost(): Piece {
    const g = { ...this.current };
    while (this.fits({ ...g, y: g.y + 1 })) g.y++;
    return g;
  }

  private onGround(): boolean {
    return !this.fits({ ...this.current, y: this.current.y + 1 });
  }

  // --- Actions ---------------------------------------------------------

  move(dx: number): boolean {
    if (this.gameOver) return false;
    const p = { ...this.current, x: this.current.x + dx };
    if (!this.fits(p)) return false;
    this.current = p;
    this.lastMoveWasRotation = false;
    this.onMoved();
    return true;
  }

  rotate(dir: 1 | -1): boolean {
    if (this.gameOver) return false;
    const from = this.current.rot;
    const to = (from + dir + 4) % 4;
    const tests = kicks(this.current.type, from, to);
    for (let i = 0; i < tests.length; i++) {
      const [dx, dy] = tests[i];
      const p = { ...this.current, rot: to, x: this.current.x + dx, y: this.current.y + dy };
      if (this.fits(p)) {
        this.current = p;
        this.lastMoveWasRotation = true;
        this.lastKickIndex = i;
        this.onMoved();
        return true;
      }
    }
    return false;
  }

  hardDrop(): void {
    if (this.gameOver) return;
    const g = this.ghost();
    const dist = g.y - this.current.y;
    if (dist > 0) this.lastMoveWasRotation = false;
    this.score += dist * 2;
    this.current = g;
    this.lock();
  }

  holdPiece(): void {
    if (this.gameOver || !this.canHold) return;
    const type = this.current.type;
    const next = this.hold ?? this.takeNext();
    this.hold = type;
    this.canHold = false;
    this.spawn(next);
  }

  /** Advance the simulation by dt milliseconds. */
  update(dt: number): void {
    if (this.gameOver) return;
    const interval = gravityInterval(this.level) / (this.softDrop ? SOFT_DROP_FACTOR : 1);
    this.fallTimer += dt;
    while (this.fallTimer >= interval && !this.onGround()) {
      this.fallTimer -= interval;
      this.current.y++;
      this.lastMoveWasRotation = false;
      if (this.softDrop) this.score += 1;
      this.trackLowest();
    }
    if (this.onGround()) {
      this.fallTimer = 0;
      this.lockTimer += dt;
      if (this.lockTimer >= LOCK_DELAY) this.lock();
    }
  }

  // --- Internals -------------------------------------------------------

  private takeNext(): PieceType {
    this.queue.push(this.bag.next());
    return this.queue.shift()!;
  }

  private spawn(type: PieceType): void {
    const box = type === "I" ? 4 : type === "O" ? 2 : 3;
    // Spawn in the two rows just above the visible field, centered (left-biased).
    const x = Math.floor((COLS - box) / 2);
    const yOffset = type === "I" ? 1 : 0;
    this.current = { type, x, y: HIDDEN_ROWS - 2 - yOffset, rot: 0 };
    this.fallTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lastMoveWasRotation = false;
    this.lowestY = this.current.y;
    if (!this.fits(this.current)) {
      this.gameOver = true; // block out
      return;
    }
    // Guideline: drop one row immediately if possible.
    if (!this.onGround()) {
      this.current.y++;
      this.lowestY = this.current.y;
    }
  }

  private trackLowest(): void {
    if (this.current.y > this.lowestY) {
      this.lowestY = this.current.y;
      this.lockResets = 0;
    }
  }

  /** Move-reset lock delay, limited to MAX_LOCK_RESETS moves per lowest row. */
  private onMoved(): void {
    this.trackLowest();
    if (this.lockResets < MAX_LOCK_RESETS) {
      this.lockTimer = 0;
      this.lockResets++;
    } else if (this.onGround()) {
      this.lock();
    }
  }

  /** 3-corner T-spin detection. */
  private detectTSpin(): "none" | "mini" | "full" {
    const p = this.current;
    if (p.type !== "T" || !this.lastMoveWasRotation) return "none";
    const filled = (x: number, y: number) =>
      x < 0 || x >= COLS || y >= ROWS || (y >= 0 && this.board[y][x] !== null);
    // Corners of the 3x3 box: TL, TR, BR, BL
    const corners = [[0, 0], [2, 0], [2, 2], [0, 2]].map(([cx, cy]) => filled(p.x + cx, p.y + cy));
    if (corners.filter(Boolean).length < 3) return "none";
    // Front corners are the two on the side the T points to.
    const front = [corners[p.rot], corners[(p.rot + 1) % 4]];
    if ((front[0] && front[1]) || this.lastKickIndex === 4) return "full";
    return "mini";
  }

  private lock(): void {
    const tSpin = this.detectTSpin();
    const cells = this.cells(this.current);
    for (const [x, y] of cells) this.board[y][x] = this.current.type;

    // Lock out: piece locked entirely above the visible field.
    const lockOut = cells.every(([, y]) => y < HIDDEN_ROWS);

    const full = [];
    for (let y = 0; y < ROWS; y++) if (this.board[y].every((c) => c !== null)) full.push(y);
    for (const y of full) {
      this.board.splice(y, 1);
      this.board.unshift(Array<PieceType | null>(COLS).fill(null));
    }
    this.scoreClear(full.length, tSpin);

    if (lockOut) {
      this.gameOver = true;
      return;
    }
    this.canHold = true;
    this.spawn(this.takeNext());
  }

  private scoreClear(n: number, tSpin: "none" | "mini" | "full"): void {
    const TABLE = {
      none: [0, 100, 300, 500, 800],
      mini: [100, 200, 400, 400, 400],
      full: [400, 800, 1200, 1600, 1600],
    };
    let points = TABLE[tSpin][n] * this.level;
    const difficult = n === 4 || (tSpin !== "none" && n > 0);
    let b2b = false;
    if (n > 0) {
      if (difficult && this.backToBack) {
        points = Math.floor(points * 1.5);
        b2b = true;
      }
      this.backToBack = difficult;
      this.combo++;
      if (this.combo > 0) points += 50 * this.combo * this.level;
    } else {
      this.combo = -1;
    }
    this.score += points;
    this.lines += n;
    this.level = Math.floor(this.lines / 10) + 1;
    this.lastClear = points > 0 ? { lines: n, tSpin, points, backToBack: b2b, combo: this.combo } : this.lastClear;
  }
}
