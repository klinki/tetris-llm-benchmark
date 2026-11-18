import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, HEIGHT, HIDDEN, WIDTH } from '../dist/game.js';
import { BagQueue, SHAPES, TYPES } from '../dist/pieces.js';

const newGame = () => new Game(() => 0.5);
const blocks = (game) => game.board.flat().filter(Boolean).length;

test('each bag contains all seven tetrominoes and maintains the preview queue', () => {
  const queue = new BagQueue(Math.random);
  for (let i = 0; i < 50; i++) {
    const bag = Array.from({ length: 7 }, () => queue.take());
    assert.deepEqual(bag.sort(), [...TYPES]);
    assert.ok(queue.pieces.length >= 5);
  }
});

test('all pieces rotate in both directions and close a four-turn cycle', () => {
  for (const kind of TYPES) {
    for (const direction of [-1, 1]) {
      const game = newGame();
      game.active = { kind, rotation: 0, x: 3, y: 25 };
      const original = { ...game.active };
      for (let r = 0; r < 4; r++) {
        assert.equal(game.rotate(direction), true);
        assert.equal(new Set(SHAPES[kind][game.active.rotation].map(String)).size, 4);
      }
      assert.deepEqual(game.active, original);
    }
  }
});

test('JLSTZ and I rotations kick out of a wall and off the floor', () => {
  const game = newGame();
  for (const [kind, x, expectedX] of [
    ['T', -1, 0],
    ['I', -2, 0],
  ]) {
    game.active = { kind, rotation: 1, x, y: 25 };
    assert.ok(game.fits(game.active));
    assert.ok(game.rotate(-1));
    assert.equal(game.active.x, expectedX);
  }
  game.active = { kind: 'T', rotation: 0, x: 3, y: HEIGHT - 2 };
  assert.ok(game.rotate(1));
  assert.deepEqual(game.active, { kind: 'T', rotation: 1, x: 2, y: HEIGHT - 3 });
});

test('a trapped rotation fails without shifting the piece', () => {
  const game = newGame();
  game.board.forEach((row) => row.fill('S'));
  const piece = (game.active = { kind: 'T', rotation: 0, x: 3, y: 25 });
  for (const [x, y] of SHAPES.T[0]) game.board[piece.y + y][piece.x + x] = null;
  assert.equal(game.rotate(1), false);
  assert.deepEqual(game.active, piece);
});

test('ghost predicts the landing cells and soft and hard drops score by distance', () => {
  const game = newGame();
  assert.ok(game.stepDown(true));
  assert.equal(game.score, 1);
  const { x, y, rotation, kind } = game.active;
  const landing = game.ghostY;
  const next = game.queue.pieces[0];
  game.hardDrop();
  assert.equal(game.score, 1 + 2 * (landing - y));
  assert.equal(game.active.kind, next);
  for (const [dx, dy] of SHAPES[kind][rotation])
    assert.equal(game.board[landing + dy][x + dx], kind);
});

test('hold consumes at most one piece per turn and swaps in spawn orientation', () => {
  const game = newGame();
  const first = game.active.kind;
  const next = game.queue.pieces[0];
  game.rotate(1);
  assert.ok(game.hold());
  assert.equal(game.held, first);
  assert.equal(game.active.kind, next);
  assert.equal(game.hold(), false);
  game.hardDrop();
  const queue = [...game.queue.pieces];
  assert.ok(game.hold());
  assert.equal(game.active.kind, first);
  assert.equal(game.active.rotation, 0);
  assert.deepEqual(game.queue.pieces, queue);
});

test('gravity accelerates with level and soft drop runs at 20 times gravity', () => {
  const game = newGame();
  const y = game.active.y;
  game.tick(999);
  assert.equal(game.active.y, y);
  game.tick(1);
  assert.equal(game.active.y, y + 1);
  game.tick(50, true);
  assert.equal(game.active.y, y + 2);
  assert.equal(game.score, 1);
  game.lines = 10;
  assert.equal(game.level, 2);
  assert.equal(game.gravity, 793);
});

test('landing gets a 500 ms delay and grounded movement resets it', () => {
  const game = newGame();
  game.active.y = game.ghostY;
  game.tick(499);
  assert.equal(blocks(game), 0);
  assert.ok(game.move(1));
  game.tick(499);
  assert.equal(blocks(game), 0);
  game.tick(1);
  assert.equal(blocks(game), 4);
});

test('repeated grounded movement cannot postpone locking indefinitely', () => {
  const game = newGame();
  game.active.y = game.ghostY;
  for (let n = 0; n < 20 && !blocks(game); n++) {
    game.move(n % 2 ? -1 : 1);
    game.tick(100);
  }
  assert.equal(blocks(game), 4);
});

function setFourLineWell(game) {
  for (let y = HEIGHT - 4; y < HEIGHT; y++) {
    game.board[y].fill('L');
    game.board[y][5] = null;
  }
  game.active = { kind: 'I', rotation: 1, x: 3, y: HEIGHT - 4 };
}

test('line removal, perfect clears, combos and back-to-back bonuses stack', () => {
  const game = newGame();
  setFourLineWell(game);
  game.hardDrop();
  assert.equal(game.score, 800 + 2000);
  assert.equal(blocks(game), 0);
  assert.equal(game.board.length, HEIGHT);
  setFourLineWell(game);
  game.hardDrop();
  assert.equal(game.score, 2800 + 1200 + 3200 + 50);
  assert.equal(game.lines, 8);
});

test('T-spin scoring distinguishes full and mini spins after a successful rotation', () => {
  for (const [corner, score] of [
    [2, 400],
    [0, 100],
  ]) {
    const game = newGame();
    game.active = { kind: 'T', rotation: 1, x: 3, y: HEIGHT - 3 };
    // Leave the bottom-right corner open for the full spin, top-right for mini.
    game.board[HEIGHT - 3][3] = 'J';
    game.board[HEIGHT - 1][3] = 'J';
    game.board[HEIGHT - 1 - corner][5] = 'J';
    assert.ok(game.rotate(-1));
    assert.equal(game.ghostY, HEIGHT - 3);
    game.hardDrop();
    assert.equal(game.score, score);
  }
});

test('a blocked spawn tops out and game-over input is inert', () => {
  const game = newGame();
  game.active.y = game.ghostY;
  for (let y = HIDDEN - 2; y < HIDDEN; y++) {
    for (let x = 3; x <= 6; x++) game.board[y][x] = 'O';
  }
  game.hardDrop();
  assert.ok(game.over);
  const snapshot = JSON.stringify(game.board);
  game.tick(10000);
  game.hardDrop();
  assert.equal(game.hold(), false);
  assert.equal(game.move(1), false);
  assert.equal(game.rotate(1), false);
  assert.equal(JSON.stringify(game.board), snapshot);
  assert.ok(game.board.every((row) => row.length === WIDTH));
});
