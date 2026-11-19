import { Game } from './game.js';
import { Renderer } from './render.js';

function element<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing UI element: ${id}`);
  return node as T;
}

const game = new Game();
const renderer = new Renderer(element('board'), element('hold'), element('next'));
const ui = {
  score: element('score'), best: element('best'), level: element('level'), lines: element('lines'),
  progress: element('progress'), remaining: element('remaining'), time: element('time'),
  status: element('session-status'), feedback: element('feedback'), holdHint: element('hold-hint'),
  overlay: element('overlay'), title: element('overlay-title'), tag: element('overlay-tag'),
  copy: element('overlay-copy'), hint: element('overlay-hint'),
  play: element<HTMLButtonElement>('play'), pause: element<HTMLButtonElement>('pause'),
};

let best = 0;
try { best = Math.max(0, Number(localStorage.getItem('tetris-best')) || 0); } catch { /* Storage is optional. */ }
const heldKeys = new Set<string>();
let direction: -1 | 0 | 1 = 0;
let repeatIn = 150;
let touchDown = false;
let previousStatus = '';
let previousTime = performance.now();
let lastAnnouncement = '';
let announcementUntil = 0;

function clearInput(): void {
  heldKeys.clear();
  direction = 0;
  touchDown = false;
  repeatIn = 150;
}

function play(): void { clearInput(); game.start(); previousTime = performance.now(); }
function pause(): void {
  if (game.status === 'playing') game.pause();
  else if (game.status === 'paused') game.start();
  clearInput();
}

ui.play.addEventListener('click', () => { play(); ui.play.blur(); });
ui.pause.addEventListener('click', () => { pause(); ui.pause.blur(); });

const gameKeys = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyX', 'KeyZ', 'ControlLeft', 'Space', 'KeyC', 'KeyR', 'KeyP', 'Escape', 'Enter']);
window.addEventListener('keydown', event => {
  if (!gameKeys.has(event.code) || event.metaKey || event.altKey || (event.ctrlKey && event.code !== 'ControlLeft')) return;
  // Keep normal keyboard activation for focused buttons.
  if ((event.code === 'Enter' || event.code === 'Space') && document.activeElement instanceof HTMLButtonElement) return;
  event.preventDefault();
  if (event.repeat || heldKeys.has(event.code)) return;
  heldKeys.add(event.code);
  if (event.code === 'KeyP' || event.code === 'Escape') { pause(); return; }
  if (event.code === 'Enter' && game.status !== 'playing') { play(); return; }
  if (event.code === 'KeyR' && game.status === 'over') { play(); return; }
  if (game.status !== 'playing') return;
  switch (event.code) {
    case 'ArrowLeft': case 'ArrowRight':
      direction = event.code === 'ArrowLeft' ? -1 : 1;
      repeatIn = 150;
      game.move(direction);
      break;
    case 'ArrowUp': case 'KeyX': game.rotate(1); break;
    case 'KeyZ': case 'ControlLeft': game.rotate(-1); break;
    case 'ArrowDown': game.softDrop(); break;
    case 'Space': game.hardDrop(); break;
    case 'KeyC': game.hold(); break;
  }
});

window.addEventListener('keyup', event => {
  heldKeys.delete(event.code);
  if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
    direction = heldKeys.has('ArrowLeft') ? -1 : heldKeys.has('ArrowRight') ? 1 : 0;
    repeatIn = 150;
  }
});

document.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(button => {
  button.addEventListener('pointerdown', event => {
    event.preventDefault();
    if (game.status !== 'playing') return;
    button.setPointerCapture(event.pointerId);
    switch (button.dataset.action) {
      case 'left': direction = -1; repeatIn = 150; game.move(-1); break;
      case 'right': direction = 1; repeatIn = 150; game.move(1); break;
      case 'down': touchDown = true; game.softDrop(); break;
      case 'cw': game.rotate(1); break;
      case 'ccw': game.rotate(-1); break;
      case 'hold': game.hold(); break;
      case 'drop': game.hardDrop(); break;
    }
  });
  const release = (): void => {
    if (button.dataset.action === 'down') touchDown = false;
    if (button.dataset.action === 'left' || button.dataset.action === 'right') direction = 0;
  };
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);
  // Assistive technology and keyboard-generated clicks have no pointerdown.
  button.addEventListener('click', event => {
    if (event.detail !== 0) return;
    switch (button.dataset.action) {
      case 'left': game.move(-1); break;
      case 'right': game.move(1); break;
      case 'down': game.softDrop(); break;
      case 'cw': game.rotate(1); break;
      case 'ccw': game.rotate(-1); break;
      case 'hold': game.hold(); break;
      case 'drop': game.hardDrop(); break;
    }
  });
});

window.addEventListener('blur', () => { game.pause(); clearInput(); });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { game.pause(); clearInput(); }
});

function setText(node: HTMLElement, text: string): void { if (node.textContent !== text) node.textContent = text; }

function updateUI(now: number): void {
  if (game.score > best) {
    best = game.score;
    try { localStorage.setItem('tetris-best', String(best)); } catch { /* Private browsing may deny writes. */ }
  }
  setText(ui.score, game.score.toLocaleString());
  setText(ui.best, best.toLocaleString());
  setText(ui.level, String(game.level).padStart(2, '0'));
  setText(ui.lines, String(game.lines));
  setText(ui.remaining, String(10 - game.lines % 10));
  ui.progress.style.width = `${game.lines % 10 * 10}%`;
  ui.progress.parentElement!.setAttribute('aria-valuenow', String(game.lines % 10));
  setText(ui.holdHint, game.canHold ? 'Save it for later' : 'Available next turn');
  const seconds = Math.floor(game.elapsed / 1000);
  setText(ui.time, `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`);
  if (game.lastClear !== lastAnnouncement) {
    lastAnnouncement = game.lastClear;
    announcementUntil = now + 3500;
  }
  setText(ui.feedback, now < announcementUntil && lastAnnouncement ? lastAnnouncement : 'A clear mind. A clean board.');
  if (previousStatus === game.status) return;
  previousStatus = game.status;
  ui.overlay.hidden = game.status === 'playing';
  ui.pause.disabled = game.status === 'ready' || game.status === 'over';
  ui.pause.innerHTML = game.status === 'paused' ? '▶ <span>Resume</span><kbd>P</kbd>' : 'Ⅱ <span>Pause</span><kbd>P</kbd>';
  ui.pause.setAttribute('aria-label', game.status === 'paused' ? 'Resume game' : 'Pause game');
  setText(ui.status, ({ ready: 'READY WHEN YOU ARE', playing: 'IN THE FLOW', paused: 'TAKE YOUR TIME', over: 'ONE MORE ROUND?' })[game.status]);
  if (game.status === 'paused') {
    setText(ui.tag, 'TAKE A BREATHER.'); setText(ui.title, 'On pause.');
    setText(ui.copy, 'Your next move can wait.'); setText(ui.hint, 'or press P to resume');
    ui.play.innerHTML = 'Keep going <span aria-hidden="true">↗</span>';
  } else if (game.status === 'over') {
    clearInput();
    setText(ui.tag, 'NICE RUN.'); setText(ui.title, 'Go again?');
    setText(ui.copy, `${game.score.toLocaleString()} points · ${game.lines} lines cleared`);
    setText(ui.hint, 'or press R to restart');
    ui.play.innerHTML = 'Play again <span aria-hidden="true">↗</span>';
  }
}

function frame(now: number): void {
  const delta = Math.min(100, now - previousTime);
  previousTime = now;
  if (game.status === 'playing') {
    if (direction !== 0) {
      repeatIn -= delta;
      while (repeatIn <= 0) { game.move(direction); repeatIn += 40; }
    }
    game.update(delta, heldKeys.has('ArrowDown') || touchDown);
  }
  renderer.draw(game);
  updateUI(now);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
