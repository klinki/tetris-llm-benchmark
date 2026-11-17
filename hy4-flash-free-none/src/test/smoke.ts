/**
 * Headless logic smoke tests. Run with `npm test` (builds first, then runs
 * this file with Node). Uses Node's built-in assert; no test framework.
 */
import * as assert from 'assert';
import { Game } from '../game';
import { Board } from '../board';
import { Randomizer } from '../randomizer';
import { Scoring } from '../scoring';
import { ActivePiece } from '../types';
import { ShapeId } from '../constants';
import {
  COLS,
  SHAPES,
  gravityForLevel,
  LOCK_DELAY_FRAMES,
} from '../constants';

let passed = 0;
function test(name: string, fn: () => void): void {
  try {
    fn();
    passed++;
    console.log(`  ok  - ${name}`);
  } catch (err) {
    console.error(`  FAIL - ${name}`);
    throw err;
  }
}

/** Helper to build a piece at a given pose. */
function piece(shape: ShapeId, x: number, y: number, rotation = 0): ActivePiece {
  return { shape, x, y, rotation };
}

console.log('Running Tetris logic smoke tests...');

test('7-bag randomizer yields each shape once per bag', () => {
  const r = new Randomizer(12345);
  const first = SHAPES.map(() => r.next());
  assert.strictEqual(new Set(first).size, 7, 'a bag contains 7 distinct shapes');
  assert.deepStrictEqual([...first].sort(), [...SHAPES].sort());
  const second = SHAPES.map(() => r.next());
  assert.deepStrictEqual([...second].sort(), [...SHAPES].sort());
});

test('randomizer is deterministic with a seed', () => {
  const a = new Randomizer(999);
  const b = new Randomizer(999);
  for (let i = 0; i < 21; i++) assert.strictEqual(a.next(), b.next());
});

test('empty board has no collisions at spawn', () => {
  const board = new Board();
  assert.strictEqual(board.collides(piece('T', 3, 0)), false);
});

test('collision detects walls and floor', () => {
  const board = new Board();
  assert.strictEqual(board.collides(piece('T', -1, 0)), true);
  assert.strictEqual(board.collides(piece('I', 7, 0)), true); // I spans x 7..10
  assert.strictEqual(board.collides(piece('T', 3, 100)), true);
});

test('locking a piece writes its cells and clears full lines', () => {
  const board = new Board();
  // Fill bottom row except columns 0..3; an I horizontal fills it.
  const bottom = board.grid.length - 1;
  for (let x = 4; x < COLS; x++) board.grid[bottom][x] = 'J';
  const cleared = board.lock(piece('I', 0, bottom - 1));
  assert.strictEqual(cleared, 1, 'one line cleared');
  assert.ok(board.grid[bottom].every((c) => c === null), 'bottom row empty after clear');
});

test('multi-line clear (tetris) clears four lines', () => {
  const board = new Board();
  // Fill bottom four rows except column 0, then drop a vertical I into column 0.
  for (let y = board.grid.length - 4; y < board.grid.length; y++) {
    for (let x = 1; x < COLS; x++) board.grid[y][x] = 'S';
  }
  const verticalI = piece('I', 0, 0, 1); // rotation 1: vertical column at local x=2
  // Position so that local x=2 lands on board column 0 -> x = -2.
  const pose: ActivePiece = { ...verticalI, x: -2, y: board.grid.length - 4 };
  const cleared = board.lock(pose);
  assert.strictEqual(cleared, 4, 'four lines cleared');
});

test('SRS: T piece kicks off the left wall when rotating', () => {
  const board = new Board();
  // T at far-left wall in rotation 0; rotating CCW should kick it right.
  const rotated = board.tryRotate(piece('T', -1, 5), -1);
  assert.notStrictEqual(rotated, null, 'a legal kick exists');
  assert.strictEqual(rotated!.rotation, 3);
});

test('SRS: I piece uses its wider kick table', () => {
  const board = new Board();
  const rotated = board.tryRotate(piece('I', -2, 5), 1);
  assert.notStrictEqual(rotated, null);
  assert.strictEqual(rotated!.rotation, 1);
});

test('O piece never rotates to a different orientation', () => {
  const game = new Game(1);
  // Force an O piece as active.
  game.active = piece('O', 3, 0);
  const before = { ...game.active };
  game.rotate(1);
  assert.deepStrictEqual(game.active, before, 'O rotation is a no-op');
});

test('ghost piece rests exactly on the stack', () => {
  const board = new Board();
  const bottom = board.grid.length - 1;
  board.grid[bottom][3] = 'Z'; // a block under column 3
  const ghost = board.ghostPose(piece('T', 2, 0));
  // T occupies (2,0),(1,1),(2,1),(3,1); bottom block at col 3 stops it.
  assert.strictEqual(board.collides({ ...ghost, y: ghost.y + 1 }), true,
    'ghost cannot move further down');
  assert.strictEqual(board.collides(ghost), false, 'ghost itself is valid');
});

test('scoring: single, double, triple, tetris and combo', () => {
  // Fresh instances so combos do not affect the base line-clear values.
  assert.strictEqual(new Scoring().applyClear(1), 100);
  assert.strictEqual(new Scoring().applyClear(2), 300);
  assert.strictEqual(new Scoring().applyClear(3), 500);
  assert.strictEqual(new Scoring().applyClear(4), 800);

  // Accumulate to verify level progression.
  const s = new Scoring();
  s.applyClear(4); // 4 lines
  s.applyClear(4); // 8 lines
  s.applyClear(2); // 10 lines -> level 2
  assert.strictEqual(s.lines, 10);
  assert.strictEqual(s.level, 2);

  // Combo: 100 + 50*1 = 150 on the second consecutive clear.
  const c = new Scoring();
  c.applyClear(1); // combo 0, +100
  assert.strictEqual(c.applyClear(1), 150); // combo 1: 100 + 50*1*level(1)
  c.applyClear(0); // resets combo
  assert.strictEqual(c.combo, -1);
});

test('scoring: back-to-back tetris bonus', () => {
  const s = new Scoring();
  s.applyClear(4); // 800, sets backToBack
  const second = s.applyClear(4); // 800*1.5 + combo(50*1)=1250
  assert.strictEqual(second, 1250);
});

test('gravity gets faster as level increases', () => {
  assert.ok(gravityForLevel(1) > gravityForLevel(10), 'higher level = fewer frames per row');
  assert.strictEqual(gravityForLevel(1), Math.round(Math.pow(0.8, 0) * 60));
});

test('hold swaps pieces and is limited to once per drop', () => {
  const game = new Game(7);
  const first = game.active!.shape;
  assert.strictEqual(game.holdPiece(), true);
  assert.strictEqual(game.hold, first);
  assert.strictEqual(game.canHold, false);
  assert.strictEqual(game.holdPiece(), false, 'cannot hold twice in a row');
});

test('hard drop locks the piece and spawns the next', () => {
  const game = new Game(42);
  const before = game.getRenderState();
  game.hardDrop();
  const after = game.getRenderState();
  assert.strictEqual(after.score > before.score, true, 'hard drop awards points');
  assert.ok(after.active, 'a new piece is active');
});

test('soft drop scores one point per cell', () => {
  const game = new Game(3);
  const before = game.scoring.score;
  const dropped = game.softDrop();
  assert.strictEqual(dropped, 1);
  assert.strictEqual(game.scoring.score, before + 1);
});

test('lock delay holds the piece before locking', () => {
  const game = new Game(5);
  // Slam a piece down with repeated soft drops until grounded.
  for (let i = 0; i < 25; i++) game.softDrop();
  const groundedPiece = game.active;
  // Tick less than the lock delay: piece should still be present.
  for (let i = 0; i < LOCK_DELAY_FRAMES - 1; i++) game.tick();
  assert.deepStrictEqual(game.active, groundedPiece, 'piece has not locked yet');
  // One more tick passes the lock delay.
  game.tick();
  assert.notDeepStrictEqual(game.active, groundedPiece, 'piece locked and a new one spawned');
});

test('top-out triggers game over on blocked spawn', () => {
  const game = new Game(11);
  // Fill every cell except column 9 so no line is ever full (no line clears).
  for (const row of game.board.grid) {
    for (let x = 0; x < COLS; x++) {
      if (x !== 9) row[x] = 'Z';
    }
  }
  // Lock the current piece: the next spawn at the top collides with the stack.
  game.hardDrop();
  assert.strictEqual(game.gameOver, true);
});

test('restart resets score and clears the board', () => {
  const game = new Game(2);
  game.hardDrop();
  game.reset(2);
  assert.strictEqual(game.scoring.score, 0);
  assert.strictEqual(game.gameOver, false);
  assert.ok(game.board.grid.every((row) => row.every((c) => c === null)));
});

console.log(`\n${passed} tests passed.`);
