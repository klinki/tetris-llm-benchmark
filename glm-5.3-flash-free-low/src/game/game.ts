/**
 * Game state machine wiring the engine primitives together: bag randomizer,
 * movement/rotation with SRS kicks, hold, lock delay, ghost piece, scoring
 * and levels per the Tetris Guideline.
 */

import {
  absoluteCells,
  emptyBoard,
  COLS,
  ROWS,
  KICKS_I,
  KICKS_JLSTZ,
  pieceCells,
  shuffle,
  type Board,
  type Cell,
  type Piece,
  type PieceId,
} from './engine.js';

export type GameStatus = 'ready' | 'playing' | 'paused' | 'over';

export interface Stats {
  score: number;
  lines: number;
  level: number;
}

export interface Snapshot {
  board: Board;
  piece: Piece | null;
  ghostY: number;
  next: PieceId[];
  hold: PieceId | null;
  holdUsed: boolean;
  stats: Stats;
  status: GameStatus;
}

const HIDDEN_ROWS = 3; // rows above the visible board used for spawning

/** Guideline gravity in cells per frame (60 fps clock), per level. */
function gravityCellsPerFrame(level: number): number {
  const secondsPerCell = Math.pow(0.8 - (level - 1) * 0.007, level - 1);
  const framesPerCell = Math.max(secondsPerCell * 60, 1 / 60);
  return 1 / framesPerCell;
}

/** Points for clearing n lines in one drop (no combos/T-spins, Guideline base table). */
const LINE_SCORES: Record<number, number> = { 1: 100, 2: 300, 3: 500, 4: 800 };

export class Game {
  board: Board = emptyBoard();
  piece: Piece | null = null;
  ghostY = 0;
  /** Upcoming piece ids, ready queue (front = next spawn). */
  nextQueue: PieceId[] = [];
  bag: PieceId[] = [];
  hold: PieceId | null = null;
  holdUsed = false;
  stats: Stats = { score: 0, lines: 0, level: 1 };
  status: GameStatus = 'ready';
  /** Accumulated gravity movement since the last cell drop. */
  private gravityAccumulator = 0;
  /** Frames the piece has rested in a locking position since the last move. */
  private lockFrames = 0;
  private readonly lockFrameLimit = 30; // ~0.5 s lock delay
  private softDropping = false;
  /** Last action that moved the piece, used for lock-delay reset bookkeeping. */
  private moveResetCount = 0;

  constructor() {
    this.reset();
  }

  reset(): void {
    this.board = emptyBoard();
    this.hold = null;
    this.holdUsed = false;
    this.stats = { score: 0, lines: 0, level: 1 };
    this.bag = [];
    this.nextQueue = [];
    this.refillQueue();
    this.status = 'playing';
    this.gravityAccumulator = 0;
    this.lockFrames = 0;
    this.moveResetCount = 0;
    this.softDropping = false;
    this.spawn();
  }

  private refillQueue(): void {
    while (this.nextQueue.length < 5) {
      if (this.bag.length === 0) {
        this.bag = shuffle([0, 1, 2, 3, 4, 5, 6] as PieceId[]);
      }
      this.nextQueue.push(this.bag.pop() as PieceId);
    }
  }

  private takeNext(): PieceId {
    this.refillQueue();
    return this.nextQueue.shift() as PieceId;
  }

  spawn(id?: PieceId): void {
    const pieceId = id ?? this.takeNext();
    const width = Math.max(...pieceCells(pieceId, 0).map(([cx]) => cx)) + 1;
    const piece: Piece = {
      id: pieceId,
      x: Math.floor((COLS - width) / 2),
      y: -1 - HIDDEN_ROWS,
      rotation: 0,
    };
    // Shift down to the first row above the visible board that collides.
    while (this.canPlace(piece, 0, 1) && piece.y < -1) {
      piece.y += 1;
    }
    if (!this.canPlace(piece, 0, 0)) {
      // Blocked spawn at the top: top out immediately.
      this.piece = piece;
      this.status = 'over';
      return;
    }
    this.piece = piece;
    this.ghostY = this.dropDistance(piece);
    this.gravityAccumulator = 0;
    this.lockFrames = 0;
    this.moveResetCount = 0;
    this.refillQueue();
  }

  /** Whether every cell of the piece, offset by (dx, dy), is inside the board and empty. */
  private canPlace(piece: Piece, dx: number, dy: number, rotation = piece.rotation): boolean {
    for (const [cx, cy] of pieceCells(piece.id, rotation)) {
      const x = piece.x + cx + dx;
      const y = piece.y + cy + dy;
      if (x < 0 || x >= COLS || y >= ROWS) {
        return false;
      }
      if (y >= 0 && this.board[y][x] !== 0) {
        return false;
      }
    }
    return true;
  }

  /** Number of rows the piece can fall before colliding. */
  private dropDistance(piece: Piece): number {
    let distance = 0;
    while (this.canPlace(piece, 0, distance + 1)) {
      distance += 1;
    }
    return distance;
  }

  move(dx: number): void {
    if (this.status !== 'playing' || !this.piece) {
      return;
    }
    if (this.canPlace(this.piece, dx, 0)) {
      this.piece.x += dx;
      this.onMoved();
    }
  }

  rotate(direction: 1 | -1): void {
    if (this.status !== 'playing' || !this.piece) {
      return;
    }
    const from = this.piece.rotation;
    const to = (((from + direction) % 4) + 4) % 4 as Piece['rotation'];
    const table = `${from}>${to}`;
    const attempts =
      this.piece.id === 3
        ? [[0, 0]] // O never kicks
        : this.piece.id === 0 ? KICKS_I[table] : KICKS_JLSTZ[table];
    if (!attempts) {
      return;
    }
    for (const [dx, dy] of attempts) {
      if (this.canPlace(this.piece, dx, dy, to)) {
        this.piece.x += dx;
        this.piece.y += dy;
        this.piece.rotation = to;
        this.onMoved();
        return;
      }
    }
  }

  softDrop(on: boolean): void {
    this.softDropping = on;
  }

  /** One gravity "tick": advance the accumulator and drop cells. */
  tick(): void {
    if (this.status !== 'playing' || !this.piece) {
      return;
    }
    const rate = Math.max(gravityCellsPerFrame(this.stats.level), 1);
    const speed = this.softDropping ? Math.max(rate, 20) : rate;
    this.gravityAccumulator += speed;
    let moved = false;
    while (this.gravityAccumulator >= 1) {
      this.gravityAccumulator -= 1;
      if (this.canPlace(this.piece, 0, 1)) {
        this.piece.y += 1;
        moved = true;
      } else {
        this.gravityAccumulator = 0;
        break;
      }
    }
    if (moved) {
      this.lockFrames = 0;
      this.moveResetCount = 0;
    }
    this.ghostY = this.dropDistance(this.piece);
    if (!this.canPlace(this.piece, 0, 1)) {
      this.lockFrames += 1;
      if (this.lockFrames >= this.lockFrameLimit) {
        this.lockPiece();
      }
    }
  }

  /** Hard drop: fall to the floor, score 2 per cell, lock immediately. */
  hardDrop(): void {
    if (this.status !== 'playing' || !this.piece) {
      return;
    }
    const distance = this.dropDistance(this.piece);
    this.piece.y += distance;
    this.stats.score += distance * 2;
    this.ghostY = 0;
    this.lockPiece();
  }

  /** Hold the current piece; each held piece may be swapped back once. */
  holdPiece(): void {
    if (this.status !== 'playing' || !this.piece || this.holdUsed) {
      return;
    }
    const current = this.piece.id;
    if (this.hold === null) {
      this.hold = current;
      this.spawn();
    } else {
      const swap = this.hold;
      this.hold = current;
      this.spawn(swap);
    }
    this.holdUsed = true;
  }

  private onMoved(): void {
    // Lock delay resets when the piece moves or rotates, with a cap so the
    // game cannot be stalled forever.
    if (this.piece && this.lockFrames > 0 && this.moveResetCount < 15) {
      this.lockFrames = 0;
      this.moveResetCount += 1;
    }
    this.ghostY = this.piece ? this.dropDistance(this.piece) : 0;
  }

  private lockPiece(): void {
    if (!this.piece) {
      return;
    }
    let touchesHiddenRows = false;
    for (const [x, y] of absoluteCells(this.piece)) {
      if (y < 0) {
        // A piece locked above the visible board means the stack reached the
        // spawn area; the next spawn will be blocked and top out.
        touchesHiddenRows = true;
        continue;
      }
      this.board[y][x] = (this.piece.id + 1) as Cell; // 0 = empty, so cells shift by 1
    }
    this.piece = null;
    const cleared = this.clearLines();
    this.updateScore(cleared);
    if (touchesHiddenRows) {
      this.status = 'over';
      return;
    }
    this.spawn();
  }

  private clearLines(): number {
    let cleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
      if (this.board[y].every((cell) => cell !== 0)) {
        this.board.splice(y, 1);
        this.board.unshift(Array.from({ length: COLS }, () => 0 as Cell));
        cleared += 1;
        y += 1; // re-check the same row index after the shift
      }
    }
    return cleared;
  }

  private updateScore(cleared: number): void {
    if (cleared > 0) {
      this.stats.score += (LINE_SCORES[cleared] ?? 0) * this.stats.level;
      this.stats.lines += cleared;
      const newLevel = Math.floor(this.stats.lines / 10) + 1;
      if (newLevel > this.stats.level) {
        this.stats.level = newLevel;
      }
    }
  }

  /** A blocked spawn (stack reaching into the spawn area) means top out. */
  snapshot(): Snapshot {
    return {
      board: this.board,
      piece: this.piece,
      ghostY: this.ghostY,
      next: this.nextQueue.slice(0, 5),
      hold: this.hold,
      holdUsed: this.holdUsed,
      stats: { ...this.stats },
      status: this.status,
    };
  }
}

export { HIDDEN_ROWS };