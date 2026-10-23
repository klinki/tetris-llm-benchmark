import {
  COLS,
  HIDDEN_ROWS,
  I_KICKS,
  JLSTZ_KICKS,
  LINES_PER_LEVEL,
  LOCK_DELAY_MS,
  MAX_LOCK_RESETS,
  NEXT_COUNT,
  SHAPES,
  TOTAL_ROWS,
  gravityIntervalMs,
} from './pieces.js';
import { SevenBag } from './randomizer.js';
import type {
  ActionBanner,
  ActivePiece,
  CellValue,
  GameSnapshot,
  PieceType,
  Point,
  RotationDirection,
  RotationState,
} from './types.js';

export class Game {
  private board: CellValue[][];
  private bag: SevenBag;
  private active: ActivePiece | null = null;
  private held: PieceType | null = null;
  private holdLocked = false;

  private score = 0;
  private best = 0;
  private lines = 0;
  private level = 1;
  private combo = -1;
  private b2b = false;

  private over = false;
  private paused = false;

  private fallTimer = 0;
  private lockTimer = 0;
  private lockResets = 0;
  private lowestY = 0;

  private rotatedLast = false;
  private kickIndex = 0;
  private banner: ActionBanner | null = null;

  constructor(rng?: () => number, best = 0) {
    this.bag = new SevenBag(rng);
    this.best = best;
    this.board = Game.emptyBoard();
    this.reset();
  }

  reset(): void {
    this.board = Game.emptyBoard();
    this.bag.reset();
    this.active = null;
    this.held = null;
    this.holdLocked = false;
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.combo = -1;
    this.b2b = false;
    this.over = false;
    this.paused = false;
    this.fallTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.banner = null;
    this.spawn(this.bag.next());
  }

  static emptyBoard(): CellValue[][] {
    return Array.from({ length: TOTAL_ROWS }, () => Array<CellValue>(COLS).fill(null));
  }

  isGameOver(): boolean {
    return this.over;
  }

  isPaused(): boolean {
    return this.paused;
  }

  togglePause(): void {
    if (!this.over) this.paused = !this.paused;
  }

  setPaused(p: boolean): void {
    if (!this.over) this.paused = p;
  }

  update(dtMs: number, softDropHeld = false): void {
    if (this.over || this.paused || !this.active) return;
    const base = gravityIntervalMs(this.level);
    const step = softDropHeld ? Math.min(base / 20, 40) : base;
    this.fallTimer += dtMs;
    while (this.fallTimer >= step) {
      this.fallTimer -= step;
      if (this.shift(0, 1)) {
        if (softDropHeld) this.addScore(1);
      } else {
        this.fallTimer = 0;
        break;
      }
    }
    if (this.grounded()) {
      this.lockTimer += dtMs;
      if (this.lockTimer >= LOCK_DELAY_MS) this.lock();
    } else {
      this.lockTimer = 0;
    }
  }

  moveLeft(): boolean {
    return this.trySide(-1);
  }

  moveRight(): boolean {
    return this.trySide(1);
  }

  softDropStep(): boolean {
    if (this.over || this.paused || !this.active) return false;
    if (this.shift(0, 1)) {
      this.addScore(1);
      this.fallTimer = 0;
      return true;
    }
    return false;
  }

  hardDrop(): number {
    if (this.over || this.paused || !this.active) return 0;
    let rows = 0;
    while (this.shift(0, 1)) rows++;
    if (rows > 0) this.addScore(rows * 2);
    this.lock();
    return rows;
  }

  rotate(dir: RotationDirection): boolean {
    if (this.over || this.paused || !this.active) return false;
    const cur = this.active;
    const to = ((dir === 'cw' ? cur.rotation + 1 : cur.rotation + 3) % 4) as RotationState;
    const kicks = this.kicksFor(cur.type, cur.rotation, to);
    for (let i = 0; i < kicks.length; i++) {
      const k = kicks[i];
      const cand: ActivePiece = { type: cur.type, rotation: to, x: cur.x + k.x, y: cur.y + k.y };
      if (this.fits(cand)) {
        const wasGrounded = this.grounded();
        this.active = cand;
        this.rotatedLast = true;
        this.kickIndex = i;
        this.resetLockOnMove(wasGrounded);
        return true;
      }
    }
    return false;
  }

  hold(): boolean {
    if (this.over || this.paused || !this.active || this.holdLocked) return false;
    const cur = this.active.type;
    const prev = this.held;
    this.held = cur;
    this.holdLocked = true;
    if (prev === null) {
      this.spawn(this.bag.next());
    } else {
      this.spawn(prev);
    }
    return true;
  }

  cellsOf(p: ActivePiece): Point[] {
    return SHAPES[p.type][p.rotation].map((o) => ({ x: p.x + o.x, y: p.y + o.y }));
  }

  ghostY(): number | null {
    if (!this.active) return null;
    let y = this.active.y;
    while (this.fits({ ...this.active, y: y + 1 })) y++;
    return y;
  }

  snapshot(): GameSnapshot {
    return {
      board: this.board.map((r) => [...r]),
      activePiece: this.active ? { ...this.active } : null,
      ghostY: this.ghostY(),
      holdPiece: this.held,
      canHold: !this.holdLocked,
      nextQueue: this.bag.peek(NEXT_COUNT),
      score: this.score,
      highScore: this.best,
      lines: this.lines,
      level: this.level,
      combo: Math.max(0, this.combo),
      backToBack: this.b2b,
      gameOver: this.over,
      paused: this.paused,
      lastAction: this.banner,
    };
  }

  setBoardForTest(board: CellValue[][]): void {
    this.board = board.map((r) => [...r]);
  }

  setActivePieceForTest(p: ActivePiece): void {
    this.active = { ...p };
    this.lowestY = p.y;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.rotatedLast = false;
  }

  private trySide(dx: number): boolean {
    if (this.over || this.paused || !this.active) return false;
    return this.shift(dx, 0);
  }

  private shift(dx: number, dy: number): boolean {
    if (!this.active) return false;
    const cand: ActivePiece = { ...this.active, x: this.active.x + dx, y: this.active.y + dy };
    if (!this.fits(cand)) return false;
    const wasGrounded = this.grounded();
    this.active = cand;
    this.rotatedLast = false;
    if (cand.y > this.lowestY) {
      this.lowestY = cand.y;
      this.lockResets = 0;
      this.lockTimer = 0;
    } else {
      this.resetLockOnMove(wasGrounded);
    }
    return true;
  }

  private resetLockOnMove(wasGrounded: boolean): void {
    if ((wasGrounded || this.grounded()) && this.lockResets < MAX_LOCK_RESETS) {
      this.lockTimer = 0;
      this.lockResets++;
    }
  }

  private grounded(): boolean {
    if (!this.active) return false;
    return !this.fits({ ...this.active, y: this.active.y + 1 });
  }

  private fits(p: ActivePiece): boolean {
    for (const c of this.cellsOf(p)) {
      if (c.x < 0 || c.x >= COLS || c.y < 0 || c.y >= TOTAL_ROWS) return false;
      if (this.board[c.y][c.x] !== null) return false;
    }
    return true;
  }

  private kicksFor(type: PieceType, from: RotationState, to: RotationState): readonly Point[] {
    if (type === 'O') return [{ x: 0, y: 0 }];
    const key = `${from}->${to}`;
    if (type === 'I') return I_KICKS[key] ?? [{ x: 0, y: 0 }];
    return JLSTZ_KICKS[key] ?? [{ x: 0, y: 0 }];
  }

  private spawn(type: PieceType): void {
    const cand: ActivePiece = { type, rotation: 0, x: 3, y: HIDDEN_ROWS - 1 };
    if (!this.fits(cand)) cand.y = HIDDEN_ROWS - 2;
    this.active = cand;
    this.fallTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lowestY = cand.y;
    this.rotatedLast = false;
    this.kickIndex = 0;
    if (!this.fits(cand)) this.over = true;
  }

  private spinKind(): 'none' | 'mini' | 'full' {
    if (!this.active || this.active.type !== 'T' || !this.rotatedLast) return 'none';
    const p = this.active;
    // T center is at (x+1, y+1); corners around it.
    const corners: Point[] = [
      { x: p.x, y: p.y },
      { x: p.x + 2, y: p.y },
      { x: p.x + 2, y: p.y + 2 },
      { x: p.x, y: p.y + 2 },
    ];
    const filled = (pt: Point): boolean => {
      if (pt.x < 0 || pt.x >= COLS || pt.y < 0 || pt.y >= TOTAL_ROWS) return true;
      return this.board[pt.y][pt.x] !== null;
    };
    if (corners.filter(filled).length < 3) return 'none';
    const a = corners[p.rotation];
    const b = corners[(p.rotation + 1) % 4];
    if ((filled(a) && filled(b)) || this.kickIndex === 4) return 'full';
    return 'mini';
  }

  private lock(): void {
    if (!this.active) return;
    const piece = this.active;
    const spin = this.spinKind();
    let visible = false;
    for (const c of this.cellsOf(piece)) {
      if (c.y >= 0 && c.y < TOTAL_ROWS && c.x >= 0 && c.x < COLS) {
        this.board[c.y][c.x] = piece.type;
      }
      if (c.y >= HIDDEN_ROWS) visible = true;
    }
    if (!visible) {
      this.over = true;
      return;
    }
    const cleared = this.clearLines();
    this.applyScore(cleared, spin);
    this.holdLocked = false;
    this.spawn(this.bag.next());
  }

  private clearLines(): number {
    let cleared = 0;
    const kept: CellValue[][] = [];
    for (const row of this.board) {
      if (row.every((c) => c !== null)) cleared++;
      else kept.push(row);
    }
    while (kept.length < TOTAL_ROWS) kept.unshift(Array<CellValue>(COLS).fill(null));
    this.board = kept;
    return cleared;
  }

  private applyScore(cleared: number, spin: 'none' | 'mini' | 'full'): void {
    let base = 0;
    let title = '';
    let difficult = false;
    if (spin === 'full') {
      if (cleared === 0) { base = 400; title = 'T-SPIN'; }
      else if (cleared === 1) { base = 800; title = 'T-SPIN SINGLE'; difficult = true; }
      else if (cleared === 2) { base = 1200; title = 'T-SPIN DOUBLE'; difficult = true; }
      else if (cleared === 3) { base = 1600; title = 'T-SPIN TRIPLE'; difficult = true; }
    } else if (spin === 'mini') {
      if (cleared === 0) { base = 100; title = 'MINI T-SPIN'; }
      else if (cleared === 1) { base = 200; title = 'MINI T-SPIN SINGLE'; difficult = true; }
      else if (cleared === 2) { base = 400; title = 'MINI T-SPIN DOUBLE'; difficult = true; }
    } else {
      if (cleared === 1) { base = 100; title = 'SINGLE'; }
      else if (cleared === 2) { base = 300; title = 'DOUBLE'; }
      else if (cleared === 3) { base = 500; title = 'TRIPLE'; }
      else if (cleared === 4) { base = 800; title = 'TETRIS!'; difficult = true; }
    }
    let points = base * this.level;
    const subs: string[] = [];
    if (cleared > 0) {
      this.combo++;
      if (difficult) {
        if (this.b2b) {
          points = Math.floor(points * 1.5);
          subs.push('BACK-TO-BACK x1.5');
        }
        this.b2b = true;
      } else {
        this.b2b = false;
      }
      if (this.combo > 0) {
        points += 50 * this.combo * this.level;
        subs.push(`COMBO x${this.combo}`);
      }
      this.lines += cleared;
      this.level = Math.floor(this.lines / LINES_PER_LEVEL) + 1;
    } else {
      this.combo = -1;
    }
    if (points > 0) this.addScore(points);
    if (title !== '') {
      this.banner = { title, subtitle: subs.length > 0 ? subs.join(' | ') : undefined, timestamp: Date.now() };
    }
  }

  private addScore(n: number): void {
    this.score += n;
    if (this.score > this.best) this.best = this.score;
  }
}
