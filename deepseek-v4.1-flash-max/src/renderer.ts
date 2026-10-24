import type { Game } from './game.js';
import {
  PIECE_COLORS,
  absoluteCells,
  cellsFor,
  shapeBounds,
  type PieceType,
} from './pieces.js';

const BOARD_PX_WIDTH = 300;
const BOARD_PX_HEIGHT = 600;
const CELL_SIZE = 30;

const HOLD_WIDTH = 120;
const HOLD_HEIGHT = 88;
const NEXT_WIDTH = 120;
const NEXT_HEIGHT = 300;
const NEXT_SLOTS = 5;

interface Effect {
  kind: 'clear' | 'toast';
  rows: number[];
  label: string;
  points: number;
  startedAt: number;
}

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.arcTo(x + width, y, x + width, y + r, r);
  ctx.lineTo(x + width, y + height - r);
  ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
  ctx.lineTo(x + r, y + height);
  ctx.arcTo(x, y + height, x, y + height - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function drawMino(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  alpha = 1,
  glow = false,
): void {
  const inset = Math.max(1, size * 0.055);
  const left = x + inset;
  const top = y + inset;
  const side = size - inset * 2;
  const radius = Math.max(3, size * 0.17);

  ctx.save();
  ctx.globalAlpha = alpha;

  if (glow) {
    ctx.shadowColor = color;
    ctx.shadowBlur = size * 0.45;
  }

  roundedRectPath(ctx, left, top, side, side, radius);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.shadowBlur = 0;

  const gloss = ctx.createLinearGradient(0, top, 0, top + side);
  gloss.addColorStop(0, 'rgba(255,255,255,0.36)');
  gloss.addColorStop(0.42, 'rgba(255,255,255,0.08)');
  gloss.addColorStop(1, 'rgba(2,6,18,0.28)');
  roundedRectPath(ctx, left, top, side, side, radius);
  ctx.fillStyle = gloss;
  ctx.fill();

  roundedRectPath(ctx, left + 0.5, top + 0.5, side - 1, side - 1, radius);
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(left + radius, top + 2);
  ctx.lineTo(left + side - radius, top + 2);
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.34)';
  ctx.stroke();

  ctx.restore();
}

function drawGhostMino(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
): void {
  const inset = Math.max(2, size * 0.1);
  const left = x + inset;
  const top = y + inset;
  const side = size - inset * 2;
  const radius = Math.max(3, size * 0.16);

  ctx.save();
  ctx.globalAlpha = 0.38;
  roundedRectPath(ctx, left, top, side, side, radius);
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.restore();
}

function drawPiecePreview(
  ctx: CanvasRenderingContext2D,
  type: PieceType,
  areaX: number,
  areaY: number,
  areaWidth: number,
  areaHeight: number,
  cellSize: number,
  alpha: number,
): void {
  const bounds = shapeBounds(type, 0);
  const width = (bounds.maxX - bounds.minX + 1) * cellSize;
  const height = (bounds.maxY - bounds.minY + 1) * cellSize;
  const originX = areaX + (areaWidth - width) / 2 - bounds.minX * cellSize;
  const originY = areaY + (areaHeight - height) / 2 - bounds.minY * cellSize;
  const color = PIECE_COLORS[type];

  for (const cell of cellsFor(type, 0)) {
    drawMino(
      ctx,
      originX + cell.x * cellSize,
      originY + cell.y * cellSize,
      cellSize,
      color,
      alpha,
      true,
    );
  }
}

function setupCanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
): CanvasRenderingContext2D {
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is not available in this browser');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

/** Canvas presentation layer. It reads the game model but never mutates it. */
export class Renderer {
  private readonly boardCtx: CanvasRenderingContext2D;
  private readonly holdCtx: CanvasRenderingContext2D;
  private readonly nextCtx: CanvasRenderingContext2D;
  private effects: Effect[] = [];

  constructor(
    boardCanvas: HTMLCanvasElement,
    holdCanvas: HTMLCanvasElement,
    nextCanvas: HTMLCanvasElement,
  ) {
    this.boardCtx = setupCanvas(boardCanvas, BOARD_PX_WIDTH, BOARD_PX_HEIGHT);
    this.holdCtx = setupCanvas(holdCanvas, HOLD_WIDTH, HOLD_HEIGHT);
    this.nextCtx = setupCanvas(nextCanvas, NEXT_WIDTH, NEXT_HEIGHT);
  }

  clearEffects(): void {
    this.effects = [];
  }

  addClearEffect(rows: number[], label: string, points: number): void {
    this.pushEffect({ kind: 'clear', rows, label, points, startedAt: performance.now() });
  }

  addToast(label: string): void {
    this.pushEffect({ kind: 'toast', rows: [], label, points: 0, startedAt: performance.now() });
  }

  render(game: Game, now: number): void {
    this.renderBoard(game, now);
    this.renderHold(game);
    this.renderNext(game);
  }

  private pushEffect(effect: Effect): void {
    this.effects.push(effect);
    if (this.effects.length > 4) this.effects.shift();
  }

  private renderBoard(game: Game, now: number): void {
    const ctx = this.boardCtx;
    ctx.clearRect(0, 0, BOARD_PX_WIDTH, BOARD_PX_HEIGHT);

    const background = ctx.createLinearGradient(0, 0, 0, BOARD_PX_HEIGHT);
    background.addColorStop(0, '#0b1222');
    background.addColorStop(0.55, '#080d18');
    background.addColorStop(1, '#050911');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, BOARD_PX_WIDTH, BOARD_PX_HEIGHT);

    const glow = ctx.createRadialGradient(150, -60, 20, 150, -60, 340);
    glow.addColorStop(0, 'rgba(56,189,248,0.12)');
    glow.addColorStop(1, 'rgba(56,189,248,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, BOARD_PX_WIDTH, 340);

    ctx.strokeStyle = 'rgba(148,163,184,0.055)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 1; x < 10; x++) {
      ctx.moveTo(x * CELL_SIZE + 0.5, 0);
      ctx.lineTo(x * CELL_SIZE + 0.5, BOARD_PX_HEIGHT);
    }
    for (let y = 1; y < 20; y++) {
      ctx.moveTo(0, y * CELL_SIZE + 0.5);
      ctx.lineTo(BOARD_PX_WIDTH, y * CELL_SIZE + 0.5);
    }
    ctx.stroke();

    for (let y = 0; y < game.board.length; y++) {
      const row = game.board[y];
      for (let x = 0; x < row.length; x++) {
        const type = row[x];
        if (type) {
          drawMino(ctx, x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, PIECE_COLORS[type]);
        }
      }
    }

    if (game.active && game.state !== 'gameover') {
      const ghost = game.ghost();
      if (ghost && ghost.y !== game.active.y) {
        for (const cell of absoluteCells(ghost)) {
          drawGhostMino(
            ctx,
            cell.x * CELL_SIZE,
            cell.y * CELL_SIZE,
            CELL_SIZE,
            PIECE_COLORS[ghost.type],
          );
        }
      }
      for (const cell of absoluteCells(game.active)) {
        if (cell.y >= 0) {
          drawMino(
            ctx,
            cell.x * CELL_SIZE,
            cell.y * CELL_SIZE,
            CELL_SIZE,
            PIECE_COLORS[game.active.type],
            1,
            true,
          );
        }
      }
    }

    this.drawEffects(ctx, now);
  }

  private drawEffects(ctx: CanvasRenderingContext2D, now: number): void {
    this.effects = this.effects.filter((effect) => now - effect.startedAt < 1100);

    for (const effect of this.effects) {
      const elapsed = Math.max(0, now - effect.startedAt);

      if (effect.kind === 'clear' && elapsed < 360) {
        const alpha = (1 - elapsed / 360) * 0.58;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#f8fafc';
        for (const row of effect.rows) {
          ctx.fillRect(0, row * CELL_SIZE + 1, BOARD_PX_WIDTH, CELL_SIZE - 2);
        }
        ctx.restore();
      }

      const fadeStart = effect.kind === 'clear' ? 600 : 520;
      const duration = effect.kind === 'clear' ? 1000 : 900;
      if (elapsed >= duration) continue;

      const progress = Math.min(1, elapsed / duration);
      const alpha = elapsed < fadeStart ? 1 : 1 - (elapsed - fadeStart) / (duration - fadeStart);
      const y = effect.kind === 'clear' ? 278 - progress * 16 : 96 - progress * 8;
      const longLabel = effect.label.length > 17;
      const fontSize = effect.kind === 'toast' ? 13 : longLabel ? 14 : effect.label.length > 13 ? 17 : 21;

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `800 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.fillStyle = effect.kind === 'toast' ? '#a5f3fc' : '#f8fafc';
      ctx.shadowColor = effect.kind === 'toast' ? 'rgba(103,232,249,0.85)' : 'rgba(56,189,248,0.9)';
      ctx.shadowBlur = 18;
      ctx.fillText(effect.label, BOARD_PX_WIDTH / 2, y);

      if (effect.kind === 'clear' && effect.points > 0) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(203,213,225,0.9)';
        ctx.font = '700 12px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.fillText(`+${effect.points}`, BOARD_PX_WIDTH / 2, y + 24);
      }
      ctx.restore();
    }
  }

  private renderHold(game: Game): void {
    const ctx = this.holdCtx;
    ctx.clearRect(0, 0, HOLD_WIDTH, HOLD_HEIGHT);
    if (!game.holdType) return;

    drawPiecePreview(
      ctx,
      game.holdType,
      0,
      0,
      HOLD_WIDTH,
      HOLD_HEIGHT,
      17,
      game.canHold ? 1 : 0.3,
    );
  }

  private renderNext(game: Game): void {
    const ctx = this.nextCtx;
    ctx.clearRect(0, 0, NEXT_WIDTH, NEXT_HEIGHT);
    const slotHeight = NEXT_HEIGHT / NEXT_SLOTS;

    for (let index = 0; index < NEXT_SLOTS; index++) {
      const type = game.nextQueue[index];
      if (!type) break;

      const top = index * slotHeight;
      if (index > 0) {
        ctx.strokeStyle = 'rgba(148,163,184,0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(14, top + 0.5);
        ctx.lineTo(NEXT_WIDTH - 14, top + 0.5);
        ctx.stroke();
      }

      drawPiecePreview(ctx, type, 0, top, NEXT_WIDTH, slotHeight, 16, 1 - index * 0.07);
    }
  }
}
