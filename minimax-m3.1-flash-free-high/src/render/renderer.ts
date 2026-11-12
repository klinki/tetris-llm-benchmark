import { FIRST_VISIBLE_ROW } from '../core/constants.js';
import type { Game } from '../core/game.js';
import { cellsOf, PIECE_COLORS, type Cell, type PieceType } from '../core/pieces.js';

const BACKGROUND = '#0e1117';
const BOARD_BG = '#161b24';
const GRID_LINE = '#232a36';
const PANEL_BG = '#121722';
const TEXT = '#d7dee9';
const TEXT_DIM = '#7c8899';
const ACCENT = '#31c7ef';

interface Metrics {
  cell: number;
  boardX: number;
  boardY: number;
  boardWidth: number;
  boardHeight: number;
  panelX: number;
}

/** Draws the game onto a canvas. */
export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly game: Game,
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context is not available');
    this.ctx = ctx;
  }

  /** Draws the current frame. */
  draw(): void {
    const { ctx, canvas } = this;
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, width, height);

    const metrics = this.computeMetrics(width, height);
    this.drawBoard(metrics);
    this.drawStack(metrics);
    this.drawGhost(metrics);
    this.drawCurrent(metrics);
    this.drawPanel(metrics);
    if (this.game.status === 'gameover') this.drawGameOver(metrics);
  }

  private computeMetrics(width: number, height: number): Metrics {
    const panelWidth = Math.min(150, Math.max(110, width * 0.3));
    const boardWidth = width - panelWidth - 24;
    const cell = Math.max(8, Math.floor(Math.min(boardWidth / 10, height / 20)));
    const boardWidthPx = cell * 10;
    const boardHeightPx = cell * 20;
    const boardX = Math.round((width - boardWidthPx - panelWidth) / 2);
    const boardY = Math.round((height - boardHeightPx) / 2);
    return {
      cell,
      boardX,
      boardY,
      boardWidth: boardWidthPx,
      boardHeight: boardHeightPx,
      panelX: boardX + boardWidthPx + 16,
    };
  }

  private drawBoard(metrics: Metrics): void {
    const { ctx } = this;
    const { boardX, boardY, boardWidth, boardHeight, cell } = metrics;
    ctx.fillStyle = BOARD_BG;
    ctx.fillRect(boardX, boardY, boardWidth, boardHeight);

    ctx.strokeStyle = GRID_LINE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 1; x < 10; x++) {
      const gx = boardX + x * cell + 0.5;
      ctx.moveTo(gx, boardY);
      ctx.lineTo(gx, boardY + boardHeight);
    }
    for (let y = 1; y < 20; y++) {
      const gy = boardY + y * cell + 0.5;
      ctx.moveTo(boardX, gy);
      ctx.lineTo(boardX + boardWidth, gy);
    }
    ctx.stroke();

    ctx.strokeStyle = '#2f3947';
    ctx.strokeRect(boardX + 0.5, boardY + 0.5, boardWidth - 1, boardHeight - 1);
  }

  private drawStack(metrics: Metrics): void {
    const { cells } = this.game.board;
    const board = this.game.board;
    for (let y = FIRST_VISIBLE_ROW; y < board.height; y++) {
      for (let x = 0; x < board.width; x++) {
        const value = cells[y * board.width + x]!;
        if (value === 0) continue;
        const color = this.colorOfValue(value);
        this.drawCell(x, y - FIRST_VISIBLE_ROW, metrics, color, false);
      }
    }
  }

  private drawGhost(metrics: Metrics): void {
    const ghost = this.game.ghost();
    if (!ghost) return;
    const { ctx } = this;
    for (const [cx, cy] of cellsOf(ghost.type, ghost.rotation)) {
      const y = ghost.y + cy - FIRST_VISIBLE_ROW;
      if (y < 0) continue;
      const x = ghost.x + cx;
      const px = metrics.boardX + x * metrics.cell;
      const py = metrics.boardY + y * metrics.cell;
      ctx.strokeStyle = this.colorOfType(ghost.type);
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 2;
      ctx.strokeRect(px + 2.5, py + 2.5, metrics.cell - 5, metrics.cell - 5);
      ctx.globalAlpha = 1;
    }
  }

  private drawCurrent(metrics: Metrics): void {
    const piece = this.game.current;
    if (!piece) return;
    for (const [cx, cy] of cellsOf(piece.type, piece.rotation)) {
      const y = piece.y + cy - FIRST_VISIBLE_ROW;
      if (y < 0) continue;
      this.drawCell(piece.x + cx, y, metrics, this.colorOfType(piece.type), true);
    }
  }

  private drawPanel(metrics: Metrics): void {
    const { ctx } = this;
    const panelX = metrics.panelX;
    const panelWidth = Math.max(100, metrics.boardX + metrics.boardWidth + 16 - panelX + 120);
    const panelTop = metrics.boardY;
    const panelHeight = metrics.boardHeight;
    ctx.fillStyle = PANEL_BG;
    ctx.fillRect(panelX, panelTop, panelWidth, panelHeight);

    const cell = Math.max(10, Math.floor(metrics.cell * 0.72));
    let y = panelTop + 14;

    ctx.fillStyle = TEXT_DIM;
    ctx.font = '11px ui-monospace, Menlo, monospace';
    ctx.fillText('HOLD', panelX + 12, y + 10);
    y += 20;
    if (this.game.hold) {
      this.drawMiniPiece(panelX + 12, y, cell, this.game.hold, 0);
    } else {
      ctx.strokeStyle = GRID_LINE;
      ctx.strokeRect(panelX + 12.5, y + 0.5, cell * 4, cell * 2);
    }
    y += cell * 2 + 22;

    ctx.fillStyle = TEXT_DIM;
    ctx.fillText('NEXT', panelX + 12, y + 10);
    y += 20;
    for (const type of this.game.nextQueue()) {
      this.drawMiniPiece(panelX + 12, y, cell, type, 0);
      y += cell * 2 + 6;
    }

    y = panelTop + panelHeight - 92;
    ctx.fillStyle = TEXT_DIM;
    ctx.fillText('SCORE', panelX + 12, y);
    ctx.fillStyle = TEXT;
    ctx.font = 'bold 18px ui-monospace, Menlo, monospace';
    ctx.fillText(String(this.game.score), panelX + 12, y + 22);
    ctx.font = '11px ui-monospace, Menlo, monospace';
    y += 40;
    ctx.fillStyle = TEXT_DIM;
    ctx.fillText('LEVEL', panelX + 12, y);
    ctx.fillText('LINES', panelX + 12, y + 20);
    ctx.fillStyle = TEXT;
    ctx.fillText(String(this.game.level), panelX + 12, y + 40);
    ctx.fillText(String(this.game.lines), panelX + 12, y + 60);
  }

  private drawGameOver(metrics: Metrics): void {
    const { ctx } = this;
    ctx.fillStyle = 'rgba(8, 10, 14, 0.78)';
    ctx.fillRect(metrics.boardX, metrics.boardY, metrics.boardWidth, metrics.boardHeight);
    ctx.textAlign = 'center';
    ctx.fillStyle = ACCENT;
    ctx.font = 'bold 26px ui-monospace, Menlo, monospace';
    ctx.fillText('GAME OVER', metrics.boardX + metrics.boardWidth / 2, metrics.boardY + metrics.boardHeight / 2);
    ctx.fillStyle = TEXT;
    ctx.font = '13px ui-monospace, Menlo, monospace';
    ctx.fillText(
      `score ${this.game.score}  ·  lines ${this.game.lines}`,
      metrics.boardX + metrics.boardWidth / 2,
      metrics.boardY + metrics.boardHeight / 2 + 26,
    );
    ctx.fillStyle = TEXT_DIM;
    ctx.fillText(
      'press R to restart',
      metrics.boardX + metrics.boardWidth / 2,
      metrics.boardY + metrics.boardHeight / 2 + 50,
    );
    ctx.textAlign = 'left';
  }

  private drawMiniPiece(x: number, y: number, cell: number, type: PieceType, rotation: number): void {
    const cells = cellsOf(type, rotation);
    const bounds = this.boundsOf(cells);
    const offsetX = x - bounds.minX * cell;
    const offsetY = y - bounds.minY * cell;
    for (const [cx, cy] of cells) {
      this.drawBlock(offsetX + cx * cell, offsetY + cy * cell, cell, this.colorOfType(type));
    }
  }

  private drawCell(column: number, row: number, metrics: Metrics, color: string, glossy: boolean): void {
    const x = metrics.boardX + column * metrics.cell;
    const y = metrics.boardY + row * metrics.cell;
    this.drawBlock(x, y, metrics.cell, color, glossy);
  }

  private drawBlock(x: number, y: number, size: number, color: string, glossy = true): void {
    const { ctx } = this;
    const inset = Math.max(1, Math.round(size * 0.06));
    const radius = Math.max(2, Math.round(size * 0.18));
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x + inset, y + inset, size - inset * 2, size - inset * 2, radius);
    ctx.fill();
    if (glossy) {
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(x + inset * 2, y + inset * 2, size - inset * 4, (size - inset * 4) * 0.34, radius / 2);
      ctx.fill();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.roundRect(x + inset * 2, y + size * 0.62, size - inset * 4, size * 0.24, radius / 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private boundsOf(cells: readonly Cell[]): { minX: number; minY: number } {
    let minX = Infinity;
    let minY = Infinity;
    for (const [x, y] of cells) {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
    }
    return { minX, minY };
  }

  private colorOfType(type: PieceType): string {
    return PIECE_COLORS[type];
  }

  private colorOfValue(value: number): string {
    const types = Object.keys(PIECE_COLORS) as PieceType[];
    const type = types[value - 1];
    return type ? PIECE_COLORS[type] : '#ffffff';
  }
}
