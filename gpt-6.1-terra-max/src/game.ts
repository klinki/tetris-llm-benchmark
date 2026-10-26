/** The game engine is independent of the DOM so its rules can be tested in Node. */
export const WIDTH = 10;
export const HEIGHT = 20;
export const BUFFER = 20;
export const LOCK_DELAY = 500;
export const MAX_LOCK_RESETS = 15;
export const TYPES = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'] as const;

export type PieceType = typeof TYPES[number];
export type Cell = PieceType | null;
export type Rotation = 0 | 1 | 2 | 3;
export type Spin = 'none' | 'mini' | 'full';
export type GameStatus = 'playing' | 'paused' | 'gameover';
export interface Point { x: number; y: number }
export interface Piece { type: PieceType; rotation: Rotation; x: number; y: number }
export interface ClearEvent { id: number; label: string; points: number; lines: number; backToBack: boolean; combo: number; perfectClear: boolean }

const SPAWN: Record<PieceType, Point[]> = {
  I: [{x: 0, y: 1}, {x: 1, y: 1}, {x: 2, y: 1}, {x: 3, y: 1}],
  J: [{x: 0, y: 0}, {x: 0, y: 1}, {x: 1, y: 1}, {x: 2, y: 1}],
  L: [{x: 2, y: 0}, {x: 0, y: 1}, {x: 1, y: 1}, {x: 2, y: 1}],
  O: [{x: 1, y: 0}, {x: 2, y: 0}, {x: 1, y: 1}, {x: 2, y: 1}],
  S: [{x: 1, y: 0}, {x: 2, y: 0}, {x: 0, y: 1}, {x: 1, y: 1}],
  T: [{x: 1, y: 0}, {x: 0, y: 1}, {x: 1, y: 1}, {x: 2, y: 1}],
  Z: [{x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: 1}, {x: 2, y: 1}]
};

// SRS kick data uses positive y upwards; the board uses positive y downwards.
const JLSTZ_KICKS: Record<string, number[][]> = {
  '0>1': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  '1>0': [[0,0],[1,0],[1,-1],[0,2],[1,2]],
  '1>2': [[0,0],[1,0],[1,-1],[0,2],[1,2]],
  '2>1': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  '2>3': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
  '3>2': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  '3>0': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  '0>3': [[0,0],[1,0],[1,1],[0,-2],[1,-2]]
};
const I_KICKS: Record<string, number[][]> = {
  '0>1': [[0,0],[-2,0],[1,0],[-2,-1],[1,2]],
  '1>0': [[0,0],[2,0],[-1,0],[2,1],[-1,-2]],
  '1>2': [[0,0],[-1,0],[2,0],[-1,2],[2,-1]],
  '2>1': [[0,0],[1,0],[-2,0],[1,-2],[-2,1]],
  '2>3': [[0,0],[2,0],[-1,0],[2,1],[-1,-2]],
  '3>2': [[0,0],[-2,0],[1,0],[-2,-1],[1,2]],
  '3>0': [[0,0],[1,0],[-2,0],[1,-2],[-2,1]],
  '0>3': [[0,0],[-1,0],[2,0],[-1,2],[2,-1]]
};

export function shape(type: PieceType, rotation: Rotation = 0): Point[] {
  let cells = SPAWN[type].map(point => ({...point}));
  if (type === 'O') return cells;
  const size = type === 'I' ? 4 : 3;
  for (let i = 0; i < rotation; i++) {
    cells = cells.map(({x, y}) => ({x: size - 1 - y, y: x}));
  }
  return cells;
}

export function pieceCells(piece: Piece): Point[] {
  return shape(piece.type, piece.rotation).map(({x, y}) => ({x: x + piece.x, y: y + piece.y}));
}

function emptyRow(): Cell[] { return Array<Cell>(WIDTH).fill(null); }
function emptyBoard(): Cell[][] { return Array.from({length: HEIGHT + BUFFER}, emptyRow); }

export class Game {
  board: Cell[][] = emptyBoard();
  active!: Piece;
  queue: PieceType[] = [];
  held: PieceType | null = null;
  canHold = true;
  status: GameStatus = 'playing';
  score = 0;
  lines = 0;
  level = 1;
  combo = -1;
  backToBack = false;
  lastClear: ClearEvent | null = null;
  gravityElapsed = 0;
  lockElapsed = 0;
  lockResets = 0;
  private lastRotation: { kick: number } | null = null;
  private eventId = 0;

  constructor(private readonly random: () => number = Math.random) { this.restart(); }

  restart(): void {
    this.board = emptyBoard();
    this.queue = [];
    this.held = null;
    this.canHold = true;
    this.status = 'playing';
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.combo = -1;
    this.backToBack = false;
    this.lastClear = null;
    this.eventId = 0;
    this.refillQueue();
    this.spawnNext();
  }

  private refillQueue(): void {
    while (this.queue.length < 6) {
      const bag: PieceType[] = [...TYPES];
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
      this.queue.push(...bag);
    }
  }

  private spawnNext(): void {
    const type = this.queue.shift()!;
    this.refillQueue();
    this.spawn(type);
  }

  private spawn(type: PieceType): void {
    // The bottom of a newly spawned piece is visible, as in modern Guideline games.
    this.active = {type, rotation: 0, x: 3, y: -1};
    this.gravityElapsed = 0;
    this.lockElapsed = 0;
    this.lockResets = 0;
    this.lastRotation = null;
    if (this.collides(this.active)) this.status = 'gameover';
  }

  collides(piece: Piece): boolean {
    return pieceCells(piece).some(({x, y}) =>
      x < 0 || x >= WIDTH || y < -BUFFER || y >= HEIGHT || this.board[y + BUFFER][x] !== null
    );
  }

  get ghost(): Piece {
    const ghost = {...this.active};
    while (!this.collides({...ghost, y: ghost.y + 1})) ghost.y++;
    return ghost;
  }

  get grounded(): boolean { return this.collides({...this.active, y: this.active.y + 1}); }

  private resetLockIfAllowed(wasGrounded: boolean): void {
    if (wasGrounded && this.lockResets < MAX_LOCK_RESETS) {
      this.lockElapsed = 0;
      this.lockResets++;
    }
  }

  move(dx: number): boolean {
    if (this.status !== 'playing') return false;
    const next = {...this.active, x: this.active.x + dx};
    if (this.collides(next)) return false;
    const wasGrounded = this.grounded;
    this.active = next;
    this.lastRotation = null;
    this.resetLockIfAllowed(wasGrounded);
    return true;
  }

  rotate(direction: 1 | -1): boolean {
    if (this.status !== 'playing') return false;
    const from = this.active.rotation;
    const to = ((from + direction + 4) % 4) as Rotation;
    const kicks = this.active.type === 'O' ? [[0,0]] :
      (this.active.type === 'I' ? I_KICKS : JLSTZ_KICKS)[`${from}>${to}`];
    const wasGrounded = this.grounded;
    for (let i = 0; i < kicks.length; i++) {
      const [dx, dy] = kicks[i];
      const next = {...this.active, rotation: to, x: this.active.x + dx, y: this.active.y - dy};
      if (!this.collides(next)) {
        this.active = next;
        this.lastRotation = {kick: i};
        this.resetLockIfAllowed(wasGrounded);
        return true;
      }
    }
    return false;
  }

  softDrop(): boolean {
    if (this.status !== 'playing') return false;
    const next = {...this.active, y: this.active.y + 1};
    if (this.collides(next)) return false;
    this.active = next;
    this.lastRotation = null;
    this.score++;
    this.gravityElapsed = 0;
    return true;
  }

  hardDrop(): number {
    if (this.status !== 'playing') return 0;
    const destination = this.ghost;
    const distance = destination.y - this.active.y;
    this.active = destination;
    this.score += distance * 2;
    this.lock();
    return distance;
  }

  hold(): boolean {
    if (this.status !== 'playing' || !this.canHold) return false;
    const current = this.active.type;
    const previous = this.held;
    this.held = current;
    this.canHold = false;
    if (previous) this.spawn(previous); else this.spawnNext();
    return true;
  }

  togglePause(): void {
    if (this.status === 'playing') this.status = 'paused';
    else if (this.status === 'paused') this.status = 'playing';
  }

  update(elapsed: number): void {
    if (this.status !== 'playing' || elapsed <= 0) return;
    // Tetris Worlds' gravity curve, limited to 20 cells per 60 Hz frame.
    const speedLevel = Math.min(this.level, 20);
    const interval = Math.max(1000 / 1200, 1000 * Math.pow(0.8 - (speedLevel - 1) * 0.007, speedLevel - 1));
    let remaining = elapsed;
    while (remaining > 0) {
      if (this.grounded) {
        // Only time spent on the ground counts toward the lock delay.
        this.gravityElapsed = 0;
        this.lockElapsed += remaining;
        if (this.lockElapsed >= LOCK_DELAY) this.lock();
        return;
      }
      const untilFall = Math.max(0, interval - this.gravityElapsed);
      if (remaining < untilFall) {
        this.gravityElapsed += remaining;
        return;
      }
      remaining -= untilFall;
      this.gravityElapsed = 0;
      this.active = {...this.active, y: this.active.y + 1};
    }
  }

  private spinType(): Spin {
    if (this.active.type !== 'T' || !this.lastRotation) return 'none';
    const cx = this.active.x + 1, cy = this.active.y + 1;
    const occupied = (x: number, y: number): boolean =>
      x < 0 || x >= WIDTH || y < -BUFFER || y >= HEIGHT || this.board[y + BUFFER][x] !== null;
    // Clockwise order: top-left, top-right, bottom-right, bottom-left.
    const corners = [occupied(cx-1, cy-1), occupied(cx+1, cy-1), occupied(cx+1, cy+1), occupied(cx-1, cy+1)];
    if (corners.filter(Boolean).length < 3) return 'none';
    const front = [[0,1], [1,2], [2,3], [3,0]][this.active.rotation];
    return (corners[front[0]] && corners[front[1]]) || this.lastRotation.kick === 4 ? 'full' : 'mini';
  }

  private lock(): void {
    const cells = pieceCells(this.active);
    const spin = this.spinType();
    for (const {x, y} of cells) this.board[y + BUFFER][x] = this.active.type;
    let cleared = 0;
    for (let row = this.board.length - 1; row >= 0; row--) {
      if (this.board[row].every(Boolean)) {
        this.board.splice(row, 1);
        this.board.unshift(emptyRow());
        cleared++;
        row++;
      }
    }
    this.award(cleared, spin);
    if (cells.every(({y}) => y < 0)) {
      this.status = 'gameover';
      return;
    }
    this.canHold = true;
    this.spawnNext();
  }

  private award(cleared: number, spin: Spin): void {
    const oldLevel = this.level;
    const difficult = cleared > 0 && (cleared === 4 || spin !== 'none');
    const isBackToBack = difficult && this.backToBack;
    const normalPoints = [0, 100, 300, 500, 800];
    const fullPoints = [400, 800, 1200, 1600];
    const miniPoints = [100, 200, 400];
    let base = spin === 'full' ? (fullPoints[cleared] || 0) :
      spin === 'mini' ? (miniPoints[cleared] || 0) : (normalPoints[cleared] || 0);
    if (isBackToBack) base *= 1.5;
    if (cleared > 0) {
      this.combo++;
      this.backToBack = difficult;
    } else {
      this.combo = -1;
    }
    const perfectClear = cleared > 0 && this.board.every(row => row.every(cell => cell === null));
    const perfectPoints = perfectClear ? (isBackToBack && cleared === 4 ? 3200 : [0, 800, 1200, 1800, 2000][cleared]) : 0;
    const points = (base + Math.max(0, this.combo) * 50 + perfectPoints) * oldLevel;
    this.score += points;
    this.lines += cleared;
    this.level = 1 + Math.floor(this.lines / 10);
    if (cleared > 0 || spin !== 'none') {
      const names = ['', 'SINGLE', 'DOUBLE', 'TRIPLE', 'TETRIS'];
      const label = spin === 'none' ? names[cleared] : `T-SPIN${spin === 'mini' ? ' MINI' : ''}${cleared ? ` ${names[cleared]}` : ''}`;
      this.lastClear = {id: ++this.eventId, label, points, lines: cleared, backToBack: isBackToBack, combo: this.combo, perfectClear};
    }
  }
}
