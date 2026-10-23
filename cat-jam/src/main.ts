import { Game } from './game/game.js';
import { InputHandler } from './game/input.js';
import { Renderer } from './render/renderer.js';

function byId<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing element #${id}`);
  return element as T;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function main(): void {
  const game = new Game();
  const renderer = new Renderer(
    byId<HTMLCanvasElement>('board'),
    byId<HTMLCanvasElement>('hold'),
    byId<HTMLCanvasElement>('next'),
  );
  const input = new InputHandler(game);

  const scoreEl = byId<HTMLSpanElement>('score');
  const levelEl = byId<HTMLSpanElement>('level');
  const linesEl = byId<HTMLSpanElement>('lines');
  const comboEl = byId<HTMLSpanElement>('combo');
  const timeEl = byId<HTMLSpanElement>('time');

  let last = performance.now();
  const frame = (now: number): void => {
    const dt = now - last;
    last = now;
    input.update(dt);
    game.update(dt);
    renderer.render(game);

    scoreEl.textContent = String(game.score);
    levelEl.textContent = String(game.level);
    linesEl.textContent = String(game.lines);
    comboEl.textContent = game.combo > 0 ? String(game.combo) : '—';
    timeEl.textContent = formatTime(game.time);

    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

main();
