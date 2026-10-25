import { HEIGHT, WIDTH } from './engine.js';
import type { Game } from './engine.js';
import { cells, COLORS, shape } from './pieces.js';
import type { Kind } from './pieces.js';

function context(canvas: HTMLCanvasElement, width: number, height: number): CanvasRenderingContext2D {
  const ratio = Math.min(window.devicePixelRatio || 1, 3);
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser does not support the Canvas 2D API.');
  ctx.scale(ratio, ratio);
  return ctx;
}
function block(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, ghost = false, opacity = 1): void {
  const gap = 1.5;
  ctx.globalAlpha = opacity;
  if (ghost) {
    ctx.fillStyle = color + '0c';
    ctx.fillRect(x + gap, y + gap, size - 2 * gap, size - 2 * gap);
    ctx.strokeStyle = color + '80';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + gap + .5, y + gap + .5, size - 2 * gap - 1, size - 2 * gap - 1);
  } else {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x + gap, y + gap, size - 2 * gap, size - 2 * gap, 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff30';
    ctx.fillRect(x + gap + 2, y + gap + 1, size - 2 * gap - 4, 2);
    ctx.fillStyle = '#00000020';
    ctx.fillRect(x + gap + 2, y + size - gap - 3, size - 2 * gap - 4, 2);
  }
  ctx.globalAlpha = 1;
}

export class Renderer {
  private board: CanvasRenderingContext2D;
  private hold: CanvasRenderingContext2D;
  private next: CanvasRenderingContext2D;
  private lastRevision = -1;
  private holdWidth = 140;
  private holdHeight = 86;
  private nextWidth = 140;
  private nextHeight = 300;
  private flashRows: number[] = [];
  private flashUntil = 0;
  constructor(private readonly boardCanvas: HTMLCanvasElement, private readonly holdCanvas: HTMLCanvasElement, private readonly nextCanvas: HTMLCanvasElement) {
    this.board = context(boardCanvas, 300, 600);
    this.hold = context(holdCanvas, 140, 86);
    this.next = context(nextCanvas, 140, 300);
    const resize = (): void => {
      this.holdWidth = holdCanvas.clientWidth;
      this.holdHeight = holdCanvas.clientHeight;
      this.nextWidth = nextCanvas.clientWidth;
      this.nextHeight = nextCanvas.clientHeight;
      this.hold = context(holdCanvas, this.holdWidth, this.holdHeight);
      this.next = context(nextCanvas, this.nextWidth, this.nextHeight);
      this.board = context(boardCanvas, 300, 600);
      this.lastRevision = -1;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(holdCanvas);
    observer.observe(nextCanvas);
    observer.observe(boardCanvas);
    resize();
  }
  flash(rows: number[]): void { this.flashRows = rows; this.flashUntil = performance.now() + 220; }
  draw(game: Game, now: number): void {
    const flashing = now < this.flashUntil;
    if (game.revision === this.lastRevision && !flashing && !this.flashRows.length) return;
    this.lastRevision = game.revision;
    const ctx = this.board;
    ctx.clearRect(0, 0, 300, 600);
    ctx.fillStyle = '#141912';
    ctx.fillRect(0, 0, 300, 600);
    ctx.strokeStyle = '#26301f80';
    ctx.lineWidth = .5;
    ctx.beginPath();
    for (let x = 1; x < WIDTH; x++) { ctx.moveTo(x * 30, 0); ctx.lineTo(x * 30, 600); }
    for (let y = 1; y < HEIGHT; y++) { ctx.moveTo(0, y * 30); ctx.lineTo(300, y * 30); }
    ctx.stroke();
    // Keep paused and finished boards private beneath the overlay.
    if (game.phase === 'playing') {
      for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
          const kind = game.cell(x, y);
          if (kind) block(ctx, x * 30, y * 30, 30, COLORS[kind]);
        }
      }
      const ghost = game.ghost();
      if (ghost) for (const [x, y] of cells(ghost)) if (y >= 0) block(ctx, x * 30, y * 30, 30, COLORS[ghost.kind], true);
      if (game.active) for (const [x, y] of cells(game.active)) if (y >= 0) block(ctx, x * 30, y * 30, 30, COLORS[game.active.kind]);
      if (flashing) {
        ctx.fillStyle = `rgba(220, 241, 194, ${(this.flashUntil - now) / 220 * .45})`;
        for (const row of this.flashRows) ctx.fillRect(0, row * 30, 300, 30);
      }
    }
    if (!flashing) this.flashRows = [];
    this.hold.clearRect(0, 0, this.holdWidth, this.holdHeight);
    if (game.held) this.preview(this.hold, game.held, this.holdWidth / 2, this.holdHeight / 2 - 3, Math.min(24, this.holdWidth / 5), game.canHold ? 1 : .32);
    this.holdCanvas.setAttribute('aria-label', `Held piece: ${game.held ?? 'empty'}${game.canHold ? '' : ', available after placing this piece'}`);
    this.next.clearRect(0, 0, this.nextWidth, this.nextHeight);
    const slot = this.nextHeight / 5;
    const size = Math.min(24, this.nextWidth / 4.5, slot * .37);
    game.queue.slice(0, 5).forEach((kind, i) => this.preview(this.next, kind, this.nextWidth / 2, slot * (i + .5), size * (i === 0 ? 1 : .9), i === 0 ? 1 : .7));
    this.nextCanvas.setAttribute('aria-label', 'Next five pieces: ' + game.queue.slice(0, 5).join(', '));
    this.boardCanvas.dataset.phase = game.phase;
  }
  private preview(ctx: CanvasRenderingContext2D, kind: Kind, cx: number, cy: number, size: number, opacity: number): void {
    const points = shape(kind);
    const xs = points.map(([x]) => x), ys = points.map(([, y]) => y);
    const minX = Math.min(...xs), minY = Math.min(...ys);
    const width = (Math.max(...xs) - minX + 1) * size;
    const height = (Math.max(...ys) - minY + 1) * size;
    for (const [x, y] of points) block(ctx, cx - width / 2 + (x - minX) * size, cy - height / 2 + (y - minY) * size, size, COLORS[kind], false, opacity);
  }
}
