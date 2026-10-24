import { TetrisGame } from './game.js';
import { InputController } from './input.js';
import { TetrisRenderer } from './renderer.js';

export * from './index.js';

declare global {
  interface Window {
    game?: TetrisGame;
    tetris?: TetrisGame;
  }
}

export function initBrowserGame(): {
  game: TetrisGame;
  renderer: TetrisRenderer;
  input: InputController;
} | null {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return null;
  }

  const boardCanvas = document.getElementById(
    'game-canvas'
  ) as HTMLCanvasElement | null;
  if (!boardCanvas) {
    return null;
  }

  const holdCanvas = document.getElementById(
    'hold-canvas'
  ) as HTMLCanvasElement | null;
  const nextCanvas = document.getElementById(
    'next-canvas'
  ) as HTMLCanvasElement | null;
  const scoreEl = document.getElementById('score');
  const linesEl = document.getElementById('lines');
  const levelEl = document.getElementById('level');
  const comboEl = document.getElementById('combo');
  const actionEl = document.getElementById('action-text');
  const holdContainerEl = document.getElementById('hold');
  const nextContainerEl = document.getElementById('next');
  const gameOverEl = document.getElementById('game-over');
  const restartBtn = document.getElementById('restart-btn');

  const game = new TetrisGame();
  window.game = game;
  window.tetris = game;

  const renderer = new TetrisRenderer(game, {
    boardCanvas,
    holdCanvas,
    nextCanvas,
    scoreEl,
    linesEl,
    levelEl,
    comboEl,
    actionEl,
    holdContainerEl,
    nextContainerEl,
    gameOverEl,
  });

  const input = new InputController(game, () => {
    renderer.render();
  });
  input.attach(window);

  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      game.restart();
      renderer.render();
      boardCanvas.focus();
    });
  }

  let lastFrameTime = performance.now();

  const frame = (now: number): void => {
    const deltaMs = Math.min(100, Math.max(0, now - lastFrameTime));
    lastFrameTime = now;
    game.tick(deltaMs);
    renderer.render();
    requestAnimationFrame(frame);
  };

  renderer.render();
  requestAnimationFrame(frame);

  return { game, renderer, input };
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initBrowserGame();
    });
  } else {
    initBrowserGame();
  }
}
