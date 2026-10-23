import { Cell, COLS, ROWS, COLORS, PieceType } from './types';
import { Game } from './game';
import { cellsOf, Piece } from './tetromino';

const BOARD_CELL = 24; // 240 / 10

export class Renderer {
  private boardCtx: CanvasRenderingContext2D;
  private holdCtx: CanvasRenderingContext2D;
  private nextCtx: CanvasRenderingContext2D;
  private scoreEl: HTMLElement;
  private levelEl: HTMLElement;
  private linesEl: HTMLElement;
  private overlay: HTMLElement;
  private overlayTitle: HTMLElement;
  private overlayMsg: HTMLElement;
  private finalScoreEl: HTMLElement;

  constructor() {
    const boardCanvas = document.getElementById('board') as HTMLCanvasElement;
    const holdCanvas = document.getElementById('holdCanvas') as HTMLCanvasElement;
    const nextCanvas = document.getElementById('nextCanvas') as HTMLCanvasElement;
    this.boardCtx = boardCanvas.getContext('2d')!;
    this.holdCtx = holdCanvas.getContext('2d')!;
    this.nextCtx = nextCanvas.getContext('2d')!;
    this.scoreEl = document.getElementById('score')!;
    this.levelEl = document.getElementById('level')!;
    this.linesEl = document.getElementById('lines')!;
    this.overlay = document.getElementById('overlay')!;
    this.overlayTitle = document.getElementById('overlayTitle')!;
    this.overlayMsg = document.getElementById('overlayMsg')!;
    this.finalScoreEl = document.getElementById('finalScore')!;
  }

  draw(game: Game) {
    const s = game.state;
    this.drawBoard(s.board, s.piece, s.ghost);
    this.drawHold(s.hold);
    this.drawNext(s.next);
    this.scoreEl.textContent = String(s.score);
    this.levelEl.textContent = String(s.level);
    this.linesEl.textContent = String(s.lines);

    if (s.gameOver) {
      this.overlayTitle.textContent = 'GAME OVER';
      this.overlayMsg.textContent = 'Final score';
      this.finalScoreEl.textContent = String(s.score);
      this.overlay.classList.add('visible');
    } else {
      this.overlay.classList.remove('visible');
    }
  }

  private drawBoard(board: Cell[][], piece: Piece | null, ghost: Piece | null) {
    const ctx = this.boardCtx;
    ctx.clearRect(0, 0, 240, 480);

    // Ghost piece
    if (ghost) {
      const gCells = cellsOf(ghost.type, ghost.rot).map(({ x, y }) => [ghost.x + x, ghost.y + y] as [number, number]);
      this.drawCells(ctx, gCells, 'rgba(255,255,255,0.15)', true);
    }

    // Locked cells
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const type = board[y][x];
        if (type) this.drawCell(ctx, x, y, COLORS[type as keyof typeof COLORS]);
      }
    }

    // Active piece
    if (piece) {
      const cells = cellsOf(piece.type, piece.rot).map(({ x, y }) => [piece.x + x, piece.y + y] as [number, number]);
      this.drawCells(ctx, cells, COLORS[piece.type as keyof typeof COLORS]);
    }
  }

  private drawCells(
    ctx: CanvasRenderingContext2D,
    cells: [number, number][],
    color: string,
    outlineOnly = false,
  ) {
    for (const [x, y] of cells) {
      if (y < 0) continue;
      this.drawCell(ctx, x, y, color, outlineOnly);
    }
  }

  private drawCell(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, outlineOnly = false) {
    const px = x * BOARD_CELL;
    const py = y * BOARD_CELL;
    const size = BOARD_CELL;
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    if (outlineOnly) {
      ctx.strokeRect(px + 1, py + 1, size - 2, size - 2);
    } else {
      ctx.fillStyle = color;
      ctx.fillRect(px, py, size, size);
      ctx.strokeRect(px, py, size, size);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(px + 2, py + 2, size - 4, 4);
      ctx.fillRect(px + 2, py + 2, 4, size - 4);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(px + 2, py + size - 6, size - 4, 4);
      ctx.fillRect(px + size - 6, py + 2, 4, size - 4);
    }
  }

  private drawHold(type: PieceType | null) {
    const ctx = this.holdCtx;
    ctx.clearRect(0, 0, 100, 100);
    if (!type) return;
    this.drawPieceAt(ctx, type, 50, 50, 20);
  }

  private drawNext(next: readonly PieceType[]) {
    const ctx = this.nextCtx;
    ctx.clearRect(0, 0, 120, 240);
    for (let i = 0; i < Math.min(next.length, 3); i++) {
      this.drawPieceAt(ctx, next[i], 60, 40 + i * 72, 16);
    }
  }

  private drawPieceAt(ctx: CanvasRenderingContext2D, type: PieceType, cx: number, cy: number, cell: number) {
    const cells = cellsOf(type, 0);
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const { x, y } of cells) {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
    const w = maxX - minX + 1;
    const h = maxY - minY + 1;
    const ox = cx - (w * cell) / 2;
    const oy = cy - (h * cell) / 2;
    ctx.fillStyle = COLORS[type];
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    for (const { x, y } of cells) {
      const px = ox + (x - minX) * cell;
      const py = oy + (y - minY) * cell;
      ctx.fillRect(px, py, cell, cell);
      ctx.strokeRect(px, py, cell, cell);
    }
  }
}
