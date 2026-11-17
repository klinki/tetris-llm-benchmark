import assert from 'node:assert/strict';
import test from 'node:test';
import { Game, HEIGHT, WIDTH, cells, gravityInterval } from '../dist/game.js';
import { Bag, kinds } from '../dist/pieces.js';

function setCell(game, x, y, kind = 'J') {
  game.board[game.board.length - HEIGHT + y][x] = kind;
}

function fillRows(game, count, gap) {
  for (let y = HEIGHT - count; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      if (x !== gap) setCell(game, x, y);
    }
  }
}

test('every bag contains all seven pieces exactly once', () => {
  const bag = new Bag(() => .3);
  for (let i = 0; i < 10; i++) {
    assert.deepEqual(Array.from({ length: 7 }, () => bag.take()).sort(), [...kinds]);
  }
});

test('hold consumes the queue once and swaps a fresh piece after lock', () => {
  const game = new Game(() => 0);
  const first = game.active.kind;
  const [second, third] = game.next;
  game.rotate(1);
  game.hold();
  assert.equal(game.active.kind, second);
  assert.equal(game.held, first);
  assert.equal(game.canHold, false);
  game.hold();
  assert.equal(game.active.kind, second);
  game.hardDrop();
  assert.equal(game.active.kind, third);
  assert.equal(game.canHold, true);
  const queue = [...game.next];
  game.hold();
  assert.equal(game.active.kind, first);
  assert.equal(game.active.rotation, 0);
  assert.equal(game.active.x, 3);
  assert.deepEqual(game.next, queue);
});

test('normal and I-piece wall kicks use their own offsets', () => {
  const game = new Game();
  game.active = { kind: 'T', x: -1, y: 4, rotation: 1 };
  assert.ok(game.fits(game.active));
  assert.ok(game.rotate(-1));
  assert.deepEqual(game.active, { kind: 'T', x: 0, y: 4, rotation: 0 });
  game.active = { kind: 'I', x: -2, y: 4, rotation: 1 };
  assert.ok(game.fits(game.active));
  assert.ok(game.rotate(-1));
  assert.deepEqual(game.active, { kind: 'I', x: 0, y: 4, rotation: 0 });
});

test('a floor kick can rotate a grounded piece', () => {
  const game = new Game();
  game.active = { kind: 'T', x: 4, y: 18, rotation: 0 };
  assert.ok(game.rotate(1));
  assert.deepEqual(game.active, { kind: 'T', x: 3, y: 17, rotation: 1 });
});

test('hard drop locks every ghost cell and awards two points per row', () => {
  const game = new Game();
  const { y, kind } = game.active;
  const ghost = game.ghost;
  game.hardDrop();
  for (const [x, row] of cells(ghost)) assert.equal(game.cellAt(x, row), kind);
  assert.equal(game.score, 2 * (ghost.y - y));
});

test('gravity, soft drop points, and the 500 ms lock delay have separate timing', () => {
  const game = new Game();
  const { y } = game.active;
  game.update(999);
  assert.equal(game.active.y, y);
  game.update(1);
  assert.equal(game.active.y, y + 1);
  game.update(50, true);
  assert.equal(game.active.y, y + 2);
  assert.equal(game.score, 1);
  game.active = game.ghost;
  const turn = game.turn;
  game.update(499);
  assert.equal(game.turn, turn);
  game.update(1);
  assert.equal(game.turn, turn + 1);
  assert.equal(gravityInterval(2), 793);
});

test('grounded movement resets the delay, with a 15-move limit', () => {
  const game = new Game();
  while (game.active.y < game.ghost.y) game.softDrop();
  const turn = game.turn;
  game.update(499);
  game.move(1);
  game.update(499);
  assert.equal(game.turn, turn);
  for (let i = 0; i < 13; i++) assert.ok(game.move(i % 2 === 0 ? -1 : 1));
  assert.equal(game.turn, turn);
  assert.ok(game.move(1));
  assert.equal(game.turn, turn + 1);
});

test('four-line clears collapse the board and score back-to-back and combo bonuses', () => {
  const game = new Game();
  for (let i = 0; i < 2; i++) {
    fillRows(game, 4, 5);
    game.active = { kind: 'I', x: 3, y: 16, rotation: 1 };
    game.hardDrop();
    assert.ok(game.board.every(row => row.every(cell => cell === null)));
  }
  assert.equal(game.lines, 8);
  assert.equal(game.score, 800 + 1200 + 50);

  fillRows(game, 2, 5);
  game.active = { kind: 'I', x: 3, y: 16, rotation: 1 };
  game.hardDrop();
  assert.equal(game.lines, 10);
  assert.equal(game.level, 2);
  assert.equal(game.score, 800 + 1200 + 50 + 300 + 100);
  assert.equal(game.backToBack, false);
  assert.equal(game.cellAt(5, 19), 'I');
});

test('a T rotation with three occupied corners can score a T-spin', () => {
  const game = new Game();
  game.active = { kind: 'T', x: 3, y: 17, rotation: 1 };
  for (const [x, y] of [[3, 17], [5, 17], [3, 19], [4, 19]]) setCell(game, x, y);
  assert.ok(game.rotate(-1));
  game.hardDrop();
  assert.equal(game.score, 400);
});

test('a blocked spawn ends the game, including when spawning from hold', () => {
  const game = new Game();
  for (let x = 3; x < 7; x++) setCell(game, x, -1);
  game.hold();
  assert.equal(game.over, true);
  const snapshot = JSON.stringify(game.board);
  game.move(1);
  game.hardDrop();
  game.update(1000);
  assert.equal(JSON.stringify(game.board), snapshot);
});
