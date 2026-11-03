import { HEIGHT, HIDDEN_ROWS, WIDTH } from "../core/board.js";
import type { Game } from "../core/game.js";
import { PIECES, type PieceType } from "../core/tetromino.js";

const CELL = 32;
const BOARD_W = WIDTH * CELL;
const VISIBLE_ROWS = HEIGHT - HIDDEN_ROWS;
const BOARD_H = VISIBLE_ROWS * CELL;

const MINI_CELL = 20;
const PANEL_W = 96;
const HOLD_H = 56;
const NEXT_COUNT = 5;
const SLOT_H = 48;
const NEXT_H = NEXT_COUNT * SLOT_H + 8;

/** One colour per shape, as the classic Tetris palette. */
const COLORS: Record<PieceType, string> = {
  I: "#31c7ef",
  J: "#5a65ad",
  L: "#ef7921",
  O: "#f7d308",
  S: "#42b642",
  T: "#ad4d9c",
  Z: "#ef2029",
};

const BACKGROUND = "#0d1322";
const GRID_LINE = "#1b2438";

/** Draws the playfield, ghost piece, hold box and next queue onto canvases. */
export class Renderer {
  private readonly board: CanvasRenderingContext2D;
  private readonly hold: CanvasRenderingContext2D;
  private readonly next: CanvasRenderingContext2D;
  private readonly tiles = new Map<string, HTMLCanvasElement>();

  constructor(canvases: {
    board: HTMLCanvasElement;
    hold: HTMLCanvasElement;
    next: HTMLCanvasElement;
  }) {
    this.board = this.prepare(canvases.board, BOARD_W, BOARD_H);
    this.hold = this.prepare(canvases.hold, PANEL_W, HOLD_H);
    this.next = this.prepare(canvases.next, PANEL_W, NEXT_H);
  }

  draw(game: Game): void {
    this.drawPlayfield(game);
    this.drawHold(game);
    this.drawNext(game);
  }

  private prepare(canvas: HTMLCanvasElement, width: number, height: number): CanvasRenderingContext2D {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas 2d context unavailable");
    ctx.scale(dpr, dpr);
    return ctx;
  }

  private drawPlayfield(game: Game): void {
    const ctx = this.board;
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, BOARD_W, BOARD_H);

    ctx.strokeStyle = GRID_LINE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 1; x < WIDTH; x++) {
      ctx.moveTo(x * CELL + 0.5, 0);
      ctx.lineTo(x * CELL + 0.5, BOARD_H);
    }
    for (let y = 1; y < VISIBLE_ROWS; y++) {
      ctx.moveTo(0, y * CELL + 0.5);
      ctx.lineTo(BOARD_W, y * CELL + 0.5);
    }
    ctx.stroke();

    for (let y = HIDDEN_ROWS; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        const type = game.board.grid[y][x];
        if (type) this.paint(ctx, x * CELL, (y - HIDDEN_ROWS) * CELL, type);
      }
    }

    const piece = game.active;
    if (!piece || game.gameOver) return;
    const shape = PIECES[piece.type].states[piece.rotation];

    const ghostY = game.ghostY();
    if (ghostY > piece.y) {
      for (const [cx, cy] of shape) {
        const y = ghostY + cy;
        if (y >= HIDDEN_ROWS) this.paintGhost(ctx, (piece.x + cx) * CELL, (y - HIDDEN_ROWS) * CELL, piece.type);
      }
    }
    // Cells above the visible field (the hidden spawn rows) are not drawn.
    for (const [cx, cy] of shape) {
      const y = piece.y + cy;
      if (y >= HIDDEN_ROWS) this.paint(ctx, (piece.x + cx) * CELL, (y - HIDDEN_ROWS) * CELL, piece.type);
    }
  }

  private drawHold(game: Game): void {
    const ctx = this.hold;
    ctx.clearRect(0, 0, PANEL_W, HOLD_H);
    if (!game.hold) return;
    ctx.globalAlpha = game.canHold ? 1 : 0.35;
    this.drawMini(ctx, game.hold, PANEL_W / 2, HOLD_H / 2);
    ctx.globalAlpha = 1;
  }

  private drawNext(game: Game): void {
    const ctx = this.next;
    ctx.clearRect(0, 0, PANEL_W, NEXT_H);
    const count = Math.min(NEXT_COUNT, game.queue.length);
    for (let i = 0; i < count; i++) {
      this.drawMini(ctx, game.queue[i], PANEL_W / 2, 8 + SLOT_H * i + SLOT_H / 2);
    }
  }

  /** Draws a piece's spawn shape centred on (cx, cy) using mini cells. */
  private drawMini(ctx: CanvasRenderingContext2D, type: PieceType, cx: number, cy: number): void {
    const cells = PIECES[type].states[0];
    let minX = cells[0][0];
    let maxX = cells[0][0];
    let minY = cells[0][1];
    let maxY = cells[0][1];
    for (const [x, y] of cells) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
    const originX = cx - ((maxX - minX + 1) * MINI_CELL) / 2 - minX * MINI_CELL;
    const originY = cy - ((maxY - minY + 1) * MINI_CELL) / 2 - minY * MINI_CELL;
    for (const [x, y] of cells) {
      ctx.drawImage(this.tile(COLORS[type], MINI_CELL), originX + x * MINI_CELL, originY + y * MINI_CELL);
    }
  }

  private paint(ctx: CanvasRenderingContext2D, x: number, y: number, type: PieceType): void {
    ctx.drawImage(this.tile(COLORS[type], CELL), x, y);
  }

  private paintGhost(ctx: CanvasRenderingContext2D, x: number, y: number, type: PieceType): void {
    ctx.drawImage(this.ghostTile(COLORS[type]), x, y);
  }

  /** Pre-renders a glossy tile once per colour and size, then blits copies. */
  private tile(color: string, size: number): HTMLCanvasElement {
    const key = `tile:${color}:${size}`;
    const cached = this.tiles.get(key);
    if (cached) return cached;

    const tile = document.createElement("canvas");
    tile.width = size;
    tile.height = size;
    const ctx = tile.getContext("2d")!;
    const radius = Math.max(2, Math.round(size * 0.14));

    ctx.fillStyle = color;
    this.roundedRect(ctx, 1, 1, size - 2, size - 2, radius);
    ctx.fill();

    const gloss = ctx.createLinearGradient(0, 1, 0, size * 0.6);
    gloss.addColorStop(0, "rgba(255, 255, 255, 0.32)");
    gloss.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = gloss;
    this.roundedRect(ctx, 1, 1, size - 2, size - 2, radius);
    ctx.fill();

    ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
    ctx.lineWidth = 1;
    this.roundedRect(ctx, 1.5, 1.5, size - 3, size - 3, radius);
    ctx.stroke();

    this.tiles.set(key, tile);
    return tile;
  }

  private ghostTile(color: string): HTMLCanvasElement {
    const key = `ghost:${color}`;
    const cached = this.tiles.get(key);
    if (cached) return cached;

    const tile = document.createElement("canvas");
    tile.width = CELL;
    tile.height = CELL;
    const ctx = tile.getContext("2d")!;
    const radius = Math.max(2, Math.round(CELL * 0.14));

    ctx.globalAlpha = 0.16;
    ctx.fillStyle = color;
    this.roundedRect(ctx, 2, 2, CELL - 4, CELL - 4, radius);
    ctx.fill();

    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    this.roundedRect(ctx, 2.5, 2.5, CELL - 5, CELL - 5, radius);
    ctx.stroke();
    ctx.globalAlpha = 1;

    this.tiles.set(key, tile);
    return tile;
  }

  private roundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    radius: number,
  ): void {
    const r = Math.min(radius, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}
