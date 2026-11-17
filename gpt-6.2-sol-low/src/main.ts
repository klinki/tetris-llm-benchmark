import { cells, COLORS, Game, HEIGHT, WIDTH } from './game.js';

function context(id: string) {
  return document.querySelector<HTMLCanvasElement>('#' + id)!.getContext('2d')!;
}

const field = context('board');
const held = context('hold');
const next = context('next');
const status = document.querySelector('#status')!;
const stats = ['score', 'lines', 'level'] as const;
const size = 24;
let game = new Game();

function block(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, color: string, outline = false) {
  ctx.fillStyle = ctx.strokeStyle = color;
  if (outline) ctx.strokeRect(x + 2, y + 2, scale - 4, scale - 4);
  else ctx.fillRect(x + 1, y + 1, scale - 2, scale - 2);
}

function preview(ctx: CanvasRenderingContext2D, kind: number, centerY: number) {
  const points = cells({ kind, x: 0, y: 0, turn: 0 });
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const scale = 12;
  const left = (ctx.canvas.width - (Math.min(...xs) + Math.max(...xs) + 1) * scale) / 2;
  const top = centerY - (Math.min(...ys) + Math.max(...ys) + 1) * scale / 2;
  for (const [x, y] of points) block(ctx, left + x * scale, top + y * scale, scale, COLORS[kind]);
}

function render() {
  field.clearRect(0, 0, field.canvas.width, field.canvas.height);
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const tile = game.board[y][x];
      block(field, x * size, y * size, size, tile ? COLORS[tile - 1] : '#1d2338');
    }
  }
  if (!game.over) {
    for (const [x, y] of cells(game.ghost)) block(field, x * size, y * size, size, COLORS[game.active.kind], true);
    for (const [x, y] of cells(game.active)) block(field, x * size, y * size, size, COLORS[game.active.kind]);
  }
  held.clearRect(0, 0, held.canvas.width, held.canvas.height);
  if (game.held !== null) preview(held, game.held, 29);
  next.clearRect(0, 0, next.canvas.width, next.canvas.height);
  game.queue.slice(0, 5).forEach((kind, index) => preview(next, kind, 22 + 44 * index));
  for (const key of stats) document.querySelector('#' + key)!.textContent = String(game[key]);
  const message = game.over ? 'Game over. Press R to restart.' : '';
  if (status.textContent !== message) status.textContent = message;
}

const actions: Record<string, () => void> = {
  ArrowLeft: () => game.move(-1),
  ArrowRight: () => game.move(1),
  ArrowUp: () => game.rotate(1),
  KeyX: () => game.rotate(1),
  KeyZ: () => game.rotate(-1),
  ControlLeft: () => game.rotate(-1),
  ArrowDown: () => game.softDrop(),
  Space: () => game.hardDrop(),
  KeyC: () => game.hold(),
  KeyR: () => { if (game.over) game = new Game(); },
};

window.addEventListener('keydown', event => {
  const action = actions[event.code];
  if (!action || event.metaKey || event.altKey || (event.ctrlKey && event.code !== 'ControlLeft')) return;
  event.preventDefault();
  if (event.repeat && !['ArrowLeft', 'ArrowRight', 'ArrowDown'].includes(event.code)) return;
  action();
});

let last = performance.now();
function frame(now: number) {
  game.advance(Math.max(0, Math.min(50, now - last)));
  last = now;
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
