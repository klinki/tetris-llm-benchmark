/** Canvas rendering of the playfield, the hold slot and the next queue. */

import { BOARD_WIDTH, FIRST_VISIBLE_ROW, VISIBLE_ROWS } from '../core/constants.js';
import type { Game } from '../core/game.js';
import { PIECES, pieceCells, type PieceType, type Rotation } from '../core/pieces.js';

const CELL = 26;
const PREVIEW_CELL = 16;

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  alpha = 1,
  outlined = false,
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  if (outlined) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    roundRect(ctx, x + 1, y + 1, size - 2, size - 2, 3);
    ctx.stroke();
  } else {
    ctx.fillStyle = color;
    roundRect(ctx, x + 1, y + 1, size - 2, size - 2, 3);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
    roundRect(ctx, x + 3, y + 3, size - 6, (size - 6) / 2, 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPiece(
  ctx: CanvasRenderingContext2D,
  type: PieceType,
  rotation: Rotation,
  originX: number,
  originY: number,
  cell: number,
  alpha = 1,
  outlined = false,
): void {
  const color = PIECES[type].color;
  for (const offset of pieceCells(type, rotation)) {
    drawBlock(ctx, (originX + offset.x) * cell, (originY + offset.y) * cell, cell, color, alpha, outlined);
  }
}

/** Draws a piece centered inside a preview box. */
function drawPreviewPiece(
  ctx: CanvasRenderingContext2D,
  type: PieceType,
  boxX: number,
  boxY: number,
  boxWidth: number,
  cell: number,
): void {
  const cells = pieceCells(type, 0);
  const minX = Math.min(...cells.map((c) => c.x));
  const maxX = Math.max(...cells.map((c) => c.x));
  const minY = Math.min(...cells.map((c) => c.y));
  const maxY = Math.max(...cells.map((c) => c.y));
  const pieceWidth = (maxX - minX + 1) * cell;
  const pieceHeight = (maxY - minY + 1) * cell;
  const originX = boxX + (boxWidth - pieceWidth) / 2;
  const originY = boxY + (cell * 4 - pieceHeight) / 2;
  for (const offset of cells) {
    drawBlock(
      ctx,
      originX + (offset.x - minX) * cell,
      originY + (offset.y - minY) * cell,
      cell,
      PIECES[type].color,
    );
  }
}

export class Renderer {
  private readonly fieldCtx: CanvasRenderingContext2D;
  private readonly holdCtx: CanvasRenderingContext2D;
  private readonly nextCtx: CanvasRenderingContext2D;

  constructor(
    private readonly fieldCanvas: HTMLCanvasElement,
    private readonly holdCanvas: HTMLCanvasElement,
    private readonly nextCanvas: HTMLCanvasElement,
  ) {
    this.fieldCtx = getContext(fieldCanvas);
    this.holdCtx = getContext(holdCanvas);
    this.nextCtx = getContext(nextCanvas);
  }

  render(game: Game): void {
    this.drawField(game);
    this.drawHold(game);
    this.drawNext(game);
  }

  private drawField(game: Game): void {
    const ctx = this.fieldCtx;
    ctx.clearRect(0, 0, this.fieldCanvas.width, this.fieldCanvas.height);

    ctx.fillStyle = '#12141c';
    ctx.fillRect(0, 0, this.fieldCanvas.width, this.fieldCanvas.height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= BOARD_WIDTH; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL + 0.5, 0);
      ctx.lineTo(x * CELL + 0.5, VISIBLE_ROWS * CELL);
      ctx.stroke();
    }
    for (let y = 0; y <= VISIBLE_ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL + 0.5);
      ctx.lineTo(BOARD_WIDTH * CELL, y * CELL + 0.5);
      ctx.stroke();
    }

    // Locked blocks.
    for (let y = FIRST_VISIBLE_ROW; y < game.board.height; y++) {
      for (let x = 0; x < game.board.width; x++) {
        const type = game.board.typeAt(x, y);
        if (!type) continue;
        drawBlock(ctx, x * CELL, (y - FIRST_VISIBLE_ROW) * CELL, CELL, PIECES[type].color);
      }
    }

    const piece = game.current;
    if (piece) {
      // Ghost piece.
      drawPiece(
        ctx,
        piece.type,
        piece.rotation,
        piece.x,
        game.ghostY - FIRST_VISIBLE_ROW,
        CELL,
        0.35,
        true,
      );
      // Active piece.
      drawPiece(ctx, piece.type, piece.rotation, piece.x, piece.y - FIRST_VISIBLE_ROW, CELL);
    }

    if (game.status === 'gameover') {
      this.drawOverlay(ctx, 'GAME OVER', 'Press R to restart');
    } else if (game.status === 'paused') {
      this.drawOverlay(ctx, 'PAUSED', 'Press P to resume');
    } else if (game.status === 'ready') {
      this.drawOverlay(ctx, 'TETRIS', 'Press any key to start');
    }
  }

  private drawOverlay(ctx: CanvasRenderingContext2D, title: string, hint: string): void {
    ctx.save();
    ctx.fillStyle = 'rgba(10, 11, 16, 0.78)';
    ctx.fillRect(0, 0, this.fieldCanvas.width, this.fieldCanvas.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f5f6fa';
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.fillText(title, this.fieldCanvas.width / 2, this.fieldCanvas.height / 2 - 6);
    ctx.font = '15px system-ui, sans-serif';
    ctx.fillStyle = '#9aa3b8';
    ctx.fillText(hint, this.fieldCanvas.width / 2, this.fieldCanvas.height / 2 + 22);
    ctx.restore();
  }

  private drawHold(game: Game): void {
    const ctx = this.holdCtx;
    ctx.clearRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);
    if (!game.hold) return;
    drawPreviewPiece(ctx, game.hold, 0, 0, this.holdCanvas.width, PREVIEW_CELL);
  }

  private drawNext(game: Game): void {
    const ctx = this.nextCtx;
    ctx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
    const queue = game.nextQueue;
    const slotHeight = PREVIEW_CELL * 4 + 4;
    queue.forEach((type, index) => {
      drawPreviewPiece(ctx, type, 0, index * slotHeight, this.nextCanvas.width, PREVIEW_CELL);
    });
  }
}

function getContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext('2d');
  if (!context) throw new Error(`Could not get a 2d context for ${canvas.id}.`);
  return context;
}
