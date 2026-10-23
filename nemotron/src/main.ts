import { Game } from './game';
import { Renderer } from './render';

const game = new Game();
const render = new Renderer();

let lastTime = performance.now();
let rafId: number | null = null;

function loop(now: number) {
  const dt = now - lastTime;
  lastTime = now;
  game.step(dt);
  render.draw(game);
  if (!game.state.gameOver) {
    rafId = requestAnimationFrame(loop);
  }
}

function start() {
  lastTime = performance.now();
  rafId = requestAnimationFrame(loop);
}

function stop() {
  if (rafId !== null) cancelAnimationFrame(rafId);
  rafId = null;
}

function onKey(e: KeyboardEvent, down: boolean) {
  const code = e.code;
  switch (code) {
    case 'ArrowLeft':
      if (down) game.moveLeft();
      e.preventDefault();
      break;
    case 'ArrowRight':
      if (down) game.moveRight();
      e.preventDefault();
      break;
    case 'ArrowDown':
      if (down) game.softDropStart(); else game.softDropStop();
      e.preventDefault();
      break;
    case 'ArrowUp':
    case 'KeyX':
      if (down) game.rotateCW();
      e.preventDefault();
      break;
    case 'KeyZ':
    case 'ControlLeft':
      if (down) game.rotateCCW();
      e.preventDefault();
      break;
    case 'Space':
      if (down) game.hardDrop();
      e.preventDefault();
      break;
    case 'KeyC':
      if (down) game.holdPiece();
      e.preventDefault();
      break;
    case 'KeyR':
      if (down) {
        game.restart();
        start();
      }
      e.preventDefault();
      break;
  }
}

window.addEventListener('keydown', (e) => onKey(e, true));
window.addEventListener('keyup', (e) => onKey(e, false));

document.getElementById('restartBtn')!.addEventListener('click', () => {
  game.restart();
  start();
});

start();
render.draw(game);
