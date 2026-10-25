export const BOARD_WIDTH = 10;
export const VISIBLE_HEIGHT = 20;
export const HIDDEN_ROWS = 4;
export const BOARD_HEIGHT = VISIBLE_HEIGHT + HIDDEN_ROWS;

export type PieceKind = "I" | "J" | "L" | "O" | "S" | "T" | "Z";
export type Cell = PieceKind | null;
export type Board = Cell[][];
export type GameStatus = "playing" | "paused" | "gameover";

export interface Point { x: number; y: number }
export interface ActivePiece { kind: PieceKind; rotation: number; x: number; y: number }
export interface GameSnapshot {
  board: Board;
  active: ActivePiece;
  ghostY: number;
  hold: PieceKind | null;
  next: PieceKind[];
  score: number;
  lines: number;
  level: number;
  combo: number;
  backToBack: boolean;
  status: GameStatus;
  canHold: boolean;
  message: string;
}

const KINDS: PieceKind[] = ["I", "J", "L", "O", "S", "T", "Z"];

// Coordinates are centered on each piece's SRS rotation origin. Positive y is down.
const SHAPES: Record<PieceKind, Point[][]> = {
  T: [
    [{x:-1,y:0},{x:0,y:0},{x:1,y:0},{x:0,y:1}],
    [{x:0,y:-1},{x:0,y:0},{x:0,y:1},{x:-1,y:0}],
    [{x:-1,y:0},{x:0,y:0},{x:1,y:0},{x:0,y:-1}],
    [{x:0,y:-1},{x:0,y:0},{x:0,y:1},{x:1,y:0}]
  ],
  J: [
    [{x:-1,y:-1},{x:-1,y:0},{x:0,y:0},{x:1,y:0}],
    [{x:0,y:-1},{x:1,y:-1},{x:0,y:0},{x:0,y:1}],
    [{x:-1,y:0},{x:0,y:0},{x:1,y:0},{x:1,y:1}],
    [{x:0,y:-1},{x:0,y:0},{x:-1,y:1},{x:0,y:1}]
  ],
  L: [
    [{x:1,y:-1},{x:-1,y:0},{x:0,y:0},{x:1,y:0}],
    [{x:0,y:-1},{x:0,y:0},{x:0,y:1},{x:1,y:1}],
    [{x:-1,y:0},{x:0,y:0},{x:1,y:0},{x:-1,y:1}],
    [{x:-1,y:-1},{x:0,y:-1},{x:0,y:0},{x:0,y:1}]
  ],
  S: [
    [{x:0,y:-1},{x:1,y:-1},{x:-1,y:0},{x:0,y:0}],
    [{x:0,y:-1},{x:0,y:0},{x:1,y:0},{x:1,y:1}],
    [{x:0,y:0},{x:1,y:0},{x:-1,y:1},{x:0,y:1}],
    [{x:-1,y:-1},{x:-1,y:0},{x:0,y:0},{x:0,y:1}]
  ],
  Z: [
    [{x:-1,y:-1},{x:0,y:-1},{x:0,y:0},{x:1,y:0}],
    [{x:1,y:-1},{x:0,y:0},{x:1,y:0},{x:0,y:1}],
    [{x:-1,y:0},{x:0,y:0},{x:0,y:1},{x:1,y:1}],
    [{x:0,y:-1},{x:-1,y:0},{x:0,y:0},{x:-1,y:1}]
  ],
  I: [
    [{x:-1,y:0},{x:0,y:0},{x:1,y:0},{x:2,y:0}],
    [{x:1,y:-1},{x:1,y:0},{x:1,y:1},{x:1,y:2}],
    [{x:-1,y:1},{x:0,y:1},{x:1,y:1},{x:2,y:1}],
    [{x:0,y:-1},{x:0,y:0},{x:0,y:1},{x:0,y:2}]
  ],
  O: [
    [{x:0,y:-1},{x:1,y:-1},{x:0,y:0},{x:1,y:0}],
    [{x:0,y:-1},{x:1,y:-1},{x:0,y:0},{x:1,y:0}],
    [{x:0,y:-1},{x:1,y:-1},{x:0,y:0},{x:1,y:0}],
    [{x:0,y:-1},{x:1,y:-1},{x:0,y:0},{x:1,y:0}]
  ]
};

const JLSTZ_KICKS: Record<string, Point[]> = {
  "0>1": [{x:0,y:0},{x:-1,y:0},{x:-1,y:-1},{x:0,y:2},{x:-1,y:2}],
  "1>0": [{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:-2},{x:1,y:-2}],
  "1>2": [{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:-2},{x:1,y:-2}],
  "2>1": [{x:0,y:0},{x:-1,y:0},{x:-1,y:-1},{x:0,y:2},{x:-1,y:2}],
  "2>3": [{x:0,y:0},{x:1,y:0},{x:1,y:-1},{x:0,y:2},{x:1,y:2}],
  "3>2": [{x:0,y:0},{x:-1,y:0},{x:-1,y:1},{x:0,y:-2},{x:-1,y:-2}],
  "3>0": [{x:0,y:0},{x:-1,y:0},{x:-1,y:1},{x:0,y:-2},{x:-1,y:-2}],
  "0>3": [{x:0,y:0},{x:1,y:0},{x:1,y:-1},{x:0,y:2},{x:1,y:2}]
};

const I_KICKS: Record<string, Point[]> = {
  "0>1": [{x:0,y:0},{x:-2,y:0},{x:1,y:0},{x:-2,y:1},{x:1,y:-2}],
  "1>0": [{x:0,y:0},{x:2,y:0},{x:-1,y:0},{x:2,y:-1},{x:-1,y:2}],
  "1>2": [{x:0,y:0},{x:-1,y:0},{x:2,y:0},{x:-1,y:-2},{x:2,y:1}],
  "2>1": [{x:0,y:0},{x:1,y:0},{x:-2,y:0},{x:1,y:2},{x:-2,y:-1}],
  "2>3": [{x:0,y:0},{x:2,y:0},{x:-1,y:0},{x:2,y:-1},{x:-1,y:2}],
  "3>2": [{x:0,y:0},{x:-2,y:0},{x:1,y:0},{x:-2,y:1},{x:1,y:-2}],
  "3>0": [{x:0,y:0},{x:1,y:0},{x:-2,y:0},{x:1,y:2},{x:-2,y:-1}],
  "0>3": [{x:0,y:0},{x:-1,y:0},{x:2,y:0},{x:-1,y:-2},{x:2,y:1}]
};

export function emptyBoard(): Board {
  return Array.from({ length: BOARD_HEIGHT }, () => Array<Cell>(BOARD_WIDTH).fill(null));
}

export function pieceCells(piece: ActivePiece): Point[] {
  return (SHAPES[piece.kind][piece.rotation] ?? []).map(({x, y}) => ({ x: x + piece.x, y: y + piece.y }));
}

export class TetrisGame {
  board: Board = emptyBoard();
  active!: ActivePiece;
  holdPiece: PieceKind | null = null;
  queue: PieceKind[] = [];
  score = 0;
  lines = 0;
  level = 1;
  combo = -1;
  backToBack = false;
  status: GameStatus = "playing";
  canHold = true;
  message = "READY";
  private rng: () => number;
  private fallAccumulator = 0;
  private lockAccumulator = 0;
  private lockResets = 0;
  private lastMoveWasRotation = false;

  constructor(rng: () => number = Math.random) {
    this.rng = rng;
    this.fillQueue();
    this.spawn();
  }

  reset(): void {
    this.board = emptyBoard();
    this.holdPiece = null;
    this.queue = [];
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.combo = -1;
    this.backToBack = false;
    this.status = "playing";
    this.canHold = true;
    this.message = "READY";
    this.fallAccumulator = 0;
    this.lockAccumulator = 0;
    this.lockResets = 0;
    this.fillQueue();
    this.spawn();
  }

  snapshot(): GameSnapshot {
    return {
      board: this.board,
      active: { ...this.active },
      ghostY: this.ghostY(),
      hold: this.holdPiece,
      next: this.queue.slice(0, 5),
      score: this.score,
      lines: this.lines,
      level: this.level,
      combo: this.combo,
      backToBack: this.backToBack,
      status: this.status,
      canHold: this.canHold,
      message: this.message
    };
  }

  tick(deltaMs: number): void {
    if (this.status !== "playing") return;
    const grounded = !this.valid({ ...this.active, y: this.active.y + 1 });
    if (grounded) {
      this.lockAccumulator += deltaMs;
      if (this.lockAccumulator >= 500) this.lock();
      return;
    }
    this.lockAccumulator = 0;
    this.fallAccumulator += deltaMs;
    const gravityMs = this.gravityInterval();
    while (this.fallAccumulator >= gravityMs && this.status === "playing") {
      this.fallAccumulator -= gravityMs;
      if (!this.move(0, 1, false)) break;
    }
  }

  move(dx: number, dy: number, playerAction = true): boolean {
    if (this.status !== "playing") return false;
    const candidate = { ...this.active, x: this.active.x + dx, y: this.active.y + dy };
    if (!this.valid(candidate)) return false;
    const wasGrounded = this.isGrounded();
    this.active = candidate;
    this.lastMoveWasRotation = false;
    if (playerAction && wasGrounded && this.lockResets < 15) {
      this.lockAccumulator = 0;
      this.lockResets++;
    }
    return true;
  }

  softDrop(): boolean {
    const moved = this.move(0, 1);
    if (moved) this.score += 1;
    return moved;
  }

  hardDrop(): number {
    if (this.status !== "playing") return 0;
    let distance = 0;
    while (this.move(0, 1, false)) distance++;
    this.score += distance * 2;
    this.lock();
    return distance;
  }

  rotate(direction: 1 | -1): boolean {
    if (this.status !== "playing") return false;
    const from = this.active.rotation;
    const to = (from + direction + 4) % 4;
    const table = this.active.kind === "I" ? I_KICKS : JLSTZ_KICKS;
    const kicks = this.active.kind === "O" ? [{x:0,y:0}] : (table[`${from}>${to}`] ?? [{x:0,y:0}]);
    const wasGrounded = this.isGrounded();
    for (const kick of kicks) {
      const candidate = { ...this.active, rotation: to, x: this.active.x + kick.x, y: this.active.y + kick.y };
      if (this.valid(candidate)) {
        this.active = candidate;
        this.lastMoveWasRotation = true;
        if (wasGrounded && this.lockResets < 15) {
          this.lockAccumulator = 0;
          this.lockResets++;
        }
        return true;
      }
    }
    return false;
  }

  hold(): boolean {
    if (this.status !== "playing" || !this.canHold) return false;
    const current = this.active.kind;
    if (this.holdPiece === null) {
      this.holdPiece = current;
      this.spawn();
    } else {
      const swap = this.holdPiece;
      this.holdPiece = current;
      this.spawn(swap);
    }
    this.canHold = false;
    this.message = "HOLD";
    return true;
  }

  togglePause(): void {
    if (this.status === "gameover") return;
    this.status = this.status === "paused" ? "playing" : "paused";
    this.message = this.status === "paused" ? "PAUSED" : "GO";
  }

  ghostY(): number {
    let y = this.active.y;
    while (this.valid({ ...this.active, y: y + 1 })) y++;
    return y;
  }

  valid(piece: ActivePiece): boolean {
    return pieceCells(piece).every(({x, y}) =>
      x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT && this.board[y]?.[x] === null
    );
  }

  private isGrounded(): boolean {
    return !this.valid({ ...this.active, y: this.active.y + 1 });
  }

  private gravityInterval(): number {
    return Math.max(16, 1000 * Math.pow(0.8 - (this.level - 1) * 0.007, this.level - 1));
  }

  private fillQueue(): void {
    while (this.queue.length < 7) {
      const bag = [...KINDS];
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(this.rng() * (i + 1));
        [bag[i], bag[j]] = [bag[j]!, bag[i]!];
      }
      this.queue.push(...bag);
    }
  }

  private spawn(kind?: PieceKind): void {
    this.fillQueue();
    const next = kind ?? this.queue.shift()!;
    this.fillQueue();
    this.active = { kind: next, rotation: 0, x: 4, y: 3 };
    this.fallAccumulator = 0;
    this.lockAccumulator = 0;
    this.lockResets = 0;
    this.lastMoveWasRotation = false;
    if (!this.valid(this.active)) {
      this.status = "gameover";
      this.message = "GAME OVER";
    }
  }

  private isTSpin(): boolean {
    if (this.active.kind !== "T" || !this.lastMoveWasRotation) return false;
    const corners = [
      {x:this.active.x-1,y:this.active.y-1}, {x:this.active.x+1,y:this.active.y-1},
      {x:this.active.x-1,y:this.active.y+1}, {x:this.active.x+1,y:this.active.y+1}
    ];
    return corners.filter(({x,y}) => x < 0 || x >= BOARD_WIDTH || y < 0 || y >= BOARD_HEIGHT || this.board[y]?.[x] !== null).length >= 3;
  }

  private lock(): void {
    if (this.status !== "playing") return;
    const tSpin = this.isTSpin();
    for (const {x, y} of pieceCells(this.active)) this.board[y]![x] = this.active.kind;

    let cleared = 0;
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (this.board[y]!.every(Boolean)) {
        this.board.splice(y, 1);
        this.board.unshift(Array<Cell>(BOARD_WIDTH).fill(null));
        cleared++;
        y++;
      }
    }

    const difficult = cleared === 4 || (tSpin && cleared > 0);
    const base = tSpin ? [400, 800, 1200, 1600][cleared] ?? 0 : [0, 100, 300, 500, 800][cleared] ?? 0;
    const b2bMultiplier = difficult && this.backToBack ? 1.5 : 1;
    if (cleared > 0) {
      this.combo++;
      this.score += Math.floor(base * this.level * b2bMultiplier);
      if (this.combo > 0) this.score += 50 * this.combo * this.level;
      this.lines += cleared;
      this.level = Math.floor(this.lines / 10) + 1;
      if (difficult) this.backToBack = true;
      else this.backToBack = false;
      this.message = tSpin ? `T-SPIN ${cleared}` : cleared === 4 ? "TETRIS" : ["", "SINGLE", "DOUBLE", "TRIPLE"][cleared]!;
    } else {
      this.combo = -1;
      if (tSpin) {
        this.score += base * this.level;
        this.message = "T-SPIN";
      } else this.message = "";
    }
    this.canHold = true;
    this.spawn();
  }
}

export const previewCells = (kind: PieceKind): Point[] => SHAPES[kind][0] ?? [];
