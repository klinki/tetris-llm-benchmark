/** Canvas renderer for the playfield, hold slot, next queue and HUD. */

import { BOARD_HEIGHT, BOARD_WIDTH, HIDDEN_ROWS, NEXT_QUEUE_SIZE } from "../core/constants.js";
import type { Game } from "../core/game.js";
import {
  PIECE_COLORS,
  activeCells,
  pieceBounds,
  shapeCells,
  type Point,
} from "../core/pieces.js";
import type { PieceType } from "../core/types.js";

const BOARD_CELL = 30;
const PREVIEW_WIDTH = 112;
const PREVIEW_SLOT_HEIGHT = 56;
const PREVIEW_CELL = 14;
const BLOCK_RADIUS = 5;

export interface HudElements {
  score: HTMLElement;
  level: HTMLElement;
  lines: HTMLElement;
  combo: HTMLElement;
  overlay: HTMLElement;
  finalScore: HTMLElement;
}

function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  ghost = false,
): void {
  if (ghost) {
    ctx.fillStyle = withAlpha(color, 0.14);
    roundedRect(ctx, x + 1, y + 1, size - 2, size - 2, BLOCK_RADIUS);
    ctx.fill();
    ctx.strokeStyle = withAlpha(color, 0.55);
    ctx.lineWidth = 2;
    roundedRect(ctx, x + 2, y + 2, size - 4, size - 4, BLOCK_RADIUS - 1);
    ctx.stroke();
    return;
  }

  ctx.fillStyle = color;
  roundedRect(ctx, x + 1, y + 1, size - 2, size - 2, BLOCK_RADIUS);
  ctx.fill();

  const shine = Math.max(2, Math.round(size * 0.09));
  ctx.fillStyle = "rgba(255, 255, 255, 0.30)";
  roundedRect(ctx, x + 3, y + 3, size - 6, shine, shine / 2);
  ctx.fill();

  ctx.fillStyle = "rgba(0, 0, 0, 0.24)";
  roundedRect(ctx, x + 3, y + size - 3 - shine, size - 6, shine, shine / 2);
  ctx.fill();
}

function setupCanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
): CanvasRenderingContext2D {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context is not available");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

function drawPreview(
  ctx: CanvasRenderingContext2D,
  type: PieceType,
  x: number,
  y: number,
  width: number,
  height: number,
  cell: number,
  alpha = 1,
): void {
  const bounds = pieceBounds(type);
  const offsetX = x + (width - bounds.width * cell) / 2 - bounds.minX * cell;
  const offsetY = y + (height - bounds.height * cell) / 2 - bounds.minY * cell;

  ctx.globalAlpha = alpha;
  for (const point of shapeCells(type, 0)) {
    drawBlock(ctx, offsetX + point.x * cell, offsetY + point.y * cell, cell, PIECE_COLORS[type]);
  }
  ctx.globalAlpha = 1;
}

export class Renderer {
  private readonly boardCtx: CanvasRenderingContext2D;
  private readonly nextCtx: CanvasRenderingContext2D;
  private readonly holdCtx: CanvasRenderingContext2D;
  private readonly boardWidth = BOARD_WIDTH * BOARD_CELL;
  private readonly boardHeight = BOARD_HEIGHT * BOARD_CELL;
  private readonly boardBackground: CanvasGradient;

  constructor(
    boardCanvas: HTMLCanvasElement,
    nextCanvas: HTMLCanvasElement,
    holdCanvas: HTMLCanvasElement,
    private readonly hud: HudElements,
  ) {
    this.boardCtx = setupCanvas(boardCanvas, this.boardWidth, this.boardHeight);
    this.nextCtx = setupCanvas(
      nextCanvas,
      PREVIEW_WIDTH,
      PREVIEW_SLOT_HEIGHT * NEXT_QUEUE_SIZE,
    );
    this.holdCtx = setupCanvas(holdCanvas, PREVIEW_WIDTH, PREVIEW_SLOT_HEIGHT);

    const gradient = this.boardCtx.createLinearGradient(0, 0, 0, this.boardHeight);
    gradient.addColorStop(0, "#0d1526");
    gradient.addColorStop(0.55, "#0a0f1e");
    gradient.addColorStop(1, "#080c18");
    this.boardBackground = gradient;
  }

  render(game: Game): void {
    this.renderBoard(game);
    this.renderNext(game);
    this.renderHold(game);
    this.updateHud(game);
  }

  private renderBoard(game: Game): void {
    const ctx = this.boardCtx;
    const cell = BOARD_CELL;

    ctx.clearRect(0, 0, this.boardWidth, this.boardHeight);
    ctx.fillStyle = this.boardBackground;
    ctx.fillRect(0, 0, this.boardWidth, this.boardHeight);

    // Spawn buffer above the visible field.
    ctx.fillStyle = "rgba(2, 6, 23, 0.5)";
    ctx.fillRect(0, 0, this.boardWidth, HIDDEN_ROWS * cell);

    ctx.strokeStyle = "rgba(148, 163, 184, 0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 1; x < BOARD_WIDTH; x += 1) {
      ctx.moveTo(x * cell + 0.5, 0);
      ctx.lineTo(x * cell + 0.5, this.boardHeight);
    }
    for (let y = 1; y < BOARD_HEIGHT; y += 1) {
      ctx.moveTo(0, y * cell + 0.5);
      ctx.lineTo(this.boardWidth, y * cell + 0.5);
    }
    ctx.stroke();

    ctx.strokeStyle = "rgba(103, 232, 249, 0.3)";
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(0, HIDDEN_ROWS * cell + 0.5);
    ctx.lineTo(this.boardWidth, HIDDEN_ROWS * cell + 0.5);
    ctx.stroke();
    ctx.setLineDash([]);

    for (let y = 0; y < BOARD_HEIGHT; y += 1) {
      for (let x = 0; x < BOARD_WIDTH; x += 1) {
        const value = game.board.getCell(x, y);
        if (value) {
          drawBlock(ctx, x * cell, y * cell, cell, PIECE_COLORS[value]);
        }
      }
    }

    const piece = game.active;
    if (!piece) return;

    const ghostY = game.getGhostY();
    if (ghostY > piece.y) {
      const ghostCells: Point[] = activeCells({ ...piece, y: ghostY });
      for (const point of ghostCells) {
        drawBlock(ctx, point.x * cell, point.y * cell, cell, PIECE_COLORS[piece.type], true);
      }
    }

    for (const point of activeCells(piece)) {
      drawBlock(ctx, point.x * cell, point.y * cell, cell, PIECE_COLORS[piece.type]);
    }
  }

  private renderNext(game: Game): void {
    const ctx = this.nextCtx;
    ctx.clearRect(0, 0, PREVIEW_WIDTH, PREVIEW_SLOT_HEIGHT * NEXT_QUEUE_SIZE);

    game.nextQueue.slice(0, NEXT_QUEUE_SIZE).forEach((type, index) => {
      const top = index * PREVIEW_SLOT_HEIGHT;
      if (index > 0) {
        ctx.strokeStyle = "rgba(148, 163, 184, 0.1)";
        ctx.beginPath();
        ctx.moveTo(8, top + 0.5);
        ctx.lineTo(PREVIEW_WIDTH - 8, top + 0.5);
        ctx.stroke();
      }
      drawPreview(ctx, type, 0, top, PREVIEW_WIDTH, PREVIEW_SLOT_HEIGHT, PREVIEW_CELL);
    });
  }

  private renderHold(game: Game): void {
    const ctx = this.holdCtx;
    ctx.clearRect(0, 0, PREVIEW_WIDTH, PREVIEW_SLOT_HEIGHT);
    if (!game.holdType) return;
    drawPreview(
      ctx,
      game.holdType,
      0,
      0,
      PREVIEW_WIDTH,
      PREVIEW_SLOT_HEIGHT,
      PREVIEW_CELL,
      game.canHold ? 1 : 0.35,
    );
  }

  private updateHud(game: Game): void {
    this.hud.score.textContent = game.score.toLocaleString();
    this.hud.level.textContent = String(game.level);
    this.hud.lines.textContent = String(game.lines);
    this.hud.combo.textContent = String(Math.max(0, game.combo));

    const gameOver = game.status === "gameover";
    this.hud.overlay.classList.toggle("visible", gameOver);
    if (gameOver) {
      this.hud.finalScore.textContent = game.score.toLocaleString();
    }
  }
}
