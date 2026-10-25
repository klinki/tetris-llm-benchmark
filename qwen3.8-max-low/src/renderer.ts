// Canvas rendering: playfield with ghost piece, hold box, next queue and stats.
import { BUFFER_ROWS, WIDTH } from './board.js';
import { Game, pieceCells } from './game.js';
import { COLORS, PIECE_TYPES } from './pieces.js';
import type { PieceType } from './pieces.js';

const CELL = 30;

export class Renderer {
  private mainCtx: CanvasRenderingContext2D;
  private holdCtx: CanvasRenderingContext2D;
  private nextCtx: CanvasRenderingContext2D;

  constructor(
    private main: HTMLCanvasElement,
    private hold: HTMLCanvasElement,
    private next: HTMLCanvasElement,
    private stats: { score: HTMLElement; level: HTMLElement; lines: HTMLElement },
    private overlay: HTMLElement
  ) {
    this.mainCtx = main.getContext('2d')!;
    this.holdCtx = hold.getContext('2d')!;
    this.nextCtx = next.getContext('2d')!;
  }

  draw(game: Game): void {
    this.drawPlayfield(game);
    this.drawHold(game);
    this.drawNext(game);
    this.stats.score.textContent = String(game.score);
    this.stats.level.textContent = String(game.level);
    this.stats.lines.textContent = String(game.lines);
    this.overlay.style.display = game.state === 'over' ? 'flex' : 'none';
  }

  private drawCell(
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    size: number,
    color: string,
    ghost = false
  ): void {
    if (ghost) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(px + 2, py + 2, size - 4, size - 4);
      return;
    }
    ctx.fillStyle = color;
    ctx.fillRect(px, py, size, size);
    // Simple bevel for a subtle 3D look.
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(px, py, size, 3);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(px, py + size - 3, size, 3);
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 0.5, py + 0.5, size - 1, size - 1);
  }

  private drawPlayfield(game: Game): void {
    const ctx = this.mainCtx;
    ctx.fillStyle = '#101018';
    ctx.fillRect(0, 0, this.main.width, this.main.height);

    // Subtle grid lines.
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    for (let x = 1; x < WIDTH; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL, 0);
      ctx.lineTo(x * CELL, this.main.height);
      ctx.stroke();
    }
    for (let y = 1; y < this.main.height / CELL; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL);
      ctx.lineTo(this.main.width, y * CELL);
      ctx.stroke();
    }

    const drawAt = (x: number, y: number, color: string, ghost = false) => {
      if (y < BUFFER_ROWS) return; // hidden spawn buffer
      this.drawCell(ctx, x * CELL, (y - BUFFER_ROWS) * CELL, CELL, color, ghost);
    };

    // Locked cells.
    for (let y = BUFFER_ROWS; y < game.board.grid.length; y++) {
      for (let x = 0; x < WIDTH; x++) {
        const v = game.board.grid[y][x];
        if (v !== 0) drawAt(x, y, COLORS[PIECE_TYPES[v - 1]]);
      }
    }

    // Ghost piece, then the falling piece.
    if (game.piece) {
      const color = COLORS[game.piece.type];
      const ghostY = game.ghostY();
      if (ghostY !== game.piece.y) {
        for (const [x, y] of pieceCells({ ...game.piece, y: ghostY })) {
          drawAt(x, y, color, true);
        }
      }
      for (const [x, y] of pieceCells(game.piece)) drawAt(x, y, color);
    }
  }

  // Draws one piece centered inside a box of the given cell size.
  private drawPiecePreview(
    ctx: CanvasRenderingContext2D,
    type: PieceType,
    cx: number,
    cy: number,
    size: number,
    dimmed: boolean
  ): void {
    const cells = PIECE_CELLS[type];
    const minX = Math.min(...cells.map(([x]) => x));
    const maxX = Math.max(...cells.map(([x]) => x));
    const minY = Math.min(...cells.map(([, y]) => y));
    const maxY = Math.max(...cells.map(([, y]) => y));
    const w = maxX - minX + 1;
    const h = maxY - minY + 1;
    const color = dimmed ? '#555' : COLORS[type];
    for (const [x, y] of cells) {
      this.drawCell(
        ctx,
        cx + (x - minX - w / 2) * size,
        cy + (y - minY - h / 2) * size,
        size,
        color
      );
    }
  }

  private drawHold(game: Game): void {
    const ctx = this.holdCtx;
    ctx.clearRect(0, 0, this.hold.width, this.hold.height);
    if (game.holdType) {
      this.drawPiecePreview(
        ctx,
        game.holdType,
        this.hold.width / 2,
        this.hold.height / 2,
        22,
        !game.canHold
      );
    }
  }

  private drawNext(game: Game): void {
    const ctx = this.nextCtx;
    ctx.clearRect(0, 0, this.next.width, this.next.height);
    const slot = this.next.height / game.nextQueue.length;
    game.nextQueue.forEach((type, i) => {
      this.drawPiecePreview(ctx, type, this.next.width / 2, slot * (i + 0.5), 20, false);
    });
  }
}

// Spawn-rotation cells used for previews.
const PIECE_CELLS: Record<PieceType, [number, number][]> = {
  I: [[0, 0], [1, 0], [2, 0], [3, 0]],
  O: [[0, 0], [1, 0], [0, 1], [1, 1]],
  T: [[1, 0], [0, 1], [1, 1], [2, 1]],
  S: [[1, 0], [2, 0], [0, 1], [1, 1]],
  Z: [[0, 0], [1, 0], [1, 1], [2, 1]],
  J: [[0, 0], [0, 1], [1, 1], [2, 1]],
  L: [[2, 0], [0, 1], [1, 1], [2, 1]],
};
