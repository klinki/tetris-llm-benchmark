import { COLS, HIDDEN_ROWS, VISIBLE_ROWS } from './board.js';
import type { Game } from './game.js';
import { COLORS, pieceCells, type PieceType, type Rotation } from './pieces.js';

const CELL = 30;
const PANEL = 150;
const BOARD_X = PANEL;
export const WIDTH = PANEL + COLS * CELL + PANEL;
export const HEIGHT = VISIBLE_ROWS * CELL;

const PREVIEW_CELL = 22;
const BACKGROUND = '#0b0b14';
const PANEL_TEXT = '#c8c8d8';
const FONT = 'system-ui, sans-serif';

/** Draws the whole game onto a canvas. Reads game state, never changes it. */
export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas is not supported');
    this.ctx = ctx;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = WIDTH * dpr;
    canvas.height = HEIGHT * dpr;
    canvas.style.width = `${WIDTH}px`;
    canvas.style.height = `${HEIGHT}px`;
    ctx.scale(dpr, dpr);
  }

  render(game: Game): void {
    const { ctx } = this;
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    this.drawBoard(game);
    this.drawHold(game);
    this.drawStats(game);
    this.drawNext(game);
    this.drawBanner(game);
    if (game.status === 'paused') this.drawOverlay('PAUSED', 'Press P to resume');
    if (game.status === 'gameover') this.drawOverlay('GAME OVER', 'Press R to restart');
  }

  private drawBoard(game: Game): void {
    const { ctx } = this;
    ctx.fillStyle = '#12121e';
    ctx.fillRect(BOARD_X, 0, COLS * CELL, HEIGHT);

    ctx.strokeStyle = '#1e1e30';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= COLS; x++) {
      ctx.moveTo(BOARD_X + x * CELL + 0.5, 0);
      ctx.lineTo(BOARD_X + x * CELL + 0.5, HEIGHT);
    }
    for (let y = 0; y <= VISIBLE_ROWS; y++) {
      ctx.moveTo(BOARD_X, y * CELL + 0.5);
      ctx.lineTo(BOARD_X + COLS * CELL, y * CELL + 0.5);
    }
    ctx.stroke();

    for (let y = HIDDEN_ROWS; y < HIDDEN_ROWS + VISIBLE_ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const type = game.board.get(x, y);
        if (type) this.drawBlock(BOARD_X + x * CELL, (y - HIDDEN_ROWS) * CELL, CELL, COLORS[type]);
      }
    }

    if (game.status === 'gameover') return;
    const { type, rotation, x, y } = game.current;
    this.drawPieceOnBoard(type, rotation, x, game.ghostY(), true);
    this.drawPieceOnBoard(type, rotation, x, y, false);
  }

  private drawPieceOnBoard(type: PieceType, rotation: Rotation, x: number, y: number, ghost: boolean): void {
    const { ctx } = this;
    for (const [dx, dy] of pieceCells(type, rotation)) {
      const row = y + dy - HIDDEN_ROWS;
      if (row < 0) continue; // still in the hidden spawn area
      const px = BOARD_X + (x + dx) * CELL;
      const py = row * CELL;
      if (ghost) {
        ctx.strokeStyle = COLORS[type];
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 2, py + 2, CELL - 4, CELL - 4);
        ctx.globalAlpha = 1;
      } else {
        this.drawBlock(px, py, CELL, COLORS[type]);
      }
    }
  }

  private drawBlock(x: number, y: number, size: number, color: string): void {
    const { ctx } = this;
    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fillRect(x + 1, y + 1, size - 2, 3);
    ctx.fillRect(x + 1, y + 1, 3, size - 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(x + 1, y + size - 4, size - 2, 3);
    ctx.fillRect(x + size - 4, y + 1, 3, size - 2);
  }

  /** Draws a piece centered in the box whose top-left corner is (boxX, boxY). */
  private drawPreview(type: PieceType, boxX: number, boxY: number, boxW: number, boxH: number): void {
    const cells = pieceCells(type, 0);
    const minX = Math.min(...cells.map(([x]) => x));
    const maxX = Math.max(...cells.map(([x]) => x));
    const minY = Math.min(...cells.map(([, y]) => y));
    const maxY = Math.max(...cells.map(([, y]) => y));
    const left = boxX + (boxW - (maxX - minX + 1) * PREVIEW_CELL) / 2;
    const top = boxY + (boxH - (maxY - minY + 1) * PREVIEW_CELL) / 2;
    for (const [x, y] of cells) {
      this.drawBlock(left + (x - minX) * PREVIEW_CELL, top + (y - minY) * PREVIEW_CELL, PREVIEW_CELL, COLORS[type]);
    }
  }

  private drawLabel(text: string, x: number, y: number): void {
    const { ctx } = this;
    ctx.fillStyle = PANEL_TEXT;
    ctx.font = `bold 14px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(text, x, y);
  }

  private drawHold(game: Game): void {
    this.drawLabel('HOLD', 20, 30);
    if (game.held) this.drawPreview(game.held, 20, 40, PANEL - 40, 80);
  }

  private drawNext(game: Game): void {
    const x = BOARD_X + COLS * CELL + 20;
    this.drawLabel('NEXT', x, 30);
    game.queue.forEach((type, i) => this.drawPreview(type, x, 40 + i * 64, PANEL - 40, 64));
  }

  private drawStats(game: Game): void {
    const { ctx } = this;
    const stats: [string, number][] = [
      ['SCORE', game.score],
      ['LEVEL', game.level],
      ['LINES', game.lines],
    ];
    stats.forEach(([label, value], i) => {
      const y = 180 + i * 70;
      this.drawLabel(label, 20, y);
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold 24px ${FONT}`;
      ctx.fillText(String(value), 20, y + 28);
    });
  }

  private drawBanner(game: Game): void {
    const { ctx } = this;
    ctx.fillStyle = '#ffd34d';
    ctx.font = `bold 14px ${FONT}`;
    ctx.textAlign = 'left';
    game.banner.forEach((line, i) => ctx.fillText(line, 20, 420 + i * 20));
  }

  private drawOverlay(title: string, subtitle: string): void {
    const { ctx } = this;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(BOARD_X, 0, COLS * CELL, HEIGHT);
    const cx = BOARD_X + (COLS * CELL) / 2;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 32px ${FONT}`;
    ctx.fillText(title, cx, HEIGHT / 2 - 8);
    ctx.fillStyle = PANEL_TEXT;
    ctx.font = `16px ${FONT}`;
    ctx.fillText(subtitle, cx, HEIGHT / 2 + 24);
  }
}
