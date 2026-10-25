/** The game has no browser dependencies; coordinates increase rightward and downward. */
export const WIDTH = 10;
export const HEIGHT = 20;
export const HIDDEN = 20;
export const LOCK_DELAY = 500;
export const MAX_LOCK_RESETS = 15;
export const TYPES = ["I", "J", "L", "O", "S", "T", "Z"] as const;
export type Kind = (typeof TYPES)[number];
export type Cell = Kind | null;
export type Point = readonly [number, number];
export type Rotation = 0 | 1 | 2 | 3;
export interface Piece {
  kind: Kind;
  rotation: Rotation;
  x: number;
  y: number;
}
export type Status = "ready" | "playing" | "paused" | "over";
export interface ClearEvent {
  id: number;
  lines: number;
  points: number;
  text: string;
}

const SPAWN: Record<Kind, readonly Point[]> = {
  I: [
    [0, 1],
    [1, 1],
    [2, 1],
    [3, 1],
  ],
  J: [
    [0, 0],
    [0, 1],
    [1, 1],
    [2, 1],
  ],
  L: [
    [2, 0],
    [0, 1],
    [1, 1],
    [2, 1],
  ],
  O: [
    [1, 0],
    [2, 0],
    [1, 1],
    [2, 1],
  ],
  S: [
    [1, 0],
    [2, 0],
    [0, 1],
    [1, 1],
  ],
  T: [
    [1, 0],
    [0, 1],
    [1, 1],
    [2, 1],
  ],
  Z: [
    [0, 0],
    [1, 0],
    [1, 1],
    [2, 1],
  ],
};

export function shape(kind: Kind, rotation: Rotation = 0): readonly Point[] {
  if (kind === "O") return SPAWN.O;
  let points = SPAWN[kind];
  const edge = kind === "I" ? 3 : 2;
  for (let r = 0; r < rotation; r++)
    points = points.map(([x, y]) => [edge - y, x] as const);
  return points;
}

// SRS offsets use positive y upward; convert to board coordinates when testing.
const JLSTZ: Record<string, readonly Point[]> = {
  "0>1": [
    [0, 0],
    [-1, 0],
    [-1, 1],
    [0, -2],
    [-1, -2],
  ],
  "1>0": [
    [0, 0],
    [1, 0],
    [1, -1],
    [0, 2],
    [1, 2],
  ],
  "1>2": [
    [0, 0],
    [1, 0],
    [1, -1],
    [0, 2],
    [1, 2],
  ],
  "2>1": [
    [0, 0],
    [-1, 0],
    [-1, 1],
    [0, -2],
    [-1, -2],
  ],
  "2>3": [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, -2],
    [1, -2],
  ],
  "3>2": [
    [0, 0],
    [-1, 0],
    [-1, -1],
    [0, 2],
    [-1, 2],
  ],
  "3>0": [
    [0, 0],
    [-1, 0],
    [-1, -1],
    [0, 2],
    [-1, 2],
  ],
  "0>3": [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, -2],
    [1, -2],
  ],
};
const I_KICKS: Record<string, readonly Point[]> = {
  "0>1": [
    [0, 0],
    [-2, 0],
    [1, 0],
    [-2, -1],
    [1, 2],
  ],
  "1>0": [
    [0, 0],
    [2, 0],
    [-1, 0],
    [2, 1],
    [-1, -2],
  ],
  "1>2": [
    [0, 0],
    [-1, 0],
    [2, 0],
    [-1, 2],
    [2, -1],
  ],
  "2>1": [
    [0, 0],
    [1, 0],
    [-2, 0],
    [1, -2],
    [-2, 1],
  ],
  "2>3": [
    [0, 0],
    [2, 0],
    [-1, 0],
    [2, 1],
    [-1, -2],
  ],
  "3>2": [
    [0, 0],
    [-2, 0],
    [1, 0],
    [-2, -1],
    [1, 2],
  ],
  "3>0": [
    [0, 0],
    [1, 0],
    [-2, 0],
    [1, -2],
    [-2, 1],
  ],
  "0>3": [
    [0, 0],
    [-1, 0],
    [2, 0],
    [-1, 2],
    [2, -1],
  ],
};

export class SevenBag {
  private bag: Kind[] = [];
  constructor(private readonly random: () => number = Math.random) {}
  next(): Kind {
    if (!this.bag.length) {
      this.bag = [...TYPES];
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j]!, this.bag[i]!];
      }
    }
    return this.bag.pop()!;
  }
}

export class Game {
  board: Cell[][] = [];
  active: Piece | null = null;
  queue: Kind[] = [];
  held: Kind | null = null;
  canHold = true;
  status: Status = "ready";
  score = 0;
  lines = 0;
  level = 1;
  combo = -1;
  backToBack = false;
  elapsed = 0;
  pieces = 0;
  lastClear: ClearEvent = { id: 0, lines: 0, points: 0, text: "" };
  private bag: SevenBag;
  private fallTime = 0;
  private lockTime = 0;
  private lockResets = 0;
  private lastRotation: { kick: number } | null = null;

  constructor(private readonly random: () => number = Math.random) {
    this.bag = new SevenBag(random);
    this.restart(false);
  }

  restart(play = true): void {
    this.board = Array.from({ length: HEIGHT + HIDDEN }, () =>
      Array<Cell>(WIDTH).fill(null),
    );
    this.bag = new SevenBag(this.random);
    this.queue = [];
    this.held = null;
    this.canHold = true;
    this.score = this.lines = this.elapsed = this.pieces = 0;
    this.level = 1;
    this.combo = -1;
    this.backToBack = false;
    this.lastClear = {
      id: this.lastClear.id + 1,
      lines: 0,
      points: 0,
      text: "",
    };
    this.status = play ? "playing" : "ready";
    this.refill();
    this.spawn(this.queue.shift()!);
    this.refill();
  }

  start(): void {
    if (this.status === "ready") this.status = "playing";
  }
  pause(): void {
    if (this.status === "playing") this.status = "paused";
    else if (this.status === "paused") this.status = "playing";
  }

  get gravityMs(): number {
    // Guideline level-speed curve; retain a finite interval at very high levels.
    const level = Math.min(this.level, 20);
    return Math.max(1, 1000 * (0.8 - (level - 1) * 0.007) ** (level - 1));
  }

  cell(x: number, y: number): Cell | undefined {
    return this.board[y + HIDDEN]?.[x];
  }
  cells(piece: Piece): Point[] {
    return shape(piece.kind, piece.rotation).map(([x, y]) => [
      piece.x + x,
      piece.y + y,
    ]);
  }
  fits(piece: Piece): boolean {
    return this.cells(piece).every(
      ([x, y]) =>
        x >= 0 &&
        x < WIDTH &&
        y >= -HIDDEN &&
        y < HEIGHT &&
        this.cell(x, y) === null,
    );
  }
  get grounded(): boolean {
    return (
      !!this.active && !this.fits({ ...this.active, y: this.active.y + 1 })
    );
  }
  ghost(): Piece | null {
    if (!this.active) return null;
    const ghost = { ...this.active };
    while (this.fits({ ...ghost, y: ghost.y + 1 })) ghost.y++;
    return ghost;
  }

  move(direction: -1 | 1): boolean {
    if (this.status !== "playing" || !this.active) return false;
    const candidate = { ...this.active, x: this.active.x + direction };
    if (!this.fits(candidate)) return false;
    this.resetLock();
    this.active = candidate;
    this.lastRotation = null;
    return true;
  }

  rotate(direction: -1 | 1): boolean {
    if (this.status !== "playing" || !this.active) return false;
    const piece = this.active;
    const rotation = ((piece.rotation + direction + 4) % 4) as Rotation;
    if (piece.kind === "O") {
      this.resetLock();
      this.active = { ...piece, rotation };
      return true;
    }
    const kicks = (piece.kind === "I" ? I_KICKS : JLSTZ)[
      `${piece.rotation}>${rotation}`
    ]!;
    for (let index = 0; index < kicks.length; index++) {
      const [dx, dy] = kicks[index]!;
      const candidate = {
        ...piece,
        rotation,
        x: piece.x + dx,
        y: piece.y - dy,
      };
      if (this.fits(candidate)) {
        this.resetLock();
        this.active = candidate;
        this.lastRotation = { kick: index };
        return true;
      }
    }
    return false;
  }

  softDrop(): boolean {
    if (this.status !== "playing") return false;
    if (!this.descend()) return false;
    this.score++;
    return true;
  }

  hardDrop(): number {
    if (this.status !== "playing" || !this.active) return 0;
    const ghost = this.ghost()!;
    const distance = ghost.y - this.active.y;
    this.active = ghost;
    if (distance > 0) this.lastRotation = null;
    this.score += distance * 2;
    this.lock();
    return distance;
  }

  hold(): boolean {
    if (this.status !== "playing" || !this.active || !this.canHold)
      return false;
    const previous = this.held;
    this.held = this.active.kind;
    this.spawn(previous ?? this.queue.shift()!);
    this.refill();
    this.canHold = false;
    return true;
  }

  /** Advance to gravity/lock events in order so results do not depend on frame size. */
  update(milliseconds: number, soft = false): void {
    if (
      this.status !== "playing" ||
      !Number.isFinite(milliseconds) ||
      milliseconds <= 0
    )
      return;
    let remaining = milliseconds;
    while (remaining > 0 && this.status === "playing") {
      const interval = soft
        ? Math.min(50, this.gravityMs / 20)
        : this.gravityMs;
      const grounded = this.grounded;
      const step = Math.min(
        remaining,
        Math.max(0, interval - this.fallTime),
        grounded ? Math.max(0, LOCK_DELAY - this.lockTime) : Infinity,
      );
      this.elapsed += step;
      this.fallTime += step;
      if (grounded) this.lockTime += step;
      remaining -= step;
      if (grounded && this.lockTime >= LOCK_DELAY) {
        this.lock();
      } else if (this.fallTime >= interval) {
        this.fallTime = 0;
        if (this.descend() && soft) this.score++;
      }
    }
  }

  private refill(): void {
    while (this.queue.length < 5) this.queue.push(this.bag.next());
  }
  private spawn(kind: Kind): void {
    this.active = { kind, rotation: 0, x: 3, y: -2 };
    this.fallTime = this.lockTime = this.lockResets = 0;
    this.lastRotation = null;
    if (!this.fits(this.active)) {
      this.status = "over";
      return;
    }
    // Enter the visible field immediately if there is room beneath the spawn.
    if (this.fits({ ...this.active, y: -1 })) this.active.y = -1;
  }
  private resetLock(): void {
    if (this.grounded && this.lockResets < MAX_LOCK_RESETS) {
      this.lockTime = 0;
      this.lockResets++;
    }
  }
  private descend(): boolean {
    if (!this.active || !this.fits({ ...this.active, y: this.active.y + 1 }))
      return false;
    this.active.y++;
    this.lastRotation = null;
    return true;
  }
  private spin(): "full" | "mini" | null {
    if (!this.active || this.active.kind !== "T" || !this.lastRotation)
      return null;
    const { x, y, rotation } = this.active;
    const corners = [
      [0, 0],
      [2, 0],
      [2, 2],
      [0, 2],
    ].map(([dx, dy]) => {
      const px = x + dx!,
        py = y + dy!;
      return (
        px < 0 ||
        px >= WIDTH ||
        py >= HEIGHT ||
        py < -HIDDEN ||
        this.cell(px, py) != null
      );
    });
    if (corners.filter(Boolean).length < 3) return null;
    const fronts = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
    ][rotation]!;
    return (corners[fronts[0]!] && corners[fronts[1]!]) ||
      this.lastRotation.kick === 4
      ? "full"
      : "mini";
  }
  private lock(): void {
    if (!this.active) return;
    const cells = this.cells(this.active);
    const spin = this.spin();
    for (const [x, y] of cells) this.board[y + HIDDEN]![x] = this.active.kind;
    const remaining = this.board.filter((row) =>
      row.some((cell) => cell === null),
    );
    const cleared = this.board.length - remaining.length;
    this.board = [
      ...Array.from({ length: cleared }, () => Array<Cell>(WIDTH).fill(null)),
      ...remaining,
    ];
    this.award(cleared, spin);
    this.pieces++;
    this.canHold = true;
    if (cells.every(([, y]) => y < 0)) {
      this.status = "over";
      return;
    }
    this.spawn(this.queue.shift()!);
    this.refill();
  }
  private award(lines: number, spin: "full" | "mini" | null): void {
    const normal = [0, 100, 300, 500, 800];
    const full = [400, 800, 1200, 1600];
    const mini = [100, 200, 400];
    const base =
      (spin === "full" ? full : spin === "mini" ? mini : normal)[lines] ?? 0;
    const difficult = lines > 0 && (lines === 4 || spin !== null);
    const chained = difficult && this.backToBack;
    let points = base * this.level * (chained ? 1.5 : 1);
    if (lines > 0) {
      this.combo++;
      points += 50 * this.combo * this.level;
      this.backToBack = difficult;
    } else this.combo = -1;
    const perfect =
      lines > 0 &&
      this.board.every((row) => row.every((cell) => cell === null));
    if (perfect)
      points +=
        (lines === 4 && chained ? 3200 : [0, 800, 1200, 1800, 2000][lines]!) *
        this.level;
    this.score += points;
    this.lines += lines;
    this.level = 1 + Math.floor(this.lines / 10);
    const names = ["", "Single", "Double", "Triple", "Tetris"];
    const text = [
      chained ? "Back-to-back" : "",
      spin ? `${spin === "mini" ? "Mini " : ""}T-spin` : "",
      names[lines],
      this.combo > 0 ? `${this.combo} combo` : "",
      perfect ? "Perfect clear" : "",
    ]
      .filter(Boolean)
      .join(" · ");
    this.lastClear = { id: this.lastClear.id + 1, lines, points, text };
  }
}
