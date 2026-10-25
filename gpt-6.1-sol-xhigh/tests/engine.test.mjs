import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game, HEIGHT, HIDDEN, WIDTH, LOCK_DELAY, MAX_LOCK_RESETS } from '../dist/engine.js';
import { Bag, KINDS, cells, shape } from '../dist/pieces.js';
import { KEYS, Input } from '../dist/input.js';

function playing() { const game = new Game(() => .42); game.start(); return game; }
function set(game, x, y, kind = 'J') { game.board[y + HIDDEN][x] = kind; }
function empty(game) { game.board.forEach(row => row.fill(null)); }
function occupied(game) { return game.board.flat().filter(Boolean).length; }
function prepareTetris(game, perfect = false) {
  empty(game);
  for (let y = 16; y < 20; y++) for (let x = 0; x < WIDTH; x++) if (x !== 4) set(game, x, y);
  if (!perfect) set(game, 0, 15);
  game.active = { kind: 'I', rotation: 1, x: 2, y: 16 };
}
function single(game) {
  empty(game);
  for (let x = 0; x < WIDTH; x++) if (x !== 4 && x !== 5) set(game, x, 19);
  game.active = { kind: 'O', rotation: 0, x: 3, y: 18 };
  game.hardDrop();
}

test('board has ten columns, twenty visible rows, and twenty hidden rows', () => {
  const game = new Game();
  assert.equal(game.board.length, HEIGHT + HIDDEN);
  assert.ok(game.board.every(row => row.length === WIDTH));
  assert.equal(game.phase, 'ready');
  assert.equal(game.active, null);
});
test('each of 100 bags contains exactly seven different pieces', () => {
  let seed = 3;
  const bag = new Bag(() => ((seed = seed * 16807 % 2147483647) - 1) / 2147483646);
  for (let b = 0; b < 100; b++) assert.deepEqual(Array.from({ length: 7 }, () => bag.next()).sort(), [...KINDS].sort());
});
test('all seven pieces contain four distinct cells in all rotation states', () => {
  for (const kind of KINDS) for (let rotation = 0; rotation < 4; rotation++) {
    assert.equal(shape(kind, rotation).length, 4);
    assert.equal(new Set(shape(kind, rotation).map(String)).size, 4);
  }
});
test('start spawns a valid piece and maintains a preview queue', () => {
  const game = playing();
  assert.equal(game.phase, 'playing');
  assert.ok(game.active && game.fits(game.active));
  assert.ok(game.queue.length >= 5);
});
test('movement respects walls and occupied cells', () => {
  const game = playing();
  game.active = { kind: 'O', rotation: 0, x: -1, y: 5 };
  assert.equal(game.move(-1), false);
  assert.equal(game.move(1), true);
  set(game, 3, 5);
  assert.equal(game.move(1), false);
  assert.equal(game.active.x, 0);
});
test('four clockwise turns and inverse turns preserve piece geometry', () => {
  for (const kind of KINDS) {
    const game = playing();
    game.active = { kind, rotation: 0, x: 3, y: 5 };
    const before = cells(game.active);
    for (let i = 0; i < 4; i++) assert.ok(game.rotate(1));
    assert.deepEqual(cells(game.active), before);
    game.rotate(-1); game.rotate(1);
    assert.deepEqual(cells(game.active), before);
  }
});
test('JLSTZ SRS kicks out of the left wall', () => {
  const game = playing();
  game.active = { kind: 'T', rotation: 1, x: -1, y: 5 };
  assert.ok(game.fits(game.active));
  assert.ok(game.rotate(-1));
  assert.equal(game.active.rotation, 0);
  assert.equal(game.active.x, 0);
});
test('I uses its distinct two-cell SRS wall kick', () => {
  const game = playing();
  game.active = { kind: 'I', rotation: 1, x: -2, y: 5 };
  assert.ok(game.fits(game.active));
  assert.ok(game.rotate(-1));
  assert.equal(game.active.x, 0);
});
test('T rotates off the floor using SRS', () => {
  const game = playing();
  game.active = { kind: 'T', rotation: 0, x: 3, y: 18 };
  assert.ok(game.rotate(1));
  assert.equal(game.active.y, 17);
  assert.equal(game.active.x, 2);
  assert.ok(game.fits(game.active));
});
test('rotation fails when every kick position is obstructed', () => {
  const game = playing();
  game.active = { kind: 'T', rotation: 0, x: 3, y: 5 };
  for (let y = 2; y < 11; y++) for (let x = 0; x < WIDTH; x++) set(game, x, y);
  for (const [x, y] of cells(game.active)) set(game, x, y, null);
  const before = { ...game.active };
  assert.equal(game.rotate(1), false);
  assert.deepEqual(game.active, before);
});
test('ghost lands at the first supporting surface without changing state', () => {
  const game = playing();
  game.active = { kind: 'O', rotation: 0, x: 3, y: 0 };
  set(game, 4, 15);
  const before = { ...game.active };
  assert.equal(game.ghost().y, 13);
  assert.deepEqual(game.active, before);
});
test('hard drop locks immediately and awards two points per cell', () => {
  const game = playing();
  game.active = { kind: 'O', rotation: 0, x: 3, y: 0 };
  game.hardDrop();
  assert.equal(game.score, 36);
  assert.equal(game.pieces, 1);
  assert.equal(occupied(game), 4);
  assert.equal(game.cell(4, 19), 'O');
});
test('soft drop awards one point per cell and does not lock on contact', () => {
  const game = playing();
  game.active = { kind: 'O', rotation: 0, x: 3, y: 17 };
  assert.ok(game.softDrop());
  assert.equal(game.score, 1);
  assert.equal(game.softDrop(), false);
  assert.equal(game.pieces, 0);
});
test('hold is available only once per piece and resets swapped orientation', () => {
  const game = playing();
  const first = game.active.kind;
  assert.ok(game.hold());
  assert.equal(game.held, first);
  assert.equal(game.hold(), false);
  game.hardDrop();
  game.rotate(1);
  const second = game.active.kind;
  assert.ok(game.hold());
  assert.equal(game.held, second);
  assert.equal(game.active.kind, first);
  assert.equal(game.active.rotation, 0);
  assert.equal(game.canHold, false);
});
test('gravity descends once per second at level one without awarding points', () => {
  const game = playing();
  const y = game.active.y;
  game.update(999);
  assert.equal(game.active.y, y);
  game.update(1);
  assert.equal(game.active.y, y + 1);
  assert.equal(game.score, 0);
});
test('gravity increases and caps at twenty cells per frame', () => {
  const game = playing();
  let previous = game.gravityInterval;
  for (let level = 2; level <= 20; level++) {
    game.level = level;
    assert.ok(game.gravityInterval <= previous);
    assert.ok(game.gravityInterval >= 1000 / 1200);
    previous = game.gravityInterval;
  }
  game.level = 100;
  assert.equal(game.gravityInterval, 1000 / 1200);
});
test('grounded pieces wait 500 milliseconds before locking', () => {
  const game = playing();
  game.active = { kind: 'O', rotation: 0, x: 3, y: 18 };
  game.update(LOCK_DELAY - 1);
  assert.equal(game.pieces, 0);
  game.update(1);
  assert.equal(game.pieces, 1);
});
test('successful ground movement resets the lock delay', () => {
  const game = playing();
  game.active = { kind: 'O', rotation: 0, x: 3, y: 18 };
  game.update(400);
  game.move(1);
  game.update(400);
  assert.equal(game.pieces, 0);
  game.update(100);
  assert.equal(game.pieces, 1);
});
test('lock delay can only be reset fifteen times', () => {
  const game = playing();
  game.active = { kind: 'O', rotation: 0, x: 3, y: 18 };
  for (let i = 0; i < MAX_LOCK_RESETS; i++) { game.update(400); game.move(i % 2 ? -1 : 1); }
  game.update(400);
  game.move(-1);
  game.update(100);
  assert.equal(game.pieces, 1);
});
test('blocked movements do not reset lock delay', () => {
  const game = playing();
  game.active = { kind: 'O', rotation: 0, x: -1, y: 18 };
  game.update(400);
  assert.equal(game.move(-1), false);
  game.update(100);
  assert.equal(game.pieces, 1);
});
test('clearing a single scores 100 and shifts the board', () => {
  const game = playing();
  single(game);
  assert.equal(game.lines, 1);
  assert.equal(game.score, 100);
  assert.equal(game.event.label, 'SINGLE');
  assert.equal(occupied(game), 2);
  assert.equal(game.cell(4, 19), 'O');
});
test('Tetris, back-to-back, and combo points use the current level', () => {
  const game = playing();
  prepareTetris(game);
  game.hardDrop();
  assert.equal(game.score, 800);
  assert.equal(game.backToBack, true);
  prepareTetris(game);
  game.hardDrop();
  assert.equal(game.score, 800 + 1200 + 50);
  assert.equal(game.event.backToBack, true);
  assert.equal(game.event.combo, 1);
});
test('no-clear placements keep back-to-back but break combos', () => {
  const game = playing();
  prepareTetris(game); game.hardDrop();
  game.hardDrop();
  assert.equal(game.backToBack, true);
  assert.equal(game.combo, -1);
  single(game);
  assert.equal(game.backToBack, false);
});
test('perfect clears award a bonus in addition to line-clear points', () => {
  const game = playing();
  prepareTetris(game, true); game.hardDrop();
  assert.equal(game.score, 2800);
  assert.equal(game.event.perfect, true);
  assert.equal(occupied(game), 0);
  prepareTetris(game, true); game.hardDrop();
  assert.equal(game.score, 2800 + 1200 + 3200 + 50);
});
test('level advances each ten lines and clear points use the old level', () => {
  const game = playing();
  game.lines = 9;
  single(game);
  assert.equal(game.level, 2);
  assert.equal(game.score, 100);
  single(game);
  assert.equal(game.score, 100 + (100 + 50) * 2);
});
test('three occupied T corners and a final rotation score a full T-spin', () => {
  const game = playing();
  game.active = { kind: 'T', rotation: 3, x: 3, y: 17 };
  set(game, 3, 17); set(game, 5, 17); set(game, 5, 19);
  assert.ok(game.rotate(1));
  assert.equal(game.active.rotation, 0);
  assert.ok(game.grounded);
  game.hardDrop();
  assert.equal(game.event.label, 'T-SPIN');
  assert.equal(game.score, 400);
});
test('a T-spin with only one occupied front corner is a mini', () => {
  const game = playing();
  game.active = { kind: 'T', rotation: 3, x: 3, y: 17 };
  set(game, 3, 17); set(game, 3, 19); set(game, 5, 19);
  assert.ok(game.rotate(1));
  game.hardDrop();
  assert.equal(game.event.label, 'MINI T-SPIN');
  assert.equal(game.score, 100);
});
test('a translation after rotation cancels T-spin recognition', () => {
  const game = playing();
  game.active = { kind: 'T', rotation: 3, x: 3, y: 17 };
  assert.ok(game.rotate(1));
  game.move(1); game.move(-1);
  set(game, 3, 17); set(game, 5, 17); set(game, 5, 19);
  game.hardDrop();
  assert.equal(game.event.label, '');
  assert.equal(game.score, 0);
});
test('a blocked next spawn ends the game', () => {
  const game = playing();
  game.queue[0] = 'O';
  set(game, 4, -1);
  game.active = { kind: 'I', rotation: 0, x: 0, y: 18 };
  game.hardDrop();
  assert.equal(game.phase, 'over');
});
test('hold also checks a blocked spawn', () => {
  const game = playing();
  game.held = 'O';
  set(game, 4, -1);
  game.hold();
  assert.equal(game.phase, 'over');
});
test('locking entirely in the hidden buffer tops out', () => {
  const game = playing();
  for (let x = 0; x < WIDTH; x++) set(game, x, 0);
  game.active = { kind: 'O', rotation: 0, x: 3, y: -2 };
  game.hardDrop();
  assert.equal(game.phase, 'over');
});
test('pause freezes gravity, time, and all piece actions', () => {
  const game = playing();
  const before = { ...game.active };
  game.pause(); game.update(10000);
  for (const action of [() => game.move(1), () => game.rotate(1), () => game.softDrop(), () => game.hardDrop(), () => game.hold()]) assert.equal(action(), false);
  assert.equal(game.elapsed, 0);
  assert.deepEqual(game.active, before);
  game.pause(); game.update(1000);
  assert.equal(game.active.y, before.y + 1);
});
test('restart clears the complete session state', () => {
  const game = playing();
  game.hold(); game.hardDrop(); game.update(50);
  game.phase = 'over'; game.start();
  assert.equal(game.score, 0); assert.equal(game.lines, 0);
  assert.equal(game.level, 1); assert.equal(game.held, null);
  assert.equal(game.elapsed, 0); assert.equal(game.event, null);
  assert.equal(game.canHold, true); assert.equal(occupied(game), 0);
  assert.equal(game.phase, 'playing');
});
test('all requested keyboard mappings are present', () => {
  assert.deepEqual([KEYS.ArrowLeft, KEYS.ArrowRight, KEYS.ArrowUp, KEYS.KeyX, KEYS.KeyZ, KEYS.ControlLeft, KEYS.ArrowDown, KEYS.Space, KEYS.KeyC, KEYS.KeyR], ['left', 'right', 'cw', 'cw', 'ccw', 'ccw', 'soft', 'hard', 'hold', 'restart']);
});
test('invalid elapsed times do not mutate the engine', () => {
  const game = playing();
  const before = { ...game.active };
  for (const delta of [0, -1, NaN, Infinity]) game.update(delta);
  assert.deepEqual(game.active, before);
  assert.equal(game.elapsed, 0);
});
test('game simulation is independent of display frame rate', () => {
  const a = playing(), b = playing();
  for (let i = 0; i < 600; i++) a.update(1000 / 60);
  for (let i = 0; i < 300; i++) b.update(1000 / 30);
  assert.deepEqual(a.active, b.active);
  assert.deepEqual(a.board, b.board);
  assert.equal(a.score, b.score);
});

test('keyboard input uses delayed auto-repeat and resets on blur', () => {
  const listeners = {};
  globalThis.window = { addEventListener(type, handler) { listeners[type] = handler; } };
  globalThis.document = { querySelectorAll() { return []; } };
  globalThis.HTMLElement = class {};
  const calls = [];
  const input = new Input(action => calls.push(action), () => false);
  const key = (code, repeat = false) => ({ code, repeat, preventDefault() {} });
  listeners.keydown(key('ArrowLeft'));
  listeners.keydown(key('ArrowLeft', true));
  input.update(139);
  assert.deepEqual(calls, ['left']);
  input.update(1);
  assert.deepEqual(calls, ['left', 'left']);
  input.update(70);
  assert.equal(calls.length, 4);
  listeners.blur(); input.update(1000);
  assert.equal(calls.length, 4);
  listeners.keydown(key('Space')); input.update(1000);
  assert.equal(calls.filter(action => action === 'hard').length, 1);
  delete globalThis.window; delete globalThis.document; delete globalThis.HTMLElement;
});
