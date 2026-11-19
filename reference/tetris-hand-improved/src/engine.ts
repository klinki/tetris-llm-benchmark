/** Guideline Tetris rules with no browser dependencies. Time is in milliseconds. */
import { type Kind, type Point, type Rotation, SevenBag, kicks, shape } from "./pieces.js";

export const WIDTH = 10;
export const HEIGHT = 20;
/** Rows above the visible field (y < 0) where pieces spawn and may rest. */
export const HIDDEN = 20;
export const LOCK_DELAY = 500;
export const MAX_LOCK_RESETS = 15;
export const NEXT_COUNT = 5;
const SPAWN_X = 3;
const SPAWN_Y = -2;

export type Cell = Kind | null;
export interface Piece {
  kind: Kind;
  rotation: Rotation;
  x: number;
  y: number;
}
export type Status = "ready" | "playing" | "paused" | "over";
export type Spin = "full" | "mini" | null;
/** The most recent lock, used by the interface for messages and effects. */
export interface LockEvent {
  id: number;
  lines: number;
  spin: Spin;
  points: number;
  backToBack: boolean;
  combo: number;
  perfectClear: boolean;
}

const LINE_POINTS = [0, 100, 300, 500, 800];
const FULL_SPIN_POINTS = [400, 800, 1200, 1600];
const MINI_SPIN_POINTS = [100, 200, 400];
const PERFECT_CLEAR_POINTS = [0, 800, 1200, 1800, 2000];
const BACK_TO_BACK_TETRIS_PERFECT_CLEAR = 3200;
/** T corners in box order: top-left, top-right, bottom-right, bottom-left. */
const T_CORNERS: readonly Point[] = [[0, 0], [2, 0], [2, 2], [0, 2]];
/** The two corners beside the T's pointing side, for each rotation. */
const T_FRONT: readonly (readonly [number, number])[] = [[0, 1], [1, 2], [2, 3], [3, 0]];
/** The SRS kick that may promote a mini T-spin to a full one. */
const PROMOTING_KICK = 4;

/** A position for `Game.setUp`: a stack, an active piece and progress to start from. */
export interface Position {
  /** Empty the board before adding `stack`. */
  clear?: boolean;
  /** Occupied cells as [x, y, kind]; y may be negative for the hidden rows. */
  stack?: readonly (readonly [number, number, Kind])[];
  active?: Piece;
  lines?: number;
  level?: number;
}

export class Game {
  private _board: Cell[][] = [];
  private _active: Piece | null = null;
  private _queue: Kind[] = [];
  private _held: Kind | null = null;
  private _canHold = true;
  private _status: Status = "ready";
  private _score = 0;
  private _lines = 0;
  private _level = 1;
  private _combo = -1;
  private _backToBack = false;
  private _elapsed = 0;
  private _pieces = 0;
  private _lastLock: LockEvent = emptyLock(0);
  private bag!: SevenBag; // created by restart()
  private fallTime = 0;
  private lockTime = 0;
  private lockResets = 0;
  private lowestY = SPAWN_Y;
  /** Kick index of the last successful rotation; null once the piece translates. */
  private rotationKick: number | null = null;

  // Read-only view of the state; it only changes through the actions below.
  get board(): readonly (readonly Cell[])[] { return this._board; }
  get active(): Readonly<Piece> | null { return this._active; }
  get queue(): readonly Kind[] { return this._queue; }
  get held(): Kind | null { return this._held; }
  get canHold(): boolean { return this._canHold; }
  get status(): Status { return this._status; }
  get score(): number { return this._score; }
  get lines(): number { return this._lines; }
  get level(): number { return this._level; }
  /** -1 when no combo is running; 0 after the first consecutive clear. */
  get combo(): number { return this._combo; }
  get backToBack(): boolean { return this._backToBack; }
  get elapsed(): number { return this._elapsed; }
  get pieces(): number { return this._pieces; }
  get lastLock(): LockEvent { return this._lastLock; }

  /**
   * Puts the game into a given position (for tests, puzzles and tools). A new
   * active piece starts like a freshly spawned one: fresh timers, no spin credit.
   */
  setUp(position: Position): void {
    if (position.clear) for (const row of this._board) row.fill(null);
    for (const [x, y, kind] of position.stack ?? []) {
      const row = this._board[y + HIDDEN];
      if (!row || x < 0 || x >= WIDTH) throw new RangeError(`Cell (${x}, ${y}) is outside the board`);
      row[x] = kind;
    }
    if (position.lines !== undefined) {
      this._lines = position.lines;
      this._level = 1 + Math.floor(position.lines / 10);
    }
    if (position.level !== undefined) this._level = position.level;
    if (position.active) {
      if (!this.fits(position.active)) throw new RangeError("The active piece overlaps the stack");
      this._active = { ...position.active };
      this.fallTime = this.lockTime = this.lockResets = 0;
      this.lowestY = this._active.y;
      this.rotationKick = null;
    }
  }

  constructor(private readonly random: () => number = Math.random) {
    this.restart(false);
  }

  restart(play = true): void {
    this._board = Array.from({ length: HEIGHT + HIDDEN }, () => Array<Cell>(WIDTH).fill(null));
    this.bag = new SevenBag(this.random);
    this._queue = [];
    this._held = null;
    this._canHold = true;
    this._score = this._lines = this._elapsed = this._pieces = 0;
    this._level = 1;
    this._combo = -1;
    this._backToBack = false;
    this._lastLock = emptyLock(this._lastLock.id + 1);
    this._status = play ? "playing" : "ready";
    this.spawnNext();
  }

  /** Starts, resumes, or (after game over) restarts play. */
  play(): void {
    if (this._status === "over") this.restart();
    else this._status = "playing";
  }

  pause(): void {
    if (this._status === "playing") this._status = "paused";
  }

  /** Guideline gravity: seconds per row = (0.8 − (level − 1) × 0.007)^(level − 1). */
  get gravityMs(): number {
    const level = Math.min(this._level, 20);
    return Math.max(1, 1000 * (0.8 - (level - 1) * 0.007) ** (level - 1));
  }

  /** Soft drop is twenty times faster than gravity, capped at 50 ms per row. */
  get softDropMs(): number {
    return Math.min(50, this.gravityMs / 20);
  }

  cell(x: number, y: number): Cell | undefined {
    return this._board[y + HIDDEN]?.[x];
  }

  cells(piece: Piece): Point[] {
    return shape(piece.kind, piece.rotation).map(([x, y]) => [piece.x + x, piece.y + y]);
  }

  fits(piece: Piece): boolean {
    return this.cells(piece).every(([x, y]) => this.cell(x, y) === null);
  }

  get grounded(): boolean {
    return !!this._active && !this.fits({ ...this._active, y: this._active.y + 1 });
  }

  ghost(): Piece | null {
    if (!this._active) return null;
    const ghost = { ...this._active };
    while (this.fits({ ...ghost, y: ghost.y + 1 })) ghost.y++;
    return ghost;
  }

  move(dx: -1 | 1): boolean {
    if (!this.canAct()) return false;
    const moved = this.place({ ...this._active!, x: this._active!.x + dx });
    if (moved) this.rotationKick = null;
    return moved;
  }

  rotate(direction: -1 | 1): boolean {
    if (!this.canAct()) return false;
    const piece = this._active!;
    const rotation = ((piece.rotation + direction + 4) % 4) as Rotation;
    const candidates = kicks(piece.kind, piece.rotation, rotation);
    for (const [index, [dx, dy]] of candidates.entries()) {
      if (this.place({ ...piece, rotation, x: piece.x + dx, y: piece.y + dy })) {
        this.rotationKick = index;
        return true;
      }
    }
    return false;
  }

  /** One row down by the player: 1 point, restarts the gravity phase, never locks. */
  softDrop(): boolean {
    if (!this.canAct() || !this.descend()) return false;
    this._score += 1;
    return true;
  }

  hardDrop(): number {
    if (!this.canAct()) return 0;
    const ghost = this.ghost()!;
    const distance = ghost.y - this._active!.y;
    if (distance > 0) {
      this._active = ghost;
      this.rotationKick = null;
    }
    this._score += 2 * distance;
    this.lock();
    return distance;
  }

  hold(): boolean {
    if (!this.canAct() || !this._canHold) return false;
    const previous = this._held;
    this._held = this._active!.kind;
    this._canHold = false;
    if (previous) this.spawn(previous);
    else this.spawnNext();
    return true;
  }

  /**
   * Advance the clock. Gravity and lock events are processed in time order, so
   * the outcome is the same however the time is split into frames.
   */
  update(milliseconds: number, softDropHeld = false): void {
    if (!Number.isFinite(milliseconds)) return;
    let remaining = milliseconds;
    while (remaining > 0 && this._status === "playing") {
      const interval = softDropHeld ? this.softDropMs : this.gravityMs;
      const grounded = this.grounded;
      // A resting piece waits on the lock timer; a falling one on gravity.
      const step = Math.min(
        remaining,
        grounded ? LOCK_DELAY - this.lockTime : Math.max(0, interval - this.fallTime),
      );
      remaining -= step;
      this._elapsed += step;
      if (grounded) {
        this.lockTime += step;
        if (this.lockTime >= LOCK_DELAY) this.lock();
      } else {
        this.fallTime += step;
        if (this.fallTime >= interval && this.descend() && softDropHeld) this._score += 1;
      }
    }
  }

  private canAct(): boolean {
    return this._status === "playing" && this._active !== null;
  }

  /** Moves the active piece if the target fits, applying the lock-delay reset rule. */
  private place(target: Piece): boolean {
    if (!this.fits(target)) return false;
    if (this.grounded && this.lockResets < MAX_LOCK_RESETS) {
      this.lockTime = 0;
      this.lockResets++;
    }
    this._active = target;
    this.reachLowestRow();
    return true;
  }

  private descend(): boolean {
    const piece = this._active;
    if (!piece || !this.fits({ ...piece, y: piece.y + 1 })) return false;
    piece.y++;
    this.fallTime = 0;
    this.rotationKick = null;
    this.reachLowestRow();
    return true;
  }

  /** Reaching a new lowest row, by falling or by a downward kick, restores the full lock delay and all resets. */
  private reachLowestRow(): void {
    const { y } = this._active!;
    if (y <= this.lowestY) return;
    this.lowestY = y;
    this.lockTime = 0;
    this.lockResets = 0;
  }

  private spawnNext(): void {
    while (this._queue.length <= NEXT_COUNT) this._queue.push(this.bag.next());
    this.spawn(this._queue.shift()!);
  }

  private spawn(kind: Kind): void {
    this._active = { kind, rotation: 0, x: SPAWN_X, y: SPAWN_Y };
    this.fallTime = this.lockTime = this.lockResets = 0;
    this.lowestY = SPAWN_Y;
    this.rotationKick = null;
    if (!this.fits(this._active)) {
      this._status = "over"; // Block out: the spawn position is occupied.
      return;
    }
    // Guideline: the piece drops one row as soon as it appears, if it can.
    this.descend();
  }

  private spin(): Spin {
    const piece = this._active!;
    if (piece.kind !== "T" || this.rotationKick === null) return null;
    const filled = T_CORNERS.map(([dx, dy]) => this.cell(piece.x + dx, piece.y + dy) !== null);
    if (filled.filter(Boolean).length < 3) return null;
    const [a, b] = T_FRONT[piece.rotation]!;
    return (filled[a] && filled[b]) || this.rotationKick === PROMOTING_KICK ? "full" : "mini";
  }

  private lock(): void {
    const piece = this._active!;
    const cells = this.cells(piece);
    const spin = this.spin();
    for (const [x, y] of cells) this._board[y + HIDDEN]![x] = piece.kind;
    const kept = this._board.filter((row) => row.includes(null));
    const cleared = this._board.length - kept.length;
    this._board = [...Array.from({ length: cleared }, () => Array<Cell>(WIDTH).fill(null)), ...kept];
    this.award(cleared, spin);
    this._pieces++;
    this._canHold = true;
    this._active = null;
    if (cells.every(([, y]) => y < 0)) {
      this._status = "over"; // Lock out: the piece settled wholly above the field.
      return;
    }
    this.spawnNext();
  }

  private award(lines: number, spin: Spin): void {
    const level = this._level; // Points use the level in effect before this clear.
    const table = spin === "full" ? FULL_SPIN_POINTS : spin === "mini" ? MINI_SPIN_POINTS : LINE_POINTS;
    const difficult = lines === 4 || (lines > 0 && spin !== null);
    const backToBack = difficult && this._backToBack;
    let points = (table[lines] ?? 0) * level * (backToBack ? 1.5 : 1);
    let perfectClear = false;
    if (lines > 0) {
      this._combo++;
      this._backToBack = difficult;
      points += 50 * this._combo * level;
      perfectClear = this._board.every((row) => !row.some(Boolean));
      if (perfectClear) {
        const bonus = backToBack && lines === 4 ? BACK_TO_BACK_TETRIS_PERFECT_CLEAR : PERFECT_CLEAR_POINTS[lines]!;
        points += bonus * level;
      }
    } else {
      this._combo = -1; // A lock without a clear ends the combo but keeps back-to-back.
    }
    this._score += points;
    this._lines += lines;
    this._level = 1 + Math.floor(this._lines / 10);
    this._lastLock = {
      id: this._lastLock.id + 1,
      lines,
      spin,
      points,
      backToBack,
      combo: lines > 0 ? this._combo : -1,
      perfectClear,
    };
  }
}

function emptyLock(id: number): LockEvent {
  return { id, lines: 0, spin: null, points: 0, backToBack: false, combo: -1, perfectClear: false };
}

/** Human-readable name of a lock event, e.g. "Back-to-back T-spin Double". */
export function describeLock(event: LockEvent): string {
  const names = ["", "Single", "Double", "Triple", "Tetris"];
  const spin = event.spin === "full" ? "T-spin" : event.spin === "mini" ? "Mini T-spin" : "";
  return [
    event.backToBack ? "Back-to-back" : "",
    [spin, names[event.lines]].filter(Boolean).join(" "),
    event.combo > 0 ? `Combo ×${event.combo}` : "",
    event.perfectClear ? "Perfect clear" : "",
  ]
    .filter(Boolean)
    .join(" · ");
}
