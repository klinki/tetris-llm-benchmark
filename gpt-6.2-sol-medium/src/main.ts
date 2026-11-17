import { Game, HEIGHT, WIDTH, cells } from './game.js';
import { shapes, type Kind } from './pieces.js';

const colors: Record<Kind, string> = {
  I: '#65dceb', J: '#819bff', L: '#ffad65', O: '#f7dc67',
  S: '#bce76f', T: '#c49afa', Z: '#fa8090',
};

function element<T extends HTMLElement = HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

const canvas = element<HTMLCanvasElement>('board');
const context = canvas.getContext('2d')!;
const score = element('score');
const level = element('level');
const lines = element('lines');
const held = element('hold');
const next = element('next');
const overlay = element('overlay');
const overlayTitle = element('overlay-title');
const overlayDetail = element('overlay-detail');
const primary = element<HTMLButtonElement>('primary');
const session = element<HTMLButtonElement>('session');
const announcement = element('announcement');
const unit = canvas.width / WIDTH;
canvas.tabIndex = -1;

type Mode = 'ready' | 'playing' | 'paused' | 'over';
type Action = 'left' | 'right' | 'soft' | 'hard' | 'cw' | 'ccw' | 'hold';

const keyActions: Partial<Record<string, Action>> = {
  ArrowLeft: 'left', ArrowRight: 'right', ArrowDown: 'soft', Space: 'hard',
  ArrowUp: 'cw', KeyX: 'cw', KeyZ: 'ccw', ControlLeft: 'ccw', KeyC: 'hold',
};

const actions: Record<Action, () => void> = {
  left: () => game.move(-1),
  right: () => game.move(1),
  soft: () => game.softDrop(),
  hard: () => game.hardDrop(),
  cw: () => game.rotate(1),
  ccw: () => game.rotate(-1),
  hold: () => game.hold(),
};

let game = new Game();
let mode: Mode = 'ready';
let previousFrame = performance.now();
let drawnTurn = -1;
let drawnState = '';
let horizontal: { direction: 'left' | 'right'; nextRepeat: number } | null = null;
let softHeld = false;
const pressed = new Set<string>();

function mini(kind: Kind): HTMLElement {
  const preview = document.createElement('span');
  preview.className = 'mini';
  preview.setAttribute('role', 'img');
  preview.setAttribute('aria-label', `${kind} piece`);
  preview.style.setProperty('--tile', colors[kind]);
  const points = shapes[kind][0];
  const left = Math.min(...points.map(([x]) => x));
  const top = Math.min(...points.map(([, y]) => y));
  for (const [x, y] of points) {
    const block = document.createElement('i');
    block.style.gridColumn = String(x - left + 1);
    block.style.gridRow = String(y - top + 1);
    preview.append(block);
  }
  return preview;
}

function drawTile(x: number, y: number, kind: Kind, ghost = false): void {
  if (y < 0) return;
  const left = x * unit;
  const top = y * unit;
  if (ghost) {
    context.globalAlpha = .64;
    context.strokeStyle = colors[kind];
    context.lineWidth = 2;
    context.strokeRect(left + 4, top + 4, unit - 8, unit - 8);
    context.globalAlpha = 1;
    return;
  }
  context.fillStyle = colors[kind];
  context.fillRect(left + 2, top + 2, unit - 4, unit - 4);
  context.fillStyle = '#ffffff55';
  context.fillRect(left + 3, top + 3, unit - 6, 2);
  context.fillStyle = '#00000026';
  context.fillRect(left + 3, top + unit - 5, unit - 6, 3);
}

function drawBoard(): void {
  context.fillStyle = '#2b2935';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#1e1d26';
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      context.fillRect(x * unit, y * unit, unit - 1, unit - 1);
      const kind = game.cellAt(x, y);
      if (kind) {
        drawTile(x, y, kind);
        context.fillStyle = '#1e1d26';
      }
    }
  }
  if (game.over) return;
  for (const [x, y] of cells(game.ghost)) drawTile(x, y, game.active.kind, true);
  for (const [x, y] of cells(game.active)) drawTile(x, y, game.active.kind);
}

function render(): void {
  const { turn, active } = game;
  const state = `${turn},${active.x},${active.y},${active.rotation},${game.over}`;
  if (state !== drawnState) {
    drawnState = state;
    drawBoard();
  }
  if (turn !== drawnTurn) {
    drawnTurn = turn;
    held.replaceChildren(...(game.held ? [mini(game.held)] : []));
    held.classList.toggle('empty', !game.held);
    held.classList.toggle('used', !game.canHold);
    held.setAttribute('aria-label', game.held ? (game.canHold ? 'Hold available' : 'Hold used') : 'Hold is empty');
    next.replaceChildren(...game.next.map(kind => {
      const item = document.createElement('li');
      item.append(mini(kind));
      return item;
    }));
  }
  const numbers: [HTMLElement, string][] = [
    [score, game.score.toLocaleString()],
    [level, String(game.level).padStart(2, '0')],
    [lines, String(game.lines).padStart(2, '0')],
  ];
  for (const [node, value] of numbers) {
    if (node.textContent !== value) node.textContent = value;
  }
}

function clearInput(): void {
  horizontal = null;
  softHeld = false;
  pressed.clear();
}

function setMode(nextMode: Mode): void {
  mode = nextMode;
  clearInput();
  overlay.hidden = mode === 'playing';
  session.disabled = mode === 'ready' || mode === 'over';
  session.textContent = mode === 'paused' ? 'Resume' : 'Pause';
  if (mode === 'playing') {
    previousFrame = performance.now();
    canvas.focus({ preventScroll: true });
    announcement.textContent = 'Game in progress.';
  } else if (mode === 'paused' || mode === 'over') {
    overlayTitle.textContent = mode === 'paused' ? 'Paused' : 'Game over';
    overlayDetail.textContent = mode === 'paused'
      ? 'Resume when you’re ready.'
      : `Final score: ${game.score.toLocaleString()} · ${game.lines} ${game.lines === 1 ? 'line' : 'lines'}`;
    primary.textContent = mode === 'paused' ? 'Resume game' : 'Play again';
    primary.focus({ preventScroll: true });
    announcement.textContent = `${overlayTitle.textContent}. ${overlayDetail.textContent}`;
  }
}

function beginOrResume(): void {
  if (mode === 'over') {
    game = new Game();
    drawnTurn = -1;
    drawnState = '';
  }
  setMode('playing');
  render();
}

function togglePause(): void {
  if (mode === 'playing') setMode('paused');
  else if (mode === 'paused') beginOrResume();
}

function act(action: Action): void {
  if (mode === 'ready') beginOrResume();
  if (mode !== 'playing') return;
  actions[action]();
  if (game.over) setMode('over');
  render();
}

function syncHorizontal(): void {
  const direction = [...pressed].reverse().map(code => keyActions[code])
    .find(action => action === 'left' || action === 'right');
  if (direction) horizontal = { direction, nextRepeat: performance.now() + 145 };
  else horizontal = null;
}

document.addEventListener('keydown', event => {
  const { code } = event;
  if (event.metaKey || event.altKey || (event.ctrlKey && code !== 'ControlLeft')) return;
  if (code === 'Space' && event.target instanceof HTMLButtonElement) return;
  if (code === 'Escape' || (code === 'KeyR' && mode === 'over')) {
    event.preventDefault();
    if (!event.repeat) {
      if (code === 'Escape') togglePause();
      else beginOrResume();
    }
    return;
  }
  const action = keyActions[code];
  if (!action) return;
  event.preventDefault();
  if (event.repeat || (mode !== 'ready' && mode !== 'playing')) return;
  act(action);
  pressed.add(code);
  if (action === 'soft') softHeld = true;
  if (action === 'left' || action === 'right') syncHorizontal();
});

document.addEventListener('keyup', event => {
  pressed.delete(event.code);
  const action = keyActions[event.code];
  if (action === 'soft') softHeld = false;
  if (action === horizontal?.direction) syncHorizontal();
});
window.addEventListener('blur', clearInput);
document.addEventListener('visibilitychange', () => {
  if (document.hidden && mode === 'playing') setMode('paused');
});

primary.addEventListener('click', beginOrResume);
session.addEventListener('click', togglePause);
for (const button of document.querySelectorAll<HTMLButtonElement>('[data-action]')) {
  button.addEventListener('click', () => act(button.dataset.action as Action));
}

function frame(now: number): void {
  if (mode === 'playing') {
    game.update(Math.min(100, Math.max(0, now - previousFrame)), softHeld);
    if (horizontal && now >= horizontal.nextRepeat && !game.over) {
      actions[horizontal.direction]();
      horizontal.nextRepeat = now + 35;
    }
    if (game.over) setMode('over');
    render();
  }
  previousFrame = now;
  requestAnimationFrame(frame);
}

render();
requestAnimationFrame(frame);
