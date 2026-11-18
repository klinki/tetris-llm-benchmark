import { Game } from './game.js';
import { Display, el, icon, type Mode } from './display.js';

const display = new Display();
let game = new Game(),
  mode: Mode = 'ready',
  best = 0;
try {
  best = Number(localStorage.getItem('tetris.best')) || 0;
} catch {
  /* Storage is optional. */
}

let sound = false,
  audio: AudioContext | undefined;
function tone(frequency: number, duration = 0.065) {
  if (!sound || !audio || audio.state !== 'running') return;
  const oscillator = audio.createOscillator(),
    gain = audio.createGain();
  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
  gain.gain.setValueAtTime(0.07, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start();
  oscillator.stop(audio.currentTime + duration);
}
el('sound').addEventListener('click', async () => {
  if (!sound) {
    try {
      audio ??= new AudioContext();
      await audio.resume();
    } catch {
      return;
    }
  }
  sound = !sound;
  el('sound').setAttribute('aria-pressed', String(sound));
  el('sound-label').textContent = sound ? 'Sound on' : 'Sound off';
  el('sound').setAttribute('aria-label', sound ? 'Sound on' : 'Sound off');
  icon(el('sound').firstElementChild!, sound ? 'volume' : 'mute');
  tone(440);
});

const heldKeys = new Map<string, number>();
let revision = -1;
function render(force = false) {
  if (game.over && mode !== 'over') {
    mode = 'over';
    heldKeys.clear();
    tone(110, 0.22);
    force = true;
  }
  if (!force && revision === game.revision) return;
  revision = game.revision;
  if (game.score > best) {
    best = game.score;
    try {
      localStorage.setItem('tetris.best', String(best));
    } catch {
      /* Play without storage. */
    }
  }
  display.render(game, mode, best);
}
let previous = performance.now();
function setMode(next: Mode) {
  mode = next;
  heldKeys.clear();
  previous = performance.now();
  render(true);
}
function play() {
  if (mode === 'over') game = new Game();
  el('action').blur();
  setMode('playing');
  tone(440);
}
function pause() {
  if (mode === 'playing') setMode('paused');
  else if (mode === 'paused') play();
}
el('action').addEventListener('click', play);
el('pause').addEventListener('click', pause);

function act(code: string) {
  switch (code) {
    case 'ArrowLeft':
      game.move(-1);
      break;
    case 'ArrowRight':
      game.move(1);
      break;
    case 'ArrowDown':
      game.softDrop();
      break;
    case 'ArrowUp':
    case 'KeyX':
      if (game.rotate(1)) tone(370);
      break;
    case 'KeyZ':
    case 'ControlLeft':
      if (game.rotate(-1)) tone(310);
      break;
    case 'KeyC':
      if (game.hold()) tone(500);
      break;
    case 'Space':
      game.hardDrop();
      tone(160, 0.09);
      break;
  }
}
const movement = ['ArrowLeft', 'ArrowRight', 'ArrowDown'];
const controls = new Set([
  ...movement,
  'ArrowUp',
  'KeyX',
  'KeyZ',
  'ControlLeft',
  'KeyC',
  'Space'
]);
function press(code: string) {
  if (mode !== 'playing') return;
  if (movement.includes(code))
    heldKeys.set(code, performance.now() + (code === 'ArrowDown' ? 45 : 155));
  act(code);
  render();
}

document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.altKey || (e.ctrlKey && e.code !== 'ControlLeft')) return;
  if (e.code === 'Enter' && e.target instanceof HTMLButtonElement) return;
  if (e.code === 'Enter' && mode !== 'playing') {
    e.preventDefault();
    if (!e.repeat) play();
    return;
  }
  if (e.code === 'KeyR' && mode === 'over') {
    e.preventDefault();
    if (!e.repeat) play();
    return;
  }
  if (e.code === 'KeyP' || e.code === 'Escape') {
    e.preventDefault();
    if (!e.repeat) pause();
    return;
  }
  if (!controls.has(e.code) || mode !== 'playing') return;
  e.preventDefault();
  if (!e.repeat) press(e.code);
});
document.addEventListener('keyup', (e) => heldKeys.delete(e.code));
window.addEventListener('blur', () => heldKeys.clear());
document.addEventListener('visibilitychange', () => {
  if (document.hidden && mode === 'playing') setMode('paused');
});
document.querySelectorAll<HTMLButtonElement>('[data-key]').forEach((button) => {
  const code = button.dataset.key!;
  button.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    button.setPointerCapture(e.pointerId);
    press(code);
  });
  button.addEventListener('lostpointercapture', () => heldKeys.delete(code));
  button.addEventListener('click', (e) => {
    if (e.detail === 0 && mode === 'playing') {
      act(code);
      render();
    }
  });
});
function frame(now: number) {
  if (mode === 'playing') {
    for (const [code, next] of heldKeys) {
      if (now >= next) {
        act(code);
        heldKeys.set(code, now + (code === 'ArrowDown' ? 35 : 45));
      }
    }
    game.tick(Math.min(Math.max(0, now - previous), 100));
    render();
  }
  previous = now;
  requestAnimationFrame(frame);
}
window.addEventListener('resize', () => render(true));
render(true);
requestAnimationFrame(frame);
