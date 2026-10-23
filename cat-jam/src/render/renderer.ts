import { BOARD_WIDTH, BOARD_HEIGHT, BUFFER_ROWS, FIELD_HEIGHT } from '../game/constants.js';
import type { Game } from '../game/game.js';
import { SHAPES, PIECE_COLORS, type PieceType, type Rotation } from '../game/pieces.js';

const CELL = 30;
const MINI_CELL = 24;

/** Draws the board, ghost, active piece and side panels onto canvases. */
export class Renderer {
  private readonly boardCtx: CanvasRenderingContext2D;
  private readonly holdCtx: CanvasRenderingContext2D;
  private readonly nextCtx: CanvasRenderingContext2D;

  constructor(board: HTMLCanvasElement, hold: HTMLCanvasElement, next: HTMLCanvasElement) {
    this.boardCtx = this.context(board);
    this.holdCtx = this.context(hold);
    this.nextCtx = this.context(next);
  }

  private context(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is not available');
    return ctx;
  }

  render(game: Game): void {
    this.drawBoard(game);
    this.drawHold(game.holdPiece);
    this.drawNext(game.nextPieces());
  }

  private drawBoard(game: Game): void {
    const ctx = this.boardCtx;
    const width = BOARD_WIDTH * CELL;
    const height = BOARD_HEIGHT * CELL;

    ctx.fillStyle = '#0b1020';
    ctx.fillRect(0, 0, width, height);
    this.drawGrid(ctx, width, height);

    for (let y = BUFFER_ROWS; y < FIELD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        const type = game.board.get(x, y);
        if (type) this.drawCell(ctx, x * CELL, (y - BUFFER_ROWS) * CELL, CELL, PIECE_COLORS[type]);
      }
    }

    const active = game.active;
    if (active) {
      const originX = active.x * CELL;
      const originY = (active.y - BUFFER_ROWS) * CELL;
      const ghostY = game.ghostY();
      if (ghostY !== active.y) {
        this.drawPiece(ctx, active.type, active.rotation, originX, (ghostY - BUFFER_ROWS) * CELL, CELL, 0.22);
      }
      this.drawPiece(ctx, active.type, active.rotation, originX, originY, CELL, 1);
    }

    if (game.state === 'gameover') this.drawOverlay(ctx, 'GAME OVER', 'Press R to restart');
  }

  private drawHold(type: PieceType | null): void {
    const ctx = this.holdCtx;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    if (!type) return;
    const top = (ctx.canvas.height - this.pieceHeight(type)) / 2;
    this.drawMini(ctx, type, 0, top);
  }

  private drawNext(pieces: PieceType[]): void {
    const ctx = this.nextCtx;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const slot = ctx.canvas.height / 3;
    pieces.slice(0, 3).forEach((type, i) => {
      const top = i * slot + (slot - this.pieceHeight(type)) / 2;
      this.drawMini(ctx, type, 0, top);
    });
  }

  private drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
    ctx.lineWidth = 1;
    for (let x = 1; x < BOARD_WIDTH; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL + 0.5, 0);
      ctx.lineTo(x * CELL + 0.5, height);
      ctx.stroke();
    }
    for (let y = 1; y < BOARD_HEIGHT; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL + 0.5);
      ctx.lineTo(width, y * CELL + 0.5);
      ctx.stroke();
    }
  }

  private pieceHeight(type: PieceType): number {
    let minY = Infinity;
    let maxY = -Infinity;
    for (const [, cy] of SHAPES[type][0]) {
      minY = Math.min(minY, cy);
      maxY = Math.max(maxY, cy);
    }
    return (maxY - minY + 1) * MINI_CELL;
  }

  private drawMini(ctx: CanvasRenderingContext2D, type: PieceType, rotation: Rotation, top: number): void {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const [cx, cy] of SHAPES[type][rotation]) {
      minX = Math.min(minX, cx);
      maxX = Math.max(maxX, cx);
      minY = Math.min(minY, cy);
      maxY = Math.max(maxY, cy);
    }
    const w = (maxX - minX + 1) * MINI_CELL;
    const originX = (ctx.canvas.width - w) / 2 - minX * MINI_CELL;
    const originY = top - minY * MINI_CELL;
    this.drawPiece(ctx, type, rotation, originX, originY, MINI_CELL, 1);
  }

  private drawPiece(
    ctx: CanvasRenderingContext2D,
    type: PieceType,
    rotation: Rotation,
    originX: number,
    originY: number,
    cell: number,
    alpha: number,
  ): void {
    const color = PIECE_COLORS[type];
    ctx.save();
    ctx.globalAlpha = alpha;
    for (const [cx, cy] of SHAPES[type][rotation]) {
      const py = originY + cy * cell;
      if (py < 0) continue;
      this.drawCell(ctx, originX + cx * cell, py, cell, color);
    }
    ctx.restore();
  }

  private drawCell(ctx: CanvasRenderingContext2D, px: number, py: number, size: number, color: string): void {
    ctx.fillStyle = color;
    ctx.fillRect(px + 1, py + 1, size - 2, size - 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.fillRect(px + 1, py + 1, size - 2, 3);
    ctx.fillRect(px + 1, py + 1, 3, size - 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.fillRect(px + 1, py + size - 4, size - 2, 3);
    ctx.fillRect(px + size - 4, py + 1, 3, size - 2);
  }

  private drawOverlay(ctx: CanvasRenderingContext2D, title: string, subtitle: string): void {
    ctx.fillStyle = 'rgba(2, 6, 23, 0.78)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.fillText(title, ctx.canvas.width / 2, ctx.canvas.height / 2 - 8);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '15px system-ui, sans-serif';
    ctx.fillText(subtitle, ctx.canvas.width / 2, ctx.canvas.height / 2 + 24);
  }
}
