import { COLS, HIDDEN_ROWS, PIECE_COLORS, PIECE_DARK, SHAPES, TOTAL_ROWS, VISIBLE_ROWS } from './pieces.js';
import type { ActivePiece, CellValue, PieceType } from './types.js';

export const CELL = 30;
export const MINI_CELL = 22;

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawBlock(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  size: number,
  type: PieceType,
  ghost = false,
): void {
  const fill = PIECE_COLORS[type];
  const dark = PIECE_DARK[type];
  if (ghost) {
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = fill;
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 1.5, py + 1.5, size - 3, size - 3);
    ctx.restore();
    return;
  }
  ctx.fillStyle = dark;
  ctx.fillRect(px, py, size, size);
  const grad = ctx.createLinearGradient(px, py, px, py + size);
  grad.addColorStop(0, fill);
  grad.addColorStop(1, dark);
  ctx.fillStyle = grad;
  roundRect(ctx, px + 1, py + 1, size - 2, size - 2, 5);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  roundRect(ctx, px + 4, py + 3, size - 8, (size - 8) / 3, 3);
  ctx.fill();
}

export function drawBoard(
  ctx: CanvasRenderingContext2D,
  board: CellValue[][],
  active: ActivePiece | null,
  ghostY: number | null,
): void {
  ctx.clearRect(0, 0, COLS * CELL, VISIBLE_ROWS * CELL);
  const bg = ctx.createLinearGradient(0, 0, 0, VISIBLE_ROWS * CELL);
  bg.addColorStop(0, '#0b1020');
  bg.addColorStop(1, '#101a33');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, COLS * CELL, VISIBLE_ROWS * CELL);
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let c = 1; c < COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * CELL + 0.5, 0);
    ctx.lineTo(c * CELL + 0.5, VISIBLE_ROWS * CELL);
    ctx.stroke();
  }
  for (let r = 1; r < VISIBLE_ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * CELL + 0.5);
    ctx.lineTo(COLS * CELL, r * CELL + 0.5);
    ctx.stroke();
  }
  for (let r = HIDDEN_ROWS; r < TOTAL_ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const v = board[r][c];
      if (v !== null) drawBlock(ctx, c * CELL, (r - HIDDEN_ROWS) * CELL, CELL, v);
    }
  }
  if (active !== null && ghostY !== null && ghostY !== active.y) {
    for (const o of SHAPES[active.type][active.rotation]) {
      const x = active.x + o.x;
      const y = ghostY + o.y - HIDDEN_ROWS;
      if (y >= 0) drawBlock(ctx, x * CELL, y * CELL, CELL, active.type, true);
    }
  }
  if (active !== null) {
    for (const o of SHAPES[active.type][active.rotation]) {
      const x = active.x + o.x;
      const y = active.y + o.y - HIDDEN_ROWS;
      if (y >= 0) drawBlock(ctx, x * CELL, y * CELL, CELL, active.type);
    }
  }
}

export function drawMini(
  ctx: CanvasRenderingContext2D,
  type: PieceType | null,
  boxW: number,
  boxH: number,
): void {
  ctx.clearRect(0, 0, boxW, boxH);
  if (type === null) return;
  const cells = SHAPES[type][0];
  let minX = 99;
  let maxX = -99;
  let minY = 99;
  let maxY = -99;
  for (const c of cells) {
    minX = Math.min(minX, c.x);
    maxX = Math.max(maxX, c.x);
    minY = Math.min(minY, c.y);
    maxY = Math.max(maxY, c.y);
  }
  const w = (maxX - minX + 1) * MINI_CELL;
  const h = (maxY - minY + 1) * MINI_CELL;
  const ox = (boxW - w) / 2 - minX * MINI_CELL;
  const oy = (boxH - h) / 2 - minY * MINI_CELL;
  for (const c of cells) {
    drawBlock(ctx, ox + c.x * MINI_CELL, oy + c.y * MINI_CELL, MINI_CELL, type);
  }
}
