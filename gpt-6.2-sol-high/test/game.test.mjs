import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Game, HEIGHT, LOCK_DELAY, WIDTH, sevenBag } from '../dist/game.js';
import { KINDS, PIECES, shape } from '../dist/pieces.js';

const orderedGame = () => new Game(() => 0.999);

function fillRowExcept(game, row, columns) {
  game.board[row] = Array.from({ length: WIDTH }, (_, x) => columns.includes(x) ? null : 'crown');
}

test('every bag contains one of each distinctly colored piece', () => {
  const bag = sevenBag(() => 0.45);
  assert.equal(new Set(Object.values(PIECES).map(({ color }) => color)).size, KINDS.length);
  for (let round = 0; round < 3; round++) {
    const drawn = Array.from({ length: KINDS.length }, () => bag.next().value);
    assert.deepEqual(new Set(drawn), new Set(KINDS));
  }
});

test('rotation kicks away from the ceiling and side wall', () => {
  const game = orderedGame();
  assert.equal(game.rotate(1), true);
  assert.equal(game.active.turn, 1);
  assert.equal(game.active.y, 1);
  for (let x = game.active.x; x > 0; x--) assert.equal(game.move(-1), true);
  assert.equal(game.move(-1), false);
  assert.equal(game.active.x, 0);
  assert.equal(game.rotate(-1), true);
  assert.equal(game.active.x, 1);
  assert.equal(game.active.turn, 0);
});

test('hard drop locks exactly at the landing preview and advances the queue', () => {
  const game = orderedGame();
  const { x, y, kind, turn } = game.landing;
  const distance = y - game.active.y;
  const next = game.next[0];
  assert.equal(game.hardDrop(), true);
  for (const [dx, dy] of shape(kind, turn)) assert.equal(game.board[y + dy][x + dx], kind);
  assert.equal(game.score, distance * 2);
  assert.equal(game.active.kind, next);
  assert.equal(game.next.length, 3);
});

test('hold is limited to once per piece and restores the held piece at spawn', () => {
  const game = orderedGame();
  const spawn = { ...game.active };
  game.rotate(1);
  assert.equal(game.hold(), true);
  assert.equal(game.held, spawn.kind);
  assert.equal(game.active.kind, 'elbow');
  assert.equal(game.hold(), false);
  game.hardDrop();
  const next = [...game.next];
  assert.equal(game.hold(), true);
  assert.deepEqual(game.active, spawn);
  assert.equal(game.held, 'hook');
  assert.deepEqual(game.next, next);
});

test('gravity runs over time and the grounded lock delay has a reset cap', () => {
  const game = orderedGame();
  assert.equal(game.advance(game.gravity - 1), false);
  assert.equal(game.active.y, 0);
  assert.equal(game.advance(1), true);
  assert.equal(game.active.y, 1);
  assert.equal(game.softDrop(), true);
  assert.equal(game.score, 1);
  game.advance(game.gravity * (game.landing.y - game.active.y));
  assert.equal(game.grounded, true);
  const kind = game.active.kind;
  for (let i = 0; i < 8; i++) {
    assert.equal(game.advance(LOCK_DELAY - 1), false);
    assert.equal(game.move(i % 2 === 0 ? -1 : 1), true);
  }
  assert.equal(game.advance(LOCK_DELAY - 1), false);
  assert.equal(game.move(-1), true);
  assert.equal(game.active.kind, kind);
  assert.equal(game.advance(1), true);
  assert.notEqual(game.active.kind, kind);
});

test('completed rows compact, score, and increase gravity at the next level', () => {
  const game = orderedGame();
  game.lines = 5;
  const oldGravity = game.gravity;
  game.rotate(1);
  const column = game.active.x;
  game.board[HEIGHT - 3][0] = 'kite';
  fillRowExcept(game, HEIGHT - 2, [column]);
  fillRowExcept(game, HEIGHT - 1, [column]);
  const dropPoints = (game.landing.y - game.active.y) * 2;
  game.hardDrop();
  assert.equal(game.lines, 7);
  assert.equal(game.level, 2);
  assert.ok(game.gravity < oldGravity);
  assert.equal(game.score, 400 + dropPoints);
  assert.equal(game.board[HEIGHT - 1][0], 'kite');
  assert.equal(game.board[HEIGHT - 1][column], 'beam');
  assert.ok(game.board[0].every((cell) => cell === null));

  const landing = game.landing;
  const bottomCells = shape(landing.kind).filter(([, y]) => y + landing.y === HEIGHT - 2);
  fillRowExcept(game, HEIGHT - 2, bottomCells.map(([x]) => x + landing.x));
  const streakPoints = 2 * (game.landing.y - game.active.y) + (100 + 50) * game.level;
  game.hardDrop();
  assert.equal(game.streak, 2);
  assert.equal(game.score, 400 + dropPoints + streakPoints);
});

test('a blocked spawn ends the game and freezes further moves', () => {
  const game = orderedGame();
  game.softDrop();
  game.board[0][5] = 'kite';
  game.hardDrop();
  assert.equal(game.over, true);
  const state = JSON.stringify(game.board);
  assert.equal(game.move(1), false);
  assert.equal(game.rotate(1), false);
  assert.equal(game.softDrop(), false);
  assert.equal(game.hardDrop(), false);
  assert.equal(game.hold(), false);
  assert.equal(game.advance(5000), false);
  assert.equal(JSON.stringify(game.board), state);
});
