export const WIDTH = 12;
export const HEIGHT = 22;
export const COLORS = ['#79e4ff', '#ffd080', '#fa8eac', '#b4a2ff', '#a5ec94', '#ff9f76', '#64dcc2'];

type Cell = readonly [number, number];
const shapes: readonly (readonly Cell[])[] = [
  [[0, 0], [1, 0], [0, 1]],
  [[-1, 0], [0, 0], [1, 0], [0, 1], [0, -1]],
  [[-1, -1], [-1, 0], [0, 0], [1, 0], [1, -1]],
  [[-1, 0], [0, 0], [0, 1], [1, 1], [1, 2]],
  [[-1, 0], [0, 0], [1, 0], [-1, 1], [-1, 2]],
  [[-1, 0], [0, 0], [1, 0], [0, 1], [1, 1]],
  [[-1, 0], [0, 0], [1, 0], [0, 1], [0, 2]],
];

export interface Piece { kind: number; x: number; y: number; turn: number }

export function cells({ kind, x, y, turn }: Piece): Cell[] {
  return shapes[kind].map(([dx, dy]) => {
    for (let i = 0; i < turn; i++) [dx, dy] = [-dy, dx];
    return [x + dx, y + dy];
  });
}

export class Game {
  board = Array.from({ length: HEIGHT }, () => Array<number>(WIDTH).fill(0));
  queue: number[] = [];
  active: Piece;
  held: number | null = null;
  canHold = true;
  over = false;
  score = 0;
  lines = 0;
  private fall = 0;
  private lock = 0;
  private resets = 0;

  constructor(private readonly random = Math.random) {
    this.active = this.spawn(this.draw());
  }

  get level() { return 1 + Math.floor(this.lines / 10); }

  private draw() {
    if (this.queue.length < 6) {
      const bag = shapes.map((_, index) => index);
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
      this.queue.push(...bag);
    }
    return this.queue.shift()!;
  }

  private spawn(kind: number): Piece {
    this.fall = this.lock = this.resets = 0;
    const piece = { kind, x: WIDTH / 2 - 1, y: 1, turn: 0 };
    this.over = !this.fits(piece);
    return piece;
  }

  private fits(piece: Piece) {
    return cells(piece).every(([x, y]) =>
      x >= 0 && x < WIDTH && y < HEIGHT && (y < 0 || this.board[y][x] === 0));
  }

  private lower(piece: Piece): Piece { return { ...piece, y: piece.y + 1 }; }

  private adjust(piece: Piece) {
    if (this.over || !this.fits(piece)) return false;
    if (!this.fits(this.lower(this.active)) && this.resets < 15) {
      this.lock = 0;
      this.resets++;
    }
    this.active = piece;
    return true;
  }

  move(dx: number) { return this.adjust({ ...this.active, x: this.active.x + dx }); }

  rotate(direction: 1 | -1) {
    const { x, y, turn } = this.active;
    const offsets = [[0, 0], [-direction, 0], [direction, 0], [0, -1],
      [-2 * direction, 0], [2 * direction, 0], [-direction, -1], [direction, -1], [0, -2]];
    return offsets.some(([dx, dy]) =>
      this.adjust({ ...this.active, x: x + dx, y: y + dy, turn: (turn + direction + 4) % 4 }));
  }

  hold() {
    if (this.over || !this.canHold) return;
    const kind = this.held ?? this.draw();
    this.held = this.active.kind;
    this.active = this.spawn(kind);
    this.canHold = false;
  }

  get ghost() {
    let piece = this.active;
    while (this.fits(this.lower(piece))) piece = this.lower(piece);
    return piece;
  }

  softDrop() {
    if (this.over || !this.fits(this.lower(this.active))) return;
    this.active = this.lower(this.active);
    this.fall = 0;
    this.score++;
  }

  hardDrop() {
    if (this.over) return;
    const ghost = this.ghost;
    this.score += 2 * (ghost.y - this.active.y);
    this.active = ghost;
    this.place();
  }

  advance(ms: number) {
    if (this.over) return;
    const speed = Math.max(0, 0.8 - (this.level - 1) * 0.007);
    const interval = Math.max(50, 1000 * speed ** (this.level - 1));
    while (ms > 0 && !this.over) {
      if (!this.fits(this.lower(this.active))) {
        const elapsed = Math.min(ms, 500 - this.lock);
        this.lock += elapsed;
        ms -= elapsed;
        if (this.lock >= 500) this.place();
      } else {
        const elapsed = Math.min(ms, interval - this.fall);
        this.fall += elapsed;
        ms -= elapsed;
        if (this.fall >= interval) {
          this.active = this.lower(this.active);
          this.fall = 0;
        }
      }
    }
  }

  private place() {
    const occupied = cells(this.active);
    if (occupied.some(([, y]) => y < 0)) {
      this.over = true;
      return;
    }
    for (const [x, y] of occupied) this.board[y][x] = this.active.kind + 1;
    const remaining = this.board.filter(row => row.includes(0));
    const cleared = HEIGHT - remaining.length;
    if (cleared) {
      const points = [0, 100, 300, 500, 800, 1200];
      this.score += points[cleared] * this.level;
      this.lines += cleared;
      this.board = [...Array.from({ length: cleared }, () => Array<number>(WIDTH).fill(0)), ...remaining];
    }
    this.active = this.spawn(this.draw());
    this.canHold = true;
  }
}
