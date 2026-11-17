export const WIDTH = 9;
export const HEIGHT = 18;
export const PREVIEW_COUNT = 3;
export const LINES_PER_LEVEL = 8;
export const LOCK_DELAY_MS = 450;
export const MAX_LOCK_RESETS = 10;

type Offset = readonly [x: number, y: number];
type Shape = {
  name: string;
  size: number;
  cells: readonly Offset[];
};

export const PIECES = {
  bar: { name: "Bar", size: 4, cells: [[0, 1], [1, 1], [2, 1], [3, 1]] },
  elbow: { name: "Elbow", size: 2, cells: [[0, 0], [0, 1], [1, 1]] },
  box: { name: "Box", size: 2, cells: [[0, 0], [1, 0], [0, 1], [1, 1]] },
  cross: { name: "Cross", size: 3, cells: [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]] },
  ridge: { name: "Ridge", size: 3, cells: [[1, 0], [0, 1], [1, 1], [2, 1]] },
  step: { name: "Step", size: 3, cells: [[1, 0], [2, 0], [0, 1], [1, 1]] },
  pocket: { name: "Pocket", size: 3, cells: [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2]] },
} as const satisfies Record<string, Shape>;

export type PieceKind = keyof typeof PIECES;
export type Piece = Readonly<{ kind: PieceKind; x: number; y: number; rotation: number }>;
export type GameStatus = "ready" | "playing" | "paused" | "game-over";
export type Action = "left" | "right" | "clockwise" | "counterclockwise" | "soft-drop" | "hard-drop" | "hold";
type Cell = PieceKind | null;

const KINDS = Object.keys(PIECES) as PieceKind[];
const ROTATIONS = new Map(KINDS.map((kind) => {
  const { size, cells } = PIECES[kind];
  const states: (readonly Offset[])[] = [cells];
  for (let turn = 1; turn < 4; turn++) {
    states.push(states[turn - 1].map(([x, y]) => [size - 1 - y, x]));
  }
  return [kind, states];
}));

const KICKS: readonly Offset[] = [
  [0, 0], [-1, 0], [1, 0], [0, -1], [-2, 0], [2, 0], [-1, -1], [1, -1], [0, -2],
];

export function cellsFor(kind: PieceKind, rotation = 0): readonly Offset[] {
  return ROTATIONS.get(kind)![rotation];
}

export function gravityInterval(level: number): number {
  return Math.max(75, Math.round(850 * 0.82 ** (level - 1)));
}

function emptyRows(count: number): Cell[][] {
  return Array.from({ length: count }, () => Array<Cell>(WIDTH).fill(null));
}

export class Game {
  board: Cell[][] = [];
  active: Piece | null = null;
  held: PieceKind | null = null;
  canHold = true;
  score = 0;
  lines = 0;
  streak = 0;
  status: GameStatus = "ready";

  private queue: PieceKind[] = [];
  private gravityElapsed = 0;
  private lockElapsed = 0;
  private lockResets = 0;

  constructor(private readonly random = Math.random) {
    this.reset();
  }

  get level(): number {
    return 1 + Math.floor(this.lines / LINES_PER_LEVEL);
  }

  get next(): readonly PieceKind[] {
    return this.queue.slice(0, PREVIEW_COUNT);
  }

  get ghost(): Piece | null {
    if (!this.active) return null;
    let landing = this.active;
    while (!this.grounded(landing)) {
      landing = { ...landing, y: landing.y + 1 };
    }
    return landing;
  }

  reset(): void {
    this.board = emptyRows(HEIGHT);
    this.held = null;
    this.canHold = true;
    this.score = 0;
    this.lines = 0;
    this.streak = 0;
    this.status = "ready";
    this.queue = [];
    this.spawn(this.takeNext());
  }

  start(): void {
    if (this.status === "game-over") this.reset();
    this.status = "playing";
  }

  pause(): void {
    if (this.status === "playing") this.status = "paused";
  }

  act(action: Action): boolean {
    const piece = this.active;
    if (this.status !== "playing" || !piece) return false;

    switch (action) {
      case "left":
        return this.adjust({ ...piece, x: piece.x - 1 });
      case "right":
        return this.adjust({ ...piece, x: piece.x + 1 });
      case "clockwise":
        return this.rotate(piece, 1);
      case "counterclockwise":
        return this.rotate(piece, -1);
      case "soft-drop":
        if (this.grounded(piece)) return false;
        this.fall(piece);
        this.score += 1;
        return true;
      case "hard-drop": {
        const landing = this.ghost!;
        this.score += (landing.y - piece.y) * 2;
        this.lock(landing);
        return true;
      }
      case "hold": {
        if (!this.canHold) return false;
        const incoming = this.held ?? this.takeNext();
        this.held = piece.kind;
        this.canHold = false;
        this.spawn(incoming);
        return true;
      }
    }
  }

  advance(elapsedMs: number): boolean {
    if (this.status !== "playing" || !Number.isFinite(elapsedMs) || elapsedMs <= 0) return false;

    let changed = false;
    let remaining = elapsedMs;
    // Spend time up to each event so a fall only starts its lock timer on contact.
    while (this.active && remaining > 0) {
      if (this.grounded(this.active)) {
        const elapsed = Math.min(remaining, LOCK_DELAY_MS - this.lockElapsed);
        this.lockElapsed += elapsed;
        remaining -= elapsed;
        if (this.lockElapsed < LOCK_DELAY_MS) break;
        this.lock(this.active);
      } else {
        const interval = gravityInterval(this.level);
        const elapsed = Math.min(remaining, interval - this.gravityElapsed);
        this.gravityElapsed += elapsed;
        remaining -= elapsed;
        if (this.gravityElapsed < interval) break;
        this.fall(this.active);
      }
      changed = true;
    }
    return changed;
  }

  private fits(piece: Piece): boolean {
    return cellsFor(piece.kind, piece.rotation).every(([dx, dy]) => {
      const x = piece.x + dx;
      const y = piece.y + dy;
      return x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT && this.board[y][x] === null;
    });
  }

  private grounded(piece: Piece): boolean {
    return !this.fits({ ...piece, y: piece.y + 1 });
  }

  private fall(piece: Piece): void {
    this.active = { ...piece, y: piece.y + 1 };
    this.gravityElapsed = 0;
  }

  private adjust(candidate: Piece): boolean {
    if (!this.fits(candidate)) return false;
    if (this.lockResets < MAX_LOCK_RESETS && this.active && this.grounded(this.active)) {
      this.lockElapsed = 0;
      this.lockResets++;
    }
    this.active = candidate;
    return true;
  }

  private rotate(piece: Piece, direction: number): boolean {
    if (piece.kind === "box" || piece.kind === "cross") return false;
    const rotation = (piece.rotation + direction + 4) % 4;
    return KICKS.some(([dx, dy]) => this.adjust({ ...piece, rotation, x: piece.x + dx, y: piece.y + dy }));
  }

  private takeNext(): PieceKind {
    if (this.queue.length <= PREVIEW_COUNT) {
      const bag = [...KINDS];
      for (let index = bag.length - 1; index > 0; index--) {
        const swap = Math.floor(this.random() * (index + 1));
        [bag[index], bag[swap]] = [bag[swap], bag[index]];
      }
      this.queue.push(...bag);
    }
    return this.queue.shift()!;
  }

  private spawn(kind: PieceKind): void {
    const piece: Piece = {
      kind,
      rotation: 0,
      x: Math.floor((WIDTH - PIECES[kind].size) / 2),
      y: 0,
    };
    this.gravityElapsed = 0;
    this.lockElapsed = 0;
    this.lockResets = 0;

    this.active = this.fits(piece) ? piece : null;
    if (!this.active) this.status = "game-over";
  }

  private lock(piece: Piece): void {
    for (const [dx, dy] of cellsFor(piece.kind, piece.rotation)) {
      this.board[piece.y + dy][piece.x + dx] = piece.kind;
    }

    const remaining = this.board.filter((row) => row.includes(null));
    const cleared = HEIGHT - remaining.length;
    if (cleared > 0) {
      this.streak++;
      this.score += (50 * cleared * (cleared + 1) + 75 * (this.streak - 1)) * this.level;
      this.lines += cleared;
      this.board = [...emptyRows(cleared), ...remaining];
    } else {
      this.streak = 0;
    }

    this.canHold = true;
    this.spawn(this.takeNext());
  }
}
