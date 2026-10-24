import {
  COLS,
  HIDDEN_ROWS,
  ROWS,
  VISIBLE_ROWS,
  type Game,
} from './game.js';
import { COLORS, getCells, type PieceType } from './tetromino.js';

const CELL = 30;
const BOARD_X = 30;
const BOARD_Y = 30;
const BOARD_WIDTH = COLS * CELL;
const BOARD_HEIGHT = VISIBLE_ROWS * CELL;

const DESIGN_WIDTH = 640;
const DESIGN_HEIGHT = 700;

const SIDE_X = BOARD_X + BOARD_WIDTH + 30;
const SIDE_WIDTH = DESIGN_WIDTH - SIDE_X - 30;

const HOLD_BOX = {
  x: SIDE_X,
  y: 55,
  width: SIDE_WIDTH,
  height: 100,
};

const NEXT_LABEL_Y = 185;
const NEXT_TOP = 205;
const NEXT_HEIGHT = 66;
const NEXT_GAP = 8;
const NEXT_COUNT = 5;

const STATS_Y = 585;

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
): void {
  const inset = 1;
  const edge = Math.max(2, Math.round(size * 0.12));

  ctx.fillStyle = color;
  ctx.fillRect(x + inset, y + inset, size - inset * 2, size - inset * 2);

  // Light top edge and darker bottom edge give the blocks depth.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.fillRect(x + inset, y + inset, size - inset * 2, edge);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.fillRect(
    x + inset,
    y + size - inset - edge,
    size - inset * 2,
    edge,
  );
}

function drawGhostBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
): void {
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 3, y + 3, size - 6, size - 6);
  ctx.restore();
}

export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas 2D context is not available');
    }

    this.ctx = ctx;
    this.resize();
  }

  resize(): void {
    const ratio = window.devicePixelRatio || 1;
    this.canvas.width = Math.round(DESIGN_WIDTH * ratio);
    this.canvas.height = Math.round(DESIGN_HEIGHT * ratio);
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  draw(game: Game): void {
    const ctx = this.ctx;

    ctx.clearRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
    this.drawBackground();
    this.drawBoard(game);
    this.drawHold(game.holdType);
    this.drawNext(game.queue);
    this.drawStats(game);

    if (game.gameOver) {
      this.drawGameOver();
    }
  }

  private drawBackground(): void {
    const ctx = this.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, DESIGN_HEIGHT);

    gradient.addColorStop(0, '#111827');
    gradient.addColorStop(1, '#070b13');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
  }

  private drawBoard(game: Game): void {
    const ctx = this.ctx;

    ctx.save();
    roundedRect(
      ctx,
      BOARD_X - 6,
      BOARD_Y - 6,
      BOARD_WIDTH + 12,
      BOARD_HEIGHT + 12,
      10,
    );
    ctx.fillStyle = 'rgba(2, 6, 15, 0.9)';
    ctx.fill();

    ctx.beginPath();
    ctx.rect(BOARD_X, BOARD_Y, BOARD_WIDTH, BOARD_HEIGHT);
    ctx.clip();

    ctx.fillStyle = '#05080f';
    ctx.fillRect(BOARD_X, BOARD_Y, BOARD_WIDTH, BOARD_HEIGHT);

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.09)';
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let x = 1; x < COLS; x += 1) {
      ctx.moveTo(BOARD_X + x * CELL + 0.5, BOARD_Y);
      ctx.lineTo(BOARD_X + x * CELL + 0.5, BOARD_Y + BOARD_HEIGHT);
    }

    for (let y = 1; y < VISIBLE_ROWS; y += 1) {
      ctx.moveTo(BOARD_X, BOARD_Y + y * CELL + 0.5);
      ctx.lineTo(BOARD_X + BOARD_WIDTH, BOARD_Y + y * CELL + 0.5);
    }

    ctx.stroke();

    // Ghost projection.
    const ghostY = game.ghostY();
    if (game.active && ghostY !== null && !game.gameOver) {
      const color = COLORS[game.active.type];
      for (const [cellX, cellY] of getCells(
        game.active.type,
        game.active.rotation,
      )) {
        const y = ghostY + cellY;

        if (y < HIDDEN_ROWS || y >= ROWS) {
          continue;
        }

        drawGhostBlock(
          ctx,
          BOARD_X + (game.active.x + cellX) * CELL,
          BOARD_Y + (y - HIDDEN_ROWS) * CELL,
          CELL,
          color,
        );
      }
    }

    // Settled blocks.
    for (let y = HIDDEN_ROWS; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        const type = game.board[y][x];

        if (type) {
          drawBlock(
            ctx,
            BOARD_X + x * CELL,
            BOARD_Y + (y - HIDDEN_ROWS) * CELL,
            CELL,
            COLORS[type],
          );
        }
      }
    }

    // Active piece.
    if (game.active && !game.gameOver) {
      const color = COLORS[game.active.type];
      for (const [cellX, cellY] of getCells(
        game.active.type,
        game.active.rotation,
      )) {
        const y = game.active.y + cellY;

        if (y < HIDDEN_ROWS || y >= ROWS) {
          continue;
        }

        drawBlock(
          ctx,
          BOARD_X + (game.active.x + cellX) * CELL,
          BOARD_Y + (y - HIDDEN_ROWS) * CELL,
          CELL,
          color,
        );
      }
    }

    ctx.restore();

    ctx.save();
    roundedRect(
      ctx,
      BOARD_X - 6,
      BOARD_Y - 6,
      BOARD_WIDTH + 12,
      BOARD_HEIGHT + 12,
      10,
    );
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  private drawHold(type: PieceType | null): void {
    this.drawPanelLabel('HOLD', BOARD_X + BOARD_WIDTH + 30, 30);
    this.drawBox(HOLD_BOX.x, HOLD_BOX.y, HOLD_BOX.width, HOLD_BOX.height);

    this.drawPreview(
      type,
      HOLD_BOX.x + HOLD_BOX.width / 2,
      HOLD_BOX.y + HOLD_BOX.height / 2,
      24,
    );
  }

  private drawNext(queue: readonly PieceType[]): void {
    this.drawPanelLabel('NEXT', BOARD_X + BOARD_WIDTH + 30, NEXT_LABEL_Y);

    for (let i = 0; i < NEXT_COUNT; i += 1) {
      const y = NEXT_TOP + i * (NEXT_HEIGHT + NEXT_GAP);
      this.drawBox(SIDE_X, y, SIDE_WIDTH, NEXT_HEIGHT);
      this.drawPreview(
        queue[i] ?? null,
        SIDE_X + SIDE_WIDTH / 2,
        y + NEXT_HEIGHT / 2,
        i === 0 ? 24 : 19,
      );
    }
  }

  private drawPreview(
    type: PieceType | null,
    centerX: number,
    centerY: number,
    size: number,
  ): void {
    if (!type) {
      return;
    }

    const ctx = this.ctx;
    const cells = getCells(type, 0);
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const [x, y] of cells) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }

    const width = (maxX - minX + 1) * size;
    const height = (maxY - minY + 1) * size;
    const originX = centerX - width / 2 - minX * size;
    const originY = centerY - height / 2 - minY * size;

    for (const [x, y] of cells) {
      drawBlock(
        ctx,
        originX + x * size,
        originY + y * size,
        size,
        COLORS[type],
      );
    }
  }

  private drawStats(game: Game): void {
    this.drawStatRow('SCORE', game.score.toLocaleString('en-US'), STATS_Y);
    this.drawStatRow('LEVEL', String(game.level), STATS_Y + 34);
    this.drawStatRow('LINES', String(game.lines), STATS_Y + 68);
  }

  private drawStatRow(label: string, value: string, y: number): void {
    const ctx = this.ctx;

    ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
    ctx.font = '600 13px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, SIDE_X, y);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '700 17px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(value, SIDE_X + SIDE_WIDTH, y);
  }

  private drawPanelLabel(text: string, x: number, y: number): void {
    const ctx = this.ctx;

    ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
    ctx.font = '700 13px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
  }

  private drawBox(
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    const ctx = this.ctx;

    ctx.save();
    roundedRect(ctx, x, y, width, height, 8);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  private drawGameOver(): void {
    const ctx = this.ctx;

    ctx.save();
    ctx.fillStyle = 'rgba(3, 7, 18, 0.82)';
    ctx.fillRect(BOARD_X, BOARD_Y, BOARD_WIDTH, BOARD_HEIGHT);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f8fafc';
    ctx.font = '800 34px ui-sans-serif, system-ui, sans-serif';
    ctx.fillText(
      'GAME OVER',
      BOARD_X + BOARD_WIDTH / 2,
      BOARD_Y + BOARD_HEIGHT / 2 - 22,
    );

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 15px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillText(
      'Press R to restart',
      BOARD_X + BOARD_WIDTH / 2,
      BOARD_Y + BOARD_HEIGHT / 2 + 24,
    );
    ctx.restore();
  }
}
