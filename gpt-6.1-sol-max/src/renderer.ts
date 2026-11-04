import { HEIGHT, WIDTH } from "./game.js";
import type { Game, GameEvent } from "./game.js";
import { COLORS, cellsFor, occupiedCells } from "./pieces.js";
import type { Cell, PieceType } from "./pieces.js";

const TILE = 30;
const BOARD_WIDTH = WIDTH * TILE;
const BOARD_HEIGHT = HEIGHT * TILE;

function contextFor(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser needs Canvas support to play Tetris.");
  return context;
}

function prepareCanvas(canvas: HTMLCanvasElement, width: number, height: number): CanvasRenderingContext2D {
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 3);
  const pixelWidth = Math.max(1, Math.round(rect.width * ratio));
  const pixelHeight = Math.max(1, Math.round(rect.height * ratio));
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  const context = contextFor(canvas);
  context.setTransform(pixelWidth / width, 0, 0, pixelHeight / height, 0, 0);
  return context;
}

function drawBlock(context: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, ghost = false): void {
  const inset = size * 0.055;
  const edge = size - inset * 2;
  context.beginPath();
  context.roundRect(x + inset, y + inset, edge, edge, size * 0.06);
  if (ghost) {
    context.fillStyle = `${color}12`;
    context.fill();
    context.lineWidth = 1.2;
    context.strokeStyle = `${color}80`;
    context.stroke();
  } else {
    context.fillStyle = color;
    context.fill();
    context.fillStyle = "#ffffff32";
    context.fillRect(x + inset + 1, y + inset + 1, edge - 2, Math.max(1, size * 0.05));
    context.fillStyle = "#163c2912";
    context.fillRect(x + inset + 1, y + size - inset - 2, edge - 2, 1);
  }
}

interface Flash {
  cells: Cell[];
  rows: number[];
  until: number;
}

export class Renderer {
  private lastRevision = -1;
  private dirty = true;
  private flash: Flash | null = null;
  private readonly previewTypes = new Map<HTMLCanvasElement, PieceType | null>();
  private readonly reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  constructor(
    private readonly board: HTMLCanvasElement,
    private readonly hold: HTMLCanvasElement,
    private readonly next: HTMLCanvasElement[],
  ) {
    window.addEventListener("resize", () => { this.dirty = true; });
  }

  reset(): void {
    this.flash = null;
    this.dirty = true;
  }

  notify(events: GameEvent[], now: number): void {
    if (this.reducedMotion.matches) return;
    for (const event of events) {
      if (event.type === "lock") this.flash = { cells: event.cells, rows: [], until: now + 140 };
      if (event.type === "clear") this.flash = { cells: [], rows: event.rows, until: now + 240 };
    }
  }

  render(game: Game, now: number): void {
    if (game.revision === this.lastRevision && !this.dirty && !this.flash) return;
    const updatePreviews = this.dirty || game.revision !== this.lastRevision;
    const forcePreviews = this.dirty;
    this.lastRevision = game.revision;
    this.dirty = false;
    const context = prepareCanvas(this.board, BOARD_WIDTH, BOARD_HEIGHT);
    context.fillStyle = "#152e29";
    context.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);
    context.strokeStyle = "#244038";
    context.lineWidth = 0.6;
    context.beginPath();
    for (let x = 1; x < WIDTH; x++) {
      context.moveTo(x * TILE, 0);
      context.lineTo(x * TILE, BOARD_HEIGHT);
    }
    for (let y = 1; y < HEIGHT; y++) {
      context.moveTo(0, y * TILE);
      context.lineTo(BOARD_WIDTH, y * TILE);
    }
    context.stroke();

    if (game.status === "ready") this.drawWelcomeStack(context);
    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        const type = game.cellAt(x, y);
        if (type) drawBlock(context, x * TILE, y * TILE, TILE, COLORS[type]);
      }
    }
    if (game.active) {
      const ghost = { ...game.active, y: game.ghostY! };
      for (const [x, y] of occupiedCells(ghost)) {
        if (y >= 0) drawBlock(context, x * TILE, y * TILE, TILE, COLORS[ghost.type], true);
      }
      for (const [x, y] of occupiedCells(game.active)) {
        if (y >= 0) drawBlock(context, x * TILE, y * TILE, TILE, COLORS[game.active.type]);
      }
    }
    if (this.flash) {
      const alpha = Math.max(0, (this.flash.until - now) / 240) * 0.45;
      context.fillStyle = `rgba(235, 250, 214, ${alpha})`;
      for (const [x, y] of this.flash.cells) {
        if (y >= 0) context.fillRect(x * TILE + 2, y * TILE + 2, TILE - 4, TILE - 4);
      }
      for (const y of this.flash.rows) {
        if (y >= 0) context.fillRect(0, y * TILE, BOARD_WIDTH, TILE);
      }
      if (now >= this.flash.until) {
        this.flash = null;
        this.dirty = true;
      }
    }
    if (updatePreviews) {
      this.drawPreview(this.hold, game.held, "Held", forcePreviews);
      this.next.forEach((canvas, index) => this.drawPreview(canvas, game.queue[index] ?? null, `Next ${index + 1}:`, forcePreviews));
    }
  }

  private drawPreview(canvas: HTMLCanvasElement, type: PieceType | null, label: string, force: boolean): void {
    if (!force && this.previewTypes.get(canvas) === type) return;
    this.previewTypes.set(canvas, type);
    const width = canvas.getBoundingClientRect().width;
    const height = canvas.getBoundingClientRect().height;
    const context = prepareCanvas(canvas, width, height);
    context.clearRect(0, 0, width, height);
    canvas.setAttribute("aria-label", type ? `${label} ${type} piece` : "No held piece");
    if (!type) return;
    const cells = cellsFor(type);
    const minX = Math.min(...cells.map(([x]) => x));
    const maxX = Math.max(...cells.map(([x]) => x));
    const minY = Math.min(...cells.map(([, y]) => y));
    const maxY = Math.max(...cells.map(([, y]) => y));
    const size = Math.min(22, (width - 6) / (maxX - minX + 1), (height - 12) / (maxY - minY + 1));
    const left = (width - (maxX - minX + 1) * size) / 2;
    const top = (height - (maxY - minY + 1) * size) / 2;
    for (const [x, y] of cells) {
      drawBlock(context, left + (x - minX) * size, top + (y - minY) * size, size, COLORS[type]);
    }
  }

  private drawWelcomeStack(context: CanvasRenderingContext2D): void {
    const rows = [
      "          ", "J       L ", "JJJ SS  LL", "IIIISSOOTT", "ZZZJJOOTTT",
    ];
    context.globalAlpha = 0.55;
    rows.forEach((row, index) => [...row].forEach((type, x) => {
      if (type !== " ") drawBlock(context, x * TILE, (HEIGHT - rows.length + index) * TILE, TILE, COLORS[type as PieceType]);
    }));
    context.globalAlpha = 1;
  }
}
