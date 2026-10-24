import { COLORS, STATES } from './pieces.js';
import { COLS, ROWS } from './board.js';
import type { Game } from './game.js';

const CELL = 30; // main playfield cell size in px
const MINI = 20; // cell size for the hold / next previews
const NEXT_COUNT = 5;

interface Hints {
  score: HTMLElement;
  lines: HTMLElement;
  level: HTMLElement;
  overlay: HTMLElement;
}

/** Canvas renderer: playfield with ghost piece on the left, hold and next previews around it. */
export class Renderer {
  constructor(
    private readonly boardCtx: CanvasRenderingContext2D,
    private readonly holdCtx: CanvasRenderingContext2D,
    private readonly nextCtx: CanvasRenderingContext2D,
    private readonly hud: Hints,
  ) {}

  draw(game: Game): void {
    this.drawPlayfield(game);
    this.drawHold(game);
    this.drawNext(game);
    this.hud.score.textContent = String(game.score);
    this.hud.lines.textContent = String(game.lines);
    this.hud.level.textContent = String(game.level);
    this.hud.overlay.hidden = !game.over;
  }

  private drawPlayfield(game: Game): void {
    const ctx = this.boardCtx;
    clear(ctx, COLS * CELL, ROWS * CELL, '#0d0d16');

    // faint grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.beginPath();
    for (let x = 1; x < COLS; x++) {
      ctx.moveTo(x * CELL + 0.5, 0);
      ctx.lineTo(x * CELL + 0.5, ROWS * CELL);
    }
    for (let y = 1; y < ROWS; y++) {
      ctx.moveTo(0, y * CELL + 0.5);
      ctx.lineTo(COLS * CELL, y * CELL + 0.5);
    }
    ctx.stroke();

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const kind = game.board.grid[y][x];
        if (kind) drawCell(ctx, x * CELL, y * CELL, CELL, COLORS[kind]);
      }
    }

    if (game.piece) {
      const color = COLORS[game.piece.kind];
      // ghost piece: outline where the piece locks if hard dropped
      ctx.strokeStyle = withAlpha(color, 0.45);
      ctx.lineWidth = 2;
      for (const [cx, cy] of game.cells) {
        ctx.strokeRect(game.piece.x * CELL + cx * CELL + 3, game.ghostY * CELL + cy * CELL + 3, CELL - 6, CELL - 6);
      }
      // active piece (cells at y < 0 fall in from above the skyline, clipped by the canvas)
      for (const [cx, cy] of game.cells) {
        drawCell(ctx, (game.piece.x + cx) * CELL, (game.piece.y + cy) * CELL, CELL, color);
      }
    }
  }

  private drawHold(game: Game): void {
    const ctx = this.holdCtx;
    clear(ctx, ctx.canvas.width, ctx.canvas.height, '#0d0d16');
    if (game.holdKind) {
      // dimmed while the hold is not available for this piece yet
      drawShape(ctx, game.holdKind, MINI, ctx.canvas.width, ctx.canvas.height, game.canHold ? 1 : 0.4);
    }
  }

  private drawNext(game: Game): void {
    const ctx = this.nextCtx;
    clear(ctx, ctx.canvas.width, ctx.canvas.height, '#0d0d16');
    const slot = ctx.canvas.height / NEXT_COUNT;
    game.bag.upcoming(NEXT_COUNT).forEach((kind, i) => {
      drawShape(ctx, kind, MINI, ctx.canvas.width, slot, 1, i * slot);
    });
  }
}

function clear(ctx: CanvasRenderingContext2D, width: number, height: number, bg: string): void {
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);
}

function drawCell(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string): void {
  if (y + size <= 0) return; // fully above the skyline
  ctx.fillStyle = color;
  ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'; // top highlight
  ctx.fillRect(x + 1, y + 1, size - 2, 4);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; // bottom shade
  ctx.fillRect(x + 1, y + size - 5, size - 2, 4);
}

function withAlpha(hex: string, alpha: number): string {
  return hex + Math.round(alpha * 255).toString(16).padStart(2, '0');
}

/** Draws a piece centered inside a slot of the given size, optionally dimmed. */
function drawShape(
  ctx: CanvasRenderingContext2D,
  kind: keyof typeof STATES,
  cell: number,
  width: number,
  height: number,
  alpha: number,
  top = 0,
): void {
  const cells = STATES[kind][0];
  const minX = Math.min(...cells.map((c) => c[0]));
  const maxX = Math.max(...cells.map((c) => c[0]));
  const minY = Math.min(...cells.map((c) => c[1]));
  const maxY = Math.max(...cells.map((c) => c[1]));
  const shapeW = (maxX - minX + 1) * cell;
  const shapeH = (maxY - minY + 1) * cell;
  const originX = (width - shapeW) / 2 - minX * cell;
  const originY = top + (height - shapeH) / 2 - minY * cell;
  ctx.globalAlpha = alpha;
  for (const [cx, cy] of cells) drawCell(ctx, originX + cx * cell, originY + cy * cell, cell, COLORS[kind]);
  ctx.globalAlpha = 1;
}
