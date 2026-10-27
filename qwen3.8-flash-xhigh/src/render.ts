import { COLS, HIDDEN_ROWS, ROWS, VISIBLE_ROWS } from './core/board.js';
import { Game, NEXT_QUEUE_SIZE } from './core/game.js';
import { COLORS, ROTATIONS, typeForId, type PieceType } from './core/pieces.js';

const CELL = 30;
const FIELD_X = 20;
const FIELD_Y = 20;
const FIELD_W = COLS * CELL;
const FIELD_H = VISIBLE_ROWS * CELL;
const PANEL_X = FIELD_X + FIELD_W + 30;
const PANEL_W = 150;
export const CANVAS_W = PANEL_X + PANEL_W + 20;
export const CANVAS_H = FIELD_Y + FIELD_H + 20;

const BG = '#0b0d16';
const FIELD_BG = '#12141f';
const GRID_LINE = '#1d2130';
const PANEL_BG = '#12141f';
const LABEL = '#7d87a2';
const TEXT = '#e8ecf6';

/** Canvas renderer for the board, ghost, hold and next queue. */
export class Renderer {
  private ctx: CanvasRenderingContext2D;

  constructor(
    private canvas: HTMLCanvasElement,
    private game: Game,
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas is not available');
    this.ctx = ctx;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    canvas.style.width = `${CANVAS_W}px`;
    canvas.style.height = `${CANVAS_H}px`;
    ctx.scale(dpr, dpr);
  }

  draw(): void {
    const { ctx, game } = this;
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    this.drawField();
    this.drawStack();
    if (game.state === 'playing') {
      this.drawGhost();
      this.drawCurrent();
    }
    this.drawPanel();

    if (game.state === 'gameover') this.drawGameOver();
  }

  private drawField(): void {
    const { ctx } = this;
    ctx.fillStyle = FIELD_BG;
    ctx.fillRect(FIELD_X, FIELD_Y, FIELD_W, FIELD_H);
    ctx.strokeStyle = GRID_LINE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 1; x < COLS; x++) {
      ctx.moveTo(FIELD_X + x * CELL + 0.5, FIELD_Y);
      ctx.lineTo(FIELD_X + x * CELL + 0.5, FIELD_Y + FIELD_H);
    }
    for (let y = 1; y < VISIBLE_ROWS; y++) {
      ctx.moveTo(FIELD_X, FIELD_Y + y * CELL + 0.5);
      ctx.lineTo(FIELD_X + FIELD_W, FIELD_Y + y * CELL + 0.5);
    }
    ctx.stroke();
  }

  private drawStack(): void {
    const { game } = this;
    for (let y = HIDDEN_ROWS; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const id = game.board.get(x, y);
        if (id === 0) continue;
        const type = typeForId(id);
        if (type) this.drawBlock(FIELD_X + x * CELL, FIELD_Y + (y - HIDDEN_ROWS) * CELL, CELL, COLORS[type], 1);
      }
    }
  }

  private drawCurrent(): void {
    const g = this.game;
    if (!g.current) return;
    const color = COLORS[g.current.type];
    for (const [cx, cy] of g.cells) {
      const x = g.current.x + cx;
      const y = g.current.y + cy;
      if (y < HIDDEN_ROWS) continue; // clip buffer rows
      this.drawBlock(FIELD_X + x * CELL, FIELD_Y + (y - HIDDEN_ROWS) * CELL, CELL, color, 1);
    }
  }

  private drawGhost(): void {
    const g = this.game;
    const gy = g.ghostY();
    if (gy === g.current.y) return;
    const color = COLORS[g.current.type];
    for (const [cx, cy] of g.cells) {
      const x = g.current.x + cx;
      const y = gy + cy;
      if (y < HIDDEN_ROWS) continue;
      const px = FIELD_X + x * CELL;
      const py = FIELD_Y + (y - HIDDEN_ROWS) * CELL;
      this.drawBlock(px, py, CELL, color, 0.18);
      this.ctx.strokeStyle = color;
      this.ctx.globalAlpha = 0.55;
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(px + 1, py + 1, CELL - 2, CELL - 2);
      this.ctx.globalAlpha = 1;
    }
  }

  /** A single block with a light top-left bevel and dark bottom-right edge. */
  private drawBlock(px: number, py: number, size: number, color: string, alpha: number): void {
    const { ctx } = this;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(px, py, size, size);
    const b = Math.max(2, Math.floor(size / 10));
    ctx.fillStyle = 'rgba(255,255,255,0.30)';
    ctx.fillRect(px, py, size, b);
    ctx.fillRect(px, py, b, size);
    ctx.fillStyle = 'rgba(0,0,0,0.30)';
    ctx.fillRect(px, py + size - b, size, b);
    ctx.fillRect(px + size - b, py, b, size);
    ctx.globalAlpha = 1;
  }

  private drawPanel(): void {
    const { ctx, game } = this;

    // Hold box
    this.label('HOLD', PANEL_X, 12);
    ctx.fillStyle = PANEL_BG;
    ctx.fillRect(PANEL_X, 28, PANEL_W, 84);
    if (game.hold) {
      this.drawPieceIn(game.hold, PANEL_X, 28, PANEL_W, 84, 18, game.canHold ? 1 : 0.4);
    }

    // Stats
    this.label('SCORE', PANEL_X, 132);
    this.value(String(game.score), PANEL_X, 148);
    this.label('LEVEL', PANEL_X, 184);
    this.value(String(game.level), PANEL_X, 200);
    this.label('LINES', PANEL_X, 236);
    this.value(String(game.lines), PANEL_X, 252);

    // Next queue
    this.label('NEXT', PANEL_X, 292);
    const slotH = 62;
    for (let i = 0; i < NEXT_QUEUE_SIZE; i++) {
      const y = 308 + i * slotH;
      ctx.fillStyle = i === 0 ? '#181b2b' : PANEL_BG;
      ctx.fillRect(PANEL_X, y, PANEL_W, slotH - 6);
      const type = game.upcoming[i];
      if (type) this.drawPieceIn(type, PANEL_X, y, PANEL_W, slotH - 6, 14, i === 0 ? 1 : 0.85);
    }

    // Combo / back-to-back indicators
    const statusY = CANVAS_H - 18;
    if (game.comboCount >= 2) {
      this.label(`COMBO ×${game.comboCount - 1}`, PANEL_X, statusY);
    }
    if (game.b2bChain >= 2) {
      this.label(`B2B ×${game.b2bChain - 1}`, PANEL_X + 92, statusY);
    }
  }

  /** Draws a piece (spawn orientation) centered inside a panel rectangle. */
  private drawPieceIn(type: PieceType, x: number, y: number, w: number, h: number, cell: number, alpha: number): void {
    const cells = ROTATIONS[type][0];
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const [cx, cy] of cells) {
      minX = Math.min(minX, cx); maxX = Math.max(maxX, cx);
      minY = Math.min(minY, cy); maxY = Math.max(maxY, cy);
    }
    const bw = maxX - minX + 1;
    const bh = maxY - minY + 1;
    const ox = x + (w - bw * cell) / 2 - minX * cell;
    const oy = y + (h - bh * cell) / 2 - minY * cell;
    for (const [cx, cy] of cells) {
      this.drawBlock(ox + cx * cell, oy + cy * cell, cell, COLORS[type], alpha);
    }
  }

  private drawGameOver(): void {
    const { ctx } = this;
    ctx.fillStyle = 'rgba(5,6,12,0.78)';
    ctx.fillRect(FIELD_X, FIELD_Y, FIELD_W, FIELD_H);
    ctx.fillStyle = TEXT;
    ctx.textAlign = 'center';
    ctx.font = '700 34px ui-sans-serif, system-ui, sans-serif';
    ctx.fillText('GAME OVER', FIELD_X + FIELD_W / 2, FIELD_Y + FIELD_H / 2 - 12);
    ctx.font = '400 16px ui-sans-serif, system-ui, sans-serif';
    ctx.fillStyle = LABEL;
    ctx.fillText('press R to restart', FIELD_X + FIELD_W / 2, FIELD_Y + FIELD_H / 2 + 22);
    ctx.textAlign = 'left';
  }

  private label(text: string, x: number, y: number): void {
    this.ctx.fillStyle = LABEL;
    this.ctx.font = '600 11px ui-sans-serif, system-ui, sans-serif';
    this.ctx.fillText(text, x, y + 10);
  }

  private value(text: string, x: number, y: number): void {
    this.ctx.fillStyle = TEXT;
    this.ctx.font = '700 22px ui-monospace, "SF Mono", Menlo, monospace';
    this.ctx.fillText(text, x, y + 20);
  }
}
