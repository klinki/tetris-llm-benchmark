/** Canvas drawing for the playfield and piece previews. */
import { type Game, HEIGHT, WIDTH } from "./engine.js";
import { COLORS, type Kind, shape } from "./pieces.js";

const CELL = 30;
const PREVIEW_CELL = 24;
const PREVIEW_WIDTH = 5 * PREVIEW_CELL;
const PREVIEW_SLOT = 3 * PREVIEW_CELL;

function context2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser does not support Canvas 2D.");
  return ctx;
}

/**
 * Locks the canvas to the drawing's aspect ratio and sizes its backing store to
 * the displayed size × device pixel ratio, so drawings are sharp and never stretched.
 */
function prepare(canvas: HTMLCanvasElement, width: number, height: number): CanvasRenderingContext2D {
  const ctx = context2d(canvas);
  canvas.style.aspectRatio = `${width} / ${height}`;
  const scale = ((canvas.clientWidth || width) / width) * Math.min(window.devicePixelRatio || 1, 3);
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, width, height);
  return ctx;
}

function block(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string): void {
  const inset = size * 0.04;
  const inner = size - 2 * inset;
  ctx.fillStyle = color;
  ctx.fillRect(x + inset, y + inset, inner, inner);
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fillRect(x + inset, y + inset, inner, size * 0.12);
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.fillRect(x + inset, y + size * 0.84, inner, size * 0.12);
}

function ghostBlock(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.fillStyle = `${color}26`;
  ctx.fillRect(x + 2, y + 2, CELL - 4, CELL - 4);
  ctx.strokeStyle = `${color}b0`;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 2.75, y + 2.75, CELL - 5.5, CELL - 5.5);
}

export function drawBoard(canvas: HTMLCanvasElement, game: Game): void {
  const width = WIDTH * CELL;
  const height = HEIGHT * CELL;
  const ctx = prepare(canvas, width, height);
  ctx.fillStyle = "#0d1117";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "#1c2330";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 1; x < WIDTH; x++) {
    ctx.moveTo(x * CELL, 0);
    ctx.lineTo(x * CELL, height);
  }
  for (let y = 1; y < HEIGHT; y++) {
    ctx.moveTo(0, y * CELL);
    ctx.lineTo(width, y * CELL);
  }
  ctx.stroke();

  for (let y = 0; y < HEIGHT; y++)
    for (let x = 0; x < WIDTH; x++) {
      const kind = game.cell(x, y);
      if (kind) block(ctx, x * CELL, y * CELL, CELL, COLORS[kind]);
    }
  const { active } = game;
  if (!active || game.status === "over") return;
  const color = COLORS[active.kind];
  for (const [x, y] of game.cells(game.ghost()!)) if (y >= 0) ghostBlock(ctx, x * CELL, y * CELL, color);
  for (const [x, y] of game.cells(active)) if (y >= 0) block(ctx, x * CELL, y * CELL, CELL, color);
}

/** Draws pieces centred in equal vertical slots; `dim` marks a hold that is used up. */
export function drawPieces(canvas: HTMLCanvasElement, kinds: readonly (Kind | null)[], dim = false): void {
  const height = PREVIEW_SLOT * kinds.length;
  const ctx = prepare(canvas, PREVIEW_WIDTH, height);
  ctx.globalAlpha = dim ? 0.35 : 1;
  kinds.forEach((kind, slot) => {
    if (!kind) return;
    const cells = shape(kind);
    const xs = cells.map(([x]) => x);
    const ys = cells.map(([, y]) => y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const left = (PREVIEW_WIDTH - (Math.max(...xs) - minX + 1) * PREVIEW_CELL) / 2;
    const top = slot * PREVIEW_SLOT + (PREVIEW_SLOT - (Math.max(...ys) - minY + 1) * PREVIEW_CELL) / 2;
    for (const [x, y] of cells)
      block(ctx, left + (x - minX) * PREVIEW_CELL, top + (y - minY) * PREVIEW_CELL, PREVIEW_CELL, COLORS[kind]);
  });
  ctx.globalAlpha = 1;
}
