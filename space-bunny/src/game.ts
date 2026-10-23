/**
 * The game engine. Pure logic: it owns the playfield, the active piece, the
 * hold and next queues, gravity, lock delay, scoring and top out detection.
 * It knows nothing about the DOM, canvas or browser timing - the caller feeds
 * it `update(deltaMs)` and player actions.
 */

import {
  COLS,
  HARD_DROP_SCORE,
  HIDDEN_ROWS,
  LINES_PER_LEVEL,
  LOCK_DELAY_MS,
  MAX_LOCK_RESETS,
  NEXT_COUNT,
  ROWS,
  SOFT_DROP_MS,
  SOFT_DROP_SCORE,
} from './constants.js';
import { Playfield } from './playfield.js';
import { type Random, SevenBagRandomizer } from './randomizer.js';
import {
  B2B_MULTIPLIER,
  clearKindOf,
  clearScore,
  comboScore,
  gravityMs,
  isDifficult,
  perfectClearScore,
} from './scoring.js';
import { detectTSpin, kickOffsets, pieceCells, spawnPosition } from './tetromino.js';
import type { Cell, GameState, PieceType, Rotation, TSpinKind } from './types.js';

/** The piece the player currently moves. */
export interface ActivePiece {
  type: PieceType;
  rotation: Rotation;
  x: number;
  y: number;
}

/** A clear worth telling the player about, used by the renderer. */
export interface ClearEvent {
  label: string;
  rows: number[];
  lines: number;
  score: number;
  /** Game time of the clear, in elapsed milliseconds. */
  at: number;
}

export interface GameOptions {
  random?: Random;
  startLevel?: number;
}

interface ClearResult {
  points: number;
  perfect: boolean;
}

export class Game {
  readonly playfield = new Playfield();

  state: GameState = 'playing';
  score = 0;
  lines = 0;
  level = 1;
  /** -1 while no clear is chained, 0 for the first clear of a combo, ... */
  combo = -1;
  backToBack = false;
  piecesPlaced = 0;
  /** Milliseconds of active play, drives the on screen timer. */
  elapsed = 0;

  current: ActivePiece | null = null;
  hold: PieceType | null = null;
  holdUsed = false;
  /** Upcoming pieces; the first entry spawns next. */
  next: PieceType[] = [];

  /** Most recent clear, used for the announcement. */
  lastClear: ClearEvent | null = null;

  private readonly randomizer: SevenBagRandomizer;
  private readonly startLevel: number;
  private gravityTimer = 0;
  private lockTimer = 0;
  private lockResets = 0;
  private grounded = false;
  private softDropping = false;
  /** Kick offset index of the last rotation, `null` when the last action was not a rotation. */
  private lastRotationKick: number | null = null;

  constructor(options: GameOptions = {}) {
    this.randomizer = new SevenBagRandomizer(options.random);
    this.startLevel = Math.max(1, options.startLevel ?? 1);
    this.reset();
  }

  /** Starts a fresh game. */
  reset(): void {
    this.playfield.reset();
    this.state = 'playing';
    this.score = 0;
    this.lines = 0;
    this.level = this.startLevel;
    this.combo = -1;
    this.backToBack = false;
    this.piecesPlaced = 0;
    this.elapsed = 0;
    this.current = null;
    this.hold = null;
    this.holdUsed = false;
    this.next = [];
    this.gravityTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.grounded = false;
    this.softDropping = false;
    this.lastRotationKick = null;
    this.lastClear = null;
    this.fillQueue();
    this.spawn(this.takeNextPiece());
  }

  /**
   * Advances gravity and lock delay by `dt` milliseconds. The caller is
   * responsible for clamping huge deltas (a backgrounded tab, a debugger
   * pause) - the engine advances exactly as much time as it is told.
   */
  update(dt: number): void {
    if (this.state !== 'playing') return;
    const delta = Math.max(dt, 0);
    this.elapsed += delta;
    this.applyGravity(delta);
    if (!this.grounded) return;
    this.lockTimer += delta;
    if (this.lockTimer >= LOCK_DELAY_MS) this.lockPiece();
  }

  /** Row the ghost piece rests at. */
  get ghostY(): number {
    const piece = this.current;
    if (!piece) return 0;
    let y = piece.y;
    while (!this.collides(piece, piece.rotation, piece.x, y + 1)) y += 1;
    return y;
  }

  /** True when the active piece cannot fall any further. */
  get isGrounded(): boolean {
    return this.grounded;
  }

  /** True while the held piece cannot be swapped again. */
  get isHoldLocked(): boolean {
    return this.holdUsed;
  }

  /** 0..1 progress of the lock delay. */
  get lockProgress(): number {
    return this.grounded ? Math.min(1, this.lockTimer / LOCK_DELAY_MS) : 0;
  }

  /** Blocks the active piece occupies. */
  activeCells(): readonly Cell[] {
    const piece = this.current;
    if (!piece) return [];
    return pieceCells(piece.type, piece.rotation).map((c) => ({ x: piece.x + c.x, y: piece.y + c.y }));
  }

  /** Blocks the ghost piece occupies. */
  ghostCells(): readonly Cell[] {
    const piece = this.current;
    if (!piece) return [];
    const y = this.ghostY;
    return pieceCells(piece.type, piece.rotation).map((c) => ({ x: piece.x + c.x, y }));
  }

  /** Block when the active piece is locked to the floor. */
  move(dx: number): boolean {
    const piece = this.activePiece();
    if (!piece || dx === 0) return false;
    if (this.collides(piece, piece.rotation, piece.x + dx, piece.y)) return false;
    piece.x += dx;
    this.lastRotationKick = null;
    this.afterMove();
    return true;
  }

  moveLeft(): boolean {
    return this.move(-1);
  }

  moveRight(): boolean {
    return this.move(1);
  }

  /** ArrowUp / X rotate clockwise, Z / left Ctrl counter clockwise. */
  rotate(clockwise: boolean): boolean {
    const piece = this.activePiece();
    if (!piece) return false;
    const from = piece.rotation;
    const to = ((from + (clockwise ? 1 : 3)) % 4) as Rotation;
    const offsets = kickOffsets(piece.type, from, to, clockwise);
    for (let i = 0; i < offsets.length; i += 1) {
      const offset = offsets[i] as Cell;
      if (this.collides(piece, to, piece.x + offset.x, piece.y + offset.y)) continue;
      piece.rotation = to;
      piece.x += offset.x;
      piece.y += offset.y;
      this.lastRotationKick = i;
      this.afterMove();
      return true;
    }
    return false;
  }

  /** One row down, without scoring - used by gravity and hard drop. */
  stepDown(): boolean {
    const piece = this.activePiece();
    if (!piece) return false;
    if (this.collides(piece, piece.rotation, piece.x, piece.y + 1)) {
      this.grounded = true;
      return false;
    }
    piece.y += 1;
    this.lastRotationKick = null;
    this.afterMove();
    return true;
  }

  /** Tapping ArrowDown: one row down for one point. */
  softDropStep(): boolean {
    if (!this.activePiece()) return false;
    this.softDropping = true;
    this.gravityTimer = 0;
    if (!this.stepDown()) return false;
    this.score += SOFT_DROP_SCORE;
    return true;
  }

  /** Holding ArrowDown: fall as fast as the soft drop allows. */
  setSoftDropping(active: boolean): void {
    this.softDropping = active;
    if (!active) this.gravityTimer = 0;
  }

  /** Drops the piece onto the floor and locks it immediately. */
  hardDrop(): boolean {
    const piece = this.activePiece();
    if (!piece) return false;
    let distance = 0;
    while (!this.collides(piece, piece.rotation, piece.x, piece.y + distance + 1)) distance += 1;
    if (distance > 0) {
      piece.y += distance;
      this.score += distance * HARD_DROP_SCORE;
    }
    // A hard drop does not cancel a T-Spin: the rotation was the last move.
    this.grounded = true;
    this.lockPiece();
    return true;
  }

  /** Swaps the active piece with the hold slot, once per piece. */
  holdPiece(): boolean {
    const piece = this.activePiece();
    if (!piece || this.holdUsed) return false;
    const swap = this.hold;
    this.hold = piece.type;
    this.holdUsed = true;
    this.spawn(swap ?? this.takeNextPiece());
    return true;
  }

  togglePause(): void {
    if (this.state === 'gameover') return;
    this.state = this.state === 'paused' ? 'playing' : 'paused';
  }

  /** The active piece, but only while the game accepts input. */
  private activePiece(): ActivePiece | null {
    return this.state === 'playing' ? this.current : null;
  }

  private fillQueue(): void {
    while (this.next.length < NEXT_COUNT) this.next.push(this.randomizer.next());
  }

  private takeNextPiece(): PieceType {
    const type = this.next.shift() ?? this.randomizer.next();
    this.fillQueue();
    return type;
  }

  private spawn(type: PieceType): void {
    const position = spawnPosition(type);
    this.current = { type, rotation: 0, x: position.x, y: position.y };
    this.gravityTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.grounded = false;
    this.softDropping = false;
    this.lastRotationKick = null;
    // Block out: the new piece has nowhere to appear.
    if (this.collides(this.current, 0, position.x, position.y)) {
      this.current = null;
      this.state = 'gameover';
    }
  }

  /** True when the piece would overlap the field or leave it sideways. */
  private collides(piece: ActivePiece, rotation: Rotation, x: number, y: number): boolean {
    for (const cell of pieceCells(piece.type, rotation)) {
      const bx = x + cell.x;
      const by = y + cell.y;
      if (bx < 0 || bx >= COLS || by >= ROWS) return true;
      if (by >= 0 && this.playfield.isOccupied(bx, by)) return true;
    }
    return false;
  }

  /** Reacts to a successful move or rotation. */
  private afterMove(): void {
    const piece = this.current;
    if (!piece) return;
    this.grounded = this.collides(piece, piece.rotation, piece.x, piece.y + 1);
    if (this.grounded) this.resetLockDelay();
  }

  private resetLockDelay(): void {
    if (this.lockResets >= MAX_LOCK_RESETS) return;
    this.lockResets += 1;
    this.lockTimer = 0;
  }

  private gravityInterval(): number {
    const gravity = gravityMs(this.level);
    return this.softDropping ? Math.min(SOFT_DROP_MS, gravity) : gravity;
  }

  private applyGravity(dt: number): void {
    const piece = this.current;
    if (!piece) return;
    if (this.grounded) {
      this.gravityTimer = 0;
      return;
    }
    const interval = this.gravityInterval();
    this.gravityTimer += dt;
    while (this.gravityTimer >= interval) {
      this.gravityTimer -= interval;
      if (this.collides(piece, piece.rotation, piece.x, piece.y + 1)) {
        this.grounded = true;
        this.gravityTimer = 0;
        return;
      }
      piece.y += 1;
      this.lastRotationKick = null;
      this.afterMove();
      if (this.grounded) return;
    }
  }

  /** Writes the piece into the field, clears lines and spawns the next piece. */
  private lockPiece(): void {
    const piece = this.current;
    if (!piece) return;

    // Detection runs before the blocks are written, so the piece cannot see
    // its own blocks as part of the stack.
    const tspin = detectTSpin(
      piece.type,
      piece.rotation,
      piece.x,
      piece.y,
      this.lastRotationKick,
      (cx, cy) => this.playfield.isOccupied(cx, cy),
    );

    let fullyHidden = true;
    for (const cell of pieceCells(piece.type, piece.rotation)) {
      const by = piece.y + cell.y;
      this.playfield.set(piece.x + cell.x, by, piece.type);
      if (by >= HIDDEN_ROWS) fullyHidden = false;
    }

    this.piecesPlaced += 1;
    this.holdUsed = false;
    this.softDropping = false;
    this.grounded = false;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.gravityTimer = 0;

    // Lock out: the whole piece came to rest above the visible field.
    if (fullyHidden) {
      this.current = null;
      this.state = 'gameover';
      return;
    }

    const rows = this.playfield.fullRows();
    const result = this.applyClear(rows, tspin);
    this.lastClear =
      rows.length > 0
        ? {
            label: clearLabel(tspin, rows.length, result.perfect),
            rows: [...rows],
            lines: rows.length,
            score: result.points,
            at: this.elapsed,
          }
        : null;
    this.spawn(this.takeNextPiece());
  }

  /** Scores the clear and updates lines, combo, back to back and the level. */
  private applyClear(rows: readonly number[], tspin: TSpinKind): ClearResult {
    const kind = clearKindOf(tspin);
    if (rows.length === 0) {
      this.combo = -1;
      // Placing without a clear breaks a back to back chain.
      if (!isDifficult(kind, 0)) this.backToBack = false;
      this.playfield.clearRows(rows);
      return { points: 0, perfect: false };
    }

    const lines = rows.length;
    const difficult = isDifficult(kind, lines);
    this.playfield.clearRows(rows);
    const perfect = this.playfield.isEmpty();

    let base = clearScore(kind, lines);
    if (difficult && this.backToBack) base = Math.floor(base * B2B_MULTIPLIER);
    this.backToBack = difficult;

    this.combo += 1;
    this.lines += lines;
    this.level = this.startLevel + Math.floor(this.lines / LINES_PER_LEVEL);

    const points =
      (base + comboScore(this.combo, this.level) + (perfect ? perfectClearScore(lines) : 0)) *
      this.level;
    this.score += points;
    return { points, perfect };
  }
}

/** Human readable name of a clear, e.g. "TETRIS" or "T-SPIN DOUBLE". */
export function clearLabel(tspin: TSpinKind, lines: number, perfect: boolean): string {
  const count = ['', 'SINGLE', 'DOUBLE', 'TRIPLE'][Math.min(lines, 3)] ?? '';
  const base =
    tspin === 'full'
      ? `T-SPIN ${count}`.trim()
      : tspin === 'mini'
        ? `T-SPIN MINI ${count}`.trim()
        : lines === 4
          ? 'TETRIS'
          : count;
  return perfect ? `${base} · PERFECT CLEAR` : base;
}