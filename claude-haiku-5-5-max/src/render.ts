import { BOARD_WIDTH, BUFFER_HEIGHT, NEXT_QUEUE_SIZE, VISIBLE_HEIGHT } from './constants.js';
import type { Game } from './game.js';
import { offsetsOf, PIECES, type PieceState, type PieceType } from './pieces.js';

/** Board cell size in CSS pixels. */
const CELL = 30;
/** Cell size in the hold and next panels. */
const PREVIEW_CELL = 18;
/** Each preview slot is this many cells wide and tall. */
const PREVIEW_COLS = 4;
const PREVIEW_ROWS = 3;

const BACKGROUND = '#0b0d12';
const GRID_COLOR = 'rgba(255, 255, 255, 0.06)';
const GHOST_ALPHA = 0.25;
const UNAVAILABLE_ALPHA = 0.35;

/** Draws the playfield, ghost piece, hold panel and next queue onto canvases. */
export class Renderer {
  private readonly boardCtx: CanvasRenderingContext2D;
  private readonly holdCtx: CanvasRenderingContext2D;
  private readonly nextCtx: CanvasRenderingContext2D;

  constructor(board: HTMLCanvasElement, hold: HTMLCanvasElement, next: HTMLCanvasElement) {
    this.boardCtx = setupCanvas(board, BOARD_WIDTH * CELL, VISIBLE_HEIGHT * CELL);
    this.holdCtx = setupCanvas(hold, PREVIEW_COLS * PREVIEW_CELL, PREVIEW_ROWS * PREVIEW_CELL);
    this.nextCtx = setupCanvas(
      next,
      PREVIEW_COLS * PREVIEW_CELL,
      NEXT_QUEUE_SIZE * PREVIEW_ROWS * PREVIEW_CELL,
    );
  }

  draw(game: Game): void {
    this.drawBoard(game);
    this.drawHold(game);
    this.drawNext(game.nextPieces);
  }

  private drawBoard(game: Game): void {
    const ctx = this.boardCtx;
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, BOARD_WIDTH * CELL, VISIBLE_HEIGHT * CELL);
    drawGrid(ctx);

    for (let row = 0; row < VISIBLE_HEIGHT; row++) {
      for (let col = 0; col < BOARD_WIDTH; col++) {
        const type = game.board.cell(col, row + BUFFER_HEIGHT);
        if (type) fillCell(ctx, col, row, CELL, PIECES[type].color);
      }
    }

    const piece = game.active;
    if (piece) {
      const color = PIECES[piece.type].color;
      ctx.globalAlpha = GHOST_ALPHA;
      forEachVisibleCell({ ...piece, y: game.landingRow() }, (col, row) =>
        fillCell(ctx, col, row, CELL, color),
      );
      ctx.globalAlpha = 1;
      forEachVisibleCell(piece, (col, row) => fillCell(ctx, col, row, CELL, color));
    }
  }

  private drawHold(game: Game): void {
    const ctx = this.holdCtx;
    ctx.clearRect(0, 0, PREVIEW_COLS * PREVIEW_CELL, PREVIEW_ROWS * PREVIEW_CELL);
    if (!game.held) return;
    ctx.globalAlpha = game.canHold ? 1 : UNAVAILABLE_ALPHA;
    drawPreview(ctx, game.held, 0);
    ctx.globalAlpha = 1;
  }

  private drawNext(queue: readonly PieceType[]): void {
    const ctx = this.nextCtx;
    ctx.clearRect(0, 0, PREVIEW_COLS * PREVIEW_CELL, NEXT_QUEUE_SIZE * PREVIEW_ROWS * PREVIEW_CELL);
    queue.forEach((type, slot) => drawPreview(ctx, type, slot));
  }
}

/** Sizes a canvas for the device pixel ratio and returns a context that draws in CSS pixels. */
function setupCanvas(canvas: HTMLCanvasElement, width: number, height: number): CanvasRenderingContext2D {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context is not available');
  ctx.scale(ratio, ratio);
  return ctx;
}

/** Fills one cell, leaving a 1px gap so the grid shows between blocks. */
function fillCell(
  ctx: CanvasRenderingContext2D,
  col: number,
  row: number,
  size: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.fillRect(col * size + 1, row * size + 1, size - 2, size - 2);
}

function drawGrid(ctx: CanvasRenderingContext2D): void {
  const width = BOARD_WIDTH * CELL;
  const height = VISIBLE_HEIGHT * CELL;
  ctx.strokeStyle = GRID_COLOR;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let col = 1; col < BOARD_WIDTH; col++) {
    ctx.moveTo(col * CELL + 0.5, 0);
    ctx.lineTo(col * CELL + 0.5, height);
  }
  for (let row = 1; row < VISIBLE_HEIGHT; row++) {
    ctx.moveTo(0, row * CELL + 0.5);
    ctx.lineTo(width, row * CELL + 0.5);
  }
  ctx.stroke();
}

/** Calls `draw` with the visible (col, row) of each cell of the piece. Buffer-zone cells are skipped. */
function forEachVisibleCell(piece: PieceState, draw: (col: number, row: number) => void): void {
  for (const [dx, dy] of offsetsOf(piece.type, piece.rotation)) {
    const row = piece.y + dy - BUFFER_HEIGHT;
    if (row >= 0) draw(piece.x + dx, row);
  }
}

/** Draws a piece's spawn shape centred in preview slot `slot`. Slots stack downward. */
function drawPreview(ctx: CanvasRenderingContext2D, type: PieceType, slot: number): void {
  const cells = offsetsOf(type, 0);
  const minX = Math.min(...cells.map(([x]) => x));
  const minY = Math.min(...cells.map(([, y]) => y));
  const width = Math.max(...cells.map(([x]) => x)) - minX + 1;
  const height = Math.max(...cells.map(([, y]) => y)) - minY + 1;
  const left = Math.floor((PREVIEW_COLS - width) / 2);
  const top = slot * PREVIEW_ROWS + Math.floor((PREVIEW_ROWS - height) / 2);
  for (const [x, y] of cells) {
    fillCell(ctx, left + x - minX, top + y - minY, PREVIEW_CELL, PIECES[type].color);
  }
}
