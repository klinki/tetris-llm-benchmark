import {
  BOARD_WIDTH,
  CELL_SIZE,
  PIECE_COLORS,
  VISIBLE_ROWS,
  BUFFER_ROWS,
} from '../core/constants.js';
import type { Game } from '../core/game.js';
import { getCells } from '../core/pieces.js';
import type { Piece, PieceType } from '../core/types.js';

const BOARD_PIXELS = BOARD_WIDTH * CELL_SIZE;
const BOARD_PIXELS_HEIGHT = VISIBLE_ROWS * CELL_SIZE;
const PANEL_PIXELS = 180;
const MINI_CELL = 20;
const SLOT_SIZE = MINI_CELL * 4;

const BACKGROUND = '#0b0e14';
const GRID_COLOR = '#1b2130';
const BORDER_COLOR = '#2a3346';
const TEXT_COLOR = '#e6edf3';
const MUTED_COLOR = '#8b98ad';

/** Draws the game onto a board canvas and a side panel canvas. */
export class Renderer {
  private readonly boardContext: CanvasRenderingContext2D;
  private readonly panelContext: CanvasRenderingContext2D;

  constructor(boardCanvas: HTMLCanvasElement, panelCanvas: HTMLCanvasElement) {
    this.boardContext = prepareCanvas(boardCanvas, BOARD_PIXELS, BOARD_PIXELS_HEIGHT);
    this.panelContext = prepareCanvas(panelCanvas, PANEL_PIXELS, BOARD_PIXELS_HEIGHT);
  }

  render(game: Game): void {
    this.drawBoard(game);
    this.drawPanel(game);
  }

  private drawBoard(game: Game): void {
    const ctx = this.boardContext;
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, BOARD_PIXELS, BOARD_PIXELS_HEIGHT);

    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 1; x < BOARD_WIDTH; x += 1) {
      ctx.moveTo(x * CELL_SIZE + 0.5, 0);
      ctx.lineTo(x * CELL_SIZE + 0.5, BOARD_PIXELS_HEIGHT);
    }
    for (let y = 1; y < VISIBLE_ROWS; y += 1) {
      ctx.moveTo(0, y * CELL_SIZE + 0.5);
      ctx.lineTo(BOARD_PIXELS, y * CELL_SIZE + 0.5);
    }
    ctx.stroke();

    for (let y = BUFFER_ROWS; y < BUFFER_ROWS + VISIBLE_ROWS; y += 1) {
      for (let x = 0; x < BOARD_WIDTH; x += 1) {
        const type = game.board.cellAt(x, y);
        if (type) this.drawBlock(ctx, x * CELL_SIZE, (y - BUFFER_ROWS) * CELL_SIZE, type);
      }
    }

    const ghost = game.ghost;
    if (ghost && game.current) this.drawPiece(ctx, ghost, true);

    if (game.current) this.drawPiece(ctx, game.current, false);

    ctx.strokeStyle = BORDER_COLOR;
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, BOARD_PIXELS - 2, BOARD_PIXELS_HEIGHT - 2);

    if (game.status !== 'playing') this.drawOverlay(game);
  }

  private drawPiece(ctx: CanvasRenderingContext2D, piece: Piece, ghost: boolean): void {
    const color = PIECE_COLORS[piece.type];
    for (const cell of getCells(piece.type, piece.rotation)) {
      const x = piece.x + cell.x;
      const y = piece.y + cell.y;
      if (y < BUFFER_ROWS || y >= BUFFER_ROWS + VISIBLE_ROWS) continue;

      const px = x * CELL_SIZE;
      const py = (y - BUFFER_ROWS) * CELL_SIZE;
      if (ghost) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4);
      } else {
        this.drawBlock(ctx, px, py, piece.type);
      }
    }
  }

  private drawBlock(ctx: CanvasRenderingContext2D, x: number, y: number, type: PieceType): void {
    ctx.fillStyle = PIECE_COLORS[type];
    ctx.fillRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fillRect(x + 1, y + 1, CELL_SIZE - 2, 3);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.fillRect(x + 1, y + CELL_SIZE - 4, CELL_SIZE - 2, 3);
  }

  private drawOverlay(game: Game): void {
    const ctx = this.boardContext;
    ctx.fillStyle = 'rgba(6, 8, 12, 0.78)';
    ctx.fillRect(0, 0, BOARD_PIXELS, BOARD_PIXELS_HEIGHT);
    ctx.textAlign = 'center';

    ctx.fillStyle = TEXT_COLOR;
    ctx.font = 'bold 30px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(game.status === 'paused' ? 'PAUSED' : 'GAME OVER', BOARD_PIXELS / 2, BOARD_PIXELS_HEIGHT / 2 - 12);

    ctx.fillStyle = MUTED_COLOR;
    ctx.font = '15px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(`Score ${game.score}`, BOARD_PIXELS / 2, BOARD_PIXELS_HEIGHT / 2 + 18);
    ctx.fillText('Press R to restart', BOARD_PIXELS / 2, BOARD_PIXELS_HEIGHT / 2 + 44);
    ctx.textAlign = 'left';
  }

  private drawPanel(game: Game): void {
    const ctx = this.panelContext;
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, PANEL_PIXELS, BOARD_PIXELS_HEIGHT);

    ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = MUTED_COLOR;
    ctx.fillText('HOLD', 16, 24);
    this.drawSlot(ctx, 16, 34);
    if (game.hold) this.drawMiniPiece(ctx, game.hold, 16, 34);

    ctx.fillStyle = MUTED_COLOR;
    ctx.fillText('NEXT', 16, 144);
    game.next.forEach((type, index) => {
      const top = 154 + index * (SLOT_SIZE + 4);
      this.drawSlot(ctx, 16, top);
      this.drawMiniPiece(ctx, type, 16, top);
    });

    this.drawStat(ctx, 'SCORE', String(game.score), 432);
    this.drawStat(ctx, 'LINES', String(game.lines), 486);
    this.drawStat(ctx, 'LEVEL', String(game.level), 540);

    ctx.textAlign = 'right';
    ctx.font = 'bold 13px "Segoe UI", system-ui, sans-serif';
    if (game.combo > 0) {
      ctx.fillStyle = PIECE_COLORS.T;
      ctx.fillText(`COMBO x${game.combo + 1}`, PANEL_PIXELS - 16, 24);
    }
    if (game.b2bStreak >= 2) {
      ctx.fillStyle = PIECE_COLORS.I;
      ctx.fillText(`BACK-TO-BACK x${game.b2bStreak}`, PANEL_PIXELS - 16, 44);
    }
    ctx.textAlign = 'left';
  }

  private drawSlot(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.strokeStyle = BORDER_COLOR;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, SLOT_SIZE - 1, SLOT_SIZE - 1);
  }

  private drawMiniPiece(
    ctx: CanvasRenderingContext2D,
    type: PieceType,
    x: number,
    y: number,
  ): void {
    const cells = getCells(type, 0);
    const columns = Math.max(...cells.map((cell) => cell.x)) + 1;
    const rows = Math.max(...cells.map((cell) => cell.y)) + 1;
    const offsetX = x + ((4 - columns) * MINI_CELL) / 2;
    const offsetY = y + ((4 - rows) * MINI_CELL) / 2;

    for (const cell of cells) {
      const px = offsetX + cell.x * MINI_CELL;
      const py = offsetY + cell.y * MINI_CELL;
      ctx.fillStyle = PIECE_COLORS[type];
      ctx.fillRect(px + 1, py + 1, MINI_CELL - 2, MINI_CELL - 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillRect(px + 1, py + 1, MINI_CELL - 2, 2);
    }
  }

  private drawStat(
    ctx: CanvasRenderingContext2D,
    label: string,
    value: string,
    y: number,
  ): void {
    ctx.fillStyle = MUTED_COLOR;
    ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(label, 16, y);
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = '20px "SFMono-Regular", Consolas, monospace';
    ctx.fillText(value, 16, y + 24);
  }
}

function prepareCanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
): CanvasRenderingContext2D {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('The browser does not support the canvas element.');
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  return context;
}
