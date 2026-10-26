import { Game, blocks, BUFFER, HEIGHT, WIDTH, type Kind } from './game.js';

const game = new Game();
const colors: Record<Kind, string> = { I:'#5ad7e5', J:'#6688ed', L:'#f5a45e', O:'#f6d76a', S:'#9bdc76', T:'#bc8ce9', Z:'#ee797c' };
const board = document.querySelector<HTMLCanvasElement>('#board')!;
const hold = document.querySelector<HTMLCanvasElement>('#hold')!;
const queue = document.querySelector<HTMLElement>('#next-queue')!;
const score = document.querySelector<HTMLElement>('#score')!;
const level = document.querySelector<HTMLElement>('#level')!;
const lines = document.querySelector<HTMLElement>('#lines')!;
const progress = document.querySelector<HTMLElement>('#progress')!;
const progressText = document.querySelector<HTMLElement>('#progress-text')!;
const message = document.querySelector<HTMLElement>('#game-message')!;
const overlay = document.querySelector<HTMLElement>('#overlay')!;
const overlayTitle = document.querySelector<HTMLElement>('#overlay-title')!;
const overlayText = document.querySelector<HTMLElement>('#overlay-text')!;
const overlayButton = document.querySelector<HTMLButtonElement>('#overlay-button')!;
const pauseButton = document.querySelector<HTMLButtonElement>('#pause')!;
const pauseIcon = document.querySelector<HTMLElement>('#pause-icon')!;
for (let i = 0; i < 5; i++) {
  const canvas = document.createElement('canvas'); canvas.width = 160; canvas.height = 50;
  canvas.setAttribute('aria-label', `Next piece ${i + 1}`); queue.append(canvas);
}
function tile(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, ghost = false): void {
  const gap = Math.max(1, size * .06), px = x + gap, py = y + gap, s = size - gap * 2;
  if (ghost) { ctx.strokeStyle = color; ctx.globalAlpha = .55; ctx.lineWidth = 1.5; ctx.strokeRect(px + 1, py + 1, s - 2, s - 2); ctx.globalAlpha = 1; return; }
  ctx.fillStyle = color; ctx.fillRect(px, py, s, s);
  ctx.fillStyle = 'rgba(255,255,255,.20)'; ctx.fillRect(px + 2, py + 2, s - 4, 2);
  ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.fillRect(px + 2, py + s - 3, s - 4, 2);
}
function drawMini(canvas: HTMLCanvasElement, kind: Kind | null): void {
  const width = Math.max(1, Math.round(canvas.clientWidth)), height = Math.max(1, Math.round(canvas.clientHeight));
  if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
  const ctx = canvas.getContext('2d')!; ctx.clearRect(0,0,canvas.width,canvas.height);
  if (!kind) return;
  const cells = blocks(kind), minX = Math.min(...cells.map(p => p[0])), maxX = Math.max(...cells.map(p => p[0]));
  const minY = Math.min(...cells.map(p => p[1])), maxY = Math.max(...cells.map(p => p[1]));
  const size = Math.min(canvas.height > 60 ? 21 : 16, canvas.width / (maxX - minX + 2), canvas.height / (maxY - minY + 1));
  const ox = (canvas.width - (maxX - minX + 1) * size) / 2, oy = (canvas.height - (maxY - minY + 1) * size) / 2;
  for (const [x,y] of cells) tile(ctx, ox + (x-minX)*size, oy + (y-minY)*size, size, colors[kind]);
}
function draw(): void {
  const ctx = board.getContext('2d')!, size = board.width / WIDTH;
  ctx.clearRect(0, 0, board.width, board.height);
  ctx.strokeStyle = '#222a38'; ctx.lineWidth = 1;
  for (let x = 0; x <= WIDTH; x++) { ctx.beginPath(); ctx.moveTo(x*size+.5,0); ctx.lineTo(x*size+.5,board.height); ctx.stroke(); }
  for (let y = 0; y <= HEIGHT; y++) { ctx.beginPath(); ctx.moveTo(0,y*size+.5); ctx.lineTo(board.width,y*size+.5); ctx.stroke(); }
  for (let y = 0; y < HEIGHT; y++) for (let x = 0; x < WIDTH; x++) {
    const kind = game.board[y + BUFFER][x]; if (kind) tile(ctx,x*size,y*size,size,colors[kind]);
  }
  if (!game.gameOver) {
    const ghostY = game.ghostY();
    for (const [dx,dy] of blocks(game.current.kind, game.current.rotation)) {
      const x = game.current.x+dx, y = ghostY+dy;
      if (y >= 0) tile(ctx,x*size,y*size,size,colors[game.current.kind],true);
    }
    for (const [dx,dy] of blocks(game.current.kind, game.current.rotation)) {
      const x = game.current.x+dx, y = game.current.y+dy;
      if (y >= 0) tile(ctx,x*size,y*size,size,colors[game.current.kind]);
    }
  }
  drawMini(hold, game.held);
  Array.from(queue.children).forEach((canvas,i) => drawMini(canvas as HTMLCanvasElement, game.queue[i]));
  score.textContent = String(game.score).padStart(6,'0'); level.textContent = String(game.level).padStart(2,'0'); lines.textContent = String(game.lines).padStart(2,'0');
  progress.style.width = `${(game.lines % 10) * 10}%`; progressText.textContent = `${game.lines % 10} / 10`;
  message.textContent = game.message || 'GOOD LUCK & HAVE FUN';
  overlay.classList.toggle('hidden', !game.gameOver && !game.paused);
  overlayTitle.textContent = game.gameOver ? 'Game over' : 'Paused';
  overlayText.textContent = game.gameOver ? 'Nice run. Ready for another?' : 'Take your time.';
  overlayButton.innerHTML = game.gameOver ? 'PLAY AGAIN <span>↗</span>' : 'RESUME GAME <span>↗</span>';
  pauseIcon.textContent = game.paused ? '▶' : 'Ⅱ';
  pauseButton.setAttribute('aria-label', game.paused ? 'Resume game' : 'Pause game');
}
function togglePause(): void { if (!game.gameOver) { game.paused = !game.paused; draw(); } }
pauseButton.addEventListener('click', togglePause);
overlayButton.addEventListener('click', () => { if (game.gameOver) game.restart(); else game.paused = false; draw(); });
let down = false;
document.addEventListener('keydown', event => {
  const key = event.key.toLowerCase();
  if (['arrowleft','arrowright','arrowup','arrowdown',' ','x','z','control','c','r','p','escape'].includes(key)) event.preventDefault();
  if (key === 'arrowdown') { if (!down) game.softDrop(); down = true; }
  else if (key === 'arrowleft') game.move(-1);
  else if (key === 'arrowright') game.move(1);
  else if (!event.repeat) {
    if (key === 'arrowup' || key === 'x') game.rotate(1);
    else if (key === 'z' || (key === 'control' && event.location !== KeyboardEvent.DOM_KEY_LOCATION_RIGHT)) game.rotate(-1);
    else if (key === ' ') game.hardDrop();
    else if (key === 'c') game.hold();
    else if (key === 'r' && game.gameOver) game.restart();
    else if (key === 'p' || key === 'escape') togglePause();
  }
  draw();
});
document.addEventListener('keyup', event => { if (event.key === 'ArrowDown') down = false; });
window.addEventListener('blur', () => { down = false; if (!game.gameOver && !game.paused) { game.paused = true; draw(); } });
document.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(button => button.addEventListener('click', () => {
  switch (button.dataset.action) {
    case 'left': game.move(-1); break; case 'right': game.move(1); break;
    case 'rotate': game.rotate(1); break; case 'rotate-back': game.rotate(-1); break;
    case 'down': game.softDrop(); break; case 'drop': game.hardDrop(); break; case 'hold': game.hold(); break;
  }
  draw();
}));
let previous = performance.now();
function frame(now: number): void { game.tick(now - previous, down); previous = now; draw(); requestAnimationFrame(frame); }
draw(); requestAnimationFrame(frame);
