import { Game } from './game.js';
import { MINI_CELL } from './renderer.js';
import { drawBoard, drawMini } from './renderer.js';

function el<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing element #${id}`);
  return node as T;
}

export function boot(): void {
  const saved = Number(localStorage.getItem('tetris-best') ?? 0) || 0;
  const game = new Game(undefined, Number.isFinite(saved) ? saved : 0);

  const boardCanvas = el<HTMLCanvasElement>('board');
  const holdCanvas = el<HTMLCanvasElement>('hold');
  const nextCanvas = el<HTMLCanvasElement>('next');
  const scoreEl = el('score');
  const bestEl = el('best');
  const linesEl = el('lines');
  const levelEl = el('level');
  const overlay = el('overlay');
  const overlayTitle = el('overlay-title');
  const overlaySub = el('overlay-sub');
  const bannerEl = el('banner');

  const bctx = boardCanvas.getContext('2d') as CanvasRenderingContext2D;
  const hctx = holdCanvas.getContext('2d') as CanvasRenderingContext2D;
  const nctx = nextCanvas.getContext('2d') as CanvasRenderingContext2D;

  const keys = new Set<string>();
  let last = performance.now();
  let dropCooldown = 0;

  function refreshOverlay(): void {
    const s = game.snapshot();
    if (s.gameOver) {
      overlay.classList.remove('hidden');
      overlayTitle.textContent = 'GAME OVER';
      overlaySub.textContent = 'Press R to restart';
    } else if (s.paused) {
      overlay.classList.remove('hidden');
      overlayTitle.textContent = 'PAUSED';
      overlaySub.textContent = 'Press P or Esc to resume';
    } else {
      overlay.classList.add('hidden');
    }
  }

  function render(): void {
    const s = game.snapshot();
    drawBoard(bctx, s.board, s.activePiece, s.ghostY);
    drawMini(hctx, s.holdPiece, holdCanvas.width, holdCanvas.height);
    nctx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    s.nextQueue.forEach((t, i) => {
      nctx.save();
      nctx.translate(0, i * (MINI_CELL * 2 + 14));
      drawMini(nctx, t, nextCanvas.width, MINI_CELL * 2 + 10);
      nctx.restore();
    });
    scoreEl.textContent = String(s.score);
    bestEl.textContent = String(s.highScore);
    linesEl.textContent = String(s.lines);
    levelEl.textContent = String(s.level);
    localStorage.setItem('tetris-best', String(s.highScore));
    holdCanvas.style.opacity = s.canHold ? '1' : '0.4';
    if (s.lastAction && Date.now() - s.lastAction.timestamp < 2200) {
      bannerEl.classList.add('show');
      bannerEl.innerHTML = '';
      const strong = document.createElement('strong');
      strong.textContent = s.lastAction.title;
      bannerEl.appendChild(strong);
      if (s.lastAction.subtitle) {
        const span = document.createElement('span');
        span.textContent = s.lastAction.subtitle;
        bannerEl.appendChild(span);
      }
    } else {
      bannerEl.classList.remove('show');
    }
    refreshOverlay();
  }

  function frame(now: number): void {
    const dt = Math.min(100, now - last);
    last = now;
    const soft = keys.has('ArrowDown');
    // Simple DAS for left/right: initial step on keydown, repeat after 150ms every 45ms.
    dropCooldown += dt;
    game.update(dt, soft);
    render();
    requestAnimationFrame(frame);
  }

  function press(code: string): void {
    if (code === 'ArrowLeft') game.moveLeft();
    else if (code === 'ArrowRight') game.moveRight();
    else if (code === 'ArrowUp' || code === 'KeyX') game.rotate('cw');
    else if (code === 'KeyZ' || code === 'ControlLeft' || code === 'ControlRight') game.rotate('ccw');
    else if (code === 'Space') game.hardDrop();
    else if (code === 'KeyC' || code === 'ShiftLeft' || code === 'ShiftRight') game.hold();
    else if (code === 'ArrowDown') game.softDropStep();
  }

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowDown' || e.code === 'ArrowUp') e.preventDefault();
    if (e.repeat) {
      if (e.code === 'ArrowDown') game.softDropStep();
      if (e.code === 'ArrowLeft') game.moveLeft();
      if (e.code === 'ArrowRight') game.moveRight();
      return;
    }
    keys.add(e.code);
    if (e.code === 'KeyR') {
      game.reset();
      return;
    }
    if (e.code === 'KeyP' || e.code === 'Escape') {
      game.togglePause();
      return;
    }
    press(e.code);
  });
  window.addEventListener('keyup', (e) => {
    keys.delete(e.code);
  });

  el('btn-restart').addEventListener('click', () => game.reset());
  el('btn-pause').addEventListener('click', () => game.togglePause());

  render();
  requestAnimationFrame(frame);
}

boot();
