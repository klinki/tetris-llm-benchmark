import type { Game } from './game.js';

export function bindInput(game: Game, onStats: () => void): void {
  let downHeld = false;

  window.addEventListener('keydown', (e) => {
    if (e.repeat) {
      if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'Space'].includes(e.code)) e.preventDefault();
      // Allow soft-drop repeat scoring via tick only; ignore repeats otherwise.
      return;
    }
    switch (e.code) {
      case 'ArrowLeft':
        game.move(-1, 0);
        e.preventDefault();
        break;
      case 'ArrowRight':
        game.move(1, 0);
        e.preventDefault();
        break;
      case 'ArrowDown':
        game.softDrop = true;
        downHeld = true;
        e.preventDefault();
        break;
      case 'ArrowUp':
      case 'KeyX':
        game.rotate(1);
        e.preventDefault();
        break;
      case 'KeyZ':
      case 'ControlLeft':
        game.rotate(-1);
        e.preventDefault();
        break;
      case 'Space':
        game.hardDrop();
        e.preventDefault();
        break;
      case 'KeyC':
        game.hold();
        break;
      case 'KeyR':
        if (game.gameOver) game.restart();
        break;
    }
    onStats();
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowDown' && downHeld) {
      game.softDrop = false;
      downHeld = false;
    }
    if (e.code === 'ControlLeft') {
      // nothing sticky
    }
  });
}
