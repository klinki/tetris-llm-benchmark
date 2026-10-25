import { Game } from './engine.js';
import type { Phase } from './engine.js';
import { Input } from './input.js';
import type { Action } from './input.js';
import { Renderer } from './renderer.js';
import { Sound } from './audio.js';

function element<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing game element: ${id}`);
  return node as T;
}
const game = new Game();
const sound = new Sound();
const board = element<HTMLCanvasElement>('board');
const renderer = new Renderer(board, element('hold'), element('next'));
const help = element<HTMLDialogElement>('help-dialog');
const overlay = element('overlay');
const pauseButton = element<HTMLButtonElement>('pause-button');
const score = element('score'), level = element('level'), lines = element('lines');
const bestScore = element('best-score'), time = element('time');
const progress = element('level-progress'), remaining = element('lines-remaining');
const toast = element('clear-toast');
let best = 0;
try { const stored = Number(localStorage.getItem('tetris.best')); best = Number.isFinite(stored) ? Math.max(0, stored) : 0; } catch { /* Storage may be disabled. */ }
let lastPhase: Phase | null = null;
let lastEvent = -1;
let resumeAfterHelp = false;
let lastScore = -1;
let lastSecond = -1;
let lastUiRevision = -1;
let toastTimer: ReturnType<typeof setTimeout> | undefined;
const input = new Input(dispatch, () => help.open);

function dispatch(action: Action): void {
  if (help.open) return;
  if (action === 'start') {
    if (game.phase === 'ready' || game.phase === 'over') start();
    else if (game.phase === 'paused') togglePause();
    return;
  }
  if (action === 'restart') { if (game.phase === 'over') start(); return; }
  if (action === 'pause') { togglePause(); return; }
  if (game.phase !== 'playing') return;
  let changed = false;
  switch (action) {
    case 'left': changed = game.move(-1); break;
    case 'right': changed = game.move(1); break;
    case 'cw': changed = game.rotate(1); break;
    case 'ccw': changed = game.rotate(-1); break;
    case 'soft': changed = game.softDrop(); break;
    case 'hard': changed = game.hardDrop(); break;
    case 'hold': changed = game.hold(); break;
  }
  if (changed && action !== 'soft') sound.play(action === 'hard' ? 'drop' : action === 'hold' ? 'hold' : action === 'cw' || action === 'ccw' ? 'rotate' : 'move');
}
function start(): void {
  input.reset();
  game.start();
  lastEvent = game.event?.id ?? -1;
  lastScore = -1;
  clearTimeout(toastTimer);
  toast.classList.remove('show');
  toast.textContent = '';
  sound.play('start');
  board.focus({ preventScroll: true });
}
function togglePause(): void {
  if (game.phase !== 'playing' && game.phase !== 'paused') return;
  input.reset();
  game.pause();
  board.focus({ preventScroll: true });
}
element('play-button').addEventListener('click', () => game.phase === 'paused' ? togglePause() : start());
pauseButton.addEventListener('click', togglePause);
element('sound-button').addEventListener('click', () => {
  const enabled = sound.toggle();
  element('sound-button').setAttribute('aria-label', enabled ? 'Mute sound' : 'Enable sound');
  element('sound-button').setAttribute('aria-pressed', String(enabled));
  document.getElementById('sound-waves')!.setAttribute('d', enabled ? 'M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14' : 'm16 9 6 6m0-6-6 6');
});
element('help-button').addEventListener('click', () => {
  resumeAfterHelp = game.phase === 'playing';
  if (resumeAfterHelp) game.pause();
  input.reset();
  help.showModal();
});
const closeHelp = (): void => help.close();
element('close-help').addEventListener('click', closeHelp);
element('got-it').addEventListener('click', closeHelp);
help.addEventListener('click', event => { if (event.target === help) { const bounds = help.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeHelp(); } });
help.addEventListener('close', () => {
  if (resumeAfterHelp && game.phase === 'paused' && !document.hidden && document.hasFocus()) game.pause();
  resumeAfterHelp = false;
  input.reset();
});
function autoPause(): void {
  resumeAfterHelp = false;
  if (game.phase === 'playing') game.pause();
  input.reset();
}
window.addEventListener('blur', autoPause);
document.addEventListener('visibilitychange', () => { if (document.hidden) autoPause(); });

function updateInterface(): void {
  const second = Math.floor(game.elapsed / 1000);
  if (second !== lastSecond) {
    lastSecond = second;
    time.textContent = `${String(Math.floor(second / 60)).padStart(2, '0')}:${String(second % 60).padStart(2, '0')}`;
  }
  if (lastUiRevision === game.revision) return;
  lastUiRevision = game.revision;
  if (lastPhase !== game.phase) {
    lastPhase = game.phase;
    const phase = game.phase;
    overlay.hidden = phase === 'playing';
    pauseButton.disabled = phase === 'ready' || phase === 'over';
    element('pause-label').textContent = phase === 'paused' ? 'Resume' : 'Pause';
    element('pause-symbol').textContent = phase === 'paused' ? '▷' : 'Ⅱ';
    element('status-dot').className = `status-dot ${phase}`;
    element('status').textContent = { ready: 'READY WHEN YOU ARE', playing: 'IN THE ZONE', paused: 'TAKE A BREATHER', over: 'A FRESH START AWAITS' }[phase];
    if (phase === 'paused') {
      element('overlay-kicker').textContent = 'THE STACK CAN WAIT.';
      element('overlay-title').textContent = 'Take a breath.';
      element('overlay-description').textContent = 'Your next move will be here.\nReady when you are.';
      element('play-label').textContent = 'Keep playing';
    } else if (phase === 'over') {
      sound.play('over');
      input.reset();
      element('overlay-kicker').textContent = 'EVERY END IS A NEW BEGINNING.';
      element('overlay-title').textContent = 'Nice stacking.';
      element('overlay-description').textContent = `${game.score.toLocaleString()} points · ${game.lines} lines\nThere’s always another round.`;
      element('play-label').textContent = 'Play again';
    }
  }
  if (lastScore !== game.score) {
    lastScore = game.score;
    score.textContent = String(game.score).padStart(6, '0');
    if (game.score > best) {
      best = game.score;
      try { localStorage.setItem('tetris.best', String(best)); } catch { /* Best score remains available for this session. */ }
    }
  }
  bestScore.textContent = best.toLocaleString();
  level.textContent = String(game.level).padStart(2, '0');
  lines.textContent = String(game.lines).padStart(2, '0');
  progress.style.width = `${game.lines % 10 * 10}%`;
  progress.parentElement!.setAttribute('aria-valuenow', String(game.lines % 10));
  remaining.textContent = String(10 - game.lines % 10);
  element('hold-empty').hidden = game.held !== null;
  const event = game.event;
  if (event && event.id !== lastEvent) {
    lastEvent = event.id;
    if (event.label) {
      sound.play('clear');
      renderer.flash(event.rows);
      clearTimeout(toastTimer);
      toast.classList.remove('show');
      toast.replaceChildren();
      const label = document.createElement('span');
      label.textContent = event.perfect ? 'PERFECT CLEAR' : event.label;
      const detail = document.createElement('small');
      detail.textContent = `${event.backToBack ? 'BACK-TO-BACK · ' : ''}+${event.points.toLocaleString()}${event.combo > 0 ? ` · ${event.combo} COMBO` : ''}`;
      toast.append(label, detail);
      void toast.offsetWidth;
      toast.classList.add('show');
      toastTimer = setTimeout(() => toast.classList.remove('show'), 1500);
    }
  }
}
let lastTime = performance.now();
function frame(now: number): void {
  const delta = Math.min(100, now - lastTime);
  lastTime = now;
  input.update(delta);
  game.update(delta);
  updateInterface();
  renderer.draw(game, now);
  requestAnimationFrame(frame);
}
updateInterface();
requestAnimationFrame(frame);
