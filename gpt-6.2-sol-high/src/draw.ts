import { Game, HEIGHT, WIDTH, type Piece } from './game.js';
import { bounds, PIECES, shape, type Kind } from './pieces.js';

function tile(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, kind: Kind, ghost = false): void {
  const { color } = PIECES[kind];
  if (ghost) {
    ctx.strokeStyle = `${color}a0`;
    ctx.fillStyle = `${color}18`;
    ctx.lineWidth = 1.5;
    ctx.fillRect(x + 3, y + 3, size - 6, size - 6);
    ctx.strokeRect(x + 3, y + 3, size - 6, size - 6);
    return;
  }
  ctx.fillStyle = color;
  ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
  ctx.fillStyle = '#ffffff38';
  ctx.fillRect(x + 2, y + 2, size - 4, 2);
  ctx.fillRect(x + 2, y + 4, 2, size - 7);
  ctx.fillStyle = '#00000033';
  ctx.fillRect(x + 2, y + size - 4, size - 4, 3);
  ctx.fillRect(x + size - 4, y + 4, 3, size - 8);
}

function drawPiece(ctx: CanvasRenderingContext2D, piece: Piece, size: number, ghost = false): void {
  const { kind, x, y, turn } = piece;
  for (const [dx, dy] of shape(kind, turn)) tile(ctx, (x + dx) * size, (y + dy) * size, size, kind, ghost);
}

export function drawBoard(ctx: CanvasRenderingContext2D, game: Game): void {
  const { width, height } = ctx.canvas;
  const size = width / WIDTH;
  ctx.fillStyle = '#131720';
  ctx.fillRect(0, 0, width, height);
  ctx.beginPath();
  for (let x = 1; x < WIDTH; x++) {
    ctx.moveTo(x * size + 0.5, 0);
    ctx.lineTo(x * size + 0.5, height);
  }
  for (let y = 1; y < HEIGHT; y++) {
    ctx.moveTo(0, y * size + 0.5);
    ctx.lineTo(width, y * size + 0.5);
  }
  ctx.strokeStyle = '#242a36';
  ctx.lineWidth = 1;
  ctx.stroke();

  game.board.forEach((row, y) => row.forEach((kind, x) => {
    if (kind) tile(ctx, x * size, y * size, size, kind);
  }));
  if (game.over) return;
  const landing = game.landing;
  if (landing.y !== game.active.y) drawPiece(ctx, landing, size, true);
  drawPiece(ctx, game.active, size);
}

export function drawPreview(ctx: CanvasRenderingContext2D, kind: Kind | null): void {
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);
  ctx.canvas.setAttribute('aria-label', kind ? PIECES[kind].name : 'Empty hold slot');
  if (!kind) return;
  const cells = shape(kind);
  const { left, right, top, bottom } = bounds(cells);
  const size = 19;
  const x = Math.round((width - (right - left + 1) * size) / 2) - left * size;
  const y = Math.round((height - (bottom - top + 1) * size) / 2) - top * size;
  for (const [dx, dy] of cells) tile(ctx, x + dx * size, y + dy * size, size, kind);
}
