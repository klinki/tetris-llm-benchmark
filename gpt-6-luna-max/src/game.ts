export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

export type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
export type Cell = PieceType | null;
export type ActionType = 'spawn' | 'move' | 'rotate' | 'hold';

export interface Piece {
  type: PieceType;
  x: number;
  y: number;
  rotation: number;
}

export interface GameSnapshot {
  board: Cell[][];
  current: Piece;
  hold: PieceType | null;
  next: PieceType[];
  score: number;
  lines: number;
  level: number;
  combo: number;
  backToBack: boolean;
  gameOver: boolean;
}

const TYPES: PieceType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

const BASE_CELLS: Record<PieceType, readonly [number, number][]> = {
  I: [[0, 1], [1, 1], [2, 1], [3, 1]],
  O: [[1, 0], [2, 0], [1, 1], [2, 1]],
  T: [[1, 0], [0, 1], [1, 1], [2, 1]],
  S: [[1, 0], [2, 0], [0, 1], [1, 1]],
  Z: [[0, 0], [1, 0], [1, 1], [2, 1]],
  J: [[0, 0], [0, 1], [1, 1], [2, 1]],
  L: [[2, 0], [0, 1], [1, 1], [2, 1]],
};

const SCREEN_DOWN_KICKS: Record<string, readonly [number, number][]> = {
  '0>1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '1>0': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '1>2': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '2>1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '2>3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '3>2': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '3>0': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '0>3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
};

const I_SCREEN_DOWN_KICKS: Record<string, readonly [number, number][]> = {
  '0>1': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  '1>0': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  '1>2': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
  '2>1': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  '2>3': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  '3>2': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  '3>0': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
  '0>3': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
};

const NORMAL_CLEAR_SCORE = [0, 100, 300, 500, 800];
const T_SPIN_SCORE: Record<'full' | 'mini', number[]> = {
  full: [400, 800, 1200, 1600],
  mini: [100, 200, 400],
};

function blankBoard(): Cell[][] {
  return Array.from({ length: BOARD_HEIGHT }, () => Array<Cell>(BOARD_WIDTH).fill(null));
}

export function getCells(type: PieceType, rotation = 0): readonly [number, number][] {
  let cells = BASE_CELLS[type];
  const side = type === 'I' || type === 'O' ? 4 : 3;
  if (type === 'O') return cells;
  for (let step = 0; step < rotation % 4; step += 1) {
    cells = cells.map(([x, y]) => [side - 1 - y, x] as [number, number]);
  }
  return cells;
}

export function pieceColor(type: PieceType): string {
  return {
    I: '#43d7e7',
    O: '#f3ca52',
    T: '#b783ff',
    S: '#62d69a',
    Z: '#f16f83',
    J: '#648cff',
    L: '#ff9b52',
  }[type];
}

export class TetrisGame {
  board: Cell[][] = blankBoard();
  current: Piece;
  hold: PieceType | null = null;
  nextQueue: PieceType[] = [];
  score = 0;
  lines = 0;
  level = 1;
  combo = -1;
  backToBack = false;
  gameOver = false;
  canHold = true;
  gravityAccumulator = 0;
  lockTimer = 0;
  lockResets = 0;
  lastAction: ActionType = 'spawn';
  lastKickIndex: number | null = null;
  lastClear = 0;
  lastScoringEvent = '';

  private readonly random: () => number;

  constructor(random: () => number = Math.random) {
    this.random = random;
    this.current = this.createPiece('T');
    this.restart();
  }

  restart(): void {
    this.board = blankBoard();
    this.hold = null;
    this.nextQueue = [];
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.combo = -1;
    this.backToBack = false;
    this.gameOver = false;
    this.canHold = true;
    this.gravityAccumulator = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lastAction = 'spawn';
    this.lastKickIndex = null;
    this.lastClear = 0;
    this.lastScoringEvent = '';
    this.fillQueue(7);
    this.spawnNext();
  }

  snapshot(): GameSnapshot {
    return {
      board: this.board,
      current: this.current,
      hold: this.hold,
      next: this.nextQueue.slice(0, 5),
      score: this.score,
      lines: this.lines,
      level: this.level,
      combo: this.combo,
      backToBack: this.backToBack,
      gameOver: this.gameOver,
    };
  }

  private createBag(): PieceType[] {
    const bag = TYPES.slice();
    for (let index = bag.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(this.random() * (index + 1));
      [bag[index], bag[swapIndex]] = [bag[swapIndex], bag[index]];
    }
    return bag;
  }

  private fillQueue(minimum: number): void {
    while (this.nextQueue.length < minimum) this.nextQueue.push(...this.createBag());
  }

  private createPiece(type: PieceType): Piece {
    return { type, x: Math.floor((BOARD_WIDTH - (type === 'I' || type === 'O' ? 4 : 3)) / 2), y: -1, rotation: 0 };
  }

  private spawnNext(): void {
    this.fillQueue(1);
    this.current = this.createPiece(this.nextQueue.shift()!);
    this.fillQueue(7);
    this.gravityAccumulator = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lastAction = 'spawn';
    this.lastKickIndex = null;
    this.lastClear = 0;
    this.canHold = true;
    if (this.collides(this.current)) this.gameOver = true;
  }

  private collides(piece: Piece): boolean {
    return getCells(piece.type, piece.rotation).some(([cellX, cellY]) => {
      const x = piece.x + cellX;
      const y = piece.y + cellY;
      if (x < 0 || x >= BOARD_WIDTH || y >= BOARD_HEIGHT) return true;
      return y >= 0 && this.board[y][x] !== null;
    });
  }

  isGrounded(): boolean {
    return this.collides({ ...this.current, y: this.current.y + 1 });
  }

  getGhostY(): number {
    let y = this.current.y;
    while (!this.collides({ ...this.current, y: y + 1 })) y += 1;
    return y;
  }

  moveHorizontal(direction: -1 | 1): boolean {
    if (this.gameOver) return false;
    const wasGrounded = this.isGrounded();
    const candidate = { ...this.current, x: this.current.x + direction };
    if (this.collides(candidate)) return false;
    this.current = candidate;
    this.lastAction = 'move';
    this.lastKickIndex = null;
    this.applyLockReset(wasGrounded);
    return true;
  }

  private applyLockReset(wasGrounded: boolean): void {
    const grounded = this.isGrounded();
    if (wasGrounded && this.lockResets < 15) {
      this.lockTimer = 0;
      this.lockResets += 1;
    } else if (!grounded) {
      this.lockTimer = 0;
    }
  }

  rotate(direction: -1 | 1): boolean {
    if (this.gameOver) return false;
    const wasGrounded = this.isGrounded();
    const from = this.current.rotation;
    const to = (from + direction + 4) % 4;
    const kickTable = this.current.type === 'I' ? I_SCREEN_DOWN_KICKS : SCREEN_DOWN_KICKS;
    const tests = this.current.type === 'O' ? [[0, 0] as [number, number]] : kickTable[`${from}>${to}`];
    for (let index = 0; index < tests.length; index += 1) {
      const [dx, dy] = tests[index];
      const candidate = { ...this.current, x: this.current.x + dx, y: this.current.y + dy, rotation: to };
      if (this.collides(candidate)) continue;
      this.current = candidate;
      this.lastAction = 'rotate';
      this.lastKickIndex = index;
      this.applyLockReset(wasGrounded);
      return true;
    }
    return false;
  }

  holdPiece(): boolean {
    if (this.gameOver || !this.canHold) return false;
    const currentType = this.current.type;
    if (this.hold === null) {
      this.hold = currentType;
      this.spawnNext();
    } else {
      const heldType = this.hold;
      this.hold = currentType;
      this.current = this.createPiece(heldType);
      this.gravityAccumulator = 0;
      this.lockTimer = 0;
      this.lockResets = 0;
      this.lastAction = 'hold';
      this.lastKickIndex = null;
      if (this.collides(this.current)) this.gameOver = true;
    }
    this.canHold = false;
    return true;
  }

  hardDrop(): number {
    if (this.gameOver) return 0;
    let distance = 0;
    while (!this.collides({ ...this.current, y: this.current.y + 1 })) {
      this.current.y += 1;
      distance += 1;
    }
    this.score += distance * 2;
    this.lockPiece();
    return distance;
  }

  softDropStep(): boolean {
    if (this.gameOver) return false;
    if (this.collides({ ...this.current, y: this.current.y + 1 })) return false;
    this.current.y += 1;
    this.score += 1;
    return true;
  }

  tick(deltaMs: number, softDropHeld = false): void {
    if (this.gameOver || deltaMs <= 0) return;
    const interval = softDropHeld ? 30 : this.gravityIntervalMs();
    this.gravityAccumulator += Math.min(deltaMs, 100);
    while (this.gravityAccumulator >= interval) {
      this.gravityAccumulator -= interval;
      if (this.collides({ ...this.current, y: this.current.y + 1 })) {
        this.gravityAccumulator = 0;
        break;
      }
      this.current.y += 1;
      if (softDropHeld) this.score += 1;
    }

    if (this.isGrounded()) {
      this.lockTimer += Math.min(deltaMs, 100);
      if (this.lockTimer >= 500) this.lockPiece();
    } else {
      this.lockTimer = 0;
    }
  }

  private gravityIntervalMs(): number {
    const level = Math.max(1, this.level);
    const seconds = Math.pow(Math.max(0.1, 0.8 - (level - 1) * 0.007), level - 1);
    return Math.max(16, seconds * 1000);
  }

  private occupiedCorner(x: number, y: number): boolean {
    if (x < 0 || x >= BOARD_WIDTH || y >= BOARD_HEIGHT) return true;
    if (y < 0) return false;
    return this.board[y][x] !== null;
  }

  private getTSpinType(): 'full' | 'mini' | null {
    if (this.current.type !== 'T' || this.lastAction !== 'rotate') return null;
    const pivotX = this.current.x + 1;
    const pivotY = this.current.y + 1;
    const corners = [
      this.occupiedCorner(pivotX - 1, pivotY - 1),
      this.occupiedCorner(pivotX + 1, pivotY - 1),
      this.occupiedCorner(pivotX - 1, pivotY + 1),
      this.occupiedCorner(pivotX + 1, pivotY + 1),
    ];
    if (corners.filter(Boolean).length < 3) return null;
    const frontCorners = [
      [true, true, false, false],
      [false, true, false, true],
      [false, false, true, true],
      [true, false, true, false],
    ][this.current.rotation];
    const frontOccupied = corners.filter((occupied, index) => frontCorners[index] && occupied).length;
    return frontOccupied === 2 || this.lastKickIndex === 4 ? 'full' : 'mini';
  }

  private lockPiece(): void {
    if (this.gameOver) return;
    const spinType = this.getTSpinType();
    const cells = getCells(this.current.type, this.current.rotation);
    if (cells.some(([, y]) => this.current.y + y < 0)) {
      this.gameOver = true;
      return;
    }
    for (const [cellX, cellY] of cells) {
      const x = this.current.x + cellX;
      const y = this.current.y + cellY;
      if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) this.board[y][x] = this.current.type;
    }

    const remainingRows = this.board.filter((row) => !row.every((cell) => cell !== null));
    const cleared = BOARD_HEIGHT - remainingRows.length;
    while (remainingRows.length < BOARD_HEIGHT) remainingRows.unshift(Array<Cell>(BOARD_WIDTH).fill(null));
    this.board = remainingRows;
    this.lastClear = cleared;
    this.scoreClear(cleared, spinType);
    this.lines += cleared;
    this.level = Math.floor(this.lines / 10) + 1;
    this.spawnNext();
  }

  private scoreClear(cleared: number, spinType: 'full' | 'mini' | null): void {
    const wasDifficult = cleared > 0 && (spinType !== null || cleared === 4);
    const levelMultiplier = this.level;
    let base = 0;
    if (spinType) base = T_SPIN_SCORE[spinType][Math.min(cleared, T_SPIN_SCORE[spinType].length - 1)] ?? 0;
    else base = NORMAL_CLEAR_SCORE[Math.min(cleared, NORMAL_CLEAR_SCORE.length - 1)] ?? 0;

    const b2bBonus = wasDifficult && this.backToBack;
    if (b2bBonus) base = Math.floor(base * 1.5);
    this.score += base * levelMultiplier;

    if (cleared > 0) {
      this.combo += 1;
      if (this.combo > 0) this.score += 50 * this.combo * levelMultiplier;
      if (wasDifficult) this.backToBack = true;
      else this.backToBack = false;

      const perfectClear = this.board.every((row) => row.every((cell) => cell === null));
      if (perfectClear) this.score += [0, 800, 1200, 1800, 2000][Math.min(cleared, 4)] * levelMultiplier;
      this.lastScoringEvent = `${spinType ? `${spinType === 'mini' ? 'Mini ' : ''}T-spin` : ['No clear', 'Single', 'Double', 'Triple', 'Tetris'][cleared]}${b2bBonus ? ' · B2B' : ''}`;
    } else {
      this.combo = -1;
      if (spinType) this.lastScoringEvent = `${spinType === 'mini' ? 'Mini ' : ''}T-spin`;
      else this.lastScoringEvent = '';
    }
  }
}
