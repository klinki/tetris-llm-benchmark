// Canvas renderer: draws the board, ghost, current piece, hold/next panels,
// stats and overlays. Everything is drawn on one canvas for a single, fast
// render path with no DOM layout work per frame.
import { COLS, COLORS, FIRST_VISIBLE_ROW, NEXT_QUEUE_SIZE, VISIBLE_ROWS } from "./constants.js";
import { PIECES } from "./pieces.js";
import type { Game } from "./game.js";
import type { PieceType, Vec } from "./types.js";

const CELL = 30;
const PAD = 20;
const LEFT_W = 120;
const RIGHT_W = 160;
const GAP = 20;

const BOARD_X = PAD + LEFT_W + GAP;
const BOARD_Y = PAD;
const BOARD_W = COLS * CELL;
const BOARD_H = VISIBLE_ROWS * CELL;
const RIGHT_X = BOARD_X + BOARD_W + GAP;

const WIDTH = PAD + LEFT_W + GAP + BOARD_W + GAP + RIGHT_W + PAD;
const HEIGHT = PAD + BOARD_H + PAD;

const BG = "#0d1117";
const PANEL = "#161b22";
const LINE = "#21262d";
const TEXT = "#c9d1d9";
const DIM = "#8b949e";

export class Renderer {
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    this.ctx = ctx;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = WIDTH * dpr;
    canvas.height = HEIGHT * dpr;
    canvas.style.width = `${WIDTH}px`;
    canvas.style.height = `${HEIGHT}px`;
    ctx.scale(dpr, dpr);
  }

  render(game: Game): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    this.drawBoard(game);
    this.drawHold(game);
    this.drawNext(game);
    this.drawStats(game);
    this.drawAnnouncement(game);
    if (game.phase === "gameover") this.drawGameOver();
  }

  private drawBoard(game: Game): void {
    const ctx = this.ctx;
    ctx.fillStyle = PANEL;
    ctx.fillRect(BOARD_X, BOARD_Y, BOARD_W, BOARD_H);

    // Locked blocks (visible rows only).
    for (let y = FIRST_VISIBLE_ROW; y < FIRST_VISIBLE_ROW + VISIBLE_ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const cell = game.board.grid[y][x];
        if (cell) this.block(this.px(x), this.py(y), CELL, COLORS[cell]);
      }
    }

    // Ghost piece.
    if (game.current && game.phase === "playing") {
      for (const c of game.ghostCells()) {
        if (c.y >= FIRST_VISIBLE_ROW) {
          this.block(this.px(c.x), this.py(c.y), CELL, COLORS[game.current.type], 0.18, true);
        }
      }
      // Current piece.
      for (const c of currentCells(game)) {
        if (c.y >= FIRST_VISIBLE_ROW) {
          this.block(this.px(c.x), this.py(c.y), CELL, COLORS[game.current.type]);
        }
      }
    }

    // Grid lines.
    ctx.strokeStyle = LINE;
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

    // Border.
    ctx.strokeStyle = "#30363d";
    ctx.lineWidth = 2;
    ctx.strokeRect(BOARD_X - 1, BOARD_Y - 1, BOARD_W + 2, BOARD_H + 2);
  }

  private drawHold(game: Game): void {
    this.label("HOLD", PAD, PAD);
    this.panel(PAD, PAD + 22, LEFT_W, 80);
    if (game.hold) {
      this.mini(game.hold, PAD, PAD + 22, LEFT_W, 80, game.canHold ? 1 : 0.35);
    }
    this.controls(PAD, PAD + 130);
  }

  private drawNext(game: Game): void {
    this.label("NEXT", RIGHT_X, PAD);
    const queue = game.nextQueue.slice(0, NEXT_QUEUE_SIZE);
    const boxH = 64;
    for (let i = 0; i < queue.length; i++) {
      const y = PAD + 22 + i * (boxH + 8);
      this.panel(RIGHT_X, y, RIGHT_W, boxH);
      this.mini(queue[i], RIGHT_X, y, RIGHT_W, boxH, i === 0 ? 1 : 0.75);
    }
  }

  private drawStats(game: Game): void {
    const ctx = this.ctx;
    const s = game.stats;
    let y = PAD + 22 + NEXT_QUEUE_SIZE * 72 + 16;
    const rows: [string, string][] = [
      ["SCORE", String(s.score)],
      ["LEVEL", String(s.level)],
      ["LINES", String(s.lines)],
    ];
    if (s.combo > 0) rows.push(["COMBO", `x${s.combo}`]);
    if (s.backToBack) rows.push(["B2B", "yes"]);
    for (const [name, value] of rows) {
      this.label(name, RIGHT_X, y);
      ctx.fillStyle = TEXT;
      ctx.font = "bold 20px monospace";
      ctx.textAlign = "left";
      ctx.fillText(value, RIGHT_X, y + 24);
      y += 48;
    }
  }

  private drawAnnouncement(game: Game): void {
    if (game.announcementTimer <= 0 || !game.announcement) return;
    const ctx = this.ctx;
    const alpha = Math.min(1, game.announcementTimer / 0.4);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#f0f6fc";
    ctx.font = "bold 26px monospace";
    ctx.textAlign = "center";
    ctx.fillText(game.announcement, BOARD_X + BOARD_W / 2, BOARD_Y + 80);
    ctx.restore();
  }

  private drawGameOver(): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(BOARD_X, BOARD_Y, BOARD_W, BOARD_H);
    ctx.fillStyle = "#f85149";
    ctx.font = "bold 34px monospace";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", BOARD_X + BOARD_W / 2, BOARD_Y + BOARD_H / 2 - 10);
    ctx.fillStyle = TEXT;
    ctx.font = "16px monospace";
    ctx.fillText("press R to restart", BOARD_X + BOARD_W / 2, BOARD_Y + BOARD_H / 2 + 24);
    ctx.restore();
  }

  // --- helpers -----------------------------------------------------------

  private px(x: number): number {
    return BOARD_X + x * CELL;
  }
  private py(y: number): number {
    return BOARD_Y + (y - FIRST_VISIBLE_ROW) * CELL;
  }

  private block(px: number, py: number, size: number, color: string, alpha = 1, outline = false): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    if (outline) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(px + 2, py + 2, size - 4, size - 4);
    } else {
      ctx.fillStyle = color;
      ctx.fillRect(px + 1, py + 1, size - 2, size - 2);
      ctx.fillStyle = "rgba(255,255,255,0.28)";
      ctx.fillRect(px + 1, py + 1, size - 2, 3);
      ctx.fillRect(px + 1, py + 1, 3, size - 2);
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.fillRect(px + 1, py + size - 4, size - 2, 3);
      ctx.fillRect(px + size - 4, py + 1, 3, size - 2);
    }
    ctx.restore();
  }

  private panel(x: number, y: number, w: number, h: number): void {
    const ctx = this.ctx;
    ctx.fillStyle = PANEL;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }

  private label(text: string, x: number, y: number): void {
    const ctx = this.ctx;
    ctx.fillStyle = DIM;
    ctx.font = "bold 13px monospace";
    ctx.textAlign = "left";
    ctx.fillText(text, x, y + 12);
  }

  /** Draw a piece centered in a box at a reduced cell size. */
  private mini(type: PieceType, x: number, y: number, w: number, h: number, alpha: number): void {
    const cells = PIECES[type][0];
    const size = 18;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [cx, cy] of cells) {
      minX = Math.min(minX, cx);
      minY = Math.min(minY, cy);
      maxX = Math.max(maxX, cx);
      maxY = Math.max(maxY, cy);
    }
    const pw = (maxX - minX + 1) * size;
    const ph = (maxY - minY + 1) * size;
    const ox = x + (w - pw) / 2 - minX * size;
    const oy = y + (h - ph) / 2 - minY * size;
    for (const [cx, cy] of cells) {
      this.block(ox + cx * size, oy + cy * size, size, COLORS[type], alpha);
    }
  }

  private controls(x: number, y: number): void {
    const ctx = this.ctx;
    const lines = [
      "←/→ move",
      "↑/X rot CW",
      "Z/Ctrl CCW",
      "↓ soft drop",
      "Space hard",
      "C hold",
      "R restart",
    ];
    ctx.fillStyle = DIM;
    ctx.font = "12px monospace";
    ctx.textAlign = "left";
    lines.forEach((line, i) => ctx.fillText(line, x, y + i * 20));
  }
}

function currentCells(game: Game): Vec[] {
  const p = game.current!;
  return PIECES[p.type][p.rotation].map(([cx, cy]) => ({ x: p.x + cx, y: p.y + cy }));
}
