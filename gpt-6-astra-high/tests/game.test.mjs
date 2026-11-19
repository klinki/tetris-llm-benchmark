import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, WIDTH, HEIGHT, HIDDEN, LOCK_DELAY, MAX_LOCK_RESETS } from '../dist/game.js';
import { cells, SevenBag, TYPES } from '../dist/pieces.js';

function fresh() { const game = new Game(() => 0.5); game.start(); return game; }
function empty(game) { game.board = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(null)); }
function place(game, type, x, y, rotation = 0) { game.active = { type, x, y, rotation }; }
function almostClear(game, count) {
  empty(game);
  // One survivor prevents perfect-clear bonuses from hiding ordinary scoring errors.
  game.board[HEIGHT - count - 2][0] = 'J';
  for (let y = HEIGHT - count; y < HEIGHT; y++) game.board[y].fill('J');
  if (count === 4) {
    for (let y = HEIGHT - count; y < HEIGHT; y++) game.board[y][5] = null;
    place(game, 'I', 3, HEIGHT - 4, 1);
  } else {
    for (let y = HEIGHT - count; y < HEIGHT; y++) { game.board[y][4] = null; game.board[y][5] = null; }
    place(game, 'O', 3, HEIGHT - 2);
  }
}

test('every seven-bag contains all seven shapes', () => {
  const bag = new SevenBag();
  for (let b = 0; b < 100; b++) assert.deepEqual(Array.from({ length: 7 }, () => bag.next()).sort(), [...TYPES].sort());
});

test('spawn has five previews, valid cells and a landing ghost', () => {
  const game = fresh();
  assert.equal(game.queue.length, 5);
  assert.ok(game.fits(game.active));
  assert.ok(game.fits(game.ghost()));
  assert.equal(game.fits({ ...game.ghost(), y: game.ghost().y + 1 }), false);
  assert.equal(game.board.length, 40);
});

test('all shapes rotate back to their original cells after four turns', () => {
  for (const type of TYPES) for (const direction of [-1, 1]) {
    const game = fresh();
    place(game, type, 3, 25);
    const original = cells(game.active).sort().toString();
    for (let i = 0; i < 4; i++) assert.ok(game.rotate(direction));
    assert.equal(cells(game.active).sort().toString(), original);
  }
});

test('horizontal moves stop at walls and occupied cells', () => {
  const game = fresh();
  place(game, 'O', -1, 30);
  assert.equal(game.move(-1), false);
  assert.equal(game.move(1), true);
  game.board[30][3] = 'Z';
  assert.equal(game.move(1), false);
});

test('SRS kicks T away from the left wall', () => {
  const game = fresh();
  place(game, 'T', -1, 25, 1);
  assert.ok(game.fits(game.active));
  assert.ok(game.rotate(-1));
  assert.equal(game.active.x, 0);
  assert.equal(game.active.rotation, 0);
});

test('SRS kicks I two columns away from the left wall', () => {
  const game = fresh();
  place(game, 'I', -2, 25, 1);
  assert.ok(game.fits(game.active));
  assert.ok(game.rotate(-1));
  assert.equal(game.active.x, 0);
});

test('SRS floor kick lifts a T and blocked rotations preserve the piece', () => {
  const game = fresh();
  place(game, 'T', 3, 38);
  assert.ok(game.rotate(1));
  assert.equal(game.active.y, 37);
  game.board.forEach(row => row.fill('J'));
  for (const [x, y] of cells(game.active)) game.board[y][x] = null;
  const before = { ...game.active };
  assert.equal(game.rotate(1), false);
  assert.deepEqual(game.active, before);
});

test('hold is limited to once per piece and swaps in spawn orientation', () => {
  const game = fresh();
  const first = game.active.type;
  const next = game.queue[0];
  game.rotate(1); game.hold();
  assert.equal(game.held, first);
  assert.equal(game.active.type, next);
  assert.equal(game.canHold, false);
  const afterHold = { ...game.active };
  game.hold(); assert.deepEqual(game.active, afterHold);
  game.hardDrop();
  assert.equal(game.canHold, true);
  const queue = [...game.queue];
  game.hold();
  assert.equal(game.active.type, first);
  assert.equal(game.active.rotation, 0);
  assert.deepEqual(game.queue, queue);
});

test('soft and hard drop points are based on actual distance', () => {
  const game = fresh();
  const y = game.active.y;
  assert.equal(game.softDrop(), true);
  assert.equal(game.active.y, y + 1);
  assert.equal(game.score, 1);
  const distance = game.ghost().y - game.active.y;
  game.hardDrop();
  assert.equal(game.score, 1 + 2 * distance);
  assert.equal(game.pieces, 1);
  assert.equal(game.board.flat().filter(Boolean).length, 4);
});

test('grounded piece waits 500ms; soft drop does not force lock', () => {
  const game = fresh();
  place(game, 'O', 3, 38);
  assert.equal(game.softDrop(), false);
  game.update(LOCK_DELAY - 1);
  assert.equal(game.pieces, 0);
  game.update(1);
  assert.equal(game.pieces, 1);
});

test('grounded movement resets lock delay only fifteen times', () => {
  const game = fresh();
  place(game, 'O', 3, 38);
  for (let i = 0; i < MAX_LOCK_RESETS; i++) {
    game.update(400);
    game.move(i % 2 ? -1 : 1);
    assert.equal(game.lockTime, 0);
  }
  assert.equal(game.lockResets, MAX_LOCK_RESETS);
  game.update(400);
  game.move(-1);
  assert.equal(game.lockTime, 400);
  game.update(100);
  assert.equal(game.pieces, 1);
});

test('gravity progresses with level and soft dropping is faster', () => {
  const game = fresh();
  const y = game.active.y;
  game.update(999); assert.equal(game.active.y, y);
  game.update(1); assert.equal(game.active.y, y + 1);
  game.update(100, true); assert.equal(game.active.y, y + 3);
  assert.equal(game.score, 2);
  game.lines = 10;
  assert.equal(game.level, 2);
  assert.ok(game.gravityInterval < 1000);
  game.lines = 10000;
  assert.ok(game.gravityInterval > 0);
});

test('single, double and Tetris scoring plus combo and back-to-back', () => {
  const game = fresh();
  almostClear(game, 4); game.hardDrop();
  assert.equal(game.score, 800);
  assert.equal(game.lines, 4);
  assert.equal(game.backToBack, true);
  almostClear(game, 4); game.hardDrop();
  assert.equal(game.score, 800 + 1200 + 50);
  almostClear(game, 1); game.hardDrop();
  assert.equal(game.score, 2050 + 100 + 100);
  assert.equal(game.backToBack, false);
  almostClear(game, 2); game.hardDrop();
  assert.equal(game.score, 2250 + 300 + 150);
  assert.equal(game.level, 2);
});

test('triple clear uses 500 points and pre-clear level', () => {
  const game = fresh();
  game.lines = 9;
  game.board[35][0] = 'J';
  for (let y = 37; y < 40; y++) { game.board[y].fill('J'); game.board[y][5] = null; }
  place(game, 'I', 3, 36, 1);
  game.hardDrop();
  assert.equal(game.score, 500);
  assert.equal(game.lines, 12);
  assert.equal(game.level, 2);
});

test('no clear resets combo but preserves back-to-back', () => {
  const game = fresh();
  almostClear(game, 4); game.hardDrop();
  empty(game); place(game, 'O', 0, 38); game.hardDrop();
  assert.equal(game.combo, -1);
  assert.equal(game.backToBack, true);
  almostClear(game, 4); game.hardDrop();
  assert.equal(game.score, 2000);
});

test('perfect-clear bonus is added to normal score', () => {
  const game = fresh();
  almostClear(game, 4);
  game.board[34][0] = null;
  game.hardDrop();
  assert.equal(game.score, 2800);
  assert.equal(game.lastClear, 'PERFECT CLEAR');
});

test('three occupied corners recognize full and mini T-spins', () => {
  for (const full of [true, false]) {
    const game = fresh();
    place(game, 'T', 3, 37, 3);
    // Final rotation faces up. Bottom corners are at the floor row.
    game.board[37][3] = 'J';
    game.board[39][3] = 'J';
    game.board[full ? 37 : 39][5] = 'J';
    assert.ok(game.rotate(1));
    assert.equal(game.active.y, 37);
    game.hardDrop();
    assert.equal(game.score, full ? 400 : 100);
    assert.equal(game.lastClear, full ? 'T-SPIN' : 'MINI T-SPIN');
  }
});

test('T-spin single scores 800 and starts back-to-back chain', () => {
  const game = fresh();
  place(game, 'T', 3, 37, 3);
  game.board[37][3] = game.board[37][5] = game.board[39][3] = 'J';
  game.board[38].fill('J');
  for (const x of [3, 4, 5]) game.board[38][x] = null;
  assert.ok(game.rotate(1));
  game.hardDrop();
  assert.equal(game.lines, 1);
  assert.equal(game.score, 800);
  assert.equal(game.backToBack, true);
});

test('blocked spawn, including a hold swap, causes game over', () => {
  const game = fresh();
  game.queue[0] = 'O';
  game.board[HIDDEN - 2][4] = 'Z';
  place(game, 'I', 0, 38);
  game.hardDrop();
  assert.equal(game.status, 'over');
  const other = fresh();
  other.held = 'O';
  other.board[HIDDEN - 2][4] = 'Z';
  other.hold();
  assert.equal(other.status, 'over');
});

test('locking entirely above the visible field tops out', () => {
  const game = fresh();
  place(game, 'O', 3, HIDDEN - 2);
  game.board[HIDDEN][4] = 'J';
  game.hardDrop();
  assert.equal(game.status, 'over');
});

test('pause blocks simulation and input; restart clears all round state', () => {
  const game = fresh();
  game.softDrop(); game.hold(); game.pause();
  const frozen = JSON.stringify(game);
  game.update(5000); game.move(1); game.rotate(1); game.softDrop(); game.hardDrop(); game.hold();
  assert.equal(JSON.stringify(game), frozen);
  game.start(); assert.equal(game.status, 'playing');
  game.status = 'over'; game.start();
  assert.equal(game.score, 0);
  assert.equal(game.lines, 0);
  assert.equal(game.held, null);
  assert.equal(game.elapsed, 0);
  assert.equal(game.pieces, 0);
  assert.equal(game.board.flat().filter(Boolean).length, 0);
});

test('deterministic random play preserves board and active-piece invariants', () => {
  let seed = 123456;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; };
  const game = new Game(random);
  game.start();
  const actions = [() => game.move(-1), () => game.move(1), () => game.rotate(-1), () => game.rotate(1), () => game.softDrop(), () => game.hold(), () => game.hardDrop(), () => game.update(100)];
  for (let i = 0; i < 5000; i++) {
    actions[Math.floor(random() * actions.length)]();
    assert.equal(game.board.length, HEIGHT);
    assert.ok(game.board.every(row => row.length === WIDTH));
    assert.equal(game.queue.length, 5);
    assert.ok(Number.isFinite(game.score));
    if (game.status === 'over') game.start();
    else assert.ok(game.fits(game.active));
  }
});
