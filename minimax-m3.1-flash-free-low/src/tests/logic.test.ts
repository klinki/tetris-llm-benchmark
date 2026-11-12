/**
 * Headless smoke tests for the game logic.
 * Run with: npm test
 */
import assert from 'node:assert/strict';

import { Board, cellsOf, kickTable } from '../board.js';
import { COLS, ROWS, gravityMs } from '../constants.js';
import { Game } from '../game.js';
import { PIECE_TYPES, SHAPES } from '../pieces.js';
import { Randomizer } from '../randomizer.js';

let passed = 0;
const failures: string[] = [];

function test(name: string, fn: () => void): void {
  try {
    fn();
    passed++;
  } catch (error) {
    failures.push(`${name}: ${(error as Error).message}`);
  }
}

// --- pieces ---------------------------------------------------------------

test('every piece has four cells in every rotation state', () => {
  for (const type of PIECE_TYPES) {
    for (let r = 0; r < 4; r++) {
      assert.equal(cellsOf(type, r).length, 4, `${type} rotation ${r}`);
    }
  }
});

test('O piece never changes shape', () => {
  const base = cellsOf('O', 0).map((c) => `${c.dx},${c.dy}`).sort().join('|');
  for (let r = 1; r < 4; r++) {
    const other = cellsOf('O', r).map((c) => `${c.dx},${c.dy}`).sort().join('|');
    assert.equal(other, base);
  }
});

test('T piece spawn state matches the guideline', () => {
  const cells = cellsOf('T', 0);
  assert.deepEqual(
    cells.map((c) => [c.dx, c.dy]).sort((a, b) => a[1] - b[1] || a[0] - b[0]),
    [
      [1, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ]
  );
});

test('SRS kick tables exist for all transitions', () => {
  for (const type of PIECE_TYPES) {
    for (let from = 0; from < 4; from++) {
      for (const to of [((from + 1) % 4), ((from + 3) % 4)]) {
        assert.ok(kickTable(type, from, to).length > 0, `${type} ${from}->${to}`);
      }
    }
  }
});

// --- randomizer -----------------------------------------------------------

test('7-bag randomizer gives every piece exactly once per bag', () => {
  const randomizer = new Randomizer();
  const bag: string[] = [];
  for (let i = 0; i < 7; i++) bag.push(randomizer.next());
  assert.deepEqual([...bag].sort(), [...PIECE_TYPES].sort());
  const secondBag: string[] = [];
  for (let i = 0; i < 7; i++) secondBag.push(randomizer.next());
  assert.deepEqual([...secondBag].sort(), [...PIECE_TYPES].sort());
});

// --- board ----------------------------------------------------------------

test('board detects out of bounds and collisions', () => {
  const board = new Board();
  const cells = cellsOf('O', 0);
  assert.equal(board.fits(cells, -1, 0), false);
  assert.equal(board.fits(cells, COLS - 1, 0), false);
  assert.equal(board.fits(cells, 0, ROWS - 1), false);
  assert.equal(board.fits(cells, 0, 0), true);
  board.lock(cells, 4, 5, 'O');
  assert.equal(board.fits(cells, 4, 5), false);
});

test('full rows are cleared and the stack shifts down', () => {
  const board = new Board();
  for (let x = 0; x < COLS; x++) {
    board.cells[(ROWS - 1) * COLS + x] = 'I';
  }
  board.cells[(ROWS - 2) * COLS + 0] = 'J';
  assert.equal(board.clearLines(), 1);
  assert.equal(board.get(0, ROWS - 1), 'J', 'row above falls into the cleared row');
  assert.equal(board.get(1, ROWS - 1), null);
});

// --- game -----------------------------------------------------------------

test('gravity table follows the guideline formula', () => {
  assert.equal(gravityMs(1), 1000);
  assert.ok(gravityMs(10) < gravityMs(1));
});

test('single line clear scores 100 points', () => {
  const game = new Game();
  game.start();
  for (let x = 0; x < 8; x++) game.board.cells[(ROWS - 1) * COLS + x] = 'I';
  game.active = { type: 'O', rotation: 0, x: 8, y: ROWS - 2 };
  game.hardDrop();
  assert.equal(game.lines, 1);
  assert.equal(game.score, 100);
  assert.equal(game.level, 1);
});

test('hard drop awards two points per cell', () => {
  const game = new Game();
  game.start();
  game.active = { type: 'O', rotation: 0, x: 0, y: 0 };
  const before = game.score;
  game.hardDrop();
  assert.equal(game.score - before, 2 * (ROWS - 2));
});

test('tetris scores 800 points', () => {
  const game = new Game();
  game.start();
  for (let y = ROWS - 4; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (x !== 5) game.board.cells[y * COLS + x] = 'I';
    }
  }
  game.active = { type: 'I', rotation: 1, x: 3, y: 0 };
  game.hardDrop();
  assert.equal(game.lines, 4);
  assert.ok(game.score >= 800, `score was ${game.score}`);
});

test('hold swaps the active piece and can only be used once per piece', () => {
  const game = new Game();
  game.start();
  const first = game.active?.type;
  assert.ok(first);
  game.holdPiece();
  assert.equal(game.hold, first);
  assert.notEqual(game.active?.type, first);
  const held = game.active?.type;
  game.holdPiece();
  assert.equal(game.active?.type, held, 'second hold must be ignored');
});

test('rotation uses wall kicks near a wall', () => {
  const game = new Game();
  game.start();
  game.active = { type: 'T', rotation: 0, x: 0, y: 5 };
  assert.equal(game.rotateClockwise(), true);
  assert.equal(game.active?.rotation, 1);
});

test('top out happens when the spawn area is blocked', () => {
  const game = new Game();
  game.start();
  for (let x = 0; x < COLS; x++) game.board.cells[x] = 'I';
  const ok = game.spawn();
  assert.equal(ok, false);
  assert.equal(game.state, 'gameover');
});

test('ghost piece shows the landing position', () => {
  const game = new Game();
  game.start();
  game.active = { type: 'O', rotation: 0, x: 0, y: 0 };
  assert.equal(game.ghostY(), ROWS - 2);
});

test('the piece cannot move through the stack', () => {
  const game = new Game();
  game.start();
  game.active = { type: 'O', rotation: 0, x: 0, y: 0 };
  for (let x = 0; x < COLS; x++) game.board.cells[(ROWS - 1) * COLS + x] = 'I';
  const y = game.ghostY();
  assert.equal(y, ROWS - 3);
});

// --- report ---------------------------------------------------------------

if (failures.length > 0) {
  console.error(`${failures.length} test(s) failed:`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`All ${passed} tests passed.`);
