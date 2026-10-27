import { Board, COLS, HIDDEN_ROWS, ROWS, VISIBLE_ROWS } from './board.js';
import { SevenBag } from './bag.js';
import { PIECE_ID, ROTATIONS, SPAWN_POS, kicksFor, type Cell, type PieceType } from './pieces.js';
import { clearPoints, isDifficult, type TSpin } from './scoring.js';

export { COLS, HIDDEN_ROWS, ROWS, VISIBLE_ROWS };

/** Guideline timings. */
export const LOCK_DELAY_MS = 500;
export const MAX_LOCK_RESETS = 15;
export const NEXT_QUEUE_SIZE = 5;
/** Soft drop falls 20x faster than gravity. */
export const SOFT_DROP_FACTOR = 20;
export const SOFT_DROP_POINT_PER_CELL = 1;
export const HARD_DROP_POINT_PER_CELL = 2;

/** Gravity as seconds per row (levels 1-10 use the fixed table). */
const GRAVITY_BY_LEVEL_MS = [1000, 793, 613, 473, 356, 262, 190, 135, 94, 65];

export function gravityIntervalMs(level: number): number {
  if (level <= 10) return GRAVITY_BY_LEVEL_MS[level - 1];
  // Guideline formula for level 10+: (0.8 - (L-1) * 0.007) ^ (L-1) seconds.
  const seconds = Math.pow(0.8 - (level - 1) * 0.007, level - 1);
  return Math.max(1, seconds * 1000);
}

export interface Placement {
  type: PieceType;
  /** Rotation state index: 0 spawn, 1 = R, 2, 3 = L. */
  rot: number;
  /** Position of the piece's bounding box on the board. */
  x: number;
  y: number;
}

export type GameState = 'playing' | 'gameover';

export interface GameOptions {
  random?: () => number;
}

/**
 * Guideline Tetris engine, free of DOM code so it can run headless in tests.
 * Drive it with action methods (moveHoriz, rotate, hardDrop, holdPiece,
 * setSoftDrop) plus update(dt) each frame; inspect the public fields.
 */
export class Game {
  readonly board = new Board();
  private readonly bag: SevenBag;

  current: Placement;
  /** The upcoming pieces shown in the next queue. */
  upcoming: PieceType[] = [];
  hold: PieceType | null = null;
  /** Hold is unlocked again when the current piece locks. */
  canHold = true;

  score = 0;
  lines = 0;
  level = 1;
  comboCount = 0;
  b2bChain = 0;
  state: GameState = 'playing';

  private softDropping = false;
  private gravityTimer = 0;
  private lockTimer = 0;
  private lockResets = 0;
  /** T-spin state for the current piece, reset by any sideways movement. */
  private tspin: TSpin = 'none';

  constructor(options: GameOptions = {}) {
    this.bag = new SevenBag(options.random);
    this.current = { type: 'O', rot: 0, x: -99, y: -99 }; // replaced by restart
    this.restart();
  }

  /** Cells of the current piece in its board placement. */
  get cells(): readonly Cell[] {
    return ROTATIONS[this.current.type][this.current.rot];
  }

  setSoftDrop(active: boolean): void {
    this.softDropping = active;
  }

  moveHoriz(dir: -1 | 1): boolean {
    if (this.state !== 'playing') return false;
    const p = this.current;
    if (this.board.overlaps(this.cells, p.x + dir, p.y)) return false;
    p.x += dir;
    this.tspin = 'none';
    this.tryLockDelayReset();
    return true;
  }

  rotate(dir: 1 | -1): boolean {
    if (this.state !== 'playing') return false;
    const p = this.current;
    const from = p.rot;
    const to = (from + dir + 4) % 4;
    const cells = ROTATIONS[p.type][to];
    const kicks = kicksFor(p.type, from, to);
    for (let i = 0; i < kicks.length; i++) {
      const [dx, dy] = kicks[i];
      if (!this.board.overlaps(cells, p.x + dx, p.y + dy)) {
        p.x += dx;
        p.y += dy;
        p.rot = to;
        this.tspin = p.type === 'T' ? this.detectTSpin(i) : 'none';
        this.tryLockDelayReset();
        return true;
      }
    }
    return false;
  }

  hardDrop(): void {
    if (this.state !== 'playing') return;
    const p = this.current;
    let distance = 0;
    while (!this.board.overlaps(this.cells, p.x, p.y + 1)) {
      p.y++;
      distance++;
    }
    this.score += HARD_DROP_POINT_PER_CELL * distance;
    // A spin only survives the slam when the rotation already parked the
    // piece in its final spot; moving down cancels it.
    if (distance > 0) this.tspin = 'none';
    this.lockPiece();
  }

  /** Column row where the current piece would land: the ghost piece target. */
  ghostY(): number {
    let y = this.current.y;
    while (!this.board.overlaps(this.cells, this.current.x, y + 1)) y++;
    return y;
  }

  holdPiece(): void {
    if (this.state !== 'playing' || !this.canHold) return;
    const stored = this.hold;
    this.hold = this.current.type;
    this.canHold = false;
    if (stored !== null) {
      this.spawnAs(stored);
    } else {
      this.spawnNext();
    }
  }

  /** Advance gravity and lock delay by dt milliseconds. */
  update(dtMs: number): void {
    if (this.state !== 'playing') return;
    const dt = Math.min(dtMs, 250); // ignore tab-switch gaps
    const p = this.current;
    const interval = gravityIntervalMs(this.level) / (this.softDropping ? SOFT_DROP_FACTOR : 1);

    if (this.board.overlaps(this.cells, p.x, p.y + 1)) {
      this.lockTimer += dt;
      if (this.softDropping || this.lockTimer >= LOCK_DELAY_MS) {
        this.lockPiece();
      }
    } else {
      this.lockTimer = 0;
      this.gravityTimer += dt;
      let steps = 40; // bound per-frame steps at 20G
      while (this.gravityTimer >= interval && steps-- > 0 && this.state === 'playing') {
        this.gravityTimer -= interval;
        if (this.board.overlaps(this.cells, p.x, p.y + 1)) break;
        p.y++;
        this.lockResets = 0;
        this.tspin = 'none'; // gravity moved the piece after a rotation
        if (this.softDropping) this.score += SOFT_DROP_POINT_PER_CELL;
      }
    }
  }

  restart(): void {
    this.board.reset();
    this.upcoming.length = 0;
    for (let i = 0; i < NEXT_QUEUE_SIZE; i++) this.upcoming.push(this.bag.next());
    this.hold = null;
    this.canHold = true;
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.comboCount = 0;
    this.b2bChain = 0;
    this.softDropping = false;
    this.gravityTimer = 0;
    this.state = 'playing';
    this.spawnNext();
  }

  private spawnNext(): void {
    const type = this.upcoming.shift() ?? this.bag.next();
    this.upcoming.push(this.bag.next());
    this.spawnAs(type);
  }

  private spawnAs(type: PieceType): void {
    const [x, y] = SPAWN_POS[type];
    this.current = { type, rot: 0, x, y };
    this.gravityTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.tspin = 'none';
    // Top-out: a blocked spawn ends the game (Guideline block out).
    if (this.board.overlaps(this.cells, x, y)) {
      this.state = 'gameover';
    }
  }

  private lockPiece(): void {
    const p = this.current;
    this.board.place(this.cells, p.x, p.y, PIECE_ID[p.type]);

    const cleared = this.board.clearFullRows();
    const perfect = cleared > 0 && this.board.isEmpty();

    this.comboCount = cleared > 0 ? this.comboCount + 1 : 0;
    const difficult = isDifficult(cleared, this.tspin);
    const wasB2B = this.b2bChain > 0 && difficult;

    this.score += clearPoints({
      lines: cleared,
      tspin: this.tspin,
      perfect,
      wasB2B,
      comboCount: this.comboCount,
      level: this.level,
    });

    if (cleared > 0) {
      this.b2bChain = difficult ? this.b2bChain + 1 : 0;
    }
    this.lines += cleared;
    this.level = 1 + Math.floor(this.lines / 10);
    this.canHold = true;

    this.spawnNext();
  }

  /**
   * Guideline move reset: while grounded, successful moves/rotations restart
   * the lock timer up to MAX_LOCK_RESETS times. Gravity steps clear the
   * counter.
   */
  private tryLockDelayReset(): void {
    const p = this.current;
    if (this.board.overlaps(this.cells, p.x, p.y + 1) && this.lockResets < MAX_LOCK_RESETS) {
      this.lockResets++;
      this.lockTimer = 0;
    }
  }

  /**
   * 3-corner rule for T pieces, evaluated right after a rotation.
   * Both front corners filled (or the 5th kick test) makes a full T-spin,
   * otherwise it is a mini.
   */
  private detectTSpin(kickIndex: number): TSpin {
    const p = this.current;
    const cx = p.x + 1;
    const cy = p.y + 1; // T's center mino
    const tl = this.board.solidAt(cx - 1, cy - 1);
    const tr = this.board.solidAt(cx + 1, cy - 1);
    const bl = this.board.solidAt(cx - 1, cy + 1);
    const br = this.board.solidAt(cx + 1, cy + 1);

    const filled = Number(tl) + Number(tr) + Number(bl) + Number(br);
    if (filled < 3) return 'none';

    // Front corners point toward the opening of the T, per rotation state.
    let frontFilled: number;
    switch (p.rot) {
      case 0: frontFilled = Number(tl) + Number(tr); break;
      case 1: frontFilled = Number(tr) + Number(br); break;
      case 2: frontFilled = Number(bl) + Number(br); break;
      default: frontFilled = Number(tl) + Number(bl); break;
    }
    if (frontFilled === 2 || kickIndex === 4) return 'full';
    return 'mini';
  }
}
