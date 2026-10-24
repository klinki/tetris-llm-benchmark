/**
 * The game state machine: turning Guideline rules into an evolving state.
 * Deliberately DOM-free so it can run headless (used by the smoke tests).
 *
 * Time does not tick internally; the caller drives the game with `update(dt)`
 * once per animation frame, which keeps everything deterministic.
 */

import {
  B2B_MULTIPLIER,
  COMBO_SCORE,
  HIDDEN_ROWS,
  HARD_DROP_SCORE,
  LINES_PER_LEVEL,
  LINE_SCORES,
  LOCK_DELAY_MS,
  MAX_LOCK_RESETS,
  SOFT_DROP_FACTOR,
  SOFT_DROP_SCORE,
  TSPIN_MINI_SCORES,
  TSPIN_SCORES,
  gravityMs,
} from "./constants.js";
import { Field } from "./field.js";
import { SevenBag } from "./randomizer.js";
import {
  SPAWN_Y,
  attemptRotation,
  cellsOf,
  droppedOne,
  fits,
  ghostPiece,
  spawnX,
  type ActivePiece,
  type PieceType,
  type SpinDir,
} from "./tetromino.js";

export const NEXT_QUEUE_LENGTH = 5; // Guideline shows a 5 piece preview
export const MESSAGE_MS = 1600; // how long a lock message stays on screen

export type GameState = "playing" | "over";

const LINE_NAMES = [null, "SINGLE", "DOUBLE", "TRIPLE", "TETRIS"];

/** Corner occupancy check for the T-Spin rule, mirroring the Guideline. */
function cornerFilled(field: Field, x: number, y: number): boolean {
  return !field.isOpen(x, y);
}

/** The two corners facing the T's tip, for each rotation state. */
const TSpinFrontCorners = [
  ["tl", "tr"], // rot 0: tip up
  ["tr", "br"], // rot 1: tip right
  ["br", "bl"], // rot 2: tip down
  ["bl", "tl"], // rot 3: tip left
] as const;

/**
 * Diagnose the lock of a T piece. A T-Spin needs (a) the last performed move
 * to have been a rotation and (b) three of the four corners around the T's
 * centre filled. It is a "full" spin when the two corners facing the T's tip
 * are both filled, or when the rotation used the last (far) kick of the SRS
 * table; otherwise it is a Mini.
 */
export function detectTSpin(
  field: Field,
  piece: ActivePiece,
  kickIndex: number,
): "full" | "mini" | null {
  if (piece.type !== "T") return null;
  const cx = piece.x + 1;
  const cy = piece.y + 1;
  const corners = {
    tl: cornerFilled(field, cx - 1, cy - 1),
    tr: cornerFilled(field, cx + 1, cy - 1),
    br: cornerFilled(field, cx + 1, cy + 1),
    bl: cornerFilled(field, cx - 1, cy + 1),
  };
  if (Object.values(corners).filter(Boolean).length < 3) return null;

  const [a, b] = TSpinFrontCorners[piece.rot];
  const full = (corners[a] && corners[b]) || kickIndex >= 4;
  return full ? "full" : "mini";
}

export class Game {
  readonly field = new Field();
  readonly nextQueue: PieceType[] = [];
  piece: ActivePiece | null = null;
  hold: PieceType | null = null;
  state: GameState = "playing";

  score = 0;
  lines = 0;
  level = 1;
  combo = -1;
  backToBack = false;

  /** Set by the input layer while the down arrow is held. */
  softDrop = false;

  /** Brief celebration text after a memorable lock (T-SPIN DOUBLE, B2B...). */
  message = "";
  messageTimer = 0;

  private bag = new SevenBag();
  private gravityAcc = 0;
  private softAcc = 0;
  private lockAcc = 0;
  private lockResets = 0;
  private grounded = false;
  private lastRotation = false;
  private lastKickIndex = 0;
  private holdUsed = false;

  constructor() {
    this.spawnNext();
  }

  /** Start a fresh game. */
  reset(): void {
    this.field.reset();
    this.bag = new SevenBag();
    this.nextQueue.length = 0;
    this.hold = null;
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.combo = -1;
    this.backToBack = false;
    this.message = "";
    this.messageTimer = 0;
    this.holdUsed = false;
    this.state = "playing";
    this.spawnNext();
  }

  // -- Queries used by the renderer -----------------------------------------

  /** The piece's landing position, or null when the game is over. */
  ghost(): ActivePiece | null {
    return this.piece ? ghostPiece(this.field, this.piece) : null;
  }

  get rowsPerSecond(): number {
    return 1000 / gravityMs(this.level);
  }

  // -- Actions (called by the input layer) ----------------------------------

  move(dir: -1 | 1): boolean {
    const piece = this.piece;
    if (!piece || this.state === "over") return false;
    const target = { ...piece, x: piece.x + dir };
    if (!fits(this.field, target)) return false;
    this.piece = target;
    this.lastRotation = false;
    this.onSuccessfulMove();
    return true;
  }

  rotate(dir: SpinDir): boolean {
    const piece = this.piece;
    if (!piece || this.state === "over") return false;
    const result = attemptRotation(this.field, piece, dir);
    if (!result) return false;
    this.piece = result.piece;
    this.lastRotation = true;
    this.lastKickIndex = result.kickIndex;
    this.onSuccessfulMove();
    return true;
  }

  hardDrop(): boolean {
    const piece = this.piece;
    if (!piece || this.state === "over") return false;
    const landing = ghostPiece(this.field, piece);
    this.score += HARD_DROP_SCORE * (landing.y - piece.y);
    if (landing.y > piece.y) this.lastRotation = false;
    this.piece = landing;
    this.lockPiece();
    return true;
  }

  /** Swap the falling piece with the hold slot; allowed once per piece. */
  holdPiece(): boolean {
    if (!this.piece || this.state === "over" || this.holdUsed) return false;
    const falling = this.piece.type;
    const swap = this.hold;
    this.hold = falling;
    if (swap) this.spawnPiece(swap);
    else this.spawnNext();
    this.holdUsed = true;
    return true;
  }

  restart(): void {
    this.reset();
  }

  // -- Simulation -----------------------------------------------------------

  /** Advance the simulation by dt milliseconds (one animation frame). */
  update(dt: number): void {
    if (this.state === "over" || !this.piece) return;
    if (this.messageTimer > 0) this.messageTimer = Math.max(0, this.messageTimer - dt);

    this.fall(dt);
    this.settleLockDelay(dt);
  }

  private fall(dt: number): void {
    const piece = this.piece as ActivePiece;
    if (this.softDrop) {
      const interval = Math.max(10, gravityMs(this.level) / SOFT_DROP_FACTOR);
      this.softAcc += dt;
      while (this.softAcc >= interval) {
        this.softAcc -= interval;
        if (!this.stepDown(piece)) {
          this.softAcc = 0;
          break;
        }
      }
      return; // soft drop replaces ordinary gravity
    }

    const interval = gravityMs(this.level);
    this.gravityAcc = Math.min(this.gravityAcc + dt, interval);
    while (this.gravityAcc >= interval) {
      if (!this.stepDown(piece)) {
        this.gravityAcc = 0;
        return;
      }
      this.gravityAcc -= interval;
    }
  }

  /** Move one row down under gravity (or soft drop) scoring. */
  private stepDown(piece: ActivePiece): boolean {
    if (!fits(this.field, droppedOne(piece))) return false;
    piece.y += 1;
    this.lastRotation = false;
    if (this.softDrop) this.score += SOFT_DROP_SCORE;
    return true;
  }

  private settleLockDelay(dt: number): void {
    if (!this.piece) return;
    const landed = !fits(this.field, droppedOne(this.piece));
    if (!landed) {
      this.grounded = false;
      this.lockAcc = 0;
      return;
    }
    this.grounded = true;
    this.lockAcc += dt;
    if (this.lockAcc >= LOCK_DELAY_MS) this.lockPiece();
  }

  /** A move succeeded: Guideline move-reset refreshes the lock delay. */
  private onSuccessfulMove(): void {
    if (!this.grounded) return;
    if (this.lockResets < MAX_LOCK_RESETS) {
      this.lockAcc = 0;
      this.lockResets += 1;
    }
  }

  // -- Spawning and locking -------------------------------------------------

  private spawnNext(): void {
    while (this.nextQueue.length < NEXT_QUEUE_LENGTH) this.nextQueue.push(this.bag.take());
    this.spawnPiece(this.nextQueue.shift() as PieceType);
  }

  /** Place a piece at the spawn position; the game tops out when blocked. */
  private spawnPiece(type: PieceType): void {
    const piece: ActivePiece = { type, x: spawnX(type), y: SPAWN_Y, rot: 0 };
    if (!fits(this.field, piece)) {
      this.state = "over"; // blocked spawn: Guideline "block out"
      this.piece = null;
      return;
    }
    this.piece = piece;
    this.gravityAcc = 0;
    this.softAcc = 0;
    this.lockAcc = 0;
    this.lockResets = 0;
    this.grounded = false;
    this.lastRotation = false;
    this.lastKickIndex = 0;
    this.holdUsed = false;
  }

  /** Weld the piece into the field, score, then send the next piece. */
  private lockPiece(): void {
    const piece = this.piece as ActivePiece;
    const cells = cellsOf(piece.type, piece.rot);

    const spin = this.lastRotation ? detectTSpin(this.field, piece, this.lastKickIndex) : null;
    this.field.lockCells(cells, piece.x, piece.y, piece.type);
    const cleared = this.field.clearLines();

    if (cleared > 0) {
      this.combo += 1;
    } else {
      this.combo = -1; // the chain breaks unless a line was cleared
    }

    const eligible = cleared > 0 && (spin !== null || cleared === 4);
    const chained = eligible && this.backToBack;

    if (cleared > 0 || spin) {
      const base =
        spin === "full"
          ? TSPIN_SCORES[cleared]
          : spin === "mini"
            ? TSPIN_MINI_SCORES[Math.min(cleared, TSPIN_MINI_SCORES.length - 1)]
            : LINE_SCORES[cleared];
      let award = base * this.level;
      if (chained) award = Math.floor(award * B2B_MULTIPLIER);
      if (this.combo > 0) award += COMBO_SCORE * this.combo * this.level;
      this.score += award;
      if (cleared > 0) this.backToBack = eligible; // locks without clears keep the chain
      this.setMessage(spin, cleared, chained);
    } else {
      this.message = "";
    }

    this.lines += cleared;
    this.level = Math.floor(this.lines / LINES_PER_LEVEL) + 1;

    // "Lock out": the piece finished entirely above the skyline.
    if (lockedAboveSkyline(cells, piece)) {
      this.state = "over";
      this.piece = null;
      return;
    }

    this.spawnNext();
  }

  private setMessage(spin: "full" | "mini" | null, cleared: number, chained: boolean): void {
    const parts: string[] = [];
    if (chained) parts.push("B2B");
    if (spin === "mini") parts.push("T-SPIN MINI");
    else if (spin === "full") parts.push("T-SPIN");
    if (cleared > 0) parts.push(LINE_NAMES[cleared] as string);
    else if (!spin) parts.length = 0;
    this.message = parts.join(" ");
    this.messageTimer = this.message ? MESSAGE_MS : 0;
  }
}

/** True when every cell of the locked piece sits in the hidden rows. */
function lockedAboveSkyline(
  cells: ReadonlyArray<readonly [number, number]>,
  piece: ActivePiece,
): boolean {
  return cells.every(([, dy]) => piece.y + dy < HIDDEN_ROWS);
}
