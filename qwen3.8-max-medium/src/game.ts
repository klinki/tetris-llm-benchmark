import { Board } from "./board.js";
import {
  COLOR_IDS,
  KICKS_I,
  KICKS_JLSTZ,
  PieceType,
  SPAWN_COL,
  SPAWN_ROW,
  STATES,
} from "./pieces.js";
import { Bag } from "./random.js";

/**
 * Pure game logic (no DOM), following the Tetris Guideline:
 * gravity curve, lock delay with move reset, Guideline scoring
 * (line clears, T-spins, back-to-back, combos, soft/hard drop)
 * and top-out on blocked spawn or lock out.
 */

export interface ActivePiece {
  type: PieceType;
  rot: number; // rotation state 0..3
  row: number; // board row of the matrix top-left corner
  col: number; // board col of the matrix top-left corner
}

export type TSpin = "none" | "mini" | "full";

export interface ClearInfo {
  text: string;
  points: number;
}

export const LOCK_DELAY_MS = 500;
export const MAX_LOCK_RESETS = 15;
export const NEXT_QUEUE_SIZE = 7;
export const LINES_PER_LEVEL = 10;

/** Guideline gravity: seconds per row for the given level. */
export function gravityIntervalMs(level: number): number {
  const seconds = Math.pow(0.8 - (level - 1) * 0.007, level - 1);
  return seconds * 1000;
}

const LINE_CLEAR_POINTS = [0, 100, 300, 500, 800];
const TSPIN_POINTS = {
  full: [400, 800, 1200, 1600],
  mini: [100, 200, 400, 400],
};
const CLEAR_NAMES = ["", "SINGLE", "DOUBLE", "TRIPLE", "TETRIS"];

export class Game {
  readonly board = new Board();
  nextQueue: PieceType[] = [];
  current: ActivePiece | null = null;
  hold: PieceType | null = null;
  canHold = true;
  score = 0;
  lines = 0;
  level = 1;
  combo = -1;
  backToBack = false;
  gameOver = false;
  paused = false;
  softDropHeld = false;
  lastClear: ClearInfo | null = null;

  private bag: Bag;
  private gravityAccum = 0;
  private lockTimer = 0;
  private lockResets = 0;
  private lastMoveWasRotation = false;
  private lastKickIndex = -1;

  constructor(private rng: () => number = Math.random) {
    this.bag = new Bag(rng);
    this.refillQueue();
    this.placePiece(this.nextQueue.shift()!);
    this.refillQueue();
  }

  restart(): void {
    this.board.reset();
    this.nextQueue = [];
    this.hold = null;
    this.canHold = true;
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.combo = -1;
    this.backToBack = false;
    this.gameOver = false;
    this.paused = false;
    this.softDropHeld = false;
    this.lastClear = null;
    this.bag = new Bag(this.rng);
    this.refillQueue();
    this.placePiece(this.nextQueue.shift()!);
    this.refillQueue();
  }

  /** Advance gravity, soft drop and lock delay. */
  update(dtMs: number): void {
    if (this.gameOver || this.paused || !this.current) return;
    const natural = gravityIntervalMs(this.level);
    const interval = this.softDropHeld ? Math.max(natural / 20, 1) : natural;
    this.gravityAccum += dtMs;
    while (this.gravityAccum >= interval) {
      this.gravityAccum -= interval;
      if (!this.stepDown()) break;
      if (this.softDropHeld) this.score += 1; // soft drop: 1 point per cell
    }
    if (this.isGrounded()) {
      this.lockTimer += dtMs;
      if (this.lockTimer >= LOCK_DELAY_MS) this.lockPiece();
    } else {
      this.lockTimer = 0;
    }
  }

  move(dx: number): boolean {
    const p = this.current;
    if (!p || this.gameOver || this.paused) return false;
    if (this.board.collides(STATES[p.type][p.rot], p.row, p.col + dx)) return false;
    p.col += dx;
    this.lastMoveWasRotation = false;
    this.resetLockDelay();
    return true;
  }

  /** Rotate with SRS wall kicks. dir = 1 clockwise, -1 counter-clockwise. */
  rotate(dir: 1 | -1): boolean {
    const p = this.current;
    if (!p || this.gameOver || this.paused) return false;
    if (p.type === "O") return true; // O never changes orientation
    const from = p.rot;
    const to = (from + dir + 4) % 4;
    const kicks = (p.type === "I" ? KICKS_I : KICKS_JLSTZ)[`${from}${to}`];
    const matrix = STATES[p.type][to];
    for (let i = 0; i < kicks.length; i++) {
      const [dx, dy] = kicks[i];
      const row = p.row - dy; // kick y points up, board rows point down
      const col = p.col + dx;
      if (!this.board.collides(matrix, row, col)) {
        p.rot = to;
        p.row = row;
        p.col = col;
        this.lastMoveWasRotation = true;
        this.lastKickIndex = i;
        this.resetLockDelay();
        return true;
      }
    }
    return false;
  }

  /** Instant drop to the landing position, then lock (2 points per cell). */
  hardDrop(): void {
    const p = this.current;
    if (!p || this.gameOver || this.paused) return;
    let distance = 0;
    while (this.stepDown()) distance++;
    this.score += distance * 2;
    this.lastMoveWasRotation = false;
    this.lockPiece();
  }

  /** Swap the current piece with the hold slot (once per piece). */
  holdPiece(): void {
    const p = this.current;
    if (!p || !this.canHold || this.gameOver || this.paused) return;
    const held = this.hold;
    this.hold = p.type;
    this.canHold = false;
    if (held) {
      this.placePiece(held);
    } else {
      this.placePiece(this.nextQueue.shift()!);
      this.refillQueue();
    }
  }

  /** Row where the current piece would land (ghost piece position). */
  dropPosition(): number {
    const p = this.current;
    if (!p) return 0;
    const matrix = STATES[p.type][p.rot];
    let row = p.row;
    while (!this.board.collides(matrix, row + 1, p.col)) row++;
    return row;
  }

  isGrounded(): boolean {
    const p = this.current;
    if (!p) return false;
    return this.board.collides(STATES[p.type][p.rot], p.row + 1, p.col);
  }

  private refillQueue(): void {
    while (this.nextQueue.length < NEXT_QUEUE_SIZE) this.nextQueue.push(this.bag.next());
  }

  private placePiece(type: PieceType): void {
    this.current = { type, rot: 0, row: SPAWN_ROW, col: SPAWN_COL[type] };
    this.gravityAccum = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lastMoveWasRotation = false;
    this.lastKickIndex = -1;
    // Top out: spawn position blocked.
    if (this.board.collides(STATES[type][0], this.current.row, this.current.col)) {
      this.gameOver = true;
    }
  }

  private stepDown(): boolean {
    const p = this.current!;
    if (this.board.collides(STATES[p.type][p.rot], p.row + 1, p.col)) return false;
    p.row += 1;
    this.lastMoveWasRotation = false;
    return true;
  }

  /** Move reset: grounded pieces get their lock delay refreshed, up to a cap. */
  private resetLockDelay(): void {
    if (this.isGrounded() && this.lockResets < MAX_LOCK_RESETS) {
      this.lockTimer = 0;
      this.lockResets++;
    }
  }

  private lockPiece(): void {
    const p = this.current!;
    const matrix = STATES[p.type][p.rot];
    const lockOut = this.board.lock(matrix, p.row, p.col, COLOR_IDS[p.type]);
    const spin = this.detectTSpin(p);
    const cleared = this.board.clearLines();
    this.lastClear = this.applyScoring(cleared, spin);
    this.lines += cleared;
    this.level = Math.floor(this.lines / LINES_PER_LEVEL) + 1;
    this.current = null;
    if (lockOut) {
      this.gameOver = true;
      return;
    }
    this.canHold = true;
    this.placePiece(this.nextQueue.shift()!);
    this.refillQueue();
  }

  /**
   * Guideline T-spin: the last move was a T rotation and at least 3 of the
   * 4 diagonal corners around the T center are occupied. Full spin when both
   * front corners are filled (or the rotation used the final wall kick).
   */
  private detectTSpin(p: ActivePiece): TSpin {
    if (p.type !== "T" || !this.lastMoveWasRotation) return "none";
    const corners: [number, number][] = [
      [p.row, p.col],           // top-left
      [p.row, p.col + 2],       // top-right
      [p.row + 2, p.col],       // bottom-left
      [p.row + 2, p.col + 2],   // bottom-right
    ];
    const filled = corners.map(([r, c]) => !this.board.isFree(r, c));
    if (filled.filter(Boolean).length < 3) return "none";
    // Front corners (where the T points) per rotation state.
    const frontByRot: [number, number][] = [[0, 1], [1, 3], [2, 3], [0, 2]];
    const [a, b] = frontByRot[p.rot];
    const frontFilled = (filled[a] ? 1 : 0) + (filled[b] ? 1 : 0);
    if (frontFilled === 2 || this.lastKickIndex === 4) return "full";
    return "mini";
  }

  /** Guideline scoring; returns a short label for the UI, or null when nothing happened. */
  private applyScoring(cleared: number, spin: TSpin): ClearInfo | null {
    const base =
      spin === "full" ? TSPIN_POINTS.full[cleared]
      : spin === "mini" ? TSPIN_POINTS.mini[cleared]
      : LINE_CLEAR_POINTS[cleared];
    let points = base * this.level;
    let text =
      spin !== "none"
        ? (spin === "mini" ? "T-SPIN MINI " : "T-SPIN ") + (cleared ? CLEAR_NAMES[cleared] : "")
        : CLEAR_NAMES[cleared];

    const difficult = cleared > 0 && (cleared === 4 || spin !== "none");
    if (difficult) {
      if (this.backToBack) {
        points = Math.floor(points * 1.5);
        text = "B2B " + text;
      }
      this.backToBack = true;
    } else if (cleared > 0) {
      this.backToBack = false;
    }

    if (cleared > 0) {
      this.combo += 1;
      if (this.combo > 0) {
        points += 50 * this.combo * this.level;
        text += ` COMBO x${this.combo}`;
      }
    } else {
      this.combo = -1;
    }

    this.score += points;
    return points > 0 || text ? { text: text.trim(), points } : null;
  }
}
