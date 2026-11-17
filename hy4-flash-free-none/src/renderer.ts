import {
  COLS,
  ROWS,
  HIDDEN_ROWS,
  COLORS,
  SHAPE_DEFINITIONS,
  ShapeId,
} from './constants';
import { ActivePiece, CellValue, RenderState } from './types';

const BLOCK = 26;
const BOARD_W = COLS * BLOCK;
const BOARD_H = ROWS * BLOCK;
const PANEL_W = 5 * BLOCK;

/** Canvas-based renderer for the board, hold piece and next queue. */
export class Renderer {
  boardCtx: CanvasRenderingContext2D;
  holdCtx: CanvasRenderingContext2D;
  nextCtx: CanvasRenderingContext2D;

  constructor(board: HTMLCanvasElement, hold: HTMLCanvasElement, next: HTMLCanvasElement) {
    this.boardCtx = this.setupCanvas(board, BOARD_W, BOARD_H);
    this.holdCtx = this.setupCanvas(hold, PANEL_W, 2 * BLOCK);
    this.nextCtx = this.setupCanvas(next, PANEL_W, 5 * BLOCK);
  }

  private setupCanvas(canvas: HTMLCanvasElement, width: number, height: number): CanvasRenderingContext2D {
    // Scale for high-DPI displays while keeping a fixed logical resolution.
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    return ctx;
  }

  /** Render the full game state. */
  render(state: RenderState): void {
    this.renderBoard(state);
    this.renderHold(state.hold, state.canHold);
    this.renderNext(state.next);
    this.renderStats(state);

    if (state.gameOver) {
      const ctx = this.boardCtx;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, BOARD_W, BOARD_H);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', BOARD_W / 2, BOARD_H / 2 - 10);
      ctx.font = '16px sans-serif';
      ctx.fillText('Press R to restart', BOARD_W / 2, BOARD_H / 2 + 24);
    }
  }

  private renderBoard(state: RenderState): void {
    const ctx = this.boardCtx;
    ctx.clearRect(0, 0, BOARD_W, BOARD_H);
    ctx.fillStyle = '#0b0b14';
    ctx.fillRect(0, 0, BOARD_W, BOARD_H);

    // Subtle grid lines.
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let x = 1; x < COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * BLOCK + 0.5, 0);
      ctx.lineTo(x * BLOCK + 0.5, BOARD_H);
      ctx.stroke();
    }
    for (let y = 1; y < ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * BLOCK + 0.5);
      ctx.lineTo(BOARD_W, y * BLOCK + 0.5);
      ctx.stroke();
    }

    // Draw the ghost piece (outline only) beneath settled cells.
    if (state.ghost) {
      this.drawPiece(ctx, state.ghost, true);
    }

    // Draw settled blocks (skip hidden rows).
    for (let y = HIDDEN_ROWS; y < HIDDEN_ROWS + ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const value: CellValue = state.board[y][x];
        if (value) {
          this.drawBlock(ctx, x, y - HIDDEN_ROWS, value);
        }
      }
    }

    // Draw the active piece on top.
    if (state.active) {
      this.drawPiece(ctx, state.active, false);
    }
  }

  /** Draw a piece either as a translucent outline (ghost) or solid blocks. */
  private drawPiece(ctx: CanvasRenderingContext2D, piece: ActivePiece, ghost: boolean): void {
    const def = SHAPE_DEFINITIONS[piece.shape];
    const color = COLORS[piece.shape];
    for (const [cx, cy] of def.cells[piece.rotation]) {
      const x = piece.x + cx;
      const y = piece.y + cy - HIDDEN_ROWS;
      if (y < 0) continue; // clip hidden rows
      if (ghost) {
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.45;
        ctx.lineWidth = 2;
        ctx.strokeRect(x * BLOCK + 2, y * BLOCK + 2, BLOCK - 4, BLOCK - 4);
        ctx.globalAlpha = 1;
      } else {
        this.drawBlock(ctx, x, y, piece.shape);
      }
    }
  }

  /** Draw a single colored, beveled block. */
  private drawBlock(ctx: CanvasRenderingContext2D, x: number, y: number, shape: ShapeId): void {
    const px = x * BLOCK;
    const py = y * BLOCK;
    const color = COLORS[shape];
    ctx.fillStyle = color;
    ctx.fillRect(px, py, BLOCK, BLOCK);
    // Bevel highlight.
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(px, py, BLOCK, 3);
    ctx.fillRect(px, py, 3, BLOCK);
    // Bevel shadow.
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(px, py + BLOCK - 3, BLOCK, 3);
    ctx.fillRect(px + BLOCK - 3, py, 3, BLOCK);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 0.5, py + 0.5, BLOCK - 1, BLOCK - 1);
  }

  private renderHold(hold: ShapeId | null, canHold: boolean): void {
    const ctx = this.holdCtx;
    ctx.clearRect(0, 0, PANEL_W, 2 * BLOCK);
    ctx.fillStyle = '#12121f';
    ctx.fillRect(0, 0, PANEL_W, 2 * BLOCK);
    ctx.globalAlpha = canHold ? 1 : 0.35;
    if (hold) {
      this.drawCenteredShape(ctx, hold, PANEL_W, 2 * BLOCK);
    }
    ctx.globalAlpha = 1;
  }

  private renderNext(next: ShapeId[]): void {
    const ctx = this.nextCtx;
    ctx.clearRect(0, 0, PANEL_W, 5 * BLOCK);
    ctx.fillStyle = '#12121f';
    ctx.fillRect(0, 0, PANEL_W, 5 * BLOCK);
    for (let i = 0; i < next.length && i < 5; i++) {
      const slotY = i * BLOCK;
      // Draw each shape centered in a one-block-tall slot.
      this.drawCenteredShape(ctx, next[i], PANEL_W, BLOCK, slotY);
    }
  }

  /** Draw a shape (spawn rotation) centered within a rectangle. */
  private drawCenteredShape(ctx: CanvasRenderingContext2D, shape: ShapeId, width: number, height: number, offsetY = 0): void {
    const cells = SHAPE_DEFINITIONS[shape].cells[0];
    const minX = Math.min(...cells.map((c) => c[0]));
    const maxX = Math.max(...cells.map((c) => c[0]));
    const minY = Math.min(...cells.map((c) => c[1]));
    const maxY = Math.max(...cells.map((c) => c[1]));
    const w = (maxX - minX + 1) * BLOCK;
    const h = (maxY - minY + 1) * BLOCK;
    const originX = (width - w) / 2 - minX * BLOCK;
    const originY = offsetY + (height - h) / 2 - minY * BLOCK;

    for (const [cx, cy] of cells) {
      const px = originX + cx * BLOCK;
      const py = originY + cy * BLOCK;
      const color = COLORS[shape];
      ctx.fillStyle = color;
      ctx.fillRect(px, py, BLOCK, BLOCK);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(px, py, BLOCK, 3);
      ctx.fillRect(px, py, 3, BLOCK);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(px, py + BLOCK - 3, BLOCK, 3);
      ctx.fillRect(px + BLOCK - 3, py, 3, BLOCK);
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, py + 0.5, BLOCK - 1, BLOCK - 1);
    }
  }

  private renderStats(state: RenderState): void {
    const set = (id: string, value: string | number) => {
      const el = document.getElementById(id);
      if (el) el.textContent = String(value);
    };
    set('score', state.score.toLocaleString());
    set('level', state.level);
    set('lines', state.lines);
  }
}
