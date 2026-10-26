import { Game } from './game.js';
import { Input } from './input.js';
import { Renderer } from './renderer.js';

/** Longest step simulated in one frame, so a backgrounded tab doesn't jump ahead. */
const MAX_FRAME_MS = 100;

let game = new Game();
const renderer = new Renderer();

const input = new Input(window, {
  shift: (direction) => game.shift(direction),
  rotate: (direction) => game.rotate(direction),
  softDrop: (active) => game.setSoftDrop(active),
  hardDrop: () => game.hardDrop(),
  hold: () => game.hold(),
  pause: () => game.togglePause(),
  restart: () => {
    if (game.state === 'over') game = new Game();
  },
});

// The Guideline pauses the game whenever it loses focus.
window.addEventListener('blur', () => game.pause());

let lastTime = performance.now();
let renderedGame: Game | null = null;
let renderedRevision = -1;

function frame(now: number): void {
  const dt = Math.min(now - lastTime, MAX_FRAME_MS);
  lastTime = now;

  input.update(dt);
  game.update(dt);

  if (game !== renderedGame || game.revision !== renderedRevision) {
    renderer.render(game);
    renderedGame = game;
    renderedRevision = game.revision;
  }
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
