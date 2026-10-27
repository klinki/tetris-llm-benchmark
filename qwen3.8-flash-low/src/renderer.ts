import { Game, BOARD_WIDTH, VISIBLE_ROWS, HIDDEN_ROWS } from "./game.js";
import { COLORS, piecePreviewCells, type PieceType } from "./pieces.js";

const BLOCK = 30;
const FIELD_X = 20;
const FIELD_Y = 20;
const PANEL_X = FIELD_X + BOARD_WIDTH * BLOCK + 20; // 340
const MINI = 17; // preview block size
const BG = "#0e1117";
const PANEL = "#161b25";
const LINE = "rgba(255,255,255,0.05)";
const TEXT = "#dfe6f1";

/** Draws the whole game state to a canvas every animation frame. */
export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas context unavailable");
    this.ctx = ctx;
  }

  draw(game: Game): void {
    const ctx = this.ctx;
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawPanel(game);
    this.drawField(game);

    if (game.gameOver) this.drawGameOver();
  }

  private drawField(game: Game): void {
    const ctx = this.ctx;
    ctx.fillStyle = PANEL;
    ctx.fillRect(FIELD_X - 4, FIELD_Y - 4, BOARD_WIDTH * BLOCK + 8, VISIBLE_ROWS * BLOCK + 8);

    // Locked cells.
    for (let y = 0; y < VISIBLE_ROWS; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        const piece = game.board.grid[y + HIDDEN_ROWS][x];
        if (piece) this.drawBlock(x, y, COLORS[piece], 1);
      }
    }

    // Ghost piece.
    const ghost = game.ghostCells();
    if (ghost && game.piece) {
      for (const [gx, gy] of ghost) {
        if (gy >= HIDDEN_ROWS) this.drawGhostBlock(gx, gy - HIDDEN_ROWS, COLORS[game.piece.type]);
      }
    }

    // Active piece.
    const cells = game.cells();
    if (cells && game.piece) {
      for (const [px, py] of cells) {
        if (py >= HIDDEN_ROWS) this.drawBlock(px, py - HIDDEN_ROWS, COLORS[game.piece.type], 1);
      }
    }

    // Grid lines on top for readability.
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 1; x < BOARD_WIDTH; x++) {
      ctx.moveTo(FIELD_X + x * BLOCK + 0.5, FIELD_Y);
      ctx.lineTo(FIELD_X + x * BLOCK + 0.5, FIELD_Y + VISIBLE_ROWS * BLOCK);
    }
    for (let y = 1; y < VISIBLE_ROWS; y++) {
      ctx.moveTo(FIELD_X, FIELD_Y + y * BLOCK + 0.5);
      ctx.lineTo(FIELD_X + BOARD_WIDTH * BLOCK, FIELD_Y + y * BLOCK + 0.5);
    }
    ctx.stroke();
  }

  private drawPanel(game: Game): void {
    const ctx = this.ctx;
    ctx.fillStyle = TEXT;
    ctx.font = "bold 14px 'Segoe UI', system-ui, sans-serif";

    // Hold box.
    ctx.fillText("HOLD", PANEL_X, 30);
    this.drawPreviewBox(PANEL_X, 40, 100, 80);
    if (game.hold) {
      ctx.globalAlpha = game.canHold ? 1 : 0.4;
      this.drawMiniPiece(game.hold, PANEL_X, 40, 100, 80);
      ctx.globalAlpha = 1;
    }

    // Next queue.
    ctx.fillText("NEXT", PANEL_X, 150);
    for (let i = 0; i < game.queue.length && i < 5; i++) {
      const boxY = 162 + i * 66;
      this.drawPreviewBox(PANEL_X, boxY, 100, 58);
      this.drawMiniPiece(game.queue[i], PANEL_X, boxY, 100, 58);
    }

    // Stats.
    const statsX = PANEL_X + 120;
    ctx.textAlign = "right";
    ctx.font = "13px 'Segoe UI', system-ui, sans-serif";
    const stat = (label: string, value: string, y: number) => {
      ctx.fillStyle = "#8a93a5";
      ctx.fillText(label, statsX + 80 - 10, y);
      ctx.fillStyle = TEXT;
      ctx.font = "bold 16px 'Segoe UI', system-ui, sans-serif";
      ctx.fillText(value, statsX + 80 - 10, y + 22);
      ctx.font = "13px 'Segoe UI', system-ui, sans-serif";
    };
    stat("SCORE", String(game.score), 40);
    stat("BEST", String(game.best), 110);
    stat("LEVEL", String(game.level), 180);
    stat("LINES", String(game.lines), 250);
    ctx.textAlign = "left";
  }

  private drawPreviewBox(x: number, y: number, w: number, h: number): void {
    const ctx = this.ctx;
    ctx.fillStyle = PANEL;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }

  /** Draws a piece type centered inside a preview box at rotation 0. */
  private drawMiniPiece(type: PieceType, boxX: number, boxY: number, boxW: number, boxH: number): void {
    const cells = piecePreviewCells(type);
    const xs = cells.map(([x]) => x);
    const ys = cells.map(([, y]) => y);
    const w = (Math.max(...xs) - Math.min(...xs) + 1) * MINI;
    const h = (Math.max(...ys) - Math.min(...ys) + 1) * MINI;
    const offX = boxX + (boxW - w) / 2 - Math.min(...xs) * MINI;
    const offY = boxY + (boxH - h) / 2 - Math.min(...ys) * MINI;
    for (const [cx, cy] of cells) {
      this.drawBlockAt(offX + cx * MINI, offY + cy * MINI, MINI, COLORS[type], 1);
    }
  }

  private drawBlock(x: number, y: number, color: string, alpha: number): void {
    this.drawBlockAt(FIELD_X + x * BLOCK, FIELD_Y + y * BLOCK, BLOCK, color, alpha);
  }

  private drawBlockAt(px: number, py: number, size: number, color: string, alpha: number): void {
    const ctx = this.ctx;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(px + 1, py + 1, size - 2, size - 2);
    // Bevel: lighter top-left, darker bottom-right.
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillRect(px + 1, py + 1, size - 2, 3);
    ctx.fillRect(px + 1, py + 1, 3, size - 2);
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(px + 1, py + size - 4, size - 2, 3);
    ctx.fillRect(px + size - 4, py + 1, 3, size - 2);
    ctx.globalAlpha = 1;
  }

  private drawGhostBlock(x: number, y: number, color: string): void {
    const ctx = this.ctx;
    const px = FIELD_X + x * BLOCK;
    const py = FIELD_Y + y * BLOCK;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.13;
    ctx.fillRect(px + 1, py + 1, BLOCK - 2, BLOCK - 2);
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 2, py + 2, BLOCK - 4, BLOCK - 4);
    ctx.globalAlpha = 1;
  }

  private drawGameOver(): void {
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(0,0,0,0.72)";
    ctx.fillRect(FIELD_X, FIELD_Y, BOARD_WIDTH * BLOCK, VISIBLE_ROWS * BLOCK);
    ctx.textAlign = "center";
    ctx.fillStyle = TEXT;
    ctx.font = "bold 30px 'Segoe UI', system-ui, sans-serif";
    ctx.fillText("GAME OVER", FIELD_X + (BOARD_WIDTH * BLOCK) / 2, FIELD_Y + (VISIBLE_ROWS * BLOCK) / 2 - 10);
    ctx.font = "16px 'Segoe UI', system-ui, sans-serif";
    ctx.fillText("press R to restart", FIELD_X + (BOARD_WIDTH * BLOCK) / 2, FIELD_Y + (VISIBLE_ROWS * BLOCK) / 2 + 24);
    ctx.textAlign = "left";
  }
}
