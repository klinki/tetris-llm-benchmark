// Canvas rendering: board, ghost piece, hold, next queue and stats.

import {
  CELL,
  CLEAR_ANIM_MS,
  COLS,
  HIDDEN_ROWS,
  NEXT_COUNT,
  PREVIEW_CELL,
  ROWS,
  VISIBLE_ROWS,
} from './constants.js';
import { COLORS, ROTATIONS, type PieceType } from './pieces.js';
import type { Game } from './game.js';

const BOARD_W = COLS * CELL;
const BOARD_H = VISIBLE_ROWS * CELL;
const HOLD_W = 120;
const HOLD_H = 80;
const NEXT_SLOT_H = 66;
const NEXT_W = 120;
const NEXT_H = NEXT_COUNT * NEXT_SLOT_H;

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

function drawBlock(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  size: number,
  color: string,
  ghost = false,
): void {
  const s = size - 2;
  if (ghost) {
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = color;
    ctx.fillRect(px + 1, py + 1, s, s);
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(px + 1.5, py + 1.5, s - 1, s - 1);
    ctx.globalAlpha = 1;
    return;
  }
  ctx.fillStyle = color;
  ctx.fillRect(px + 1, py + 1, s, s);
  ctx.fillStyle = 'rgba(255,255,255,0.32)';
  ctx.fillRect(px + 1, py + 1, s, 3);
  ctx.fillRect(px + 1, py + 1, 3, s);
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.fillRect(px + 1, py + size - 4, s, 3);
  ctx.fillRect(px + size - 4, py + 1, 3, s);
}

// Draws a piece centered at (cx, cy) using its spawn orientation.
function drawPreview(
  ctx: CanvasRenderingContext2D,
  type: PieceType,
  cx: number,
  cy: number,
  cell: number,
  dim = false,
): void {
  const cells = ROTATIONS[type][0];
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [x, y] of cells) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  const ox = cx - ((maxX - minX + 1) * cell) / 2 - minX * cell;
  const oy = cy - ((maxY - minY + 1) * cell) / 2 - minY * cell;
  if (dim) ctx.globalAlpha = 0.35;
  for (const [x, y] of cells) {
    drawBlock(ctx, ox + x * cell, oy + y * cell, cell, COLORS[type]);
  }
  ctx.globalAlpha = 1;
}

export class Renderer {
  private boardCtx: CanvasRenderingContext2D;
  private holdCtx: CanvasRenderingContext2D;
  private nextCtx: CanvasRenderingContext2D;
  private lastScore = -1;
  private lastLevel = -1;
  private lastLines = -1;

  constructor(
    boardCanvas: HTMLCanvasElement,
    holdCanvas: HTMLCanvasElement,
    nextCanvas: HTMLCanvasElement,
    private scoreEl: HTMLElement,
    private levelEl: HTMLElement,
    private linesEl: HTMLElement,
  ) {
    this.boardCtx = setupCanvas(boardCanvas, BOARD_W, BOARD_H);
    this.holdCtx = setupCanvas(holdCanvas, HOLD_W, HOLD_H);
    this.nextCtx = setupCanvas(nextCanvas, NEXT_W, NEXT_H);
  }

  draw(game: Game): void {
    this.drawBoard(game);
    this.drawHold(game);
    this.drawNext(game);
    if (game.score !== this.lastScore) {
      this.scoreEl.textContent = String(game.score);
      this.lastScore = game.score;
    }
    if (game.level !== this.lastLevel) {
      this.levelEl.textContent = String(game.level);
      this.lastLevel = game.level;
    }
    if (game.lines !== this.lastLines) {
      this.linesEl.textContent = String(game.lines);
      this.lastLines = game.lines;
    }
  }

  private drawBoard(game: Game): void {
    const ctx = this.boardCtx;
    ctx.fillStyle = '#0b0f1a';
    ctx.fillRect(0, 0, BOARD_W, BOARD_H);

    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 1; x < COLS; x++) {
      ctx.moveTo(x * CELL + 0.5, 0);
      ctx.lineTo(x * CELL + 0.5, BOARD_H);
    }
    for (let y = 1; y < VISIBLE_ROWS; y++) {
      ctx.moveTo(0, y * CELL + 0.5);
      ctx.lineTo(BOARD_W, y * CELL + 0.5);
    }
    ctx.stroke();

    // Locked stack.
    for (let y = HIDDEN_ROWS; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const cell = game.board[y][x];
        if (cell) drawBlock(ctx, x * CELL, (y - HIDDEN_ROWS) * CELL, CELL, COLORS[cell]);
      }
    }

    // Line-clear flash.
    if (game.state === 'clearing') {
      const alpha = 0.85 * Math.max(0, game.clearTimer / CLEAR_ANIM_MS);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      for (const row of game.clearingRows) {
        ctx.fillRect(0, (row - HIDDEN_ROWS) * CELL, BOARD_W, CELL);
      }
    }

    if (game.state === 'playing') {
      const p = game.current;
      const ghostY = game.ghostY();
      if (ghostY !== p.y) {
        for (const [cx, cy] of ROTATIONS[p.type][p.rot]) {
          const y = ghostY + cy;
          if (y >= HIDDEN_ROWS) {
            drawBlock(ctx, (p.x + cx) * CELL, (y - HIDDEN_ROWS) * CELL, CELL, COLORS[p.type], true);
          }
        }
      }
      for (const [cx, cy] of ROTATIONS[p.type][p.rot]) {
        const y = p.y + cy;
        if (y >= HIDDEN_ROWS) {
          drawBlock(ctx, (p.x + cx) * CELL, (y - HIDDEN_ROWS) * CELL, CELL, COLORS[p.type]);
        }
      }
    }

    // Action message (T-SPIN, TETRIS, PERFECT CLEAR, ...).
    if (game.message && game.messageTimer > 0) {
      const alpha = Math.min(1, game.messageTimer / 300);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = '800 20px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(game.message, BOARD_W / 2, BOARD_H * 0.28);
      ctx.restore();
    }

    if (game.state === 'over') {
      ctx.fillStyle = 'rgba(5,8,15,0.78)';
      ctx.fillRect(0, 0, BOARD_W, BOARD_H);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ff5d5d';
      ctx.font = '800 32px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('GAME OVER', BOARD_W / 2, BOARD_H / 2 - 34);
      ctx.fillStyle = '#e8ecf7';
      ctx.font = '600 17px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(`Score ${game.score}`, BOARD_W / 2, BOARD_H / 2 + 4);
      ctx.fillStyle = '#8b94b3';
      ctx.font = '500 15px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('Press R to restart', BOARD_W / 2, BOARD_H / 2 + 36);
    }
  }

  private drawHold(game: Game): void {
    const ctx = this.holdCtx;
    ctx.clearRect(0, 0, HOLD_W, HOLD_H);
    if (game.hold) {
      drawPreview(ctx, game.hold, HOLD_W / 2, HOLD_H / 2, PREVIEW_CELL, game.holdUsed);
    }
  }

  private drawNext(game: Game): void {
    const ctx = this.nextCtx;
    ctx.clearRect(0, 0, NEXT_W, NEXT_H);
    for (let i = 0; i < NEXT_COUNT && i < game.queue.length; i++) {
      drawPreview(ctx, game.queue[i], NEXT_W / 2, i * NEXT_SLOT_H + NEXT_SLOT_H / 2, PREVIEW_CELL);
    }
  }
}
