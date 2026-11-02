import { BOARD_HEIGHT, BOARD_WIDTH, HIDDEN_ROWS, pieceCells } from './core/board.js';
import { COLORS, Tetromino } from './core/pieces.js';
import { Game } from './core/game.js';

const CELL = 30;
const NEXT_SLOTS = 5;
const NEXT_SLOT_HEIGHT = CELL * 3;
const LABEL_VISIBLE_MS = 1800;

export interface RendererElements {
  board: HTMLCanvasElement;
  hold: HTMLCanvasElement;
  next: HTMLCanvasElement;
  score: HTMLElement;
  lines: HTMLElement;
  level: HTMLElement;
  overlay: HTMLElement;
  label: HTMLElement;
}

/** Canvas renderer: playfield, ghost piece, hold box, next queue and HUD. */
export class Renderer {
  private readonly boardCtx: CanvasRenderingContext2D;
  private readonly holdCtx: CanvasRenderingContext2D;
  private readonly nextCtx: CanvasRenderingContext2D;
  private seenClearCount = -1;
  private shownLabel: string | null = null;
  private labelVisibleUntil = 0;

  constructor(private readonly game: Game, private readonly el: RendererElements) {
    this.boardCtx = this.context(el.board);
    this.holdCtx = this.context(el.hold);
    this.nextCtx = this.context(el.next);
  }

  draw(now: number): void {
    this.drawBoard();
    this.drawHold();
    this.drawNext();
    this.drawHud(now);
  }

  private context(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas context unavailable');
    return ctx;
  }

  private drawBoard(): void {
    const ctx = this.boardCtx;
    const width = BOARD_WIDTH * CELL;
    const height = (BOARD_HEIGHT - HIDDEN_ROWS) * CELL;
    ctx.fillStyle = '#0d1021';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 1; x < BOARD_WIDTH; x++) {
      ctx.moveTo(x * CELL + 0.5, 0);
      ctx.lineTo(x * CELL + 0.5, height);
    }
    for (let y = 1; y < BOARD_HEIGHT - HIDDEN_ROWS; y++) {
      ctx.moveTo(0, y * CELL + 0.5);
      ctx.lineTo(width, y * CELL + 0.5);
    }
    ctx.stroke();

    for (let y = HIDDEN_ROWS; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        const cell = this.game.board.grid[y][x];
        if (cell !== null) this.drawCell(ctx, x, y - HIDDEN_ROWS, cell, false);
      }
    }

    const piece = this.game.active;
    if (piece && this.game.status === 'playing') {
      const ghostY = this.game.ghostY();
      if (ghostY > piece.y) {
        for (const cell of pieceCells(piece.type, piece.rotation, piece.x, ghostY)) {
          if (cell[1] >= HIDDEN_ROWS) this.drawCell(ctx, cell[0], cell[1] - HIDDEN_ROWS, piece.type, true);
        }
      }
      for (const cell of pieceCells(piece.type, piece.rotation, piece.x, piece.y)) {
        if (cell[1] >= HIDDEN_ROWS) this.drawCell(ctx, cell[0], cell[1] - HIDDEN_ROWS, piece.type, false);
      }
    }
  }

  private drawCell(ctx: CanvasRenderingContext2D, x: number, y: number, type: Tetromino, ghost: boolean): void {
    this.drawCellPx(ctx, x * CELL, y * CELL, type, ghost);
  }

  private drawCellPx(ctx: CanvasRenderingContext2D, px: number, py: number, type: Tetromino, ghost: boolean): void {
    const color = COLORS[type];
    if (ghost) {
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = color;
      ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = color;
      ctx.strokeRect(px + 1.5, py + 1.5, CELL - 3, CELL - 3);
      return;
    }
    ctx.fillStyle = color;
    ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.fillRect(px + 1, py + 1, CELL - 2, 4);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.fillRect(px + 1, py + CELL - 5, CELL - 2, 4);
  }

  private drawHold(): void {
    const ctx = this.holdCtx;
    ctx.clearRect(0, 0, this.el.hold.width, this.el.hold.height);
    if (this.game.hold) {
      this.drawPiecePreview(ctx, this.game.hold, 0, 0, this.el.hold.width, this.el.hold.height, !this.game.canHold);
    }
  }

  private drawNext(): void {
    const ctx = this.nextCtx;
    ctx.clearRect(0, 0, this.el.next.width, this.el.next.height);
    const slots = Math.min(NEXT_SLOTS, this.game.queue.length);
    for (let i = 0; i < slots; i++) {
      this.drawPiecePreview(ctx, this.game.queue[i], 0, i * NEXT_SLOT_HEIGHT, this.el.next.width, NEXT_SLOT_HEIGHT, false);
    }
  }

  private drawPiecePreview(
    ctx: CanvasRenderingContext2D,
    type: Tetromino,
    slotX: number,
    slotY: number,
    slotWidth: number,
    slotHeight: number,
    dim: boolean,
  ): void {
    const cells = pieceCells(type, 0, 0, 0);
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const [x, y] of cells) {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
    const originX = slotX + (slotWidth - (maxX - minX + 1) * CELL) / 2 - minX * CELL;
    const originY = slotY + (slotHeight - (maxY - minY + 1) * CELL) / 2 - minY * CELL;
    ctx.globalAlpha = dim ? 0.35 : 1;
    for (const [x, y] of cells) {
      this.drawCellPx(ctx, originX + x * CELL, originY + y * CELL, type, false);
    }
    ctx.globalAlpha = 1;
  }

  private drawHud(now: number): void {
    this.el.score.textContent = String(this.game.score);
    this.el.lines.textContent = String(this.game.lines);
    this.el.level.textContent = String(this.game.level);
    this.el.overlay.classList.toggle('hidden', this.game.status !== 'over');

    if (this.game.clearCount !== this.seenClearCount) {
      this.seenClearCount = this.game.clearCount;
      this.shownLabel = this.game.lastClearLabel;
      this.labelVisibleUntil = now + LABEL_VISIBLE_MS;
    }
    if (this.shownLabel && now < this.labelVisibleUntil) {
      this.el.label.textContent = this.shownLabel;
      this.el.label.classList.remove('hidden');
    } else {
      this.el.label.classList.add('hidden');
    }
  }
}
