/** Browser entry point: wires the game, the renderer and the input together. */

import { BOARD_WIDTH, VISIBLE_ROWS } from './core/constants.js';
import { Game } from './core/game.js';
import { InputController } from './ui/input.js';
import { Renderer } from './ui/renderer.js';

const CELL = 26;

function element<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Missing element #${id}.`);
  return found as T;
}

function formatTime(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function main(): void {
  const fieldCanvas = element<HTMLCanvasElement>('board');
  fieldCanvas.width = BOARD_WIDTH * CELL;
  fieldCanvas.height = VISIBLE_ROWS * CELL;

  const game = new Game();
  const renderer = new Renderer(fieldCanvas, element<HTMLCanvasElement>('hold'), element<HTMLCanvasElement>('next'));
  new InputController(game).attach();

  // Expose the game instance for debugging in the browser console.
  (window as unknown as { tetris: Game }).tetris = game;

  const scoreLabel = element('score');
  const linesLabel = element('lines');
  const levelLabel = element('level');
  const comboLabel = element('combo');
  const timeLabel = element('time');

  let last = performance.now();

  const frame = (now: number): void => {
    const dt = Math.min(now - last, 100); // avoid huge steps after a tab switch
    last = now;
    game.update(dt);
    renderer.render(game);

    scoreLabel.textContent = game.score.toLocaleString('en-US');
    linesLabel.textContent = String(game.lines);
    levelLabel.textContent = String(game.level);
    comboLabel.textContent = game.combo > 0 ? `${game.combo}x` : '-';
    timeLabel.textContent = formatTime(game.elapsed);

    requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);
}

main();
