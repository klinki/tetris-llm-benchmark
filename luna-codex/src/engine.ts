export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
export const LOCK_DELAY_MS = 500;
export const MAX_LOCK_RESETS = 15;

export type TetrominoType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";
export type CellValue = TetrominoType | null;
export type Rotation = 0 | 1 | 2 | 3;
export type Action = "spawn" | "move" | "rotate";
export type RandomSource = () => number;

export interface Piece {
  type: TetrominoType;
  x: number;
  y: number;
  rotation: Rotation;
}

export interface GameSnapshot {
  board: CellValue[][];
  active: Piece | null;
  ghost: Piece | null;
  next: TetrominoType[];
  hold: TetrominoType | null;
  canHold: boolean;
  score: number;
  lines: number;
  level: number;
  combo: number;
  backToBack: boolean;
  gameOver: boolean;
  lastClear: number;
  perfectClear: boolean;
}

type Matrix = readonly string[];
type Kick = readonly [number, number];

const TYPES: readonly TetrominoType[] = ["I", "O", "T", "S", "Z", "J", "L"];

// The matrices use the SRS 4x4 bounding boxes. Rows are deliberately kept
// explicit: this makes the pivot and the wall-kick behavior easy to inspect.
export const MATRICES: Record<TetrominoType, readonly Matrix[]> = {
  I: [
    ["....", "IIII", "....", "...."],
    ["..I.", "..I.", "..I.", "..I."],
    ["....", "....", "IIII", "...."],
    [".I..", ".I..", ".I..", ".I.."]
  ],
  O: [
    [".OO.", ".OO.", "....", "...."],
    [".OO.", ".OO.", "....", "...."],
    [".OO.", ".OO.", "....", "...."],
    [".OO.", ".OO.", "....", "...."]
  ],
  T: [
    [".T..", "TTT.", "....", "...."],
    [".T..", ".TT.", ".T..", "...."],
    ["....", "TTT.", ".T..", "...."],
    [".T..", "TT..", ".T..", "...."]
  ],
  S: [
    [".SS.", "SS..", "....", "...."],
    [".S..", ".SS.", "..S.", "...."],
    [".SS.", "SS..", "....", "...."],
    ["S...", "SS..", ".S..", "...."]
  ],
  Z: [
    ["ZZ..", ".ZZ.", "....", "...."],
    [".Z..", "ZZ..", "..Z.", "...."],
    ["ZZ..", ".ZZ.", "....", "...."],
    [".Z..", ".ZZ.", "Z...", "...."]
  ],
  J: [
    ["J...", "JJJ.", "....", "...."],
    [".JJ.", ".J..", ".J..", "...."],
    ["....", "JJJ.", "..J.", "...."],
    [".J..", ".J..", "JJ..", "...."]
  ],
  L: [
    ["..L.", "LLL.", "....", "...."],
    [".L..", ".L..", ".LL.", "...."],
    ["....", "LLL.", "L...", "...."],
    ["LL..", ".L..", ".L..", "...."]
  ]
};

const JLSTZ_KICKS: Record<string, readonly Kick[]> = {
  "0>1": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "1>0": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "1>2": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "2>1": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "2>3": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "3>2": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "3>0": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "0>3": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]]
};

const I_KICKS: Record<string, readonly Kick[]> = {
  "0>1": [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  "1>0": [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  "1>2": [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
  "2>1": [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  "2>3": [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  "3>2": [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  "3>0": [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  "0>3": [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]]
};

export function emptyBoard(): CellValue[][] {
  return Array.from({ length: BOARD_HEIGHT }, () => Array<CellValue>(BOARD_WIDTH).fill(null));
}

export function cellsForPiece(piece: Pick<Piece, "type" | "rotation">): Array<[number, number]> {
  const matrix = MATRICES[piece.type][piece.rotation];
  const cells: Array<[number, number]> = [];
  for (let row = 0; row < matrix.length; row += 1) {
    for (let column = 0; column < matrix[row].length; column += 1) {
      if (matrix[row][column] !== ".") cells.push([column, row]);
    }
  }
  return cells;
}

export function collides(board: CellValue[][], piece: Piece): boolean {
  for (const [column, row] of cellsForPiece(piece)) {
    const boardX = piece.x + column;
    const boardY = piece.y + row;
    if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) return true;
    if (boardY >= 0 && board[boardY][boardX] !== null) return true;
  }
  return false;
}

export function gravityIntervalForLevel(level: number): number {
  const safeLevel = Math.max(1, Math.floor(level));
  return Math.max(16.667, 1000 * Math.pow(0.8, safeLevel - 1));
}

export function lineClearScore(lines: number, level: number, tSpin = false, backToBack = false): number {
  const base = tSpin
    ? [400, 800, 1200, 1600][Math.min(3, Math.max(0, lines))]
    : [0, 100, 300, 500, 800][Math.min(4, Math.max(0, lines))];
  const difficult = (tSpin && lines > 0) || lines === 4;
  return difficult && backToBack ? Math.floor(base * 1.5 * Math.max(1, level)) : base * Math.max(1, level);
}

export function perfectClearScore(lines: number, level: number): number {
  const base = [0, 800, 1200, 1800, 2000][Math.min(4, Math.max(0, lines))];
  return base * Math.max(1, level);
}

export function createSeededRandom(seed: number): RandomSource {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

export class SevenBag {
  private bag: TetrominoType[] = [];

  public constructor(private readonly random: RandomSource = Math.random) {}

  public next(): TetrominoType {
    if (this.bag.length === 0) {
      this.bag = [...TYPES];
      for (let index = this.bag.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(this.random() * (index + 1));
        [this.bag[index], this.bag[swapIndex]] = [this.bag[swapIndex], this.bag[index]];
      }
    }
    return this.bag.pop() as TetrominoType;
  }
}

export interface TetrisGameOptions {
  random?: RandomSource;
  lockDelayMs?: number;
}

export class TetrisGame {
  public board = emptyBoard();
  public active: Piece | null = null;
  public holdType: TetrominoType | null = null;
  public canHold = true;
  public score = 0;
  public lines = 0;
  public level = 1;
  public combo = -1;
  public backToBack = false;
  public gameOver = false;
  public lastClear = 0;
  public perfectClear = false;

  private readonly random: RandomSource;
  private readonly lockDelayMs: number;
  private bag: SevenBag;
  private nextQueue: TetrominoType[] = [];
  private gravityAccumulator = 0;
  private lockTimer = 0;
  private lockResets = 0;
  private softDropping = false;
  private lastAction: Action = "spawn";

  public constructor(options: TetrisGameOptions = {}) {
    this.random = options.random ?? Math.random;
    this.lockDelayMs = Math.max(0, options.lockDelayMs ?? LOCK_DELAY_MS);
    this.bag = new SevenBag(this.random);
    this.reset();
  }

  public reset(): void {
    this.board = emptyBoard();
    this.active = null;
    this.holdType = null;
    this.canHold = true;
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.combo = -1;
    this.backToBack = false;
    this.gameOver = false;
    this.lastClear = 0;
    this.perfectClear = false;
    this.gravityAccumulator = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lastAction = "spawn";
    this.bag = new SevenBag(this.random);
    this.nextQueue = [];
    while (this.nextQueue.length < 5) this.nextQueue.push(this.bag.next());
    this.spawnNext();
  }

  public tick(deltaMs: number): void {
    if (this.gameOver || !this.active || !Number.isFinite(deltaMs) || deltaMs <= 0) return;

    const elapsed = Math.min(deltaMs, 250);
    if (this.isGrounded()) {
      this.lockTimer += elapsed;
      if (this.lockTimer >= this.lockDelayMs) this.lockCurrent();
      return;
    }

    const interval = this.softDropping ? 50 : gravityIntervalForLevel(this.level);
    this.gravityAccumulator += elapsed;
    while (this.gravityAccumulator >= interval && this.active && !this.gameOver) {
      this.gravityAccumulator -= interval;
      if (!this.tryMoveDown(this.softDropping)) break;
    }
  }

  public setSoftDrop(enabled: boolean): void {
    this.softDropping = enabled;
  }

  public moveHorizontal(direction: -1 | 1): boolean {
    if (!this.active || this.gameOver) return false;
    const moved = this.tryMove(this.active.x + direction, this.active.y, this.active.rotation, "move");
    if (moved) this.lastAction = "move";
    return moved;
  }

  public rotate(clockwise: boolean): boolean {
    if (!this.active || this.gameOver) return false;
    const piece = this.active;
    const nextRotation = ((piece.rotation + (clockwise ? 1 : 3)) % 4) as Rotation;
    const kicks = piece.type === "O"
      ? [[0, 0] as Kick]
      : (piece.type === "I" ? I_KICKS : JLSTZ_KICKS)[`${piece.rotation}>${nextRotation}`];

    for (const [kickX, kickY] of kicks ?? [[0, 0] as Kick]) {
      if (this.tryMove(piece.x + kickX, piece.y + kickY, nextRotation, "rotate")) {
        this.lastAction = "rotate";
        return true;
      }
    }
    return false;
  }

  public softDrop(): boolean {
    if (!this.active || this.gameOver) return false;
    return this.tryMoveDown(true);
  }

  public hardDrop(): number {
    if (!this.active || this.gameOver) return 0;
    let distance = 0;
    while (this.active && !collides(this.board, { ...this.active, y: this.active.y + 1 })) {
      this.active.y += 1;
      distance += 1;
    }
    this.score += distance * 2;
    this.lockCurrent();
    return distance;
  }

  public hold(): boolean {
    if (!this.active || !this.canHold || this.gameOver) return false;
    const currentType = this.active.type;
    const replacement = this.holdType;
    this.holdType = currentType;
    this.canHold = false;
    if (replacement === null) this.spawnNext();
    else this.spawnType(replacement);
    return true;
  }

  public getGhost(): Piece | null {
    if (!this.active || this.gameOver) return null;
    let ghost = { ...this.active };
    while (!collides(this.board, { ...ghost, y: ghost.y + 1 })) ghost.y += 1;
    return ghost;
  }

  public getNext(): TetrominoType[] {
    return [...this.nextQueue];
  }

  public getSnapshot(): GameSnapshot {
    return {
      board: this.board.map((row) => [...row]),
      active: this.active ? { ...this.active } : null,
      ghost: this.getGhost(),
      next: this.getNext(),
      hold: this.holdType,
      canHold: this.canHold,
      score: this.score,
      lines: this.lines,
      level: this.level,
      combo: this.combo,
      backToBack: this.backToBack,
      gameOver: this.gameOver,
      lastClear: this.lastClear,
      perfectClear: this.perfectClear
    };
  }

  // Small state-loading helpers keep the engine straightforward to test and
  // are also useful to debug board situations from the browser console.
  public setBoard(rows: Array<Array<CellValue> | string>): void {
    if (rows.length !== BOARD_HEIGHT) throw new Error(`Board must have ${BOARD_HEIGHT} rows`);
    this.board = rows.map((row) => {
      const values = typeof row === "string" ? [...row].map((cell) => cell === "." ? null : cell as CellValue) : [...row];
      if (values.length !== BOARD_WIDTH) throw new Error(`Each board row must have ${BOARD_WIDTH} cells`);
      return values;
    });
  }

  public setActivePiece(type: TetrominoType, x = 3, y = -1, rotation: Rotation = 0): void {
    this.active = { type, x, y, rotation };
    this.gameOver = false;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lastAction = "spawn";
    if (collides(this.board, this.active)) {
      this.active = null;
      this.gameOver = true;
    }
  }

  private spawnNext(): void {
    const type = this.nextQueue.shift();
    if (type === undefined) return;
    this.nextQueue.push(this.bag.next());
    this.spawnType(type);
  }

  private spawnType(type: TetrominoType): void {
    const piece: Piece = { type, x: 3, y: -1, rotation: 0 };
    this.active = piece;
    this.gravityAccumulator = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lastAction = "spawn";
    if (collides(this.board, piece)) {
      this.gameOver = true;
      this.active = null;
    }
  }

  private tryMove(x: number, y: number, rotation: Rotation, action: Action): boolean {
    if (!this.active) return false;
    const candidate: Piece = { ...this.active, x, y, rotation };
    if (collides(this.board, candidate)) return false;
    const wasGrounded = this.isGrounded();
    this.active = candidate;
    if (wasGrounded && this.lockResets < MAX_LOCK_RESETS) {
      this.lockTimer = 0;
      this.lockResets += 1;
    }
    this.lastAction = action;
    return true;
  }

  private tryMoveDown(softDrop: boolean): boolean {
    if (!this.active) return false;
    const moved = this.tryMove(this.active.x, this.active.y + 1, this.active.rotation, "move");
    if (moved && softDrop) this.score += 1;
    return moved;
  }

  private isGrounded(): boolean {
    return this.active !== null && collides(this.board, { ...this.active, y: this.active.y + 1 });
  }

  private isTSpin(piece: Piece): boolean {
    if (piece.type !== "T" || this.lastAction !== "rotate") return false;
    const pivotX = piece.x + 1;
    const pivotY = piece.y + 1;
    let occupiedCorners = 0;
    for (const [x, y] of [[pivotX - 1, pivotY - 1], [pivotX + 1, pivotY - 1], [pivotX - 1, pivotY + 1], [pivotX + 1, pivotY + 1]]) {
      if (x < 0 || x >= BOARD_WIDTH || y < 0 || y >= BOARD_HEIGHT || this.board[y][x] !== null) occupiedCorners += 1;
    }
    return occupiedCorners >= 3;
  }

  private lockCurrent(): void {
    const piece = this.active;
    if (!piece || this.gameOver) return;
    const occupied = cellsForPiece(piece);
    if (occupied.some(([, row]) => piece.y + row < 0)) {
      this.active = null;
      this.gameOver = true;
      return;
    }

    const tSpin = this.isTSpin(piece);
    for (const [column, row] of occupied) this.board[piece.y + row][piece.x + column] = piece.type;

    const cleared = this.clearLines();
    const levelBeforeClear = this.level;
    const difficult = tSpin || cleared === 4;
    this.score += lineClearScore(cleared, levelBeforeClear, tSpin, this.backToBack);

    if (cleared > 0) {
      this.combo = this.combo < 0 ? 0 : this.combo + 1;
      if (this.combo > 0) this.score += 50 * this.combo * levelBeforeClear;
      if (difficult) this.backToBack = true;
      else this.backToBack = false;
    }
    if (this.isPerfectClear()) this.score += perfectClearScore(cleared, levelBeforeClear);
    if (cleared === 0) this.combo = -1;

    this.lines += cleared;
    this.level = Math.floor(this.lines / 10) + 1;
    this.lastClear = cleared;
    this.perfectClear = this.isPerfectClear();
    this.active = null;
    this.canHold = true;
    this.gravityAccumulator = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    if (!this.gameOver) this.spawnNext();
  }

  private clearLines(): number {
    const remaining = this.board.filter((row) => row.some((cell) => cell === null));
    const cleared = BOARD_HEIGHT - remaining.length;
    this.board = [...Array.from({ length: cleared }, () => Array<CellValue>(BOARD_WIDTH).fill(null)), ...remaining];
    return cleared;
  }

  private isPerfectClear(): boolean {
    return this.board.every((row) => row.every((cell) => cell === null));
  }
}
