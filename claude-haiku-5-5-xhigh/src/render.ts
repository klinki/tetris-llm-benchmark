import { cellsOf, COLS, type Game, HIDDEN_ROWS, ROWS, VISIBLE_ROWS } from './game.js';
import { PIECE_COLORS, pieceCells, type Point, type PieceType } from './pieces.js';

const CELL = 30;
const PREVIEW_CELL = 20;
/** Height of one piece slot in the hold and next panels. */
const PREVIEW_SLOT = 80;

/** Draws the game onto the canvases and stats elements of the page. */
export class Renderer {
  private readonly boardCtx: CanvasRenderingContext2D;
  private readonly holdCtx: CanvasRenderingContext2D;
  private readonly nextCtx: CanvasRenderingContext2D;
  private readonly scoreEl: HTMLElement;
  private readonly levelEl: HTMLElement;
  private readonly linesEl: HTMLElement;

  constructor(doc: Document) {
    this.boardCtx = contextOf(doc, 'board');
    this.holdCtx = contextOf(doc, 'hold');
    this.nextCtx = contextOf(doc, 'next');
    this.scoreEl = elementOf(doc, 'score');
    this.levelEl = elementOf(doc, 'level');
    this.linesEl = elementOf(doc, 'lines');
  }

  draw(game: Game): void {
    this.drawBoard(game);
    this.drawHold(game);
    this.drawQueue(game.queue);
    setText(this.scoreEl, String(game.score));
    setText(this.levelEl, String(game.level));
    setText(this.linesEl, String(game.lines));
  }

  private drawBoard(game: Game): void {
    const ctx = this.boardCtx;
    const width = COLS * CELL;
    const height = VISIBLE_ROWS * CELL;
    ctx.fillStyle = '#111118';
    ctx.fillRect(0, 0, width, height);
    this.drawGrid(width, height);

    for (let y = HIDDEN_ROWS; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const type = game.board[y][x];
        if (type) drawCell(ctx, x * CELL, (y - HIDDEN_ROWS) * CELL, CELL, PIECE_COLORS[type]);
      }
    }

    const ghost = game.ghost();
    if (ghost) {
      for (const cell of visibleCells(cellsOf(ghost))) {
        strokeCell(ctx, cell, PIECE_COLORS[ghost.type]);
      }
    }
    if (game.current) {
      for (const cell of visibleCells(cellsOf(game.current))) {
        drawCell(ctx, cell.x * CELL, cell.y * CELL, CELL, PIECE_COLORS[game.current.type]);
      }
    }

    if (game.gameOver) this.drawGameOver(width, height);
  }

  private drawGrid(width: number, height: number): void {
    const ctx = this.boardCtx;
    ctx.strokeStyle = '#1f1f2b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 1; x < COLS; x++) {
      ctx.moveTo(x * CELL + 0.5, 0);
      ctx.lineTo(x * CELL + 0.5, height);
    }
    for (let y = 1; y < VISIBLE_ROWS; y++) {
      ctx.moveTo(0, y * CELL + 0.5);
      ctx.lineTo(width, y * CELL + 0.5);
    }
    ctx.stroke();
  }

  private drawGameOver(width: number, height: number): void {
    const ctx = this.boardCtx;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('GAME OVER', width / 2, height / 2 - 8);
    ctx.font = '16px sans-serif';
    ctx.fillText('Press R to restart', width / 2, height / 2 + 24);
  }

  private drawHold(game: Game): void {
    const ctx = this.holdCtx;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    if (game.hold) drawPreview(ctx, game.hold, 0, game.canHold ? 1 : 0.35);
  }

  private drawQueue(queue: PieceType[]): void {
    const ctx = this.nextCtx;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    queue.forEach((type, i) => drawPreview(ctx, type, i * PREVIEW_SLOT, 1));
  }
}

function drawCell(ctx: CanvasRenderingContext2D, px: number, py: number, size: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(px, py, size, size);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(px + 0.5, py + 0.5, size - 1, size - 1);
}

function strokeCell(ctx: CanvasRenderingContext2D, cell: Point, color: string): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(cell.x * CELL + 2, cell.y * CELL + 2, CELL - 4, CELL - 4);
}

/** Centres a piece's spawn shape in one slot of a preview canvas. */
function drawPreview(ctx: CanvasRenderingContext2D, type: PieceType, slotTop: number, alpha: number): void {
  const cells = pieceCells(type, 0);
  const xs = cells.map((c) => c.x);
  const ys = cells.map((c) => c.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const width = (Math.max(...xs) - minX + 1) * PREVIEW_CELL;
  const height = (Math.max(...ys) - minY + 1) * PREVIEW_CELL;
  const left = (ctx.canvas.width - width) / 2 - minX * PREVIEW_CELL;
  const top = slotTop + (PREVIEW_SLOT - height) / 2 - minY * PREVIEW_CELL;

  ctx.globalAlpha = alpha;
  for (const c of cells) {
    drawCell(ctx, left + c.x * PREVIEW_CELL, top + c.y * PREVIEW_CELL, PREVIEW_CELL, PIECE_COLORS[type]);
  }
  ctx.globalAlpha = 1;
}

/** Cells in the visible part of the board, shifted so the first visible row is row 0. */
function visibleCells(cells: Point[]): Point[] {
  return cells.filter((c) => c.y >= HIDDEN_ROWS).map((c) => ({ x: c.x, y: c.y - HIDDEN_ROWS }));
}

function contextOf(doc: Document, id: string): CanvasRenderingContext2D {
  const canvas = doc.getElementById(id);
  if (!(canvas instanceof HTMLCanvasElement)) throw new Error(`Missing <canvas id="${id}">`);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error(`No 2D context for #${id}`);
  return ctx;
}

function elementOf(doc: Document, id: string): HTMLElement {
  const el = doc.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el;
}

function setText(el: HTMLElement, text: string): void {
  if (el.textContent !== text) el.textContent = text;
}
