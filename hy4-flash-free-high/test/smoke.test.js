// Headless logic smoke tests. Run with `npm test` (builds first).
import assert from 'node:assert/strict';
import { Board } from '../dist/board.js';
import { BagRandomizer, PIECE_TYPES } from '../dist/randomizer.js';
import { PIECES } from '../dist/pieces.js';
import { Game } from '../dist/game.js';
import { lineClearScore, comboScore } from '../dist/scoring.js';
import { BOARD_WIDTH, gravityIntervalMs } from '../dist/constants.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  \u2713 ${name}`);
  } catch (err) {
    failed++;
    console.error(`  \u2717 ${name}\n      ${err.message}`);
  }
}

console.log('Tetris logic smoke tests');

test('7-bag randomizer yields every piece exactly once per bag', () => {
  const bag = new BagRandomizer();
  const drawn = Array.from({ length: 70 }, () => bag.next());
  for (let i = 0; i < drawn.length; i += 7) {
    assert.deepEqual([...drawn.slice(i, i + 7)].sort(), [...PIECE_TYPES].sort());
  }
});

for (const [type, def] of Object.entries(PIECES)) {
  test(`${type} has four rotation states of four cells`, () => {
    assert.equal(def.rotations.length, 4);
    for (const rotation of def.rotations) assert.equal(rotation.length, 4);
  });
}

test('O piece does not rotate or wall-kick', () => {
  assert.equal(PIECES.O.kicks, null);
});

test('clockwise rotation cycles 0-1-2-3-0', () => {
  const game = new Game();
  game.current = { type: 'T', rotation: 0, x: 3, y: 5 };
  for (let i = 1; i <= 4; i++) {
    assert.equal(game.rotate(1), true);
    assert.equal(game.current.rotation, i % 4);
  }
});

test('counter-clockwise rotation goes from 0 to 3', () => {
  const game = new Game();
  game.current = { type: 'T', rotation: 0, x: 3, y: 5 };
  assert.equal(game.rotate(-1), true);
  assert.equal(game.current.rotation, 3);
});

test('I piece wall kick rotates into a tight spot at the right wall', () => {
  const game = new Game();
  game.current = { type: 'I', rotation: 1, x: 7, y: 5 };
  assert.equal(game.rotate(1), true);
  assert.equal(game.current.rotation, 2);
  assert.equal(game.current.x, 6);
});

test('board detects out-of-bounds and occupied cells', () => {
  const board = new Board();
  board.cells[39][0] = 'I';
  assert.equal(board.collides([{ x: 0, y: 0 }], 0, 39), true);
  assert.equal(board.collides([{ x: 0, y: 0 }], 0, 38), false);
  assert.equal(board.collides([{ x: -1, y: 0 }], -1, 0), true);
});

test('clearLines removes a full row and shifts rows above down', () => {
  const board = new Board();
  for (let x = 0; x < BOARD_WIDTH; x++) board.cells[39][x] = 'J';
  board.cells[38][0] = 'T';
  assert.equal(board.clearLines(), 1);
  assert.equal(board.cells[39][0], 'T');
});

test('clearLines handles a Tetris (four rows)', () => {
  const board = new Board();
  for (let y = 36; y < 40; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) board.cells[y][x] = 'S';
  }
  assert.equal(board.clearLines(), 4);
  assert.ok(board.cells.every((row) => row.every((v) => v === null)));
});

test('guideline line-clear scoring with back-to-back Tetris', () => {
  assert.equal(lineClearScore(1, 1, false), 100);
  assert.equal(lineClearScore(2, 3, false), 900);
  assert.equal(lineClearScore(4, 2, false), 1600);
  assert.equal(lineClearScore(4, 2, true), 2400);
  assert.equal(lineClearScore(0, 5, false), 0);
});

test('combo scoring', () => {
  assert.equal(comboScore(0, 2), 0);
  assert.equal(comboScore(3, 2), 300);
});

test('hard drop lands on the floor and awards two points per cell', () => {
  const game = new Game();
  game.current = { type: 'T', rotation: 0, x: 3, y: 0 };
  const before = game.score;
  game.hardDrop();
  assert.equal(game.score - before, 76);
  assert.equal(game.board.cells[39][3], 'T');
  assert.equal(game.board.cells[39][5], 'T');
  assert.equal(game.board.cells[38][4], 'T');
});

test('ghost piece reports the landing row', () => {
  const game = new Game();
  game.current = { type: 'T', rotation: 0, x: 3, y: 5 };
  assert.equal(game.ghostY(), 38);
});

test('hold stores a piece and is limited to once per lock', () => {
  const game = new Game();
  const first = game.current.type;
  game.hold();
  assert.equal(game.holdType, first);
  assert.equal(game.canHold, false);
  const second = game.current.type;
  game.hold();
  assert.equal(game.holdType, first);
  assert.equal(game.current.type, second);
  game.hardDrop();
  assert.equal(game.canHold, true);
  game.hold();
  assert.equal(game.current.type, first);
});

test('lock delay keeps a grounded piece active until the timer expires', () => {
  const game = new Game();
  game.current = { type: 'T', rotation: 0, x: 3, y: 38 };
  const piece = game.current;
  game.update(100);
  assert.equal(game.current, piece);
  game.update(450);
  assert.notEqual(game.current, piece);
  assert.equal(game.board.cells[39][4], 'T');
});

test('top-out occurs when a spawn position is blocked', () => {
  const game = new Game();
  const type = game.current.type;
  for (let y = 0; y < 6; y++) {
    for (let x = 0; x < BOARD_WIDTH - 1; x++) game.board.cells[y][x] = 'J';
  }
  game.current = { type, rotation: 0, x: 3, y: 30 };
  game.hardDrop();
  assert.equal(game.gameOver, true);
  assert.equal(game.current, null);
});

test('gravity interval decreases as level increases', () => {
  assert.ok(gravityIntervalMs(1) > gravityIntervalMs(5));
  assert.ok(gravityIntervalMs(5) > gravityIntervalMs(10));
  assert.ok(gravityIntervalMs(20) >= 1);
});

test('actions are ignored after game over', () => {
  const game = new Game();
  game.gameOver = true;
  const snapshot = JSON.stringify({ score: game.score, lines: game.lines, current: game.current });
  game.moveHorizontal(1);
  game.rotate(1);
  game.softDrop();
  game.hardDrop();
  game.hold();
  game.update(1000);
  assert.equal(JSON.stringify({ score: game.score, lines: game.lines, current: game.current }), snapshot);
});

test('reset clears the board and all stats', () => {
  const game = new Game();
  game.score = 500;
  game.lines = 10;
  game.level = 2;
  game.board.cells[39][0] = 'T';
  game.gameOver = true;
  game.reset();
  assert.equal(game.score, 0);
  assert.equal(game.lines, 0);
  assert.equal(game.level, 1);
  assert.equal(game.gameOver, false);
  assert.ok(game.board.cells.every((row) => row.every((v) => v === null)));
  assert.notEqual(game.current, null);
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
