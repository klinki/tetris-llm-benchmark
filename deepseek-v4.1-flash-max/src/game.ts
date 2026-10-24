import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  absoluteCells,
  getKicks,
  spawnPiece,
  type Piece,
  type PieceType,
  type Rotation,
} from './pieces.js';
import { BagRandomizer, mulberry32 } from './randomizer.js';
import {
  COMBO_POINTS,
  LEVEL_LINES,
  LOCK_DELAY_SECONDS,
  MAX_LOCK_RESETS,
  SOFT_DROP_MULTIPLIER,
  baseClearPoints,
  gravitySeconds,
  isDifficultClear,
  perfectClearPoints,
  type SpinKind,
} from './scoring.js';

export type GameState = 'playing' | 'paused' | 'gameover';

export type GameEvent =
  | {
      type: 'clear';
      rows: number[];
      count: number;
      spin: SpinKind;
      label: string;
      points: number;
      b2b: boolean;
      combo: number;
      perfectClear: boolean;
    }
  | { type: 'levelup'; level: number }
  | { type: 'gameover'; score: number; level: number; lines: number };

type LastAction = 'spawn' | 'move' | 'rotate' | 'hold';

export interface GameOptions {
  seed?: number;
  random?: () => number;
}

type Board = (PieceType | null)[][];

function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_HEIGHT }, () => Array<PieceType | null>(BOARD_WIDTH).fill(null));
}

/**
 * Headless game model. All timing is driven by `update(dt)`, which makes the
 * game deterministic and easy to exercise in the Node smoke tests.
 */
export class Game {
  readonly width = BOARD_WIDTH;
  readonly height = BOARD_HEIGHT;

  board: Board = createEmptyBoard();
  active: Piece | null = null;
  nextQueue: PieceType[] = [];
  holdType: PieceType | null = null;

  score = 0;
  level = 1;
  lines = 0;
  combo = -1;
  b2b = false;
  canHold = true;
  state: GameState = 'playing';

  onEvent: ((event: GameEvent) => void) | null = null;

  private readonly randomSource: () => number;
  private randomizer: BagRandomizer;
  private dropTimer = 0;
  private lockTimer = 0;
  private lockResets = 0;
  private lastAction: LastAction = 'spawn';
  private lastKickIndex = -1;
  private softDropping = false;

  constructor(options: GameOptions = {}) {
    this.randomSource =
      options.random ?? (options.seed === undefined ? Math.random : mulberry32(options.seed));
    this.randomizer = new BagRandomizer(this.randomSource);
    this.reset();
  }

  reset(): void {
    this.board = createEmptyBoard();
    this.active = null;
    this.nextQueue = [];
    this.holdType = null;
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.combo = -1;
    this.b2b = false;
    this.canHold = true;
    this.state = 'playing';
    this.dropTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lastAction = 'spawn';
    this.lastKickIndex = -1;
    this.softDropping = false;
    this.randomizer = new BagRandomizer(this.randomSource);
    this.spawnNext();
  }

  setSoftDrop(active: boolean): void {
    this.softDropping = active;
  }

  togglePause(): void {
    if (this.state === 'playing') this.state = 'paused';
    else if (this.state === 'paused') this.state = 'playing';
  }

  move(direction: -1 | 1): boolean {
    return this.tryMove(direction, 0);
  }

  rotate(direction: 1 | -1): boolean {
    if (this.state !== 'playing' || !this.active) return false;

    const from = this.active.rotation;
    const to = ((from + (direction === 1 ? 1 : 3)) % 4) as Rotation;
    const kicks = getKicks(this.active.type, from, to);

    for (let index = 0; index < kicks.length; index++) {
      const kick = kicks[index];
      const candidate: Piece = {
        ...this.active,
        rotation: to,
        x: this.active.x + kick.x,
        y: this.active.y + kick.y,
      };
      if (!this.canPlace(candidate)) continue;

      this.active = candidate;
      this.lastAction = 'rotate';
      this.lastKickIndex = index;
      this.touchLockDelay();
      return true;
    }
    return false;
  }

  hardDrop(): number {
    if (this.state !== 'playing' || !this.active) return 0;

    let distance = 0;
    while (this.canPlace({ ...this.active, y: this.active.y + 1 })) {
      this.active = { ...this.active, y: this.active.y + 1 };
      distance += 1;
    }
    if (distance > 0) this.lastAction = 'move';

    this.score += distance * 2;
    this.lockPiece();
    return distance;
  }

  hold(): boolean {
    if (this.state !== 'playing' || !this.active || !this.canHold) return false;

    const currentType = this.active.type;
    const swappedType = this.holdType;

    this.holdType = currentType;
    this.canHold = false;

    if (swappedType === null) {
      this.spawnNext();
    } else {
      this.active = spawnPiece(swappedType);
      this.dropTimer = 0;
      this.lockTimer = 0;
      this.lockResets = 0;
      this.lastAction = 'hold';
      this.lastKickIndex = -1;
      if (!this.canPlace(this.active)) this.endGame();
    }
    return true;
  }

  /** Position the active piece would occupy if dropped straight down. */
  ghost(): Piece | null {
    if (!this.active) return null;
    let y = this.active.y;
    while (this.canPlace({ ...this.active, y: y + 1 })) y += 1;
    return { ...this.active, y };
  }

  canPlace(piece: Piece): boolean {
    for (const cell of absoluteCells(piece)) {
      if (cell.x < 0 || cell.x >= BOARD_WIDTH) return false;
      if (cell.y < 0 || cell.y >= BOARD_HEIGHT) return false;
      if (this.board[cell.y][cell.x] !== null) return false;
    }
    return true;
  }

  update(dt: number): void {
    if (this.state !== 'playing' || !this.active || dt <= 0) return;

    const gravity = gravitySeconds(this.level);
    const interval = this.softDropping
      ? Math.max(0.001, gravity / SOFT_DROP_MULTIPLIER)
      : gravity;

    this.dropTimer += dt;

    let steps = 0;
    while (this.dropTimer >= interval && steps < 64 && this.active) {
      this.dropTimer -= interval;
      steps += 1;
      const candidate: Piece = { ...this.active, y: this.active.y + 1 };
      if (!this.canPlace(candidate)) break;

      this.active = candidate;
      this.lastAction = 'move';
      this.lastKickIndex = -1;
      this.lockTimer = 0;
      this.lockResets = 0;
      if (this.softDropping) this.score += 1;
    }

    // Avoid an unbounded backlog if the tab was throttled.
    if (this.dropTimer > interval) this.dropTimer = interval;

    if (!this.isGrounded()) {
      this.lockTimer = 0;
      return;
    }

    this.lockTimer += dt;
    if (this.lockTimer >= LOCK_DELAY_SECONDS) {
      this.lockPiece();
    }
  }

  private tryMove(dx: number, dy: number): boolean {
    if (this.state !== 'playing' || !this.active) return false;

    const candidate = { ...this.active, x: this.active.x + dx, y: this.active.y + dy };
    if (!this.canPlace(candidate)) return false;

    this.active = candidate;
    this.lastAction = 'move';
    this.lastKickIndex = -1;

    if (dy !== 0) {
      this.lockTimer = 0;
      this.lockResets = 0;
    } else {
      this.touchLockDelay();
    }
    return true;
  }

  private touchLockDelay(): void {
    this.lockTimer = 0;
    if (this.isGrounded() && this.lockResets < MAX_LOCK_RESETS) {
      this.lockResets += 1;
    }
  }

  private isGrounded(): boolean {
    if (!this.active) return false;
    return !this.canPlace({ ...this.active, y: this.active.y + 1 });
  }

  private lockPiece(): void {
    if (!this.active) return;

    const piece = this.active;
    for (const cell of absoluteCells(piece)) {
      if (cell.y >= 0 && cell.y < BOARD_HEIGHT && cell.x >= 0 && cell.x < BOARD_WIDTH) {
        this.board[cell.y][cell.x] = piece.type;
      }
    }

    const spin = this.detectSpin(piece);
    const fullRows: number[] = [];
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      if (this.board[y].every((cell) => cell !== null)) fullRows.push(y);
    }

    const cleared = fullRows.length;
    const difficult = isDifficultClear(cleared, spin);

    if (cleared > 0) {
      const fullRowSet = new Set(fullRows);
      const remaining = this.board.filter((_, y) => !fullRowSet.has(y));
      const emptyRows: Board = Array.from({ length: cleared }, () =>
        Array<PieceType | null>(BOARD_WIDTH).fill(null),
      );
      this.board = [...emptyRows, ...remaining];

      const perfectClear = this.board.every((row) => row.every((cell) => cell === null));
      const b2bApplied = this.b2b && difficult;

      let points = Math.floor(
        baseClearPoints(cleared, spin) * this.level * (b2bApplied ? 1.5 : 1),
      );
      if (perfectClear) points += perfectClearPoints(cleared) * this.level;

      this.combo += 1;
      if (this.combo > 0) points += COMBO_POINTS * this.combo * this.level;

      this.score += points;
      this.lines += cleared;
      this.b2b = difficult;

      const previousLevel = this.level;
      this.level = 1 + Math.floor(this.lines / LEVEL_LINES);
      if (this.level > previousLevel) {
        this.emit({ type: 'levelup', level: this.level });
      }

      this.emit({
        type: 'clear',
        rows: fullRows,
        count: cleared,
        spin,
        label: this.clearLabel(cleared, spin, b2bApplied, perfectClear),
        points,
        b2b: b2bApplied,
        combo: this.combo,
        perfectClear,
      });
    } else {
      this.combo = -1;
      if (spin !== 'none') {
        const points = (spin === 'tspin' ? 400 : 100) * this.level;
        this.score += points;
        this.emit({
          type: 'clear',
          rows: [],
          count: 0,
          spin,
          label: spin === 'tspin' ? 'T-SPIN' : 'T-SPIN MINI',
          points,
          b2b: false,
          combo: this.combo,
          perfectClear: false,
        });
      }
    }

    this.canHold = true;
    this.active = null;
    this.spawnNext();
  }

  /**
   * Three-corner T-spin detection. The last successful action must have been
   * a rotation (including a wall kick).
   */
  private detectSpin(piece: Piece): SpinKind {
    if (piece.type !== 'T' || this.lastAction !== 'rotate') return 'none';

    const centerX = piece.x + 1;
    const centerY = piece.y + 1;
    const corners: ReadonlyArray<readonly [number, number]> = [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ];
    const occupied = corners.map(([dx, dy]) => this.isSolid(centerX + dx, centerY + dy));
    const filled = occupied.filter(Boolean).length;
    if (filled < 3) return 'none';

    const frontCorners: Record<Rotation, readonly [number, number]> = {
      0: [0, 1],
      1: [1, 3],
      2: [2, 3],
      3: [0, 2],
    };
    const [first, second] = frontCorners[piece.rotation];
    const fullSpin = occupied[first] && occupied[second];

    // The fifth kick is treated as a full T-spin even when only one front
    // corner is filled (the standard T-spin-triple exception).
    if (fullSpin || this.lastKickIndex === 4) return 'tspin';
    return 'mini';
  }

  private isSolid(x: number, y: number): boolean {
    if (x < 0 || x >= BOARD_WIDTH || y >= BOARD_HEIGHT) return true;
    if (y < 0) return false;
    return this.board[y][x] !== null;
  }

  private clearLabel(
    cleared: number,
    spin: SpinKind,
    b2b: boolean,
    perfectClear: boolean,
  ): string {
    const names = ['', 'SINGLE', 'DOUBLE', 'TRIPLE', 'TETRIS'];
    let label: string;
    if (spin === 'tspin') {
      label = cleared === 0 ? 'T-SPIN' : `T-SPIN ${names[cleared] ?? ''}`.trim();
    } else if (spin === 'mini') {
      label = cleared === 0 ? 'T-SPIN MINI' : `T-SPIN MINI ${names[cleared] ?? ''}`.trim();
    } else {
      label = names[cleared] ?? 'CLEAR';
    }

    if (perfectClear) return 'PERFECT CLEAR';
    if (b2b) return `B2B ${label}`;
    return label;
  }

  private spawnNext(): void {
    this.refillQueue();
    const type = this.nextQueue.shift();
    if (!type) {
      this.endGame();
      return;
    }
    this.refillQueue();

    this.active = spawnPiece(type);
    this.dropTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lastAction = 'spawn';
    this.lastKickIndex = -1;

    if (!this.canPlace(this.active)) this.endGame();
  }

  private refillQueue(): void {
    while (this.nextQueue.length < 5) {
      this.nextQueue.push(this.randomizer.next());
    }
  }

  private endGame(): void {
    if (this.state === 'gameover') return;
    this.state = 'gameover';
    this.emit({ type: 'gameover', score: this.score, level: this.level, lines: this.lines });
  }

  private emit(event: GameEvent): void {
    this.onEvent?.(event);
  }
}
