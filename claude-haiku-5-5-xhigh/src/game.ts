import { createBag, type PieceSource } from './bag.js';
import { boxSize, kickTests, pieceCells, type Point, type PieceType, type Rotation } from './pieces.js';

export const COLS = 10;
/** Rows above the visible field. Pieces spawn and rotate here; locking entirely inside them ends the game. */
export const HIDDEN_ROWS = 2;
export const VISIBLE_ROWS = 20;
export const ROWS = HIDDEN_ROWS + VISIBLE_ROWS;

const QUEUE_SIZE = 5;
const LOCK_DELAY_MS = 500;
const MAX_LOCK_RESETS = 15;
const SOFT_DROP_FACTOR = 20;
const MAX_GRAVITY_LEVEL = 20;

// Guideline scoring, before the level multiplier.
const LINE_POINTS = [0, 100, 300, 500, 800];
const T_SPIN_POINTS = [400, 800, 1200, 1600];
const T_SPIN_MINI_POINTS = [100, 200, 400];
const PERFECT_CLEAR_POINTS = [0, 800, 1200, 1800, 2000];
const PERFECT_CLEAR_B2B_TETRIS_POINTS = 3200;
const COMBO_POINTS = 50;
const BACK_TO_BACK_MULTIPLIER = 1.5;

// The four corners around a T's centre: top-left, top-right, bottom-left, bottom-right.
const T_CORNERS: Point[] = [
  { x: -1, y: -1 },
  { x: 1, y: -1 },
  { x: -1, y: 1 },
  { x: 1, y: 1 },
];
// For each rotation, the indexes into T_CORNERS on the side the T points to.
const T_FRONT_CORNERS: number[][] = [
  [0, 1],
  [1, 3],
  [2, 3],
  [0, 2],
];

export type Board = (PieceType | null)[][];

export interface ActivePiece {
  type: PieceType;
  rotation: Rotation;
  /** Top-left corner of the piece's box, in board cells. */
  x: number;
  y: number;
}

/** Which T-spin, if any, the last placement was. */
type TSpin = 'none' | 'mini' | 'full';

/** Milliseconds per row of gravity at a level, from the Guideline formula. */
export function gravityIntervalMs(level: number): number {
  const l = Math.min(level, MAX_GRAVITY_LEVEL);
  return 1000 * (0.8 - (l - 1) * 0.007) ** (l - 1);
}

/** Board cells a piece occupies. */
export function cellsOf(piece: ActivePiece): Point[] {
  return pieceCells(piece.type, piece.rotation).map((c) => ({ x: piece.x + c.x, y: piece.y + c.y }));
}

function emptyRow(): (PieceType | null)[] {
  return new Array<PieceType | null>(COLS).fill(null);
}

function emptyBoard(): Board {
  return Array.from({ length: ROWS }, emptyRow);
}

function basePoints(lines: number, spin: TSpin): number {
  if (spin === 'none') return LINE_POINTS[lines];
  // A mini T-spin with three lines has no entry in the table, so it scores as a full T-spin.
  if (spin === 'mini' && lines < T_SPIN_MINI_POINTS.length) return T_SPIN_MINI_POINTS[lines];
  return T_SPIN_POINTS[lines];
}

export class Game {
  board!: Board;
  current: ActivePiece | null = null;
  hold: PieceType | null = null;
  canHold = true;
  /** Upcoming shapes, next one first. */
  queue: PieceType[] = [];
  score = 0;
  level = 1;
  lines = 0;
  gameOver = false;
  softDropping = false;

  private combo = -1;
  private backToBack = false;
  private gravityMs = 0;
  private lockMs = 0;
  private lockResets = 0;
  private lowestY = 0;
  private lastMoveWasRotation = false;
  private lastKick = 0;

  constructor(private readonly takePiece: PieceSource = createBag()) {
    this.restart();
  }

  /** Starts a new game on an empty board. */
  restart(): void {
    this.board = emptyBoard();
    this.current = null;
    this.hold = null;
    this.queue = Array.from({ length: QUEUE_SIZE }, () => this.takePiece());
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.combo = -1;
    this.backToBack = false;
    this.gameOver = false;
    this.softDropping = false;
    this.spawn(this.takeFromQueue());
  }

  /** Moves the active piece one column left (-1) or right (1). */
  move(dx: -1 | 1): boolean {
    const piece = this.current;
    if (!piece) return false;
    const moved = { ...piece, x: piece.x + dx };
    if (!this.fits(moved)) return false;
    this.current = moved;
    this.lastMoveWasRotation = false;
    this.resetLockDelay();
    return true;
  }

  /** Rotates the active piece clockwise (1) or counter-clockwise (-1), trying SRS wall kicks in order. */
  rotate(direction: 1 | -1): boolean {
    const piece = this.current;
    if (!piece) return false;
    const rotation = ((piece.rotation + direction + 4) % 4) as Rotation;
    const tests = kickTests(piece.type, piece.rotation, rotation);
    for (let i = 0; i < tests.length; i++) {
      const [kickX, kickY] = tests[i];
      const rotated = { ...piece, rotation, x: piece.x + kickX, y: piece.y - kickY };
      if (this.fits(rotated)) {
        this.current = rotated;
        this.lastKick = i;
        this.lastMoveWasRotation = true;
        this.trackLowest();
        this.resetLockDelay();
        return true;
      }
    }
    return false;
  }

  /** Stores the active piece and brings out the held one (or the next one). Allowed once per piece. */
  holdPiece(): void {
    const piece = this.current;
    if (!piece || !this.canHold) return;
    const previous = this.hold;
    this.hold = piece.type;
    this.spawn(previous ?? this.takeFromQueue());
    this.canHold = false;
  }

  /** Drops the active piece to the floor and locks it immediately. */
  hardDrop(): void {
    if (!this.current) return;
    let distance = 0;
    while (this.stepDown()) distance++;
    this.score += distance * 2;
    this.lock();
  }

  /** Advances the game by a time step: gravity moves the piece down and an expired lock delay locks it. */
  update(dtMs: number): void {
    const piece = this.current;
    if (!piece) return;
    if (this.isGrounded(piece)) {
      this.gravityMs = 0;
      this.lockMs += dtMs;
      if (this.lockMs >= LOCK_DELAY_MS) this.lock();
      return;
    }
    this.lockMs = 0;
    this.gravityMs += dtMs;
    const interval = this.dropIntervalMs();
    while (this.gravityMs >= interval && this.stepDown()) {
      this.gravityMs -= interval;
      if (this.softDropping) this.score += 1;
    }
  }

  /** Where the active piece would land if dropped straight down now. */
  ghost(): ActivePiece | null {
    const piece = this.current;
    if (!piece) return null;
    let landed = piece;
    while (!this.isGrounded(landed)) landed = { ...landed, y: landed.y + 1 };
    return landed;
  }

  private dropIntervalMs(): number {
    const interval = gravityIntervalMs(this.level);
    return this.softDropping ? interval / SOFT_DROP_FACTOR : interval;
  }

  private spawn(type: PieceType): void {
    const piece: ActivePiece = {
      type,
      rotation: 0,
      x: Math.floor((COLS - boxSize(type)) / 2),
      y: HIDDEN_ROWS,
    };
    this.current = piece;
    this.canHold = true;
    this.lastMoveWasRotation = false;
    this.lastKick = 0;
    this.gravityMs = 0;
    this.lockMs = 0;
    this.lockResets = 0;
    this.lowestY = piece.y;
    // A blocked spawn tops the stack out.
    if (!this.fits(piece)) this.topOut();
  }

  private stepDown(): boolean {
    const piece = this.current;
    if (!piece) return false;
    const lower = { ...piece, y: piece.y + 1 };
    if (!this.fits(lower)) return false;
    this.current = lower;
    this.lastMoveWasRotation = false;
    this.trackLowest();
    return true;
  }

  private lock(): void {
    const piece = this.current;
    if (!piece) return;
    const spin = this.detectTSpin(piece);
    const cells = cellsOf(piece);
    for (const { x, y } of cells) this.board[y][x] = piece.type;
    // Locking entirely above the visible field ends the game.
    if (cells.every(({ y }) => y < HIDDEN_ROWS)) {
      this.topOut();
      return;
    }
    const cleared = this.clearLines();
    this.awardPoints(cleared, spin);
    this.spawn(this.takeFromQueue());
  }

  private clearLines(): number {
    const remaining = this.board.filter((row) => row.includes(null));
    const cleared = ROWS - remaining.length;
    if (cleared > 0) {
      this.board = [...Array.from({ length: cleared }, emptyRow), ...remaining];
    }
    return cleared;
  }

  private awardPoints(lines: number, spin: TSpin): void {
    const difficult = lines === 4 || (spin !== 'none' && lines > 0);
    const backToBack = difficult && this.backToBack;
    let points = basePoints(lines, spin);
    if (backToBack) points = Math.floor(points * BACK_TO_BACK_MULTIPLIER);
    if (lines > 0 && this.board.every((row) => row.every((cell) => cell === null))) {
      points += backToBack && lines === 4 ? PERFECT_CLEAR_B2B_TETRIS_POINTS : PERFECT_CLEAR_POINTS[lines];
    }
    this.combo = lines > 0 ? this.combo + 1 : -1;
    points += COMBO_POINTS * Math.max(this.combo, 0);
    this.score += points * this.level;
    if (lines > 0) this.backToBack = difficult;
    this.lines += lines;
    this.level = Math.floor(this.lines / 10) + 1;
  }

  /** A T locked right after a rotation, with three of its four corners blocked, is a T-spin. */
  private detectTSpin(piece: ActivePiece): TSpin {
    if (piece.type !== 'T' || !this.lastMoveWasRotation) return 'none';
    // The T's centre is the middle cell of its 3x3 box.
    const cx = piece.x + 1;
    const cy = piece.y + 1;
    const blocked = T_CORNERS.map((c) => this.isBlocked(cx + c.x, cy + c.y));
    if (blocked.filter(Boolean).length < 3) return 'none';
    const frontBlocked = T_FRONT_CORNERS[piece.rotation].every((i) => blocked[i]);
    // Kicking with the fifth SRS test also counts as a full T-spin.
    return frontBlocked || this.lastKick === 4 ? 'full' : 'mini';
  }

  /** A piece that drops to a new lowest row earns fresh lock-delay resets. */
  private trackLowest(): void {
    if (this.current && this.current.y > this.lowestY) {
      this.lowestY = this.current.y;
      this.lockResets = 0;
    }
  }

  /** A successful move or rotation on a resting piece restarts the lock delay, up to a limit. */
  private resetLockDelay(): void {
    if (this.current && this.isGrounded(this.current) && this.lockResets < MAX_LOCK_RESETS) {
      this.lockResets++;
      this.lockMs = 0;
    }
  }

  private topOut(): void {
    this.gameOver = true;
    this.current = null;
  }

  private takeFromQueue(): PieceType {
    const type = this.queue.shift() as PieceType;
    this.queue.push(this.takePiece());
    return type;
  }

  private isGrounded(piece: ActivePiece): boolean {
    return !this.fits({ ...piece, y: piece.y + 1 });
  }

  private fits(piece: ActivePiece): boolean {
    return cellsOf(piece).every(({ x, y }) => !this.isBlocked(x, y));
  }

  /** Walls, the floor and locked cells block a piece. Anything above the board counts as wall. */
  private isBlocked(x: number, y: number): boolean {
    return x < 0 || x >= COLS || y < 0 || y >= ROWS || this.board[y][x] !== null;
  }
}
