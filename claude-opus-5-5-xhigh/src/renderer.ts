import { COLS, HIDDEN_ROWS, ROWS, VISIBLE_ROWS } from './board.js';
import { type ClearAction, type Game, NEXT_COUNT } from './game.js';
import { COLORS, SHAPES, type PieceType, pieceCells } from './pieces.js';

/** Sizes are in CSS pixels; canvases are scaled for high-DPI screens. */
const CELL = 30;
const PREVIEW_CELL = 22;
const PREVIEW_WIDTH = 5 * PREVIEW_CELL;
const PREVIEW_SLOT = 3 * PREVIEW_CELL;
const BOARD_WIDTH = COLS * CELL;
const BOARD_HEIGHT = VISIBLE_ROWS * CELL;

const BACKGROUND = '#0d1220';
const GRID = 'rgba(255, 255, 255, 0.05)';
const DISABLED = '#4b5263';

const OVERLAY_TEXT = {
  paused: ['Paused', 'Press P or Esc to resume'],
  over: ['Game Over', 'Press R to restart'],
} as const;

function byId<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing element #${id}`);
  return element as T;
}

function createContext(canvas: HTMLCanvasElement, width: number, height: number): CanvasRenderingContext2D {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  const ctx = canvas.getContext('2d')!;
  ctx.scale(ratio, ratio);
  return ctx;
}

function drawBlock(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string): void {
  const bevel = Math.max(2, Math.round(size / 8));
  ctx.fillStyle = color;
  ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.fillRect(x + 1, y + 1, size - 2, bevel);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.fillRect(x + 1, y + size - 1 - bevel, size - 2, bevel);
}

function drawGhost(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string): void {
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = color;
  ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
  ctx.globalAlpha = 0.6;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
  ctx.globalAlpha = 1;
}

/** Draws a piece in spawn orientation, centered in a preview slot. */
function drawPreview(ctx: CanvasRenderingContext2D, type: PieceType, slotY: number, color: string): void {
  const cells = SHAPES[type][0];
  const xs = cells.map(([x]) => x);
  const ys = cells.map(([, y]) => y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const width = (Math.max(...xs) - minX + 1) * PREVIEW_CELL;
  const height = (Math.max(...ys) - minY + 1) * PREVIEW_CELL;
  const offsetX = (PREVIEW_WIDTH - width) / 2 - minX * PREVIEW_CELL;
  const offsetY = slotY + (PREVIEW_SLOT - height) / 2 - minY * PREVIEW_CELL;
  for (const [x, y] of cells) {
    drawBlock(ctx, offsetX + x * PREVIEW_CELL, offsetY + y * PREVIEW_CELL, PREVIEW_CELL, color);
  }
}

export class Renderer {
  private readonly board = createContext(byId('board'), BOARD_WIDTH, BOARD_HEIGHT);
  private readonly hold = createContext(byId('hold'), PREVIEW_WIDTH, PREVIEW_SLOT);
  private readonly next = createContext(byId('next'), PREVIEW_WIDTH, PREVIEW_SLOT * NEXT_COUNT);
  private readonly score = byId('score');
  private readonly level = byId('level');
  private readonly lines = byId('lines');
  private readonly overlay = byId('overlay');
  private readonly overlayTitle = byId('overlay-title');
  private readonly overlayHint = byId('overlay-hint');
  private readonly action = byId('action');
  private shownAction: ClearAction | null = null;

  render(game: Game): void {
    this.drawBoard(game);
    this.drawHold(game);
    this.drawQueue(game);
    this.updateHud(game);
  }

  private drawBoard(game: Game): void {
    const ctx = this.board;
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);
    ctx.fillStyle = GRID;
    for (let x = 1; x < COLS; x++) ctx.fillRect(x * CELL, 0, 1, BOARD_HEIGHT);
    for (let y = 1; y < VISIBLE_ROWS; y++) ctx.fillRect(0, y * CELL, BOARD_WIDTH, 1);

    for (let y = HIDDEN_ROWS; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const cell = game.board.get(x, y);
        if (cell) drawBlock(ctx, x * CELL, (y - HIDDEN_ROWS) * CELL, CELL, COLORS[cell]);
      }
    }

    const piece = game.active;
    if (!piece) return;
    const color = COLORS[piece.type];
    // Cells still in the hidden buffer get negative coordinates and are clipped by the canvas.
    for (const [x, y] of pieceCells({ ...piece, y: game.ghostY() })) {
      drawGhost(ctx, x * CELL, (y - HIDDEN_ROWS) * CELL, CELL, color);
    }
    for (const [x, y] of pieceCells(piece)) {
      drawBlock(ctx, x * CELL, (y - HIDDEN_ROWS) * CELL, CELL, color);
    }
  }

  private drawHold(game: Game): void {
    this.hold.clearRect(0, 0, PREVIEW_WIDTH, PREVIEW_SLOT);
    if (game.held) drawPreview(this.hold, game.held, 0, game.holdUsed ? DISABLED : COLORS[game.held]);
  }

  private drawQueue(game: Game): void {
    this.next.clearRect(0, 0, PREVIEW_WIDTH, PREVIEW_SLOT * NEXT_COUNT);
    game.queue.forEach((type, i) => drawPreview(this.next, type, i * PREVIEW_SLOT, COLORS[type]));
  }

  private updateHud(game: Game): void {
    this.score.textContent = game.score.toLocaleString('en-US');
    this.level.textContent = String(game.level);
    this.lines.textContent = String(game.lines);

    this.overlay.hidden = game.state === 'playing';
    if (game.state !== 'playing') {
      [this.overlayTitle.textContent, this.overlayHint.textContent] = OVERLAY_TEXT[game.state];
    }

    const action = game.lastAction;
    if (action && action !== this.shownAction) {
      const lines = [...action.labels, `+${action.points.toLocaleString('en-US')}`];
      this.action.replaceChildren(...lines.map((text) => Object.assign(document.createElement('div'), { textContent: text })));
      this.action.animate(
        [
          { opacity: 0, transform: 'scale(0.8)' },
          { opacity: 1, transform: 'scale(1.05)', offset: 0.1 },
          { opacity: 1, transform: 'scale(1)', offset: 0.75 },
          { opacity: 0, transform: 'scale(1)' },
        ],
        { duration: 1800, easing: 'ease-out', fill: 'forwards' },
      );
    }
    this.shownAction = action;
  }
}
