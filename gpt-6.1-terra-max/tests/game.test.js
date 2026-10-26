import test from 'node:test';
import assert from 'node:assert/strict';
import { BUFFER, Game, HEIGHT, MAX_LOCK_RESETS, TYPES, WIDTH, pieceCells } from '../dist/game.js';

const emptyBoard = () => Array.from({length: HEIGHT + BUFFER}, () => Array(WIDTH).fill(null));
const fill = (game, x, y, type = 'Z') => { game.board[y + BUFFER][x] = type; };
const seeded = () => { let seed = 123456789; return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; }; };

test('each random bag has exactly one of each piece', () => {
  const game = new Game(seeded());
  const sequence = [];
  for (let i = 0; i < 21; i++) {
    sequence.push(game.active.type);
    game.board = emptyBoard();
    game.hardDrop();
  }
  for (let i = 0; i < sequence.length; i += 7) assert.deepEqual([...sequence.slice(i, i + 7)].sort(), [...TYPES].sort());
  assert.ok(game.queue.length >= 5);
});

test('SRS rotates around the correct centers and kicks pieces away from walls', () => {
  const game = new Game(seeded());
  game.active = {type: 'T', rotation: 1, x: -1, y: 5};
  assert.equal(game.collides(game.active), false);
  assert.equal(game.rotate(1), true);
  assert.equal(game.active.rotation, 2);
  assert.equal(game.active.x, 0);

  game.active = {type: 'I', rotation: 1, x: -2, y: 5};
  assert.equal(game.collides(game.active), false);
  assert.equal(game.rotate(-1), true);
  assert.equal(game.active.rotation, 0);
  assert.equal(game.active.x, 0);
  const before = pieceCells({type: 'O', rotation: 0, x: 3, y: 3});
  const after = pieceCells({type: 'O', rotation: 3, x: 3, y: 3});
  assert.deepEqual(after, before);
});

test('hold swaps at spawn orientation and is available once per lock', () => {
  const game = new Game(seeded());
  const first = game.active.type, second = game.queue[0];
  game.rotate(1);
  assert.equal(game.hold(), true);
  assert.equal(game.held, first);
  assert.equal(game.active.type, second);
  assert.equal(game.hold(), false);
  game.hardDrop();
  assert.equal(game.hold(), true);
  assert.equal(game.active.type, first);
  assert.equal(game.active.rotation, 0);
  assert.equal(game.active.x, 3);
});

test('ghost, soft drop and hard drop respect collisions and award drop points', () => {
  const game = new Game(seeded());
  game.active = {type: 'O', rotation: 0, x: 3, y: 0};
  assert.equal(game.ghost.y, 18);
  assert.equal(game.softDrop(), true);
  assert.equal(game.score, 1);
  assert.equal(game.hardDrop(), 17);
  assert.equal(game.score, 35);
  assert.equal(game.board[BUFFER + 19][4], 'O');
});

test('grounded pieces lock after 500ms, with at most 15 move resets', () => {
  const game = new Game(seeded());
  game.active = {type: 'O', rotation: 0, x: 3, y: 18};
  game.update(499);
  assert.equal(game.board[BUFFER + 19][4], null);
  assert.equal(game.move(-1), true);
  assert.equal(game.lockElapsed, 0);
  for (let i = 1; i < MAX_LOCK_RESETS; i++) assert.equal(game.move(i % 2 ? 1 : -1), true);
  assert.equal(game.lockResets, MAX_LOCK_RESETS);
  game.update(300);
  const nextDirection = game.active.x === 3 ? -1 : 1;
  assert.equal(game.move(nextDirection), true);
  assert.equal(game.lockElapsed, 300);
  game.update(200);
  assert.ok(game.board[BUFFER + 19].some(Boolean));
});

test('lock delay starts when gravity actually lands the piece', () => {
  const game = new Game(seeded());
  game.active = {type: 'O', rotation: 0, x: 3, y: 17};
  game.update(1000);
  assert.equal(game.active.y, 18);
  assert.equal(game.lockElapsed, 0);
  game.update(499);
  assert.equal(game.board[BUFFER + 19][4], null);
  game.update(1);
  assert.equal(game.board[BUFFER + 19][4], 'O');
});

test('line scoring, combos, back-to-back and perfect clears use the pre-clear level', () => {
  const game = new Game(seeded());
  const tetrisWell = () => {
    game.board = emptyBoard();
    for (let y = 16; y < 20; y++) for (let x = 0; x < WIDTH; x++) if (x !== 4) fill(game, x, y);
    fill(game, 0, 15); // Avoid a perfect clear.
    game.active = {type: 'I', rotation: 1, x: 2, y: 16};
  };
  tetrisWell(); game.hardDrop();
  assert.equal(game.score, 800);
  tetrisWell(); game.hardDrop();
  assert.equal(game.score, 2050); // 1200 back-to-back + 50 combo
  assert.equal(game.lastClear.backToBack, true);
  game.board = emptyBoard();
  for (let y = 16; y < 20; y++) for (let x = 0; x < WIDTH; x++) if (x !== 4) fill(game, x, y);
  game.active = {type: 'I', rotation: 1, x: 2, y: 16};
  game.lines = 9; game.level = 1;
  game.hardDrop();
  assert.equal(game.lastClear.points, 1200 + 100 + 3200);
  assert.equal(game.lastClear.perfectClear, true);
  assert.equal(game.level, 2);
});

test('T-spin detection distinguishes full and mini three-corner spins', () => {
  const full = new Game(seeded());
  full.board = emptyBoard();
  fill(full, 3, 17); fill(full, 5, 17); fill(full, 3, 19);
  full.active = {type: 'T', rotation: 3, x: 3, y: 17};
  assert.equal(full.rotate(1), true);
  full.hardDrop();
  assert.equal(full.lastClear.label, 'T-SPIN');
  assert.equal(full.score, 400);

  const mini = new Game(seeded());
  mini.board = emptyBoard();
  fill(mini, 3, 17); fill(mini, 3, 19); fill(mini, 5, 19);
  mini.active = {type: 'T', rotation: 3, x: 3, y: 17};
  assert.equal(mini.rotate(1), true);
  mini.hardDrop();
  assert.equal(mini.lastClear.label, 'T-SPIN MINI');
  assert.equal(mini.score, 100);
});

test('blocked spawn and locking entirely above the playfield end the game', () => {
  const blocked = new Game(seeded());
  for (let x = 0; x < WIDTH; x++) fill(blocked, x, 0);
  blocked.hold();
  assert.equal(blocked.status, 'gameover');

  const locked = new Game(seeded());
  locked.board = emptyBoard();
  fill(locked, 4, -2); fill(locked, 5, -2);
  locked.active = {type: 'O', rotation: 0, x: 3, y: -4};
  locked.hardDrop();
  assert.equal(locked.status, 'gameover');
});

test('pause freezes gravity and restart resets the session', () => {
  const game = new Game(seeded());
  const y = game.active.y;
  game.togglePause(); game.update(5000);
  assert.equal(game.active.y, y);
  assert.equal(game.move(1), false);
  game.togglePause(); game.update(1000);
  assert.ok(game.active.y > y);
  game.score = 200; game.lines = 3; game.restart();
  assert.equal(game.score, 0);
  assert.equal(game.lines, 0);
  assert.equal(game.status, 'playing');
});
