import { COLORS, COLS, ROWS, type PieceType } from './constants.js';
import { getCells } from './pieces.js';
import type { Game } from './game.js';

const CELL = 30;

function drawCells(
  ctx: CanvasRenderingContext2D,
  cells: Array<[number, number]>,
  color: string,
  ghost = false,
  ox = 0,
  oy = 0,
  size = CELL,
): void {
  for (const [x, y] of cells) {
    const px = ox + x * size;
    const py = oy + y * size;
    if (y < 0 || y >= ROWS) continue;
    if (ghost) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.6;
      ctx.strokeRect(px + 1, py + 1, size - 2, size - 2);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = color;
      ctx.fillRect(px, py, size, size);
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, py + 0.5, size - 1, size - 1);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(px, py, size, 4);
    }
  }
}

export class Renderer {
  constructor(
    private boardCanvas: HTMLCanvasElement,
    private holdCanvas: HTMLCanvasElement,
    private nextCanvas: HTMLCanvasElement,
  ) {
    boardCanvas.width = COLS * CELL;
    boardCanvas.height = ROWS * CELL;
    holdCanvas.width = 4 * 22;
    holdCanvas.height = 3 * 22;
    nextCanvas.width = 4 * 22;
    nextCanvas.height = 5 * 3 * 22;
  }

  render(game: Game): void {
    this.drawBoard(game);
    this.drawHold(game.held);
    this.drawNext(game.queuePreview);
  }

  private drawBoard(game: Game): void {
    const ctx = this.boardCanvas.getContext('2d')!;
    ctx.clearRect(0, 0, this.boardCanvas.width, this.boardCanvas.height);
    ctx.fillStyle = '#11141c';
    ctx.fillRect(0, 0, this.boardCanvas.width, this.boardCanvas.height);

    // Settled blocks (visible rows only).
    const grid = game.visibleGrid();
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++) {
        const t = grid[y][x];
        if (t) drawCells(ctx, [[x, y]], COLORS[t]);
      }

    // Ghost + active piece.
    if (game.current) {
      drawCells(ctx, game.ghostCellsAbsolute(), COLORS[game.current.type], true);
      drawCells(ctx, game.currentCellsAbsolute(), COLORS[game.current.type]);
    }

    if (game.gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(0, 0, this.boardCanvas.width, this.boardCanvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', this.boardCanvas.width / 2, this.boardCanvas.height / 2 - 10);
      ctx.font = '14px sans-serif';
      ctx.fillText('Press R to restart', this.boardCanvas.width / 2, this.boardCanvas.height / 2 + 16);
    }
  }

  private drawMini(canvas: HTMLCanvasElement, types: (PieceType | null)[], rows: number): void {
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#1a1f2b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const s = 22;
    types.forEach((t, i) => {
      if (!t) return;
      const cells = getCells(t, 0);
      const oy = i * 3 * s + 4;
      for (const [x, y] of cells) {
        ctx.fillStyle = COLORS[t];
        ctx.fillRect(x * s + 8, oy + y * s, s - 2, s - 2);
      }
      void rows;
    });
  }

  private drawHold(held: PieceType | null): void {
    this.drawMini(this.holdCanvas, [held], 1);
  }

  private drawNext(queue: PieceType[]): void {
    this.drawMini(this.nextCanvas, queue.slice(0, 5), 5);
  }
}
