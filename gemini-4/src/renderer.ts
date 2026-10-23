import {
  BUFFER_ROWS,
  COLS,
  PIECE_COLORS,
  PIECE_SHAPES,
  VISIBLE_ROWS,
} from './constants.js';
import { GameSnapshot, PieceType } from './types.js';

const CELL_SIZE = 32;

export class TetrisRenderer {
  private readonly boardCanvas: HTMLCanvasElement;
  private readonly boardCtx: CanvasRenderingContext2D;
  private readonly holdCanvas: HTMLCanvasElement;
  private readonly holdCtx: CanvasRenderingContext2D;
  private readonly nextCanvas: HTMLCanvasElement;
  private readonly nextCtx: CanvasRenderingContext2D;

  private readonly scoreEl: HTMLElement;
  private readonly highScoreEl: HTMLElement;
  private readonly linesEl: HTMLElement;
  private readonly levelEl: HTMLElement;
  private readonly actionBannerEl: HTMLElement;
  private readonly overlayEl: HTMLElement;
  private readonly overlayTitleEl: HTMLElement;
  private readonly overlaySubtitleEl: HTMLElement;
  private readonly pauseBtn: HTMLButtonElement;

  constructor() {
    this.boardCanvas = document.getElementById('board-canvas') as HTMLCanvasElement;
    this.boardCtx = this.boardCanvas.getContext('2d')!;

    this.holdCanvas = document.getElementById('hold-canvas') as HTMLCanvasElement;
    this.holdCtx = this.holdCanvas.getContext('2d')!;

    this.nextCanvas = document.getElementById('next-canvas') as HTMLCanvasElement;
    this.nextCtx = this.nextCanvas.getContext('2d')!;

    this.scoreEl = document.getElementById('stat-score')!;
    this.highScoreEl = document.getElementById('stat-highscore')!;
    this.linesEl = document.getElementById('stat-lines')!;
    this.levelEl = document.getElementById('stat-level')!;
    this.actionBannerEl = document.getElementById('action-banner')!;
    this.overlayEl = document.getElementById('board-overlay')!;
    this.overlayTitleEl = document.getElementById('overlay-title')!;
    this.overlaySubtitleEl = document.getElementById('overlay-subtitle')!;
    this.pauseBtn = document.getElementById('btn-pause') as HTMLButtonElement;

    this.boardCanvas.width = COLS * CELL_SIZE;
    this.boardCanvas.height = VISIBLE_ROWS * CELL_SIZE;
  }

  public render(snapshot: GameSnapshot): void {
    this.renderBoard(snapshot);
    this.renderHold(snapshot.holdPiece, snapshot.canHold);
    this.renderNextQueue(snapshot.nextQueue);
    this.renderStats(snapshot);
    this.renderOverlay(snapshot);
  }

  private renderBoard(snapshot: GameSnapshot): void {
    const ctx = this.boardCtx;
    const width = this.boardCanvas.width;
    const height = this.boardCanvas.height;

    // Playfield background
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, width, height);

    // Subtle grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let c = 1; c < COLS; c++) {
      const x = c * CELL_SIZE + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let r = 1; r < VISIBLE_ROWS; r++) {
      const y = r * CELL_SIZE + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Locked blocks on board
    for (let r = BUFFER_ROWS; r < BUFFER_ROWS + VISIBLE_ROWS; r++) {
      const visibleRow = r - BUFFER_ROWS;
      for (let c = 0; c < COLS; c++) {
        const cell = snapshot.board[r][c];
        if (cell !== null) {
          this.drawBlock(ctx, c * CELL_SIZE, visibleRow * CELL_SIZE, CELL_SIZE, cell, 1);
        }
      }
    }

    // Ghost piece
    if (snapshot.activePiece && snapshot.ghostY !== null && !snapshot.gameOver) {
      const { type, rotation, x } = snapshot.activePiece;
      const offsets = PIECE_SHAPES[type][rotation];
      for (const pt of offsets) {
        const boardX = x + pt.x;
        const boardY = snapshot.ghostY + pt.y;
        if (boardY >= BUFFER_ROWS) {
          const drawX = boardX * CELL_SIZE;
          const drawY = (boardY - BUFFER_ROWS) * CELL_SIZE;
          this.drawGhostBlock(ctx, drawX, drawY, CELL_SIZE, type);
        }
      }
    }

    // Active piece
    if (snapshot.activePiece && !snapshot.gameOver) {
      const { type, rotation, x, y } = snapshot.activePiece;
      const offsets = PIECE_SHAPES[type][rotation];
      for (const pt of offsets) {
        const boardX = x + pt.x;
        const boardY = y + pt.y;
        if (boardY >= BUFFER_ROWS) {
          const drawX = boardX * CELL_SIZE;
          const drawY = (boardY - BUFFER_ROWS) * CELL_SIZE;
          this.drawBlock(ctx, drawX, drawY, CELL_SIZE, type, 1);
        }
      }
    }
  }

  private renderHold(holdPiece: PieceType | null, canHold: boolean): void {
    const ctx = this.holdCtx;
    const width = this.holdCanvas.width;
    const height = this.holdCanvas.height;

    ctx.clearRect(0, 0, width, height);
    if (!holdPiece) return;

    this.drawMiniPiece(
      ctx,
      holdPiece,
      width / 2,
      height / 2,
      24,
      canHold ? 1 : 0.38
    );
  }

  private renderNextQueue(nextQueue: PieceType[]): void {
    const ctx = this.nextCtx;
    const width = this.nextCanvas.width;
    const height = this.nextCanvas.height;

    ctx.clearRect(0, 0, width, height);

    const slotHeight = height / 5;
    for (let i = 0; i < Math.min(5, nextQueue.length); i++) {
      const piece = nextQueue[i];
      const centerY = slotHeight * i + slotHeight / 2;
      const cellSize = i === 0 ? 24 : 20;
      this.drawMiniPiece(ctx, piece, width / 2, centerY, cellSize, 1);
    }
  }

  private drawMiniPiece(
    ctx: CanvasRenderingContext2D,
    type: PieceType,
    centerX: number,
    centerY: number,
    cellSize: number,
    alpha: number
  ): void {
    const offsets = PIECE_SHAPES[type][0];
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const pt of offsets) {
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.y > maxY) maxY = pt.y;
    }

    const pieceWidth = (maxX - minX + 1) * cellSize;
    const pieceHeight = (maxY - minY + 1) * cellSize;
    const startX = centerX - pieceWidth / 2;
    const startY = centerY - pieceHeight / 2;

    for (const pt of offsets) {
      const x = startX + (pt.x - minX) * cellSize;
      const y = startY + (pt.y - minY) * cellSize;
      this.drawBlock(ctx, x, y, cellSize, type, alpha);
    }
  }

  private drawBlock(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    type: PieceType,
    alpha: number
  ): void {
    const palette = PIECE_COLORS[type];
    const bevel = Math.max(2, Math.floor(size * 0.14));

    ctx.save();
    ctx.globalAlpha = alpha;

    // Base fill
    ctx.fillStyle = palette.fill;
    ctx.fillRect(x + 1, y + 1, size - 2, size - 2);

    // Top & left highlight bevel
    ctx.fillStyle = palette.highlight;
    ctx.beginPath();
    ctx.moveTo(x + 1, y + 1);
    ctx.lineTo(x + size - 1, y + 1);
    ctx.lineTo(x + size - 1 - bevel, y + 1 + bevel);
    ctx.lineTo(x + 1 + bevel, y + 1 + bevel);
    ctx.lineTo(x + 1 + bevel, y + size - 1 - bevel);
    ctx.lineTo(x + 1, y + size - 1);
    ctx.closePath();
    ctx.fill();

    // Bottom & right shadow bevel
    ctx.fillStyle = palette.shadow;
    ctx.beginPath();
    ctx.moveTo(x + size - 1, y + size - 1);
    ctx.lineTo(x + 1, y + size - 1);
    ctx.lineTo(x + 1 + bevel, y + size - 1 - bevel);
    ctx.lineTo(x + size - 1 - bevel, y + size - 1 - bevel);
    ctx.lineTo(x + size - 1 - bevel, y + 1 + bevel);
    ctx.lineTo(x + size - 1, y + 1);
    ctx.closePath();
    ctx.fill();

    // Inner core face
    ctx.fillStyle = palette.fill;
    ctx.fillRect(
      x + 1 + bevel,
      y + 1 + bevel,
      size - 2 - bevel * 2,
      size - 2 - bevel * 2
    );

    ctx.restore();
  }

  private drawGhostBlock(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    type: PieceType
  ): void {
    const palette = PIECE_COLORS[type];
    ctx.save();
    ctx.fillStyle = palette.glow;
    ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
    ctx.strokeStyle = palette.fill;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
    ctx.restore();
  }

  private renderStats(snapshot: GameSnapshot): void {
    this.scoreEl.textContent = snapshot.score.toLocaleString();
    this.highScoreEl.textContent = snapshot.highScore.toLocaleString();
    this.linesEl.textContent = snapshot.lines.toString();
    this.levelEl.textContent = snapshot.level.toString();
    this.pauseBtn.textContent = snapshot.paused ? 'Resume (P)' : 'Pause (P)';

    if (snapshot.lastAction && Date.now() - snapshot.lastAction.timestamp < 2200) {
      const sub = snapshot.lastAction.subtitle
        ? `<span>${snapshot.lastAction.subtitle}</span>`
        : '';
      this.actionBannerEl.innerHTML = `<strong>${snapshot.lastAction.title}</strong>${sub}`;
      this.actionBannerEl.classList.add('visible');
    } else {
      this.actionBannerEl.classList.remove('visible');
    }
  }

  private renderOverlay(snapshot: GameSnapshot): void {
    if (snapshot.gameOver) {
      this.overlayTitleEl.textContent = 'GAME OVER';
      this.overlaySubtitleEl.textContent = 'Press Space or R to play again';
      this.overlayEl.classList.remove('hidden');
    } else if (snapshot.paused) {
      this.overlayTitleEl.textContent = 'PAUSED';
      this.overlaySubtitleEl.textContent = 'Press P or Esc to resume';
      this.overlayEl.classList.remove('hidden');
    } else {
      this.overlayEl.classList.add('hidden');
    }
  }
}
