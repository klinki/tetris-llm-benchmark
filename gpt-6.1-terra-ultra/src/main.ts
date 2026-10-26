import { Game, cells, type Piece, type PieceType } from './game.js';

const game = new Game();
const board = document.querySelector<HTMLCanvasElement>('#board')!;
const hold = document.querySelector<HTMLCanvasElement>('#hold')!;
const next = document.querySelector<HTMLCanvasElement>('#next')!;
const boardContext = board.getContext('2d')!;
const holdContext = hold.getContext('2d')!;
const nextContext = next.getContext('2d')!;
const score = document.querySelector<HTMLElement>('#score')!;
const level = document.querySelector<HTMLElement>('#level')!;
const lines = document.querySelector<HTMLElement>('#lines')!;
const pauseButton = document.querySelector<HTMLButtonElement>('#pause')!;
const overlay = document.querySelector<HTMLElement>('#overlay')!;
const overlayKicker = document.querySelector<HTMLElement>('#overlay-kicker')!;
const overlayTitle = document.querySelector<HTMLElement>('#overlay-title')!;
const overlayAction = document.querySelector<HTMLButtonElement>('#overlay-action')!;
const overlayHint = document.querySelector<HTMLElement>('#overlay-hint')!;

const colors: Record<PieceType, string> = {
  I: '#62d5e8', O: '#f1d35b', T: '#bd8bf2', S: '#a4df70',
  Z: '#f17c83', J: '#7c9ff0', L: '#f3ac67',
};
let paused = false;
let previousTime: number | null = null;

function block(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, ghost = false): void {
  const inset = 1.5;
  if (ghost) {
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.65;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 3, y + 3, size - 6, size - 6);
    ctx.globalAlpha = 1;
    return;
  }
  ctx.fillStyle = color;
  ctx.fillRect(x + inset, y + inset, size - inset * 2, size - inset * 2);
  ctx.fillStyle = 'rgba(255,255,255,.22)';
  ctx.fillRect(x + inset, y + inset, size - inset * 2, 3);
  ctx.fillStyle = 'rgba(0,0,0,.17)';
  ctx.fillRect(x + inset, y + size - inset - 3, size - inset * 2, 3);
}

function drawBoard(): void {
  const size = board.width / 10;
  boardContext.fillStyle = '#151821';
  boardContext.fillRect(0, 0, board.width, board.height);
  boardContext.strokeStyle = '#222630';
  boardContext.lineWidth = 1;
  for (let x = 0; x <= 10; x++) {
    boardContext.beginPath(); boardContext.moveTo(x * size + .5, 0); boardContext.lineTo(x * size + .5, board.height); boardContext.stroke();
  }
  for (let y = 0; y <= 20; y++) {
    boardContext.beginPath(); boardContext.moveTo(0, y * size + .5); boardContext.lineTo(board.width, y * size + .5); boardContext.stroke();
  }
  game.board.forEach((row, y) => row.forEach((type, x) => {
    if (type) block(boardContext, x * size, y * size, size, colors[type]);
  }));
  const ghost = game.ghost();
  if (ghost) cells(ghost).forEach(({ x, y }) => {
    if (y >= 0) block(boardContext, x * size, y * size, size, colors[ghost.type], true);
  });
  if (game.active) cells(game.active).forEach(({ x, y }) => {
    if (y >= 0) block(boardContext, x * size, y * size, size, colors[game.active!.type]);
  });
}

function drawPreview(ctx: CanvasRenderingContext2D, type: PieceType, centerY: number): void {
  const piece: Piece = { type, rotation: 0, x: 0, y: 0 };
  const squares = cells(piece);
  const minX = Math.min(...squares.map(square => square.x));
  const maxX = Math.max(...squares.map(square => square.x));
  const minY = Math.min(...squares.map(square => square.y));
  const maxY = Math.max(...squares.map(square => square.y));
  const size = 19;
  const startX = (ctx.canvas.width - (maxX - minX + 1) * size) / 2;
  const startY = centerY - (maxY - minY + 1) * size / 2;
  squares.forEach(({ x, y }) => block(ctx, startX + (x - minX) * size, startY + (y - minY) * size, size, colors[type]));
}

function render(): void {
  drawBoard();
  holdContext.clearRect(0, 0, hold.width, hold.height);
  if (game.held) drawPreview(holdContext, game.held, hold.height / 2);
  nextContext.clearRect(0, 0, next.width, next.height);
  game.next.slice(0, 3).forEach((type, index) => drawPreview(nextContext, type, 40 + index * 80));
  score.textContent = String(game.score).padStart(6, '0');
  level.textContent = String(game.level).padStart(2, '0');
  lines.textContent = String(game.lines).padStart(2, '0');
  overlay.hidden = !paused && !game.gameOver;
  if (game.gameOver) {
    overlayKicker.textContent = 'NICE RUN';
    overlayTitle.textContent = 'GAME OVER';
    overlayAction.innerHTML = 'PLAY AGAIN <span>↗</span>';
    overlayHint.textContent = 'PRESS R TO RESTART';
  } else {
    overlayKicker.textContent = 'TAKE A BREATHER';
    overlayTitle.textContent = 'PAUSED';
    overlayAction.innerHTML = 'RESUME GAME <span>↗</span>';
    overlayHint.textContent = 'PRESS P TO RESUME';
  }
  pauseButton.textContent = paused ? '▶' : 'Ⅱ';
  pauseButton.setAttribute('aria-label', paused ? 'Resume game' : 'Pause game');
}

function togglePause(): void {
  if (game.gameOver) return;
  paused = !paused;
  previousTime = null;
  render();
}
function restart(): void {
  game.reset();
  paused = false;
  previousTime = null;
  render();
}
function act(action: string): void {
  if (action === 'pause') { togglePause(); return; }
  if (action === 'restart') { if (game.gameOver) restart(); return; }
  if (paused || game.gameOver) return;
  switch (action) {
    case 'left': game.move(-1); break;
    case 'right': game.move(1); break;
    case 'rotate': game.rotate(1); break;
    case 'rotate-back': game.rotate(-1); break;
    case 'down': game.softDrop(); break;
    case 'drop': game.hardDrop(); break;
    case 'hold': game.hold(); break;
  }
  render();
}
const keyActions: Record<string, string> = {
  ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'rotate', KeyX: 'rotate',
  KeyZ: 'rotate-back', ControlLeft: 'rotate-back', ArrowDown: 'down', Space: 'drop',
  KeyC: 'hold', KeyR: 'restart', KeyP: 'pause',
};
window.addEventListener('keydown', event => {
  if (event.code === 'Space' && event.target instanceof HTMLButtonElement) return;
  const action = keyActions[event.code];
  if (!action) return;
  event.preventDefault();
  if (event.repeat && !['left', 'right', 'down'].includes(action)) return;
  act(action);
});
pauseButton.addEventListener('click', togglePause);
overlayAction.addEventListener('click', () => game.gameOver ? restart() : togglePause());

// Repeating the directional buttons makes touch controls useful for long moves too.
let repeatTimer: number | undefined;
document.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(button => {
  // Native keyboard activation emits a click without a preceding pointer event.
  button.addEventListener('click', event => { if (event.detail === 0) act(button.dataset.action!); });
  button.addEventListener('pointerdown', event => {
    event.preventDefault();
    const action = button.dataset.action!;
    act(action);
    if (['left', 'right', 'down'].includes(action)) {
      repeatTimer = window.setTimeout(() => { repeatTimer = window.setInterval(() => act(action), 70); }, 250);
    }
  });
  const stop = () => { window.clearTimeout(repeatTimer); window.clearInterval(repeatTimer); repeatTimer = undefined; };
  button.addEventListener('pointerup', stop);
  button.addEventListener('pointercancel', stop);
  button.addEventListener('pointerleave', stop);
});
window.addEventListener('blur', () => { if (!paused && !game.gameOver) togglePause(); });
function frame(time: number): void {
  if (previousTime !== null && !paused && !game.gameOver) game.update(Math.min(time - previousTime, 100));
  previousTime = time;
  render();
  requestAnimationFrame(frame);
}
render();
requestAnimationFrame(frame);
