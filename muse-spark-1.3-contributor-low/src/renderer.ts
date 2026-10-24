import { COLS, HIDDEN_ROWS, ROWS } from "./constants.js";
import { Game } from "./game.js";
import { COLORS, PieceKind, cellsFor } from "./pieces.js";

function miniCells(kind: PieceKind): { x: number; y: number }[] {
  return cellsFor(kind, 0).map((c) => ({ ...c }));
}

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private cell = 28;

  constructor(private canvas: HTMLCanvasElement, private game: Game) {
    this.ctx = canvas.getContext("2d")!;
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = COLS * this.cell + 340;
    const h = 20 * this.cell + 40;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private drawBlock(px: number, py: number, color: string, ghost = false): void {
    const s = this.cell;
    const x = 20 + px * s;
    const y = 20 + (py - HIDDEN_ROWS) * s;
    if (ghost) {
      this.ctx.strokeStyle = color;
      this.ctx.globalAlpha = 0.45;
      this.ctx.lineWidth = 1.5;
      this.ctx.strokeRect(x + 1.5, y + 1.5, s - 3, s - 3);
      this.ctx.globalAlpha = 1;
      return;
    }
    this.ctx.fillStyle = "#0b0e1a";
    this.ctx.fillRect(x, y, s, s);
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x + 1, y + 1, s - 2, s - 2);
    this.ctx.fillStyle = "rgba(255,255,255,0.35)";
    this.ctx.fillRect(x + 1, y + 1, s - 2, 4);
    this.ctx.fillStyle = "rgba(0,0,0,0.25)";
    this.ctx.fillRect(x + 1, y + s - 5, s - 2, 4);
  }

  private drawPreview(kind: PieceKind, ox: number, oy: number, s: number): void {
    const cells = miniCells(kind);
    const minX = Math.min(...cells.map((c) => c.x));
    const maxX = Math.max(...cells.map((c) => c.x));
    const minY = Math.min(...cells.map((c) => c.y));
    const maxY = Math.max(...cells.map((c) => c.y));
    const w = (maxX - minX + 1) * s;
    const h = (maxY - minY + 1) * s;
    const cx = ox + (120 - w) / 2;
    const cy = oy + (64 - h) / 2;
    for (const c of cells) {
      const x = cx + (c.x - minX) * s;
      const y = cy + (c.y - minY) * s;
      this.ctx.fillStyle = COLORS[kind];
      this.ctx.fillRect(x, y, s - 2, s - 2);
      this.ctx.fillStyle = "rgba(255,255,255,0.35)";
      this.ctx.fillRect(x, y, s - 2, 3);
    }
  }

  render(): void {
    const g = this.game;
    const ctx = this.ctx;
    const s = this.cell;
    const W = COLS * s + 340;
    const H = 20 * s + 40;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#11142a";
    ctx.fillRect(0, 0, W, H);

    // Board background (visible rows only)
    ctx.fillStyle = "#05060f";
    ctx.fillRect(20, 20, COLS * s, 20 * s);

    // Grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    for (let x = 1; x < COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(20 + x * s, 20);
      ctx.lineTo(20 + x * s, 20 + 20 * s);
      ctx.stroke();
    }
    for (let y = 1; y < 20; y++) {
      ctx.beginPath();
      ctx.moveTo(20, 20 + y * s);
      ctx.lineTo(20 + COLS * s, 20 + y * s);
      ctx.stroke();
    }
    ctx.strokeStyle = "#3a3f66";
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, COLS * s, 20 * s);

    // Locked blocks
    for (let y = HIDDEN_ROWS; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const v = g.grid[y][x];
        if (v) this.drawBlock(x, y, COLORS[v]);
      }
    }

    if (g.status === "playing") {
      // Ghost
      const gy = g.ghostY();
      for (const c of cellsFor(g.current.kind, g.current.rotation)) {
        const x = g.current.x + c.x;
        const y = gy + c.y;
        if (y >= HIDDEN_ROWS) this.drawBlock(x, y, COLORS[g.current.kind], true);
      }
      // Active
      for (const c of g.cells()) {
        if (c.y >= HIDDEN_ROWS) this.drawBlock(c.x, c.y, COLORS[g.current.kind]);
      }
    }

    // Side panel
    const px = 20 + COLS * s + 24;
    ctx.fillStyle = "#cfd3ff";
    ctx.font = "bold 14px system-ui, sans-serif";
    ctx.fillText("HOLD (C)", px, 34);
    ctx.strokeStyle = "#3a3f66";
    ctx.strokeRect(px, 44, 120, 64);
    if (g.holdKind) this.drawPreview(g.holdKind, px, 44, 20);

    ctx.fillText("NEXT", px, 134);
    g.nextQueue.slice(0, 5).forEach((k, i) => {
      const oy = 144 + i * 68;
      ctx.strokeStyle = "#2a2e55";
      ctx.strokeRect(px, oy, 120, 64);
      this.drawPreview(k, px, oy, 18);
    });

    ctx.fillStyle = "#cfd3ff";
    ctx.fillText(`SCORE`, px, 144 + 5 * 68 + 8);
    ctx.font = "bold 22px system-ui, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${g.score}`, px, 144 + 5 * 68 + 32);
    ctx.font = "14px system-ui, sans-serif";
    ctx.fillStyle = "#cfd3ff";
    ctx.fillText(`LEVEL  ${g.level}`, px, 144 + 5 * 68 + 56);
    ctx.fillText(`LINES  ${g.lines}`, px, 144 + 5 * 68 + 76);

    ctx.font = "12px system-ui, sans-serif";
    ctx.fillStyle = "#8a8fb8";
    ctx.fillText("←/→ move · ↑/X rotate", px - 140, H - 56);
    ctx.fillText("Z/Ctrl rotate · ↓ soft · Space hard", px - 140, H - 40);
    ctx.fillText("C hold · R restart", px - 140, H - 24);

    if (g.status === "over") {
      ctx.fillStyle = "rgba(0,0,0,0.65)";
      ctx.fillRect(20, 20, COLS * s, 20 * s);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 30px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("GAME OVER", 20 + (COLS * s) / 2, 20 + 10 * s);
      ctx.font = "15px system-ui, sans-serif";
      ctx.fillStyle = "#cfd3ff";
      ctx.fillText("Press R to restart", 20 + (COLS * s) / 2, 20 + 10 * s + 28);
      ctx.textAlign = "left";
    }
  }
}
