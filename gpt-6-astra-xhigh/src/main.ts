import { Game, MAX_LEVEL, type Status } from './game.js';
import { Input } from './input.js';
import { Renderer } from './renderer.js';

function element<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing game element: ${id}`);
  return node as T;
}

const game = new Game();
const renderer = new Renderer(element('board'), element('hold'), element('next'));
const ui = {
  score: element('score'), best: element('best'), level: element('level'), lines: element('lines'),
  time: element('time'), progress: element('progress'), progressFill: element('progress-fill'),
  levelHint: element('level-hint'), holdHint: element('hold-hint'), overlay: element('overlay'),
  title: element('overlay-title'), eyebrow: element('overlay-eyebrow'), copy: element('overlay-copy'),
  hint: element('overlay-hint'), play: element<HTMLButtonElement>('play'),
  pause: element<HTMLButtonElement>('pause'), status: element('game-status'),
  boardState: element('board-state'), message: element('clear-message'),
  startLevel: element<HTMLSelectElement>('start-level'), startLevelLabel: element('start-level-label'),
};
const BEST_KEY = 'tetrisjs.best';
let best = 0;
try {
  const saved = Number(localStorage.getItem(BEST_KEY));
  if (Number.isSafeInteger(saved) && saved > 0) best = saved;
} catch { /* Storage may be disabled; playing never depends on it. */ }
let storedBest = best;
function saveBest(): void {
  if (best <= storedBest) return;
  try { localStorage.setItem(BEST_KEY, String(best)); storedBest = best; } catch { /* Keep the session best. */ }
}

let input: Input;
let messageTimer = 0;
let clearId = 0;
function start(): void {
  input.reset();
  clearTimeout(messageTimer);
  ui.message.classList.remove('show');
  clearId = 0;
  game.start(Number(ui.startLevel.value));
  ui.play.blur();
}
input = new Input(game, start);
ui.play.addEventListener('click', () => {
  if (game.status === 'paused') { input.reset(); game.pause(); ui.play.blur(); }
  else start();
});
ui.pause.addEventListener('click', () => { input.reset(); game.pause(); ui.pause.blur(); });
window.addEventListener('pagehide', saveBest);
document.addEventListener('visibilitychange', () => { if (document.hidden) saveBest(); });
window.addEventListener('resize', () => { renderer.resize(); renderer.draw(game); });

let previousStatus: Status | undefined;
function updateOverlay(): void {
  const { status } = game;
  if (status === previousStatus) return;
  previousStatus = status;
  ui.overlay.hidden = status === 'playing';
  ui.pause.disabled = status === 'ready' || status === 'over';
  ui.pause.setAttribute('aria-label', status === 'paused' ? 'Resume game' : 'Pause game');
  ui.pause.innerHTML = status === 'paused' ? '▷ <span>Resume</span><kbd>P</kbd>' : 'Ⅱ <span>Pause</span><kbd>P</kbd>';
  ui.boardState.textContent = { ready: 'READY WHEN YOU ARE', playing: 'FIND YOUR RHYTHM', paused: 'TAKE YOUR TIME', over: 'ONE MORE ROUND?' }[status];
  ui.status.textContent = { ready: 'Your next high score starts here.', playing: 'Stay present. Keep stacking.', paused: 'A moment to reset.', over: 'Every ending is a new beginning.' }[status];
  if (status === 'paused' || status === 'over') {
    ui.title.innerHTML = status === 'paused' ? 'Take a<br><span>breather.</span>' : 'Nice<br><span>run.</span>';
    ui.eyebrow.textContent = status === 'paused' ? 'GAME PAUSED' : 'GAME OVER';
    ui.copy.textContent = status === 'paused' ? 'Your next move can wait.' : `${game.score.toLocaleString()} points · ${game.lines} lines cleared`;
    ui.play.innerHTML = status === 'paused' ? 'Keep going <span aria-hidden="true">→</span>' : 'Play again <span aria-hidden="true">↻</span>';
    ui.hint.textContent = status === 'paused' ? 'or press P / Esc to resume' : 'or press R to restart';
    ui.startLevelLabel.hidden = status === 'paused';
    ui.play.focus({ preventScroll: true });
    saveBest();
  }
}

let previousRevision = -1;
let previousSecond = -1;
let previousPieces = 0;
function render(): void {
  const second = Math.floor(game.elapsed / 1000);
  if (previousRevision !== game.revision) {
    previousRevision = game.revision;
    best = Math.max(best, game.score);
    renderer.draw(game);
    ui.score.textContent = game.score.toLocaleString();
    ui.best.textContent = best.toLocaleString();
    ui.lines.textContent = String(game.lines);
    ui.level.textContent = String(game.level).padStart(2, '0');
    const toNext = game.level * 10 - game.lines;
    const progress = game.level === MAX_LEVEL ? 10 : Math.max(0, 10 - toNext);
    ui.progressFill.style.width = `${progress * 10}%`;
    ui.progress.setAttribute('aria-valuenow', String(progress));
    ui.levelHint.textContent = game.level === MAX_LEVEL ? 'Maximum speed. Keep going.' : `${toNext} lines to level ${game.level + 1}`;
    ui.holdHint.textContent = game.canHold ? 'Save it for later' : 'Available next turn';
    if (game.lastClear.id !== clearId) {
      clearId = game.lastClear.id;
      ui.message.textContent = `${game.lastClear.label} · +${game.lastClear.points.toLocaleString()}${game.combo > 0 ? ` · ${game.combo} combo` : ''}`;
      ui.message.classList.remove('show');
      void ui.message.offsetWidth;
      ui.message.classList.add('show');
      clearTimeout(messageTimer);
      messageTimer = window.setTimeout(() => ui.message.classList.remove('show'), 1600);
    }
    if (previousPieces !== game.piecesPlaced) { previousPieces = game.piecesPlaced; saveBest(); }
    updateOverlay();
  }
  if (previousSecond !== second) {
    previousSecond = second;
    ui.time.textContent = `${Math.floor(second / 60).toString().padStart(2, '0')}:${(second % 60).toString().padStart(2, '0')}`;
  }
}

let previousTime = performance.now();
function frame(now: number): void {
  const delta = Math.max(0, Math.min(now - previousTime, 100));
  previousTime = now;
  input.tick(delta);
  game.tick(delta, input.softDropping);
  render();
  requestAnimationFrame(frame);
}
render();
requestAnimationFrame(frame);
