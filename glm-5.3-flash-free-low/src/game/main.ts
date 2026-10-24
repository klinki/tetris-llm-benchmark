/**
 * Application entrypoint: bootstraps the canvas, renderer, game loop and
 * input controls.
 */

import { Game } from './game.js';
import { bindControls, createRenderer } from './dom.js';

function main(): void {
  const canvas = document.getElementById('board') as HTMLCanvasElement;
  if (!canvas) {
    throw new Error('Missing #board canvas in index.html');
  }
  const renderer = createRenderer(canvas);
  const game = new Game();

  loop.game = game;
  loop.renderer = renderer;

  bindControls({
    move: (dx) => game.move(dx),
    rotate: (direction) => game.rotate(direction),
    softDrop: (on) => game.softDrop(on),
    hardDrop: () => game.hardDrop(),
    hold: () => game.holdPiece(),
    restart: () => {
      game.reset();
    },
    togglePause: () => {
      game.status = game.status === 'paused' ? 'playing' : game.status === 'playing' ? 'paused' : game.status;
    },
  });

  requestAnimationFrame(loop.tick);
}

interface Loop {
  game: Game | null;
  renderer: ReturnType<typeof createRenderer> | null;
  /** Accumulator for fixed-timestep updates at 60 fps. */
  last: number;
  tick(now: number): void;
}

const loop: Loop = {
  game: null,
  renderer: null,
  last: 0,
  tick(now: number): void {
    const delta = Math.min(now - loop.last, 250);
    loop.last = now;
    if (loop.game && loop.renderer) {
      if (loop.game.status === 'playing') {
        // Fixed 60 fps update clock: run floor(delta/16.67) ticks.
        const steps = Math.floor(delta / (1000 / 60));
        for (let i = 0; i < steps; i++) {
          loop.game.tick();
        }
      }
      const snapshot = loop.game.snapshot();
      loop.renderer.draw(snapshot);
      if (snapshot.status === 'over') {
        loop.renderer.drawGameOver(snapshot.stats.score);
      }
    }
    requestAnimationFrame(loop.tick);
  },
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
