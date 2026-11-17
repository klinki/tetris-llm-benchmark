import {
  CELL_SIZE,
  HIDDEN_ROWS,
  NEXT_COUNT,
  VISIBLE_ROWS,
  BOARD_WIDTH,
} from './constants.js';
import { PIECES, getCells } from './pieces.js';
import type { Game } from './game.js';
import type { Cell, PieceType } from './types.js';

const PREVIEW_CELL = 24;

function drawCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  ghost = false,
): void {
  ctx.save();
  if (ghost) {
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
  } else {
    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.fillRect(x + 1, y + 1, size - 2, 3);
    ctx.fillRect(x + 1, y + 1, 3, size - 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.fillRect(x + 1, y + size - 4, size - 2, 3);
    ctx.fillRect(x + size - 4, y + 1, 3, size - 2);
  }
  ctx.restore();
}

/** Draw a piece centered within a rectangular preview slot. */
function drawPreview(
  ctx: CanvasRenderingContext2D,
  type: PieceType,
  slotY: number,
  slotHeight: number,
  width: number,
  dimmed = false,
): void {
  const cells: readonly Cell[] = getCells(type, 0);
  const minX = Math.min(...cells.map((c) => c.x));
  const maxX = Math.max(...cells.map((c) => c.x));
  const minY = Math.min(...cells.map((c) => c.y));
  const maxY = Math.max(...cells.map((c) => c.y));
  const pieceWidth = (maxX - minX + 1) * PREVIEW_CELL;
  const pieceHeight = (maxY - minY + 1) * PREVIEW_CELL;
  const originX = (width - pieceWidth) / 2 - minX * PREVIEW_CELL;
  const originY = slotY + (slotHeight - pieceHeight) / 2 - minY * PREVIEW_CELL;
  const color = PIECES[type].color;

  ctx.save();
  if (dimmed) ctx.globalAlpha = 0.35;
  for (const cell of cells) {
    drawCell(ctx, originX + cell.x * PREVIEW_CELL, originY + cell.y * PREVIEW_CELL, PREVIEW_CELL, color);
  }
  ctx.restore();
}

export class Renderer {
  private boardCtx: CanvasRenderingContext2D;
  private nextCtx: CanvasRenderingContext2D;
  private holdCtx: CanvasRenderingContext2D;
  private readonly nextSlot = 72;

  constructor(
    boardCanvas: HTMLCanvasElement,
    nextCanvas: HTMLCanvasElement,
    holdCanvas: HTMLCanvasElement,
    private readonly scoreEl: HTMLElement,
    private readonly levelEl: HTMLElement,
    private readonly linesEl: HTMLElement,
    private readonly overlayEl: HTMLElement,
  ) {
    boardCanvas.width = BOARD_WIDTH * CELL_SIZE;
    boardCanvas.height = VISIBLE_ROWS * CELL_SIZE;
    nextCanvas.width = 120;
    nextCanvas.height = NEXT_COUNT * this.nextSlot;
    holdCanvas.width = 120;
    holdCanvas.height = 96;

    this.boardCtx = boardCanvas.getContext('2d')!;
    this.nextCtx = nextCanvas.getContext('2d')!;
    this.holdCtx = holdCanvas.getContext('2d')!;
  }

  draw(game: Game): void {
    this.drawBoard(game);
    this.drawNext(game);
    this.drawHold(game);

    this.scoreEl.textContent = String(game.score);
    this.levelEl.textContent = String(game.level);
    this.linesEl.textContent = String(game.lines);
    this.overlayEl.style.display = game.gameOver ? 'flex' : 'none';
  }

  private drawBoard(game: Game): void {
    const ctx = this.boardCtx;
    const width = BOARD_WIDTH * CELL_SIZE;
    const height = VISIBLE_ROWS * CELL_SIZE;

    ctx.fillStyle = '#0b1120';
    ctx.fillRect(0, 0, width, height);

    // Subtle grid.
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 1; x < BOARD_WIDTH; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE + 0.5, 0);
      ctx.lineTo(x * CELL_SIZE + 0.5, height);
      ctx.stroke();
    }
    for (let y = 1; y < VISIBLE_ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE + 0.5);
      ctx.lineTo(width, y * CELL_SIZE + 0.5);
      ctx.stroke();
    }

    // Locked cells (only the visible area of the 40-row board).
    for (let row = 0; row < VISIBLE_ROWS; row++) {
      const boardY = HIDDEN_ROWS + row;
      for (let col = 0; col < BOARD_WIDTH; col++) {
        const type = game.board.cells[boardY][col];
        if (type) drawCell(ctx, col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, PIECES[type].color);
      }
    }

    if (!game.current) return;
    const piece = game.current;
    const cells = getCells(piece.type, piece.rotation);
    const color = PIECES[piece.type].color;

    // Ghost piece.
    const ghostY = game.ghostY();
    for (const cell of cells) {
      const boardY = ghostY + cell.y;
      if (boardY >= HIDDEN_ROWS) {
        drawCell(ctx, (piece.x + cell.x) * CELL_SIZE, (boardY - HIDDEN_ROWS) * CELL_SIZE, CELL_SIZE, color, true);
      }
    }

    // Active piece.
    for (const cell of cells) {
      const boardY = piece.y + cell.y;
      if (boardY >= HIDDEN_ROWS) {
        drawCell(ctx, (piece.x + cell.x) * CELL_SIZE, (boardY - HIDDEN_ROWS) * CELL_SIZE, CELL_SIZE, color);
      }
    }
  }

  private drawNext(game: Game): void {
    const ctx = this.nextCtx;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    for (let i = 0; i < NEXT_COUNT; i++) {
      const type = game.nextQueue[i];
      if (type) drawPreview(ctx, type, i * this.nextSlot, this.nextSlot, ctx.canvas.width);
    }
  }

  private drawHold(game: Game): void {
    const ctx = this.holdCtx;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    if (game.holdType) {
      drawPreview(ctx, game.holdType, 0, ctx.canvas.height, ctx.canvas.width, !game.canHold);
    }
  }
}
