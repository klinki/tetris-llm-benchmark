import { BOARD_WIDTH, VISIBLE_ROWS, VISIBLE_TOP } from "./board.js";
import { describeClear, type Game } from "./game.js";
import { PIECE_COLORS, SHAPES, type PieceType } from "./pieces.js";

const CELL = 30;
const PREVIEW_CELL = 22;
/** Buffer rows drawn above the field so freshly spawned pieces are visible. */
const BUFFER_ROWS = 2;
const CLEAR_MESSAGE_MS = 1500;

const FIELD_COLOR = "#0d1020";
const GRID_COLOR = "#1b2038";

export interface RendererElements {
  board: HTMLCanvasElement;
  hold: HTMLCanvasElement;
  next: HTMLCanvasElement;
  score: HTMLElement;
  level: HTMLElement;
  lines: HTMLElement;
  message: HTMLElement;
  overlay: HTMLElement;
}

/** Sizes a canvas for crisp drawing on high-DPI screens and returns its context. */
function setupCanvas(canvas: HTMLCanvasElement, width: number, height: number): CanvasRenderingContext2D {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);
  return ctx;
}

function drawBlock(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, size, size);
  // Simple bevel: light top-left edge, dark bottom-right edge.
  const edge = Math.max(2, size / 8);
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillRect(x, y, size, edge);
  ctx.fillRect(x, y, edge, size);
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fillRect(x, y + size - edge, size, edge);
  ctx.fillRect(x + size - edge, y, edge, size);
}

function drawGhostBlock(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string): void {
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, size, size);
  ctx.globalAlpha = 0.7;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
  ctx.globalAlpha = 1;
}

/** Draws a piece centred inside a slot, as used by the hold and next previews. */
function drawPreview(ctx: CanvasRenderingContext2D, type: PieceType, slotX: number, slotY: number, slotW: number, slotH: number, color: string): void {
  const cells = SHAPES[type][0];
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [x, y] of cells) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  const offsetX = slotX + (slotW - (maxX - minX + 1) * PREVIEW_CELL) / 2;
  const offsetY = slotY + (slotH - (maxY - minY + 1) * PREVIEW_CELL) / 2;
  for (const [x, y] of cells) {
    drawBlock(ctx, offsetX + (x - minX) * PREVIEW_CELL, offsetY + (y - minY) * PREVIEW_CELL, PREVIEW_CELL, color);
  }
}

export class Renderer {
  private readonly boardCtx: CanvasRenderingContext2D;
  private readonly holdCtx: CanvasRenderingContext2D;
  private readonly nextCtx: CanvasRenderingContext2D;
  private readonly boardHeight = (VISIBLE_ROWS + BUFFER_ROWS) * CELL;
  private readonly slotW = PREVIEW_CELL * 5;
  private readonly slotH = PREVIEW_CELL * 3;
  private lastRevision = -1;
  private lastMessage = "";

  constructor(private readonly el: RendererElements, private readonly nextCount: number) {
    this.boardCtx = setupCanvas(el.board, BOARD_WIDTH * CELL, this.boardHeight);
    this.holdCtx = setupCanvas(el.hold, this.slotW, this.slotH);
    this.nextCtx = setupCanvas(el.next, this.slotW, this.slotH * nextCount);
  }

  render(game: Game): void {
    const message = this.clearMessage(game);
    if (game.revision === this.lastRevision && message === this.lastMessage) return;
    this.lastRevision = game.revision;
    this.lastMessage = message;

    this.drawBoard(game);
    this.drawHold(game);
    this.drawNext(game);
    setText(this.el.score, game.score.toLocaleString());
    setText(this.el.level, String(game.level));
    setText(this.el.lines, String(game.lines));
    setText(this.el.message, message);
    setText(
      this.el.overlay,
      game.status === "over" ? "GAME OVER\nPress R to restart" : game.status === "paused" ? "PAUSED\nPress P to resume" : "",
    );
    this.el.overlay.hidden = game.status === "playing";
  }

  private clearMessage(game: Game): string {
    const clear = game.lastClear;
    if (!clear || game.time - clear.time > CLEAR_MESSAGE_MS) return "";
    return describeClear(clear).join("\n");
  }

  private drawBoard(game: Game): void {
    const ctx = this.boardCtx;
    const top = BUFFER_ROWS * CELL; // pixel y of the first visible row
    const firstRow = VISIBLE_TOP - BUFFER_ROWS;
    ctx.clearRect(0, 0, BOARD_WIDTH * CELL, this.boardHeight);

    // Field and grid.
    ctx.fillStyle = FIELD_COLOR;
    ctx.fillRect(0, top, BOARD_WIDTH * CELL, VISIBLE_ROWS * CELL);
    ctx.fillStyle = GRID_COLOR;
    for (let x = 1; x < BOARD_WIDTH; x++) ctx.fillRect(x * CELL, top, 1, VISIBLE_ROWS * CELL);
    for (let y = 1; y < VISIBLE_ROWS; y++) ctx.fillRect(0, top + y * CELL, BOARD_WIDTH * CELL, 1);

    const toPixelY = (row: number) => (row - firstRow) * CELL;

    // Locked blocks.
    for (let row = firstRow; row < VISIBLE_TOP + VISIBLE_ROWS; row++) {
      for (let col = 0; col < BOARD_WIDTH; col++) {
        const type = game.board.get(col, row);
        if (type) drawBlock(ctx, col * CELL, toPixelY(row), CELL, PIECE_COLORS[type]);
      }
    }

    const piece = game.active;
    if (!piece) return;
    const cells = SHAPES[piece.type][piece.rotation];
    const color = PIECE_COLORS[piece.type];

    // Ghost piece, then the active piece on top.
    const ghostY = game.ghostY();
    for (const [cx, cy] of cells) {
      const row = ghostY + cy;
      if (row >= firstRow) drawGhostBlock(ctx, (piece.x + cx) * CELL, toPixelY(row), CELL, color);
    }
    for (const [cx, cy] of cells) {
      const row = piece.y + cy;
      if (row >= firstRow) drawBlock(ctx, (piece.x + cx) * CELL, toPixelY(row), CELL, color);
    }
  }

  private drawHold(game: Game): void {
    const ctx = this.holdCtx;
    ctx.clearRect(0, 0, this.slotW, this.slotH);
    if (!game.held) return;
    const color = game.canHold ? PIECE_COLORS[game.held] : "#555b70";
    drawPreview(ctx, game.held, 0, 0, this.slotW, this.slotH, color);
  }

  private drawNext(game: Game): void {
    const ctx = this.nextCtx;
    ctx.clearRect(0, 0, this.slotW, this.slotH * this.nextCount);
    game.nextQueue.slice(0, this.nextCount).forEach((type, i) => {
      drawPreview(ctx, type, 0, i * this.slotH, this.slotW, this.slotH, PIECE_COLORS[type]);
    });
  }
}

function setText(el: HTMLElement, text: string): void {
  if (el.textContent !== text) el.textContent = text;
}
