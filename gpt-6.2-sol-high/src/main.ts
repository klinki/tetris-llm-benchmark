import { drawBoard, drawPreview } from './draw.js';
import { Game } from './game.js';

type State = 'ready' | 'playing' | 'paused' | 'over';
type Action = 'left' | 'right' | 'cw' | 'ccw' | 'down' | 'drop' | 'hold';

function get<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

const playfield = get('playfield');
const board = get<HTMLCanvasElement>('board').getContext('2d')!;
const held = get<HTMLCanvasElement>('held').getContext('2d')!;
const previews = Array.from(document.querySelectorAll<HTMLCanvasElement>('.preview'), (canvas) => canvas.getContext('2d')!);
const score = get('score');
const bestScore = get('best');
const level = get('level');
const lines = get('lines');
const holdEmpty = get('hold-empty');
const holdCard = document.querySelector('.hold')!;
const status = get('status');
const streak = get('streak');
const overlay = get('overlay');
const overlayTitle = get('overlay-title');
const overlayText = get('overlay-text');
const playButton = get<HTMLButtonElement>('play');
const pauseButton = get<HTMLButtonElement>('pause');
const touchButtons = document.querySelectorAll<HTMLButtonElement>('button[data-action]');
const pressed = new Map<string, { action: Action; next: number }>();
const storageKey = 'aftershift-best';
const formatter = new Intl.NumberFormat();

let game = new Game();
let state: State = 'ready';
let lastFrame = performance.now();
let best = 0;
try {
  best = Math.max(0, Number(localStorage.getItem(storageKey)) || 0);
} catch {
  // The game can run without storage.
}

const words = {
  ready: { status: 'Standby', title: 'Ready to play?', text: 'Fill rows to clear them. Keep the stack below the top.', button: 'Start game' },
  paused: { status: 'Paused', title: 'Paused', text: '', button: 'Resume game' },
  over: { status: 'Game over', title: 'Game over', text: '', button: 'Play again' },
};

const keyActions = new Map<string, Action>([
  ['ArrowLeft', 'left'], ['ArrowRight', 'right'], ['ArrowUp', 'cw'], ['ArrowDown', 'down'],
  ['ControlLeft', 'ccw'], [' ', 'drop'], ['x', 'cw'], ['z', 'ccw'], ['c', 'hold'],
]);

function render(): void {
  if (game.score > best) {
    best = game.score;
    try {
      localStorage.setItem(storageKey, String(best));
    } catch {
      // Keep the best score for the current session.
    }
  }

  score.textContent = formatter.format(game.score);
  bestScore.textContent = formatter.format(best);
  level.textContent = String(game.level).padStart(2, '0');
  lines.textContent = String(game.lines).padStart(2, '0');
  streak.hidden = game.streak < 2;
  streak.textContent = `Streak ×${game.streak}`;
  holdEmpty.hidden = game.held !== null;
  holdCard.classList.toggle('is-used', !game.canHold);
  for (const button of touchButtons) {
    button.disabled = state === 'paused' || state === 'over' || (button.dataset.action === 'hold' && !game.canHold);
  }

  drawBoard(board, game);
  drawPreview(held, game.held);
  previews.forEach((ctx, index) => drawPreview(ctx, game.next[index]));
}

function setState(next: State): void {
  state = next;
  status.dataset.state = next;
  overlay.hidden = next === 'playing';
  pauseButton.disabled = next === 'ready' || next === 'over';
  pauseButton.firstChild!.textContent = next === 'paused' ? 'Resume ' : 'Pause ';
  if (next === 'playing') {
    lastFrame = performance.now();
    status.textContent = 'In play';
    playfield.focus({ preventScroll: true });
    return;
  }

  pressed.clear();
  status.textContent = words[next].status;
  overlayTitle.textContent = words[next].title;
  overlayText.textContent = next === 'over' ? `Final score ${formatter.format(game.score)}` : words[next].text;
  overlayText.hidden = !overlayText.textContent;
  playButton.firstChild!.textContent = `${words[next].button} `;
}

function restart(): void {
  game = new Game();
  pressed.clear();
  setState('playing');
  render();
}

function togglePause(): void {
  if (state === 'playing') setState('paused');
  else if (state === 'paused') setState('playing');
  render();
}

function perform(action: Action): void {
  if (state === 'ready') setState('playing');
  if (state !== 'playing') return;

  switch (action) {
    case 'left': game.move(-1); break;
    case 'right': game.move(1); break;
    case 'cw': game.rotate(1); break;
    case 'ccw': game.rotate(-1); break;
    case 'down': game.softDrop(); break;
    case 'drop': game.hardDrop(); break;
    case 'hold': game.hold(); break;
  }

  if (game.over) setState('over');
  render();
}

window.addEventListener('keydown', (event) => {
  if (event.altKey || event.metaKey || (event.ctrlKey && event.code !== 'ControlLeft')) return;
  if (event.code === 'Space' && event.target instanceof HTMLButtonElement) return;
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (key === 'r' || key === 'p') {
    event.preventDefault();
    if (!event.repeat) {
      if (key === 'r') restart();
      else togglePause();
    }
    return;
  }

  const action = keyActions.get(event.code === 'ControlLeft' ? event.code : key);
  if (!action) return;
  event.preventDefault();
  if (event.repeat) return;
  perform(action);
  if (state === 'playing' && (action === 'left' || action === 'right' || action === 'down')) {
    pressed.set(event.code, { action, next: performance.now() + 145 });
  }
});

window.addEventListener('keyup', (event) => pressed.delete(event.code));
window.addEventListener('blur', () => pressed.clear());
document.addEventListener('visibilitychange', () => {
  if (document.hidden && state === 'playing') togglePause();
});

for (const button of touchButtons) {
  button.addEventListener('click', () => perform(button.dataset.action as Action));
}
get('restart').addEventListener('click', restart);
pauseButton.addEventListener('click', togglePause);
playButton.addEventListener('click', () => {
  if (state === 'over') restart();
  else {
    setState('playing');
    render();
  }
});

function frame(now: number): void {
  const elapsed = Math.max(0, Math.min(now - lastFrame, 100));
  lastFrame = now;
  if (state === 'playing') {
    if (game.advance(elapsed)) {
      if (game.over) setState('over');
      render();
    }
    for (const input of pressed.values()) {
      if (now < input.next) continue;
      input.next = now + (input.action === 'down' ? 35 : 48);
      perform(input.action);
    }
  }
  requestAnimationFrame(frame);
}

render();
requestAnimationFrame(frame);
