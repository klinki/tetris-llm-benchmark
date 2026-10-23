import { ActivePiece, BOARD_WIDTH, Game, HIDDEN_ROWS, VISIBLE_HEIGHT } from './game.js';
import { PIECE_COLORS, pieceCells, PieceType } from './pieces.js';

const CELL = 30;
const PREVIEW_CELL = 20;
const MESSAGE_DURATION_MS = 1500;

export interface HudElements {
  board: HTMLCanvasElement;
  hold: HTMLCanvasElement;
  next: HTMLCanvasElement;
  score: HTMLElement;
  level: HTMLElement;
  lines: HTMLElement;
  message: HTMLElement;
  overlay: HTMLElement;
}

/** Draws the game state to canvases and HUD elements. Reads the game, never mutates it. */
export class Renderer {
  private readonly board: CanvasRenderingContext2D;
  private readonly hold: CanvasRenderingContext2D;
  private readonly next: CanvasRenderingContext2D;

  constructor(private readonly hud: HudElements) {
    this.board = setupCanvas(hud.board, BOARD_WIDTH * CELL, VISIBLE_HEIGHT * CELL);
    this.hold = setupCanvas(hud.hold, 4 * PREVIEW_CELL + 20, 2 * PREVIEW_CELL + 20);
    this.next = setupCanvas(hud.next, 4 * PREVIEW_CELL + 20, 5 * 3 * PREVIEW_CELL + 10);
  }

  render(game: Game): void {
    this.drawBoard(game);
    this.drawPreview(this.hold, game.hold === null ? [] : [game.hold], game.holdUsed);
    this.drawPreview(this.next, game.queue, false);
    this.drawHud(game);
  }

  private drawBoard(game: Game): void {
    const ctx = this.board;
    ctx.fillStyle = '#0b0d17';
    ctx.fillRect(0, 0, BOARD_WIDTH * CELL, VISIBLE_HEIGHT * CELL);

    ctx.strokeStyle = '#1a1e30';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 1; x < BOARD_WIDTH; x++) {
      ctx.moveTo(x * CELL + 0.5, 0);
      ctx.lineTo(x * CELL + 0.5, VISIBLE_HEIGHT * CELL);
    }
    for (let y = 1; y < VISIBLE_HEIGHT; y++) {
      ctx.moveTo(0, y * CELL + 0.5);
      ctx.lineTo(BOARD_WIDTH * CELL, y * CELL + 0.5);
    }
    ctx.stroke();

    for (let y = HIDDEN_ROWS; y < game.board.length; y++) {
      const row = game.board[y];
      for (let x = 0; x < BOARD_WIDTH; x++) {
        const cell = row[x];
        if (cell) drawBlock(ctx, x * CELL, (y - HIDDEN_ROWS) * CELL, CELL, PIECE_COLORS[cell]);
      }
    }

    const active = game.active;
    const ghost = game.ghost();
    if (active && ghost) {
      this.drawPiece(game, ghost, true);
      this.drawPiece(game, active, false);
    }
  }

  private drawPiece(game: Game, piece: ActivePiece, ghost: boolean): void {
    const ctx = this.board;
    const color = PIECE_COLORS[piece.type];
    for (const { x, y } of game.cellsOf(piece)) {
      if (y < HIDDEN_ROWS) continue;
      const px = x * CELL;
      const py = (y - HIDDEN_ROWS) * CELL;
      if (ghost) {
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = color;
        ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
        ctx.globalAlpha = 0.7;
        ctx.strokeStyle = color;
        ctx.strokeRect(px + 1.5, py + 1.5, CELL - 3, CELL - 3);
        ctx.globalAlpha = 1;
      } else {
        drawBlock(ctx, px, py, CELL, color);
      }
    }
  }

  private drawPreview(ctx: CanvasRenderingContext2D, pieces: readonly PieceType[], dimmed: boolean): void {
    const { width, height } = ctx.canvas;
    ctx.clearRect(0, 0, width, height);
    ctx.globalAlpha = dimmed ? 0.3 : 1;
    pieces.forEach((type, index) => {
      const cells = pieceCells(type, 0);
      const minX = Math.min(...cells.map((c) => c.x));
      const maxX = Math.max(...cells.map((c) => c.x));
      const minY = Math.min(...cells.map((c) => c.y));
      const maxY = Math.max(...cells.map((c) => c.y));
      // Center each piece inside a 4x2 slot.
      const offsetX = 10 + ((4 - (maxX - minX + 1)) * PREVIEW_CELL) / 2;
      const offsetY = 10 + index * 3 * PREVIEW_CELL + ((2 - (maxY - minY + 1)) * PREVIEW_CELL) / 2;
      for (const c of cells) {
        drawBlock(
          ctx,
          offsetX + (c.x - minX) * PREVIEW_CELL,
          offsetY + (c.y - minY) * PREVIEW_CELL,
          PREVIEW_CELL,
          PIECE_COLORS[type],
        );
      }
    });
    ctx.globalAlpha = 1;
  }

  private drawHud(game: Game): void {
    const { hud } = this;
    setText(hud.score, game.score.toLocaleString('en-US'));
    setText(hud.level, String(game.level));
    setText(hud.lines, String(game.lines));
    setText(hud.message, game.lastClear && game.lastClearAge < MESSAGE_DURATION_MS ? clearMessage(game) : '');

    let overlay = '';
    if (game.status === 'paused') overlay = 'PAUSED<small>Press Esc or P to resume</small>';
    else if (game.status === 'gameover') overlay = 'GAME OVER<small>Press R to restart</small>';
    if (hud.overlay.innerHTML !== overlay) hud.overlay.innerHTML = overlay;
    hud.overlay.hidden = overlay === '';
  }
}

function clearMessage(game: Game): string {
  const clear = game.lastClear!;
  const parts: string[] = [];
  if (clear.backToBack) parts.push('BACK-TO-BACK');
  if (clear.label) parts.push(clear.label);
  if (clear.combo > 0) parts.push(`COMBO ×${clear.combo}`);
  if (clear.perfectClear) parts.push('PERFECT CLEAR');
  parts.push(`+${clear.points.toLocaleString('en-US')}`);
  return parts.join('\n');
}

function setText(element: HTMLElement, text: string): void {
  if (element.textContent !== text) element.textContent = text;
}

/** Sizes a canvas for crisp rendering on high-DPI screens; drawing uses CSS pixels. */
function setupCanvas(canvas: HTMLCanvasElement, width: number, height: number): CanvasRenderingContext2D {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(ratio, ratio);
  return ctx;
}

function drawBlock(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
  // Simple bevel: light top-left, dark bottom-right.
  const edge = Math.max(2, size / 8);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.fillRect(x + 1, y + 1, size - 2, edge);
  ctx.fillRect(x + 1, y + 1, edge, size - 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillRect(x + 1, y + size - 1 - edge, size - 2, edge);
  ctx.fillRect(x + size - 1 - edge, y + 1, edge, size - 2);
}
