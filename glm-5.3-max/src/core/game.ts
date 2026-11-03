import { Board, HIDDEN_ROWS } from "./board.js";
import { SevenBag } from "./randomizer.js";
import {
  BACK_TO_BACK_MULTIPLIER,
  COMBO_POINTS,
  HARD_DROP_POINTS,
  LINE_CLEAR_POINTS,
  MINI_TSPIN_POINTS,
  SOFT_DROP_POINTS,
  TSPIN_POINTS,
  gravitySeconds,
  levelForLines,
  type TSpinKind,
} from "./rules.js";
import { PIECES, wallKicks, type PieceType, type Rotation } from "./tetromino.js";

/** Guideline lock delay: a grounded piece locks after half a second. */
export const LOCK_DELAY_MS = 500;

/** "Move reset": shifts and rotations refresh the lock delay at most 15 times. */
export const MAX_LOCK_RESETS = 15;

/** Soft drop makes the piece fall 20 times faster than gravity. */
const SOFT_DROP_FACTOR = 20;

/** Pieces shown in the next preview; the queue is kept a little deeper. */
const NEXT_VISIBLE = 5;
const QUEUE_MIN = NEXT_VISIBLE + 2;

/** A piece in play. x/y is the top-left corner of its rotation box. */
export interface ActivePiece {
  readonly type: PieceType;
  rotation: Rotation;
  x: number;
  y: number;
}

/** What happened on the most recent lock; the UI shows it as a message. */
export interface LockInfo {
  lines: number;
  tspin: TSpinKind;
  backToBack: boolean;
  /** Consecutive line clears including this one (1 means no combo yet). */
  combo: number;
  perfectClear: boolean;
  /** Points awarded for the clear itself (drop points excluded). */
  points: number;
}

type LastAction = "spawn" | "move" | "rotate" | "fall";

/**
 * The complete game state machine: gravity, lock delay, SRS rotation with wall
 * kicks, hold, the next queue, guideline scoring and top-out detection.
 * It is fully headless - the UI only reads state and calls the command methods.
 */
export class Game {
  readonly board = new Board();
  active: ActivePiece | null = null;
  hold: PieceType | null = null;
  canHold = true;
  readonly queue: PieceType[] = [];
  score = 0;
  lines = 0;
  level = 1;
  gameOver = false;
  lastLock: LockInfo | null = null;
  /** Bumped on every lock and restart so the UI can notice new results. */
  lockVersion = 0;

  private bag = new SevenBag();
  private gravityAcc = 0;
  private lockTimer = 0;
  private lockResets = 0;
  private lowestY = 0;
  private lastAction: LastAction = "spawn";
  private lastKick = 0;
  private comboStreak = 0;
  private backToBackChain = false;

  constructor() {
    this.restart();
  }

  restart(): void {
    this.board.reset();
    this.bag = new SevenBag();
    this.queue.length = 0;
    this.hold = null;
    this.canHold = true;
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.gameOver = false;
    this.lastLock = null;
    this.comboStreak = 0;
    this.backToBackChain = false;
    this.lockVersion++;
    this.refill();
    this.spawnNext();
  }

  /** Advances gravity (and lock delay once grounded) by dt milliseconds. */
  update(dt: number, softDrop = false): void {
    if (this.gameOver || !this.active) return;
    if (this.canFall()) {
      const secondsPerRow = gravitySeconds(this.level) / (softDrop ? SOFT_DROP_FACTOR : 1);
      this.gravityAcc += dt / 1000;
      while (this.gravityAcc >= secondsPerRow) {
        this.gravityAcc -= secondsPerRow;
        if (!this.canFall()) break;
        this.moveDown();
        if (softDrop) this.score += SOFT_DROP_POINTS;
      }
      if (!this.canFall()) this.gravityAcc = 0;
    } else {
      this.gravityAcc = 0;
      this.lockTimer += dt;
      if (this.lockTimer >= LOCK_DELAY_MS) this.lock();
    }
  }

  /** Shifts the piece sideways; returns whether it moved. */
  move(dx: number): boolean {
    const piece = this.active;
    if (!piece || this.gameOver) return false;
    if (!this.fits(piece.type, piece.x + dx, piece.y, piece.rotation)) return false;
    piece.x += dx;
    this.lastAction = "move";
    this.refreshLockDelay();
    return true;
  }

  /** Rotates the piece using SRS wall kicks; +1 clockwise, -1 counter-clockwise. */
  rotate(dir: 1 | -1): boolean {
    const piece = this.active;
    if (!piece || this.gameOver) return false;
    const to = ((piece.rotation + dir + 4) % 4) as Rotation;
    const kicks = wallKicks(piece.type, piece.rotation, to);
    for (let i = 0; i < kicks.length; i++) {
      const [dx, dy] = kicks[i];
      if (!this.fits(piece.type, piece.x + dx, piece.y + dy, to)) continue;
      piece.rotation = to;
      piece.x += dx;
      piece.y += dy;
      this.lastAction = "rotate";
      this.lastKick = i;
      if (piece.y > this.lowestY) {
        this.lowestY = piece.y;
        this.lockResets = 0;
      }
      this.refreshLockDelay();
      return true;
    }
    return false;
  }

  /** Row the piece's box would land at if it dropped straight down. */
  ghostY(): number {
    const piece = this.active;
    if (!piece) return 0;
    let y = piece.y;
    while (this.fits(piece.type, piece.x, y + 1, piece.rotation)) y++;
    return y;
  }

  /** Drops the piece to its landing row, scores 2 points per row and locks. */
  hardDrop(): void {
    const piece = this.active;
    if (!piece || this.gameOver) return;
    const target = this.ghostY();
    const distance = target - piece.y;
    if (distance > 0) {
      piece.y = target;
      if (piece.y > this.lowestY) {
        this.lowestY = piece.y;
        this.lockResets = 0;
      }
      this.lastAction = "fall";
      this.score += distance * HARD_DROP_POINTS;
    }
    this.lock();
  }

  /** One immediate soft-drop row, used when the down key is first pressed. */
  softDropStep(): void {
    if (this.gameOver || !this.active || !this.canFall()) return;
    this.moveDown();
    this.score += SOFT_DROP_POINTS;
    this.gravityAcc = 0;
  }

  /** Stores the current piece and brings back the held one; once per piece. */
  holdPiece(): void {
    const piece = this.active;
    if (!piece || this.gameOver || !this.canHold) return;
    this.canHold = false;
    const current = piece.type;
    if (this.hold === null) {
      this.hold = current;
      this.spawnNext();
    } else {
      const swapped = this.hold;
      this.hold = current;
      this.spawn(swapped);
    }
  }

  /** Absolute board cells covered by a piece (used for rendering and tests). */
  cellsOf(piece: ActivePiece): [number, number][] {
    return PIECES[piece.type].states[piece.rotation].map(
      ([cx, cy]) => [piece.x + cx, piece.y + cy] as [number, number],
    );
  }

  private refill(): void {
    while (this.queue.length < QUEUE_MIN) this.queue.push(this.bag.next());
  }

  private fits(type: PieceType, x: number, y: number, rotation: Rotation): boolean {
    return PIECES[type].states[rotation].every(([cx, cy]) => !this.board.isBlocked(x + cx, y + cy));
  }

  private canFall(): boolean {
    const piece = this.active!;
    return this.fits(piece.type, piece.x, piece.y + 1, piece.rotation);
  }

  private moveDown(): void {
    const piece = this.active!;
    piece.y++;
    if (piece.y > this.lowestY) {
      this.lowestY = piece.y;
      this.lockResets = 0;
    }
    this.lockTimer = 0;
    this.lastAction = "fall";
  }

  /** Shifts and rotations refresh the lock delay while grounded ("move reset"). */
  private refreshLockDelay(): void {
    if (!this.active || this.canFall()) return;
    if (this.lockResets < MAX_LOCK_RESETS) {
      this.lockTimer = 0;
      this.lockResets++;
    }
  }

  private spawn(type: PieceType): void {
    const def = PIECES[type];
    if (!this.fits(type, def.spawnX, 0, 0)) {
      this.active = null;
      this.gameOver = true; // block out: the spawn position is occupied
      return;
    }
    const piece: ActivePiece = { type, rotation: 0, x: def.spawnX, y: 0 };
    if (this.fits(type, def.spawnX, 1, 0)) piece.y = 1; // guideline: drop one row if free
    this.active = piece;
    this.gravityAcc = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lowestY = piece.y;
    this.lastAction = "spawn";
    this.lastKick = 0;
  }

  private spawnNext(): void {
    const type = this.queue.shift()!;
    this.refill();
    this.spawn(type);
  }

  private lock(): void {
    const piece = this.active!;
    const tspin = this.detectTSpin();
    const cells = this.cellsOf(piece);
    const allHidden = cells.every(([, y]) => y < HIDDEN_ROWS);
    for (const [x, y] of cells) {
      if (y >= 0) this.board.grid[y][x] = piece.type;
    }
    this.active = null;

    if (allHidden) {
      this.gameOver = true; // lock out: locked entirely above the visible field
      this.lockVersion++;
      return;
    }

    const cleared = this.board.clearLines();
    const level = this.level; // clears score at the level they happened

    let base: number;
    if (tspin === "full") base = TSPIN_POINTS[Math.min(cleared, 3)];
    else if (tspin === "mini") base = MINI_TSPIN_POINTS[Math.min(cleared, 2)];
    else base = LINE_CLEAR_POINTS[Math.min(cleared, 4)];

    let points = base * level;
    const difficult = cleared === 4 || (cleared > 0 && tspin !== "none");
    let backToBack = false;
    if (cleared > 0) {
      if (difficult && this.backToBackChain) {
        points = Math.round(points * BACK_TO_BACK_MULTIPLIER);
        backToBack = true;
      }
      this.backToBackChain = difficult; // a plain clear breaks the chain
      this.comboStreak++;
      points += COMBO_POINTS * (this.comboStreak - 1) * level;
    } else {
      this.comboStreak = 0;
    }

    this.score += points;
    this.lines += cleared;
    this.level = levelForLines(this.lines);
    this.lastLock = {
      lines: cleared,
      tspin,
      backToBack,
      combo: this.comboStreak,
      perfectClear: cleared > 0 && this.board.isEmpty(),
      points,
    };
    this.lockVersion++;
    this.canHold = true;
    this.spawnNext();
  }

  /**
   * T-spin detection, guideline 3-corner rule: the piece is a T, its last
   * successful action was a rotation, and at least three of the four corners
   * around the T's centre are occupied by the stack, walls or floor.
   */
  private detectTSpin(): TSpinKind {
    const piece = this.active!;
    if (piece.type !== "T" || this.lastAction !== "rotate") return "none";

    const corners = [
      this.board.isBlocked(piece.x, piece.y), // 0: top-left
      this.board.isBlocked(piece.x + 2, piece.y), // 1: top-right
      this.board.isBlocked(piece.x, piece.y + 2), // 2: bottom-left
      this.board.isBlocked(piece.x + 2, piece.y + 2), // 3: bottom-right
    ];
    if (corners.filter(Boolean).length < 3) return "none";

    // Front corners sit on the side the T points to (state 0 up, 1 right,
    // 2 down, 3 left). Both front corners occupied makes a full T-spin…
    const FRONT_CORNERS: Record<Rotation, [number, number]> = {
      0: [0, 1],
      1: [1, 3],
      2: [2, 3],
      3: [0, 2],
    };
    const [a, b] = FRONT_CORNERS[piece.rotation];
    if (corners[a] && corners[b]) return "full";

    // …unless the rotation needed the final SRS kick test (the T-Spin Triple
    // kick), which always upgrades the spin to full.
    if (this.lastKick === 4) return "full";
    return "mini";
  }
}
