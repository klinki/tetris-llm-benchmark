// Core game logic, fully headless (no DOM) so it can be unit tested in Node.

import { Board } from "./board.js";
import { BagRandomizer, type Rng } from "./random.js";
import { getKicks, PIECE_CELLS, SPAWN_X, SPAWN_Y, type PieceKind } from "./pieces.js";

export type GameStatus = "ready" | "playing" | "gameover";

export interface ActivePiece {
  kind: PieceKind;
  rotation: number; // 0 = spawn, 1 = clockwise (R), 2 = 180, 3 = counter-clockwise (L)
  x: number; // bounding box column on the board
  y: number; // bounding box row on the board
}

// Guideline tuning
const LOCK_DELAY_MS = 500;
const MAX_LOCK_RESETS = 15;
const SOFT_DROP_FACTOR = 20; // soft drop is 20x faster than gravity
const LINES_PER_LEVEL = 10;
const NEXT_QUEUE_SIZE = 5;
const LINE_SCORES = [0, 100, 300, 500, 800]; // single, double, triple, tetris
const COMBO_BONUS = 50;
const BACK_TO_BACK_FACTOR = 1.5;

// Guideline gravity: time to fall one row = (0.8 - (level - 1) * 0.007)^(level - 1) seconds.
// The result is clamped to a tiny positive value so extreme levels stay well behaved.
export function gravityMsPerRow(level: number): number {
  const base = Math.max(0.8 - (level - 1) * 0.007, 0);
  return Math.max(Math.pow(base, level - 1) * 1000, 1e-6);
}

export class Game {
  readonly board = new Board();
  readonly queue: PieceKind[] = [];
  held: PieceKind | null = null;
  current: ActivePiece | null = null;
  status: GameStatus = "ready";

  score = 0;
  level = 1;
  lines = 0;
  combo = -1; // -1 until a line clear starts a combo
  backToBack = false; // last clear was a difficult one (tetris)
  softDropping = false; // set while the soft drop key is held

  private readonly rng: Rng;
  private bag: BagRandomizer;
  private canHold = true;
  private gravityTimer = 0; // ms of gravity accumulated for the current piece
  private lockTimer = 0; // ms the current piece has rested on the stack
  private lockResets = 0; // move resets consumed by the current piece

  constructor(rng: Rng = Math.random) {
    this.rng = rng;
    this.bag = new BagRandomizer(rng);
  }

  start(): void {
    this.board.clear();
    this.queue.length = 0;
    this.held = null;
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.combo = -1;
    this.backToBack = false;
    this.softDropping = false;
    this.bag = new BagRandomizer(this.rng);
    this.status = "playing";
    this.spawnNext();
  }

  restart(): void {
    this.start();
  }

  // Advance the simulation by dt milliseconds.
  update(dt: number): void {
    if (this.status !== "playing" || !this.current) return;

    if (this.isGrounded()) {
      this.lockTimer += dt;
      if (this.lockTimer >= LOCK_DELAY_MS) this.lockPiece();
      return;
    }

    this.lockTimer = 0;
    this.gravityTimer += dt * (this.softDropping ? SOFT_DROP_FACTOR : 1);
    const perRow = gravityMsPerRow(this.level);
    while (this.gravityTimer >= perRow) {
      this.gravityTimer -= perRow;
      if (this.tryMove(0, 1)) {
        if (this.softDropping) this.score += 1; // 1 point per soft dropped cell
      } else {
        this.gravityTimer = 0;
        break;
      }
    }
  }

  // --- player actions -----------------------------------------------------

  moveLeft(): void {
    this.shift(-1);
  }

  moveRight(): void {
    this.shift(1);
  }

  rotateClockwise(): void {
    this.rotate(1);
  }

  rotateCounterClockwise(): void {
    this.rotate(-1);
  }

  // Drop to the landing position instantly and lock: 2 points per cell.
  hardDrop(): void {
    if (this.status !== "playing" || !this.current) return;
    let distance = 0;
    while (this.tryMove(0, 1)) distance++;
    this.score += distance * 2;
    this.lockPiece();
  }

  // Swap the current piece with the held piece; allowed once per piece.
  holdPiece(): void {
    if (this.status !== "playing" || !this.current || !this.canHold) return;
    const kind = this.current.kind;
    const swap = this.held;
    this.held = kind;
    if (swap !== null) {
      this.spawn(swap);
    } else {
      this.spawnNext();
    }
    this.canHold = false;
  }

  // Row where the current piece would land - used for the ghost piece.
  ghostY(): number {
    if (!this.current) return 0;
    let y = this.current.y;
    while (!this.board.collides(this.currentCells(), this.current.x, y + 1)) y++;
    return y;
  }

  // --- internals ----------------------------------------------------------

  private currentCells() {
    const piece = this.current!;
    return PIECE_CELLS[piece.kind][piece.rotation];
  }

  private shift(dx: number): void {
    if (this.status !== "playing" || !this.current) return;
    if (this.tryMove(dx, 0)) this.resetLockDelay();
  }

  private rotate(direction: 1 | -1): void {
    if (this.status !== "playing" || !this.current) return;
    const piece = this.current;
    const from = piece.rotation;
    const to = (from + direction + 4) % 4;
    const cells = PIECE_CELLS[piece.kind][to];
    // Try each SRS wall kick offset. Published tables use +y up while the
    // board uses +y down, so the y offset is subtracted.
    for (const [dx, dy] of getKicks(piece.kind, from, to)) {
      if (!this.board.collides(cells, piece.x + dx, piece.y - dy)) {
        piece.rotation = to;
        piece.x += dx;
        piece.y -= dy;
        this.resetLockDelay();
        return;
      }
    }
  }

  private tryMove(dx: number, dy: number): boolean {
    const piece = this.current;
    if (!piece) return false;
    if (this.board.collides(PIECE_CELLS[piece.kind][piece.rotation], piece.x + dx, piece.y + dy)) {
      return false;
    }
    piece.x += dx;
    piece.y += dy;
    return true;
  }

  private isGrounded(): boolean {
    if (!this.current) return false;
    return this.board.collides(this.currentCells(), this.current.x, this.current.y + 1);
  }

  // Moving or rotating while the lock delay is running restarts it, but only
  // a limited number of times per piece (Guideline move reset with a cap).
  private resetLockDelay(): void {
    if (this.lockTimer > 0 && this.lockResets < MAX_LOCK_RESETS) {
      this.lockTimer = 0;
      this.lockResets++;
    }
  }

  private lockPiece(): void {
    const piece = this.current!;
    this.board.merge(this.currentCells(), piece.x, piece.y, piece.kind);
    const cleared = this.board.clearLines();
    this.applyScore(cleared);
    this.spawnNext();
  }

  private applyScore(cleared: number): void {
    if (cleared === 0) {
      this.combo = -1;
      this.backToBack = false;
      return;
    }
    const difficult = cleared === 4; // tetris is the only difficult clear here
    let points = LINE_SCORES[cleared] * this.level;
    if (difficult && this.backToBack) points = Math.floor(points * BACK_TO_BACK_FACTOR);
    this.backToBack = difficult;
    this.combo++;
    points += COMBO_BONUS * this.combo * this.level;
    this.score += points;
    this.lines += cleared;
    this.level = Math.floor(this.lines / LINES_PER_LEVEL) + 1;
  }

  private spawnNext(): void {
    while (this.queue.length < NEXT_QUEUE_SIZE) this.queue.push(this.bag.next());
    this.spawn(this.queue.shift()!);
  }

  private spawn(kind: PieceKind): void {
    this.current = { kind, rotation: 0, x: SPAWN_X[kind], y: SPAWN_Y };
    this.gravityTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.canHold = true;
    // Top-out: a blocked spawn ends the game.
    if (this.board.collides(PIECE_CELLS[kind][0], this.current.x, this.current.y)) {
      this.status = "gameover";
    }
  }
}
