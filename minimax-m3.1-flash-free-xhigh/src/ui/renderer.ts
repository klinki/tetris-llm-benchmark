import { COLS, ROWS } from '../core/constants.js';
import type { Game } from '../core/game.js';
import { PIECES, pieceCells } from '../core/pieces.js';
import type { PieceType } from '../core/types.js';

/** Size of a single cell of the playfield, in pixels. */
const CELL = 30;

/** Size of a single cell of the previews, in pixels. */
const MINI_CELL = 20;

/** Background of the playfield. */
const FIELD_COLOR = '#0b1020';

/** Grid lines of the playfield. */
const GRID_COLOR = 'rgba(148, 163, 184, 0.08)';

/** Draws the playfield, the hold slot and the next queue. */
export class Renderer {
  private readonly field: CanvasRenderingContext2D;
  private readonly hold: CanvasRenderingContext2D;
  private readonly next: CanvasRenderingContext2D;
  private readonly overlay: HTMLElement;
  private readonly overlayTitle: HTMLElement;
  private readonly overlayText: HTMLElement;

  constructor(
    fieldCanvas: HTMLCanvasElement,
    holdCanvas: HTMLCanvasElement,
    nextCanvas: HTMLCanvasElement,
    overlay: HTMLElement,
    overlayTitle: HTMLElement,
    overlayText: HTMLElement,
  ) {
    this.field = context(fieldCanvas);
    this.hold = context(holdCanvas);
    this.next = context(nextCanvas);
    this.overlay = overlay;
    this.overlayTitle = overlayTitle;
    this.overlayText = overlayText;
  }

  /** Draws the whole game. */
  draw(game: Game): void {
    this.drawField(game);
    this.drawHold(game);
    this.drawNext(game);
    this.drawOverlay(game);
  }

  private drawField(game: Game): void {
    const ctx = this.field;
    const width = COLS * CELL;
    const height = ROWS * CELL;

    ctx.fillStyle = FIELD_COLOR;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 1; x < COLS; x++) {
      ctx.moveTo(x * CELL + 0.5, 0);
      ctx.lineTo(x * CELL + 0.5, height);
    }
    for (let y = 1; y < ROWS; y++) {
      ctx.moveTo(0, y * CELL + 0.5);
      ctx.lineTo(width, y * CELL + 0.5);
    }
    ctx.stroke();

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const type = game.board.pieceAt(x, y);
        if (type) {
          drawBlock(ctx, x * CELL, y * CELL, CELL, PIECES[type].color);
        }
      }
    }

    const piece = game.current;
    if (!piece) {
      return;
    }
    const color = PIECES[piece.type].color;
    const ghost = game.ghostY();
    for (const cell of pieceCells(piece.type, piece.rotation)) {
      drawGhost(ctx, (cell.x + piece.x) * CELL, (cell.y + ghost) * CELL, CELL, color);
    }
    for (const cell of pieceCells(piece.type, piece.rotation)) {
      drawBlock(ctx, (cell.x + piece.x) * CELL, (cell.y + piece.y) * CELL, CELL, color);
    }
  }

  private drawHold(game: Game): void {
    const ctx = this.hold;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const type = game.heldPiece;
    if (!type) {
      return;
    }
    drawMiniPiece(ctx, type, ctx.canvas.width / 2, ctx.canvas.height / 2, MINI_CELL);
  }

  private drawNext(game: Game): void {
    const ctx = this.next;
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    ctx.clearRect(0, 0, width, height);
    const slot = height / game.nextQueue.length;
    game.nextQueue.forEach((type, index) => {
      drawMiniPiece(ctx, type, width / 2, slot * (index + 0.5), MINI_CELL);
    });
  }

  private drawOverlay(game: Game): void {
    if (game.status === 'playing') {
      this.overlay.hidden = true;
      return;
    }
    this.overlay.hidden = false;
    if (game.status === 'paused') {
      this.overlayTitle.textContent = 'Paused';
      this.overlayText.textContent = 'Press P to continue';
      return;
    }
    this.overlayTitle.textContent = 'Game over';
    this.overlayText.textContent = `Score ${game.score} — press R to restart`;
  }
}

/** Returns the 2d context of a canvas. */
function context(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('The browser does not support the 2d canvas context');
  }
  return ctx;
}

/** Draws a filled block with a soft highlight. */
function drawBlock(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string): void {
  const padding = 1.5;
  const inner = size - padding * 2;
  ctx.fillStyle = color;
  roundedRect(ctx, x + padding, y + padding, inner, inner, 4);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  roundedRect(ctx, x + padding + 2, y + padding + 2, inner - 4, inner * 0.26, 3);
  ctx.fill();
}

/** Draws the outline of the ghost piece. */
function drawGhost(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string): void {
  const padding = 2;
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 2;
  roundedRect(ctx, x + padding, y + padding, size - padding * 2, size - padding * 2, 4);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/** Draws a piece in its spawn state, centred on the given point. */
function drawMiniPiece(
  ctx: CanvasRenderingContext2D,
  type: PieceType,
  centerX: number,
  centerY: number,
  cell: number,
): void {
  const cells = pieceCells(type, 0);
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const pieceCell of cells) {
    minX = Math.min(minX, pieceCell.x);
    maxX = Math.max(maxX, pieceCell.x);
    minY = Math.min(minY, pieceCell.y);
    maxY = Math.max(maxY, pieceCell.y);
  }
  const offsetX = centerX - ((maxX - minX + 1) * cell) / 2 - minX * cell;
  const offsetY = centerY - ((maxY - minY + 1) * cell) / 2 - minY * cell;
  for (const pieceCell of cells) {
    drawBlock(ctx, offsetX + pieceCell.x * cell, offsetY + pieceCell.y * cell, cell, PIECES[type].color);
  }
}

/** Traces a rounded rectangle, falls back to a plain one. */
function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, width, height, radius);
    return;
  }
  ctx.rect(x, y, width, height);
}
