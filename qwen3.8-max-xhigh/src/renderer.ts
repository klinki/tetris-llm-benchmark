// Canvas renderer: playfield, ghost piece, hold / next panels and stats.

import { COLS, HIDDEN_ROWS, ROWS, VISIBLE_ROWS } from "./constants.js";
import type { Game } from "./game.js";
import { COLORS, PIECE_CELLS, type PieceKind } from "./pieces.js";

const CELL = 28; // playfield cell size in px
const MINI = 18; // preview cell size in px
const MARGIN = 16;
const GAP = 12;
const PANEL_W = 150;
const FIELD_W = COLS * CELL;
const FIELD_H = VISIBLE_ROWS * CELL;
const FIELD_X = MARGIN + PANEL_W + GAP;
const FIELD_Y = MARGIN;
const RIGHT_X = FIELD_X + FIELD_W + GAP;
const WIDTH = RIGHT_X + PANEL_W + MARGIN;
const HEIGHT = FIELD_Y + FIELD_H + MARGIN;

const UI = {
  bg: "#0b0b12",
  panel: "#15151f",
  field: "#0e0e17",
  grid: "rgba(255,255,255,0.05)",
  border: "#2a2a3a",
  label: "#7e7e96",
  text: "#e6e6f0",
  over: "#ff5470",
};

const LABEL_FONT = "600 12px system-ui, sans-serif";
const VALUE_FONT = "bold 22px system-ui, sans-serif";
const TITLE_FONT = "bold 26px system-ui, sans-serif";

export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(WIDTH * dpr);
    canvas.height = Math.round(HEIGHT * dpr);
    canvas.style.width = `${WIDTH}px`;
    canvas.style.height = `${HEIGHT}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas context unavailable");
    ctx.scale(dpr, dpr);
    this.ctx = ctx;
  }

  render(game: Game): void {
    const ctx = this.ctx;
    ctx.fillStyle = UI.bg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    this.drawHoldPanel(game);
    this.drawNextPanel(game);
    this.drawField(game);
    if (game.status === "gameover") this.drawGameOver();
  }

  private drawField(game: Game): void {
    const ctx = this.ctx;
    ctx.fillStyle = UI.field;
    ctx.fillRect(FIELD_X, FIELD_Y, FIELD_W, FIELD_H);

    // grid lines
    ctx.strokeStyle = UI.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 1; x < COLS; x++) {
      ctx.moveTo(FIELD_X + x * CELL + 0.5, FIELD_Y);
      ctx.lineTo(FIELD_X + x * CELL + 0.5, FIELD_Y + FIELD_H);
    }
    for (let y = 1; y < VISIBLE_ROWS; y++) {
      ctx.moveTo(FIELD_X, FIELD_Y + y * CELL + 0.5);
      ctx.lineTo(FIELD_X + FIELD_W, FIELD_Y + y * CELL + 0.5);
    }
    ctx.stroke();

    // settled cells (the hidden buffer rows are not drawn)
    for (let y = HIDDEN_ROWS; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const kind = game.board.get(x, y);
        if (kind !== null) {
          drawCell(ctx, FIELD_X + x * CELL, FIELD_Y + (y - HIDDEN_ROWS) * CELL, CELL, COLORS[kind]);
        }
      }
    }

    const piece = game.current;
    if (piece !== null && game.status === "playing") {
      const cells = PIECE_CELLS[piece.kind][piece.rotation];
      const color = COLORS[piece.kind];

      // ghost piece at the landing position
      const ghostY = game.ghostY();
      for (const cell of cells) {
        const by = ghostY + cell.y;
        if (by < HIDDEN_ROWS) continue;
        const px = FIELD_X + (piece.x + cell.x) * CELL;
        const py = FIELD_Y + (by - HIDDEN_ROWS) * CELL;
        ctx.globalAlpha = 0.16;
        ctx.fillStyle = color;
        ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = color;
        ctx.strokeRect(px + 1.5, py + 1.5, CELL - 3, CELL - 3);
      }
      ctx.globalAlpha = 1;

      // active piece, clipped to the visible field (it may reach into the buffer)
      ctx.save();
      ctx.beginPath();
      ctx.rect(FIELD_X, FIELD_Y, FIELD_W, FIELD_H);
      ctx.clip();
      for (const cell of cells) {
        const px = FIELD_X + (piece.x + cell.x) * CELL;
        const py = FIELD_Y + (piece.y + cell.y - HIDDEN_ROWS) * CELL;
        drawCell(ctx, px, py, CELL, color);
      }
      ctx.restore();
    }

    ctx.strokeStyle = UI.border;
    ctx.lineWidth = 2;
    ctx.strokeRect(FIELD_X - 1, FIELD_Y - 1, FIELD_W + 2, FIELD_H + 2);
    ctx.lineWidth = 1;
  }

  private drawHoldPanel(game: Game): void {
    const ctx = this.ctx;
    ctx.fillStyle = UI.panel;
    ctx.fillRect(MARGIN, FIELD_Y, PANEL_W, FIELD_H);
    this.drawLabel("HOLD", MARGIN + 14, FIELD_Y + 26);
    if (game.held !== null) {
      drawMiniPiece(ctx, game.held, MARGIN + PANEL_W / 2, FIELD_Y + 90);
    }
  }

  private drawNextPanel(game: Game): void {
    const ctx = this.ctx;
    ctx.fillStyle = UI.panel;
    ctx.fillRect(RIGHT_X, FIELD_Y, PANEL_W, FIELD_H);
    this.drawLabel("NEXT", RIGHT_X + 14, FIELD_Y + 26);
    const shown = Math.min(3, game.queue.length);
    for (let i = 0; i < shown; i++) {
      drawMiniPiece(ctx, game.queue[i], RIGHT_X + PANEL_W / 2, FIELD_Y + 80 + i * 70);
    }
    const stats: [string, string][] = [
      ["SCORE", String(game.score)],
      ["LINES", String(game.lines)],
      ["LEVEL", String(game.level)],
    ];
    stats.forEach(([label, value], i) => {
      const y = FIELD_Y + 310 + i * 64;
      this.drawLabel(label, RIGHT_X + 14, y);
      this.ctx.fillStyle = UI.text;
      this.ctx.font = VALUE_FONT;
      this.ctx.fillText(value, RIGHT_X + 14, y + 24);
    });
  }

  private drawLabel(text: string, x: number, y: number): void {
    this.ctx.fillStyle = UI.label;
    this.ctx.font = LABEL_FONT;
    this.ctx.fillText(text, x, y);
  }

  private drawGameOver(): void {
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(6, 6, 12, 0.75)";
    ctx.fillRect(FIELD_X, FIELD_Y, FIELD_W, FIELD_H);
    const cx = FIELD_X + FIELD_W / 2;
    const cy = FIELD_Y + FIELD_H / 2;
    ctx.textAlign = "center";
    ctx.fillStyle = UI.over;
    ctx.font = TITLE_FONT;
    ctx.fillText("GAME OVER", cx, cy - 10);
    ctx.fillStyle = UI.text;
    ctx.font = "15px system-ui, sans-serif";
    ctx.fillText("press R to restart", cx, cy + 20);
    ctx.textAlign = "left";
  }
}

// One beveled block of the given color.
function drawCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
): void {
  const edge = Math.max(2, Math.round(size * 0.14));
  ctx.fillStyle = color;
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.fillRect(x, y, size, edge);
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fillRect(x, y + size - edge, size, edge);
  ctx.strokeStyle = "rgba(0,0,0,0.55)";
  ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
}

// A preview piece centered on (cx, cy), drawn in its spawn orientation.
function drawMiniPiece(
  ctx: CanvasRenderingContext2D,
  kind: PieceKind,
  cx: number,
  cy: number
): void {
  const cells = PIECE_CELLS[kind][0];
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const cell of cells) {
    minX = Math.min(minX, cell.x);
    maxX = Math.max(maxX, cell.x);
    minY = Math.min(minY, cell.y);
    maxY = Math.max(maxY, cell.y);
  }
  const w = (maxX - minX + 1) * MINI;
  const h = (maxY - minY + 1) * MINI;
  const ox = cx - w / 2 - minX * MINI;
  const oy = cy - h / 2 - minY * MINI;
  for (const cell of cells) {
    drawCell(ctx, ox + cell.x * MINI, oy + cell.y * MINI, MINI, COLORS[kind]);
  }
}
