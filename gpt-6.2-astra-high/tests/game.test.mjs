import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game, HEIGHT, HIDDEN, WIDTH } from '../dist/game.js';
import { bag, cells, TYPES } from '../dist/pieces.js';

const game = () => new Game(() => 0.3);
function pose(g, kind, x, y, rotation = 0) {
  g.active = { kind, x, y, rotation };
}
function blocks(g) {
  return g.board.flat().filter(Boolean).length;
}
function well(g, rows) {
  for (let y = HEIGHT - rows; y < HEIGHT; y++) {
    g.board[y].fill('J');
    g.board[y][4] = null;
  }
  pose(g, 'I', 2, HEIGHT - 4, 1);
}

test('each seven-piece bag contains all kinds, including across queue refills', () => {
  const g = game();
  for (let round = 0; round < 6; round++) {
    const drawn = [];
    for (let i = 0; i < 7; i++) {
      assert.ok(g.queue.length >= 5);
      drawn.push(g.active.kind);
      g.board.forEach((row) => row.fill(null));
      g.hardDrop();
    }
    assert.deepEqual(drawn.sort(), [...TYPES].sort());
  }
  assert.deepEqual(
    bag(() => 0.999),
    [...TYPES]
  );
});

test('all pieces rotate four times back to spawn, with four distinct cells per state', () => {
  for (const kind of TYPES) {
    const g = game();
    pose(g, kind, 3, HIDDEN + 5);
    const original = { ...g.active };
    for (let i = 0; i < 4; i++) {
      assert.equal(new Set(cells(g.active).map((c) => c.join(','))).size, 4);
      assert.ok(g.rotate(1));
    }
    assert.deepEqual(g.active, original);
  }
});

test('SRS uses different wall kicks for I and T', () => {
  for (const [kind, x] of [
    ['I', -2],
    ['T', -1]
  ]) {
    const g = game();
    pose(g, kind, x, HIDDEN + 4, 1);
    assert.equal(g.move(-1), false);
    assert.ok(g.rotate(-1));
    assert.equal(g.active.x, 0);
    assert.equal(g.active.rotation, 0);
  }
});

test('hold consumes one queue piece, locks out until placement, and resets rotation on swap', () => {
  const g = game();
  const first = g.active.kind,
    next = g.queue[0];
  g.rotate(1);
  assert.ok(g.hold());
  assert.equal(g.held, first);
  assert.equal(g.active.kind, next);
  assert.equal(g.hold(), false);
  g.hardDrop();
  const queue = [...g.queue];
  assert.ok(g.hold());
  assert.equal(g.active.kind, first);
  assert.equal(g.active.rotation, 0);
  assert.deepEqual(g.queue, queue);
});

test('gravity, soft drop and ghost landing distance determine position and drop points', () => {
  const g = game(),
    start = g.active.y;
  g.tick(999);
  assert.equal(g.active.y, start);
  g.tick(1);
  assert.equal(g.active.y, start + 1);
  assert.ok(g.softDrop());
  assert.equal(g.score, 1);
  const landing = g.ghostY,
    p = { ...g.active };
  g.hardDrop();
  assert.equal(g.score, 1 + (landing - p.y) * 2);
  for (const [x, y] of cells(p))
    assert.equal(g.board[landing + y][p.x + x], p.kind);
});

test('lock delay allows a grounded move, then locks exactly at 500 ms', () => {
  const g = game();
  pose(g, 'O', 3, HEIGHT - 2);
  g.tick(499);
  assert.equal(blocks(g), 0);
  g.move(1);
  g.tick(499);
  assert.equal(blocks(g), 0);
  g.tick(1);
  assert.equal(blocks(g), 4);
});

test('repeated floor movement cannot extend lock delay indefinitely', () => {
  const g = game();
  while (g.softDrop()) {}
  for (let i = 0; i < 20 && !blocks(g); i++) {
    g.tick(300);
    if (!blocks(g)) g.move(i % 2 ? -1 : 1);
  }
  assert.equal(blocks(g), 4);
});

test('line clears compact the board and award level-scaled consecutive difficult clears', () => {
  const g = game();
  g.board[HEIGHT - 5][0] = 'O';
  well(g, 4);
  g.hardDrop();
  assert.equal(g.lines, 4);
  assert.equal(g.score, 800);
  assert.equal(g.board[HEIGHT - 1][0], 'O');
  g.board[HEIGHT - 5][0] = 'O';
  well(g, 4);
  g.hardDrop();
  assert.equal(g.lines, 8);
  assert.equal(g.score, 800 + 1200 + 50);
  g.board[HEIGHT - 5][0] = 'J';
  well(g, 2);
  g.hardDrop();
  assert.equal(g.level, 2);
  assert.equal(g.backToBack, false);
  assert.equal(g.score, 2450);
  assert.equal(g.gravity, 793);
});

test('a perfect-clear Tetris earns the perfect-clear bonus', () => {
  const g = game();
  well(g, 4);
  g.hardDrop();
  assert.equal(g.score, 2800);
  assert.equal(blocks(g), 0);
});

test('T-spin recognition checks occupied corners and orientation', () => {
  for (const [corners, points] of [
    [
      [
        [0, 0],
        [2, 0],
        [0, 2]
      ],
      400
    ],
    [
      [
        [0, 0],
        [0, 2],
        [2, 2]
      ],
      100
    ]
  ]) {
    const g = game(),
      y = HEIGHT - 3;
    for (const [dx, dy] of corners) g.board[y + dy][3 + dx] = 'L';
    pose(g, 'T', 3, y, 3);
    assert.ok(g.rotate(1));
    g.hardDrop();
    assert.equal(g.score, points);
  }
});

test('blocked spawn ends the game and rejects subsequent inputs', () => {
  const g = game();
  g.board[HIDDEN - 1] = Array(WIDTH).fill('S');
  g.board[HIDDEN - 1][0] = null;
  pose(g, 'O', 3, HEIGHT - 2);
  g.hardDrop();
  assert.equal(g.over, true);
  const state = JSON.stringify(g);
  g.move(1);
  g.rotate(1);
  g.hold();
  g.softDrop();
  g.hardDrop();
  g.tick(1000);
  assert.equal(JSON.stringify(g), state);
});
