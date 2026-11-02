import { Board } from './board.js';
import { SevenBagRandomizer } from './randomizer.js';
import {
  BACK_TO_BACK_MULTIPLIER,
  COMBO_BONUS_PER_LEVEL,
  GRAVITY_SECONDS_PER_ROW,
  HARD_DROP_POINTS_PER_CELL,
  HIDDEN_ROWS,
  LINE_CLEAR_SCORES,
  LINES_PER_LEVEL,
  LOCK_DELAY_MS,
  MAX_LOCK_RESETS,
  NEXT_QUEUE_SIZE,
  SOFT_DROP_FACTOR,
  SOFT_DROP_POINTS_PER_CELL,
  TSPIN_MINI_SCORES,
  TSPIN_SCORES,
} from './constants.js';
import { PIECES } from './tetromino.js';
import type { Cell, PieceType } from './tetromino.js';

export interface ActivePiece {
  type: PieceType;
  /** 0 = spawn, 1 = clockwise, 2 = 180°, 3 = counter-clockwise. */
  rotation: number;
  x: number;
  y: number;
}

export type TSpinKind = 'none' | 'mini' | 'full';
export type GameStatus = 'playing' | 'gameover';

const CLEAR_NAMES: readonly string[] = ['', 'SINGLE', 'DOUBLE', 'TRIPLE', 'TETRIS'];

/** Diagonal corner indices (TL, TR, BL, BR) that face the T's pointing side, per rotation. */
const FRONT_CORNERS: readonly (readonly number[])[] = [[0, 1], [1, 3], [2, 3], [0, 2]];

function describeClear(spin: TSpinKind, cleared: number, b2b: boolean, combo: number): string {
  let name: string;
  if (spin === 'full') name = cleared === 0 ? 'T-SPIN' : `T-SPIN ${CLEAR_NAMES[cleared]}`;
  else if (spin === 'mini') name = cleared === 0 ? 'T-SPIN MINI' : `T-SPIN MINI ${CLEAR_NAMES[cleared]}`;
  else name = CLEAR_NAMES[cleared];
  return `${b2b ? 'B2B ' : ''}${name}${combo > 0 ? ` · COMBO ×${combo}` : ''}`;
}

export class Game {
  board: Board = new Board();
  current: ActivePiece | null = null;
  hold: PieceType | null = null;
  canHold = true;
  queue: PieceType[] = [];
  score = 0;
  lines = 0;
  level = 1;
  /** Consecutive piece locks with at least one line cleared; -1 means "no combo". */
  combo = -1;
  backToBack = false;
  status: GameStatus = 'playing';
  softDropping = false;
  /** Game clock in ms; drives the "recent clear" banner. */
  timeMs = 0;
  lastClearText: string | null = null;
  lastClearAtMs = -Infinity;
  lastActionWasRotation = false;

  private readonly randomizer: SevenBagRandomizer;
  private dropAccumulatorMs = 0;
  private lockTimerMs = 0;
  private lockResets = 0;
  private lowestY = 0;
  private lastKickIndex = 0;

  constructor(rand: () => number = Math.random) {
    this.randomizer = new SevenBagRandomizer(rand);
    this.reset();
  }

  reset(): void {
    this.board = new Board();
    this.queue = [];
    this.hold = null;
    this.canHold = true;
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.combo = -1;
    this.backToBack = false;
    this.status = 'playing';
    this.softDropping = false;
    this.timeMs = 0;
    this.lastClearText = null;
    this.lastClearAtMs = -Infinity;
    this.spawn();
  }

  cellsOf(piece: ActivePiece): Cell[] {
    return PIECES[piece.type].rotations[piece.rotation].map(c => ({
      x: piece.x + c.x,
      y: piece.y + c.y,
    }));
  }

  /** Row the active piece would land on if dropped straight down. */
  ghostY(): number | null {
    const piece = this.current;
    if (!piece) return null;
    const cells = PIECES[piece.type].rotations[piece.rotation];
    let y = piece.y;
    while (this.board.canPlace(cells, piece.x, y + 1)) y++;
    return y;
  }

  moveHorizontal(dx: number): boolean {
    const piece = this.current;
    if (!piece || this.status !== 'playing') return false;
    const cells = PIECES[piece.type].rotations[piece.rotation];
    if (!this.board.canPlace(cells, piece.x + dx, piece.y)) return false;
    piece.x += dx;
    this.lastActionWasRotation = false;
    this.onSuccessfulShift();
    return true;
  }

  moveLeft(): boolean {
    return this.moveHorizontal(-1);
  }

  moveRight(): boolean {
    return this.moveHorizontal(1);
  }

  /** Rotates using SRS wall kicks; `direction` is 1 (clockwise) or -1 (counter-clockwise). */
  rotate(direction: 1 | -1): boolean {
    const piece = this.current;
    if (!piece || this.status !== 'playing') return false;
    const def = PIECES[piece.type];
    const to = (piece.rotation + direction + 4) % 4;
    const cells = def.rotations[to];
    const kicks = def.kicks[`${piece.rotation}>${to}`] ?? [{ x: 0, y: 0 }];
    for (let i = 0; i < kicks.length; i++) {
      const nx = piece.x + kicks[i].x;
      const ny = piece.y + kicks[i].y;
      if (this.board.canPlace(cells, nx, ny)) {
        piece.rotation = to;
        piece.x = nx;
        piece.y = ny;
        this.lastActionWasRotation = true;
        this.lastKickIndex = i;
        this.onSuccessfulShift();
        return true;
      }
    }
    return false;
  }

  hardDrop(): void {
    const piece = this.current;
    if (!piece || this.status !== 'playing') return;
    const cells = PIECES[piece.type].rotations[piece.rotation];
    let rows = 0;
    while (this.board.canPlace(cells, piece.x, piece.y + 1 + rows)) rows++;
    piece.y += rows;
    this.score += rows * HARD_DROP_POINTS_PER_CELL;
    if (rows > 0) this.lastActionWasRotation = false;
    this.lockPiece();
  }

  holdPiece(): void {
    const piece = this.current;
    if (!piece || !this.canHold || this.status !== 'playing') return;
    const type = piece.type;
    if (this.hold === null) {
      this.hold = type;
      this.spawn();
    } else {
      const swapped = this.hold;
      this.hold = type;
      this.placePiece(swapped);
    }
    this.canHold = false;
  }

  /** Advances gravity and lock delay by `dtMs`. Call once per animation frame. */
  update(dtMs: number): void {
    if (this.status !== 'playing') return;
    this.timeMs += dtMs;
    const piece = this.current;
    if (!piece) return;

    const interval = this.gravityIntervalMs();
    this.dropAccumulatorMs += dtMs;
    let steps = 0;
    while (this.dropAccumulatorMs >= interval && steps < 40) {
      this.dropAccumulatorMs -= interval;
      steps++;
      if (!this.canMoveDown()) break;
      piece.y++;
      if (this.softDropping) this.score += SOFT_DROP_POINTS_PER_CELL;
      if (piece.y > this.lowestY) {
        this.lowestY = piece.y;
        this.lockResets = 0;
      }
      this.lockTimerMs = 0;
    }
    if (steps >= 40) this.dropAccumulatorMs = 0;

    if (!this.canMoveDown()) {
      this.dropAccumulatorMs = 0;
      this.lockTimerMs += dtMs;
      if (this.lockTimerMs >= LOCK_DELAY_MS) this.lockPiece();
    } else {
      this.lockTimerMs = 0;
    }
  }

  /** Writes the active piece into the board, scores the result and spawns the next piece. */
  lockPiece(): void {
    const piece = this.current;
    if (!piece || this.status !== 'playing') return;
    const cells = this.cellsOf(piece);
    const spin = this.detectTSpin(piece);
    for (const c of cells) this.board.set(c.x, c.y, piece.type);
    const lockedAboveField = cells.every(c => c.y < HIDDEN_ROWS);
    const cleared = this.board.clearLines();
    this.applyClearScore(spin, cleared);
    this.current = null;
    this.canHold = true;
    if (lockedAboveField) {
      this.status = 'gameover'; // lock-out
      return;
    }
    this.spawn();
  }

  private spawn(): void {
    this.placePiece(this.takeNext());
  }

  private takeNext(): PieceType {
    while (this.queue.length <= NEXT_QUEUE_SIZE) {
      this.queue.push(this.randomizer.next());
    }
    return this.queue.shift()!;
  }

  /** Puts `type` at its spawn location; a blocked spawn is a top-out. */
  private placePiece(type: PieceType): void {
    const def = PIECES[type];
    this.current = { type, rotation: 0, x: def.spawnX, y: 0 };
    this.dropAccumulatorMs = 0;
    this.lockTimerMs = 0;
    this.lockResets = 0;
    this.lowestY = 0;
    this.lastActionWasRotation = false;
    this.lastKickIndex = 0;
    const cells = def.rotations[0];
    if (!this.board.canPlace(cells, def.spawnX, 0)) {
      this.current = null;
      this.status = 'gameover'; // top-out
      return;
    }
    // Guideline: the piece immediately falls one row when its path is clear.
    if (this.board.canPlace(cells, def.spawnX, 1)) {
      this.current.y = 1;
      this.lowestY = 1;
    }
  }

  /** A successful shift/rotation while resting restarts the lock delay (up to 15 times). */
  private onSuccessfulShift(): void {
    if (!this.canMoveDown() && this.lockResets < MAX_LOCK_RESETS) {
      this.lockTimerMs = 0;
      this.lockResets++;
    }
  }

  private canMoveDown(): boolean {
    const piece = this.current;
    if (!piece) return false;
    const cells = PIECES[piece.type].rotations[piece.rotation];
    return this.board.canPlace(cells, piece.x, piece.y + 1);
  }

  private gravityIntervalMs(): number {
    const idx = Math.min(this.level, GRAVITY_SECONDS_PER_ROW.length) - 1;
    const interval = GRAVITY_SECONDS_PER_ROW[idx] * 1000;
    return this.softDropping
      ? Math.max(interval / SOFT_DROP_FACTOR, 1)
      : Math.max(interval, 1);
  }

  /** Three-corner rule: last action was a rotation and ≥3 T diagonal corners are solid. */
  private detectTSpin(piece: ActivePiece): TSpinKind {
    if (piece.type !== 'T' || !this.lastActionWasRotation) return 'none';
    const cx = piece.x + 1; // the T's centre is at box coordinate (1, 1)
    const cy = piece.y + 1;
    const filled = [
      this.board.isOccupied(cx - 1, cy - 1),
      this.board.isOccupied(cx + 1, cy - 1),
      this.board.isOccupied(cx - 1, cy + 1),
      this.board.isOccupied(cx + 1, cy + 1),
    ];
    if (filled.filter(Boolean).length < 3) return 'none';
    const [a, b] = FRONT_CORNERS[piece.rotation];
    if (filled[a] && filled[b]) return 'full';
    // The deep kicks (slots 4 and 5) promote a mini T-spin to a full one.
    return this.lastKickIndex >= 3 ? 'full' : 'mini';
  }

  private applyClearScore(spin: TSpinKind, cleared: number): void {
    const level = this.level;
    const wasBackToBack = this.backToBack;
    let points: number;
    let difficult: boolean;
    if (spin === 'full') {
      points = TSPIN_SCORES[cleared] * level;
      difficult = true;
    } else if (spin === 'mini') {
      points = TSPIN_MINI_SCORES[cleared] * level;
      difficult = true;
    } else {
      points = LINE_CLEAR_SCORES[cleared] * level;
      difficult = cleared === 4;
    }

    if (cleared > 0) {
      this.combo++;
      if (difficult && wasBackToBack) points = Math.floor(points * BACK_TO_BACK_MULTIPLIER);
      if (this.combo > 0) points += COMBO_BONUS_PER_LEVEL * this.combo * level;
      this.backToBack = difficult;
      this.lines += cleared;
      this.level = 1 + Math.floor(this.lines / LINES_PER_LEVEL);
      this.lastClearText = describeClear(spin, cleared, difficult && wasBackToBack, this.combo);
    } else {
      this.combo = -1;
      if (spin !== 'none') {
        this.lastClearText = spin === 'mini' ? 'T-SPIN MINI' : 'T-SPIN';
      }
    }
    if (cleared > 0 || spin !== 'none') this.lastClearAtMs = this.timeMs;
    this.score += points;
  }
}
