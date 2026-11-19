import { Game, HIDDEN, WIDTH, HEIGHT } from './game.js';
import { cells, COLORS, shape, type PieceType } from './pieces.js';

function context(canvas: HTMLCanvasElement, width: number, height: number): CanvasRenderingContext2D {
  const ratio = Math.min(window.devicePixelRatio || 1, 3);
  if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser does not support Canvas 2D.');
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);
  return ctx;
}

function block(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, ghost = false): void {
  const inset = 1.5;
  if (ghost) {
    ctx.fillStyle = `${color}0d`;
    ctx.fillRect(x + inset, y + inset, size - inset * 2, size - inset * 2);
    ctx.strokeStyle = `${color}60`;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 2.5, y + 2.5, size - 5, size - 5);
    return;
  }
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x + inset, y + inset, size - inset * 2, size - inset * 2, 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff35';
  ctx.fillRect(x + 4, y + 3, size - 8, 2);
  ctx.fillStyle = '#00000015';
  ctx.fillRect(x + 3, y + size - 5, size - 6, 2);
}

export class Renderer {
  constructor(private readonly board: HTMLCanvasElement, private readonly hold: HTMLCanvasElement, private readonly next: HTMLCanvasElement) {}

  draw(game: Game): void {
    const size = 32;
    const ctx = context(this.board, WIDTH * size, (HEIGHT - HIDDEN) * size);
    ctx.fillStyle = '#0e1714';
    ctx.fillRect(0, 0, 320, 640);
    ctx.strokeStyle = '#b6e9c308';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 1; x < WIDTH; x++) { ctx.moveTo(x * size + .5, 0); ctx.lineTo(x * size + .5, 640); }
    for (let y = 1; y < HEIGHT - HIDDEN; y++) { ctx.moveTo(0, y * size + .5); ctx.lineTo(320, y * size + .5); }
    ctx.stroke();
    for (let y = HIDDEN; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        const type = game.board[y]![x];
        if (type) block(ctx, x * size, (y - HIDDEN) * size, size, COLORS[type]);
      }
    }
    const ghost = game.ghost();
    if (ghost && game.status !== 'over') {
      for (const [x, y] of cells(ghost)) if (y >= HIDDEN) block(ctx, x * size, (y - HIDDEN) * size, size, COLORS[ghost.type], true);
    }
    if (game.active && game.status !== 'over') {
      for (const [x, y] of cells(game.active)) if (y >= HIDDEN) block(ctx, x * size, (y - HIDDEN) * size, size, COLORS[game.active.type]);
    }
    const holdWidth = this.hold.clientWidth, holdHeight = this.hold.clientHeight;
    const holdCtx = context(this.hold, holdWidth, holdHeight);
    if (game.held) {
      holdCtx.globalAlpha = game.canHold ? 1 : .3;
      this.preview(holdCtx, game.held, holdWidth / 2, holdHeight / 2, Math.min(23, holdWidth / 5));
      holdCtx.globalAlpha = 1;
    } else {
      holdCtx.strokeStyle = '#53695b';
      holdCtx.setLineDash([3, 5]);
      holdCtx.strokeRect(holdWidth / 2 - 22.5, holdHeight / 2 - 19.5, 45, 38);
    }
    this.hold.setAttribute('aria-label', game.held ? `Held piece: ${game.held}${game.canHold ? '' : ', used this turn'}` : 'No held piece');
    const nextWidth = this.next.clientWidth, nextHeight = this.next.clientHeight;
    const nextCtx = context(this.next, nextWidth, nextHeight);
    const slot = nextHeight / 5;
    game.queue.forEach((type, i) => this.preview(nextCtx, type, nextWidth / 2, slot * (i + .5), Math.min(i === 0 ? 24 : 20, nextWidth / 5, slot / 2.5)));
    this.next.setAttribute('aria-label', `Next pieces: ${game.queue.join(', ')}`);
  }

  private preview(ctx: CanvasRenderingContext2D, type: PieceType, centerX: number, centerY: number, size: number): void {
    const points = shape(type);
    const xs = points.map(([x]) => x), ys = points.map(([, y]) => y);
    const minX = Math.min(...xs), minY = Math.min(...ys);
    const width = Math.max(...xs) - minX + 1, height = Math.max(...ys) - minY + 1;
    for (const [x, y] of points) block(ctx, centerX - width * size / 2 + (x - minX) * size, centerY - height * size / 2 + (y - minY) * size, size, COLORS[type]);
  }
}
