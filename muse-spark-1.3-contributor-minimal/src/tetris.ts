// Pure Guideline Tetris logic (no DOM). Testable headlessly.
export type PieceKind = "I" | "O" | "T" | "S" | "Z" | "J" | "L";
export const COLS = 10, ROWS = 20, HIDDEN = 2;
export const COLORS: Record<PieceKind, string> = {
  I: "#00e5ff", O: "#ffd600", T: "#c651ff", S: "#00e676", Z: "#ff3d5a", J: "#448aff", L: "#ff9100",
};

// SRS spawn states (rotation 0). Coordinates relative to bounding box origin.
const SHAPES: Record<PieceKind, number[][]> = {
  I: [[0,1],[1,1],[2,1],[3,1]],
  O: [[1,0],[2,0],[1,1],[2,1]],
  T: [[1,0],[0,1],[1,1],[2,1]],
  S: [[1,0],[2,0],[0,1],[1,1]],
  Z: [[0,0],[1,0],[1,1],[2,1]],
  J: [[0,0],[0,1],[1,1],[2,1]],
  L: [[2,0],[0,1],[1,1],[2,1]],
};

// Rotate cells within bounding box. I/O use 4x4 box, others 3x3.
function rotateCW(cells: number[][], size: number): number[][] {
  return cells.map(([x, y]) => [size - 1 - y, x]);
}
function rotateCCW(cells: number[][], size: number): number[][] {
  return cells.map(([x, y]) => [y, size - 1 - x]);
}
const BOX: Record<PieceKind, number> = { I: 4, O: 4, T: 3, S: 3, Z: 3, J: 3, L: 3 };

export function cellsFor(kind: PieceKind, rot: number): number[][] {
  let cells = SHAPES[kind].map(c => [...c]);
  const size = BOX[kind];
  // normalize O shape etc into box coords already; rotate rot times
  const r = ((rot % 4) + 4) % 4;
  for (let i = 0; i < r; i++) cells = rotateCW(cells, size);
  if (kind === "O") return SHAPES[kind].map(c => [...c]); // O never changes
  return cells;
}

// SRS kick tables. [from][to direction]: list of [dx,dy]
type Kick = [number, number][];
const JLSTZ_KICKS: Record<string, Kick> = {
  "0>1": [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  "1>0": [[0,0],[1,0],[1,-1],[0,2],[1,2]],
  "1>2": [[0,0],[1,0],[1,-1],[0,2],[1,2]],
  "2>1": [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  "2>3": [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
  "3>2": [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  "3>0": [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  "0>3": [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
};
const I_KICKS: Record<string, Kick> = {
  "0>1": [[0,0],[-2,0],[1,0],[-2,-1],[1,2]],
  "1>0": [[0,0],[2,0],[-1,0],[2,1],[-1,-2]],
  "1>2": [[0,0],[-1,0],[2,0],[-1,2],[2,-1]],
  "2>1": [[0,0],[1,0],[-2,0],[1,-2],[-2,1]],
  "2>3": [[0,0],[2,0],[-1,0],[2,1],[-1,-2]],
  "3>2": [[0,0],[-2,0],[1,0],[-2,-1],[1,2]],
  "3>0": [[0,0],[1,0],[-2,0],[1,-2],[-2,1]],
  "0>3": [[0,0],[-1,0],[2,0],[-1,2],[2,-1]],
};

export function kicksFor(kind: PieceKind, from: number, to: number): Kick {
  if (kind === "O") return [[0, 0]];
  const key = `${from}>${to}`;
  const t = kind === "I" ? I_KICKS : JLSTZ_KICKS;
  return t[key] || [[0, 0]];
}

export function shuffledBag(rand: () => number = Math.random): PieceKind[] {
  const bag: PieceKind[] = ["I", "O", "T", "S", "Z", "J", "L"];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

export interface Active { kind: PieceKind; rot: number; x: number; y: number; }

export class Game {
  grid: (PieceKind | 0)[][] = [];
  queue: PieceKind[] = [];
  holdKind: PieceKind | null = null;
  canHold = true;
  active: Active | null = null;
  score = 0; lines = 0; level = 1; combo = -1;
  over = false;
  lockTimer = 0; grounded = false;
  gravityTimer = 0;
  lockDelay = 500; // ms
  softDrop = false;
  lastMoveWasRotate = false;
  rand: () => number;
  b2b = false;

  constructor(rand: () => number = Math.random) {
    this.rand = rand;
    this.reset();
  }
  reset() {
    this.grid = Array.from({ length: ROWS + HIDDEN }, () => Array(COLS).fill(0));
    this.queue = []; this.refill();
    this.holdKind = null; this.canHold = true;
    this.score = 0; this.lines = 0; this.level = 1; this.combo = -1;
    this.over = false; this.lockTimer = 0; this.grounded = false;
    this.gravityTimer = 0; this.softDrop = false; this.b2b = false;
    this.spawn();
  }
  refill() { while (this.queue.length < 14) this.queue.push(...shuffledBag(this.rand)); }
  collides(cells: number[][], px: number, py: number): boolean {
    for (const [cx, cy] of cells) {
      const x = px + cx, y = py + cy;
      if (x < 0 || x >= COLS || y >= ROWS + HIDDEN) return true;
      if (y >= 0 && this.grid[y][x]) return true;
    }
    return false;
  }
  spawn() {
    this.refill();
    const kind = this.queue.shift()!;
    this.active = { kind, rot: 0, x: kind === "O" ? 3 : 3, y: 0 };
    this.lockTimer = 0; this.grounded = false; this.canHold = this.canHold; this.lastMoveWasRotate = false;
    // hold flag reset on lock, not spawn
    if (this.collides(cellsFor(kind, 0), this.active.x, this.active.y)) {
      this.over = true; this.active = null;
    }
  }
  ghostY(): number {
    if (!this.active) return 0;
    const cells = cellsFor(this.active.kind, this.active.rot);
    let y = this.active.y;
    while (!this.collides(cells, this.active.x, y + 1)) y++;
    return y;
  }
  move(dx: number, dy: number): boolean {
    if (!this.active || this.over) return false;
    const cells = cellsFor(this.active.kind, this.active.rot);
    if (!this.collides(cells, this.active.x + dx, this.active.y + dy)) {
      this.active.x += dx; this.active.y += dy;
      if (dx !== 0) this.lastMoveWasRotate = false;
      if (this.onGround()) { if (dx !== 0 || dy !== 0) this.lockTimer = Math.min(this.lockTimer, this.lockDelay); }
      else this.lockTimer = 0;
      return true;
    }
    return false;
  }
  rotate(dir: 1 | -1): boolean {
    if (!this.active || this.over) return false;
    const a = this.active;
    const to = ((a.rot + dir) % 4 + 4) % 4;
    const cells = cellsFor(a.kind, to);
    for (const [dx, dy] of kicksFor(a.kind, a.rot, to)) {
      // SRS y is up-positive; our y is down-positive so flip dy
      if (!this.collides(cells, a.x + dx, a.y - dy)) {
        a.x += dx; a.y -= dy; a.rot = to;
        this.lastMoveWasRotate = true;
        if (!this.onGround()) this.lockTimer = 0;
        return true;
      }
    }
    return false;
  }
  onGround(): boolean {
    if (!this.active) return false;
    return this.collides(cellsFor(this.active.kind, this.active.rot), this.active.x, this.active.y + 1);
  }
  hardDrop() {
    if (!this.active || this.over) return;
    this.active.y = this.ghostY();
    this.score += 2 * 0; // hard drop points added by caller distance? compute:
    this.lockNow();
    this.score += 0; // distance scoring handled below
  }
  hardDropWithScore() {
    if (!this.active || this.over) return;
    const d = this.ghostY() - this.active.y;
    this.active.y = this.ghostY();
    this.score += d * 2;
    this.lockNow();
  }
  hold() {
    if (!this.active || !this.canHold || this.over) return;
    const cur = this.active.kind;
    if (this.holdKind === null) {
      this.holdKind = cur;
      this.spawn(); // spawn next
    } else {
      const tmp = this.holdKind;
      this.holdKind = cur;
      this.active = { kind: tmp, rot: 0, x: tmp === "O" ? 3 : 3, y: 0 };
      this.lockTimer = 0;
      if (this.collides(cellsFor(tmp, 0), this.active.x, this.active.y)) { this.over = true; this.active = null; }
    }
    this.canHold = false;
  }
  // T-spin detection (3-corner rule, only for T, last action rotate)
  isTSpin(): boolean {
    if (!this.active || this.active.kind !== "T" || !this.lastMoveWasRotate) return false;
    const { x, y } = this.active;
    // T center in 3x3 box = (x+1, y+1)
    const corners: [number, number][] = [[x, y], [x + 2, y], [x, y + 2], [x + 2, y + 2]];
    let occ = 0;
    for (const [cx, cy] of corners) {
      if (cx < 0 || cx >= COLS || cy >= ROWS + HIDDEN) occ++;
      else if (cy >= 0 && this.grid[cy][cx]) occ++;
    }
    return occ >= 3;
  }
  lockNow() {
    if (!this.active) return;
    const a = this.active;
    const cells = cellsFor(a.kind, a.rot);
    const tspin = this.isTSpin();
    for (const [cx, cy] of cells) {
      const x = a.x + cx, y = a.y + cy;
      if (y < 0) { this.over = true; return; }
      this.grid[y][x] = a.kind;
    }
    // clear lines
    const full: number[] = [];
    for (let y = 0; y < ROWS + HIDDEN; y++) if (this.grid[y].every(v => v !== 0)) full.push(y);
    for (const y of full) { this.grid.splice(y, 1); this.grid.unshift(Array(COLS).fill(0)); }
    const n = full.length;
    // scoring (Guideline)
    let gained = 0;
    const isTetris = n === 4;
    if (tspin) {
      const base = [0, 800, 1200, 1600][n] ?? 0;
      gained = base * this.level * (this.b2b ? 1.5 : 1);
      if (n > 0) this.b2b = true;
    } else if (n > 0) {
      const base = [0, 100, 300, 500, 800][n];
      if (isTetris && this.b2b) gained = base * this.level * 1.5;
      else gained = base * this.level;
      this.b2b = isTetris ? true : (n > 0 ? false : this.b2b);
    }
    if (n > 0) { this.combo++; if (this.combo > 0) gained += 50 * this.combo * this.level; }
    else this.combo = -1;
    this.score += Math.floor(gained);
    this.lines += n;
    this.level = Math.floor(this.lines / 10) + 1;
    this.canHold = true;
    this.spawn();
  }
  gravityInterval(): number {
    // Guideline-ish: (0.8 - (level-1)*0.007)^(level-1) seconds
    const t = Math.pow(0.8 - (this.level - 1) * 0.007, this.level - 1);
    return Math.max(16, t * 1000);
  }
  update(dt: number) {
    if (this.over || !this.active) return;
    const interval = this.softDrop ? Math.min(50, this.gravityInterval() / 20) : this.gravityInterval();
    if (this.softDrop && this.move(0, 1)) this.score += 1;
    else {
      this.gravityTimer += dt;
      while (this.gravityTimer >= interval) {
        this.gravityTimer -= interval;
        if (!this.move(0, 1)) break;
      }
    }
    if (this.onGround()) {
      this.lockTimer += dt;
      if (this.lockTimer >= this.lockDelay) this.lockNow();
    } else { this.lockTimer = 0; this.gravityTimer = Math.min(this.gravityTimer, interval); }
  }
}
