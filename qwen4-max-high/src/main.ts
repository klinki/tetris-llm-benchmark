/** Browser entry point: wires keyboard input to the game and runs the
 *  requestAnimationFrame loop. Horizontal movement uses DAS/ARR for a
 *  responsive, Guideline-style feel. */

import { DAS, ARR } from './constants.js';
import { Game } from './game.js';
import { Renderer } from './renderer.js';

const game = new Game();
const renderer = new Renderer(
  document.getElementById('board') as HTMLCanvasElement,
  document.getElementById('hold') as HTMLCanvasElement,
  document.getElementById('next') as HTMLCanvasElement,
  {
    score: document.getElementById('score')!,
    level: document.getElementById('level')!,
    lines: document.getElementById('lines')!,
  },
  document.getElementById('overlay')!,
);

// --- Input state -----------------------------------------------------------

const held = { left: false, right: false };
let softDrop = false;
let dir = 0;          // active auto-repeat direction: -1, 0 or 1
let dasTimer = 0;
let arrTimer = 0;

function pressDir(d: -1 | 1): void {
  const key = d < 0 ? 'left' : 'right';
  if (held[key]) return;
  held[key] = true;
  dir = d;
  dasTimer = 0;
  arrTimer = 0;
  game.move(d);
}

function releaseDir(d: -1 | 1): void {
  const key = d < 0 ? 'left' : 'right';
  held[key] = false;
  if (dir === d) {
    // Fall back to the other direction if it is still held.
    dir = held.left ? -1 : held.right ? 1 : 0;
    dasTimer = 0;
    arrTimer = 0;
  }
}

function updateAutoRepeat(dt: number): void {
  if (dir === 0) return;
  dasTimer += dt;
  if (dasTimer < DAS) return;
  arrTimer += dt;
  while (arrTimer >= ARR) {
    arrTimer -= ARR;
    if (!game.move(dir)) break;
  }
}

const HANDLED = new Set([
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
  'Space', 'KeyX', 'KeyZ', 'ControlLeft', 'KeyC', 'KeyR',
]);

window.addEventListener('keydown', (e) => {
  if (!HANDLED.has(e.code)) return;
  // Leave browser shortcuts (Ctrl+R etc.) alone, except left Ctrl itself.
  if ((e.ctrlKey || e.metaKey || e.altKey) && e.code !== 'ControlLeft') return;
  e.preventDefault();
  if (e.repeat) return; // auto-repeat is handled by DAS/ARR and gravity

  switch (e.code) {
    case 'ArrowLeft': pressDir(-1); break;
    case 'ArrowRight': pressDir(1); break;
    case 'ArrowUp':
    case 'KeyX': game.rotate(1); break;
    case 'KeyZ':
    case 'ControlLeft': game.rotate(-1); break;
    case 'ArrowDown': softDrop = true; break;
    case 'Space': game.hardDrop(); break;
    case 'KeyC': game.holdPiece(); break;
    case 'KeyR': if (game.over) game.restart(); break;
  }
});

window.addEventListener('keyup', (e) => {
  switch (e.code) {
    case 'ArrowLeft': releaseDir(-1); break;
    case 'ArrowRight': releaseDir(1); break;
    case 'ArrowDown': softDrop = false; break;
  }
});

window.addEventListener('blur', () => {
  held.left = held.right = false;
  softDrop = false;
  dir = 0;
});

// --- Main loop -------------------------------------------------------------

let last = performance.now();
function frame(now: number): void {
  const dt = Math.min(now - last, 100); // clamp so a background tab doesn't jump
  last = now;
  updateAutoRepeat(dt);
  game.update(dt, softDrop);
  renderer.draw(game);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);