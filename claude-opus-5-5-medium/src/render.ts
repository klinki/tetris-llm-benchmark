import { Game, HIDDEN_ROWS, VISIBLE_HEIGHT, WIDTH } from "./game.js";
import { PIECE_COLORS, PIECE_TYPES, PieceType, pieceCells } from "./pieces.js";

const CELL = 30;
const PREVIEW_CELL = 20;
const PREVIEW_SLOT_HEIGHT = 3 * PREVIEW_CELL;
const GRID_COLOR = "#1c2333";
const BACKGROUND = "#0d1117";

export interface Elements {
  board: HTMLCanvasElement;
  hold: HTMLCanvasElement;
  next: HTMLCanvasElement;
  score: HTMLElement;
  level: HTMLElement;
  lines: HTMLElement;
  message: HTMLElement;
  overlay: HTMLElement;
}

/** Sizes a canvas for crisp drawing on high-DPI screens. */
function setupCanvas(canvas: HTMLCanvasElement, width: number, height: number): CanvasRenderingContext2D {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(ratio, ratio);
  return ctx;
}

function drawBlock(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, size, size);
  const edge = Math.max(2, size / 8);
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillRect(x, y, size, edge);
  ctx.fillRect(x, y, edge, size);
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fillRect(x, y + size - edge, size, edge);
  ctx.fillRect(x + size - edge, y, edge, size);
}

export class Renderer {
  private board: CanvasRenderingContext2D;
  private hold: CanvasRenderingContext2D;
  private next: CanvasRenderingContext2D;
  private text = { score: "", level: "", lines: "", message: "", overlay: "" };
  private previewKey = "";

  constructor(private readonly el: Elements) {
    this.board = setupCanvas(el.board, WIDTH * CELL, VISIBLE_HEIGHT * CELL);
    this.hold = setupCanvas(el.hold, 4 * PREVIEW_CELL + 20, PREVIEW_SLOT_HEIGHT);
    this.next = setupCanvas(el.next, 4 * PREVIEW_CELL + 20, PREVIEW_SLOT_HEIGHT * 5);
  }

  draw(game: Game): void {
    this.drawBoard(game);
    const next = game.nextPieces;
    const previewKey = `${game.holdPiece}|${game.holdUsed}|${next.join("")}`;
    if (previewKey !== this.previewKey) {
      this.previewKey = previewKey;
      this.drawPreviews(this.hold, game.holdPiece ? [game.holdPiece] : [], game.holdUsed);
      this.drawPreviews(this.next, next, false);
    }
    this.setText("score", game.score.toLocaleString());
    this.setText("level", String(game.level));
    this.setText("lines", String(game.lines));
    this.setText("message", game.message);
    this.setText(
      "overlay",
      game.gameOver ? "GAME OVER\nPress R to restart" : game.paused ? "PAUSED\nPress P to resume" : "",
    );
    this.el.overlay.hidden = this.text.overlay === "";
  }

  /** Only touches the DOM when the value actually changed. */
  private setText(key: keyof Renderer["text"], value: string): void {
    if (this.text[key] === value) return;
    this.text[key] = value;
    this.el[key].textContent = value;
  }

  private drawBoard(game: Game): void {
    const ctx = this.board;
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, WIDTH * CELL, VISIBLE_HEIGHT * CELL);

    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 1; x < WIDTH; x++) {
      ctx.moveTo(x * CELL + 0.5, 0);
      ctx.lineTo(x * CELL + 0.5, VISIBLE_HEIGHT * CELL);
    }
    for (let y = 1; y < VISIBLE_HEIGHT; y++) {
      ctx.moveTo(0, y * CELL + 0.5);
      ctx.lineTo(WIDTH * CELL, y * CELL + 0.5);
    }
    ctx.stroke();

    for (let y = HIDDEN_ROWS; y < HIDDEN_ROWS + VISIBLE_HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        const value = game.cell(x, y);
        if (value !== 0) {
          const color = game.gameOver ? "#555" : PIECE_COLORS[PIECE_TYPES[value - 1]];
          drawBlock(ctx, x * CELL, (y - HIDDEN_ROWS) * CELL, CELL, color);
        }
      }
    }

    const p = game.active;
    if (!p || game.gameOver) return;
    const cells = pieceCells(p.type, p.rotation);
    const color = PIECE_COLORS[p.type];

    const ghostY = game.ghostY();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.25;
    for (const [cx, cy] of cells) {
      const y = ghostY + cy - HIDDEN_ROWS;
      if (y >= 0) ctx.fillRect((p.x + cx) * CELL, y * CELL, CELL, CELL);
    }
    ctx.globalAlpha = 1;

    for (const [cx, cy] of cells) {
      const y = p.y + cy - HIDDEN_ROWS;
      if (y >= 0) drawBlock(ctx, (p.x + cx) * CELL, y * CELL, CELL, color);
    }
  }

  private drawPreviews(ctx: CanvasRenderingContext2D, pieces: readonly PieceType[], dimmed: boolean): void {
    const width = ctx.canvas.width;
    ctx.clearRect(0, 0, width, ctx.canvas.height);
    const slotWidth = 4 * PREVIEW_CELL + 20;
    pieces.forEach((type, i) => {
      const cells = pieceCells(type, 0);
      // Center the piece's occupied cells inside its slot.
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const [x, y] of cells) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
      const offsetX = (slotWidth - (maxX - minX + 1) * PREVIEW_CELL) / 2 - minX * PREVIEW_CELL;
      const offsetY = i * PREVIEW_SLOT_HEIGHT + (PREVIEW_SLOT_HEIGHT - (maxY - minY + 1) * PREVIEW_CELL) / 2 - minY * PREVIEW_CELL;
      const color = dimmed ? "#555" : PIECE_COLORS[type];
      for (const [x, y] of cells) {
        drawBlock(ctx, offsetX + x * PREVIEW_CELL, offsetY + y * PREVIEW_CELL, PREVIEW_CELL, color);
      }
    });
  }
}
