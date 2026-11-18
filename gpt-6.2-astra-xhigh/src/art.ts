import { SHAPES, type Kind } from './pieces.js';
import { Game, HIDDEN, WIDTH } from './game.js';

const glyphs: Record<string, string> = {
  A: '01110 11011 11011 11111 11011 11011 11011',
  D: '11110 11011 11011 11011 11011 11011 11110',
  E: '11111 11000 11000 11110 11000 11000 11111',
  G: '01111 11000 11000 11011 11011 11011 01111',
  I: '1111 0110 0110 0110 0110 0110 1111',
  M: '11011 11111 11111 11011 11011 11011 11011',
  O: '01110 11011 11011 11011 11011 11011 01110',
  P: '11110 11011 11011 11110 11000 11000 11000',
  R: '11110 11011 11011 11110 11100 11010 11011',
  S: '01111 11000 11000 01110 00011 00011 11110',
  T: '111111 111111 001100 001100 001100 001100 001100',
  U: '11011 11011 11011 11011 11011 11011 01110',
  V: '11011 11011 11011 11011 11011 01010 00100',
  Y: '11011 11011 01010 00100 00100 00100 00100',
  '?': '01110 11011 00011 00110 00100 00000 00100',
  ' ': '000 000 000 000 000 000 000',
  '0': '01110 10001 10011 10101 11001 10001 01110',
  '1': '00100 01100 00100 00100 00100 00100 01110',
  '2': '01110 10001 00001 00010 00100 01000 11111',
  '3': '11110 00001 00001 01110 00001 00001 11110',
  '4': '00010 00110 01010 10010 11111 00010 00010',
  '5': '11111 10000 10000 11110 00001 00001 11110',
  '6': '01110 10000 10000 11110 10001 10001 01110',
  '7': '11111 00001 00010 00100 01000 01000 01000',
  '8': '01110 10001 10001 01110 10001 10001 01110',
  '9': '01110 10001 10001 01111 00001 00001 01110',
};

export function lettering(canvas: HTMLCanvasElement, word: string, color: string, shadow?: string) {
  const letters = [...word].map((char) => glyphs[char].split(' '));
  canvas.width = letters.reduce((n, rows) => n + rows[0].length + 1, shadow ? 0 : -1);
  canvas.height = shadow ? 8 : 7;
  const ctx = canvas.getContext('2d')!;
  function draw(offset: number, ink: string) {
    ctx.fillStyle = ink;
    let x = offset;
    for (const rows of letters) {
      rows.forEach((row, y) =>
        [...row].forEach((bit, dx) => {
          if (bit === '1') ctx.fillRect(x + dx, y + offset, 1, 1);
        }),
      );
      x += rows[0].length + 1;
    }
  }
  if (shadow) draw(1, shadow);
  draw(0, color);
}

const colors: Record<Kind, string> = {
  I: '#50cdd4',
  J: '#568fea',
  L: '#f4a24d',
  O: '#f5cf55',
  S: '#8cce77',
  T: '#ad87dc',
  Z: '#ef746c',
};

function tile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  kind: Kind,
  ghost = false,
) {
  const edge = Math.max(1, Math.round(size / 12));
  ctx.fillStyle = colors[kind];
  if (ghost) {
    ctx.globalAlpha = 0.66;
    ctx.strokeStyle = colors[kind];
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
    ctx.globalAlpha = 1;
    return;
  }
  ctx.fillStyle = '#2c3030';
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = colors[kind];
  ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
  ctx.fillStyle = '#ffffff68';
  ctx.fillRect(x + 1, y + 1, size - 2, edge);
  ctx.fillRect(x + 1, y + 1, edge, size - 2);
  ctx.fillStyle = '#11191f40';
  ctx.fillRect(x + 1, y + size - 1 - edge, size - 2, edge);
  ctx.fillRect(x + size - 1 - edge, y + 1, edge, size - 2);
}

export function preview(canvas: HTMLCanvasElement, kind: Kind | null) {
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  canvas.setAttribute('aria-label', kind ? kind + ' piece' : 'Empty hold slot');
  if (!kind) {
    ctx.fillStyle = '#aaa798';
    ctx.fillRect(canvas.width / 2 - 7, canvas.height / 2, 14, 3);
    return;
  }
  const cells = SHAPES[kind][0];
  const w = 1 + Math.max(...cells.map(([x]) => x));
  const minY = Math.min(...cells.map(([, y]) => y));
  const h = 1 + Math.max(...cells.map(([, y]) => y)) - minY;
  const s = Math.min(20, Math.floor(canvas.width / w), Math.floor(canvas.height / h));
  for (const [x, y] of cells)
    tile(
      ctx,
      (canvas.width - w * s) / 2 + x * s,
      (canvas.height - h * s) / 2 + (y - minY) * s,
      s,
      kind,
    );
}

export function drawBoard(canvas: HTMLCanvasElement, game: Game, ready: boolean) {
  const pixels =
    Math.max(10, Math.round((canvas.clientWidth * (window.devicePixelRatio || 1)) / 10)) * 10;
  if (canvas.width !== pixels) {
    canvas.width = pixels;
    canvas.height = pixels * 2;
  }
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(pixels / 300, 0, 0, pixels / 300, 0, 0);
  ctx.fillStyle = '#20272c';
  ctx.fillRect(0, 0, 300, 600);
  ctx.fillStyle = '#343c41';
  for (let i = 0; i < 20; i++) {
    ctx.fillRect(0, i * 30, 300, 0.8);
    if (i < WIDTH) ctx.fillRect(i * 30, 0, 0.8, 600);
  }
  if (ready) {
    const skyline = [
      '......T...',
      '.....TTT..',
      'JJ...SS..L',
      '.J..SS.LLL',
      '.JOO.ZZIJJ',
      'TTOO..ZZIJ',
    ];
    skyline.forEach((row, i) =>
      [...row].forEach((c, x) => {
        if (c !== '.') tile(ctx, x * 30, (20 - skyline.length + i) * 30, 30, c as Kind);
      }),
    );
    for (const [x, y] of SHAPES.T[0]) tile(ctx, (x + 3) * 30, (y + 2) * 30, 30, 'T');
    return;
  }
  game.board.slice(HIDDEN).forEach((row, y) =>
    row.forEach((kind, x) => {
      if (kind) tile(ctx, x * 30, y * 30, 30, kind);
    }),
  );
  if (game.over) return;
  const { kind, rotation, x, y } = game.active;
  const ghost = game.ghostY;
  for (const [dx, dy] of SHAPES[kind][rotation]) {
    if (ghost !== y) tile(ctx, (x + dx) * 30, (ghost + dy - HIDDEN) * 30, 30, kind, true);
  }
  for (const [dx, dy] of SHAPES[kind][rotation])
    tile(ctx, (x + dx) * 30, (y + dy - HIDDEN) * 30, 30, kind);
}

export function trophy(canvas: HTMLCanvasElement) {
  const map = [
    '..xxxxxxxx..',
    'xxxooooooxxx',
    'x.xoyyyyox.x',
    'x.xoyyyyox.x',
    '.xxoyyyyoxx.',
    '...xoooox...',
    '....xoox....',
    '.....xx.....',
    '....xoox....',
    '...xxxxxx...',
  ];
  canvas.width = 12;
  canvas.height = 10;
  const ctx = canvas.getContext('2d')!;
  const palette: Record<string, string> = { x: '#30312b', o: '#e5a937', y: '#fada6a' };
  map.forEach((row, y) =>
    [...row].forEach((c, x) => {
      if (palette[c]) {
        ctx.fillStyle = palette[c];
        ctx.fillRect(x, y, 1, 1);
      }
    }),
  );
}
