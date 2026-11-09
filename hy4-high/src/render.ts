import { BOARD_HEIGHT, BOARD_WIDTH, HIDDEN_ROWS, VISIBLE_HEIGHT } from './board.js';
import { COLORS, PIECE_DEFS } from './pieces.js';
import type { Game } from './game.js';
import type { PieceType } from './types.js';

export interface GameUI {
  board: HTMLCanvasElement;
  hold: HTMLCanvasElement;
  next: HTMLCanvasElement;
  score: HTMLElement;
  level: HTMLElement;
  lines: HTMLElement;
  message: HTMLElement;
  overlay: HTMLElement;
  overlayTitle: HTMLElement;
  overlayText: HTMLElement;
}

const CELL = 30;
const PREVIEW_CELL = 20;
const NEXT_SLOT = 3 * PREVIEW_CELL;

interface CellStyle {
  ghost?: boolean;
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  size: number,
  color: string,
  style: CellStyle = {},
): void {
  ctx.save();
  if (style.ghost) {
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = color;
    ctx.fillRect(px, py, size, size);
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 1, py + 1, size - 2, size - 2);
  } else {
    ctx.fillStyle = color;
    ctx.fillRect(px, py, size, size);
    // Simple bevel so each shape reads as a solid block.
    ctx.fillStyle = 'rgba(255, 255, 255, 0.30)';
    ctx.fillRect(px, py, size, 3);
    ctx.fillRect(px, py, 3, size);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.30)';
    ctx.fillRect(px, py + size - 3, size, 3);
    ctx.fillRect(px + size - 3, py, 3, size);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 0.5, py + 0.5, size - 1, size - 1);
  }
  ctx.restore();
}

/** Draw a single piece centred inside a rectangular preview area. */
function drawPreview(
  ctx: CanvasRenderingContext2D,
  type: PieceType,
  areaX: number,
  areaY: number,
  areaW: number,
  areaH: number,
): void {
  const def = PIECE_DEFS[type];
  const matrix = def.states[0];
  let minX = def.size;
  let maxX = -1;
  let minY = def.size;
  let maxY = -1;
  for (let y = 0; y < def.size; y += 1) {
    for (let x = 0; x < def.size; x += 1) {
      if (matrix[y][x]) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }
  const pieceW = (maxX - minX + 1) * PREVIEW_CELL;
  const pieceH = (maxY - minY + 1) * PREVIEW_CELL;
  const ox = areaX + (areaW - pieceW) / 2 - minX * PREVIEW_CELL;
  const oy = areaY + (areaH - pieceH) / 2 - minY * PREVIEW_CELL;
  for (let y = 0; y < def.size; y += 1) {
    for (let x = 0; x < def.size; x += 1) {
      if (matrix[y][x]) {
        drawCell(ctx, ox + x * PREVIEW_CELL, oy + y * PREVIEW_CELL, PREVIEW_CELL, def.color);
      }
    }
  }
}

export class Renderer {
  constructor(private readonly ui: GameUI) {
    ui.board.width = BOARD_WIDTH * CELL;
    ui.board.height = VISIBLE_HEIGHT * CELL;
    ui.hold.width = 4 * PREVIEW_CELL;
    ui.hold.height = 3 * PREVIEW_CELL;
    ui.next.width = 4 * PREVIEW_CELL;
    ui.next.height = 5 * NEXT_SLOT;
  }

  render(game: Game): void {
    this.drawField(game);
    this.drawPreviews(game);
    this.drawHud(game);
  }

  private drawField(game: Game): void {
    const ctx = this.ui.board.getContext('2d')!;
    const w = this.ui.board.width;
    const h = this.ui.board.height;
    ctx.fillStyle = '#0a0f1e';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.045)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 1; x < BOARD_WIDTH; x += 1) {
      ctx.moveTo(x * CELL + 0.5, 0);
      ctx.lineTo(x * CELL + 0.5, h);
    }
    for (let y = 1; y < VISIBLE_HEIGHT; y += 1) {
      ctx.moveTo(0, y * CELL + 0.5);
      ctx.lineTo(w, y * CELL + 0.5);
    }
    ctx.stroke();

    // Locked cells: only the 20 visible rows are drawn.
    for (let y = HIDDEN_ROWS; y < BOARD_HEIGHT; y += 1) {
      for (let x = 0; x < BOARD_WIDTH; x += 1) {
        const type = game.board.cells[y][x];
        if (type) drawCell(ctx, x * CELL, (y - HIDDEN_ROWS) * CELL, CELL, COLORS[type]);
      }
    }

    // Ghost piece (translucent outline of the landing position).
    const ghost = game.ghost;
    if (ghost) {
      for (const c of game.cellsOf(ghost)) {
        if (c.y >= HIDDEN_ROWS) {
          drawCell(ctx, c.x * CELL, (c.y - HIDDEN_ROWS) * CELL, CELL, COLORS[ghost.type], { ghost: true });
        }
      }
    }

    // Active piece.
    if (game.active) {
      for (const c of game.activeCells) {
        if (c.y >= HIDDEN_ROWS) {
          drawCell(ctx, c.x * CELL, (c.y - HIDDEN_ROWS) * CELL, CELL, COLORS[game.active.type]);
        }
      }
    }
  }

  private drawPreviews(game: Game): void {
    const holdCtx = this.ui.hold.getContext('2d')!;
    holdCtx.fillStyle = '#0a0f1e';
    holdCtx.fillRect(0, 0, this.ui.hold.width, this.ui.hold.height);
    if (game.holdPiece) {
      drawPreview(holdCtx, game.holdPiece, 0, 0, this.ui.hold.width, this.ui.hold.height);
      if (!game.canHoldPiece) {
        holdCtx.fillStyle = 'rgba(10, 15, 30, 0.6)';
        holdCtx.fillRect(0, 0, this.ui.hold.width, this.ui.hold.height);
      }
    }

    const nextCtx = this.ui.next.getContext('2d')!;
    nextCtx.fillStyle = '#0a0f1e';
    nextCtx.fillRect(0, 0, this.ui.next.width, this.ui.next.height);
    const next = game.nextPieces;
    for (let i = 0; i < next.length; i += 1) {
      drawPreview(nextCtx, next[i], 0, i * NEXT_SLOT, this.ui.next.width, NEXT_SLOT);
      if (i > 0) {
        nextCtx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        nextCtx.beginPath();
        nextCtx.moveTo(0, i * NEXT_SLOT + 0.5);
        nextCtx.lineTo(this.ui.next.width, i * NEXT_SLOT + 0.5);
        nextCtx.stroke();
      }
    }
  }

  private drawHud(game: Game): void {
    this.ui.score.textContent = game.score.toLocaleString();
    this.ui.level.textContent = String(game.level);
    this.ui.lines.textContent = String(game.lines);
    const flash = game.flashText;
    this.ui.message.textContent = flash ?? '';
    this.ui.message.style.opacity = flash ? '1' : '0';

    if (game.gameOver) {
      this.showOverlay('GAME OVER', 'Press R or click to restart');
    } else if (game.paused) {
      this.showOverlay('PAUSED', 'Press P to resume');
    } else {
      this.ui.overlay.classList.add('hidden');
    }
  }

  private showOverlay(title: string, text: string): void {
    this.ui.overlayTitle.textContent = title;
    this.ui.overlayText.textContent = text;
    this.ui.overlay.classList.remove('hidden');
  }
}
