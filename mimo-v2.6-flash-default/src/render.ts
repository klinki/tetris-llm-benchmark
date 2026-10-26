import { CELL, COLORS, COLS, HIDDEN_ROWS, NEXT_QUEUE_SIZE, ROWS, VISIBLE_ROWS } from './constants.js';
import type { PieceType } from './constants.js';
import type { Game } from './game.js';
import { SHAPES } from './pieces.js';

const PANEL_X = 20 + COLS * CELL;
const PANEL_WIDTH = 160;
const MINI = CELL / 2; // size of a cell in the hold/next previews
const PREVIEW_W = 120;
const PREVIEW_H = 58;

/** Draws the game state onto a canvas: playfield, ghost, hold, next queue and stats. */
export class Renderer {
  constructor(private ctx: CanvasRenderingContext2D) {
    ctx.canvas.width = PANEL_X + PANEL_WIDTH;
    ctx.canvas.height = CELL * VISIBLE_ROWS + 20;
  }

  render(game: Game): void {
    const ctx = this.ctx;
    ctx.fillStyle = '#14141d';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    this.drawPlayfieldBackground();
    this.drawGridLines();
    this.drawLockedCells(game);
    if (game.current && !game.gameOver) {
      this.drawGhost(game);
      this.drawPiece(game.current.type, game.current.rot, game.current.x, game.current.y);
    }
    this.drawFrame();
    this.drawPanel(game);
    if (game.messageTimer > 0 && !game.gameOver) this.drawMessage(game);
    if (game.gameOver) this.drawGameOver();
  }

  private drawPlayfieldBackground(): void {
    const ctx = this.ctx;
    ctx.fillStyle = '#0b0b12';
    ctx.fillRect(10, 10, COLS * CELL, VISIBLE_ROWS * CELL);
  }

  private drawGridLines(): void {
    const ctx = this.ctx;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 1; x < COLS; x++) {
      ctx.moveTo(10 + x * CELL + 0.5, 10);
      ctx.lineTo(10 + x * CELL + 0.5, 10 + VISIBLE_ROWS * CELL);
    }
    for (let y = 1; y < VISIBLE_ROWS; y++) {
      ctx.moveTo(10, 10 + y * CELL + 0.5);
      ctx.lineTo(10 + COLS * CELL, 10 + y * CELL + 0.5);
    }
    ctx.stroke();
  }

  private drawFrame(): void {
    const ctx = this.ctx;
    ctx.strokeStyle = '#3a4256';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, COLS * CELL, VISIBLE_ROWS * CELL);
  }

  private drawLockedCells(game: Game): void {
    for (let y = HIDDEN_ROWS; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const type = game.board.get(x, y);
        if (type) this.drawCell(10 + x * CELL, 10 + (y - HIDDEN_ROWS) * CELL, type);
      }
    }
  }

  private drawGhost(game: Game): void {
    const p = game.current!;
    const y = game.ghostY();
    if (y === p.y) return;
    for (const [cx, cy] of SHAPES[p.type][p.rot]) {
      const row = y + cy - HIDDEN_ROWS;
      if (row < 0) continue;
      this.drawMiniBlock(10 + (p.x + cx) * CELL, 10 + row * CELL, CELL, p.type, 0.22);
    }
  }

  private drawPiece(type: PieceType, rot: number, x: number, y: number): void {
    for (const [cx, cy] of SHAPES[type][rot]) {
      const row = y + cy - HIDDEN_ROWS;
      if (row < 0) continue;
      this.drawCell(10 + (x + cx) * CELL, 10 + row * CELL, type);
    }
  }

  private drawCell(px: number, py: number, type: PieceType): void {
    this.drawMiniBlock(px, py, CELL, type, 1);
  }

  private drawMiniBlock(px: number, py: number, size: number, type: PieceType, alpha: number): void {
    const ctx = this.ctx;
    const { fill, border } = COLORS[type];
    const gap = Math.max(1, Math.round(size / 12));
    ctx.globalAlpha = alpha;
    ctx.fillStyle = fill;
    ctx.fillRect(px + gap, py + gap, size - gap * 2, size - gap * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fillRect(px + gap, py + gap, size - gap * 2, Math.max(1, (size - gap * 2) / 5));
    ctx.strokeStyle = border;
    ctx.lineWidth = Math.max(1, size / 15);
    ctx.strokeRect(px + gap + 0.5, py + gap + 0.5, size - gap * 2 - 1, size - gap * 2 - 1);
    ctx.globalAlpha = 1;
  }

  private drawPanel(game: Game): void {
    const ctx = this.ctx;
    ctx.font = 'bold 13px monospace';
    ctx.textBaseline = 'top';

    // Hold slot
    ctx.fillStyle = '#8892a8';
    ctx.fillText('HOLD', PANEL_X, 18);
    this.drawPreviewBox(PANEL_X, 36, game.hold, !game.canHold);

    // Next queue
    ctx.fillStyle = '#8892a8';
    ctx.fillText('NEXT', PANEL_X, 116);
    const next = game.peekNext(NEXT_QUEUE_SIZE);
    for (let i = 0; i < next.length; i++) {
      this.drawPreviewPiece(next[i], PANEL_X, 134 + i * (PREVIEW_H + 8));
    }

    // Stats
    let y = 134 + next.length * (PREVIEW_H + 8) + 16;
    y = this.drawStat('SCORE', game.score.toString(), y);
    y = this.drawStat('LEVEL', game.level.toString(), y);
    y = this.drawStat('LINES', game.lines.toString(), y);
    if (game.combo > 0) y = this.drawStat('COMBO', `x${game.combo}`, y);
    if (game.backToBack) y = this.drawStat('B2B', 'x1.5', y);
  }

  private drawStat(label: string, value: string, y: number): number {
    const ctx = this.ctx;
    ctx.fillStyle = '#8892a8';
    ctx.font = '12px monospace';
    ctx.fillText(label, PANEL_X, y);
    ctx.fillStyle = '#e8ecf5';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(value, PANEL_X, y + 15);
    return y + 45;
  }

  private drawPreviewBox(px: number, py: number, type: PieceType | null, dimmed: boolean): void {
    const ctx = this.ctx;
    ctx.fillStyle = '#0b0b12';
    ctx.fillRect(px, py, PREVIEW_W, PREVIEW_H);
    ctx.strokeStyle = '#3a4256';
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 0.5, py + 0.5, PREVIEW_W - 1, PREVIEW_H - 1);
    if (type) {
      if (dimmed) ctx.globalAlpha = 0.35;
      this.drawMiniPiece(type, px, py, PREVIEW_W, PREVIEW_H);
      ctx.globalAlpha = 1;
    }
  }

  private drawPreviewPiece(type: PieceType, px: number, py: number): void {
    const ctx = this.ctx;
    ctx.fillStyle = '#0b0b12';
    ctx.fillRect(px, py, PREVIEW_W, PREVIEW_H);
    ctx.strokeStyle = '#3a4256';
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 0.5, py + 0.5, PREVIEW_W - 1, PREVIEW_H - 1);
    this.drawMiniPiece(type, px, py, PREVIEW_W, PREVIEW_H);
  }

  /** Draws a piece in its spawn orientation, centered inside a preview box. */
  private drawMiniPiece(type: PieceType, px: number, py: number, boxW: number, boxH: number): void {
    const cells = SHAPES[type][0];
    let minX = 9;
    let maxX = -1;
    let minY = 9;
    let maxY = -1;
    for (const [cx, cy] of cells) {
      minX = Math.min(minX, cx);
      maxX = Math.max(maxX, cx);
      minY = Math.min(minY, cy);
      maxY = Math.max(maxY, cy);
    }
    const ox = px + (boxW - (maxX - minX + 1) * MINI) / 2 - minX * MINI;
    const oy = py + (boxH - (maxY - minY + 1) * MINI) / 2 - minY * MINI;
    for (const [cx, cy] of cells) {
      this.drawMiniBlock(ox + cx * MINI, oy + cy * MINI, MINI, type, 1);
    }
  }

  private drawMessage(game: Game): void {
    const ctx = this.ctx;
    const alpha = Math.min(1, game.messageTimer / 0.4);
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'center';
    const text = game.message;
    const width = ctx.measureText(text).width + 24;
    const cx = 10 + (COLS * CELL) / 2;
    const cy = 60;
    ctx.fillStyle = 'rgba(10, 10, 18, 0.85)';
    ctx.fillRect(cx - width / 2, cy - 18, width, 36);
    ctx.strokeStyle = '#f0c040';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - width / 2 + 0.5, cy - 17.5, width - 1, 35);
    ctx.fillStyle = '#ffd85e';
    ctx.fillText(text, cx, cy - 11);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  }

  private drawGameOver(): void {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(8, 8, 14, 0.78)';
    ctx.fillRect(10, 10, COLS * CELL, VISIBLE_ROWS * CELL);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ef3340';
    ctx.font = 'bold 34px monospace';
    ctx.fillText('GAME OVER', 10 + (COLS * CELL) / 2, VISIBLE_ROWS * CELL / 2 - 30);
    ctx.fillStyle = '#e8ecf5';
    ctx.font = '16px monospace';
    ctx.fillText('PRESS R TO RESTART', 10 + (COLS * CELL) / 2, VISIBLE_ROWS * CELL / 2 + 12);
    ctx.textAlign = 'left';
  }
}
