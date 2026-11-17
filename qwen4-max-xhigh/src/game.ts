// Core game logic: pure TypeScript, no DOM. Driven by update(dt) and input actions.

import {
  CLEAR_ANIM_MS,
  COLS,
  HIDDEN_ROWS,
  LINES_PER_LEVEL,
  LOCK_DELAY_MS,
  MAX_LOCK_RESETS,
  NEXT_COUNT,
  ROWS,
  SOFT_DROP_FACTOR,
} from './constants.js';
import { ROTATIONS, SPAWN, kicksFor, type Cell, type PieceType, type Rotation } from './pieces.js';
import { Bag } from './random.js';
import { createBoard, fullRows, removeRows, type Board } from './board.js';

export interface ActivePiece {
  type: PieceType;
  rot: Rotation;
  x: number; // bounding-box top-left on the board
  y: number;
}

export type GameState = 'playing' | 'clearing' | 'over';
export type TSpin = 'none' | 'mini' | 'full';

const CLEAR_NAMES = ['', 'SINGLE', 'DOUBLE', 'TRIPLE', 'TETRIS'];
const LINE_SCORES = [0, 100, 300, 500, 800];
const TSPIN_SCORES = [400, 800, 1200, 1600];
const MINI_SCORES = [100, 200, 400];
const PERFECT_CLEAR_SCORES = [0, 800, 1200, 1800, 2000];
const B2B_TETRIS_PERFECT_CLEAR = 3200;

// Corners of the T's 3x3 box: TL, TR, BL, BR. "Front" corners are the two
// adjacent to the direction the T points in its current rotation.
const T_CORNERS: readonly Cell[] = [[0, 0], [2, 0], [0, 2], [2, 2]];
const T_FRONT: Record<Rotation, readonly [number, number]> = {
  0: [0, 1],
  1: [1, 3],
  2: [2, 3],
  3: [0, 2],
};

export class Game {
  board: Board = createBoard();
  current!: ActivePiece;
  queue: PieceType[] = [];
  hold: PieceType | null = null;
  holdUsed = false;

  score = 0;
  lines = 0;
  level = 1;
  combo = -1; // consecutive clearing pieces; -1 means no chain
  b2b = false; // back-to-back difficult clears

  state: GameState = 'playing';
  message = '';
  messageTimer = 0;
  clearingRows: number[] = [];
  clearTimer = 0;

  private bag: Bag;
  private gravityAcc = 0;
  private lockTimer = 0;
  private lockResets = 0;
  private lowestY = 0; // lowest row reached; reaching a new one refreshes lock resets
  private lastRotation = false; // last successful action was a rotation (T-spin rule)
  private lastKick = 0; // index of the wall-kick test that succeeded

  constructor(rng: () => number = Math.random) {
    this.bag = new Bag(rng);
    this.reset();
  }

  reset(): void {
    this.board = createBoard();
    this.queue = [];
    this.hold = null;
    this.holdUsed = false;
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.combo = -1;
    this.b2b = false;
    this.state = 'playing';
    this.message = '';
    this.messageTimer = 0;
    this.clearingRows = [];
    this.clearTimer = 0;
    this.spawn();
  }

  // --- public actions -------------------------------------------------------

  move(dx: number): boolean {
    if (this.state !== 'playing' || this.collides(this.current, dx, 0)) return false;
    this.current.x += dx;
    this.lastRotation = false;
    this.refreshLock();
    return true;
  }

  rotate(dir: 1 | -1): boolean {
    if (this.state !== 'playing') return false;
    const p = this.current;
    if (p.type === 'O') return false;
    const to = ((p.rot + dir + 4) % 4) as Rotation;
    const tests = kicksFor(p.type, p.rot, to);
    for (let i = 0; i < tests.length; i++) {
      const [dx, dy] = tests[i];
      if (!this.collides(p, dx, dy, to)) {
        p.x += dx;
        p.y += dy;
        p.rot = to;
        this.lastRotation = true;
        this.lastKick = i;
        this.refreshLock();
        return true;
      }
    }
    return false;
  }

  // One soft-drop step. Returns false when grounded.
  softDrop(): boolean {
    if (this.state !== 'playing' || this.grounded()) return false;
    this.current.y++;
    this.score += 1;
    this.gravityAcc = 0;
    this.refreshLock();
    return true;
  }

  hardDrop(): void {
    if (this.state !== 'playing') return;
    let dist = 0;
    while (!this.collides(this.current, 0, 1)) {
      this.current.y++;
      dist++;
    }
    this.score += 2 * dist;
    this.lastRotation = false;
    this.lock();
  }

  holdPiece(): void {
    if (this.state !== 'playing' || this.holdUsed) return;
    const type = this.current.type;
    if (this.hold === null) {
      this.hold = type;
      this.spawn();
    } else {
      const held = this.hold;
      this.hold = type;
      this.spawn(held);
    }
    this.holdUsed = true;
  }

  ghostY(): number {
    let dy = 0;
    while (!this.collides(this.current, 0, dy + 1)) dy++;
    return this.current.y + dy;
  }

  // Advances gravity, lock delay and the line-clear animation.
  update(dt: number, softDrop = false): void {
    if (this.messageTimer > 0) this.messageTimer = Math.max(0, this.messageTimer - dt);

    if (this.state === 'clearing') {
      this.clearTimer -= dt;
      if (this.clearTimer <= 0) {
        removeRows(this.board, this.clearingRows);
        this.clearingRows = [];
        this.state = 'playing';
        this.spawn();
      }
      return;
    }
    if (this.state !== 'playing') return;

    // Grounded for the whole frame: only the lock delay advances.
    if (this.grounded()) {
      this.gravityAcc = 0;
      this.lockTimer += dt;
      if (this.lockTimer >= LOCK_DELAY_MS) this.lock();
      return;
    }

    const interval = this.gravityMs() / (softDrop ? SOFT_DROP_FACTOR : 1);
    this.gravityAcc += dt;
    this.lockTimer = 0;
    while (this.gravityAcc >= interval) {
      this.current.y++;
      if (softDrop) this.score++;
      this.gravityAcc -= interval;
      this.refreshLock();
      if (this.grounded()) {
        // Land mid-frame: the lock delay only runs for the remaining time.
        this.lockTimer = this.gravityAcc;
        this.gravityAcc = 0;
        if (this.lockTimer >= LOCK_DELAY_MS) this.lock();
        return;
      }
    }
  }

  collides(p: ActivePiece, dx = 0, dy = 0, rot: Rotation = p.rot): boolean {
    for (const [x, y] of this.cellsOf(p, dx, dy, rot)) {
      if (x < 0 || x >= COLS || y >= ROWS) return true;
      if (y >= 0 && this.board[y][x] !== null) return true;
    }
    return false;
  }

  grounded(): boolean {
    return this.collides(this.current, 0, 1);
  }

  // --- internals ------------------------------------------------------------

  private cellsOf(p: ActivePiece, dx = 0, dy = 0, rot: Rotation = p.rot): Cell[] {
    return ROTATIONS[p.type][rot].map(([cx, cy]): Cell => [p.x + cx + dx, p.y + cy + dy]);
  }

  private refillQueue(): void {
    while (this.queue.length < NEXT_COUNT + 1) this.queue.push(this.bag.next());
  }

  private spawn(type?: PieceType): void {
    this.refillQueue();
    const t = type ?? this.queue.shift()!;
    this.refillQueue();
    const s = SPAWN[t];
    this.current = { type: t, rot: 0, x: s.x, y: s.y };
    this.holdUsed = false;
    this.gravityAcc = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lowestY = this.current.y;
    this.lastRotation = false;
    this.lastKick = 0;
    if (this.collides(this.current)) this.state = 'over'; // block out
  }

  // Guideline gravity: (0.8 - (level-1)*0.007)^(level-1) seconds per row,
  // capped at 20G (20 rows per 60fps frame).
  private gravityMs(): number {
    const base = Math.max(0.8 - (this.level - 1) * 0.007, 0.0005);
    const ms = 1000 * Math.pow(base, this.level - 1);
    return Math.max(ms, 1000 / 1200);
  }

  // Move-reset lock delay: a successful move/rotation while grounded restarts
  // the 500ms timer, at most 15 times. Reaching a new lowest row refreshes all.
  private refreshLock(): void {
    if (this.current.y > this.lowestY) {
      this.lowestY = this.current.y;
      this.lockResets = 0;
      this.lockTimer = 0;
    } else if (this.grounded() && this.lockResets < MAX_LOCK_RESETS) {
      this.lockResets++;
      this.lockTimer = 0;
    }
  }

  private lock(): void {
    const p = this.current;
    const cells = this.cellsOf(p);
    const tspin = this.detectTSpin();
    for (const [x, y] of cells) {
      if (y >= 0) this.board[y][x] = p.type;
    }
    // Lock out: the piece locked entirely above the visible field.
    if (cells.every(([, y]) => y < HIDDEN_ROWS)) {
      this.state = 'over';
      return;
    }

    const rows = fullRows(this.board);
    const n = rows.length;
    this.combo = n > 0 ? this.combo + 1 : -1;
    this.scoreClear(n, tspin, rows);
    this.lines += n;
    this.level = Math.floor(this.lines / LINES_PER_LEVEL) + 1;

    if (n > 0) {
      this.state = 'clearing';
      this.clearingRows = rows;
      this.clearTimer = CLEAR_ANIM_MS;
    } else {
      this.spawn();
    }
  }

  // Three-corner T-spin rule: the last successful action must be a rotation
  // and 3 of the 4 corners around the T's center must be occupied. Both front
  // corners filled => full T-spin; otherwise mini, upgraded to full when the
  // rotation used the 5th kick test.
  private detectTSpin(): TSpin {
    const p = this.current;
    if (p.type !== 'T' || !this.lastRotation) return 'none';
    const filled = T_CORNERS.map(([cx, cy]) => {
      const x = p.x + cx;
      const y = p.y + cy;
      return x < 0 || x >= COLS || y < 0 || y >= ROWS || this.board[y][x] !== null;
    });
    if (filled.filter(Boolean).length < 3) return 'none';
    const [a, b] = T_FRONT[p.rot];
    if (filled[a] && filled[b]) return 'full';
    return this.lastKick === 4 ? 'full' : 'mini';
  }

  private scoreClear(n: number, tspin: TSpin, rows: number[]): void {
    if (n === 0 && tspin === 'none') return;

    let base: number;
    let label: string;
    if (tspin === 'full') {
      base = TSPIN_SCORES[n];
      label = n > 0 ? `T-SPIN ${CLEAR_NAMES[n]}` : 'T-SPIN';
    } else if (tspin === 'mini') {
      base = MINI_SCORES[Math.min(n, 2)];
      label = n > 0 ? `T-SPIN MINI ${CLEAR_NAMES[n]}` : 'T-SPIN MINI';
    } else {
      base = LINE_SCORES[n];
      label = CLEAR_NAMES[n];
    }

    const difficult = n > 0 && (tspin !== 'none' || n === 4);
    const wasB2B = difficult && this.b2b;
    let pts = base * this.level;

    if (n > 0) {
      if (difficult) {
        if (this.b2b) pts = Math.floor(pts * 1.5);
        this.b2b = true;
      } else {
        this.b2b = false;
      }
      if (this.combo > 0) pts += 50 * this.combo * this.level;
      if (this.isPerfectClear(rows)) {
        pts += (n === 4 && wasB2B ? B2B_TETRIS_PERFECT_CLEAR : PERFECT_CLEAR_SCORES[n]) * this.level;
        label = 'PERFECT CLEAR';
      }
    }

    this.score += pts;
    this.message =
      label + (wasB2B ? ' · B2B' : '') + (this.combo > 0 ? ` · ${this.combo} COMBO` : '');
    this.messageTimer = 1600;
  }

  private isPerfectClear(rows: number[]): boolean {
    const cleared = new Set(rows);
    return this.board.every((row, y) => cleared.has(y) || row.every((cell) => cell === null));
  }
}
