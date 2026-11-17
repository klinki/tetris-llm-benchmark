/** Core Tetris game logic. Pure state + rules, no DOM, so it can run
 *  headlessly in tests. Implements the Tetris Guideline: 7-bag randomizer,
 *  SRS wall kicks, ghost piece, hold, next queue, lock delay with move
 *  reset, Guideline scoring / gravity, and top-out. */

import {
  COLS, ROWS, HIDDEN, LOCK_DELAY, MAX_LOCK_RESETS, NEXT_COUNT,
} from './constants.js';
import { SHAPES, SPAWN_X, pieceId, type PieceType } from './pieces.js';
import { kicksFor } from './srs.js';
import { Bag } from './bag.js';

export interface ActivePiece {
  type: PieceType;
  rot: number;
  x: number;
  y: number;
}

export type TSpin = 'none' | 'mini' | 'full';

export class Game {
  /** Row-major playfield; 0 = empty, otherwise piece id (see pieces.ts). */
  readonly board = new Uint8Array(COLS * ROWS);
  current: ActivePiece | null = null;
  hold: PieceType | null = null;
  readonly queue: PieceType[] = [];

  score = 0;
  lines = 0;
  level = 1;
  combo = -1;
  b2b = false;
  over = false;

  /** Transient label for the last scoring event ("TETRIS", "T-SPIN DOUBLE"...). */
  message = '';
  messageTimer = 0;

  private readonly bag: Bag;
  private holdUsed = false;
  private gravityTimer = 0;
  private lockTimer = 0;
  private lockResets = 0;
  private lowestY = 0;
  private lastRotation = false;
  private lastKick = 0;

  constructor(rng: () => number = Math.random) {
    this.bag = new Bag(rng);
    this.restart();
  }

  restart(): void {
    this.board.fill(0);
    this.queue.length = 0;
    this.hold = null;
    this.holdUsed = false;
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.combo = -1;
    this.b2b = false;
    this.over = false;
    this.message = '';
    this.messageTimer = 0;
    this.spawn();
  }

  /** Guideline gravity: seconds per row = (0.8 - (level-1)*0.007)^(level-1). */
  gravityMs(): number {
    return Math.pow(0.8 - (this.level - 1) * 0.007, this.level - 1) * 1000;
  }

  /** True when a cell is blocked. Space above the field (y < 0) is open;
   *  walls and the floor are solid. */
  private blocked(x: number, y: number): boolean {
    if (x < 0 || x >= COLS || y >= ROWS) return true;
    return y >= 0 && this.board[y * COLS + x] !== 0;
  }

  collides(type: PieceType, rot: number, x: number, y: number): boolean {
    for (const [cx, cy] of SHAPES[type][rot]) {
      if (this.blocked(x + cx, y + cy)) return true;
    }
    return false;
  }

  private grounded(): boolean {
    const p = this.current;
    return p !== null && this.collides(p.type, p.rot, p.x, p.y + 1);
  }

  /** Landing row of the current piece (the ghost piece position). */
  ghostY(): number {
    const p = this.current!;
    let y = p.y;
    while (!this.collides(p.type, p.rot, p.x, y + 1)) y++;
    return y;
  }

  move(dx: number): boolean {
    const p = this.current;
    if (this.over || p === null) return false;
    if (this.collides(p.type, p.rot, p.x + dx, p.y)) return false;
    p.x += dx;
    this.lastRotation = false;
    this.resetLockOnAction();
    return true;
  }

  rotate(dir: 1 | -1): boolean {
    const p = this.current;
    if (this.over || p === null) return false;
    const to = (p.rot + dir + 4) % 4;
    const kicks = kicksFor(p.type, p.rot, dir);
    for (let i = 0; i < kicks.length; i++) {
      const [dx, dy] = kicks[i];
      if (!this.collides(p.type, to, p.x + dx, p.y + dy)) {
        p.rot = to;
        p.x += dx;
        p.y += dy;
        this.lastRotation = true;
        this.lastKick = i;
        this.resetLockOnAction();
        return true;
      }
    }
    return false;
  }

  /** Guideline move reset: a successful move/rotate while grounded restarts
   *  the lock delay, at most MAX_LOCK_RESETS times per piece. */
  private resetLockOnAction(): void {
    if (this.grounded() && this.lockResets < MAX_LOCK_RESETS) {
      this.lockTimer = 0;
      this.lockResets++;
    }
  }

  hardDrop(): void {
    const p = this.current;
    if (this.over || p === null) return;
    const gy = this.ghostY();
    this.score += 2 * (gy - p.y);
    p.y = gy;
    // Note: a hard drop does not invalidate a preceding rotation (T-spins
    // are still recognized when the piece is hard-dropped into the slot).
    this.lock();
  }

  holdPiece(): void {
    const p = this.current;
    if (this.over || p === null || this.holdUsed) return;
    const swapped = this.hold;
    this.hold = p.type;
    if (swapped !== null) {
      this.spawn(swapped);
    } else {
      this.spawn();
    }
    this.holdUsed = true; // only once per piece
  }

  /** Advance gravity and lock delay by dt milliseconds. */
  update(dt: number, softDrop: boolean): void {
    if (this.messageTimer > 0) this.messageTimer -= dt;
    const p = this.current;
    if (this.over || p === null) return;

    const gravity = this.gravityMs();
    const interval = softDrop ? Math.max(gravity / 20, 1) : gravity;
    this.gravityTimer += dt;
    let steps = 0;
    while (this.gravityTimer >= interval && steps < ROWS) {
      if (this.collides(p.type, p.rot, p.x, p.y + 1)) {
        this.gravityTimer = 0;
        break;
      }
      this.gravityTimer -= interval;
      p.y++;
      steps++;
      if (softDrop) this.score++;
      this.lastRotation = false;
      if (p.y > this.lowestY) {
        this.lowestY = p.y;
        this.lockResets = 0;
        this.lockTimer = 0;
      }
    }
    if (this.gravityTimer > interval) this.gravityTimer = interval;

    if (this.grounded()) {
      this.lockTimer += dt;
      if (this.lockTimer >= LOCK_DELAY) this.lock();
    } else {
      this.lockTimer = 0;
    }
  }

  private spawn(type?: PieceType): void {
    if (type === undefined) {
      while (this.queue.length < NEXT_COUNT + 1) this.queue.push(this.bag.draw());
      type = this.queue.shift()!;
    }
    this.current = { type, rot: 0, x: SPAWN_X[type], y: 0 };
    this.gravityTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lowestY = 0;
    this.lastRotation = false;
    this.lastKick = 0;
    if (this.collides(type, 0, SPAWN_X[type], 0)) {
      this.over = true; // block out
      this.message = 'GAME OVER';
      return;
    }
    // Guideline: spawn above the visible field, drop one row immediately if free.
    if (!this.collides(type, 0, SPAWN_X[type], 1)) {
      this.current.y = 1;
      this.lowestY = 1;
    }
  }

  /** T-spin corner rule: 3 of the 4 corners around the T's center occupied,
   *  the last action a rotation. Both front corners -> full; otherwise mini,
   *  unless the rotation used the last (far) wall kick. */
  private detectTSpin(p: ActivePiece): TSpin {
    const cx = p.x + 1;
    const cy = p.y + 1;
    const corners = [
      this.blocked(cx - 1, cy - 1), // top-left
      this.blocked(cx + 1, cy - 1), // top-right
      this.blocked(cx + 1, cy + 1), // bottom-right
      this.blocked(cx - 1, cy + 1), // bottom-left
    ];
    const count = corners.filter(Boolean).length;
    if (count < 3) return 'none';
    // Front corners per facing direction (0 up, 1 right, 2 down, 3 left).
    const front = [[0, 1], [1, 2], [2, 3], [3, 0]][p.rot];
    if (corners[front[0]] && corners[front[1]]) return 'full';
    return this.lastKick === 4 ? 'full' : 'mini';
  }

  private lock(): void {
    const p = this.current!;
    const cells = SHAPES[p.type][p.rot].map(([cx, cy]) => [p.x + cx, p.y + cy] as const);
    const tspin = p.type === 'T' && this.lastRotation ? this.detectTSpin(p) : 'none';
    const lockOut = cells.every(([, y]) => y < HIDDEN);

    const id = pieceId(p.type);
    for (const [x, y] of cells) {
      if (y >= 0) this.board[y * COLS + x] = id;
    }

    // Find and remove full rows.
    const full: number[] = [];
    for (let y = 0; y < ROWS; y++) {
      let complete = true;
      for (let x = 0; x < COLS; x++) {
        if (this.board[y * COLS + x] === 0) { complete = false; break; }
      }
      if (complete) full.push(y);
    }
    if (full.length > 0) {
      const isFull = new Set(full);
      let write = ROWS - 1;
      for (let y = ROWS - 1; y >= 0; y--) {
        if (isFull.has(y)) continue;
        if (write !== y) this.board.copyWithin(write * COLS, y * COLS, (y + 1) * COLS);
        write--;
      }
      this.board.fill(0, 0, (write + 1) * COLS);
    }

    this.scoreClear(full.length, tspin);
    this.current = null;
    if (lockOut) {
      this.over = true;
      this.message = 'GAME OVER';
      return;
    }
    this.holdUsed = false;
    this.spawn();
  }

  private scoreClear(n: number, tspin: TSpin): void {
    const wasB2B = this.b2b;
    let points = 0;
    let label = '';
    if (tspin === 'full') {
      points = [400, 800, 1200, 1600][n];
      label = ['T-SPIN', 'T-SPIN SINGLE', 'T-SPIN DOUBLE', 'T-SPIN TRIPLE'][n];
    } else if (tspin === 'mini') {
      points = [100, 200, 400][n];
      label = n === 0 ? 'MINI T-SPIN' : `MINI T-SPIN ${['', 'SINGLE', 'DOUBLE'][n]}`;
    } else {
      points = [0, 100, 300, 500, 800][n];
      label = ['', 'SINGLE', 'DOUBLE', 'TRIPLE', 'TETRIS'][n];
    }

    const special = n > 0 && (tspin !== 'none' || n === 4);
    if (n > 0) {
      if (special && wasB2B) {
        points = Math.floor(points * 1.5);
        label = `BACK-TO-BACK ${label}`;
      }
      this.b2b = special;
      this.combo++;
      if (this.combo > 0) points += 50 * this.combo;
    } else {
      this.combo = -1;
    }

    // Perfect clear: the whole board empty after a line clear.
    if (n > 0 && this.board.every((c) => c === 0)) {
      points += n === 4 && wasB2B ? 3200 : [0, 800, 1200, 1800, 2000][n];
      label = `PERFECT CLEAR ${label}`;
    }

    this.score += points * this.level;
    this.lines += n;
    this.level = 1 + Math.floor(this.lines / 10);
    if (label) {
      this.message = this.combo > 0 ? `${label}  COMBO x${this.combo}` : label;
      this.messageTimer = 2000;
    }
  }
}