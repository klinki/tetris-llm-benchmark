// Core game state and rules: gravity, lock delay, SRS rotation, hold,
// scoring and top-out. Pure logic with no DOM access so it is testable headless.
import { Board } from "./board.js";
import { Bag, type Rng } from "./random.js";
import {
  COMBO_POINTS,
  FIRST_VISIBLE_ROW,
  HARD_DROP_POINTS,
  LINES_PER_LEVEL,
  LOCK_DELAY,
  MAX_LOCK_RESETS,
  NEXT_QUEUE_SIZE,
  SOFT_DROP_FACTOR,
  SOFT_DROP_POINTS,
  gravityInterval,
} from "./constants.js";
import { SPAWN, pieceCells } from "./pieces.js";
import { getKicks, rotateState } from "./srs.js";
import { scoreClear, type TSpinKind } from "./scoring.js";
import type { ActivePiece, GamePhase, GameStats, PieceType, Rotation, Vec } from "./types.js";

export interface GameOptions {
  rng?: Rng;
}

export class Game {
  readonly board = new Board();
  private readonly rng: Rng;
  private bag: Bag;

  current: ActivePiece | null = null;
  hold: PieceType | null = null;
  canHold = true;
  phase: GamePhase = "playing";

  score = 0;
  level = 1;
  lines = 0;
  combo = -1;
  backToBack = false;

  /** Brief announcement shown after a notable clear (renderer fades it). */
  announcement = "";
  announcementTimer = 0;

  private gravityAcc = 0;
  private lockTimer = 0;
  private lockResets = 0;
  private lastWasRotation = false;
  private lastKickIndex = 0;

  constructor(opts: GameOptions = {}) {
    this.rng = opts.rng ?? Math.random;
    this.bag = new Bag(this.rng);
    this.restart();
  }

  restart(): void {
    this.board.reset();
    this.bag = new Bag(this.rng);
    this.current = null;
    this.hold = null;
    this.canHold = true;
    this.phase = "playing";
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.combo = -1;
    this.backToBack = false;
    this.announcement = "";
    this.announcementTimer = 0;
    this.gravityAcc = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lastWasRotation = false;
    this.lastKickIndex = 0;
    this.spawn(this.bag.next());
  }

  get nextQueue(): PieceType[] {
    return this.bag.preview(NEXT_QUEUE_SIZE);
  }

  get stats(): GameStats {
    return {
      score: this.score,
      level: this.level,
      lines: this.lines,
      combo: Math.max(0, this.combo),
      backToBack: this.backToBack,
    };
  }

  /** Absolute cells of the ghost (hard-drop landing) piece. */
  ghostCells(): Vec[] {
    if (!this.current) return [];
    return pieceCells(this.current.type, this.current.rotation, this.current.x, this.ghostY());
  }

  ghostY(): number {
    if (!this.current) return 0;
    let y = this.current.y;
    while (!this.board.pieceCollides({ ...this.current, y: y + 1 })) y++;
    return y;
  }

  private grounded(): boolean {
    return this.current ? this.board.pieceCollides({ ...this.current, y: this.current.y + 1 }) : false;
  }

  /** Advance time: gravity, soft drop and lock delay. */
  update(dt: number, softDrop: boolean): void {
    if (this.phase !== "playing" || !this.current) return;
    if (this.announcementTimer > 0) this.announcementTimer = Math.max(0, this.announcementTimer - dt);

    if (!this.grounded()) {
      this.lockTimer = 0;
      const interval = softDrop
        ? gravityInterval(this.level) / SOFT_DROP_FACTOR
        : gravityInterval(this.level);
      this.gravityAcc += dt;
      while (this.gravityAcc >= interval) {
        this.gravityAcc -= interval;
        if (this.grounded()) {
          this.gravityAcc = 0;
          break;
        }
        this.current.y++;
        if (softDrop) this.score += SOFT_DROP_POINTS;
        this.lockTimer = 0;
        this.lockResets = 0;
      }
    } else {
      this.gravityAcc = 0;
      this.lockTimer += dt;
      if (this.lockTimer >= LOCK_DELAY) this.lockPiece();
    }
  }

  /** Move horizontally by one cell. Returns whether the move succeeded. */
  move(dx: number): boolean {
    if (this.phase !== "playing" || !this.current) return false;
    const moved = { ...this.current, x: this.current.x + dx };
    if (this.board.pieceCollides(moved)) return false;
    this.current = moved;
    this.lastWasRotation = false;
    this.resetLockOnAction();
    return true;
  }

  /** Rotate with SRS wall kicks. dir = 1 clockwise, -1 counter-clockwise. */
  rotate(dir: 1 | -1): boolean {
    if (this.phase !== "playing" || !this.current) return false;
    const from = this.current.rotation;
    const to = rotateState(from, dir);
    const kicks = getKicks(this.current.type, from, to);
    for (let i = 0; i < kicks.length; i++) {
      const [dx, dy] = kicks[i];
      const cand: ActivePiece = {
        ...this.current,
        rotation: to,
        x: this.current.x + dx,
        y: this.current.y + dy,
      };
      if (!this.board.pieceCollides(cand)) {
        this.current = cand;
        this.lastWasRotation = true;
        this.lastKickIndex = i;
        this.resetLockOnAction();
        return true;
      }
    }
    return false;
  }

  /** Hard drop to the ghost position and lock immediately. */
  hardDrop(): void {
    if (this.phase !== "playing" || !this.current) return;
    const target = this.ghostY();
    this.score += (target - this.current.y) * HARD_DROP_POINTS;
    this.current.y = target;
    this.lockPiece();
  }

  /** Hold the current piece; usable once per drop. */
  holdPiece(): void {
    if (this.phase !== "playing" || !this.current || !this.canHold) return;
    const currentType = this.current.type;
    this.canHold = false;
    this.lastWasRotation = false;
    if (this.hold === null) {
      this.hold = currentType;
      this.spawn(this.bag.next());
    } else {
      const swap = this.hold;
      this.hold = currentType;
      this.spawn(swap);
    }
  }

  private resetLockOnAction(): void {
    if (this.grounded()) {
      if (this.lockResets < MAX_LOCK_RESETS) {
        this.lockTimer = 0;
        this.lockResets++;
      }
    } else {
      this.lockTimer = 0;
    }
  }

  private spawn(type: PieceType): void {
    const piece: ActivePiece = { type, rotation: 0, x: SPAWN[type].x, y: SPAWN[type].y };
    this.gravityAcc = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lastWasRotation = false;
    this.lastKickIndex = 0;
    if (this.board.pieceCollides(piece)) {
      // Blocked spawn: top out.
      this.current = piece;
      this.phase = "gameover";
      return;
    }
    this.current = piece;
  }

  /** Detect a T-Spin using the three-corner rule (only for the T piece). */
  private detectTSpin(): TSpinKind {
    const p = this.current;
    if (!p || p.type !== "T" || !this.lastWasRotation) return "none";
    const corners: Vec[] = [
      { x: p.x, y: p.y },
      { x: p.x + 2, y: p.y },
      { x: p.x, y: p.y + 2 },
      { x: p.x + 2, y: p.y + 2 },
    ];
    const filled = corners.map((c) => this.board.collides([c]));
    const count = filled.filter(Boolean).length;
    if (count < 3) return "none";

    // The two corners in front of the T's pointing direction.
    const front: Record<Rotation, [number, number]> = {
      0: [0, 1],
      1: [1, 3],
      2: [2, 3],
      3: [0, 2],
    };
    const [a, b] = front[p.rotation];
    const frontFilled = (filled[a] ? 1 : 0) + (filled[b] ? 1 : 0);
    // The final kick test upgrades a mini to a full T-Spin.
    if (frontFilled === 2 || this.lastKickIndex === 4) return "full";
    return "mini";
  }

  private lockPiece(): void {
    if (!this.current) return;
    const tSpin = this.detectTSpin();
    const lockedAbove = this.board.merge(this.current, FIRST_VISIBLE_ROW);
    const rows = this.board.fullRows();
    const cleared = rows.length;
    this.board.clearRows(rows);
    const perfectClear = cleared > 0 && this.board.isEmpty();

    const result = scoreClear(cleared, tSpin, this.backToBack, this.level, perfectClear);
    this.score += result.points;

    if (cleared > 0) {
      this.backToBack = result.difficult;
      this.combo++;
      if (this.combo > 0) this.score += COMBO_POINTS * this.combo * this.level;
      this.lines += cleared;
      this.level = Math.floor(this.lines / LINES_PER_LEVEL) + 1;
    } else {
      this.combo = -1;
    }

    this.announce(cleared, tSpin, perfectClear);
    this.canHold = true;
    this.spawn(this.bag.next());

    // Lock out: the piece locked entirely above the visible field.
    if (lockedAbove) this.phase = "gameover";
  }

  private announce(cleared: number, tSpin: TSpinKind, perfectClear: boolean): void {
    const names = ["", "SINGLE", "DOUBLE", "TRIPLE", "TETRIS"];
    let text = "";
    if (tSpin !== "none") {
      text = tSpin === "mini" ? "MINI T-SPIN" : "T-SPIN";
      if (cleared > 0) text += " " + names[cleared];
    } else if (cleared > 0) {
      text = names[cleared];
    }
    if (perfectClear) text = "PERFECT CLEAR";
    if (this.backToBack && cleared > 0 && (cleared === 4 || tSpin !== "none")) text = "B2B " + text;
    if (text) {
      this.announcement = text;
      this.announcementTimer = 1.4;
    }
  }
}
