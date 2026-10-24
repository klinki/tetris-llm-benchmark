import { SevenBag, type PieceSource } from "./bag.js";
import { Board } from "./board.js";
import {
  COLS,
  HIDDEN_ROWS,
  LOCK_DELAY_MS,
  MAX_LOCK_RESETS,
  NEXT_COUNT,
  SOFT_DROP_FACTOR,
  SPAWN_Y,
} from "./constants.js";
import { cellsOf, kicksFor, SHAPES, type Piece, type PieceType, type Point, type Rotation } from "./pieces.js";
import {
  clearName,
  comboPoints,
  gravityMs,
  HARD_DROP_POINTS_PER_ROW,
  isDifficult,
  levelFor,
  linePoints,
  perfectClearPoints,
  SOFT_DROP_POINTS_PER_ROW,
  type TSpin,
} from "./scoring.js";

export type GameStatus = "playing" | "paused" | "gameOver";

// Corners of the T piece's 3x3 box, clockwise from the top left. The two corners
// facing the direction the T points to are the "front" corners.
const T_CORNERS: readonly Point[] = [[0, 0], [2, 0], [2, 2], [0, 2]];
const FIFTH_KICK = 4;

/** All game rules, independent of rendering and input devices. */
export class Game {
  board!: Board;
  /** The falling piece. */
  piece!: Piece;
  hold!: PieceType | null;
  canHold!: boolean;
  score!: number;
  lines!: number;
  level!: number;
  status!: GameStatus;
  /** Description of the last lock, e.g. ["T-Spin Double", "Back-to-Back"]. */
  announcement!: string[];

  private softDrop!: boolean;
  private combo!: number;
  private backToBack!: boolean;

  private gravityTimer = 0;
  private lockTimer = 0;
  private lockResets = 0;
  private lowestY = 0;
  private lastMoveWasRotation = false;
  private lastKick = 0;

  constructor(private readonly pieces: PieceSource = new SevenBag()) {
    this.reset();
  }

  /** Upcoming pieces, soonest first. */
  get next(): PieceType[] {
    return this.pieces.peek(NEXT_COUNT);
  }

  /** Where the falling piece would land if dropped. */
  ghost(): Piece {
    let y = this.piece.y;
    while (this.board.fits({ ...this.piece, y: y + 1 })) y++;
    return { ...this.piece, y };
  }

  move(dx: -1 | 1): boolean {
    if (this.status !== "playing" || !this.tryMove(dx, 0)) return false;
    this.onPieceMoved();
    return true;
  }

  rotate(direction: 1 | -1): boolean {
    if (this.status !== "playing") return false;
    const from = this.piece.rotation;
    const to = ((from + direction + 4) % 4) as Rotation;
    const kicks = kicksFor(this.piece.type, from, to);
    for (let i = 0; i < kicks.length; i++) {
      const [dx, dy] = kicks[i];
      const rotated: Piece = { ...this.piece, rotation: to, x: this.piece.x + dx, y: this.piece.y + dy };
      if (this.board.fits(rotated)) {
        this.piece = rotated;
        this.lastMoveWasRotation = true;
        this.lastKick = i;
        this.onPieceMoved();
        return true;
      }
    }
    return false;
  }

  setSoftDrop(active: boolean): void {
    this.softDrop = active;
  }

  hardDrop(): void {
    if (this.status !== "playing") return;
    const landing = this.ghost();
    const rows = landing.y - this.piece.y;
    if (rows > 0) {
      this.piece = landing;
      this.lastMoveWasRotation = false;
      this.score += rows * HARD_DROP_POINTS_PER_ROW;
    }
    this.lockPiece();
  }

  holdPiece(): void {
    if (this.status !== "playing" || !this.canHold) return;
    const held = this.hold;
    this.hold = this.piece.type;
    this.canHold = false;
    this.spawn(held ?? this.pieces.next());
  }

  togglePause(): void {
    if (this.status === "playing") this.status = "paused";
    else if (this.status === "paused") this.status = "playing";
  }

  restart(): void {
    if (this.status === "gameOver") this.reset();
  }

  /** Advances gravity and the lock delay by `dt` milliseconds. */
  update(dt: number): void {
    if (this.status !== "playing") return;

    const interval = gravityMs(this.level) / (this.softDrop ? SOFT_DROP_FACTOR : 1);
    this.gravityTimer += dt;
    while (this.gravityTimer >= interval) {
      if (!this.tryMove(0, 1)) {
        this.gravityTimer = 0;
        break;
      }
      this.gravityTimer -= interval;
      if (this.softDrop) this.score += SOFT_DROP_POINTS_PER_ROW;
      this.onPieceMoved();
    }

    if (this.isGrounded()) {
      this.lockTimer += dt;
      if (this.lockTimer >= LOCK_DELAY_MS) this.lockPiece();
    }
  }

  private reset(): void {
    this.board = new Board();
    this.hold = null;
    this.canHold = true;
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.status = "playing";
    this.announcement = [];
    this.softDrop = false;
    this.combo = -1;
    this.backToBack = false;
    this.spawn(this.pieces.next());
  }

  private spawn(type: PieceType): void {
    const { size } = SHAPES[type];
    this.piece = { type, rotation: 0, x: Math.floor((COLS - size) / 2), y: SPAWN_Y };
    this.gravityTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lastMoveWasRotation = false;
    this.lastKick = 0;

    if (!this.board.fits(this.piece)) {
      this.status = "gameOver"; // block out: the spawn position is already occupied
      return;
    }
    this.tryMove(0, 1); // a new piece drops one row right away when there is room
    this.lowestY = this.piece.y;
  }

  private tryMove(dx: number, dy: number): boolean {
    const moved: Piece = { ...this.piece, x: this.piece.x + dx, y: this.piece.y + dy };
    if (!this.board.fits(moved)) return false;
    this.piece = moved;
    this.lastMoveWasRotation = false;
    return true;
  }

  private isGrounded(): boolean {
    return !this.board.fits({ ...this.piece, y: this.piece.y + 1 });
  }

  /** Extended placement: reaching a new lowest row or moving on the ground restarts the lock timer. */
  private onPieceMoved(): void {
    if (this.piece.y > this.lowestY) {
      this.lowestY = this.piece.y;
      this.lockResets = 0;
      this.lockTimer = 0;
    } else if (this.isGrounded() && this.lockResets < MAX_LOCK_RESETS) {
      this.lockResets++;
      this.lockTimer = 0;
    }
  }

  private lockPiece(): void {
    const tSpin = this.detectTSpin();
    const lockOut = cellsOf(this.piece).every(([, y]) => y < HIDDEN_ROWS);
    this.board.lock(this.piece);
    this.award(this.board.clearLines(), tSpin);

    if (lockOut) {
      this.status = "gameOver"; // the piece locked entirely above the visible playfield
      return;
    }
    this.canHold = true;
    this.spawn(this.pieces.next());
  }

  /** 3-corner T-Spin rule: the last move was a rotation and 3 of the 4 corners around the T are filled. */
  private detectTSpin(): TSpin {
    const { type, rotation, x, y } = this.piece;
    if (type !== "T" || !this.lastMoveWasRotation) return "none";

    const filled = T_CORNERS.map(([cx, cy]) => this.board.isBlocked(x + cx, y + cy));
    if (filled.filter(Boolean).length < 3) return "none";

    const bothFrontCornersFilled = filled[rotation] && filled[(rotation + 1) % 4];
    return bothFrontCornersFilled || this.lastKick === FIFTH_KICK ? "full" : "mini";
  }

  private award(lines: number, tSpin: TSpin): void {
    const level = this.level;
    const messages: string[] = [];
    let points = linePoints(lines, tSpin, level);

    const name = clearName(lines, tSpin);
    if (name) messages.push(name);

    if (lines === 0) {
      this.combo = -1;
    } else {
      const wasBackToBack = this.backToBack;
      this.backToBack = isDifficult(lines, tSpin);
      if (this.backToBack && wasBackToBack) {
        points = Math.floor(points * 1.5);
        messages.push("Back-to-Back");
      }

      this.combo++;
      if (this.combo > 0) {
        points += comboPoints(this.combo, level);
        messages.push(`Combo x${this.combo}`);
      }

      this.lines += lines;
      this.level = levelFor(this.lines);

      if (this.board.isEmpty()) {
        points += perfectClearPoints(lines, lines === 4 && wasBackToBack, level);
        messages.push("Perfect Clear");
      }
    }

    this.score += points;
    this.announcement = messages;
  }
}
