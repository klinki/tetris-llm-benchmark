import { COLORS, COLS, ROWS, Cell, Matrix, Piece, PieceType, clearLines, collides, createBoard, makePiece, sevenBag, tryRotate } from './game.js';

const boardCanvas = document.querySelector<HTMLCanvasElement>('#board')!;
const holdCanvas = document.querySelector<HTMLCanvasElement>('#hold')!;
const nextCanvas = document.querySelector<HTMLCanvasElement>('#next')!;
const ctx = boardCanvas.getContext('2d')!;
const holdCtx = holdCanvas.getContext('2d')!;
const nextCtx = nextCanvas.getContext('2d')!;
const overlay = document.querySelector<HTMLDivElement>('#overlay')!;
const startButton = document.querySelector<HTMLButtonElement>('#start')!;
const status = document.querySelector<HTMLElement>('#status')!;
const cellSize = 30;
const SCORE_TABLE = [0, 100, 300, 500, 800];
const gravity = [1000, 850, 700, 550, 420, 300, 220, 160, 110, 80];

let board: Matrix = createBoard(), bag: PieceType[] = [], queue: PieceType[] = [], current: Piece | null = null, held: PieceType | null = null;
let canHold = true, running = false, gameOver = false, score = 0, lines = 0, level = 1;
let lastTime = 0, fallTime = 0, lockTime = 0, lockResets = 0, animation = 0;
let best = Number(localStorage.getItem('tetris-best') || 0);
document.querySelector('#best')!.textContent = String(best);

function refillQueue(): void {
  while (queue.length < 7) { if (!bag.length) bag = sevenBag(); queue.push(...bag.splice(0, 7 - queue.length)); }
}
function takeNext(): Piece { refillQueue(); return makePiece(queue.shift()!); }
function updateStats(): void {
  document.querySelector('#score')!.textContent = String(score);
  document.querySelector('#lines')!.textContent = String(lines);
  document.querySelector('#level')!.textContent = String(level);
}
function start(): void {
  cancelAnimationFrame(animation); board = createBoard(); bag = []; queue = []; held = null; canHold = true;
  score = 0; lines = 0; level = 1; gameOver = false; running = true; fallTime = 0; lockTime = 0; lockResets = 0;
  current = takeNext(); overlay.classList.add('hidden'); status.textContent = 'GAME IN PROGRESS'; updateStats(); draw(); lastTime = performance.now(); animation = requestAnimationFrame(tick);
}
function endGame(): void { running = false; gameOver = true; cancelAnimationFrame(animation); overlay.classList.remove('hidden');
  overlay.querySelector('.overlay-kicker')!.textContent = 'STACK COMPLETE'; overlay.querySelector('h1')!.textContent = 'GAME OVER';
  overlay.querySelector('.overlay-card p')!.textContent = `You scored ${score.toLocaleString()} points. Press R to try again.`;
  startButton.innerHTML = 'PLAY AGAIN <span>↻</span>'; status.textContent = 'GAME OVER · PRESS R TO RESTART';
}
function lockPiece(): void {
  if (!current) return;
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if (current.matrix[y][x]) {
    const by = current.y + y, bx = current.x + x;
    if (by < 0) { endGame(); return; }
    board[by][bx] = current.type;
  }
  const cleared = clearLines(board);
  if (cleared) { score += SCORE_TABLE[cleared] * level; lines += cleared; level = Math.floor(lines / 10) + 1; }
  canHold = true; current = takeNext(); lockTime = 0; lockResets = 0;
  if (collides(board, current)) { endGame(); return; }
  updateStats();
}
function move(dx: number, dy = 0): boolean {
  if (!current || collides(board, current, current.x + dx, current.y + dy)) return false;
  current.x += dx; current.y += dy;
  if (dy > 0) { score++; updateStats(); }
  if (collides(board, current, current.x, current.y + 1) && lockResets < 15) { lockTime = 0; lockResets++; }
  return true;
}
function rotate(clockwise: boolean): void {
  if (current && tryRotate(board, current, clockwise) && collides(board, current, current.x, current.y + 1) && lockResets < 15) { lockTime = 0; lockResets++; }
}
function hold(): void {
  if (!current || !canHold) return;
  const old = current.type; current = held ? makePiece(held) : takeNext(); held = old; canHold = false; lockTime = 0; lockResets = 0;
  if (collides(board, current)) endGame();
}
function hardDrop(): void {
  if (!current) return;
  let distance = 0; while (!collides(board, current, current.x, current.y + 1)) { current.y++; distance++; }
  score += distance * 2; updateStats(); lockPiece();
}
function tick(now: number): void {
  if (!running || !current) return;
  const dt = Math.min(50, now - lastTime); lastTime = now; fallTime += dt;
  const interval = gravity[Math.min(level - 1, gravity.length - 1)];
  if (fallTime >= interval) { fallTime %= interval; move(0, 1); }
  if (collides(board, current, current.x, current.y + 1)) { lockTime += dt; if (lockTime >= 500) lockPiece(); } else lockTime = 0;
  draw(); if (running) animation = requestAnimationFrame(tick);
}
function roundedRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  c.beginPath(); c.roundRect(x, y, w, h, r);
}
function drawCell(c: CanvasRenderingContext2D, x: number, y: number, color: string, size = cellSize, ghost = false): void {
  const inset = Math.max(1, size * .07), xx = x * size + inset, yy = y * size + inset, w = size - inset * 2;
  if (ghost) { c.strokeStyle = color + '99'; c.lineWidth = 2; roundedRect(c, xx + 2, yy + 2, w - 4, w - 4, 4); c.stroke(); return; }
  c.fillStyle = color; roundedRect(c, xx, yy, w, w, Math.max(3, size * .14)); c.fill();
  c.fillStyle = '#ffffff38'; roundedRect(c, xx + 2, yy + 2, w - 4, Math.max(2, size * .12), 2); c.fill();
  c.fillStyle = '#05071118'; roundedRect(c, xx + 2, yy + w - 5, w - 4, 3, 2); c.fill();
}
function drawMini(c: CanvasRenderingContext2D, type: PieceType | null, yOffset = 0, size = 20): void {
  if (!type) return;
  const matrix = makePiece(type).matrix;
  const cells: [number, number][] = [];
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if (matrix[y][x]) cells.push([x, y]);
  const minX = Math.min(...cells.map(v => v[0])), maxX = Math.max(...cells.map(v => v[0]));
  const minY = Math.min(...cells.map(v => v[1])), maxY = Math.max(...cells.map(v => v[1]));
  const offsetX = (c.canvas.width - (maxX - minX + 1) * size) / 2;
  for (const [x, y] of cells) {
    const xx = (offsetX + (x - minX) * size) / size, yy = (yOffset + (y - minY) * size) / size;
    drawCell(c, xx, yy, COLORS[type], size);
  }
}
function draw(): void {
  ctx.clearRect(0, 0, boardCanvas.width, boardCanvas.height); ctx.fillStyle = '#111522'; ctx.fillRect(0, 0, boardCanvas.width, boardCanvas.height);
  ctx.strokeStyle = '#ffffff09'; ctx.lineWidth = 1;
  for (let x = 1; x < COLS; x++) { ctx.beginPath(); ctx.moveTo(x * cellSize + .5, 0); ctx.lineTo(x * cellSize + .5, ROWS * cellSize); ctx.stroke(); }
  for (let y = 1; y < ROWS; y++) { ctx.beginPath(); ctx.moveTo(0, y * cellSize + .5); ctx.lineTo(COLS * cellSize, y * cellSize + .5); ctx.stroke(); }
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { const type = board[y][x]; if (type) drawCell(ctx, x, y, COLORS[type]); }
  if (current) {
    let ghostY = current.y; while (!collides(board, current, current.x, ghostY + 1)) ghostY++;
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if (current.matrix[y][x]) {
      if (ghostY + y >= 0) drawCell(ctx, current.x + x, ghostY + y, COLORS[current.type], cellSize, true);
      if (current.y + y >= 0) drawCell(ctx, current.x + x, current.y + y, COLORS[current.type]);
    }
  }
  holdCtx.clearRect(0, 0, holdCanvas.width, holdCanvas.height); if (held) drawMini(holdCtx, held, 25, 19);
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height); refillQueue();
  queue.slice(0, 5).forEach((type, i) => drawMini(nextCtx, type, 8 + i * 57, 16));
}
startButton.addEventListener('click', start);
document.addEventListener('keydown', (event: KeyboardEvent) => {
  const key = event.key.toLowerCase();
  if ([' ', 'arrowleft', 'arrowright', 'arrowdown', 'arrowup'].includes(key)) event.preventDefault();
  if (!running) { if (key === 'r' || key === 'enter' || key === ' ') start(); return; }
  if (!current) return;
  switch (key) {
    case 'arrowleft': case 'a': move(-1); break;
    case 'arrowright': case 'd': move(1); break;
    case 'arrowdown': case 's': if (move(0, 1)) fallTime = 0; break;
    case 'arrowup': case 'x': rotate(true); break;
    case 'z': case 'control': rotate(false); break;
    case ' ': hardDrop(); break;
    case 'c': hold(); break;
  }
  draw();
});
draw();
