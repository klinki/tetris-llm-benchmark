import { BOARD_HEIGHT, BOARD_WIDTH, HIDDEN_ROWS, NEXT_QUEUE_SIZE } from './constants.js';
import { PIECES } from './tetromino.js';
import type { PieceType } from './tetromino.js';
import type { Game } from './game.js';

const CELL = 30;
const PAD = 10;
const PANEL_W = 150;
const GAP = 12;
const BOARD_W = BOARD_WIDTH * CELL;
const BOARD_H = (BOARD_HEIGHT - HIDDEN_ROWS) * CELL;
const WIDTH = PAD + PANEL_W + GAP + BOARD_W + GAP + PANEL_W + PAD;
const HEIGHT = PAD + BOARD_H + PAD;

const BG = '#0e1116';
const PANEL_BG = '#151a21';
const PANEL_BORDER = '#2a3140';
const BOARD_BG = '#0a0d11';
const GRID = 'rgba(255,255,255,0.045)';
const TEXT = '#e8ecf3';
const TEXT_DIM = '#8b94a7';
const ACCENT = '#ffd54f';
const ACCENT_2 = '#4dd0e1';
const FONT = 'ui-monospace, Menlo, Consolas, monospace';

export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly boardX = PAD + PANEL_W + GAP;
  private readonly boardY = PAD;

  constructor(canvas: HTMLCanvasElement) {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = WIDTH * dpr;
    canvas.height = HEIGHT * dpr;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.scale(dpr, dpr);
  }

  draw(game: Game): void {
    const ctx = this.ctx;
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    this.drawLeftPanel(game);
    this.drawBoardPanel(game);
    this.drawRightPanel(game);
    if (game.status === 'gameover') this.drawGameOver();
  }

  private drawLeftPanel(game: Game): void {
    const x = PAD;
    this.panel(x, PAD, PANEL_W, HEIGHT - 2 * PAD);

    this.text('HOLD', x + 14, PAD + 26, { size: 11, color: TEXT_DIM });
    if (game.hold) {
      this.mini(game.hold, x + PANEL_W / 2, PAD + 78, 22, game.canHold ? 1 : 0.35);
    }

    const valueX = x + 14;
    this.text('SCORE', valueX, PAD + 156, { size: 11, color: TEXT_DIM });
    this.text(String(game.score), valueX, PAD + 180, { size: 20, bold: true });
    this.text('LINES', valueX, PAD + 222, { size: 11, color: TEXT_DIM });
    this.text(String(game.lines), valueX, PAD + 246, { size: 20, bold: true });
    this.text('LEVEL', valueX, PAD + 288, { size: 11, color: TEXT_DIM });
    this.text(String(game.level), valueX, PAD + 312, { size: 20, bold: true });

    if (game.backToBack) this.text('B2B', valueX, PAD + 360, { size: 13, color: ACCENT, bold: true });
    if (game.combo > 0) {
      this.text(`COMBO ×${game.combo}`, valueX, PAD + 384, { size: 13, color: ACCENT_2, bold: true });
    }

    const hints = ['←→ move', '↓ soft drop', 'space hard drop', '↑/x · z/ctrl rotate', 'c hold · r restart'];
    hints.forEach((line, i) => {
      this.text(line, valueX, PAD + 470 + i * 20, { size: 10, color: TEXT_DIM });
    });
  }

  private drawRightPanel(game: Game): void {
    const x = this.boardX + BOARD_W + GAP;
    this.panel(x, PAD, PANEL_W, HEIGHT - 2 * PAD);
    this.text('NEXT', x + 14, PAD + 26, { size: 11, color: TEXT_DIM });
    const count = Math.min(NEXT_QUEUE_SIZE, game.queue.length);
    for (let i = 0; i < count; i++) {
      this.mini(game.queue[i], x + PANEL_W / 2, PAD + 78 + i * 84, 22);
    }
  }

  private drawBoardPanel(game: Game): void {
    const ctx = this.ctx;
    const { boardX: bx, boardY: by } = this;

    ctx.fillStyle = BOARD_BG;
    ctx.fillRect(bx, by, BOARD_W, BOARD_H);

    ctx.strokeStyle = GRID;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 1; x < BOARD_WIDTH; x++) {
      ctx.moveTo(bx + x * CELL + 0.5, by);
      ctx.lineTo(bx + x * CELL + 0.5, by + BOARD_H);
    }
    for (let y = 1; y < BOARD_HEIGHT - HIDDEN_ROWS; y++) {
      ctx.moveTo(bx, by + y * CELL + 0.5);
      ctx.lineTo(bx + BOARD_W, by + y * CELL + 0.5);
    }
    ctx.stroke();

    for (let y = HIDDEN_ROWS; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        const square = game.board.get(x, y);
        if (square) this.cell(bx + x * CELL, by + (y - HIDDEN_ROWS) * CELL, PIECES[square].color);
      }
    }

    const piece = game.current;
    if (piece && game.status === 'playing') {
      const ghostY = game.ghostY();
      if (ghostY !== null && ghostY !== piece.y) {
        const dy = ghostY - piece.y;
        for (const c of this.absCells(piece, dy)) {
          if (c.y < HIDDEN_ROWS) continue;
          this.ghostCell(bx + c.x * CELL, by + (c.y - HIDDEN_ROWS) * CELL, PIECES[piece.type].color);
        }
      }
      for (const c of this.absCells(piece, 0)) {
        if (c.y < HIDDEN_ROWS) continue;
        this.cell(bx + c.x * CELL, by + (c.y - HIDDEN_ROWS) * CELL, PIECES[piece.type].color);
      }
    }

    ctx.strokeStyle = PANEL_BORDER;
    ctx.strokeRect(bx - 0.5, by - 0.5, BOARD_W + 1, BOARD_H + 1);

    const age = game.timeMs - game.lastClearAtMs;
    if (game.lastClearText && age < 1800) {
      const alpha = age < 1400 ? 1 : 1 - (age - 1400) / 400;
      ctx.globalAlpha = Math.max(alpha, 0);
      this.text(game.lastClearText, bx + BOARD_W / 2, by + 96, {
        size: 20, color: ACCENT, bold: true, align: 'center',
      });
      ctx.globalAlpha = 1;
    }
  }

  private absCells(piece: Game['current'], dy: number): { x: number; y: number }[] {
    return PIECES[piece!.type].rotations[piece!.rotation].map(c => ({
      x: piece!.x + c.x,
      y: piece!.y + c.y + dy,
    }));
  }

  private drawGameOver(): void {
    const ctx = this.ctx;
    const { boardX: bx, boardY: by } = this;
    ctx.fillStyle = 'rgba(0,0,0,0.68)';
    ctx.fillRect(bx, by, BOARD_W, BOARD_H);
    this.text('GAME OVER', bx + BOARD_W / 2, by + BOARD_H / 2 - 12, {
      size: 26, bold: true, align: 'center',
    });
    this.text('press R to restart', bx + BOARD_W / 2, by + BOARD_H / 2 + 20, {
      size: 13, color: TEXT_DIM, align: 'center',
    });
  }

  private cell(px: number, py: number, color: string): void {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fillRect(px + 1, py + 1, CELL - 2, 4);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(px + 1, py + CELL - 5, CELL - 2, 4);
  }

  private ghostCell(px: number, py: number, color: string): void {
    const ctx = this.ctx;
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = color;
    ctx.fillRect(px + 2, py + 2, CELL - 4, CELL - 4);
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(px + 2.5, py + 2.5, CELL - 5, CELL - 5);
    ctx.globalAlpha = 1;
  }

  /** Draws a small piece preview centred on (cx, cy). */
  private mini(type: PieceType, cx: number, cy: number, size: number, alpha = 1): void {
    const ctx = this.ctx;
    const cells = PIECES[type].rotations[0];
    const xs = cells.map(c => c.x);
    const ys = cells.map(c => c.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const w = (Math.max(...xs) - minX + 1) * size;
    const h = (Math.max(...ys) - minY + 1) * size;
    const ox = cx - w / 2 - minX * size;
    const oy = cy - h / 2 - minY * size;
    ctx.globalAlpha = alpha;
    for (const c of cells) {
      const px = ox + c.x * size;
      const py = oy + c.y * size;
      ctx.fillStyle = PIECES[type].color;
      ctx.fillRect(px + 1, py + 1, size - 2, size - 2);
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.fillRect(px + 1, py + 1, size - 2, 3);
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.fillRect(px + 1, py + size - 4, size - 2, 3);
    }
    ctx.globalAlpha = 1;
  }

  private panel(x: number, y: number, w: number, h: number): void {
    const ctx = this.ctx;
    ctx.fillStyle = PANEL_BG;
    this.roundedRect(x, y, w, h, 8);
    ctx.fill();
    ctx.strokeStyle = PANEL_BORDER;
    this.roundedRect(x, y, w, h, 8);
    ctx.stroke();
  }

  private roundedRect(x: number, y: number, w: number, h: number, r: number): void {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  private text(
    str: string,
    x: number,
    y: number,
    opts: { size?: number; color?: string; bold?: boolean; align?: CanvasTextAlign } = {},
  ): void {
    const ctx = this.ctx;
    ctx.font = `${opts.bold ? '700 ' : ''}${opts.size ?? 12}px ${FONT}`;
    ctx.fillStyle = opts.color ?? TEXT;
    ctx.textAlign = opts.align ?? 'left';
    ctx.fillText(str, x, y);
    ctx.textAlign = 'left';
  }
}
