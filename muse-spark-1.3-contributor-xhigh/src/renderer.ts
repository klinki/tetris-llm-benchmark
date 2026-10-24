import { COLS, HIDDEN_ROWS, TOTAL_ROWS, VISIBLE_ROWS } from "./constants.js";
import { COLORS, boxSize, cellsFor, type PieceKind } from "./tetromino.js";
import type { Game } from "./game.js";

function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, Math.round(((n >> 16) & 255) * f)));
  const g = Math.min(255, Math.max(0, Math.round(((n >> 8) & 255) * f)));
  const b = Math.min(255, Math.max(0, Math.round((n & 255) * f)));
  return `rgb(${r},${g},${b})`;
}

export class Renderer {
  private boardCtx: CanvasRenderingContext2D;
  private holdCtx: CanvasRenderingContext2D;
  private nextCtx: CanvasRenderingContext2D;
  private cell = 30;
  private scoreEl: HTMLElement | null;
  private levelEl: HTMLElement | null;
  private linesEl: HTMLElement | null;
  private overlay: HTMLElement | null;
  private overlayText: HTMLElement | null;

  constructor(
    private boardCanvas: HTMLCanvasElement,
    private holdCanvas: HTMLCanvasElement,
    private nextCanvas: HTMLCanvasElement,
  ) {
    const b = boardCanvas.getContext("2d");
    const h = holdCanvas.getContext("2d");
    const n = nextCanvas.getContext("2d");
    if (!b || !h || !n) throw new Error("Canvas 2D not supported");
    this.boardCtx = b;
    this.holdCtx = h;
    this.nextCtx = n;
    this.scoreEl = document.getElementById("score");
    this.levelEl = document.getElementById("level");
    this.linesEl = document.getElementById("lines");
    this.overlay = document.getElementById("overlay");
    this.overlayText = document.getElementById("overlay-text");
  }

  render(game: Game): void {
    this.drawBoard(game);
    this.drawHold(game.hold);
    this.drawNext(game.nextQueue.slice(0, 5));
    if (this.scoreEl) this.scoreEl.textContent = String(game.score);
    if (this.levelEl) this.levelEl.textContent = String(game.level);
    if (this.linesEl) this.linesEl.textContent = String(game.lines);
    if (this.overlay) {
      if (game.gameOver) {
        this.overlay.classList.remove("hidden");
        if (this.overlayText) this.overlayText.textContent = "Game Over";
      } else {
        this.overlay.classList.add("hidden");
      }
    }
  }

  private drawBlock(
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    size: number,
    color: string,
    ghost = false,
  ): void {
    if (ghost) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px + 1, py + 1, size - 2, size - 2);
      return;
    }
    ctx.fillStyle = color;
    ctx.fillRect(px, py, size, size);
    ctx.fillStyle = shade(color, 1.35);
    ctx.fillRect(px, py, size, 3);
    ctx.fillRect(px, py, 3, size);
    ctx.fillStyle = shade(color, 0.6);
    ctx.fillRect(px, py + size - 3, size, 3);
    ctx.fillRect(px + size - 3, py, 3, size);
  }

  private drawBoard(game: Game): void {
    const ctx = this.boardCtx;
    const s = this.cell;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, COLS * s, VISIBLE_ROWS * s);

    // Locked blocks (visible rows only).
    for (let r = HIDDEN_ROWS; r < TOTAL_ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const kind = game.board.grid[r][c];
        if (kind) {
          this.drawBlock(ctx, c * s, (r - HIDDEN_ROWS) * s, s, COLORS[kind]);
        }
      }
    }

    // Ghost piece.
    if (game.current && !game.gameOver) {
      for (const cell of game.ghostCells()) {
        const vr = cell.y - HIDDEN_ROWS;
        if (vr < 0) continue;
        this.drawBlock(ctx, cell.x * s, vr * s, s, COLORS[game.current.kind], true);
      }
    }

    // Active piece.
    if (game.current) {
      for (const cell of game.currentCells()) {
        const vr = cell.y - HIDDEN_ROWS;
        if (vr < 0) continue;
        this.drawBlock(ctx, cell.x * s, vr * s, s, COLORS[game.current.kind]);
      }
    }

    // Grid lines.
    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let c = 1; c < COLS; c++) {
      ctx.moveTo(c * s + 0.5, 0);
      ctx.lineTo(c * s + 0.5, VISIBLE_ROWS * s);
    }
    for (let r = 1; r < VISIBLE_ROWS; r++) {
      ctx.moveTo(0, r * s + 0.5);
      ctx.lineTo(COLS * s, r * s + 0.5);
    }
    ctx.stroke();
  }

  private drawPreview(
    ctx: CanvasRenderingContext2D,
    kind: PieceKind | null,
    ox: number,
    oy: number,
    boxW: number,
    boxH: number,
  ): void {
    ctx.fillStyle = "#000";
    ctx.fillRect(ox, oy, boxW, boxH);
    if (!kind) return;
    const cells = cellsFor(kind, 0);
    const size = boxSize(kind);
    // Center the piece in its preview box.
    const s = 16;
    const w = size * s;
    const offsetX = ox + (boxW - w) / 2;
    const offsetY = oy + (boxH - w) / 2;
    for (const c of cells) {
      this.drawBlock(ctx, offsetX + c.x * s, offsetY + c.y * s, s, COLORS[kind]);
    }
  }

  private drawHold(kind: PieceKind | null): void {
    this.drawPreview(this.holdCtx, kind, 0, 0, this.holdCanvas.width, this.holdCanvas.height);
  }

  private drawNext(queue: PieceKind[]): void {
    const ctx = this.nextCtx;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
    const slotH = this.nextCanvas.height / 5;
    queue.forEach((kind, i) => {
      this.drawPreview(ctx, kind, 0, i * slotH, this.nextCanvas.width, slotH);
    });
  }
}
