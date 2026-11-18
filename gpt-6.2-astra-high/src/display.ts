import { Game, HIDDEN, VISIBLE, WIDTH } from './game.js';
import { cells, type Kind } from './pieces.js';

export type Mode = 'ready' | 'playing' | 'paused' | 'over';
export const el = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const colors: Record<Kind, string> = {
  I: '#57c7cc',
  J: '#668bde',
  L: '#f09a46',
  O: '#eac457',
  S: '#91be68',
  T: '#ac81ca',
  Z: '#df7264'
};
const icons: Record<string, string> = {
  mute: '<path d="M11 5 6 9H3v6h3l5 4z M16 9l6 6m0-6-6 6"/>',
  volume: '<path d="M11 5 6 9H3v6h3l5 4z M15 8q4 4 0 8m3-11q7 7 0 14"/>',
  pause: '<path d="M8 5v14m8-14v14" stroke-width="3"/>',
  play: '<path d="m8 5 11 7-11 7z"/>',
  score: '<path d="M4 15v5h4v-5zm6-5v10h4V10zm6-6v16h4V4z"/>',
  trophy:
    '<path d="M7 4h10v6a5 5 0 0 1-10 0z M7 6H3v2q0 5 5 5m9-7h4v2q0 5-5 5m-4 2v4m-4 2h8"/>',
  hold: '<path d="M5 9h12l-4-4m4 4-4 4 M5 14v4h13"/>',
  queue: '<path d="m3 6 3 2-3 2z M10 8h11M10 13h8m-8 5h5"/>',
  keys: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M5 9h1m3 0h1m3 0h1m3 0h1M5 12h1m3 0h1m3 0h1m3 0h1M8 15h8"/>'
};
export function icon(node: Element, name: string) {
  node.innerHTML =
    '<svg viewBox="0 0 24 24" aria-hidden="true">' + icons[name] + '</svg>';
}

function initLogo() {
  const letters: Record<string, string[]> = {
    T: ['11111', '11111', '00100', '00100', '00100', '00100', '00100'],
    E: ['11111', '11111', '11000', '11110', '11000', '11111', '11111'],
    R: ['11110', '11011', '11011', '11110', '11100', '11010', '11011'],
    I: ['11111', '11111', '00100', '00100', '00100', '11111', '11111'],
    S: ['01111', '11111', '11000', '01110', '00011', '11111', '11110']
  };
  const logo = el('wordmark');
  [...'TETRIS'].forEach((letter, i) =>
    letters[letter].forEach((row, y) => {
      [...row].forEach((pixel, x) => {
        if (pixel === '0') return;
        const square = document.createElement('i');
        square.style.gridArea = y + 1 + ' / ' + (i * 6 + x + 1);
        logo.append(square);
      });
    })
  );
}

function surface(canvas: HTMLCanvasElement, w: number, h: number) {
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
  const height = Math.max(1, Math.round(canvas.clientHeight * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(width / w, 0, 0, height / h, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return ctx;
}

function tile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  kind: Kind
) {
  const inset = size * 0.055,
    side = size - 2 * inset,
    edge = Math.max(1, size * 0.085);
  x += inset;
  y += inset;
  ctx.fillStyle = colors[kind];
  ctx.fillRect(x, y, side, side);
  ctx.fillStyle = '#ffffff45';
  ctx.fillRect(x, y, side, edge);
  ctx.fillRect(x, y + edge, edge, side - 2 * edge);
  ctx.fillStyle = '#17251d40';
  ctx.fillRect(x, y + side - edge, side, edge);
  ctx.fillRect(x + side - edge, y + edge, edge, side - 2 * edge);
  ctx.strokeStyle = '#24251d20';
  ctx.lineWidth = Math.max(0.6, size * 0.031);
  ctx.strokeRect(x + side * 0.21, y + side * 0.21, side * 0.58, side * 0.58);
}

function preview(canvas: HTMLCanvasElement, kind: Kind | null) {
  const ctx = surface(canvas, 100, 42);
  if (!kind) return;
  const shape = cells({ kind, rotation: 0, x: 0, y: 0 });
  const xs = shape.map((c) => c[0]),
    ys = shape.map((c) => c[1]);
  const size = 16,
    x0 = 50 - ((Math.min(...xs) + Math.max(...xs) + 1) * size) / 2;
  const y0 = 21 - ((Math.min(...ys) + Math.max(...ys) + 1) * size) / 2;
  for (const [x, y] of shape)
    tile(ctx, x0 + x * size, y0 + y * size, size, kind);
}

const demo = [
  '.........L',
  'I.......LL',
  'I.T...SSJL',
  'ITTT.SS.JJ',
  'IOO.ZZ.TTJ',
  'JOO..ZZTTS'
];
function drawBoard(game: Game, ready: boolean) {
  const size = 32,
    w = WIDTH * size,
    h = VISIBLE * size;
  const ctx = surface(el('board'), w, h);
  ctx.fillStyle = '#1c211d';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#353a315f';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x < w; x += size) {
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, h);
  }
  for (let y = 0; y < h; y += size) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(w, y + 0.5);
  }
  ctx.stroke();
  if (ready) {
    demo.forEach((row, i) =>
      [...row].forEach((c, x) => {
        if (c !== '.')
          tile(
            ctx,
            x * size,
            (VISIBLE - demo.length + i) * size,
            size,
            c as Kind
          );
      })
    );
    return;
  }
  game.board.slice(HIDDEN).forEach((row, y) =>
    row.forEach((kind, x) => {
      if (kind) tile(ctx, x * size, y * size, size, kind);
    })
  );
  if (game.over) return;
  const piece = game.active,
    ghost = game.ghostY;
  for (const [x, y] of cells(piece)) {
    const px = (piece.x + x) * size,
      py = (ghost + y - HIDDEN) * size;
    ctx.fillStyle = colors[piece.kind] + '15';
    ctx.fillRect(px + 2, py + 2, size - 4, size - 4);
    ctx.strokeStyle = colors[piece.kind] + '9e';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(px + 2, py + 2, size - 4, size - 4);
  }
  for (const [x, y] of cells(piece))
    tile(
      ctx,
      (piece.x + x) * size,
      (piece.y + y - HIDDEN) * size,
      size,
      piece.kind
    );
}

export class Display {
  private previews: HTMLCanvasElement[] = [];
  constructor() {
    initLogo();
    document
      .querySelectorAll<HTMLElement>('[data-icon]')
      .forEach((n) => icon(n, n.dataset.icon!));
    for (let i = 0; i < 5; i++) {
      const row = document.createElement('div');
      row.className = 'queue-row';
      const index = document.createElement('span');
      index.className = 'queue-index';
      index.textContent = String(i + 1).padStart(2, '0');
      const canvas = document.createElement('canvas');
      row.append(index, canvas);
      el('queue').append(row);
      this.previews.push(canvas);
    }
  }
  render(game: Game, mode: Mode, best: number) {
    drawBoard(game, mode === 'ready');
    this.previews.forEach((c, i) => {
      c.setAttribute('aria-label', 'Next ' + (i + 1) + ': ' + game.queue[i]);
      preview(c, game.queue[i]);
    });
    const hold = el<HTMLCanvasElement>('hold-piece');
    preview(hold, game.held);
    hold.setAttribute(
      'aria-label',
      game.held ? 'Held ' + game.held : 'No held piece'
    );
    hold.style.opacity = game.holdUsed ? '.5' : '1';
    el('empty-hold').hidden = !!game.held;
    el('score').textContent = String(game.score).padStart(6, '0');
    el('best').textContent = String(best).padStart(6, '0');
    el('level').textContent = String(game.level).padStart(2, '0');
    el('lines').textContent = String(game.lines).padStart(3, '0');
    el('progress').style.width = (game.lines % 10) * 10 + '%';
    el('progress-label').textContent = (game.lines % 10) + ' / 10';
    el('overlay').hidden = mode === 'playing';
    const labels = {
      ready: 'Ready',
      playing: 'Playing',
      paused: 'Paused',
      over: 'Game over'
    };
    if (el('status').textContent !== labels[mode])
      el('status').textContent = labels[mode];
    el('lamp').classList.toggle('live', mode === 'playing');
    el('overlay-title').textContent =
      mode === 'ready' ? 'Ready to play?' : labels[mode];
    el('action-label').textContent =
      mode === 'over'
        ? 'Play again'
        : mode === 'paused'
          ? 'Resume'
          : 'Start game';
    el('shortcut').textContent =
      mode === 'over'
        ? 'or press R'
        : mode === 'paused'
          ? 'or press P'
          : 'or press Enter';
    el<HTMLButtonElement>('pause').disabled =
      mode === 'ready' || mode === 'over';
    el('pause-label').textContent = mode === 'paused' ? 'Resume' : 'Pause';
    el('pause').setAttribute(
      'aria-label',
      mode === 'paused' ? 'Resume' : 'Pause'
    );
    icon(el('pause').firstElementChild!, mode === 'paused' ? 'play' : 'pause');
  }
}
