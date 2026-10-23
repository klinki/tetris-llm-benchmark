/**
 * Canvas renderer. Draws the playfield, the ghost piece, the hold and next
 * panels, the stats and the overlays. Everything lives on a single canvas, so
 * the layout is computed in "cells" and scaled to the available space.
 *
 * The two hidden rows above the playfield are drawn as well - marked as the
 * spawn area - so the player can see the piece before it falls into view.
 */

import { COLS, EFFECT_MS, HIDDEN_ROWS, PIECE_COLORS, ROWS } from './constants.js';
import type { Game } from './game.js';
import { formatScore } from './scoring.js';
import { previewBox } from './tetromino.js';
import type { Cell, PieceType } from './types.js';

const COLORS = {
  background: '#0d1020',
  panel: '#161a30',
  panelBorder: '#262c4a',
  grid: '#1c2140',
  gridEdge: '#2c3358',
  spawnZone: 'rgba(255, 255, 255, 0.03)',
  spawnEdge: '#39406b',
  text: '#e6e9f5',
  muted: '#8b93b8',
  accent: '#31c7ef',
  ghost: '#4a5480',
  flash: '#ffffff',
  overlay: 'rgba(9, 11, 22, 0.82)',
};

/** Layout in cells: padding, panels, gaps and the board itself. */
const LAYOUT = {
  padding: 0.6,
  gap: 0.9,
  sidePanel: 5.6,
  header: 2.2,
  footer: 1.8,
  holdHeight: 3,
  nextHeight: 12,
  statsHeight: 9.4,
  minCell: 12,
  maxCell: 36,
};

const TOTAL_COLS = LAYOUT.padding * 2 + LAYOUT.sidePanel * 2 + LAYOUT.gap * 2 + COLS;
const TOTAL_ROWS = LAYOUT.padding * 2 + LAYOUT.header + ROWS + LAYOUT.footer;

export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;
  private cell = 24;
  private scale = 1;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2d canvas context is not available');
    this.ctx = ctx;
    this.resize();
  }

  /** Picks the largest cell size that fits the window and matches the pixels. */
  resize(): void {
    const availableWidth = Math.max(320, window.innerWidth - 24);
    const availableHeight = Math.max(320, window.innerHeight - 24);
    const cell = Math.floor(
      Math.min(availableWidth / TOTAL_COLS, availableHeight / TOTAL_ROWS, LAYOUT.maxCell),
    );
    this.cell = Math.max(LAYOUT.minCell, cell);
    this.scale = Math.min(window.devicePixelRatio || 1, 2);

    const width = Math.ceil(TOTAL_COLS * this.cell);
    const height = Math.ceil(TOTAL_ROWS * this.cell);
    this.canvas.width = Math.floor(width * this.scale);
    this.canvas.height = Math.floor(height * this.scale);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
  }

  render(game: Game): void {
    const ctx = this.ctx;
    const cell = this.cell;

    ctx.clearRect(0, 0, TOTAL_COLS * cell, TOTAL_ROWS * cell);
    this.drawBackground(ctx, cell);
    this.drawBoard(ctx, cell, game);

    const boardX = LAYOUT.padding + LAYOUT.sidePanel + LAYOUT.gap;
    const sideY = LAYOUT.padding + LAYOUT.header;

    this.drawHold(ctx, LAYOUT.padding, sideY, cell, game);
    this.drawStats(ctx, LAYOUT.padding, sideY + LAYOUT.holdHeight + LAYOUT.gap, cell, game);
    this.drawNext(ctx, boardX + COLS + LAYOUT.gap, sideY, cell, game);
    this.drawFooter(ctx, boardX, LAYOUT.padding + LAYOUT.header + ROWS, cell);
    this.drawAnnouncement(ctx, cell, game);

    if (game.state !== 'playing') this.drawOverlay(ctx, cell, game);
  }

  private drawBackground(ctx: CanvasRenderingContext2D, cell: number): void {
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, TOTAL_COLS * cell, TOTAL_ROWS * cell);
  }

  /** Board rectangle of the playfield in pixels, spawn rows included. */
  private boardRect(cell: number): { x: number; y: number; w: number; h: number } {
    const x = (LAYOUT.padding + LAYOUT.sidePanel + LAYOUT.gap) * cell;
    const y = (LAYOUT.padding + LAYOUT.header) * cell;
    return { x, y, w: COLS * cell, h: ROWS * cell };
  }

  private drawBoard(ctx: CanvasRenderingContext2D, cell: number, game: Game): void {
    const rect = this.boardRect(cell);

    ctx.fillStyle = '#10132a';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

    // The two rows above the playfield are the spawn area.
    ctx.fillStyle = COLORS.spawnZone;
    ctx.fillRect(rect.x, rect.y, rect.w, HIDDEN_ROWS * cell);

    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    for (let x = 1; x < COLS; x += 1) {
      const px = rect.x + x * cell + 0.5;
      ctx.beginPath();
      ctx.moveTo(px, rect.y);
      ctx.lineTo(px, rect.y + rect.h);
      ctx.stroke();
    }
    for (let y = 1; y < ROWS; y += 1) {
      const py = rect.y + y * cell + 0.5;
      ctx.beginPath();
      ctx.moveTo(rect.x, py);
      ctx.lineTo(rect.x + rect.w, py);
      ctx.stroke();
    }

    ctx.strokeStyle = COLORS.gridEdge;
    ctx.lineWidth = 2;
    ctx.strokeRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2);

    // Blocks stay inside the board, even for pieces that lock above the field.
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();

    // Ghost piece, drawn under the locked blocks.
    if (game.state === 'playing' && game.current) {
      for (const block of game.ghostCells()) this.drawGhostBlock(ctx, block, cell, rect);
    }

    // Locked blocks.
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        const type = game.playfield.at(x, y);
        if (!type) continue;
        this.drawBlock(
          ctx,
          { x: rect.x + x * cell, y: rect.y + y * cell },
          cell,
          PIECE_COLORS[type],
        );
      }
    }

    // Active piece.
    if (game.current) {
      const piece = game.current;
      for (const block of game.activeCells()) {
        this.drawBlock(
          ctx,
          { x: rect.x + block.x * cell, y: rect.y + block.y * cell },
          cell,
          PIECE_COLORS[piece.type],
        );
      }
      if (game.lockProgress > 0.75) this.drawLockFlash(ctx, rect, cell, game.lockProgress);
    }
    ctx.restore();

    // Line clear flash.
    const clear = game.lastClear;
    if (clear && game.elapsed - clear.at < EFFECT_MS) {
      const progress = (game.elapsed - clear.at) / EFFECT_MS;
      ctx.globalAlpha = Math.max(0, 1 - progress);
      ctx.fillStyle = COLORS.flash;
      for (const row of clear.rows) {
        ctx.fillRect(rect.x, rect.y + row * cell, rect.w, cell);
      }
      ctx.globalAlpha = 1;
    }

    // Top of the spawn area.
    ctx.strokeStyle = COLORS.spawnEdge;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(rect.x, rect.y + HIDDEN_ROWS * cell);
    ctx.lineTo(rect.x + rect.w, rect.y + HIDDEN_ROWS * cell);
    ctx.stroke();
  }

  private drawHold(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    cell: number,
    game: Game,
  ): void {
    this.drawPanel(ctx, x * cell, y * cell, LAYOUT.sidePanel * cell, LAYOUT.holdHeight * cell, 'HOLD');
    if (!game.hold) return;
    const box = previewBox(game.hold);
    const px = (x + (LAYOUT.sidePanel - box.width) / 2) * cell;
    const py = (y + 1 + (LAYOUT.holdHeight - 1 - box.height) / 2) * cell;
    const preview = game.isHoldLocked ? this.dim(PIECE_COLORS[game.hold]) : PIECE_COLORS[game.hold];
    for (const block of box.cells) {
      this.drawBlock(ctx, { x: px + block.x * cell, y: py + block.y * cell }, cell, preview);
    }
  }

  private drawStats(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    cell: number,
    game: Game,
  ): void {
    const h = LAYOUT.statsHeight;
    this.drawPanel(ctx, x * cell, y * cell, LAYOUT.sidePanel * cell, h * cell, null);
    const rows: [string, string][] = [
      ['LINES', String(game.lines)],
      ['LEVEL', String(game.level)],
      ['TIME', formatTime(game.elapsed)],
      ['COMBO', game.combo > 0 ? `${game.combo + 1}x` : '-'],
      ['B2B', game.backToBack ? 'YES' : '-'],
      ['PIECES', String(game.piecesPlaced)],
    ];
    ctx.textBaseline = 'middle';

    // The score gets its own line: it is the longest number on screen.
    this.text(ctx, 'SCORE', (x + 0.5) * cell, (y + 0.95) * cell, cell * 0.55, COLORS.muted, 'left');
    this.text(
      ctx,
      formatScore(game.score),
      (x + 0.5) * cell,
      (y + 1.85) * cell,
      cell * 1.05,
      COLORS.text,
      'left',
    );

    ctx.strokeStyle = COLORS.panelBorder;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo((x + 0.5) * cell, (y + 2.65) * cell);
    ctx.lineTo((x + LAYOUT.sidePanel - 0.5) * cell, (y + 2.65) * cell);
    ctx.stroke();

    const step = (h - 3.1) / rows.length;
    rows.forEach(([label, value], index) => {
      const py = (y + 3.05 + step * index + step / 2) * cell;
      this.text(ctx, label, (x + 0.5) * cell, py, cell * 0.6, COLORS.muted, 'left');
      this.text(ctx, value, (x + LAYOUT.sidePanel - 0.5) * cell, py, cell * 0.7, COLORS.text, 'right');
    });
  }

  private drawNext(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    cell: number,
    game: Game,
  ): void {
    this.drawPanel(ctx, x * cell, y * cell, LAYOUT.sidePanel * cell, LAYOUT.nextHeight * cell, 'NEXT');
    const slot = (LAYOUT.nextHeight - 1.3) / game.next.length;
    game.next.forEach((type: PieceType, index: number) => {
      const box = previewBox(type);
      const centerY = y + 1 + slot * index + slot / 2;
      const px = (x + (LAYOUT.sidePanel - box.width) / 2) * cell;
      const py = (centerY - box.height / 2) * cell;
      for (const block of box.cells) {
        this.drawBlock(ctx, { x: px + block.x * cell, y: py + block.y * cell }, cell, PIECE_COLORS[type]);
      }
    });
  }

  private drawFooter(ctx: CanvasRenderingContext2D, x: number, y: number, cell: number): void {
    this.text(ctx, 'TETRIS', x * cell, (y + LAYOUT.footer / 2) * cell, cell * 1.1, COLORS.muted, 'left');
  }

  /** Announcement of the last clear, drawn across the board while it is fresh. */
  private drawAnnouncement(ctx: CanvasRenderingContext2D, cell: number, game: Game): void {
    const clear = game.lastClear;
    if (!clear || game.state !== 'playing') return;
    const age = game.elapsed - clear.at;
    if (age >= EFFECT_MS) return;

    const rect = this.boardRect(cell);
    const alpha = age < EFFECT_MS * 0.7 ? 1 : (EFFECT_MS - age) / (EFFECT_MS * 0.3);
    const centerX = rect.x + rect.w / 2;
    const centerY = rect.y + rect.h * 0.34;

    ctx.globalAlpha = alpha * 0.85;
    ctx.fillStyle = COLORS.overlay;
    ctx.fillRect(rect.x, centerY - cell * 0.9, rect.w, cell * 2.1);
    ctx.globalAlpha = alpha;
    this.text(ctx, clear.label, centerX, centerY, cell * 0.95, COLORS.accent, 'center');
    this.text(ctx, `+${formatScore(clear.score)}`, centerX, centerY + cell * 0.85, cell * 0.8, COLORS.text, 'center');
    ctx.globalAlpha = 1;
  }

  private drawOverlay(ctx: CanvasRenderingContext2D, cell: number, game: Game): void {
    const rect = this.boardRect(cell);
    ctx.fillStyle = COLORS.overlay;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

    const centerX = rect.x + rect.w / 2;
    const centerY = rect.y + rect.h / 2;
    ctx.textBaseline = 'middle';

    if (game.state === 'paused') {
      this.text(ctx, 'PAUSED', centerX, centerY - cell, cell * 1.6, COLORS.text, 'center');
      this.text(ctx, 'press P to resume', centerX, centerY + cell, cell * 0.8, COLORS.muted, 'center');
      return;
    }

    this.text(ctx, 'GAME OVER', centerX, centerY - cell * 2, cell * 1.5, COLORS.accent, 'center');
    this.text(ctx, `SCORE ${formatScore(game.score)}`, centerX, centerY, cell * 0.95, COLORS.text, 'center');
    this.text(
      ctx,
      `${game.lines} lines · level ${game.level} · ${formatTime(game.elapsed)}`,
      centerX,
      centerY + cell,
      cell * 0.75,
      COLORS.muted,
      'center',
    );
    this.text(ctx, 'press R to restart', centerX, centerY + cell * 2.2, cell * 0.85, COLORS.muted, 'center');
  }

  private drawPanel(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    title: string | null,
  ): void {
    ctx.fillStyle = COLORS.panel;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = COLORS.panelBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    if (title) {
      this.text(
        ctx,
        title,
        x + w / 2,
        y + this.cell * 0.62,
        this.cell * 0.62,
        COLORS.muted,
        'center',
      );
    }
  }

  private drawBlock(
    ctx: CanvasRenderingContext2D,
    at: { x: number; y: number },
    cell: number,
    color: string,
  ): void {
    const inset = Math.max(1, cell * 0.06);
    ctx.fillStyle = color;
    ctx.fillRect(at.x + inset, at.y + inset, cell - inset * 2, cell - inset * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.fillRect(at.x + inset, at.y + inset, cell - inset * 2, Math.max(1, cell * 0.12));
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(at.x + inset + 0.5, at.y + inset + 0.5, cell - inset * 2 - 1, cell - inset * 2 - 1);
  }

  private drawGhostBlock(
    ctx: CanvasRenderingContext2D,
    block: Cell,
    cell: number,
    rect: { x: number; y: number },
  ): void {
    const px = rect.x + block.x * cell;
    const py = rect.y + block.y * cell;
    ctx.strokeStyle = COLORS.ghost;
    ctx.lineWidth = Math.max(1, cell * 0.08);
    ctx.strokeRect(px + cell * 0.12, py + cell * 0.12, cell * 0.76, cell * 0.76);
  }

  private drawLockFlash(
    ctx: CanvasRenderingContext2D,
    rect: { x: number; y: number; w: number; h: number },
    cell: number,
    progress: number,
  ): void {
    ctx.strokeStyle = COLORS.flash;
    ctx.globalAlpha = (progress - 0.75) / 0.25;
    ctx.lineWidth = Math.max(2, cell * 0.16);
    ctx.strokeRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
    ctx.globalAlpha = 1;
  }

  private text(
    ctx: CanvasRenderingContext2D,
    content: string,
    x: number,
    y: number,
    size: number,
    color: string,
    align: CanvasTextAlign,
  ): void {
    ctx.font = `600 ${size}px "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(content, x, y);
  }

  /** Dims a colour, used for the hold slot while it is locked. */
  private dim(color: string): string {
    return `${color}59`;
  }
}

/** Formats milliseconds as m:ss. */
function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}