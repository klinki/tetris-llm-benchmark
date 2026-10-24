import { BOARD_HEIGHT, BOARD_WIDTH } from './board.js';
import { TetrisGame } from './game.js';
import { COLORS, PALETTES, SHAPES, getPieceCells } from './tetrominoes.js';
import { TetrominoType } from './types.js';

export const CELL_SIZE = 30;
export const PREVIEW_CELL_SIZE = 22;

export interface RendererElements {
  boardCanvas: HTMLCanvasElement;
  holdCanvas?: HTMLCanvasElement | null;
  nextCanvas?: HTMLCanvasElement | null;
  scoreEl?: HTMLElement | null;
  linesEl?: HTMLElement | null;
  levelEl?: HTMLElement | null;
  comboEl?: HTMLElement | null;
  actionEl?: HTMLElement | null;
  holdContainerEl?: HTMLElement | null;
  nextContainerEl?: HTMLElement | null;
  gameOverEl?: HTMLElement | null;
}

export class TetrisRenderer {
  private readonly game: TetrisGame;
  private readonly elements: RendererElements;
  private readonly boardCtx: CanvasRenderingContext2D;
  private readonly holdCtx: CanvasRenderingContext2D | null;
  private readonly nextCtx: CanvasRenderingContext2D | null;

  constructor(game: TetrisGame, elements: RendererElements) {
    this.game = game;
    this.elements = elements;

    this.elements.boardCanvas.width = BOARD_WIDTH * CELL_SIZE;
    this.elements.boardCanvas.height = BOARD_HEIGHT * CELL_SIZE;

    const boardCtx = this.elements.boardCanvas.getContext('2d');
    if (!boardCtx) {
      throw new Error('Could not initialize 2D context on board canvas');
    }
    this.boardCtx = boardCtx;

    this.holdCtx = this.elements.holdCanvas
      ? this.elements.holdCanvas.getContext('2d')
      : null;
    this.nextCtx = this.elements.nextCanvas
      ? this.elements.nextCanvas.getContext('2d')
      : null;
  }

  /**
   * Draws a single mino cell at pixel coordinates (px, py) with size `size`.
   */
  private drawBlock(
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    size: number,
    type: TetrominoType,
    alpha: number = 1
  ): void {
    const palette = PALETTES[type];
    const baseColor = COLORS[type];
    const bevel = Math.max(2, Math.floor(size * 0.12));

    ctx.save();
    ctx.globalAlpha = alpha;

    // Main solid fill using Guideline color
    ctx.fillStyle = baseColor;
    ctx.fillRect(px, py, size, size);

    // Top and left highlight bevel
    ctx.fillStyle = palette.light;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + size, py);
    ctx.lineTo(px + size - bevel, py + bevel);
    ctx.lineTo(px + bevel, py + bevel);
    ctx.lineTo(px + bevel, py + size - bevel);
    ctx.lineTo(px, py + size);
    ctx.closePath();
    ctx.fill();

    // Bottom and right shadow bevel
    ctx.fillStyle = palette.dark;
    ctx.beginPath();
    ctx.moveTo(px + size, py);
    ctx.lineTo(px + size, py + size);
    ctx.lineTo(px, py + size);
    ctx.lineTo(px + bevel, py + size - bevel);
    ctx.lineTo(px + size - bevel, py + size - bevel);
    ctx.lineTo(px + size - bevel, py + bevel);
    ctx.closePath();
    ctx.fill();

    // Crisp inner cell face in exact Guideline color
    ctx.fillStyle = baseColor;
    ctx.fillRect(
      px + bevel,
      py + bevel,
      size - bevel * 2,
      size - bevel * 2
    );

    // Subtle cell outline
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 0.5, py + 0.5, size - 1, size - 1);

    ctx.restore();
  }

  /**
   * Draws a ghost mino cell at pixel coordinates (px, py).
   */
  private drawGhostBlock(
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    size: number,
    type: TetrominoType
  ): void {
    const baseColor = COLORS[type];
    ctx.save();
    ctx.fillStyle = baseColor;
    ctx.globalAlpha = 0.22;
    ctx.fillRect(px + 1, py + 1, size - 2, size - 2);

    ctx.globalAlpha = 0.75;
    ctx.strokeStyle = baseColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 2, py + 2, size - 4, size - 4);
    ctx.restore();
  }

  /**
   * Renders the 10x20 main playfield, ghost piece, and active falling piece.
   */
  private renderBoard(): void {
    const ctx = this.boardCtx;
    const width = BOARD_WIDTH * CELL_SIZE;
    const height = BOARD_HEIGHT * CELL_SIZE;

    // Background
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, width, height);

    // Subtle matrix grid lines
    ctx.strokeStyle = '#161f33';
    ctx.lineWidth = 1;
    for (let x = 1; x < BOARD_WIDTH; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE + 0.5, 0);
      ctx.lineTo(x * CELL_SIZE + 0.5, height);
      ctx.stroke();
    }
    for (let y = 1; y < BOARD_HEIGHT; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE + 0.5);
      ctx.lineTo(width, y * CELL_SIZE + 0.5);
      ctx.stroke();
    }

    // Locked blocks on the board
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      const row = this.game.board[y];
      if (!row) continue;
      for (let x = 0; x < BOARD_WIDTH; x++) {
        const cell = row[x];
        if (cell !== null && cell !== undefined) {
          this.drawBlock(
            ctx,
            x * CELL_SIZE,
            y * CELL_SIZE,
            CELL_SIZE,
            cell,
            1
          );
        }
      }
    }

    // Ghost piece
    const active = this.game.activePiece;
    if (active && !this.game.gameOver) {
      const ghostY = this.game.getGhostY();
      if (ghostY !== active.y) {
        const ghostCells = getPieceCells(
          active.type,
          active.x,
          ghostY,
          active.rotation
        );
        for (const cell of ghostCells) {
          if (
            cell.y >= 0 &&
            cell.y < BOARD_HEIGHT &&
            cell.x >= 0 &&
            cell.x < BOARD_WIDTH
          ) {
            this.drawGhostBlock(
              ctx,
              cell.x * CELL_SIZE,
              cell.y * CELL_SIZE,
              CELL_SIZE,
              active.type
            );
          }
        }
      }
    }

    // Active piece
    if (active) {
      const activeCells = getPieceCells(
        active.type,
        active.x,
        active.y,
        active.rotation
      );
      for (const cell of activeCells) {
        if (
          cell.y >= 0 &&
          cell.y < BOARD_HEIGHT &&
          cell.x >= 0 &&
          cell.x < BOARD_WIDTH
        ) {
          this.drawBlock(
            ctx,
            cell.x * CELL_SIZE,
            cell.y * CELL_SIZE,
            CELL_SIZE,
            active.type,
            1
          );
        }
      }
    }
  }

  /**
   * Draws a centered miniature tetromino inside a preview region.
   */
  private drawMiniPiece(
    ctx: CanvasRenderingContext2D,
    type: TetrominoType,
    centerX: number,
    centerY: number,
    cellSize: number,
    alpha: number = 1
  ): void {
    const cells = SHAPES[type][0];
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const c of cells) {
      if (c.x < minX) minX = c.x;
      if (c.x > maxX) maxX = c.x;
      if (c.y < minY) minY = c.y;
      if (c.y > maxY) maxY = c.y;
    }

    const pieceWidth = (maxX - minX + 1) * cellSize;
    const pieceHeight = (maxY - minY + 1) * cellSize;
    const startX = Math.floor(centerX - pieceWidth / 2);
    const startY = Math.floor(centerY - pieceHeight / 2);

    for (const c of cells) {
      const px = startX + (c.x - minX) * cellSize;
      const py = startY + (c.y - minY) * cellSize;
      this.drawBlock(ctx, px, py, cellSize, type, alpha);
    }
  }

  /**
   * Renders the Hold piece preview canvas.
   */
  private renderHold(): void {
    if (!this.holdCtx || !this.elements.holdCanvas) {
      return;
    }
    const canvas = this.elements.holdCanvas;
    const ctx = this.holdCtx;
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (this.game.holdPiece) {
      const alpha = this.game.canHold ? 1 : 0.45;
      this.drawMiniPiece(
        ctx,
        this.game.holdPiece,
        canvas.width / 2,
        canvas.height / 2,
        PREVIEW_CELL_SIZE,
        alpha
      );
    }
  }

  /**
   * Renders the Next queue preview canvas.
   */
  private renderNext(): void {
    if (!this.nextCtx || !this.elements.nextCanvas) {
      return;
    }
    const canvas = this.elements.nextCanvas;
    const ctx = this.nextCtx;
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const queue = this.game.nextQueue.slice(0, 5);
    const slotHeight = canvas.height / Math.max(1, queue.length);

    for (let i = 0; i < queue.length; i++) {
      const piece = queue[i]!;
      const centerY = slotHeight * i + slotHeight / 2;
      this.drawMiniPiece(
        ctx,
        piece,
        canvas.width / 2,
        centerY,
        PREVIEW_CELL_SIZE,
        1
      );
    }
  }

  /**
   * Updates DOM HUD elements (Score, Lines, Level, Hold, Next, Game Over).
   */
  private updateHUD(): void {
    if (this.elements.scoreEl) {
      this.elements.scoreEl.textContent = String(this.game.score);
    }
    if (this.elements.linesEl) {
      this.elements.linesEl.textContent = String(this.game.lines);
    }
    if (this.elements.levelEl) {
      this.elements.levelEl.textContent = String(this.game.level);
    }
    if (this.elements.comboEl) {
      this.elements.comboEl.textContent =
        this.game.combo > 0 ? `${this.game.combo}x COMBO` : '';
    }
    if (this.elements.actionEl) {
      this.elements.actionEl.textContent = this.game.lastAction;
    }
    if (this.elements.holdContainerEl) {
      this.elements.holdContainerEl.setAttribute(
        'data-piece',
        this.game.holdPiece ?? ''
      );
    }
    if (this.elements.nextContainerEl) {
      this.elements.nextContainerEl.setAttribute(
        'data-pieces',
        this.game.nextQueue.join(',')
      );
    }
    if (this.elements.gameOverEl) {
      if (this.game.gameOver) {
        this.elements.gameOverEl.classList.remove('hidden');
        this.elements.gameOverEl.setAttribute('aria-hidden', 'false');
      } else {
        this.elements.gameOverEl.classList.add('hidden');
        this.elements.gameOverEl.setAttribute('aria-hidden', 'true');
      }
    }
  }

  /**
   * Renders the entire game view (board, previews, and HUD).
   */
  public render(): void {
    this.renderBoard();
    this.renderHold();
    this.renderNext();
    this.updateHUD();
  }
}
