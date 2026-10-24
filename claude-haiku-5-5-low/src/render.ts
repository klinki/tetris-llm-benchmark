import { COLS, HIDDEN_ROWS, NEXT_COUNT, ROWS, type ActivePiece, type Game } from './game.js';
import { boxSize, cells, COLORS, type PieceType } from './pieces.js';

const WIDTH = 640;
const HEIGHT = 640;
const CELL = 30;
const BOARD_X = 170;
const BOARD_Y = 20;
const MINI_CELL = 18;
const NEXT_SLOT = 80;

export function render(ctx: CanvasRenderingContext2D, game: Game): void {
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  drawBoard(ctx, game);
  drawPanels(ctx, game);

  if (game.over) drawGameOver(ctx);
}

function drawBoard(ctx: CanvasRenderingContext2D, game: Game): void {
  const boardW = COLS * CELL;
  const boardH = (ROWS - HIDDEN_ROWS) * CELL;

  ctx.fillStyle = '#000';
  ctx.fillRect(BOARD_X, BOARD_Y, boardW, boardH);
  ctx.strokeStyle = '#1e1e1e';
  ctx.lineWidth = 1;
  for (let x = 1; x < COLS; x++) line(ctx, BOARD_X + x * CELL, BOARD_Y, BOARD_X + x * CELL, BOARD_Y + boardH);
  for (let y = 1; y < ROWS - HIDDEN_ROWS; y++) line(ctx, BOARD_X, BOARD_Y + y * CELL, BOARD_X + boardW, BOARD_Y + y * CELL);

  for (let y = HIDDEN_ROWS; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const type = game.board[y][x];
      if (type) fillCell(ctx, x, y, COLORS[type]);
    }
  }

  if (!game.over) {
    ctx.globalAlpha = 0.3;
    drawPiece({ ...game.current, y: game.ghostY() }, (x, y) => fillCell(ctx, x, y, COLORS[game.current.type]));
    ctx.globalAlpha = 1;
  }
  drawPiece(game.current, (x, y) => fillCell(ctx, x, y, COLORS[game.current.type]));
}

function drawPanels(ctx: CanvasRenderingContext2D, game: Game): void {
  // Hold
  panel(ctx, 20, BOARD_Y, 120, 120, 'HOLD');
  if (game.held) {
    drawMini(ctx, game.held, 20, BOARD_Y, 120, 120, game.canHold ? 1 : 0.4);
  }

  // Stats
  let y = 170;
  for (const [label, value] of [
    ['SCORE', game.score],
    ['LINES', game.lines],
    ['LEVEL', game.level()],
  ] as const) {
    text(ctx, label, 20, y, 14, '#888');
    text(ctx, String(value), 20, y + 24, 22, '#eee');
    y += 60;
  }
  if (game.backToBack) text(ctx, 'BACK-TO-BACK', 20, y, 14, '#f0a000');
  if (game.combo > 0) text(ctx, `COMBO x${game.combo}`, 20, y + 20, 14, '#f0a000');
  if (game.lastEvent) text(ctx, game.lastEvent, 20, y + 40, 14, '#eee');

  // Next queue
  const nextH = NEXT_COUNT * NEXT_SLOT + 30;
  panel(ctx, 500, BOARD_Y, 120, nextH, 'NEXT');
  game.queue.slice(0, NEXT_COUNT).forEach((type: PieceType, i: number) => {
    drawMini(ctx, type, 500, BOARD_Y + 30 + i * NEXT_SLOT, 120, NEXT_SLOT, 1);
  });
}

function drawGameOver(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(BOARD_X, BOARD_Y, COLS * CELL, (ROWS - HIDDEN_ROWS) * CELL);
  text(ctx, 'GAME OVER', BOARD_X + (COLS * CELL) / 2, BOARD_Y + 290, 30, '#eee', 'center');
  text(ctx, 'press R to restart', BOARD_X + (COLS * CELL) / 2, BOARD_Y + 325, 16, '#aaa', 'center');
}

function drawPiece(piece: ActivePiece, draw: (x: number, y: number) => void): void {
  for (const [dx, dy] of cells(piece.type, piece.rot)) {
    const y = piece.y + dy;
    if (y >= HIDDEN_ROWS) draw(piece.x + dx, y);
  }
}

/** Draws a piece centred in a panel-sized box, at the given opacity. */
function drawMini(
  ctx: CanvasRenderingContext2D,
  type: PieceType,
  px: number,
  py: number,
  w: number,
  h: number,
  alpha: number,
): void {
  const size = boxSize(type) * MINI_CELL;
  const left = px + (w - size) / 2;
  const top = py + (h - size) / 2;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = COLORS[type];
  for (const [dx, dy] of cells(type, 0)) {
    const x = left + dx * MINI_CELL;
    const y = top + dy * MINI_CELL;
    ctx.fillRect(x + 1, y + 1, MINI_CELL - 2, MINI_CELL - 2);
  }
  ctx.globalAlpha = 1;
}

function fillCell(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(BOARD_X + x * CELL + 1, BOARD_Y + (y - HIDDEN_ROWS) * CELL + 1, CELL - 2, CELL - 2);
}

function panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, title: string): void {
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  text(ctx, title, x + w / 2, y + 20, 14, '#888', 'center');
}

function text(
  ctx: CanvasRenderingContext2D,
  str: string,
  x: number,
  y: number,
  size: number,
  color: string,
  align: CanvasTextAlign = 'left',
): void {
  ctx.font = `bold ${size}px monospace`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(str, x, y);
}

function line(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number): void {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}
