import { Board, cellsOf, kickTable } from './board.js';
import {
  LOCK_DELAY_MS,
  MAX_LOCK_RESETS,
  PREVIEW_COUNT,
  gravityMs,
} from './constants.js';
import { PieceType, spawnX, spawnY } from './pieces.js';
import { Randomizer } from './randomizer.js';

export type GameState = 'ready' | 'playing' | 'paused' | 'gameover';

export interface ActivePiece {
  type: PieceType;
  rotation: number;
  x: number;
  y: number;
}

/** Scoring values from the Tetris Guideline. */
const LINE_SCORES = [0, 100, 300, 500, 800];
const TSPIN_SCORES = [400, 800, 1200, 1600];
const TSPIN_MINI_SCORES = [100, 200, 400];
const COMBO_SCORE = 50;
const BACK_TO_BACK_MULTIPLIER = 1.5;

export class Game {
  board = new Board();
  active: ActivePiece | null = null;
  hold: PieceType | null = null;
  holdUsed = false;
  queue: PieceType[] = [];
  score = 0;
  lines = 0;
  level = 1;
  combo = -1;
  backToBack = false;
  state: GameState = 'ready';
  lastActionWasRotation = false;
  lastKickUsed = false;

  private randomizer = new Randomizer();
  private dropTimer = 0;
  private lockTimer = 0;
  private lockResets = 0;
  private locking = false;

  constructor() {
    this.newGame();
  }

  newGame(): void {
    this.board.clear();
    this.active = null;
    this.hold = null;
    this.holdUsed = false;
    this.queue = [];
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.combo = -1;
    this.backToBack = false;
    this.state = 'ready';
    this.dropTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.locking = false;
    this.randomizer.reset();
    for (let i = 0; i < PREVIEW_COUNT; i++) this.queue.push(this.randomizer.next());
  }

  start(): void {
    if (this.state === 'playing') return;
    if (this.state === 'ready') {
      this.spawn();
      this.state = 'playing';
    } else if (this.state === 'gameover') {
      this.newGame();
      this.spawn();
      this.state = 'playing';
    }
  }

  togglePause(): void {
    if (this.state === 'playing') this.state = 'paused';
    else if (this.state === 'paused') this.state = 'playing';
  }

  /** Spawns the next piece. Returns false when the player topped out. */
  spawn(type?: PieceType): boolean {
    const next = type ?? this.queue.shift() as PieceType;
    if (type === undefined) this.queue.push(this.randomizer.next());

    const piece: ActivePiece = {
      type: next,
      rotation: 0,
      x: spawnX(next),
      y: spawnY(next),
    };
    this.active = piece;
    this.holdUsed = false;
    this.lastActionWasRotation = false;
    this.lastKickUsed = false;
    this.dropTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.locking = false;

    if (!this.board.fits(cellsOf(piece.type, piece.rotation), piece.x, piece.y)) {
      this.state = 'gameover';
      return false;
    }
    return true;
  }

  get canHold(): boolean {
    return this.active !== null && !this.holdUsed && this.state === 'playing';
  }

  holdPiece(): void {
    if (!this.canHold) return;
    const current = this.active as ActivePiece;
    if (this.hold === null) {
      this.hold = current.type;
      const next = this.queue.shift() as PieceType;
      this.queue.push(this.randomizer.next());
      this.spawn(next);
    } else {
      const swap = this.hold;
      this.hold = current.type;
      this.spawn(swap);
    }
    this.holdUsed = true;
  }

  moveLeft(): boolean {
    return this.tryMove(-1, 0);
  }

  moveRight(): boolean {
    return this.tryMove(1, 0);
  }

  /** Soft drop: one cell down, worth one point. */
  softDrop(): boolean {
    if (!this.active) return false;
    const moved = this.tryMove(0, 1, false);
    if (moved) this.score += 1;
    return moved;
  }

  /** Hard drop: the piece lands immediately, worth two points per cell. */
  hardDrop(): void {
    if (!this.active) return;
    const piece = this.active;
    const cells = cellsOf(piece.type, piece.rotation);
    let distance = 0;
    while (this.board.fits(cells, piece.x, piece.y + distance + 1)) distance++;
    if (distance > 0) {
      piece.y += distance;
      this.score += distance * 2;
    }
    this.lockPiece();
  }

  private tryMove(dx: number, dy: number, resetLock = true): boolean {
    if (!this.active || this.state !== 'playing') return false;
    const piece = this.active;
    if (!this.board.fits(cellsOf(piece.type, piece.rotation), piece.x + dx, piece.y + dy)) {
      return false;
    }
    piece.x += dx;
    piece.y += dy;
    if (dx !== 0) this.lastActionWasRotation = false;
    if (resetLock) this.resetLockDelay();
    return true;
  }

  rotateClockwise(): boolean {
    return this.rotate(1);
  }

  rotateCounterClockwise(): boolean {
    return this.rotate(-1);
  }

  private rotate(dir: 1 | -1): boolean {
    if (!this.active || this.state !== 'playing') return false;
    const piece = this.active;
    const from = piece.rotation;
    const to = ((from + dir) % 4 + 4) % 4;
    const cells = cellsOf(piece.type, to);
    const kicks = kickTable(piece.type, from, to);
    for (const kick of kicks) {
      const nx = piece.x + kick.dx;
      const ny = piece.y + kick.dy;
      if (this.board.fits(cells, nx, ny)) {
        piece.x = nx;
        piece.y = ny;
        piece.rotation = to;
        this.lastActionWasRotation = true;
        this.lastKickUsed = kick.dx !== 0 || kick.dy !== 0;
        this.resetLockDelay();
        return true;
      }
    }
    return false;
  }

  /** Called when the piece rests on the stack: starts or refreshes lock delay. */
  private resetLockDelay(): void {
    if (this.lockResets < MAX_LOCK_RESETS) {
      this.lockResets++;
      this.lockTimer = 0;
    }
  }

  /** Advances timers. `dt` is in milliseconds. */
  update(dt: number): void {
    if (this.state !== 'playing' || !this.active) return;
    const piece = this.active;
    const cells = cellsOf(piece.type, piece.rotation);
    const grounded = !this.board.fits(cells, piece.x, piece.y + 1);

    if (!grounded) {
      this.locking = false;
      this.lockTimer = 0;
      this.dropTimer += dt;
      const step = gravityMs(this.level);
      while (this.dropTimer >= step) {
        this.dropTimer -= step;
        if (!this.board.fits(cells, piece.x, piece.y + 1)) break;
        piece.y++;
        this.locking = false;
      }
    } else {
      this.locking = true;
      this.lockTimer += dt;
      if (this.lockTimer >= LOCK_DELAY_MS) this.lockPiece();
    }
  }

  private lockPiece(): void {
    const piece = this.active;
    if (!piece) return;
    this.board.lock(cellsOf(piece.type, piece.rotation), piece.x, piece.y, piece.type);

    const tspin = this.detectTSpin();
    const cleared = this.board.clearLines();
    this.applyScoring(cleared, tspin);

    this.active = null;
    if (!this.spawn()) return;
  }

  /** 3-corner rule: a T-spin needs the two "front" corners filled. */
  private detectTSpin(): 'none' | 'mini' | 'full' {
    const piece = this.active;
    if (!piece || piece.type !== 'T' || !this.lastActionWasRotation) return 'none';
    const cells = cellsOf('T', piece.rotation);
    const corners = this.tCorners(piece.rotation);
    const filled = corners.map((c) => this.board.isFilled(c.x, c.y));
    const frontCount = filled[0] && filled[1] ? 2 : filled[0] || filled[1] ? 1 : 0;
    const backCount = filled[2] && filled[3] ? 2 : filled[2] || filled[3] ? 1 : 0;
    const total = frontCount + backCount;
    if (frontCount === 2) return 'full';
    if (total === 3) return 'mini';
    return 'none';
  }

  private tCorners(rotation: number): { x: number; y: number }[] {
    const piece = this.active as ActivePiece;
    // corners of the 3x3 box around the T piece
    const left = piece.x;
    const top = piece.y;
    const right = piece.x + 2;
    const bottom = piece.y + 2;
    switch (rotation) {
      case 0:
        return [
          { x: left, y: top },
          { x: right, y: top },
          { x: left, y: bottom },
          { x: right, y: bottom },
        ];
      case 1:
        return [
          { x: right, y: top },
          { x: right, y: bottom },
          { x: left, y: top },
          { x: left, y: bottom },
        ];
      case 2:
        return [
          { x: left, y: bottom },
          { x: right, y: bottom },
          { x: left, y: top },
          { x: right, y: top },
        ];
      default:
        return [
          { x: left, y: top },
          { x: left, y: bottom },
          { x: right, y: top },
          { x: right, y: bottom },
        ];
    }
  }

  private applyScoring(cleared: number, tspin: 'none' | 'mini' | 'full'): void {
    if (cleared === 0 && tspin === 'none') {
      this.combo = -1;
      return;
    }

    let gained = 0;
    let difficult = false;

    if (tspin === 'full') {
      gained = TSPIN_SCORES[Math.min(cleared, 3)];
      difficult = true;
    } else if (tspin === 'mini') {
      gained = TSPIN_MINI_SCORES[Math.min(cleared, 2)];
      difficult = cleared > 0;
    } else {
      gained = LINE_SCORES[Math.min(cleared, 4)];
      difficult = cleared === 4;
    }

    if (difficult && this.backToBack) {
      gained = Math.floor(gained * BACK_TO_BACK_MULTIPLIER);
    }
    this.backToBack = difficult;

    if (cleared > 0) {
      this.combo++;
      if (this.combo > 0) gained += COMBO_SCORE * this.combo * this.level;
    } else {
      this.combo = -1;
    }

    this.score += gained;
    this.lines += cleared;
    this.level = Math.floor(this.lines / 10) + 1;
  }

  /** Row where the active piece would land. */
  ghostY(): number {
    if (!this.active) return 0;
    const piece = this.active;
    const cells = cellsOf(piece.type, piece.rotation);
    let y = piece.y;
    while (this.board.fits(cells, piece.x, y + 1)) y++;
    return y;
  }
}
