import { HEIGHT, HIDDEN, WIDTH } from "./game.js";
import type { Game } from "./game.js";
import { cells } from "./pieces.js";
import type { Kind } from "./pieces.js";

export type Screen = "ready" | "playing" | "paused" | "over";
const TILE = 30;

// Face, upper bevel, lower bevel and glint for each piece.
const colors: Record<Kind, [string, string, string, string]> = {
  I: ["#49c9da", "#8ae6ed", "#278aa4", "#c7fbfa"],
  J: ["#608af0", "#98b4ff", "#3b5eae", "#cddcff"],
  L: ["#ee9754", "#ffc487", "#b06639", "#ffdfae"],
  O: ["#eac452", "#ffe18a", "#ae8938", "#fff0b7"],
  S: ["#66c990", "#a5e6ae", "#398963", "#d1f6cb"],
  T: ["#ac82e9", "#d4b1fc", "#7854aa", "#ecd4ff"],
  Z: ["#e86f88", "#ff9ca9", "#a74763", "#ffc7cd"],
};

function tile(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, kind: Kind): void {
  const [face, light, shade, glint] = colors[kind];
  const bevel = Math.max(2, Math.round(size * .13));
  const right = x + size - 1;
  const bottom = y + size - 1;
  ctx.fillStyle = shade;
  ctx.fillRect(x, y, size - 1, size - 1);
  ctx.fillStyle = light;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(right, y);
  ctx.lineTo(right - bevel, y + bevel);
  ctx.lineTo(x + bevel, y + bevel);
  ctx.lineTo(x + bevel, bottom - bevel);
  ctx.lineTo(x, bottom);
  ctx.fill();
  ctx.fillStyle = face;
  ctx.fillRect(x + bevel, y + bevel, size - 1 - 2 * bevel, size - 1 - 2 * bevel);
  ctx.fillStyle = glint;
  ctx.fillRect(x + 1, y + 1, bevel + 1, 1);
  ctx.fillRect(x + 1, y + 1, 1, bevel);
}

function piece(ctx: CanvasRenderingContext2D, kind: Kind, rotation: number, x: number, y: number, ghost = false): void {
  for (const [dx, dy] of cells(kind, rotation)) {
    const px = (x + dx) * TILE;
    const py = (y + dy) * TILE;
    if (ghost) {
      ctx.fillStyle = colors[kind][0] + "15";
      ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
      ctx.strokeStyle = colors[kind][0] + "95";
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 2.5, py + 2.5, TILE - 5, TILE - 5);
    } else {
      tile(ctx, px, py, TILE, kind);
    }
  }
}

// The title screen has its own illustration. Every run starts with an empty matrix.
const titleStack = [
  "........OO",
  ".SS.T.ZZOO",
  "SS.TT..ZZL",
  "OOJ.T..LLL",
  "OOJJJ.IIII",
];

export function drawBoard(canvas: HTMLCanvasElement, game: Game, screen: Screen, flashRows: number[]): void {
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#10111f";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#252436";
  for (let col = 0; col < WIDTH; col++) ctx.fillRect(col * TILE, 0, 1, canvas.height);
  for (let row = 0; row < HEIGHT; row++) ctx.fillRect(0, row * TILE, canvas.width, 1);

  if (screen === "ready") {
    titleStack.forEach((row, y) => [...row].forEach((cell, x) => {
      if (cell !== ".") tile(ctx, x * TILE, (HEIGHT - titleStack.length + y) * TILE, TILE, cell as Kind);
    }));
    piece(ctx, "T", 0, 3, 3);
    piece(ctx, "T", 0, 3, 14, true);
    return;
  }

  for (let y = HIDDEN; y < game.board.length; y++) {
    game.board[y].forEach((cell, x) => {
      if (cell) tile(ctx, x * TILE, (y - HIDDEN) * TILE, TILE, cell);
    });
  }
  if (!game.over) {
    const { kind, x, y, rotation } = game.active;
    piece(ctx, kind, rotation, x, game.ghostY - HIDDEN, true);
    piece(ctx, kind, rotation, x, y - HIDDEN);
  }
  ctx.fillStyle = "#ffeabfa3";
  for (const y of flashRows) ctx.fillRect(0, (y - HIDDEN) * TILE, canvas.width, TILE);
}

export function drawPreview(canvas: HTMLCanvasElement, kind: Kind, size: number): void {
  if (canvas.dataset.kind === kind) return;
  canvas.dataset.kind = kind;
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", kind + " piece");
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const shape = cells(kind);
  const xs = shape.map(([x]) => x);
  const ys = shape.map(([, y]) => y);
  const left = Math.round((canvas.width - (Math.min(...xs) + Math.max(...xs) + 1) * size) / 2);
  const top = Math.round((canvas.height - (Math.min(...ys) + Math.max(...ys) + 1) * size) / 2);
  for (const [x, y] of shape) tile(ctx, left + x * size, top + y * size, size, kind);
}
