import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game, emptyBoard, HIDDEN_ROWS, LOCK_DELAY, MAX_LOCK_RESETS, TOTAL_ROWS, WIDTH } from '../dist/game.js';
import { cells, COLORS, SevenBag, TYPES } from '../dist/pieces.js';
import { scoreClear } from '../dist/scoring.js';

function fresh(type = 'T') {
  const game = new Game(() => 0.42);
  game.start();
  game.active = { type, rotation: 0, x: 3, y: 22 };
  return game;
}
function tetrisWell(game, perfect = false) {
  game.board = emptyBoard();
  if (!perfect) game.board[25][0] = 'J';
  for (let y = 36; y < TOTAL_ROWS; y++) game.board[y].fill('J');
  for (let y = 36; y < TOTAL_ROWS; y++) game.board[y][4] = null;
  game.active = { type: 'I', rotation: 1, x: 2, y: 36 };
}

test('seven-bag supplies each piece once per bag and has seven distinct colors', () => {
  let seed = 1234;
  const bag = new SevenBag(() => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646);
  for (let i = 0; i < 100; i++) {
    assert.deepEqual(Array.from({ length: 7 }, () => bag.next()).sort(), [...TYPES].sort());
  }
  assert.equal(new Set(Object.values(COLORS)).size, 7);
});

test('starts with a 10×20 field, 20 buffer rows, and five previews', () => {
  const game = new Game();
  assert.equal(game.status, 'ready');
  game.start();
  assert.equal(game.status, 'playing');
  assert.equal(game.board.length, 40);
  assert.ok(game.board.every(row => row.length === 10));
  assert.equal(game.queue.length, 5);
  assert.equal(game.active.x, 3);
  assert.equal(game.active.y, HIDDEN_ROWS - 1);
});

test('movement stops at walls and settled blocks', () => {
  const game = fresh('O');
  for (let i = 0; i < 20; i++) game.move(-1);
  assert.equal(Math.min(...cells(game.active).map(([x]) => x)), 0);
  assert.equal(game.move(-1), false);
  for (let i = 0; i < 20; i++) game.move(1);
  assert.equal(Math.max(...cells(game.active).map(([x]) => x)), WIDTH - 1);
  game.board[22][7] = 'J';
  assert.equal(game.move(-1), false);
});

test('four rotations restore every piece and opposite rotations reverse each other', () => {
  for (const type of TYPES) {
    const game = fresh(type);
    const original = { ...game.active };
    for (let i = 0; i < 4; i++) assert.equal(game.rotate(1), true);
    assert.deepEqual(game.active, original);
    game.rotate(-1);
    game.rotate(1);
    assert.deepEqual(game.active, original);
  }
});

test('SRS kicks a T off the left wall and floor', () => {
  const game = fresh();
  game.active = { type: 'T', rotation: 1, x: -1, y: 24 };
  assert.equal(game.collides(game.active), false);
  assert.equal(game.rotate(-1), true);
  assert.deepEqual(game.active, { type: 'T', rotation: 0, x: 0, y: 24 });
  game.active = { type: 'T', rotation: 0, x: 3, y: 38 };
  assert.equal(game.rotate(1), true);
  assert.deepEqual(game.active, { type: 'T', rotation: 1, x: 2, y: 37 });
});

test('I uses its own fifth floor kick', () => {
  const game = fresh('I');
  game.active.y = 38;
  assert.equal(game.rotate(1), true);
  assert.deepEqual(game.active, { type: 'I', rotation: 1, x: 4, y: 36 });
});

test('an obstructed rotation leaves the piece unchanged', () => {
  const game = fresh();
  for (let y = 19; y < 29; y++) game.board[y].fill('J');
  for (const [x, y] of cells(game.active)) game.board[y][x] = null;
  const original = { ...game.active };
  assert.equal(game.rotate(1), false);
  assert.deepEqual(game.active, original);
});

test('ghost stops above the stack; hard drop lands there and scores two points per cell', () => {
  const game = fresh('O');
  game.board[34][4] = 'J';
  const ghost = game.ghost();
  assert.equal(ghost.y, 32);
  assert.equal(game.active.y, 22);
  game.hardDrop();
  assert.equal(game.score, 20);
  for (const [x, y] of cells(ghost)) assert.equal(game.board[y][x], 'O');
  assert.equal(game.piecesPlaced, 1);
  assert.equal(game.queue.length, 5);
});

test('soft drop scores one point per cell and never locks immediately', () => {
  const game = fresh('O');
  game.active.y = 37;
  assert.equal(game.softDrop(), true);
  assert.equal(game.score, 1);
  assert.equal(game.softDrop(), false);
  assert.equal(game.piecesPlaced, 0);
  game.tick(499, true);
  assert.equal(game.piecesPlaced, 0);
  game.tick(1, true);
  assert.equal(game.piecesPlaced, 1);
});

test('hold is limited to once per piece, and swapping restores spawn orientation', () => {
  const game = fresh();
  const incoming = game.queue[0];
  game.rotate(1);
  assert.equal(game.hold(), true);
  assert.equal(game.held, 'T');
  assert.equal(game.active.type, incoming);
  const queue = [...game.queue];
  assert.equal(game.hold(), false);
  assert.deepEqual(game.queue, queue);
  game.hardDrop();
  const outgoing = game.active.type;
  const beforeSwap = [...game.queue];
  assert.equal(game.hold(), true);
  assert.equal(game.active.type, 'T');
  assert.equal(game.active.rotation, 0);
  assert.equal(game.active.x, 3);
  assert.equal(game.held, outgoing);
  assert.deepEqual(game.queue, beforeSwap);
});

test('gravity follows elapsed time and soft drop is twenty times faster', () => {
  const game = fresh();
  game.tick(999);
  assert.equal(game.active.y, 22);
  game.tick(1);
  assert.equal(game.active.y, 23);
  assert.equal(game.score, 0);
  game.tick(100, true);
  assert.equal(game.active.y, 25);
  assert.equal(game.score, 2);
  game.start(15);
  assert.ok(Math.abs(game.gravityMs - 7.0586162209) < .0001);
});

test('landing partway through a tick starts lock delay at the moment of contact', () => {
  const game = fresh('O');
  game.active.y = 37;
  game.tick(750);
  game.tick(500);
  assert.equal(game.active.y, 38);
  assert.equal(game.piecesPlaced, 0);
  game.tick(249);
  assert.equal(game.piecesPlaced, 0);
  game.tick(1);
  assert.equal(game.piecesPlaced, 1);
});

test('grounded moves reset lock delay only fifteen times', () => {
  const game = fresh('O');
  game.active.y = 38;
  for (let i = 0; i < MAX_LOCK_RESETS; i++) {
    game.tick(400);
    assert.equal(game.move(i % 2 ? -1 : 1), true);
    assert.equal(game.piecesPlaced, 0);
  }
  game.tick(400);
  game.move(-1);
  game.tick(99);
  assert.equal(game.piecesPlaced, 0);
  game.tick(1);
  assert.equal(game.piecesPlaced, 1);
});

test('blocked input cannot reset the lock timer', () => {
  const game = fresh('O');
  game.active = { type: 'O', rotation: 0, x: -1, y: 38 };
  game.tick(400);
  assert.equal(game.move(-1), false);
  game.tick(100);
  assert.equal(game.piecesPlaced, 1);
});

test('line clears collapse rows, award combos and back-to-back Tetrises', () => {
  const game = fresh();
  tetrisWell(game);
  game.hardDrop();
  assert.equal(game.lines, 4);
  assert.equal(game.score, 800);
  assert.equal(game.board[29][0], 'J');
  assert.equal(game.combo, 0);
  assert.equal(game.backToBack, true);
  tetrisWell(game);
  game.hardDrop();
  assert.equal(game.lines, 8);
  assert.equal(game.score, 800 + 1200 + 50);
  assert.equal(game.combo, 1);
  assert.equal(game.board.length, 40);
});

test('perfect-clear bonuses add to line scores', () => {
  const game = fresh();
  tetrisWell(game, true);
  game.hardDrop();
  assert.equal(game.score, 2800);
  assert.equal(game.lastClear.label, 'Perfect clear');
  tetrisWell(game, true);
  game.hardDrop();
  assert.equal(game.score, 2800 + 1200 + 3200 + 50);
});

test('level increases every ten lines, scores at the old level, and caps at fifteen', () => {
  const game = fresh();
  game.lines = 8;
  tetrisWell(game);
  game.hardDrop();
  assert.equal(game.level, 2);
  assert.equal(game.score, 800);
  assert.ok(game.gravityMs < 1000);
  game.lines = 148;
  tetrisWell(game);
  game.hardDrop();
  assert.equal(game.level, 15);
  assert.equal(game.lines, 152);
  game.start(5);
  assert.equal(game.level, 5);
  tetrisWell(game);
  game.hardDrop();
  assert.equal(game.level, 5);
});

test('scoring handles all clears, T-spin minis, combos, and chain breaks', () => {
  for (const [lines, base] of [0, 100, 300, 500, 800].entries()) {
    assert.equal(scoreClear(lines, 'none', 3, -1, false, false).points, base * 3);
  }
  for (const [lines, base] of [400, 800, 1200, 1600].entries()) {
    assert.equal(scoreClear(lines, 'full', 2, -1, false, false).points, base * 2);
  }
  for (const [lines, base] of [100, 200, 400].entries()) {
    assert.equal(scoreClear(lines, 'mini', 1, -1, false, false).points, base);
  }
  assert.equal(scoreClear(0, 'none', 1, 2, true, false).backToBack, true);
  assert.equal(scoreClear(0, 'full', 1, 2, true, false).points, 400);
  assert.equal(scoreClear(0, 'full', 1, 2, true, false).combo, -1);
  assert.equal(scoreClear(1, 'none', 1, 2, true, false).backToBack, false);
  assert.equal(scoreClear(2, 'full', 2, 1, true, false).points, 3800);
});

test('three occupied corners plus a final rotation distinguish full T-spins and minis', () => {
  for (const full of [true, false]) {
    const game = fresh();
    game.active = { type: 'T', rotation: 3, x: 3, y: 37 };
    game.board[37][3] = 'J';
    game.board[39][3] = 'J';
    game.board[full ? 37 : 39][5] = 'J';
    assert.equal(game.rotate(1), true);
    assert.equal(game.active.rotation, 0);
    assert.equal(game.grounded, true);
    game.hardDrop();
    assert.equal(game.score, full ? 400 : 100);
    assert.equal(game.lastClear.label, full ? 'T-spin' : 'Mini T-spin');
  }
});

test('a successful translation after rotation cancels T-spin credit', () => {
  const game = fresh();
  game.active = { type: 'T', rotation: 3, x: 3, y: 36 };
  assert.equal(game.rotate(1), true);
  assert.equal(game.softDrop(), true);
  game.board[37][3] = game.board[37][5] = game.board[39][3] = 'J';
  game.hardDrop();
  assert.equal(game.score, 1);
  assert.equal(game.lastClear.label, '');
});

test('a T-spin single clears its row and awards the spin score', () => {
  const game = fresh();
  game.active = { type: 'T', rotation: 3, x: 3, y: 37 };
  game.board[37][3] = game.board[37][5] = game.board[39][3] = 'J';
  game.board[38].fill('J');
  for (const x of [3, 4, 5]) game.board[38][x] = null;
  assert.equal(game.rotate(1), true);
  game.hardDrop();
  assert.equal(game.score, 800);
  assert.equal(game.lines, 1);
  assert.equal(game.backToBack, true);
  assert.equal(game.lastClear.label, 'T-spin Single');
});

test('blocked spawns and blocked hold spawns end the game', () => {
  for (const useHold of [false, true]) {
    const game = fresh('O');
    game.board[18][4] = 'J';
    if (useHold) { game.held = 'T'; game.hold(); }
    else { game.queue[0] = 'T'; game.hardDrop(); }
    assert.equal(game.status, 'over');
    assert.equal(game.active, null);
    assert.equal(game.move(1), false);
  }
});

test('a piece locking completely in the hidden rows tops out', () => {
  const game = fresh('O');
  game.active.y = 18;
  game.board[20][4] = game.board[20][5] = 'J';
  game.tick(LOCK_DELAY);
  assert.equal(game.status, 'over');
});

test('pause freezes time and input; restart resets all session state', () => {
  const game = fresh();
  game.softDrop();
  game.hold();
  game.pause();
  const piece = { ...game.active };
  game.tick(1000);
  game.hardDrop();
  assert.equal(game.rotate(1), false);
  assert.equal(game.hold(), false);
  assert.deepEqual(game.active, piece);
  assert.equal(game.elapsed, 0);
  game.pause();
  assert.equal(game.status, 'playing');
  game.start();
  assert.equal(game.score, 0);
  assert.equal(game.lines, 0);
  assert.equal(game.held, null);
  assert.equal(game.canHold, true);
  assert.equal(game.combo, -1);
  assert.equal(game.backToBack, false);
  assert.ok(game.board.every(row => row.every(cell => cell === null)));
});

test('randomized play preserves board and active-piece invariants', () => {
  let seed = 7;
  const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const game = new Game(random);
  game.start();
  const actions = [() => game.move(-1), () => game.move(1), () => game.rotate(-1), () => game.rotate(1), () => game.hold(), () => game.hardDrop(), () => game.softDrop(), () => game.tick(100)];
  for (let i = 0; i < 5000; i++) {
    if (game.status === 'over') game.start();
    actions[Math.floor(random() * actions.length)]();
    assert.equal(game.board.length, TOTAL_ROWS);
    assert.ok(game.board.every(row => row.length === WIDTH));
    assert.ok(Number.isSafeInteger(game.score) && game.score >= 0);
    if (game.active) assert.equal(game.collides(game.active), false);
    assert.equal(game.queue.length, 5);
  }
});
