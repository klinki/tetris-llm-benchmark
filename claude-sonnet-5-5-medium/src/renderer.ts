import { COLS, HIDDEN, PREVIEW_COUNT, ROWS, type Game } from "./game.js";
import { COLORS, SHAPES, type PieceType } from "./pieces.js";

const CELL = 30;
const SIDE = 140;
const VISIBLE_ROWS = ROWS - HIDDEN;
const BOARD_W = COLS * CELL;
const BOARD_H = VISIBLE_ROWS * CELL;
const WIDTH = SIDE + BOARD_W + SIDE;

export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas is not supported");
    this.ctx = ctx;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = WIDTH * dpr;
    canvas.height = BOARD_H * dpr;
    canvas.style.width = `${WIDTH}px`;
    canvas.style.height = `${BOARD_H}px`;
    ctx.scale(dpr, dpr);
  }

  draw(game: Game): void {
    const { ctx } = this;
    ctx.clearRect(0, 0, WIDTH, BOARD_H);
    this.drawBoard(game);
    this.drawHold(game);
    this.drawSidebar(game);
    if (game.gameOver) this.drawGameOver();
  }

  private drawBoard(game: Game): void {
    const { ctx } = this;
    ctx.save();
    ctx.translate(SIDE, -HIDDEN * CELL);

    ctx.fillStyle = "#0a0a14";
    ctx.fillRect(0, HIDDEN * CELL, BOARD_W, BOARD_H);
    ctx.strokeStyle = "#1c1c2c";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= COLS; x++) {
      ctx.moveTo(x * CELL + 0.5, HIDDEN * CELL);
      ctx.lineTo(x * CELL + 0.5, ROWS * CELL);
    }
    for (let y = HIDDEN; y <= ROWS; y++) {
      ctx.moveTo(0, y * CELL + 0.5);
      ctx.lineTo(BOARD_W, y * CELL + 0.5);
    }
    ctx.stroke();

    for (let y = HIDDEN; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const type = game.board[y * COLS + x];
        if (type) this.drawCell(x * CELL, y * CELL, CELL, COLORS[type]);
      }
    }

    if (!game.gameOver) {
      for (const [x, y] of game.cellsOf(game.ghost())) {
        if (y < HIDDEN) continue;
        ctx.strokeStyle = COLORS[game.active.type];
        ctx.globalAlpha = 0.6;
        ctx.strokeRect(x * CELL + 2.5, y * CELL + 2.5, CELL - 5, CELL - 5);
        ctx.globalAlpha = 1;
      }
    }
    for (const [x, y] of game.cellsOf(game.active)) {
      if (y >= HIDDEN) this.drawCell(x * CELL, y * CELL, CELL, COLORS[game.active.type]);
    }

    ctx.strokeStyle = "#556";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, HIDDEN * CELL, BOARD_W, BOARD_H);
    ctx.restore();
  }

  private drawHold(game: Game): void {
    this.label("HOLD", 20, 30);
    if (game.held) this.drawPreview(game.held, 20, 40, 24);
  }

  private drawSidebar(game: Game): void {
    const x = SIDE + BOARD_W + 20;
    this.label("NEXT", x, 30);
    for (let i = 0; i < PREVIEW_COUNT; i++) {
      this.drawPreview(game.queue[i], x, 40 + i * 62, 24);
    }
    this.label("SCORE", x, 380);
    this.value(String(game.score), x, 404);
    this.label("LINES", x, 440);
    this.value(String(game.lines), x, 464);
    this.label("LEVEL", x, 500);
    this.value(String(game.level), x, 524);
    if (game.message) this.value(game.message, x, 570, 15);
  }

  private drawPreview(type: PieceType, left: number, top: number, size: number): void {
    const cells = SHAPES[type][0];
    const xs = cells.map(([x]) => x);
    const ys = cells.map(([, y]) => y);
    const offsetX = (4 - (Math.max(...xs) - Math.min(...xs) + 1)) / 2 - Math.min(...xs);
    const offsetY = (2 - (Math.max(...ys) - Math.min(...ys) + 1)) / 2 - Math.min(...ys);
    for (const [x, y] of cells) {
      this.drawCell(left + (x + offsetX) * size, top + (y + offsetY) * size, size, COLORS[type]);
    }
  }

  private drawCell(x: number, y: number, size: number, color: string): void {
    const { ctx } = this;
    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillRect(x + 1, y + 1, size - 2, 3);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(x + 1, y + size - 4, size - 2, 3);
  }

  private drawGameOver(): void {
    const { ctx } = this;
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(SIDE, 0, BOARD_W, BOARD_H);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = "bold 32px sans-serif";
    ctx.fillText("GAME OVER", SIDE + BOARD_W / 2, BOARD_H / 2 - 10);
    ctx.font = "18px sans-serif";
    ctx.fillText("Press R to restart", SIDE + BOARD_W / 2, BOARD_H / 2 + 24);
    ctx.textAlign = "left";
  }

  private label(text: string, x: number, y: number): void {
    this.ctx.fillStyle = "#889";
    this.ctx.font = "bold 14px sans-serif";
    this.ctx.fillText(text, x, y);
  }

  private value(text: string, x: number, y: number, size = 22): void {
    this.ctx.fillStyle = "#fff";
    this.ctx.font = `bold ${size}px sans-serif`;
    this.ctx.fillText(text, x, y);
  }
}
