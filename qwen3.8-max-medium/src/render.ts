import { BOARD_HEIGHT, BOARD_WIDTH, HIDDEN_ROWS } from "./board.js";
import { Game } from "./game.js";
import { COLORS, PALETTE, PieceType, STATES } from "./pieces.js";

/** Canvas rendering: playfield with ghost piece, hold slot, next queue, stats. */

const CELL = 30;
const MINI = 20;
const NEXT_SLOTS = 5;
const NEXT_SLOT_HEIGHT = 88;

function forEachCell(matrix: number[][], fn: (row: number, col: number) => void): void {
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c]) fn(r, c);
    }
  }
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fillRect(x + 1, y + 1, size - 2, 4);
  ctx.fillStyle = "rgba(0,0,0,0.30)";
  ctx.fillRect(x + 1, y + size - 5, size - 2, 4);
}

function bounds(matrix: number[][]): { minR: number; maxR: number; minC: number; maxC: number } {
  let minR = matrix.length, maxR = -1, minC = matrix.length, maxC = -1;
  forEachCell(matrix, (r, c) => {
    minR = Math.min(minR, r);
    maxR = Math.max(maxR, r);
    minC = Math.min(minC, c);
    maxC = Math.max(maxC, c);
  });
  return { minR, maxR, minC, maxC };
}

/** Draw a piece centered on (centerX, centerY), used for hold and next previews. */
function drawMini(
  ctx: CanvasRenderingContext2D,
  type: PieceType,
  centerX: number,
  centerY: number,
): void {
  const matrix = STATES[type][0];
  const b = bounds(matrix);
  const x0 = centerX - ((b.maxC - b.minC + 1) * MINI) / 2;
  const y0 = centerY - ((b.maxR - b.minR + 1) * MINI) / 2;
  forEachCell(matrix, (r, c) =>
    drawCell(ctx, x0 + (c - b.minC) * MINI, y0 + (r - b.minR) * MINI, MINI, COLORS[type]),
  );
}

export class Renderer {
  private boardCtx: CanvasRenderingContext2D;
  private holdCtx: CanvasRenderingContext2D;
  private nextCtx: CanvasRenderingContext2D;

  constructor(
    private boardCanvas: HTMLCanvasElement,
    holdCanvas: HTMLCanvasElement,
    nextCanvas: HTMLCanvasElement,
    private scoreEl: HTMLElement,
    private levelEl: HTMLElement,
    private linesEl: HTMLElement,
    private messageEl: HTMLElement,
  ) {
    this.boardCtx = boardCanvas.getContext("2d")!;
    this.holdCtx = holdCanvas.getContext("2d")!;
    this.nextCtx = nextCanvas.getContext("2d")!;
  }

  draw(game: Game): void {
    this.drawBoard(game);
    this.drawHold(game);
    this.drawNext(game);
    this.scoreEl.textContent = String(game.score);
    this.levelEl.textContent = String(game.level);
    this.linesEl.textContent = String(game.lines);
    this.messageEl.textContent = game.lastClear ? game.lastClear.text : "";
  }

  private drawBoard(game: Game): void {
    const ctx = this.boardCtx;
    const w = this.boardCanvas.width;
    const h = this.boardCanvas.height;
    ctx.fillStyle = "#10131a";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let c = 1; c < BOARD_WIDTH; c++) {
      ctx.moveTo(c * CELL + 0.5, 0);
      ctx.lineTo(c * CELL + 0.5, h);
    }
    for (let r = 1; r < BOARD_HEIGHT - HIDDEN_ROWS; r++) {
      ctx.moveTo(0, r * CELL + 0.5);
      ctx.lineTo(w, r * CELL + 0.5);
    }
    ctx.stroke();

    for (let r = HIDDEN_ROWS; r < BOARD_HEIGHT; r++) {
      for (let c = 0; c < BOARD_WIDTH; c++) {
        const id = game.board.cells[r * BOARD_WIDTH + c];
        if (id) drawCell(ctx, c * CELL, (r - HIDDEN_ROWS) * CELL, CELL, PALETTE[id]);
      }
    }

    const p = game.current;
    if (p && !game.gameOver) {
      const matrix = STATES[p.type][p.rot];
      const ghostRow = game.dropPosition();
      ctx.globalAlpha = 0.22;
      forEachCell(matrix, (r, c) =>
        drawCell(ctx, (p.col + c) * CELL, (ghostRow + r - HIDDEN_ROWS) * CELL, CELL, COLORS[p.type]),
      );
      ctx.globalAlpha = 1;
      forEachCell(matrix, (r, c) =>
        drawCell(ctx, (p.col + c) * CELL, (p.row + r - HIDDEN_ROWS) * CELL, CELL, COLORS[p.type]),
      );
    }

    if (game.gameOver) this.overlay("GAME OVER", "Press R to restart");
    else if (game.paused) this.overlay("PAUSED", "Press P to resume");
  }

  private overlay(title: string, subtitle: string): void {
    const ctx = this.boardCtx;
    const w = this.boardCanvas.width;
    const h = this.boardCanvas.height;
    ctx.fillStyle = "rgba(5,7,12,0.75)";
    ctx.fillRect(0, 0, w, h);
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px system-ui, sans-serif";
    ctx.fillText(title, w / 2, h / 2 - 10);
    ctx.fillStyle = "#aab2c5";
    ctx.font = "16px system-ui, sans-serif";
    ctx.fillText(subtitle, w / 2, h / 2 + 22);
  }

  private drawHold(game: Game): void {
    const ctx = this.holdCtx;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    if (!game.hold) return;
    ctx.globalAlpha = game.canHold ? 1 : 0.35;
    drawMini(ctx, game.hold, ctx.canvas.width / 2, ctx.canvas.height / 2);
    ctx.globalAlpha = 1;
  }

  private drawNext(game: Game): void {
    const ctx = this.nextCtx;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const shown = Math.min(NEXT_SLOTS, game.nextQueue.length);
    for (let i = 0; i < shown; i++) {
      drawMini(ctx, game.nextQueue[i], ctx.canvas.width / 2, i * NEXT_SLOT_HEIGHT + NEXT_SLOT_HEIGHT / 2);
    }
  }
}
