/** Canvas rendering: playfield with ghost piece, hold panel, next queue,
 *  stats and the game-over overlay. Redraws every frame; the board is small
 *  so this stays cheap. */

import { COLS, ROWS, HIDDEN, VISIBLE, CELL, PANEL_CELL, NEXT_COUNT } from './constants.js';
import { COLORS, SHAPES, typeOfId, type PieceType } from './pieces.js';
import type { Game } from './game.js';

export interface StatsElements {
  score: HTMLElement;
  level: HTMLElement;
  lines: HTMLElement;
}

function setupCanvas(canvas: HTMLCanvasElement, w: number, h: number): CanvasRenderingContext2D {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);
  return ctx;
}

/** One block with a simple bevel so the stack reads clearly. */
function block(ctx: CanvasRenderingContext2D, px: number, py: number, size: number, color: string): void {
  const gap = 1;
  const s = size - gap * 2;
  ctx.fillStyle = color;
  ctx.fillRect(px + gap, py + gap, s, s);
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.fillRect(px + gap, py + gap, s, 3);
  ctx.fillRect(px + gap, py + gap, 3, s);
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fillRect(px + gap, py + size - gap - 3, s, 3);
  ctx.fillRect(px + size - gap - 3, py + gap, 3, s);
}

/** Draw a piece centered inside a panel slot of `w` x `h` pixels. */
function drawPieceCentered(
  ctx: CanvasRenderingContext2D, type: PieceType,
  ox: number, oy: number, w: number, h: number, cell: number, dim: boolean,
): void {
  const cells = SHAPES[type][0];
  let minX = 4, maxX = 0, minY = 4, maxY = 0;
  for (const [x, y] of cells) {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  const pw = (maxX - minX + 1) * cell;
  const ph = (maxY - minY + 1) * cell;
  const bx = ox + (w - pw) / 2 - minX * cell;
  const by = oy + (h - ph) / 2 - minY * cell;
  ctx.globalAlpha = dim ? 0.35 : 1;
  for (const [x, y] of cells) {
    block(ctx, bx + x * cell, by + y * cell, cell, COLORS[type]);
  }
  ctx.globalAlpha = 1;
}

export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly holdCtx: CanvasRenderingContext2D;
  private readonly nextCtx: CanvasRenderingContext2D;
  private readonly shown = { score: -1, level: -1, lines: -1 };
  private overShown = false;

  constructor(
    boardCanvas: HTMLCanvasElement,
    holdCanvas: HTMLCanvasElement,
    nextCanvas: HTMLCanvasElement,
    private readonly stats: StatsElements,
    private readonly overlay: HTMLElement,
  ) {
    this.ctx = setupCanvas(boardCanvas, COLS * CELL, VISIBLE * CELL);
    this.holdCtx = setupCanvas(holdCanvas, 4 * PANEL_CELL, 3 * PANEL_CELL);
    this.nextCtx = setupCanvas(nextCanvas, 4 * PANEL_CELL, NEXT_COUNT * 3 * PANEL_CELL);
  }

  draw(game: Game): void {
    this.drawBoard(game);
    this.drawHold(game);
    this.drawNext(game);
    this.drawStats(game);
    this.drawOverlay(game);
  }

  private drawBoard(game: Game): void {
    const ctx = this.ctx;
    const w = COLS * CELL;
    const h = VISIBLE * CELL;
    ctx.fillStyle = '#0b0b14';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 1; x < COLS; x++) {
      ctx.moveTo(x * CELL + 0.5, 0);
      ctx.lineTo(x * CELL + 0.5, h);
    }
    for (let y = 1; y < VISIBLE; y++) {
      ctx.moveTo(0, y * CELL + 0.5);
      ctx.lineTo(w, y * CELL + 0.5);
    }
    ctx.stroke();

    // Locked stack.
    for (let y = HIDDEN; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const id = game.board[y * COLS + x];
        if (id !== 0) block(ctx, x * CELL, (y - HIDDEN) * CELL, CELL, COLORS[typeOfId(id)]);
      }
    }

    const p = game.current;
    if (p !== null && !game.over) {
      // Ghost piece.
      const gy = game.ghostY();
      ctx.globalAlpha = 0.22;
      for (const [cx, cy] of SHAPES[p.type][p.rot]) {
        const y = gy + cy;
        if (y >= HIDDEN) {
          block(ctx, (p.x + cx) * CELL, (y - HIDDEN) * CELL, CELL, COLORS[p.type]);
        }
      }
      ctx.globalAlpha = 1;
      // Active piece.
      for (const [cx, cy] of SHAPES[p.type][p.rot]) {
        const y = p.y + cy;
        if (y >= HIDDEN) {
          block(ctx, (p.x + cx) * CELL, (y - HIDDEN) * CELL, CELL, COLORS[p.type]);
        }
      }
    }

    // Scoring message, fading out.
    if (game.messageTimer > 0 && game.message !== '' && !game.over) {
      ctx.globalAlpha = Math.min(1, game.messageTimer / 500);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(game.message, w / 2, h * 0.3);
      ctx.globalAlpha = 1;
    }
  }

  private drawHold(game: Game): void {
    const ctx = this.holdCtx;
    ctx.clearRect(0, 0, 4 * PANEL_CELL, 3 * PANEL_CELL);
    if (game.hold !== null) {
      drawPieceCentered(ctx, game.hold, 0, 0, 4 * PANEL_CELL, 3 * PANEL_CELL, PANEL_CELL, game.over);
    }
  }

  private drawNext(game: Game): void {
    const ctx = this.nextCtx;
    const slotW = 4 * PANEL_CELL;
    const slotH = 3 * PANEL_CELL;
    ctx.clearRect(0, 0, slotW, NEXT_COUNT * slotH);
    for (let i = 0; i < Math.min(NEXT_COUNT, game.queue.length); i++) {
      drawPieceCentered(ctx, game.queue[i], 0, i * slotH, slotW, slotH, PANEL_CELL, game.over);
    }
  }

  private drawStats(game: Game): void {
    if (game.score !== this.shown.score) {
      this.stats.score.textContent = String(game.score);
      this.shown.score = game.score;
    }
    if (game.level !== this.shown.level) {
      this.stats.level.textContent = String(game.level);
      this.shown.level = game.level;
    }
    if (game.lines !== this.shown.lines) {
      this.stats.lines.textContent = String(game.lines);
      this.shown.lines = game.lines;
    }
  }

  private drawOverlay(game: Game): void {
    if (game.over !== this.overShown) {
      this.overlay.classList.toggle('hidden', !game.over);
      this.overShown = game.over;
    }
  }
}

