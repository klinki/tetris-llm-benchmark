import { Game, blocks, COLORS, type Kind } from './game.js';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const board = $<HTMLCanvasElement>('board');
const ctx = board.getContext('2d')!;
const game = new Game();
let started = false;
let best = 0;
try { best = Number(localStorage.getItem('tetris-best')) || 0; } catch { /* Storage is optional. */ }
let sound = false;
let audio: AudioContext | undefined;
const heldKeys = new Set<string>();
let horizontalTime = 0;
let horizontalRepeat = 0;
let horizontal = 0;

function tone(frequency: number, duration = .06): void {
  if (!sound) return;
  try {
    audio ??= new AudioContext();
    void audio.resume();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
    gain.gain.setValueAtTime(.035, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(); oscillator.stop(audio.currentTime + duration);
  } catch { /* Play remains available without audio. */ }
}
function block(context: CanvasRenderingContext2D, x: number, y: number, size: number, kind: Kind, ghost = false): void {
  const color = COLORS[kind];
  if (ghost) {
    context.fillStyle = color + '0d';
    context.fillRect(x + 2, y + 2, size - 4, size - 4);
    context.strokeStyle = color + '65';
    context.lineWidth = 1.6;
    context.strokeRect(x + 2, y + 2, size - 4, size - 4);
    return;
  }
  context.fillStyle = color;
  context.fillRect(x + 1.5, y + 1.5, size - 3, size - 3);
  context.fillStyle = '#ffffff30';
  context.fillRect(x + 2, y + 2, size - 4, 2);
  context.fillStyle = '#00000014';
  context.fillRect(x + 2, y + size - 5, size - 4, 3);
}
function mini(id: string, pieces: Kind[]): void {
  const canvas = $<HTMLCanvasElement>(id);
  const context = canvas.getContext('2d')!;
  context.clearRect(0, 0, canvas.width, canvas.height);
  pieces.forEach((kind, i) => {
    const cells = blocks(kind);
    const minX = Math.min(...cells.map(([x]) => x));
    const maxX = Math.max(...cells.map(([x]) => x));
    const minY = Math.min(...cells.map(([,y]) => y));
    const size = 21;
    const offsetX = (canvas.width - (maxX - minX + 1) * size) / 2;
    const offsetY = pieces.length === 1 ? 24 : 15 + i * 59;
    for (const [x,y] of cells) block(context, offsetX + (x - minX) * size, offsetY + (y - minY) * size, size, kind);
  });
}
function draw(): void {
  ctx.fillStyle = '#11151e'; ctx.fillRect(0,0,600,1200);
  ctx.strokeStyle = '#252a354f'; ctx.lineWidth = 1;
  for (let x = 0; x <= 10; x++) { ctx.beginPath(); ctx.moveTo(x*60,0); ctx.lineTo(x*60,1200); ctx.stroke(); }
  for (let y = 0; y <= 20; y++) { ctx.beginPath(); ctx.moveTo(0,y*60); ctx.lineTo(600,y*60); ctx.stroke(); }
  for (let y = 0; y < 20; y++) for (let x = 0; x < 10; x++) {
    const kind = game.cell(x,y);
    if (kind) block(ctx, x*60,y*60,60,kind);
  }
  if (!game.over) {
    const ghost = game.ghostY();
    for (const [x,y] of blocks(game.active.kind,game.active.rotation)) {
      if (y + ghost >= 0) block(ctx,(x+game.active.x)*60,(y+ghost)*60,60,game.active.kind,true);
      if (y + game.active.y >= 0) block(ctx,(x+game.active.x)*60,(y+game.active.y)*60,60,game.active.kind);
    }
  }
  mini('hold',game.held ? [game.held] : []);
  mini('next',game.queue.slice(0,5));
  $('hold').parentElement!.classList.toggle('used',game.holdUsed);
  $('hold-note').textContent = game.holdUsed ? 'Available next turn' : 'Save it for later';
  $('score').textContent = String(game.score).padStart(6,'0');
  if (game.score > best) {
    best = game.score;
    try { localStorage.setItem('tetris-best', String(best)); } catch { /* Storage is optional. */ }
  }
  $('best').textContent = String(best).padStart(6,'0');
  $('lines').textContent = String(game.lines).padStart(2,'0');
  $('level').textContent = String(game.level).padStart(2,'0');
  $('progress').style.width = `${game.lines % 10 * 10}%`;
  $('level-note').textContent = `${10 - game.lines % 10} lines to next level`;
  $('status').textContent = !started ? 'READY WHEN YOU ARE' : game.over ? 'NICE RUN' : game.paused ? 'TAKE A BREATHER' : 'IN THE FLOW';
  $('message').textContent = started ? game.message : 'Your next high score starts here.';
  $<HTMLButtonElement>('pause').disabled = !started || game.over;
  $('pause').querySelector('span')!.textContent = game.paused ? 'Resume' : 'Pause';
  const overlay = $('overlay');
  overlay.classList.toggle('hidden',started && !game.paused && !game.over);
  if (game.over) {
    $('overlay-eyebrow').textContent = 'THAT WAS A GOOD RUN';
    $('overlay-title').textContent = 'Go again?';
    $('overlay-text').textContent = `${game.score.toLocaleString()} points · ${game.lines} lines · level ${game.level}`;
    $('play').innerHTML = 'Play again <span>↵</span>';
    $('overlay-hint').textContent = 'or press R to restart';
  } else if (game.paused) {
    $('overlay-eyebrow').textContent = 'TAKE YOUR TIME';
    $('overlay-title').textContent = 'A little breather.';
    $('overlay-text').textContent = 'Your next move can wait.';
    $('play').innerHTML = 'Keep playing <span>↵</span>';
    $('overlay-hint').textContent = 'or press P to resume';
  }
}
function play(): void {
  if (!started || game.over) { game.reset(); started = true; }
  game.paused = false;
  clearInput(); tone(523,.1); draw();
  $<HTMLButtonElement>('play').blur();
}
function clearInput(): void { heldKeys.clear(); horizontal = horizontalTime = horizontalRepeat = 0; }
function pause(): void {
  if (!started || game.over) return;
  game.paused = !game.paused; clearInput(); draw();
}
function action(name: string): void {
  if (!started || !game.running) return;
  switch (name) {
    case 'left': game.move(-1); break;
    case 'right': game.move(1); break;
    case 'rotate': if (game.rotate(1)) tone(370); break;
    case 'counter': if (game.rotate(-1)) tone(330); break;
    case 'hold': game.hold(); tone(440); break;
    case 'down': game.softDrop(); break;
    case 'drop': game.hardDrop(); tone(150,.12); break;
  }
  draw();
}
const keyActions: Record<string,string> = { ArrowLeft:'left', ArrowRight:'right', ArrowUp:'rotate', KeyX:'rotate', KeyZ:'counter', ControlLeft:'counter', ArrowDown:'down', Space:'drop', KeyC:'hold' };
document.addEventListener('keydown',event => {
  if (keyActions[event.code] || ['Enter','KeyP','Escape','KeyR'].includes(event.code)) event.preventDefault();
  if (event.repeat) return;
  if (event.code === 'Enter') { if (!started || game.paused || game.over) play(); return; }
  if (event.code === 'KeyR' && game.over) { play(); return; }
  if (event.code === 'KeyP' || event.code === 'Escape') { pause(); return; }
  if (!started || !game.running) return;
  heldKeys.add(event.code);
  if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
    horizontal = event.code === 'ArrowLeft' ? -1 : 1;
    horizontalTime = horizontalRepeat = 0;
  }
  action(keyActions[event.code]);
});
document.addEventListener('keyup',event => {
  heldKeys.delete(event.code);
  if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
    horizontal = heldKeys.has('ArrowRight') ? 1 : heldKeys.has('ArrowLeft') ? -1 : 0;
    horizontalTime = horizontalRepeat = 0;
  }
});
$('play').addEventListener('click',play);
$('pause').addEventListener('click',pause);
$('sound').addEventListener('click',() => {
  sound = !sound;
  $('sound').setAttribute('aria-pressed',String(sound));
  $('sound').setAttribute('aria-label',sound ? 'Disable sound' : 'Enable sound');
  $('sound-state').textContent = sound ? 'ON' : 'OFF';
  tone(660);
});
window.addEventListener('blur',() => { clearInput(); if (started && game.running) { game.paused = true; draw(); } });
document.addEventListener('visibilitychange',() => { if (document.hidden && started && game.running) { game.paused = true; clearInput(); draw(); } });
for (const button of document.querySelectorAll<HTMLButtonElement>('[data-action]')) {
  button.addEventListener('pointerdown',event => {
    event.preventDefault(); button.setPointerCapture(event.pointerId);
    const name = button.dataset.action!;
    action(name);
    if (name === 'left' || name === 'right') { horizontal = name === 'left' ? -1 : 1; horizontalTime = horizontalRepeat = 0; }
    if (name === 'down') heldKeys.add('ArrowDown');
  });
  const release = () => { horizontal = 0; heldKeys.delete('ArrowDown'); };
  button.addEventListener('pointerup',release); button.addEventListener('pointercancel',release);
}
let previous = performance.now();
function frame(now: number): void {
  const delta = Math.min(now - previous,100);
  previous = now;
  if (started && game.running) {
    if (horizontal) {
      const oldTime = horizontalTime;
      horizontalTime += delta;
      if (horizontalTime >= 150) {
        horizontalRepeat += horizontalTime - Math.max(oldTime,150);
        while (horizontalRepeat >= 45) { game.move(horizontal); horizontalRepeat -= 45; }
      }
    }
    const lines = game.lines;
    game.tick(delta,heldKeys.has('ArrowDown'));
    if (game.lines > lines) tone(780,.18);
    draw();
  }
  requestAnimationFrame(frame);
}
draw();
requestAnimationFrame(frame);
