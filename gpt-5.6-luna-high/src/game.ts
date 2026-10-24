export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 22;
export const HIDDEN_ROWS = 2;
export const VISIBLE_HEIGHT = BOARD_HEIGHT - HIDDEN_ROWS;
export const LOCK_DELAY_MS = 500;
export const MAX_LOCK_RESETS = 15;

export type PieceType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';
export type Cell = PieceType | null;
export type Rotation = 0 | 1 | 2 | 3;

export interface Piece {
  type: PieceType;
  rotation: Rotation;
  x: number;
  y: number;
}

export interface ScoreEvent {
  lines: number;
  score: number;
  label: string;
}

export interface GameSnapshot {
  board: Cell[][];
  active: Piece | null;
  ghost: Piece | null;
  hold: PieceType | null;
  queue: PieceType[];
  score: number;
  lines: number;
  level: number;
  gameOver: boolean;
  paused: boolean;
  lastEvent: ScoreEvent | null;
}

const PIECES: readonly PieceType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
const SPAWN_CELLS: Record<PieceType, readonly [number, number][]> = {
  I: [[0, 1], [1, 1], [2, 1], [3, 1]],
  J: [[0, 0], [0, 1], [1, 1], [2, 1]],
  L: [[2, 0], [0, 1], [1, 1], [2, 1]],
  O: [[1, 0], [2, 0], [1, 1], [2, 1]],
  S: [[1, 0], [2, 0], [0, 1], [1, 1]],
  T: [[1, 0], [0, 1], [1, 1], [2, 1]],
  Z: [[0, 0], [1, 0], [1, 1], [2, 1]]
};

// SRS offsets use positive y as down, matching board coordinates.
const JLSTZ_KICKS: Record<string, readonly [number, number][]> = {
  '0>1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '1>0': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '1>2': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '2>1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '2>3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '3>2': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '3>0': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '0>3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]]
};
const I_KICKS: Record<string, readonly [number, number][]> = {
  '0>1': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  '1>0': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  '1>2': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
  '2>1': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  '2>3': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  '3>2': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  '3>0': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  '0>3': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]]
};

export function createBag(random: () => number = Math.random): PieceType[] {
  const bag = [...PIECES];
  for (let i = bag.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

export function getCells(type: PieceType, rotation: Rotation): readonly [number, number][] {
  if (type === 'O') return SPAWN_CELLS.O;
  if (type === 'I') {
    const states: readonly (readonly [number, number][])[] = [
      [[0, 1], [1, 1], [2, 1], [3, 1]],
      [[2, 0], [2, 1], [2, 2], [2, 3]],
      [[0, 2], [1, 2], [2, 2], [3, 2]],
      [[1, 0], [1, 1], [1, 2], [1, 3]]
    ];
    return states[rotation];
  }
  const cells = [...SPAWN_CELLS[type]];
  for (let i = 0; i < rotation; i += 1) {
    for (let j = 0; j < cells.length; j += 1) {
      const [x, y] = cells[j];
      cells[j] = [1 - (y - 1), 1 + (x - 1)];
    }
  }
  return cells;
}

export function getGravityInterval(level: number): number {
  const frames = [48, 43, 38, 33, 28, 23, 18, 13, 8, 6, 5, 4, 3, 2, 1];
  return (frames[Math.min(level, frames.length) - 1] ?? 1) * (1000 / 60);
}

export class Board {
  readonly cells: Cell[][];

  constructor() {
    this.cells = Array.from({ length: BOARD_HEIGHT }, () => Array<Cell>(BOARD_WIDTH).fill(null));
  }

  cloneCells(): Cell[][] { return this.cells.map((row) => [...row]); }

  collides(piece: Piece): boolean {
    for (const [localX, localY] of getCells(piece.type, piece.rotation)) {
      const x = piece.x + localX;
      const y = piece.y + localY;
      if (x < 0 || x >= BOARD_WIDTH || y >= BOARD_HEIGHT) return true;
      if (y >= 0 && this.cells[y][x] !== null) return true;
    }
    return false;
  }

  place(piece: Piece): void {
    for (const [localX, localY] of getCells(piece.type, piece.rotation)) {
      const x = piece.x + localX;
      const y = piece.y + localY;
      if (x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT) this.cells[y][x] = piece.type;
    }
  }

  clearLines(): number {
    const remaining = this.cells.filter((row) => row.some((cell) => cell === null));
    const cleared = BOARD_HEIGHT - remaining.length;
    while (remaining.length < BOARD_HEIGHT) remaining.unshift(Array<Cell>(BOARD_WIDTH).fill(null));
    this.cells.splice(0, BOARD_HEIGHT, ...remaining);
    return cleared;
  }
}

export class TetrisGame {
  readonly board = new Board();
  active: Piece | null = null;
  ghost: Piece | null = null;
  hold: PieceType | null = null;
  queue: PieceType[] = [];
  score = 0;
  lines = 0;
  level = 1;
  gameOver = false;
  paused = false;
  lastEvent: ScoreEvent | null = null;
  private canHold = true;
  private gravityElapsed = 0;
  private lockElapsed = 0;
  private lockResets = 0;
  private grounded = false;
  private combo = -1;
  private backToBack = false;
  private readonly random: () => number;

  constructor(random: () => number = Math.random) {
    this.random = random;
    this.restart();
  }

  restart(): void {
    for (const row of this.board.cells) row.fill(null);
    this.active = null;
    this.ghost = null;
    this.hold = null;
    this.queue = [];
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.gameOver = false;
    this.paused = false;
    this.lastEvent = null;
    this.canHold = true;
    this.gravityElapsed = 0;
    this.lockElapsed = 0;
    this.lockResets = 0;
    this.grounded = false;
    this.combo = -1;
    this.backToBack = false;
    this.fillQueue();
    this.spawn();
  }

  snapshot(): GameSnapshot {
    return {
      board: this.board.cloneCells(),
      active: this.active ? { ...this.active } : null,
      ghost: this.ghost ? { ...this.ghost } : null,
      hold: this.hold,
      queue: [...this.queue],
      score: this.score,
      lines: this.lines,
      level: this.level,
      gameOver: this.gameOver,
      paused: this.paused,
      lastEvent: this.lastEvent ? { ...this.lastEvent } : null
    };
  }

  update(deltaMs: number): void {
    if (this.gameOver || this.paused || !this.active) return;
    this.gravityElapsed += Math.max(0, deltaMs);
    const interval = getGravityInterval(this.level);
    while (this.gravityElapsed >= interval) {
      this.gravityElapsed -= interval;
      if (!this.tryMove(0, 1, false)) break;
    }
    if (this.grounded) {
      this.lockElapsed += Math.max(0, deltaMs);
      if (this.lockElapsed >= LOCK_DELAY_MS) this.lockPiece();
    }
  }

  moveLeft(): boolean { return this.tryMove(-1, 0, true); }
  moveRight(): boolean { return this.tryMove(1, 0, true); }

  softDrop(): boolean {
    const moved = this.tryMove(0, 1, true);
    if (moved) this.score += 1;
    return moved;
  }

  hardDrop(): number {
    if (this.gameOver || this.paused || !this.active) return 0;
    let distance = 0;
    while (this.tryMove(0, 1, false)) distance += 1;
    this.score += distance * 2;
    this.lockPiece();
    return distance;
  }

  rotate(clockwise: boolean): boolean {
    if (this.gameOver || this.paused || !this.active || this.active.type === 'O') return false;
    const from = this.active.rotation;
    const to = ((from + (clockwise ? 1 : 3)) % 4) as Rotation;
    const key = `${from}>${to}`;
    const kicks = this.active.type === 'I' ? I_KICKS[key] : JLSTZ_KICKS[key];
    for (const [kickX, kickY] of kicks) {
      const candidate: Piece = { ...this.active, rotation: to, x: this.active.x + kickX, y: this.active.y + kickY };
      if (!this.board.collides(candidate)) {
        this.active = candidate;
        this.afterAction();
        return true;
      }
    }
    return false;
  }

  holdPiece(): boolean {
    if (this.gameOver || this.paused || !this.active || !this.canHold) return false;
    const current = this.active.type;
    this.canHold = false;
    if (this.hold === null) {
      this.hold = current;
      this.spawn();
    } else {
      const next = this.hold;
      this.hold = current;
      this.spawn(next);
    }
    return true;
  }

  togglePause(): void { if (!this.gameOver) this.paused = !this.paused; }

  /** Test helper: replace the board with rows encoded from top to bottom. */
  setBoard(rows: Cell[][]): void {
    if (rows.length !== BOARD_HEIGHT || rows.some((row) => row.length !== BOARD_WIDTH)) throw new Error('Board must be 22 x 10');
    this.board.cells.splice(0, BOARD_HEIGHT, ...rows.map((row) => [...row]));
    this.updateGhost();
  }

  private fillQueue(): void {
    while (this.queue.length < 5) this.queue.push(...createBag(this.random));
  }

  private spawn(forcedType?: PieceType): void {
    this.fillQueue();
    const type = forcedType ?? this.queue.shift()!;
    this.fillQueue();
    const piece: Piece = { type, rotation: 0, x: 3, y: 0 };
    this.active = piece;
    this.gravityElapsed = 0;
    this.lockElapsed = 0;
    this.lockResets = 0;
    this.grounded = this.board.collides(piece);
    this.updateGhost();
    if (this.grounded) {
      this.gameOver = true;
      this.active = null;
      this.ghost = null;
      this.lastEvent = { lines: 0, score: 0, label: 'Game over' };
    }
  }

  private tryMove(dx: number, dy: number, resetLock: boolean): boolean {
    if (this.gameOver || this.paused || !this.active) return false;
    const candidate = { ...this.active, x: this.active.x + dx, y: this.active.y + dy };
    if (this.board.collides(candidate)) {
      if (dy > 0) this.grounded = true;
      return false;
    }
    this.active = candidate;
    if (dy > 0) this.grounded = false;
    if (resetLock) this.afterAction();
    this.updateGhost();
    return true;
  }

  private afterAction(): void {
    if (this.grounded && this.lockResets < MAX_LOCK_RESETS) {
      this.lockElapsed = 0;
      this.lockResets += 1;
    }
    this.grounded = this.board.collides({ ...this.active!, y: this.active!.y + 1 });
    this.updateGhost();
  }

  private updateGhost(): void {
    if (!this.active) { this.ghost = null; return; }
    let ghost = { ...this.active };
    while (!this.board.collides({ ...ghost, y: ghost.y + 1 })) ghost.y += 1;
    this.ghost = ghost;
  }

  private lockPiece(): void {
    if (!this.active) return;
    const locked = { ...this.active };
    const isTSpin = locked.type === 'T' && this.isTSpin(locked);
    this.board.place(locked);
    const cleared = this.board.clearLines();
    const event = this.scoreLock(cleared, isTSpin);
    this.lastEvent = event;
    this.active = null;
    this.ghost = null;
    this.canHold = true;
    this.spawn();
  }

  private isTSpin(piece: Piece): boolean {
    const corners = [[piece.x, piece.y], [piece.x + 2, piece.y], [piece.x, piece.y + 2], [piece.x + 2, piece.y + 2]];
    return corners.filter(([x, y]) => x < 0 || x >= BOARD_WIDTH || y < 0 || y >= BOARD_HEIGHT || this.board.cells[y][x] !== null).length >= 3;
  }

  private scoreLock(cleared: number, tSpin: boolean): ScoreEvent {
    const level = this.level;
    let base = 0;
    let label = '';
    if (tSpin) {
      base = [400, 800, 1200, 1600][cleared] ?? 400;
      label = cleared ? `T-spin ${['', 'single', 'double', 'triple'][cleared]}` : 'T-spin';
    } else {
      base = [0, 100, 300, 500, 800][cleared] ?? 0;
      label = ['', 'Single', 'Double', 'Triple', 'Tetris'][cleared] ?? '';
    }
    const difficult = tSpin || cleared === 4;
    if (cleared > 0) {
      this.combo += 1;
      base += Math.max(0, this.combo) * 50;
      if (difficult && this.backToBack) base = Math.floor(base * 1.5);
      this.backToBack = difficult;
      this.lines += cleared;
      this.level = Math.floor(this.lines / 10) + 1;
    } else {
      this.combo = -1;
    }
    const points = base * level;
    this.score += points;
    return { lines: cleared, score: points, label: label || (this.combo > 0 ? `${this.combo + 1} combo` : '') };
  }
}
