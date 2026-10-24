import { Game } from './game.js';
import { BagRandomizer } from './random.js';
import { render } from './render.js';

const DAS = 0.167; // delay before horizontal auto-repeat starts (s)
const ARR = 0.033; // interval between auto-repeat steps (s)

const GAME_KEYS = new Set([
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space',
  'KeyX', 'KeyZ', 'ControlLeft', 'KeyC', 'KeyR',
]);

const canvas = document.getElementById('game');
if (!(canvas instanceof HTMLCanvasElement)) throw new Error('Missing #game canvas');
const ctx = canvas.getContext('2d');
if (!ctx) throw new Error('Canvas 2D context is not available');

let game = new Game(new BagRandomizer());
let direction: -1 | 0 | 1 = 0;
let dasTimer = 0;
let arrTimer = 0;

function restart(): void {
  game = new Game(new BagRandomizer());
  direction = 0;
}

window.addEventListener('keydown', (e) => {
  if (!GAME_KEYS.has(e.code)) return;
  e.preventDefault();
  if (e.repeat) return; // auto-repeat for left/right is driven by the DAS/ARR timers below

  switch (e.code) {
    case 'ArrowLeft':
    case 'ArrowRight':
      direction = e.code === 'ArrowLeft' ? -1 : 1;
      game.move(direction);
      dasTimer = DAS;
      arrTimer = 0;
      break;
    case 'ArrowDown':
      game.softDropping = true;
      break;
    case 'Space':
      game.hardDrop();
      break;
    case 'ArrowUp':
    case 'KeyX':
      game.rotate(1);
      break;
    case 'KeyZ':
    case 'ControlLeft':
      game.rotate(-1);
      break;
    case 'KeyC':
      game.hold();
      break;
    case 'KeyR':
      if (game.over) restart();
      break;
  }
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'ArrowDown') game.softDropping = false;
  if ((e.code === 'ArrowLeft' && direction === -1) || (e.code === 'ArrowRight' && direction === 1)) {
    direction = 0;
  }
});

let last = performance.now();

function frame(now: number): void {
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;

  if (direction !== 0) {
    dasTimer -= dt;
    if (dasTimer <= 0) {
      arrTimer -= dt;
      while (arrTimer <= 0) {
        game.move(direction);
        arrTimer += ARR;
      }
    }
  }

  game.update(dt);
  render(ctx as CanvasRenderingContext2D, game);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
