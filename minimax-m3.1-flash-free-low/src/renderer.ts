import { CELL_SIZE, COLS, ROWS } from './constants.js';
import { Game, GameState } from './game.js';
import { COLORS, PieceType, SHAPES } from './pieces.js';

interface Panel {
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Canvas renderer: playfield, hold piece, next queue and score panels. */
export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private cell = CELL_SIZE;

  constructor(private canvas: HTMLCanvasElement, private game: Game) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context is not available');
    this.ctx = ctx;
    this.layout();
  }

  private layout(): void {
    const panelWidth = 150;
    this.canvas.width = COLS * this.cell + panelWidth;
    this.canvas.height = ROWS * this.cell;
  }

  render(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = '#0b1120';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawWell();
    this.drawStack();
    this.drawGhost();
    this.drawActive();
    this.drawHold();
    this.drawNext();
    this.drawStats();
    this.drawOverlay();
  }

  private drawWell(): void {
    const ctx = this.ctx;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * this.cell + 0.5, 0);
      ctx.lineTo(x * this.cell + 0.5, ROWS * this.cell);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * this.cell + 0.5);
      ctx.lineTo(COLS * this.cell, y * this.cell + 0.5);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
    ctx.strokeRect(0.5, 0.5, COLS * this.cell, ROWS * this.cell);
  }

  private drawStack(): void {
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const type = this.game.board.get(x, y);
        if (type) this.drawCell(x, y, COLORS[type], false);
      }
    }
  }

  private drawGhost(): void {
    const piece = this.game.active;
    if (!piece) return;
    const cells = SHAPES[piece.type][piece.rotation];
    const gy = this.game.ghostY();
    for (const cell of cells) {
      this.drawCell(piece.x + cell.dx, gy + cell.dy, COLORS[piece.type], true);
    }
  }

  private drawActive(): void {
    const piece = this.game.active;
    if (!piece) return;
    const cells = SHAPES[piece.type][piece.rotation];
    for (const cell of cells) {
      this.drawCell(piece.x + cell.dx, piece.y + cell.dy, COLORS[piece.type], false);
    }
  }

  private drawCell(x: number, y: number, color: string, ghost: boolean): void {
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return;
    const ctx = this.ctx;
    const px = x * this.cell;
    const py = y * this.cell;
    if (ghost) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(px + 2, py + 2, this.cell - 4, this.cell - 4);
      return;
    }
    ctx.fillStyle = color;
    ctx.fillRect(px + 1, py + 1, this.cell - 2, this.cell - 2);
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.fillRect(px + 1, py + 1, this.cell - 2, 4);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(px + 1, py + this.cell - 5, this.cell - 2, 4);
  }

  private drawHold(): void {
    const panel: Panel = { label: 'HOLD', x: COLS * this.cell + 12, y: 12, w: 126, h: 78 };
    this.drawPanelFrame(panel);
    if (this.game.hold) this.drawMiniPiece(this.game.hold, panel.x + 34, panel.y + 26);
  }

  private drawNext(): void {
    const panel: Panel = { label: 'NEXT', x: COLS * this.cell + 12, y: 104, w: 126, h: 200 };
    this.drawPanelFrame(panel);
    this.game.queue.forEach((type, i) => {
      this.drawMiniPiece(type, panel.x + 34, panel.y + 30 + i * 34, i === 0 ? 0.9 : 0.75);
    });
  }

  private drawMiniPiece(type: PieceType, cx: number, cy: number, scale = 1): void {
    const cells = SHAPES[type][0];
    const size = 14 * scale;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const cell of cells) {
      minX = Math.min(minX, cell.dx);
      minY = Math.min(minY, cell.dy);
      maxX = Math.max(maxX, cell.dx);
      maxY = Math.max(maxY, cell.dy);
    }
    const width = (maxX - minX + 1) * size;
    const height = (maxY - minY + 1) * size;
    const ox = cx - width / 2;
    const oy = cy - height / 2;
    const ctx = this.ctx;
    ctx.fillStyle = COLORS[type];
    for (const cell of cells) {
      ctx.fillRect(
        ox + (cell.dx - minX) * size,
        oy + (cell.dy - minY) * size,
        size - 1,
        size - 1
      );
    }
  }

  private drawPanelFrame(panel: Panel): void {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(148, 163, 184, 0.12)';
    ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(panel.label, panel.x + 8, panel.y + 16);
  }

  private drawStats(): void {
    const ctx = this.ctx;
    const x = COLS * this.cell + 12;
    let y = 322;
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'left';
    const rows: [string, string][] = [
      ['SCORE', String(this.game.score)],
      ['LINES', String(this.game.lines)],
      ['LEVEL', String(this.game.level)],
    ];
    for (const [label, value] of rows) {
      ctx.fillStyle = '#64748b';
      ctx.fillText(label, x, y);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.fillText(value, x + 96, y);
      ctx.font = '12px system-ui, sans-serif';
      y += 22;
    }
  }

  private drawOverlay(): void {
    const game = this.game;
    const state = game.state as GameState;
    const title =
      state === 'gameover' ? 'GAME OVER' : state === 'paused' ? 'PAUSED' : 'TETRIS';
    const hint =
      state === 'gameover'
        ? 'press R to restart'
        : state === 'paused'
          ? 'press P to resume'
          : 'press ENTER to start';
    if (state === 'playing' || state === 'paused') return;
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(2, 6, 23, 0.72)';
    ctx.fillRect(0, 0, COLS * this.cell, ROWS * this.cell);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillText(title, (COLS * this.cell) / 2, ROWS * this.cell / 2);
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(hint, (COLS * this.cell) / 2, ROWS * this.cell / 2 + 28);
    ctx.textAlign = 'left';
  }
}
