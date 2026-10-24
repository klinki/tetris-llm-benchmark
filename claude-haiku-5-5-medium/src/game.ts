import { BOARD_WIDTH, LOCK_DELAY, MAX_LOCK_RESETS, NEXT_COUNT, SOFT_DROP_INTERVAL, SPAWN_Y, TOTAL_ROWS } from './constants.js';
import { clearFullRows, createBoard, isBoardEmpty, isFree, lockPiece } from './board.js';
import { wallKicks } from './pieces.js';
import { BagRandomizer } from './random.js';
import { ActivePiece, Cell, PieceType, Rotation } from './types.js';

type Spin = 'none' | 'mini' | 'full';

// Guideline points, indexed by lines cleared. All of them are multiplied by the level.
const LINE_POINTS = [0, 100, 300, 500, 800];
const SPIN_POINTS = [400, 800, 1200, 1600];
// The Guideline has no mini triple; it is scored like a full T-Spin Triple here.
const MINI_SPIN_POINTS = [100, 200, 400, 1600];
const PERFECT_CLEAR_POINTS = [800, 1200, 1800, 2000];
const COMBO_BONUS = 50;
const BACK_TO_BACK_MULTIPLIER = 1.5;
const SOFT_DROP_POINTS = 1;
const HARD_DROP_POINTS = 2;

// Corners of the T's 3x3 box (relative to its origin) and the two corners in front of the stem.
const T_CORNERS: [number, number][] = [[0, 0], [2, 0], [0, 2], [2, 2]];
const T_FRONT_CORNERS: [number, number][][] = [
  [[0, 0], [2, 0]],
  [[2, 0], [2, 2]],
  [[0, 2], [2, 2]],
  [[0, 0], [0, 2]],
];

export class Game {
  board: Cell[][] = createBoard();
  current: ActivePiece | null = null;
  hold: PieceType | null = null;
  canHold = true;
  next: PieceType[] = [];
  score = 0;
  level = 1;
  lines = 0;
  combo = -1;
  backToBack = false;
  gameOver = false;
  softDropping = false;

  private readonly bag: BagRandomizer;
  private gravityTimer = 0;
  private lockTimer = 0;
  private lockResets = 0;
  private lastActionWasRotation = false;
  private lastKickIndex = 0;

  constructor(random: () => number = Math.random) {
    this.bag = new BagRandomizer(random);
    this.reset();
  }

  reset(): void {
    this.board = createBoard();
    this.current = null;
    this.hold = null;
    this.canHold = true;
    this.next = Array.from({ length: NEXT_COUNT }, () => this.bag.next());
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.combo = -1;
    this.backToBack = false;
    this.gameOver = false;
    this.softDropping = false;
    this.gravityTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lastActionWasRotation = false;
    this.lastKickIndex = 0;
    this.spawn(this.takeNext());
  }

  // Advances gravity and the lock delay by dt seconds.
  update(dt: number): void {
    const piece = this.current;
    if (!piece || this.gameOver) return;

    if (this.dropDistance(piece) > 0) {
      this.lockTimer = 0;
      const gravity = this.gravityInterval();
      const interval = this.softDropping ? Math.min(gravity, SOFT_DROP_INTERVAL) : gravity;
      this.gravityTimer += dt;
      while (this.gravityTimer >= interval && this.fall(piece)) {
        this.gravityTimer -= interval;
        if (this.softDropping) this.score += SOFT_DROP_POINTS;
      }
    } else {
      this.gravityTimer = 0;
      this.lockTimer += dt;
      if (this.lockTimer >= LOCK_DELAY) this.lock();
    }
  }

  move(dx: number): boolean {
    const piece = this.current;
    if (!piece || this.gameOver || !isFree(this.board, piece.type, piece.rotation, piece.x + dx, piece.y)) {
      return false;
    }
    piece.x += dx;
    this.onPieceMoved(piece, false);
    return true;
  }

  // dir: 1 for clockwise, -1 for counter-clockwise.
  rotate(dir: 1 | -1): boolean {
    const piece = this.current;
    if (!piece || this.gameOver) return false;

    const to = ((piece.rotation + dir + 4) % 4) as Rotation;
    const kicks = wallKicks(piece.type, piece.rotation, to);
    for (let i = 0; i < kicks.length; i++) {
      const dx = piece.x + kicks[i].x;
      const dy = piece.y + kicks[i].y;
      if (isFree(this.board, piece.type, to, dx, dy)) {
        piece.x = dx;
        piece.y = dy;
        piece.rotation = to;
        this.lastKickIndex = i;
        this.onPieceMoved(piece, true);
        return true;
      }
    }
    return false;
  }

  hardDrop(): void {
    const piece = this.current;
    if (!piece || this.gameOver) return;
    const rows = this.dropDistance(piece);
    piece.y += rows;
    this.score += HARD_DROP_POINTS * rows;
    this.lock();
  }

  // Swaps the current piece with the held one (or stores it if the hold is empty). Once per drop.
  holdPiece(): void {
    const piece = this.current;
    if (!piece || !this.canHold || this.gameOver) return;
    const held = this.hold;
    this.hold = piece.type;
    this.canHold = false;
    this.spawn(held ?? this.takeNext());
  }

  setSoftDrop(on: boolean): void {
    this.softDropping = on;
  }

  // Where the current piece would land if dropped straight down.
  ghostPiece(): ActivePiece | null {
    const piece = this.current;
    return piece ? { ...piece, y: piece.y + this.dropDistance(piece) } : null;
  }

  private gravityInterval(): number {
    // Guideline: seconds per row = (0.8 - (level - 1) * 0.007) ^ (level - 1)
    return Math.pow(0.8 - (this.level - 1) * 0.007, this.level - 1);
  }

  private dropDistance(piece: ActivePiece): number {
    let rows = 0;
    while (isFree(this.board, piece.type, piece.rotation, piece.x, piece.y + rows + 1)) rows++;
    return rows;
  }

  private fall(piece: ActivePiece): boolean {
    if (this.dropDistance(piece) === 0) return false;
    piece.y += 1;
    this.lastActionWasRotation = false;
    return true;
  }

  private onPieceMoved(piece: ActivePiece, rotated: boolean): void {
    this.lastActionWasRotation = rotated;
    // Moving or rotating on the ground restarts the lock delay, up to a limit.
    if (this.dropDistance(piece) === 0 && this.lockResets < MAX_LOCK_RESETS) {
      this.lockTimer = 0;
      this.lockResets++;
    }
  }

  private lock(): void {
    const piece = this.current;
    if (!piece) return;

    const spin = this.detectSpin(piece);
    lockPiece(this.board, piece.type, piece.rotation, piece.x, piece.y);
    const cleared = clearFullRows(this.board);
    this.scoreLock(cleared, spin, isBoardEmpty(this.board));
    this.lines += cleared;
    this.level = Math.floor(this.lines / 10) + 1;
    this.canHold = true;
    this.spawn(this.takeNext());
  }

  private scoreLock(cleared: number, spin: Spin, perfectClear: boolean): void {
    const table = spin === 'full' ? SPIN_POINTS : spin === 'mini' ? MINI_SPIN_POINTS : LINE_POINTS;
    if (cleared === 0) {
      // A T-Spin without lines still scores, but it does not affect back-to-back.
      this.combo = -1;
      this.score += table[0] * this.level;
      return;
    }

    const difficult = cleared === 4 || spin !== 'none';
    let points = table[cleared] * (difficult && this.backToBack ? BACK_TO_BACK_MULTIPLIER : 1);
    this.backToBack = difficult;
    this.combo += 1;
    if (perfectClear) points += PERFECT_CLEAR_POINTS[cleared - 1];
    this.score += Math.floor(points) * this.level + COMBO_BONUS * this.combo * this.level;
  }

  // 3-corner T-Spin rule. A T-Spin is "mini" unless both front corners are filled
  // or the piece used the final SRS kick.
  private detectSpin(piece: ActivePiece): Spin {
    if (piece.type !== 'T' || !this.lastActionWasRotation) return 'none';
    const occupied = (corner: [number, number]) => this.isOccupied(piece.x + corner[0], piece.y + corner[1]);
    if (T_CORNERS.filter(occupied).length < 3) return 'none';
    const frontFilled = T_FRONT_CORNERS[piece.rotation].filter(occupied).length === 2;
    return frontFilled || this.lastKickIndex === 4 ? 'full' : 'mini';
  }

  private isOccupied(x: number, y: number): boolean {
    if (x < 0 || x >= BOARD_WIDTH || y >= TOTAL_ROWS) return true;
    return y >= 0 && this.board[y][x] !== null;
  }

  private spawn(type: PieceType): void {
    const piece: ActivePiece = { type, rotation: 0, x: type === 'O' ? 4 : 3, y: SPAWN_Y };
    this.current = piece;
    this.gravityTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lastActionWasRotation = false;
    // Top-out: the new piece cannot fit, so the game ends.
    if (!isFree(this.board, type, 0, piece.x, piece.y)) this.gameOver = true;
  }

  private takeNext(): PieceType {
    const type = this.next.shift()!;
    this.next.push(this.bag.next());
    return type;
  }
}
