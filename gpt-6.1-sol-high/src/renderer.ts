import { Game, HEIGHT, WIDTH, shape, type Kind } from "./engine.js";

export const COLORS: Record<Kind, string> = {
  I: "#6bcbd3",
  J: "#7c9be3",
  L: "#e8b16c",
  O: "#e2cf76",
  S: "#98d3a1",
  T: "#b19bd6",
  Z: "#df8b8b",
};

function context(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const result = canvas.getContext("2d");
  if (!result) throw new Error("Your browser does not support Canvas 2D.");
  return result;
}

function block(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  ghost = false,
): void {
  const inset = ghost ? 3 : 1.5;
  ctx.fillStyle = ghost ? `${color}0c` : color;
  ctx.fillRect(x + inset, y + inset, size - inset * 2, size - inset * 2);
  if (ghost) {
    ctx.strokeStyle = `${color}70`;
    ctx.lineWidth = 1;
    ctx.strokeRect(
      x + inset + 0.5,
      y + inset + 0.5,
      size - inset * 2 - 1,
      size - inset * 2 - 1,
    );
  } else {
    ctx.fillStyle = "#ffffff28";
    ctx.fillRect(x + inset, y + inset, size - inset * 2, 2);
    ctx.fillStyle = "#00000018";
    ctx.fillRect(x + inset, y + size - inset - 3, size - inset * 2, 3);
    ctx.strokeStyle = "#00000010";
    ctx.strokeRect(
      x + inset + 4,
      y + inset + 4,
      size - inset * 2 - 8,
      size - inset * 2 - 8,
    );
  }
}

export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;
  constructor(canvas: HTMLCanvasElement) {
    this.ctx = context(canvas);
    const ratio = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = 300 * ratio;
    canvas.height = 600 * ratio;
    this.ctx.scale(ratio, ratio);
  }
  draw(game: Game): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, 300, 600);
    ctx.fillStyle = "#0e1511";
    ctx.fillRect(0, 0, 300, 600);
    ctx.strokeStyle = "#1d2a22";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let x = 1; x < WIDTH; x++) {
      ctx.moveTo(x * 30, 0);
      ctx.lineTo(x * 30, 600);
    }
    for (let y = 1; y < HEIGHT; y++) {
      ctx.moveTo(0, y * 30);
      ctx.lineTo(300, y * 30);
    }
    ctx.stroke();
    for (let y = 0; y < HEIGHT; y++)
      for (let x = 0; x < WIDTH; x++) {
        const kind = game.cell(x, y);
        if (kind) block(ctx, x * 30, y * 30, 30, COLORS[kind]);
      }
    if (game.status === "over") return;
    const ghost = game.ghost();
    if (ghost)
      for (const [x, y] of game.cells(ghost))
        if (y >= 0) block(ctx, x * 30, y * 30, 30, COLORS[ghost.kind], true);
    if (game.active)
      for (const [x, y] of game.cells(game.active))
        if (y >= 0) block(ctx, x * 30, y * 30, 30, COLORS[game.active.kind]);
  }
}

export function drawPreview(
  canvas: HTMLCanvasElement,
  kind: Kind | null,
  available = true,
): void {
  const ratio = Math.min(window.devicePixelRatio || 1, 3);
  const width = canvas.clientWidth || 144,
    height = canvas.clientHeight || 80;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  const ctx = context(canvas);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);
  if (!kind) {
    ctx.strokeStyle = "#3b4b40";
    ctx.setLineDash([3, 4]);
    ctx.strokeRect(width / 2 - 17.5, height / 2 - 15.5, 35, 31);
    ctx.setLineDash([]);
    return;
  }
  const cells = shape(kind);
  const xs = cells.map(([x]) => x),
    ys = cells.map(([, y]) => y);
  const minX = Math.min(...xs),
    minY = Math.min(...ys);
  const size = Math.min(22, (width - 8) / 4);
  const xOffset = (width - (Math.max(...xs) - minX + 1) * size) / 2;
  const yOffset = (height - (Math.max(...ys) - minY + 1) * size) / 2;
  ctx.globalAlpha = available ? 1 : 0.3;
  for (const [x, y] of cells)
    block(
      ctx,
      xOffset + (x - minX) * size,
      yOffset + (y - minY) * size,
      size,
      COLORS[kind],
    );
  ctx.globalAlpha = 1;
}
