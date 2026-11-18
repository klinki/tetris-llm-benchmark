import { Game } from './game.js';
import { TYPES } from './pieces.js';
import { drawBoard, lettering, preview, trophy } from './art.js';

const element = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const board = element<HTMLCanvasElement>('board');
const play = element<HTMLButtonElement>('play');
const pause = element<HTMLButtonElement>('pause');
const audio = element<HTMLButtonElement>('audio');
type Phase = 'ready' | 'playing' | 'paused' | 'over';
let phase: Phase = 'ready';
let game = new Game();

function readSetting(key: string) {
  try {
    return localStorage.getItem('pocket-arcade.' + key);
  } catch {
    return null;
  }
}

function saveSetting(key: string, value: string) {
  try {
    localStorage.setItem('pocket-arcade.' + key, value);
  } catch {
    /* Private sessions can still play. */
  }
}

const savedBest = Number(readSetting('best'));
let best = Number.isSafeInteger(savedBest) && savedBest > 0 ? savedBest : 0;
let sound = readSetting('sound') !== 'off';
let synth: AudioContext | undefined;

function beep(freq: number, duration = 0.045) {
  if (!sound) return;
  try {
    synth ??= new AudioContext();
    if (synth.state === 'suspended') void synth.resume().catch(() => {});
    const tone = synth.createOscillator();
    const gain = synth.createGain();
    tone.type = 'square';
    tone.frequency.value = freq;
    gain.gain.setValueAtTime(0.025, synth.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, synth.currentTime + duration);
    tone.connect(gain).connect(synth.destination);
    tone.start();
    tone.stop(synth.currentTime + duration);
  } catch {
    /* Audio is optional. */
  }
}

function soundLabel() {
  audio.setAttribute('aria-pressed', String(sound));
  audio.querySelector('span')!.textContent = sound ? 'Sound on' : 'Sound off';
}
audio.onclick = () => {
  sound = !sound;
  saveSetting('sound', sound ? 'on' : 'off');
  soundLabel();
  beep(520);
};
soundLabel();

lettering(element('logo'), 'TETRIS', '#292d29', '#fff0aa');
trophy(element('trophy'));
const queueViews = Array.from({ length: 3 }, () => {
  const c = document.createElement('canvas');
  c.width = 140;
  c.height = 56;
  element('queue').append(c);
  return c;
});
for (const kind of TYPES) {
  const c = document.createElement('canvas');
  c.width = 80;
  c.height = 40;
  preview(c, kind);
  document.querySelector('.pieces-strip')!.append(c);
}

function counter(id: string, number: number) {
  const parent = element(id);
  const value = String(number).padStart(6, '0');
  if (parent.dataset.value === value) return;
  const c = document.createElement('canvas');
  c.setAttribute('role', 'img');
  c.setAttribute('aria-label', String(number));
  lettering(c, value, '#30342d');
  parent.replaceChildren(c);
  parent.dataset.value = value;
}

let lastView = '';
function render(force = false) {
  const p = game.active;
  const view = [
    phase,
    p.kind,
    p.x,
    p.y,
    p.rotation,
    game.score,
    game.held,
    game.holdUsed,
    game.lines,
    ...game.queue.pieces,
  ].join(',');
  if (!force && view === lastView) return;
  lastView = view;
  drawBoard(board, game, phase === 'ready');
  counter('score', game.score);
  if (game.score > best) {
    best = game.score;
    saveSetting('best', String(best));
  }
  counter('best', best);
  element('level').textContent = String(game.level).padStart(2, '0');
  element('lines').textContent = String(game.lines).padStart(2, '0');
  queueViews.forEach((c, i) => preview(c, game.queue.pieces[i]));
  preview(element('held'), game.held);
}

let previous = performance.now();
let soft = false;
let horizontal: -1 | 0 | 1 = 0;
let repeatTime = 0;

function setPhase(to: Phase) {
  phase = to;
  soft = false;
  horizontal = 0;
  previous = performance.now();
  element('overlay').hidden = to === 'playing';
  pause.disabled = to === 'ready' || to === 'over';
  pause.innerHTML = to === 'paused' ? '<b>▷</b> Resume' : '<b>Ⅱ</b> Pause';
  pause.setAttribute('aria-label', to === 'paused' ? 'Resume game' : 'Pause game');
  element('announcement').textContent = {
    ready: 'Ready to play',
    playing: 'Game in progress',
    paused: 'Paused',
    over: 'Game over. Score ' + game.score,
  }[to];
  if (to !== 'playing') {
    const title = { ready: 'READY?', paused: 'PAUSED', over: 'GAME OVER' }[to];
    const message = element<HTMLCanvasElement>('message');
    lettering(message, title, '#fff9e9', '#4b5656');
    message.style.width = message.width * 4.6 + 'px';
    element('play-label').textContent = {
      ready: 'Start game',
      paused: 'Resume',
      over: 'Play again',
    }[to];
    element('hint').textContent =
      to === 'over' ? 'or press R' : to === 'paused' ? 'or press P' : 'or press Enter';
  }
  render(true);
}

function start() {
  if (phase === 'over') game = new Game();
  setPhase('playing');
  board.focus({ preventScroll: true });
  beep(500, 0.08);
}
function togglePause() {
  if (phase === 'playing') setPhase('paused');
  else if (phase === 'paused') start();
}

function afterAction(linesBefore: number) {
  if (game.over) {
    beep(110, 0.3);
    setPhase('over');
  } else if (game.lines > linesBefore) beep(800, 0.16);
  render();
}

type Action = 'left' | 'right' | 'ccw' | 'cw' | 'down' | 'drop' | 'hold';
function act(action: Action) {
  if (phase !== 'playing') return;
  const before = game.lines;
  switch (action) {
    case 'left':
    case 'right':
      if (game.move(action === 'left' ? -1 : 1)) beep(196, 0.025);
      break;
    case 'ccw':
    case 'cw':
      if (game.rotate(action === 'cw' ? 1 : -1)) beep(370);
      break;
    case 'down':
      game.stepDown(true);
      break;
    case 'drop':
      game.hardDrop();
      beep(150, 0.07);
      break;
    case 'hold':
      if (game.hold()) beep(450);
      break;
  }
  afterAction(before);
}

const actions: Record<string, Action> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'cw',
  KeyX: 'cw',
  KeyZ: 'ccw',
  ControlLeft: 'ccw',
  ArrowDown: 'down',
  Space: 'drop',
  KeyC: 'hold',
};
window.addEventListener('keydown', (event) => {
  if (event.metaKey || event.altKey || (event.ctrlKey && event.code !== 'ControlLeft')) return;
  if (
    event.target instanceof HTMLButtonElement &&
    (event.code === 'Enter' || event.code === 'Space') &&
    event.target.matches(':focus-visible')
  )
    return;
  if (event.code === 'Enter' && (phase === 'ready' || phase === 'paused')) {
    event.preventDefault();
    if (!event.repeat) start();
    return;
  }
  if (event.code === 'KeyR' && phase === 'over') {
    if (!event.repeat) start();
    return;
  }
  if (event.code === 'KeyP' || event.code === 'Escape') {
    if (!event.repeat) togglePause();
    return;
  }
  const action = actions[event.code];
  if (!action || phase !== 'playing') return;
  event.preventDefault();
  if (event.repeat) return;
  if (action === 'left' || action === 'right') {
    horizontal = action === 'left' ? -1 : 1;
    repeatTime = 155;
  }
  if (action === 'down') soft = true;
  act(action);
});
window.addEventListener('keyup', (event) => {
  if (
    (horizontal === -1 && event.code === 'ArrowLeft') ||
    (horizontal === 1 && event.code === 'ArrowRight')
  )
    horizontal = 0;
  if (event.code === 'ArrowDown') soft = false;
});
play.onclick = start;
pause.onclick = togglePause;
document.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((button) => {
  button.onclick = () => act(button.dataset.action as Action);
});
function autoPause() {
  if (phase === 'playing') setPhase('paused');
}
window.addEventListener('blur', autoPause);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) autoPause();
});
window.addEventListener('resize', () => render(true));

function frame(time: number) {
  const elapsed = Math.min(100, Math.max(0, time - previous));
  previous = time;
  if (phase === 'playing') {
    const before = game.lines;
    if (horizontal) {
      repeatTime -= elapsed;
      while (repeatTime <= 0) {
        game.move(horizontal);
        repeatTime += 45;
      }
    }
    game.tick(elapsed, soft);
    afterAction(before);
  }
  requestAnimationFrame(frame);
}
setPhase('ready');
requestAnimationFrame(frame);
