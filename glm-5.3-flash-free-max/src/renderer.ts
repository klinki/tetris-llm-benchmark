/**
 * Canvas renderer: draws the playfield, ghost piece, active piece, hold slot,
 * next queue, statistics and overlays. One canvas, no DOM churn per frame.
 */

import {
  COLS,
  HIDDEN_ROWS,
  VISIBLE_ROWS,
} from "./constants.js";
import type { Game } from "./game.js";
import { COLORS, GHOST_ALPHA, cellsOf, type PieceType } from "./tetromino.js";

const CELL = 32;
const BOARD_X = 12;
const BOARD_Y = 12;
const BOARD_W = COLS * CELL;
const BOARD_H = VISIBLE_ROWS * CELL;
const PANEL_X = BOARD_X + BOARD_W + 14;
const PANEL_W = 240;
const CANVAS_W = PANEL_X + PANEL_W + 12;
const CANVAS_H = BOARD_Y * 2 + BOARD_H;
// (index.html canvas attributes and the styles.css width ratio must be kept in
// sync with CANVAS_W x CANVAS_H = 598x664.)

const PREVIEW_CELL = 13;
const PREVIEW_SLOT_H = 46;

const PANEL_TEXT = "#8b93a7";
const VALUE_TEXT = "#e6e9f0";
const LABEL_FONT = "600 11px ui-sans-serif, system-ui, sans-serif";
const VALUE_FONT = "600 17px ui-sans-serif, system-ui, sans-serif";
const SMALL_FONT = "11px ui-sans-serif, system-ui, sans-serif";

const CONTROLS: ReadonlyArray<readonly [string, string]> = [
  ["←/→", "move"],
  ["↑/X", "rotate cw"],
  ["Z/Ctrl", "rotate ccw"],
  ["↓", "soft drop"],
  ["Space", "hard drop"],
  ["C", "hold"],
  ["R", "restart"],
];

export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas 2d context unavailable");
    this.ctx = ctx;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  render(game: Game): void {
    const ctx = this.ctx;
    ctx.fillStyle = "#101319";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    this.drawBoard(game);
    this.drawPanel(game);

    if (game.messageTimer > 0 && game.message) this.drawMessage(game);
    if (game.state === "over") this.drawGameOver(game);
  }

  // -- Board ----------------------------------------------------------------

  private drawBoard(game: Game): void {
    const ctx = this.ctx;

    ctx.fillStyle = "#06070b";
    ctx.fillRect(BOARD_X, BOARD_Y, BOARD_W, BOARD_H);

    ctx.save();
    ctx.beginPath();
    ctx.rect(BOARD_X, BOARD_Y, BOARD_W, BOARD_H);
    ctx.clip();

    // faint grid
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 1; x < COLS; x++) {
      ctx.moveTo(BOARD_X + x * CELL + 0.5, BOARD_Y);
      ctx.lineTo(BOARD_X + x * CELL + 0.5, BOARD_Y + BOARD_H);
    }
    for (let y = 1; y < VISIBLE_ROWS; y++) {
      ctx.moveTo(BOARD_X, BOARD_Y + y * CELL + 0.5);
      ctx.lineTo(BOARD_X + BOARD_W, BOARD_Y + y * CELL + 0.5);
    }
    ctx.stroke();

    // locked cells
    for (let y = HIDDEN_ROWS; y < HIDDEN_ROWS + VISIBLE_ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const type = game.field.cells[y][x];
        if (type) {
          this.drawCell(
            BOARD_X + x * CELL,
            BOARD_Y + (y - HIDDEN_ROWS) * CELL,
            CELL,
            COLORS[type],
            COLORS[type],
          );
        }
      }
    }

    // ghost piece
    const ghost = game.ghost();
    if (ghost) {
      for (const [dx, dy] of cellsOf(ghost.type, ghost.rot)) {
        const rowY = ghost.y + dy;
        if (rowY < HIDDEN_ROWS) continue;
        const x = BOARD_X + (ghost.x + dx) * CELL;
        const y = BOARD_Y + (rowY - HIDDEN_ROWS) * CELL;
        ctx.globalAlpha = GHOST_ALPHA;
        this.drawCell(x, y, CELL, COLORS[ghost.type], COLORS[ghost.type]);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = COLORS[ghost.type];
        ctx.strokeRect(x + 2.5, y + 2.5, CELL - 5, CELL - 5);
      }
    }

    // active piece
    if (game.piece) {
      for (const [dx, dy] of cellsOf(game.piece.type, game.piece.rot)) {
        const rowY = game.piece.y + dy;
        if (rowY < HIDDEN_ROWS) continue;
        this.drawCell(
          BOARD_X + (game.piece.x + dx) * CELL,
          BOARD_Y + (rowY - HIDDEN_ROWS) * CELL,
          CELL,
          COLORS[game.piece.type],
          "#fff",
        );
      }
    }

    ctx.restore();

    // frame + skyline
    ctx.strokeStyle = "#2a3140";
    ctx.lineWidth = 2;
    ctx.strokeRect(BOARD_X - 1, BOARD_Y - 1, BOARD_W + 2, BOARD_H + 2);
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.beginPath();
    ctx.moveTo(BOARD_X, BOARD_Y + 0.5);
    ctx.lineTo(BOARD_X + BOARD_W, BOARD_Y + 0.5);
    ctx.stroke();
  }

  /** Chunky bevelled cell used everywhere. */
  private drawCell(x: number, y: number, size: number, color: string, edge: string): void {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.fillRect(x + 1, y + 1, size - 2, Math.max(2, size * 0.08));
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fillRect(x + 1, y + size - 1 - Math.max(2, size * 0.08), size - 2, Math.max(2, size * 0.08));
    ctx.strokeStyle = edge;
    ctx.globalAlpha = 0.25;
    ctx.strokeRect(x + 1.5, y + 1.5, size - 3, size - 3);
    ctx.globalAlpha = 1;
  }

  // -- Side panel -----------------------------------------------------------

  private drawPanel(game: Game): void {
    const ctx = this.ctx;
    let y = BOARD_Y;

    this.label("HOLD", PANEL_X, y);
    this.preview(game.hold, PANEL_X, y + 20);

    y += 20 + PREVIEW_SLOT_H + 8;
    this.label("NEXT", PANEL_X, y);
    y += 20;
    for (let i = 0; i < game.nextQueue.length; i++) {
      this.preview(game.nextQueue[i], PANEL_X, y);
      y += PREVIEW_SLOT_H + 4;
    }

    y += 10;
    this.label("LEVEL", PANEL_X, y);
    this.value(String(game.level), PANEL_X, y + 20);
    this.label("LINES", PANEL_X + 84, y);
    this.value(String(game.lines), PANEL_X + 84, y + 20);
    y += 46;
    this.label("SCORE", PANEL_X, y);
    this.value(game.score.toLocaleString("en-US"), PANEL_X, y + 20);
    y += 50;

    if (game.combo > 0) this.label(`COMBO x${game.combo}`, PANEL_X, y);
    else if (game.backToBack) this.label("BACK-TO-BACK READY", PANEL_X, y);

    y = CANVAS_H - 26 - CONTROLS.length * 15;
    ctx.font = SMALL_FONT;
    ctx.fillStyle = PANEL_TEXT;
    ctx.fillText("CONTROLS", PANEL_X, y);
    y += 15;
    for (const [key, what] of CONTROLS) {
      ctx.fillStyle = "#c3c9d9";
      ctx.fillText(key.padEnd(8, " "), PANEL_X, y);
      ctx.fillStyle = PANEL_TEXT;
      ctx.fillText(what, PANEL_X + 74, y);
      y += 15;
    }
  }

  private label(text: string, x: number, y: number): void {
    this.ctx.font = LABEL_FONT;
    this.ctx.fillStyle = PANEL_TEXT;
    this.ctx.fillText(text, x, y + 9);
  }

  private value(text: string, x: number, y: number): void {
    this.ctx.font = VALUE_FONT;
    this.ctx.fillStyle = VALUE_TEXT;
    this.ctx.fillText(text, x, y + 9);
  }

  /** Draw a piece centred in a small slot, or a dim placeholder when empty. */
  private preview(type: PieceType | null, x: number, y: number): void {
    const ctx = this.ctx;
    ctx.fillStyle = "#0a0d13";
    ctx.fillRect(x - 6, y - 4, 96, PREVIEW_SLOT_H);
    if (!type) {
      ctx.strokeStyle = "#1d2331";
      ctx.setLineDash([3, 4]);
      ctx.strokeRect(x - 2.5, y + 0.5, 88, PREVIEW_SLOT_H - 10);
      ctx.setLineDash([]);
      return;
    }
    const cells = cellsOf(type, 0);
    let [minX, minY, maxX, maxY] = [Infinity, Infinity, -Infinity, -Infinity];
    for (const [cx, cy] of cells) {
      minX = Math.min(minX, cx); maxX = Math.max(maxX, cx);
      minY = Math.min(minY, cy); maxY = Math.max(maxY, cy);
    }
    const w = (maxX - minX + 1) * PREVIEW_CELL;
    const h = (maxY - minY + 1) * PREVIEW_CELL;
    const ox = x + (88 - w) / 2 - minX * PREVIEW_CELL;
    const oy = y + (PREVIEW_SLOT_H - 8 - h) / 2 - minY * PREVIEW_CELL;
    for (const [cx, cy] of cells) {
      this.drawCell(ox + cx * PREVIEW_CELL, oy + cy * PREVIEW_CELL, PREVIEW_CELL, COLORS[type], "none");
    }
  }

  // -- Overlays -------------------------------------------------------------

  private drawMessage(game: Game): void {
    const ctx = this.ctx;
    const alpha = Math.min(1, game.messageTimer / 600);
    ctx.globalAlpha = alpha;
    ctx.font = "700 18px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = game.message.includes("B2B") ? "#ffd76a" : "#ffffff";
    ctx.fillText(game.message, BOARD_X + BOARD_W / 2, BOARD_Y + 34);
    ctx.textAlign = "start";
    ctx.globalAlpha = 1;
  }

  private drawGameOver(game: Game): void {
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(6,7,11,0.82)";
    ctx.fillRect(BOARD_X, BOARD_Y, BOARD_W, BOARD_H);
    ctx.textAlign = "center";
    ctx.fillStyle = "#ef2029";
    ctx.font = "700 34px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText("GAME OVER", BOARD_X + BOARD_W / 2, BOARD_Y + BOARD_H / 2 - 46);
    ctx.fillStyle = VALUE_TEXT;
    ctx.font = "600 18px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText(`score ${game.score.toLocaleString("en-US")}`, BOARD_X + BOARD_W / 2, BOARD_Y + BOARD_H / 2 - 10);
    ctx.fillStyle = PANEL_TEXT;
    ctx.font = "600 14px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText("press R to restart", BOARD_X + BOARD_W / 2, BOARD_Y + BOARD_H / 2 + 22);
    ctx.textAlign = "start";
  }
}
