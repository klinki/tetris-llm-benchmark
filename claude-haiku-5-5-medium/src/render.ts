import { BOARD_WIDTH, HIDDEN_ROWS, TOTAL_ROWS } from './constants.js';
import { Game } from './game.js';
import { COLORS, pieceCells } from './pieces.js';
import { ActivePiece, PieceType } from './types.js';

const CELL = 30;
const PREVIEW_CELL = 20;
const PREVIEW_SLOT = 66; // Height of each slot in the next queue, in pixels.

export class Renderer {
  private readonly board = context('board');
  private readonly hold = context('hold');
  private readonly next = context('next');
  private readonly scoreEl = byId('score');
  private readonly levelEl = byId('level');
  private readonly linesEl = byId('lines');
  private readonly overlay = byId('overlay');

  draw(game: Game): void {
    this.drawBoard(game);
    this.drawHold(game);
    this.drawNext(game);
    this.scoreEl.textContent = String(game.score);
    this.levelEl.textContent = String(game.level);
    this.linesEl.textContent = String(game.lines);
    this.overlay.hidden = !game.gameOver;
  }

  private drawBoard(game: Game): void {
    const ctx = this.board;
    ctx.fillStyle = '#0d0d12';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    for (let y = HIDDEN_ROWS; y < TOTAL_ROWS; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        const cell = game.board[y][x];
        if (cell) this.paintCell(ctx, x, y - HIDDEN_ROWS, CELL, COLORS[cell], 1);
      }
    }

    const ghost = game.ghostPiece();
    if (ghost) this.drawPiece(ctx, ghost, 0.25);
    if (game.current) this.drawPiece(ctx, game.current, 1);
  }

  private drawPiece(ctx: CanvasRenderingContext2D, piece: ActivePiece, alpha: number): void {
    for (const { x, y } of pieceCells(piece.type, piece.rotation)) {
      const row = piece.y + y - HIDDEN_ROWS;
      if (row >= 0) this.paintCell(ctx, piece.x + x, row, CELL, COLORS[piece.type], alpha);
    }
  }

  private drawHold(game: Game): void {
    const ctx = this.hold;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    // Dim the held piece while it cannot be swapped this drop.
    this.drawPreview(ctx, game.hold, 0, ctx.canvas.height, game.canHold ? 1 : 0.4);
  }

  private drawNext(game: Game): void {
    const ctx = this.next;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    game.next.forEach((type, i) => this.drawPreview(ctx, type, i * PREVIEW_SLOT, PREVIEW_SLOT, 1));
  }

  // Draws a piece centred in the slot starting at `top`.
  private drawPreview(
    ctx: CanvasRenderingContext2D,
    type: PieceType | null,
    top: number,
    height: number,
    alpha: number,
  ): void {
    if (!type) return;
    const cells = pieceCells(type, 0);
    const minX = Math.min(...cells.map((c) => c.x));
    const maxX = Math.max(...cells.map((c) => c.x));
    const minY = Math.min(...cells.map((c) => c.y));
    const maxY = Math.max(...cells.map((c) => c.y));
    const left = (ctx.canvas.width - (maxX - minX + 1) * PREVIEW_CELL) / 2;
    const bodyTop = top + (height - (maxY - minY + 1) * PREVIEW_CELL) / 2;
    for (const { x, y } of cells) {
      this.paintCell(ctx, x - minX, y - minY, PREVIEW_CELL, COLORS[type], alpha, left, bodyTop);
    }
  }

  // Paints one block at grid position (col, row), offset by (originX, originY) pixels.
  private paintCell(
    ctx: CanvasRenderingContext2D,
    col: number,
    row: number,
    size: number,
    color: string,
    alpha: number,
    originX = 0,
    originY = 0,
  ): void {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(originX + col * size + 1, originY + row * size + 1, size - 2, size - 2);
    ctx.globalAlpha = 1;
  }
}

function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el as T;
}

function context(id: string): CanvasRenderingContext2D {
  const ctx = byId<HTMLCanvasElement>(id).getContext('2d');
  if (!ctx) throw new Error(`Canvas #${id} has no 2D context`);
  return ctx;
}
