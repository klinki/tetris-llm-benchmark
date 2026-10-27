// Engine adapters for the blind audit. Coordinates are normalized:
// x = column 0..9, y = visible row 0 (top) .. 19 (bottom), negative = above the field.
// Piece origin = canonical SRS bounding-box origin (O uses the 3-wide box: cells at x+1..x+2).
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

export function seeded(seed = 1) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 2 ** 32; };
}

const imp = (root, rel) => import(pathToFileURL(join(root, rel)).href);

export async function loadAdapters(tmp) {
  const A = await imp(join(tmp, 'run-a'), 'dist/game.js');
  const Bg = await imp(join(tmp, 'run-b'), 'dist/game.js');
  const Bb = await imp(join(tmp, 'run-b'), 'dist/board.js');
  const Br = await imp(join(tmp, 'run-b'), 'dist/randomizer.js');
  const C = await imp(join(tmp, 'run-c'), 'dist/game.js');

  // A queue source for run-b that deals a fixed list then falls back to a seeded bag.
  const listSource = (list, rnd) => {
    const bag = new Br.Bag(rnd);
    const q = [...list];
    return {
      next: () => (q.length ? q.shift() : bag.next()),
      peek: (n) => { const out = q.slice(0, n); if (out.length < n) out.push(...bag.peek(n - out.length)); return out; },
    };
  };

  const runA = {
    name: 'run-a',
    create({ queue = [], random = seeded(1) } = {}) {
      const g = new A.Game(random);
      if (queue.length) {
        // first element becomes active, rest queued (spawn uses the public queue)
        g.queue = [...queue.slice(1), ...g.queue];
        g.board = Array.from({ length: A.HEIGHT + A.BUFFER }, () => Array(A.WIDTH).fill(null));
        g.active = { type: queue[0], rotation: 0, x: 3, y: -1 };
      }
      return wrapA(g);
    },
  };
  function wrapA(g) {
    return {
      g,
      get active() { const p = g.active; return p && { type: p.type, rotation: p.rotation, x: p.x, y: p.y }; },
      setActive(type, rotation, x, y) { g.active = { type, rotation, x, y }; },
      cell(x, y) { return g.board[y + A.BUFFER][x]; },
      fill(x, y, v = 'Z') { g.board[y + A.BUFFER][x] = v; },
      clearBoard() { g.board = Array.from({ length: A.HEIGHT + A.BUFFER }, () => Array(A.WIDTH).fill(null)); },
      left: () => g.move(-1), right: () => g.move(1),
      cw: () => g.rotate(1), ccw: () => g.rotate(-1),
      soft: () => g.softDrop(),
      hard: () => g.hardDrop(),
      hold: () => g.hold(),
      tick: (ms) => g.update(ms),
      ghostY: () => g.ghost.y,
      get score() { return g.score; }, set score(v) { g.score = v; },
      get level() { return g.level; }, set level(v) { g.level = v; },
      get lines() { return g.lines; }, set lines(v) { g.lines = v; },
      get over() { return g.status === 'gameover'; },
      get held() { return g.held; },
      get canHold() { return g.canHold; },
      get queue() { return g.queue.slice(0, 5); },
      restart: () => g.restart(),
      boardEmpty() { return g.board.every(r => r.every(c => c === null)); },
    };
  }

  const runB = {
    name: 'run-b',
    create({ queue = [], random = seeded(1) } = {}) {
      const g = new Bg.Game(listSource(queue, random));
      return wrapB(g, queue, random);
    },
  };
  const OFF = Bb.HIDDEN_ROWS;
  function wrapB(gInit, queue, random) {
    let g = gInit;
    const ox = (type) => (type === 'O' ? 1 : 0);
    return {
      get g() { return g; },
      get active() { const p = g.active; return p && { type: p.type, rotation: p.rotation, x: p.x - ox(p.type), y: p.y - OFF }; },
      setActive(type, rotation, x, y) { g.active = { type, rotation, x: x + ox(type), y: y + OFF }; },
      cell(x, y) { return g.board.get(x, y + OFF); },
      fill(x, y, v = 'Z') { g.board.set(x, y + OFF, v); },
      clearBoard() { for (let y = 0; y < Bb.ROWS; y++) for (let x = 0; x < Bb.COLS; x++) g.board.set(x, y, null); },
      left: () => g.shift(-1), right: () => g.shift(1),
      cw: () => g.rotate(1), ccw: () => g.rotate(-1),
      // soft drop = press-and-release equivalent of one cell
      soft: () => { const y = g.active?.y; g.setSoftDrop(true); g.setSoftDrop(false); return g.active?.y !== y; },
      softOn: () => g.setSoftDrop(true), softOff: () => g.setSoftDrop(false),
      hard: () => g.hardDrop(),
      hold: () => g.hold(),
      tick: (ms) => g.update(ms),
      ghostY: () => g.ghostY() - OFF,
      get score() { return g.score; }, set score(v) { g.score = v; },
      get level() { return g.level; }, set level(v) { g.level = v; },
      get lines() { return g.lines; }, set lines(v) { g.lines = v; },
      get over() { return g.state === 'over'; },
      get held() { return g.held; },
      get canHold() { return !g.holdUsed; },
      get queue() { return g.queue; },
      restart: () => { g = new Bg.Game(listSource([], random)); },
      boardEmpty() { for (let y = 0; y < Bb.ROWS; y++) for (let x = 0; x < Bb.COLS; x++) if (g.board.get(x, y)) return false; return true; },
    };
  }

  const runC = {
    name: 'run-c',
    create({ queue = [], random = seeded(1) } = {}) {
      const g = new C.TetrisGame({ rng: random, seedQueue: queue.length ? queue : undefined });
      return wrapC(g);
    },
  };
  function wrapC(g) {
    return {
      g,
      get active() { const p = g.activePiece; return p && { type: p.type, rotation: p.rotation, x: p.x, y: p.y }; },
      setActive(type, rotation, x, y) { g.activePiece = { type, rotation, x, y }; },
      cell(x, y) { return y < 0 ? '(no buffer storage)' : g.board[y][x]; },
      fill(x, y, v = 'Z') { g.board[y][x] = v; },
      clearBoard() { for (const r of g.board) r.fill(null); },
      left: () => g.moveLeft(), right: () => g.moveRight(),
      cw: () => g.rotate(1), ccw: () => g.rotate(-1),
      soft: () => g.softDrop(),
      hard: () => g.hardDrop(),
      hold: () => g.hold(),
      tick: (ms) => g.tick(ms),
      ghostY: () => g.getGhostY(),
      get score() { return g.score; }, set score(v) { g.score = v; },
      get level() { return g.level; }, set level(v) { g.level = v; },
      get lines() { return g.lines; }, set lines(v) { g.lines = v; },
      get over() { return g.gameOver; },
      get held() { return g.holdPiece; },
      get canHold() { return g.canHold; },
      get queue() { return g.nextQueue.slice(0, 5); },
      restart: () => g.restart(),
      boardEmpty() { return g.board.every(r => r.every(c => c === null)); },
    };
  }

  // Raw shape accessors for the 28-state comparison (cells relative to the engine's own origin).
  const shapes = {
    'run-a': (t, r) => A.shape(t, r).map(p => [p.x, p.y]),
    'run-b': (t, r) => Bg && null,
    'run-c': null,
  };
  const Bp = await imp(join(tmp, 'run-b'), 'dist/pieces.js');
  const Ct = await imp(join(tmp, 'run-c'), 'dist/tetrominoes.js');
  shapes['run-b'] = (t, r) => Bp.SHAPES[t][r].map(([x, y]) => [x, y]);
  shapes['run-c'] = (t, r) => Ct.SHAPES[t][r].map(p => [p.x, p.y]);

  return { adapters: [runA, runB, runC], shapes, modules: { A, Bg, Bb, Br, Bp, C, Ct } };
}
