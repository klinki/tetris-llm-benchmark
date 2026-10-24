import { COLS, HIDDEN_ROWS, ROWS, VISIBLE_ROWS } from "./constants.js";
import type { Game } from "./game.js";
import { cellsOf, COLORS, SHAPES, type Piece, type PieceType } from "./pieces.js";

const CELL = 30;
const PREVIEW_CELL = 22;
const PADDING = 16;
const SIDE_WIDTH = 150;

const BOARD_X = PADDING + SIDE_WIDTH + PADDING;
const BOARD_Y = PADDING;
const BOARD_WIDTH = COLS * CELL;
const BOARD_HEIGHT = VISIBLE_ROWS * CELL;
const RIGHT_X = BOARD_X + BOARD_WIDTH + PADDING;

export const CANVAS_WIDTH = RIGHT_X + SIDE_WIDTH + PADDING;
export const CANVAS_HEIGHT = BOARD_HEIGHT + 2 * PADDING;

const BACKGROUND = "#0b0e17";
const BOARD_BACKGROUND = "#121726";
const GRID_LINE = "#1c2236";
const TEXT = "#e8ecf6";
const MUTED_TEXT = "#7d88a8";
const FONT = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

/** Draws the whole game (board, hold, next queue and stats) onto a canvas. */
export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = CANVAS_WIDTH * ratio;
    canvas.height = CANVAS_HEIGHT * ratio;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas is not supported by this browser");
    ctx.scale(ratio, ratio);
    this.ctx = ctx;
  }

  draw(game: Game): void {
    const { ctx } = this;
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.drawBoard(game);
    this.drawPreview("HOLD", PADDING, BOARD_Y, game.hold ? [game.hold] : [], !game.canHold);
    this.drawPreview("NEXT", RIGHT_X, BOARD_Y, game.next);
    this.drawStats(game);
    this.drawOverlay(game);
  }

  private drawBoard(game: Game): void {
    const { ctx } = this;
    ctx.fillStyle = BOARD_BACKGROUND;
    ctx.fillRect(BOARD_X, BOARD_Y, BOARD_WIDTH, BOARD_HEIGHT);

    ctx.strokeStyle = GRID_LINE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 1; x < COLS; x++) {
      ctx.moveTo(BOARD_X + x * CELL + 0.5, BOARD_Y);
      ctx.lineTo(BOARD_X + x * CELL + 0.5, BOARD_Y + BOARD_HEIGHT);
    }
    for (let y = 1; y < VISIBLE_ROWS; y++) {
      ctx.moveTo(BOARD_X, BOARD_Y + y * CELL + 0.5);
      ctx.lineTo(BOARD_X + BOARD_WIDTH, BOARD_Y + y * CELL + 0.5);
    }
    ctx.stroke();

    for (let y = HIDDEN_ROWS; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const type = game.board.get(x, y);
        if (type) this.drawBlock(this.boardX(x), this.boardY(y), CELL, COLORS[type]);
      }
    }

    if (game.status === "gameOver") return;
    this.drawBoardPiece(game.ghost(), true);
    this.drawBoardPiece(game.piece, false);
  }

  private drawBoardPiece(piece: Piece, ghost: boolean): void {
    for (const [x, y] of cellsOf(piece)) {
      if (y < HIDDEN_ROWS) continue;
      if (ghost) this.drawGhostBlock(this.boardX(x), this.boardY(y), COLORS[piece.type]);
      else this.drawBlock(this.boardX(x), this.boardY(y), CELL, COLORS[piece.type]);
    }
  }

  /** A titled box showing one or more pieces stacked vertically. */
  private drawPreview(title: string, left: number, top: number, types: readonly PieceType[], dimmed = false): void {
    const { ctx } = this;
    ctx.fillStyle = MUTED_TEXT;
    ctx.font = `bold 14px ${FONT}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(title, left, top);

    const slotHeight = 3 * PREVIEW_CELL;
    const boxTop = top + 24;
    ctx.fillStyle = BOARD_BACKGROUND;
    ctx.fillRect(left, boxTop, SIDE_WIDTH, Math.max(1, types.length) * slotHeight + 8);

    ctx.globalAlpha = dimmed ? 0.35 : 1;
    types.forEach((type, i) => this.drawPreviewPiece(type, left, boxTop + 4 + i * slotHeight, slotHeight));
    ctx.globalAlpha = 1;
  }

  private drawPreviewPiece(type: PieceType, left: number, top: number, slotHeight: number): void {
    const cells = SHAPES[type].rotations[0];
    const xs = cells.map(([x]) => x);
    const ys = cells.map(([, y]) => y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const width = (Math.max(...xs) - minX + 1) * PREVIEW_CELL;
    const height = (Math.max(...ys) - minY + 1) * PREVIEW_CELL;

    const originX = left + (SIDE_WIDTH - width) / 2;
    const originY = top + (slotHeight - height) / 2;
    for (const [x, y] of cells) {
      this.drawBlock(originX + (x - minX) * PREVIEW_CELL, originY + (y - minY) * PREVIEW_CELL, PREVIEW_CELL, COLORS[type]);
    }
  }

  private drawStats(game: Game): void {
    const { ctx } = this;
    const stats: [string, string][] = [
      ["SCORE", game.score.toString()],
      ["LEVEL", game.level.toString()],
      ["LINES", game.lines.toString()],
    ];

    let y = BOARD_Y + 170;
    for (const [label, value] of stats) {
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = MUTED_TEXT;
      ctx.font = `bold 14px ${FONT}`;
      ctx.fillText(label, PADDING, y);
      ctx.fillStyle = TEXT;
      ctx.font = `bold 24px ${FONT}`;
      ctx.fillText(value, PADDING, y + 20);
      y += 64;
    }

    ctx.fillStyle = COLORS.T;
    ctx.font = `bold 14px ${FONT}`;
    game.announcement.forEach((line, i) => ctx.fillText(line.toUpperCase(), PADDING, y + 4 + i * 20));
  }

  private drawOverlay(game: Game): void {
    if (game.status === "playing") return;
    const { ctx } = this;
    ctx.fillStyle = "rgba(5, 7, 12, 0.72)";
    ctx.fillRect(BOARD_X, BOARD_Y, BOARD_WIDTH, BOARD_HEIGHT);

    const centerX = BOARD_X + BOARD_WIDTH / 2;
    const centerY = BOARD_Y + BOARD_HEIGHT / 2;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = TEXT;
    ctx.font = `bold 32px ${FONT}`;
    ctx.fillText(game.status === "paused" ? "PAUSED" : "GAME OVER", centerX, centerY - 14);
    ctx.fillStyle = MUTED_TEXT;
    ctx.font = `16px ${FONT}`;
    ctx.fillText(game.status === "paused" ? "P to resume" : "R to restart", centerX, centerY + 24);
  }

  private boardX(x: number): number {
    return BOARD_X + x * CELL;
  }

  private boardY(y: number): number {
    return BOARD_Y + (y - HIDDEN_ROWS) * CELL;
  }

  private drawBlock(x: number, y: number, size: number, color: string): void {
    const { ctx } = this;
    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.28)";
    ctx.fillRect(x + 1, y + 1, size - 2, 3);
    ctx.fillRect(x + 1, y + 1, 3, size - 2);
    ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
    ctx.fillRect(x + 1, y + size - 4, size - 2, 3);
    ctx.fillRect(x + size - 4, y + 1, 3, size - 2);
  }

  private drawGhostBlock(x: number, y: number, color: string): void {
    const { ctx } = this;
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 2, y + 2, CELL - 4, CELL - 4);
    ctx.globalAlpha = 1;
  }
}
