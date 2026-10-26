import { Board, HIDDEN_ROWS } from './board.js';
import { type ActivePiece, type PieceType, type Rotation, kicksFor, pieceCells } from './pieces.js';
import { Bag, type PieceSource } from './randomizer.js';
import { BACK_TO_BACK_MULTIPLIER, COMBO_POINTS, type TSpin, basePoints, clearName, isDifficult } from './scoring.js';

/** Time a grounded piece waits before locking (ms). */
export const LOCK_DELAY = 500;
/** Moves/rotations that may reset the lock delay before the piece reaches a new lowest row. */
export const MAX_LOCK_RESETS = 15;
/** Soft drop falls this many times faster than normal gravity. */
export const SOFT_DROP_FACTOR = 20;
export const LINES_PER_LEVEL = 10;
export const NEXT_COUNT = 5;
/** Beyond this level the gravity curve no longer gets faster (pieces already fall instantly). */
const MAX_GRAVITY_LEVEL = 20;

export type GameState = 'playing' | 'paused' | 'over';

export interface ClearAction {
  readonly labels: readonly string[];
  readonly points: number;
}

/** Guideline gravity: (0.8 - (level - 1) * 0.007) ^ (level - 1) seconds per row, in ms. */
export function gravityInterval(level: number): number {
  const n = Math.min(level, MAX_GRAVITY_LEVEL) - 1;
  return Math.pow(0.8 - n * 0.007, n) * 1000;
}

/** Pieces spawn in rows 21–22, centered (rounded left for 3-wide pieces). */
function spawnPosition(type: PieceType): ActivePiece {
  return { type, rotation: 0, x: type === 'O' ? 4 : 3, y: HIDDEN_ROWS - 2 };
}

export class Game {
  readonly board = new Board();
  active: ActivePiece | null = null;
  held: PieceType | null = null;
  holdUsed = false;
  score = 0;
  lines = 0;
  level = 1;
  state: GameState = 'playing';
  lastAction: ClearAction | null = null;
  /** Increments on every visible change so the renderer can skip idle frames. */
  revision = 0;

  private softDropping = false;
  private combo = -1;
  private backToBack = false;
  private gravityTimer = 0;
  private lockTimer = 0;
  private lockResets = 0;
  private lowestY = 0;
  private lastMoveWasRotation = false;
  private lastKick = 0;

  constructor(private readonly source: PieceSource = new Bag()) {
    this.spawn(source.next());
  }

  get queue(): PieceType[] {
    return this.source.peek(NEXT_COUNT);
  }

  shift(dx: -1 | 1): boolean {
    return this.tryMove(dx, 0, true);
  }

  rotate(direction: 1 | -1): boolean {
    const piece = this.active;
    if (!piece || this.state !== 'playing') return false;

    const rotation = ((piece.rotation + direction + 4) % 4) as Rotation;
    const kicks = kicksFor(piece.type, piece.rotation, rotation);
    for (let i = 0; i < kicks.length; i++) {
      const [dx, dy] = kicks[i];
      const candidate = { ...piece, rotation, x: piece.x + dx, y: piece.y + dy };
      if (this.fits(candidate)) {
        this.active = candidate;
        this.lastMoveWasRotation = true;
        this.lastKick = i;
        this.onMoved(true);
        return true;
      }
    }
    return false;
  }

  setSoftDrop(on: boolean): void {
    if (on === this.softDropping) return;
    this.softDropping = on;
    this.gravityTimer = 0;
    if (on && this.tryMove(0, 1, false)) this.score += 1;
  }

  hardDrop(): void {
    const piece = this.active;
    if (!piece || this.state !== 'playing') return;

    const distance = this.ghostY() - piece.y;
    if (distance > 0) {
      this.active = { ...piece, y: piece.y + distance };
      this.lastMoveWasRotation = false;
    }
    this.score += 2 * distance;
    this.lock();
  }

  hold(): boolean {
    if (!this.active || this.state !== 'playing' || this.holdUsed) return false;
    const next = this.held ?? this.source.next();
    this.held = this.active.type;
    this.holdUsed = true;
    this.spawn(next);
    return true;
  }

  togglePause(): void {
    if (this.state === 'over') return;
    this.state = this.state === 'playing' ? 'paused' : 'playing';
    this.revision++;
  }

  pause(): void {
    if (this.state === 'playing') this.togglePause();
  }

  /** Advances gravity and lock delay by `dt` milliseconds. */
  update(dt: number): void {
    if (!this.active || this.state !== 'playing') return;

    const gravity = gravityInterval(this.level);
    const interval = this.softDropping ? gravity / SOFT_DROP_FACTOR : gravity;
    this.gravityTimer += dt;
    while (this.gravityTimer >= interval) {
      this.gravityTimer -= interval;
      if (!this.tryMove(0, 1, false)) {
        this.gravityTimer = 0;
        break;
      }
      if (this.softDropping) this.score += 1;
    }

    if (this.isGrounded()) {
      this.lockTimer += dt;
      if (this.lockTimer >= LOCK_DELAY || this.lockResets >= MAX_LOCK_RESETS) this.lock();
    }
  }

  /** Row the active piece would land on if hard dropped. */
  ghostY(): number {
    const piece = this.active!;
    let y = piece.y;
    while (this.fits({ ...piece, y: y + 1 })) y++;
    return y;
  }

  private fits(piece: ActivePiece): boolean {
    return pieceCells(piece).every(([x, y]) => !this.board.isBlocked(x, y));
  }

  private isGrounded(): boolean {
    const piece = this.active!;
    return !this.fits({ ...piece, y: piece.y + 1 });
  }

  private tryMove(dx: number, dy: number, byPlayer: boolean): boolean {
    const piece = this.active;
    if (!piece || this.state !== 'playing') return false;

    const moved = { ...piece, x: piece.x + dx, y: piece.y + dy };
    if (!this.fits(moved)) return false;
    this.active = moved;
    this.lastMoveWasRotation = false;
    this.onMoved(byPlayer);
    return true;
  }

  /**
   * Extended placement lock down: each player move resets the lock delay, at most
   * MAX_LOCK_RESETS times; reaching a new lowest row restores the full allowance.
   */
  private onMoved(byPlayer: boolean): void {
    this.revision++;
    const { y } = this.active!;
    if (y > this.lowestY) {
      this.lowestY = y;
      this.lockResets = 0;
      this.lockTimer = 0;
    } else if (byPlayer && this.lockResets < MAX_LOCK_RESETS) {
      this.lockResets++;
      this.lockTimer = 0;
    }
  }

  private spawn(type: PieceType): void {
    const piece = spawnPosition(type);
    this.active = null;
    this.revision++;
    if (!this.fits(piece)) {
      this.state = 'over'; // block out
      return;
    }

    // The Guideline drops a new piece one row right away if nothing is in its path.
    const dropped = { ...piece, y: piece.y + 1 };
    this.active = this.fits(dropped) ? dropped : piece;
    this.lowestY = this.active.y;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.gravityTimer = 0;
    this.lastMoveWasRotation = false;
  }

  private lock(): void {
    const piece = this.active!;
    const tSpin = this.detectTSpin(piece);
    const cells = pieceCells(piece);
    this.board.place(cells, piece.type);
    this.award(this.board.clearFullRows(), tSpin);

    if (cells.every(([, y]) => y < HIDDEN_ROWS)) {
      this.active = null;
      this.state = 'over'; // lock out: piece locked entirely above the visible field
      this.revision++;
      return;
    }
    this.holdUsed = false;
    this.spawn(this.source.next());
  }

  /** 3-corner rule; the two corners the T points at decide between full and mini. */
  private detectTSpin(piece: ActivePiece): TSpin {
    if (piece.type !== 'T' || !this.lastMoveWasRotation) return 'none';

    // Corners of the 3x3 box clockwise from top-left: rotation r points at corners r and r + 1.
    const corners = [[0, 0], [2, 0], [2, 2], [0, 2]].map(([cx, cy]) =>
      this.board.isBlocked(piece.x + cx, piece.y + cy),
    );
    if (corners.filter(Boolean).length < 3) return 'none';

    const front = corners[piece.rotation] && corners[(piece.rotation + 1) % 4];
    // A rotation that needed the last SRS kick test always counts as a full T-Spin.
    return front || this.lastKick === 4 ? 'full' : 'mini';
  }

  private award(lines: number, tSpin: TSpin): void {
    this.combo = lines > 0 ? this.combo + 1 : -1;
    if (lines === 0 && tSpin === 'none') return;

    const difficult = isDifficult(lines, tSpin);
    const backToBack = difficult && this.backToBack;
    let points = basePoints(lines, tSpin) * this.level;
    if (backToBack) points *= BACK_TO_BACK_MULTIPLIER;
    if (this.combo > 0) points += COMBO_POINTS * this.combo * this.level;
    // Only line clears affect the chain; a T-Spin without lines neither builds nor breaks it.
    if (lines > 0) this.backToBack = difficult;

    const labels = [clearName(lines, tSpin)];
    if (backToBack) labels.unshift('Back-to-Back');
    if (this.combo > 0) labels.push(`Combo ×${this.combo}`);

    this.score += points;
    this.lines += lines;
    this.level = 1 + Math.floor(this.lines / LINES_PER_LEVEL);
    this.lastAction = { labels, points };
  }
}
