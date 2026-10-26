import { BUFFER, Game, HEIGHT, PieceType, WIDTH, pieceCells, shape } from './game.js';

const game = new Game();
const byId = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
const boardCanvas = byId<HTMLCanvasElement>('board');
const holdCanvas = byId<HTMLCanvasElement>('hold');
const nextCanvas = byId<HTMLCanvasElement>('next');
const boardContext = boardCanvas.getContext('2d')!;
const holdContext = holdCanvas.getContext('2d')!;
const nextContext = nextCanvas.getContext('2d')!;
const scoreEl = byId('score'), bestEl = byId('best'), levelEl = byId('level'), linesEl = byId('lines');
const mobileScore = byId('mobile-score'), mobileLevel = byId('mobile-level'), mobileLines = byId('mobile-lines');
const progress = byId('progress'), progressText = byId('progress-text'), boardLevel = byId('board-level');
const pauseButton = byId<HTMLButtonElement>('pause-button');
const pauseText = byId('pause-text');
const overlay = byId('overlay'), overlayTitle = byId('overlay-title'), overlayKicker = byId('overlay-kicker'), overlayCopy = byId('overlay-copy');
const overlayButton = byId<HTMLButtonElement>('overlay-button');
const clearMessage = byId('clear-message');

const colors: Record<PieceType, string> = {
  I: '#52cfd7', J: '#678bed', L: '#f5a65d', O: '#f4d36a',
  S: '#7cd29d', T: '#b88be9', Z: '#ef7d84'
};
let best = 0;
try { best = Math.max(0, Number(localStorage.getItem('tetris-best')) || 0); } catch { /* Storage can be disabled. */ }
let lastEventId = 0;
let messageTimer = 0;
let displayedStats = '';
let displayedPreviews = '';
let displayedStatus = '';

function block(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, type: PieceType, ghost = false): void {
  const gap = Math.max(1, size * 0.045);
  const px = x + gap, py = y + gap, width = size - gap * 2;
  if (ghost) {
    ctx.fillStyle = `${colors[type]}19`;
    ctx.fillRect(px, py, width, width);
    ctx.strokeStyle = `${colors[type]}a8`;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(px + 1, py + 1, width - 2, width - 2);
    return;
  }
  ctx.fillStyle = colors[type];
  ctx.fillRect(px, py, width, width);
  ctx.fillStyle = '#ffffff32';
  ctx.fillRect(px + 1, py + 1, width - 2, Math.max(2, size * .1));
  ctx.fillRect(px + 1, py + 1, Math.max(2, size * .1), width - 2);
  ctx.fillStyle = '#0a1a2c35';
  ctx.fillRect(px + 1, py + width - Math.max(2, size * .1), width - 2, Math.max(2, size * .1));
  ctx.fillRect(px + width - Math.max(2, size * .1), py + 1, Math.max(2, size * .1), width - 2);
  ctx.strokeStyle = '#ffffff20';
  ctx.lineWidth = 1;
  ctx.strokeRect(px + .5, py + .5, width - 1, width - 1);
}

function drawBoard(): void {
  const cell = boardCanvas.width / WIDTH;
  boardContext.fillStyle = '#0c1521';
  boardContext.fillRect(0, 0, boardCanvas.width, boardCanvas.height);
  boardContext.strokeStyle = '#a6c1d10b';
  boardContext.lineWidth = 1;
  boardContext.beginPath();
  for (let x = 1; x < WIDTH; x++) { boardContext.moveTo(x * cell + .5, 0); boardContext.lineTo(x * cell + .5, boardCanvas.height); }
  for (let y = 1; y < HEIGHT; y++) { boardContext.moveTo(0, y * cell + .5); boardContext.lineTo(boardCanvas.width, y * cell + .5); }
  boardContext.stroke();
  for (let y = 0; y < HEIGHT; y++) for (let x = 0; x < WIDTH; x++) {
    const type = game.board[y + BUFFER][x];
    if (type) block(boardContext, x * cell, y * cell, cell, type);
  }
  if (game.status !== 'gameover') {
    for (const {x, y} of pieceCells(game.ghost)) if (y >= 0) block(boardContext, x * cell, y * cell, cell, game.active.type, true);
    for (const {x, y} of pieceCells(game.active)) if (y >= 0) block(boardContext, x * cell, y * cell, cell, game.active.type);
  }
}

function drawPreview(ctx: CanvasRenderingContext2D, type: PieceType, centerX: number, centerY: number, size: number): void {
  const cells = shape(type);
  const minX = Math.min(...cells.map(p => p.x)), maxX = Math.max(...cells.map(p => p.x));
  const minY = Math.min(...cells.map(p => p.y)), maxY = Math.max(...cells.map(p => p.y));
  const startX = centerX - (maxX - minX + 1) * size / 2;
  const startY = centerY - (maxY - minY + 1) * size / 2;
  for (const {x, y} of cells) block(ctx, startX + (x - minX) * size, startY + (y - minY) * size, size, type);
}

function drawPreviews(): void {
  holdContext.clearRect(0, 0, holdCanvas.width, holdCanvas.height);
  if (game.held) {
    holdContext.globalAlpha = game.canHold ? 1 : .38;
    drawPreview(holdContext, game.held, holdCanvas.width / 2, holdCanvas.height / 2, 19);
    holdContext.globalAlpha = 1;
  } else {
    holdContext.fillStyle = '#657889';
    holdContext.font = '700 9px ui-monospace, monospace';
    holdContext.textAlign = 'center';
    holdContext.fillText('EMPTY', holdCanvas.width / 2, holdCanvas.height / 2 + 3);
  }
  nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  game.queue.slice(0, 5).forEach((type, i) => drawPreview(nextContext, type, nextCanvas.width / 2, 25 + i * 47, 17));
}

function render(): void {
  drawBoard();
  const previews = `${game.held}:${game.canHold}:${game.queue.slice(0, 5).join('')}`;
  if (previews !== displayedPreviews) { drawPreviews(); displayedPreviews = previews; }
  if (game.score > best) {
    best = game.score;
    try { localStorage.setItem('tetris-best', String(best)); } catch { /* Storage is optional. */ }
  }
  const score = game.score.toLocaleString(), level = String(game.level).padStart(2, '0'), lines = String(game.lines).padStart(2, '0');
  const stats = `${score}:${best}:${level}:${lines}`;
  if (stats !== displayedStats) {
    scoreEl.textContent = mobileScore.textContent = score;
    bestEl.textContent = best.toLocaleString();
    levelEl.textContent = mobileLevel.textContent = level;
    linesEl.textContent = mobileLines.textContent = lines;
    boardLevel.textContent = `LEVEL ${level}`;
    progress.style.width = `${game.lines % 10 * 10}%`;
    progressText.textContent = `${game.lines % 10} / 10`;
    displayedStats = stats;
  }
  if (game.status !== displayedStatus) {
    pauseText.textContent = game.status === 'paused' ? 'Resume' : 'Pause';
    pauseButton.setAttribute('aria-label', game.status === 'paused' ? 'Resume game' : 'Pause game');
    pauseButton.disabled = game.status === 'gameover';
    overlay.hidden = game.status === 'playing';
    if (game.status === 'paused') {
      overlayKicker.textContent = 'TAKE YOUR TIME';
      overlayTitle.textContent = 'Paused';
      overlayCopy.textContent = 'Your game is right where you left it.';
      overlayButton.innerHTML = 'Resume game <span>→</span>';
    } else if (game.status === 'gameover') {
      overlayKicker.textContent = 'NICE PLAYING';
      overlayTitle.textContent = 'Game over';
      overlayCopy.textContent = `You scored ${score} points. Press R or play again.`;
      overlayButton.innerHTML = 'Play again <span>→</span>';
    }
    displayedStatus = game.status;
  }
  if (game.lastClear && game.lastClear.id !== lastEventId) {
    lastEventId = game.lastClear.id;
    const prefix = game.lastClear.backToBack ? 'BACK-TO-BACK ' : '';
    clearMessage.textContent = game.lastClear.perfectClear ? `${prefix}${game.lastClear.label} · PERFECT CLEAR` : `${prefix}${game.lastClear.label}`;
    clearMessage.classList.add('show');
    window.clearTimeout(messageTimer);
    messageTimer = window.setTimeout(() => clearMessage.classList.remove('show'), 1700);
  }
}

type Action = 'left' | 'right' | 'down' | 'rotate-right' | 'rotate-left' | 'drop' | 'hold';
function act(action: Action): void {
  switch (action) {
    case 'left': game.move(-1); break;
    case 'right': game.move(1); break;
    case 'down': game.softDrop(); break;
    case 'rotate-right': game.rotate(1); break;
    case 'rotate-left': game.rotate(-1); break;
    case 'drop': game.hardDrop(); break;
    case 'hold': game.hold(); break;
  }
  render();
}
function restart(): void {
  game.restart();
  lastEventId = 0;
  clearMessage.classList.remove('show');
  heldKeys.clear();
  render();
}
function togglePause(): void { heldKeys.clear(); game.togglePause(); render(); }

const keyActions: Record<string, Action> = {
  ArrowLeft: 'left', ArrowRight: 'right', ArrowDown: 'down', ArrowUp: 'rotate-right',
  KeyX: 'rotate-right', KeyZ: 'rotate-left', ControlLeft: 'rotate-left', Space: 'drop', KeyC: 'hold'
};
interface HeldKey { action: Action; elapsed: number; next: number }
const heldKeys = new Map<string, HeldKey>();
document.addEventListener('keydown', event => {
  // Let focused buttons keep their native Space/Enter activation.
  if (event.code === 'Space' && event.target instanceof HTMLButtonElement) return;
  const action = keyActions[event.code];
  const isSpecial = event.code === 'KeyP' || event.code === 'Escape' || event.code === 'KeyR';
  if (!action && !isSpecial) return;
  event.preventDefault();
  if (event.repeat) return;
  if (event.code === 'KeyP' || event.code === 'Escape') { togglePause(); return; }
  if (event.code === 'KeyR') { if (game.status === 'gameover') restart(); return; }
  if (action) {
    act(action);
    if ((action === 'left' || action === 'right' || action === 'down') && game.status === 'playing') {
      heldKeys.set(event.code, {action, elapsed: 0, next: action === 'down' ? 40 : 160});
    }
  }
});
document.addEventListener('keyup', event => heldKeys.delete(event.code));
window.addEventListener('blur', () => heldKeys.clear());
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { heldKeys.clear(); if (game.status === 'playing') game.togglePause(); }
});
pauseButton.addEventListener('click', event => { if (event.detail > 0) pauseButton.blur(); togglePause(); });
overlayButton.addEventListener('click', event => {
  if (event.detail > 0) overlayButton.blur();
  if (game.status === 'gameover') restart(); else togglePause();
});

// Pointer controls have their own repeat timing so holding a button works on touchscreens.
document.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(button => {
  let delay = 0, interval = 0;
  const stop = (): void => { window.clearTimeout(delay); window.clearInterval(interval); };
  button.addEventListener('pointerdown', event => {
    event.preventDefault();
    const action = button.dataset.action as Action;
    act(action);
    button.setPointerCapture(event.pointerId);
    if (action === 'left' || action === 'right' || action === 'down') {
      delay = window.setTimeout(() => { interval = window.setInterval(() => act(action), action === 'down' ? 35 : 45); }, action === 'down' ? 40 : 160);
    }
  });
  // Keyboard activation dispatches click without a pointerdown.
  button.addEventListener('click', event => { if (event.detail === 0) act(button.dataset.action as Action); });
  button.addEventListener('pointerup', stop);
  button.addEventListener('pointercancel', stop);
  button.addEventListener('lostpointercapture', stop);
});

let previousTime = performance.now();
function frame(now: number): void {
  const elapsed = Math.min(now - previousTime, 100);
  previousTime = now;
  if (game.status === 'playing') {
    for (const key of heldKeys.values()) {
      key.elapsed += elapsed;
      while (key.elapsed >= key.next) {
        act(key.action);
        key.next += key.action === 'down' ? 35 : 45;
      }
    }
    game.update(elapsed);
  }
  render();
  requestAnimationFrame(frame);
}
render();
requestAnimationFrame(frame);
