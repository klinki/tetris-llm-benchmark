/**
 * Rendering and input handling for the browser: canvas drawing of the board,
 * active piece, ghost piece and side panels; keyboard controls per the README.
 */

import { COLORS, COLS, ROWS, pieceCells, type PieceId } from './engine.js';
import type { Snapshot } from './game.js';

const CELL = 24; // pixels per board cell
const PANEL_WIDTH = 4 * CELL + 24;

/** Screen size of a tetromino matrix preview (all matrices fit in 4×4). */
const PREVIEW_CELL = Math.floor(CELL * 0.8);

export interface Renderer {
  draw(snapshot: Snapshot): void;
  drawGameOver(score: number): void;
}

export function createRenderer(canvas: HTMLCanvasElement): Renderer {
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  const dpr = window.devicePixelRatio || 1;

  canvas.width = (COLS * CELL + PANEL_WIDTH) * dpr;
  canvas.height = ROWS * CELL * dpr;
  canvas.style.width = `${COLS * CELL + PANEL_WIDTH}px`;
  canvas.style.height = `${ROWS * CELL}px`;
  ctx.scale(dpr, dpr);

  function drawCell(x: number, y: number, color: string, size = CELL, ox = 0, oy = 0): void {
    ctx.fillStyle = color;
    ctx.fillRect(ox + x * size + 1, oy + y * size + 1, size - 2, size - 2);
    // Slight bevel for readability.
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.fillRect(ox + x * size + 1, oy + y * size + 1, size - 2, 3);
  }

  function drawPanel(x: number, title: string): void {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = `${Math.floor(CELL * 0.58)}px monospace`;
    ctx.textAlign = 'left';
    ctx.fillText(title, x + 12, 20);
  }

  function drawMini(pieceId: PieceId, x: number, y: number): void {
    for (const [cx, cy] of pieceCells(pieceId, 0)) {
      drawCell(cx, cy, COLORS[pieceId], PREVIEW_CELL, x, y);
    }
  }

  function draw(snapshot: Snapshot): void {
    const { board, piece, ghostY, next, hold, holdUsed, stats } = snapshot;

    ctx.fillStyle = '#101018';
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    // Settled cells. Cell values are 1-based piece ids, 0 = empty.
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const cell = board[y][x];
        if (cell !== 0) {
          drawCell(x, y, COLORS[(cell - 1) as PieceId]);
        }
      }
    }

    if (piece) {
      // Ghost piece outline.
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1;
      for (const [cx, cy] of pieceCells(piece.id, piece.rotation)) {
        ctx.strokeRect(1 + (piece.x + cx) * CELL, 1 + (piece.y + ghostY + cy) * CELL, CELL - 2, CELL - 2);
      }
      // Active piece.
      for (const [cx, cy] of pieceCells(piece.id, piece.rotation)) {
        const px = piece.x + cx;
        const py = piece.y + cy;
        if (py >= 0) {
          drawCell(px, py, COLORS[piece.id]);
        }
      }
    }

    // Right panel: hold, next queue, stats.
    const panelX = COLS * CELL;

    drawPanel(panelX, 'HOLD');
    if (hold !== null) {
      ctx.globalAlpha = holdUsed ? 0.35 : 1;
      drawMini(hold, panelX + 12, 30);
      ctx.globalAlpha = 1;
    }

    drawPanel(panelX + PANEL_WIDTH / 2 - 12, 'NEXT');
    next.slice(0, 4).forEach((id, index) => {
      drawMini(id, panelX + PANEL_WIDTH / 2, 30 + index * (3 * PREVIEW_CELL - 6));
    });

    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = `${Math.floor(CELL * 0.5)}px monospace`;
    ctx.fillText(`SCORE ${stats.score}`, panelX + 8, ROWS * CELL - 60);
    ctx.fillText(`LINES ${stats.lines}`, panelX + 8, ROWS * CELL - 40);
    ctx.fillText(`LEVEL ${stats.level}`, panelX + 8, ROWS * CELL - 20);
  }

  function drawGameOver(score: number): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = `${Math.floor(CELL * 0.8)}px monospace`;
    ctx.fillText('GAME OVER', (COLS * CELL) / 2, (ROWS * CELL) / 2 - 12);
    ctx.font = `${Math.floor(CELL * 0.55)}px monospace`;
    ctx.fillText(`SCORE ${score}`, (COLS * CELL) / 2, (ROWS * CELL) / 2 + 20);
    ctx.fillText('PRESS R TO RESTART', (COLS * CELL) / 2, (ROWS * CELL) / 2 + 44);
  }

  return { draw, drawGameOver };
}

export interface KeyboardControls {
  move: (dx: number) => void;
  rotate: (direction: 1 | -1) => void;
  softDrop: (on: boolean) => void;
  hardDrop: () => void;
  hold: () => void;
  restart: () => void;
  togglePause: () => void;
}

/** Keyboard state machine: handles repeat, DAS-style held movement softness is left to the browser; README maps keys explicitly. */
export function bindControls(controls: KeyboardControls): void {
  const heldKeys = new Set<string>();

  window.addEventListener('keydown', (event: KeyboardEvent) => {
    const key = event.key;
    const code = event.code;

    // Left/right: move once per keydown (repeat via key repeat).
    if (key === 'ArrowLeft') {
      event.preventDefault();
      controls.move(-1);
      heldKeys.add('ArrowLeft');
      return;
    }
    if (key === 'ArrowRight') {
      event.preventDefault();
      controls.move(1);
      heldKeys.add('ArrowRight');
      return;
    }
    if (key === 'ArrowUp' || key === 'x' || key === 'X') {
      event.preventDefault();
      controls.rotate(1);
      return;
    }
    if (key === 'z' || key === 'Z' || key === 'Control') {
      event.preventDefault();
      controls.rotate(-1);
      return;
    }
    if (key === 'ArrowDown') {
      event.preventDefault();
      controls.softDrop(true);
      return;
    }
    if (key === ' ') {
      event.preventDefault();
      controls.hardDrop();
      return;
    }
    if (key === 'c' || key === 'C') {
      event.preventDefault();
      controls.hold();
      return;
    }
    if (key === 'r' || key === 'R') {
      event.preventDefault();
      controls.restart();
      return;
    }
    if (key === 'p' || key === 'P') {
      event.preventDefault();
      controls.togglePause();
      return;
    }
    void code;
  });

  window.addEventListener('keyup', (event: KeyboardEvent) => {
    heldKeys.delete(event.key);
    if (event.key === 'ArrowDown') {
      controls.softDrop(false);
    }
  });
}

export { CELL, PANEL_WIDTH };
