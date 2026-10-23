import { BOARD_WIDTH, BOARD_HEIGHT, VISIBLE_TOP } from './game/board.js';
import { PREVIEW_COUNT, type Game } from './game/game.js';
import { PIECE_COLORS, pieceCells, type PieceType } from './game/pieces.js';

const CELL = 30;
const PREVIEW_CELL = 22;
const PREVIEW_WIDTH = 120;
const PREVIEW_SLOT = 72;
const VISIBLE_ROWS = BOARD_HEIGHT - VISIBLE_TOP;
const GHOST_ALPHA = 0.35;
const DIMMED_ALPHA = 0.35;

export interface RenderTargets {
  board: HTMLCanvasElement;
  hold: HTMLCanvasElement;
  next: HTMLCanvasElement;
  score: HTMLElement;
  level: HTMLElement;
  lines: HTMLElement;
  event: HTMLElement;
  overlay: HTMLElement;
}

export class Renderer {
  private readonly boardCtx: CanvasRenderingContext2D;
  private readonly holdCtx: CanvasRenderingContext2D;
  private readonly nextCtx: CanvasRenderingContext2D;

  constructor(private readonly targets: RenderTargets) {
    targets.board.width = BOARD_WIDTH * CELL;
    targets.board.height = VISIBLE_ROWS * CELL;
    targets.hold.width = PREVIEW_WIDTH;
    targets.hold.height = PREVIEW_SLOT;
    targets.next.width = PREVIEW_WIDTH;
    targets.next.height = PREVIEW_SLOT * PREVIEW_COUNT;
    this.boardCtx = context(targets.board);
    this.holdCtx = context(targets.hold);
    this.nextCtx = context(targets.next);
  }

  draw(game: Game): void {
    this.drawBoard(game);
    this.drawPreview(this.holdCtx, game.heldPiece ? [game.heldPiece] : [], !game.canHold);
    this.drawPreview(this.nextCtx, game.next, false);

    this.targets.score.textContent = String(game.score);
    this.targets.level.textContent = String(game.level);
    this.targets.lines.textContent = String(game.lines);
    this.targets.event.textContent = game.lastEvent;
    this.targets.overlay.hidden = !game.isOver;
  }

  private drawBoard(game: Game): void {
    const ctx = this.boardCtx;
    const { width, height } = this.targets.board;
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#101018';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#1c1c2a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 1; x < BOARD_WIDTH; x++) {
      ctx.moveTo(x * CELL + 0.5, 0);
      ctx.lineTo(x * CELL + 0.5, height);
    }
    for (let row = 1; row < VISIBLE_ROWS; row++) {
      ctx.moveTo(0, row * CELL + 0.5);
      ctx.lineTo(width, row * CELL + 0.5);
    }
    ctx.stroke();

    for (let y = VISIBLE_TOP; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        const type = game.board.get(x, y);
        if (type) this.fillCell(x, y, PIECE_COLORS[type]);
      }
    }

    const { active } = game;
    const cells = pieceCells(active.type, active.rotation);
    const ghostY = game.ghostY;
    ctx.globalAlpha = GHOST_ALPHA;
    for (const [dx, dy] of cells) {
      this.outlineCell(active.x + dx, ghostY + dy, PIECE_COLORS[active.type]);
    }
    ctx.globalAlpha = 1;
    for (const [dx, dy] of cells) {
      this.fillCell(active.x + dx, active.y + dy, PIECE_COLORS[active.type]);
    }
  }

  /** Draws a block at board coordinates. Hidden rows are skipped. */
  private fillCell(x: number, y: number, color: string): void {
    if (y < VISIBLE_TOP) return;
    this.boardCtx.fillStyle = color;
    this.boardCtx.fillRect(x * CELL + 1, (y - VISIBLE_TOP) * CELL + 1, CELL - 2, CELL - 2);
  }

  private outlineCell(x: number, y: number, color: string): void {
    if (y < VISIBLE_TOP) return;
    this.boardCtx.strokeStyle = color;
    this.boardCtx.lineWidth = 2;
    this.boardCtx.strokeRect(x * CELL + 2, (y - VISIBLE_TOP) * CELL + 2, CELL - 4, CELL - 4);
  }

  /** Draws pieces one under another, each centred in its own slot. */
  private drawPreview(ctx: CanvasRenderingContext2D, types: readonly PieceType[], dimmed: boolean): void {
    const { width, height } = ctx.canvas;
    ctx.clearRect(0, 0, width, height);
    ctx.globalAlpha = dimmed ? DIMMED_ALPHA : 1;
    types.forEach((type, slot) => {
      const cells = pieceCells(type, 0);
      const minX = Math.min(...cells.map(([x]) => x));
      const minY = Math.min(...cells.map(([, y]) => y));
      const cols = Math.max(...cells.map(([x]) => x)) - minX + 1;
      const rows = Math.max(...cells.map(([, y]) => y)) - minY + 1;
      const left = (width - cols * PREVIEW_CELL) / 2;
      const top = slot * PREVIEW_SLOT + (PREVIEW_SLOT - rows * PREVIEW_CELL) / 2;
      ctx.fillStyle = PIECE_COLORS[type];
      for (const [x, y] of cells) {
        ctx.fillRect(
          left + (x - minX) * PREVIEW_CELL + 1,
          top + (y - minY) * PREVIEW_CELL + 1,
          PREVIEW_CELL - 2,
          PREVIEW_CELL - 2,
        );
      }
    });
    ctx.globalAlpha = 1;
  }
}

function context(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context is not available');
  return ctx;
}
