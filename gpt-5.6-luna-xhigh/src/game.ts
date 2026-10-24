import { Board, BOARD_HEIGHT, BOARD_WIDTH } from "./board.js";
import { getCells } from "./pieces.js";
import { SevenBag, type PieceRandomizer } from "./randomizer.js";
import { PIECE_TYPES, type ActivePiece, type GameState, type PieceType, type Rotation } from "./types.js";

const QUEUE_SIZE = 5;
const LOCK_DELAY_MS = 500;
const MAX_LOCK_RESETS = 15;
const SOFT_DROP_INTERVAL_MS = 45;
const GRAVITY_BY_LEVEL = [
  1000, 793, 618, 473, 355, 262, 190, 135, 94, 64, 43, 28, 18, 11, 7, 5,
];

type Listener = (state: GameState) => void;
type Kick = readonly [number, number];

const JLSTZ_KICKS: Record<string, readonly Kick[]> = {
  "0>1": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "1>0": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "1>2": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "2>1": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "2>3": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "3>2": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "3>0": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "0>3": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
};

const I_KICKS: Record<string, readonly Kick[]> = {
  "0>1": [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  "1>0": [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  "1>2": [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
  "2>1": [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  "2>3": [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  "3>2": [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  "3>0": [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  "0>3": [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
};

const SPAWN_X = 3;
const SPAWN_Y = 0;

export class TetrisGame {
  public readonly board = new Board();
  public active: ActivePiece | null = null;
  public hold: PieceType | null = null;
  public next: PieceType[] = [];
  public score = 0;
  public lines = 0;
  public level = 1;
  public combo = -1;
  public backToBack = false;
  public gameOver = false;
  public holdUsed = false;

  private readonly listeners = new Set<Listener>();
  private readonly randomizer: PieceRandomizer;
  private fallTimer = 0;
  private lockTimer = 0;
  private lockResets = 0;
  private lastActionWasRotation = false;

  public constructor(randomizer: PieceRandomizer = new SevenBag()) {
    this.randomizer = randomizer;
    this.reset();
  }

  public reset(): void {
    this.randomizer.reset?.();
    this.board.clear();
    this.hold = null;
    this.next = [];
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.combo = -1;
    this.backToBack = false;
    this.gameOver = false;
    this.holdUsed = false;
    this.fallTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lastActionWasRotation = false;
    this.fillQueue();
    this.spawnNext();
    this.emit();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  public getState(): GameState {
    return {
      board: this.board.cloneCells(),
      active: this.active ? { ...this.active } : null,
      ghostY: this.active ? this.getGhostY() : null,
      next: [...this.next],
      hold: this.hold,
      holdUsed: this.holdUsed,
      score: this.score,
      lines: this.lines,
      level: this.level,
      combo: this.combo,
      backToBack: this.backToBack,
      gameOver: this.gameOver,
    };
  }

  public update(deltaMs: number, softDrop = false): void {
    if (this.gameOver || !this.active || deltaMs <= 0) return;

    const elapsed = Math.min(deltaMs, 250);
    const fallInterval = softDrop ? SOFT_DROP_INTERVAL_MS : GRAVITY_BY_LEVEL[Math.min(this.level - 1, GRAVITY_BY_LEVEL.length - 1)];
    this.fallTimer += elapsed;

    while (this.fallTimer >= fallInterval && this.active) {
      this.fallTimer -= fallInterval;
      if (!this.tryMove(0, 1, false)) break;
      if (softDrop) this.score += 1;
    }

    if (this.active && !this.canFall()) {
      this.lockTimer += elapsed;
      if (this.lockTimer >= LOCK_DELAY_MS) this.lockPiece();
    } else if (this.active) {
      this.lockTimer = 0;
    }

    this.emit();
  }

  public move(dx: -1 | 1): boolean {
    if (!this.active || this.gameOver) return false;
    const moved = this.tryMove(dx, 0, true);
    if (moved) this.emit();
    return moved;
  }

  public softDrop(): boolean {
    if (!this.active || this.gameOver) return false;
    const moved = this.tryMove(0, 1, false);
    if (moved) this.score += 1;
    this.emit();
    return moved;
  }

  public hardDrop(): number {
    if (!this.active || this.gameOver) return 0;
    let distance = 0;
    while (this.tryMove(0, 1, false)) distance += 1;
    this.score += distance * 2;
    this.lockPiece();
    this.emit();
    return distance;
  }

  public rotate(clockwise = true): boolean {
    if (!this.active || this.gameOver || this.active.type === "O") return false;
    const from = this.active.rotation;
    const to = ((from + (clockwise ? 1 : 3)) % 4) as Rotation;
    const key = `${from}>${to}`;
    const kicks = this.active.type === "I" ? I_KICKS[key] : JLSTZ_KICKS[key];
    for (const [dx, dy] of kicks) {
      const candidate: ActivePiece = { ...this.active, rotation: to, x: this.active.x + dx, y: this.active.y + dy };
      if (this.board.canPlace(candidate)) {
        this.active = candidate;
        this.lastActionWasRotation = true;
        this.resetLockAfterAction();
        this.emit();
        return true;
      }
    }
    return false;
  }

  public holdPiece(): boolean {
    if (!this.active || this.gameOver || this.holdUsed) return false;
    const current = this.active.type;
    const replacement = this.hold;
    this.hold = current;
    this.holdUsed = true;
    this.active = replacement ? this.createSpawn(replacement) : this.createSpawn(this.takeNext());
    this.fallTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lastActionWasRotation = false;
    if (!this.board.canPlace(this.active)) this.endGame();
    this.emit();
    return true;
  }

  public getGhostY(): number {
    if (!this.active) return 0;
    let y = this.active.y;
    while (this.board.canPlace({ ...this.active, y: y + 1 })) y += 1;
    return y;
  }

  /** Test/support hook for deterministic scenarios. It does not alter the board. */
  public setActivePiece(piece: ActivePiece): void {
    if (!PIECE_TYPES.includes(piece.type)) throw new Error(`Unknown piece type: ${piece.type}`);
    this.active = { ...piece };
    this.gameOver = false;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lastActionWasRotation = false;
    this.emit();
  }

  private tryMove(dx: number, dy: number, resetLock: boolean): boolean {
    if (!this.active) return false;
    const candidate = { ...this.active, x: this.active.x + dx, y: this.active.y + dy };
    if (!this.board.canPlace(candidate)) return false;
    this.active = candidate;
    // A downward fall does not stop a T-spin from being the last action.
    // Horizontal movement does, which matches Guideline T-spin detection.
    if (dx !== 0) this.lastActionWasRotation = false;
    if (resetLock) this.resetLockAfterAction();
    return true;
  }

  private resetLockAfterAction(): void {
    if (!this.active || this.canFall() || this.lockResets >= MAX_LOCK_RESETS) return;
    this.lockTimer = 0;
    this.lockResets += 1;
  }

  private canFall(): boolean {
    return this.active ? this.board.canPlace({ ...this.active, y: this.active.y + 1 }) : false;
  }

  private lockPiece(): void {
    if (!this.active) return;
    const locked = { ...this.active };
    const tSpin = this.isTSpin(locked);
    this.board.place(locked);
    const cleared = this.board.clearLines();
    this.score += this.getClearScore(cleared, tSpin);
    if (cleared > 0) {
      this.combo += 1;
      if (this.combo > 0) this.score += this.combo * 50 * this.level;
    } else {
      this.combo = -1;
    }
    this.lines += cleared;
    this.level = Math.floor(this.lines / 10) + 1;
    this.active = null;
    this.holdUsed = false;
    this.fallTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lastActionWasRotation = false;
    this.spawnNext();
  }

  private getClearScore(cleared: number, tSpin: boolean): number {
    const difficult = tSpin || cleared === 4;
    let base = tSpin ? [400, 800, 1200, 1600][cleared] ?? 0 : [0, 100, 300, 500, 800][cleared] ?? 0;
    if (difficult && cleared > 0) {
      if (this.backToBack) base = Math.floor(base * 1.5);
      this.backToBack = true;
    } else if (cleared > 0) {
      this.backToBack = false;
    }
    return base * this.level;
  }

  private isTSpin(piece: ActivePiece): boolean {
    if (piece.type !== "T" || !this.lastActionWasRotation) return false;
    const centerX = piece.x + 1;
    const centerY = piece.y + 1;
    let corners = 0;
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      if (this.board.isOccupied(centerX + dx, centerY + dy) || centerX + dx < 0 || centerX + dx >= BOARD_WIDTH || centerY + dy >= BOARD_HEIGHT) corners += 1;
    }
    return corners >= 3;
  }

  private spawnNext(): void {
    const type = this.takeNext();
    this.active = this.createSpawn(type);
    if (!this.board.canPlace(this.active)) this.endGame();
  }

  private createSpawn(type: PieceType): ActivePiece {
    return { type, rotation: 0, x: SPAWN_X, y: SPAWN_Y };
  }

  private takeNext(): PieceType {
    this.fillQueue();
    const type = this.next.shift()!;
    this.fillQueue();
    return type;
  }

  private fillQueue(): void {
    while (this.next.length < QUEUE_SIZE) this.next.push(this.randomizer.next());
  }

  private endGame(): void {
    this.gameOver = true;
    this.active = null;
  }

  private emit(): void {
    const state = this.getState();
    for (const listener of this.listeners) listener(state);
  }
}

export { BOARD_HEIGHT, BOARD_WIDTH };
