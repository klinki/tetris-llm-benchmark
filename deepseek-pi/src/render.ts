import { COLS, VISIBLE } from "./board.js";
import type { Game } from "./game.js";
import { CELLS, COLORS, PIECE_IDS, type PieceType } from "./tetromino.js";

const FIELD_CELL = 30; // CSS px per cell on the main field
const MINI_CELL = 24; // CSS px per cell in the hold/next previews

export class Renderer {
  constructor(
    private readonly field: CanvasRenderingContext2D,
    private readonly next: CanvasRenderingContext2D,
    private readonly hold: CanvasRenderingContext2D
  ) {}

  draw(game: Game): void {
    this.drawField(game);
    this.drawQueue(game);
    this.drawHold(game.hold);
  }

  private drawField(game: Game): void {
    const ctx = this.field;
    const s = FIELD_CELL;
    const w = COLS * s;
    const h = 20 * s;

    ctx.fillStyle = "#0b0b13";
    ctx.fillRect(0, 0, w, h);

    // Subtle grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * s + 0.5, 0);
      ctx.lineTo(x * s + 0.5, h);
      ctx.stroke();
    }
    for (let y = 0; y <= 20; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * s + 0.5);
      ctx.lineTo(w, y * s + 0.5);
      ctx.stroke();
    }

    // Locked cells (hidden rows are not drawn)
    const grid = game.board.grid;
    for (let row = VISIBLE; row < 22; row++) {
      for (let col = 0; col < COLS; col++) {
        const v = grid[row * COLS + col];
        if (v === 0) continue;
        this.fillCell(ctx, col * s, (row - VISIBLE) * s, s, COLORS[PIECE_IDS[v - 1]]);
      }
    }

    const piece = game.active;
    if (!piece) return;
    const color = COLORS[piece.type];

    // Ghost: where the piece would land
    const ghostY = game.ghostY();
    for (const [dx, dy] of CELLS[piece.type][piece.state]) {
      const row = ghostY + dy;
      if (row < VISIBLE) continue;
      this.fillGhostCell(ctx, (piece.x + dx) * s, (row - VISIBLE) * s, s, color);
    }

    // Active piece
    for (const [dx, dy] of CELLS[piece.type][piece.state]) {
      const row = piece.y + dy;
      if (row < VISIBLE) continue;
      this.fillCell(ctx, (piece.x + dx) * s, (row - VISIBLE) * s, s, color);
    }
  }

  private drawQueue(game: Game): void {
    const ctx = this.next;
    const s = MINI_CELL;
    const slot = 4 * s; // one 4x4 frame per slot
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    game.queue.forEach((type, i) => {
      this.drawMini(ctx, type, 0, i * slot, s);
    });
  }

  private drawHold(type: PieceType | null): void {
    const ctx = this.hold;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    if (type) this.drawMini(ctx, type, 0, 0, MINI_CELL);
  }

  private drawMini(
    ctx: CanvasRenderingContext2D,
    type: PieceType,
    ox: number,
    oy: number,
    s: number
  ): void {
    const color = COLORS[type];
    for (const [dx, dy] of CELLS[type][0]) {
      this.fillCell(ctx, ox + dx * s, oy + dy * s, s, color);
    }
  }

  private fillCell(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    s: number,
    color: string
  ): void {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, s, s);
    // Bevel: light top-left, dark bottom-right
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.fillRect(x, y, s, s * 0.16);
    ctx.fillRect(x, y, s * 0.16, s);
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(x, y + s * 0.84, s, s * 0.16);
    ctx.fillRect(x + s * 0.84, y, s * 0.16, s);
  }

  private fillGhostCell(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    s: number,
    color: string
  ): void {
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, s, s);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, s - 2, s - 2);
  }
}
