import { Game, HEIGHT, HIDDEN_ROWS, WIDTH } from './game.js';
import { cells, COLORS, SHAPES, type PieceType } from './pieces.js';

function context(canvas: HTMLCanvasElement, width: number, height: number): CanvasRenderingContext2D {
  const scale = Math.min(window.devicePixelRatio || 1, 3);
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser does not support the 2D canvas required by this game.');
  ctx.scale(scale, scale);
  return ctx;
}

function block(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, type: PieceType, ghost = false): void {
  const color = COLORS[type];
  if (ghost) {
    ctx.fillStyle = `${color}12`;
    ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
    ctx.strokeStyle = `${color}70`;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 2.5, y + 2.5, size - 5, size - 5);
    return;
  }
  ctx.fillStyle = color;
  ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
  ctx.fillStyle = '#ffffff35';
  ctx.fillRect(x + 2, y + 2, size - 4, 2);
  ctx.fillStyle = '#00000018';
  ctx.fillRect(x + 2, y + size - 4, size - 4, 2);
  ctx.strokeStyle = '#ffffff16';
  ctx.strokeRect(x + 5.5, y + 5.5, size - 11, size - 11);
}

function preview(ctx: CanvasRenderingContext2D, type: PieceType, centerY: number, size: number): void {
  const shape = SHAPES[type][0];
  const xs = shape.map(([x]) => x), ys = shape.map(([, y]) => y);
  const minX = Math.min(...xs), minY = Math.min(...ys);
  const width = Math.max(...xs) - minX + 1, height = Math.max(...ys) - minY + 1;
  for (const [x, y] of shape) {
    block(ctx, (144 - width * size) / 2 + (x - minX) * size, centerY - height * size / 2 + (y - minY) * size, size, type);
  }
}

export class Renderer {
  private boardContext: CanvasRenderingContext2D;
  private holdContext: CanvasRenderingContext2D;
  private nextContext: CanvasRenderingContext2D;

  constructor(private board: HTMLCanvasElement, private hold: HTMLCanvasElement, private next: HTMLCanvasElement) {
    this.boardContext = context(board, 300, 600);
    this.holdContext = context(hold, 144, 86);
    this.nextContext = context(next, 144, 370);
  }

  resize(): void {
    this.boardContext = context(this.board, 300, 600);
    this.holdContext = context(this.hold, 144, 86);
    this.nextContext = context(this.next, 144, 370);
  }

  draw(game: Game): void {
    const ctx = this.boardContext;
    ctx.clearRect(0, 0, 300, 600);
    ctx.strokeStyle = '#ffffff06';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= WIDTH; x++) { ctx.moveTo(x * 30 + .5, 0); ctx.lineTo(x * 30 + .5, 600); }
    for (let y = 0; y <= HEIGHT; y++) { ctx.moveTo(0, y * 30 + .5); ctx.lineTo(300, y * 30 + .5); }
    ctx.stroke();
    for (let y = HIDDEN_ROWS; y < game.board.length; y++) {
      for (let x = 0; x < WIDTH; x++) {
        const type = game.board[y][x];
        if (type) block(ctx, x * 30, (y - HIDDEN_ROWS) * 30, 30, type);
      }
    }
    if (game.status === 'playing') {
      const ghost = game.ghost();
      if (ghost) for (const [x, y] of cells(ghost)) {
        if (y >= HIDDEN_ROWS) block(ctx, x * 30, (y - HIDDEN_ROWS) * 30, 30, ghost.type, true);
      }
      if (game.active) for (const [x, y] of cells(game.active)) {
        if (y >= HIDDEN_ROWS) block(ctx, x * 30, (y - HIDDEN_ROWS) * 30, 30, game.active.type);
      }
    }
    this.holdContext.clearRect(0, 0, 144, 86);
    this.holdContext.globalAlpha = game.canHold ? 1 : .35;
    if (game.held) preview(this.holdContext, game.held, 43, 25);
    this.holdContext.globalAlpha = 1;
    this.hold.setAttribute('aria-label', game.held ? `Held piece: ${game.held}${game.canHold ? '' : ', unavailable until the current piece locks'}` : 'No piece held');
    this.nextContext.clearRect(0, 0, 144, 370);
    game.queue.slice(0, 5).forEach((type, i) => {
      this.nextContext.globalAlpha = i === 0 ? 1 : .65;
      preview(this.nextContext, type, 46 + i * 72, i === 0 ? 25 : 22);
    });
    this.nextContext.globalAlpha = 1;
    this.next.setAttribute('aria-label', `Next pieces: ${game.queue.join(', ') || 'start to see the queue'}`);
  }
}
