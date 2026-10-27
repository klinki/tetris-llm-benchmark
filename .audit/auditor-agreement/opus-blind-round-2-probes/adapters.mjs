// Engine adapters for the five runs. Each adapter exposes the same API in
// "visible" coordinates: x 0..9, y 0..19 (y < 0 = hidden buffer rows), piece
// position = top-left of the canonical SRS bounding box (3x3 JLSTZ, 4x4 I/O).
// Usage: makeAdapter(letter, absolutePathToBuiltTempCopy)
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const FRAME = 1000 / 60;
const ROT_A = ['cw', 'ccw'];

export async function makeAdapter(letter, root) {
  const imp = (p) => import(pathToFileURL(path.join(root, p)).href);
  if (letter === 'a') {
    const { Game } = await imp('dist/game.js');
    const { cellsOf } = await imp('dist/tetromino.js');
    const H = 2;
    let g = new Game();
    const ox = (t) => (t === 'O' ? 1 : 0); // run-a O uses a 2x2 box
    return {
      H, name: 'run-a',
      reset() { g = new Game(); },
      get g() { return g; },
      clear() { g.field.reset(); },
      fill(x, y, t = 'Z') { g.field.cells[y + H][x] = t; },
      cell(x, y) { return g.field.cells[y + H][x]; },
      setPiece(type, rot, x, y) { g.piece = { type, rot, x: x + ox(type), y: y + H }; },
      piece() { const p = g.piece; return p && { type: p.type, rot: p.rot, x: p.x - ox(p.type), y: p.y - H }; },
      cells() { const p = g.piece; return cellsOf(p.type, p.rot).map(([dx, dy]) => [p.x + dx, p.y + dy - H]); },
      rotate(d) { return g.rotate(d > 0 ? 'cw' : 'ccw'); },
      move(d) { return g.move(d); },
      hardDrop() { g.hardDrop(); },
      hold() { return g.holdPiece(); },
      step(ms) { let t = ms; while (t > 1e-9) { const dt = Math.min(FRAME, t); g.update(dt); t -= dt; } },
      softDrop(on) { g.softDrop = on; },
      get score() { return g.score; }, set score(v) { g.score = v; },
      get lines() { return g.lines; }, set lines(v) { g.lines = v; },
      get level() { return g.level; }, set level(v) { g.level = v; },
      over() { return g.state === 'over'; },
      restart() { g.restart(); },
      queue() { return [...g.nextQueue]; },
      held() { return g.hold; },
      filled() { return g.field.cells.flat().filter(Boolean).length; },
      ghostY() { const gp = g.ghost(); return gp && gp.y - H; },
    };
  }
  if (letter === 'b') {
    const { Game, COLS } = await imp('dist/game.js');
    const { SHAPES } = await imp('dist/pieces.js');
    const H = 2;
    let g = new Game();
    return {
      H, name: 'run-b',
      reset() { g = new Game(); }, get g() { return g; },
      clear() { g.board.fill(null); },
      fill(x, y, t = 'Z') { g.board[(y + H) * COLS + x] = t; },
      cell(x, y) { return g.board[(y + H) * COLS + x]; },
      setPiece(type, rot, x, y) { g.active = { type, rot, x, y: y + H }; },
      piece() { const p = g.active; return { type: p.type, rot: p.rot, x: p.x, y: p.y - H }; },
      cells() { return g.cellsOf(g.active).map(([x, y]) => [x, y - H]); },
      rotate(d) { return g.rotate(d > 0 ? 1 : -1); },
      move(d) { return d < 0 ? g.moveLeft() : g.moveRight(); },
      hardDrop() { g.hardDrop(); }, hold() { const before = g.held; const a = g.active.type; g.hold(); return g.held !== before || g.active.type !== a; },
      step(ms) { let t = ms; while (t > 1e-9) { const dt = Math.min(FRAME, t); g.update(dt); t -= dt; } },
      softDrop(on) { g.softDrop = on; },
      get score() { return g.score; }, set score(v) { g.score = v; },
      get lines() { return g.lines; }, set lines(v) { g.lines = v; },
      get level() { return g.level; }, set level(v) { g.level = v; },
      over() { return g.gameOver; }, restart() { g.restart(); },
      queue() { return [...g.queue]; }, held() { return g.held; },
      filled() { return g.board.filter(Boolean).length; },
      ghostY() { return g.ghost().y - H; },
    };
  }
  if (letter === 'c') {
    const require = createRequire(path.join(root, 'package.json'));
    const { Game } = require(path.join(root, 'dist/game.js'));
    const H = 0;
    let g = new Game();
    let softOn = false, softAcc = 0;
    return {
      H, name: 'run-c',
      reset() { g = new Game(); }, get g() { return g; },
      clear() { g.board = Array.from({ length: 20 }, () => Array(10).fill(null)); },
      fill(x, y, t = 'Z') { g.board[y][x] = t; },
      cell(x, y) { return g.board[y][x]; },
      setPiece(type, rot, x, y) { g.current = { kind: type, rotation: rot, x, y }; },
      piece() { const p = g.current; return { type: p.kind, rot: p.rotation, x: p.x, y: p.y }; },
      cells() { return g.cells(); },
      rotate(d) { return g.rotate(d > 0 ? 1 : -1); },
      move(d) { return g.move(d, 0); },
      hardDrop() { g.hardDrop(); }, hold() { const b = g.held, a = g.current.kind; g.hold(); return g.held !== b || g.current.kind !== a; },
      // Mirrors src/main.ts: one row on keydown, then one row per 50 ms while held.
      step(ms) { let t = ms; while (t > 1e-9) { const dt = Math.min(FRAME, t); if (softOn) { softAcc += dt; while (softAcc >= 50) { g.move(0, 1, true); softAcc -= 50; } } else softAcc = 0; g.tick(dt); t -= dt; } },
      softDrop(on) { if (on && !softOn) g.move(0, 1, true); softOn = on; },
      get score() { return g.score; }, set score(v) { g.score = v; },
      get lines() { return g.lines; }, set lines(v) { g.lines = v; },
      get level() { return g.level; }, set level(v) { g.level = v; },
      over() { return g.over; }, restart() { g.reset(); },
      queue() { return [...g.queue]; }, held() { return g.held; },
      filled() { return g.board.flat().filter(Boolean).length; },
      ghostY() { return g.ghost().y; },
    };
  }
  if (letter === 'd') {
    const { Game } = await imp('dist/game.js');
    const { cellsOf } = await imp('dist/pieces.js');
    const H = 20;
    let g = new Game();
    return {
      H, name: 'run-d',
      reset() { g = new Game(); }, get g() { return g; },
      clear() { g.board.reset(); },
      fill(x, y, t = 'Z') { g.board.set(x, y + H, t); },
      cell(x, y) { return g.board.get(x, y + H); },
      setPiece(type, rot, x, y) { g.current = { type, rot, x, y: y + H }; },
      piece() { const p = g.current; return p && { type: p.type, rot: p.rot, x: p.x, y: p.y - H }; },
      cells() { const p = g.current; return cellsOf(p.type, p.rot).map(([dx, dy]) => [p.x + dx, p.y + dy - H]); },
      rotate(d) { return g.rotate(d > 0 ? 1 : -1); },
      move(d) { return g.moveHorizontal(d); },
      hardDrop() { g.hardDrop(); }, hold() { const b = g.hold, a = g.current?.type; g.holdPiece(); return g.hold !== b || g.current?.type !== a; },
      step(ms) { let t = ms; while (t > 1e-9) { const dt = Math.min(FRAME, t); g.update(dt / 1000); t -= dt; } },
      softDrop(on) { g.setSoftDrop(on); },
      get score() { return g.score; }, set score(v) { g.score = v; },
      get lines() { return g.lines; }, set lines(v) { g.lines = v; },
      get level() { return g.level; }, set level(v) { g.level = v; },
      over() { return g.gameOver; }, restart() { g.restart(); },
      queue() { return g.peekNext(6); }, held() { return g.hold; },
      filled() { return g.board.filledCells(); },
      ghostY() { return g.ghostY() - H; },
    };
  }
  if (letter === 'e') {
    const { TetrisGame, cellsFor, createEmptyBoard } = await imp('dist/game.js');
    const H = 4;
    let g = new TetrisGame();
    // Mirrors src/main.ts repeat: action on keydown, 140 ms delay, then every 45 ms.
    let rep = null, repDelay = 0, repInt = 0;
    return {
      H, name: 'run-e',
      reset() { g = new TetrisGame(); }, get g() { return g; },
      clear() { g.board = createEmptyBoard(); },
      fill(x, y, t = 'Z') { g.board[y + H][x] = t; },
      cell(x, y) { return g.board[y + H][x]; },
      setPiece(type, rot, x, y) { g.active = { type, rotation: rot, x, y: y + H }; },
      piece() { const p = g.active; return { type: p.type, rot: p.rotation, x: p.x, y: p.y - H }; },
      cells() { return cellsFor(g.active).map(({ x, y }) => [x, y - H]); },
      rotate(d) { return g.rotate(d > 0 ? 1 : -1); },
      move(d) { return g.move(d); },
      hardDrop() { g.hardDrop(); }, hold() { return g.hold(); },
      step(ms) { let t = ms; while (t > 1e-9) { const dt = Math.min(FRAME, t); g.update(dt); if (rep) { repDelay -= dt; if (repDelay <= 0) { repInt -= dt; if (repInt <= 0) { rep(); repInt = 45; } } } t -= dt; } },
      softDrop(on) { if (on) { rep = () => g.softDrop(); rep(); repDelay = 140; repInt = 0; } else rep = null; },
      get score() { return g.score; }, set score(v) { g.score = v; },
      get lines() { return g.lines; }, set lines(v) { g.lines = v; },
      get level() { return g.level; }, set level(v) { g.level = v; },
      over() { return g.status === 'over'; }, restart() { g.restart(); },
      queue() { return [...g.next]; }, held() { return g.held; },
      filled() { return g.board.flat().filter(Boolean).length; },
      ghostY() { return g.getGhostY() - H; },
    };
  }
  throw new Error('unknown run ' + letter);
}
void ROT_A;
