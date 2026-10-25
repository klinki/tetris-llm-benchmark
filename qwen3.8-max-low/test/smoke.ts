// Headless logic smoke tests. Run with: npm test
// These exercise the pure game logic (no DOM) against the compiled output.
declare const process: { exit(code: number): never };

import { Board, HEIGHT, WIDTH } from '../src/board.js';
import {
  Game,
  gravityInterval,
  NEXT_COUNT,
  pieceCells,
  LOCK_DELAY,
} from '../src/game.js';
import { BagRandomizer } from '../src/randomizer.js';
import { PIECE_TYPES } from '../src/pieces.js';

// Deterministic PRNG so tests are reproducible.
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void): void {
  try {
    fn();
    passed++;
    console.log(`ok   ${name}`);
  } catch (err) {
    failed++;
    console.error(`FAIL ${name}: ${err instanceof Error ? err.message : err}`);
  }
}

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

function eq(actual: unknown, expected: unknown, msg: string): void {
  if (actual !== expected) {
    throw new Error(`${msg} (expected ${String(expected)}, got ${String(actual)})`);
  }
}

test('7-bag randomizer emits every piece once per bag', () => {
  const bag = new BagRandomizer(mulberry32(42));
  const sorted = [...PIECE_TYPES].sort().join('');
  for (let b = 0; b < 10; b++) {
    const drawn = Array.from({ length: 7 }, () => bag.next()).sort().join('');
    eq(drawn, sorted, `bag ${b} is not a permutation of all 7 pieces`);
  }
});

test('board rejects cells outside the playfield', () => {
  const board = new Board();
  assert(!board.isFree([[-1, 10]]), 'left of the wall should collide');
  assert(!board.isFree([[WIDTH, 10]]), 'right of the wall should collide');
  assert(!board.isFree([[5, HEIGHT]]), 'below the floor should collide');
  assert(board.isFree([[5, -1]]), 'above the top is allowed (spawn buffer)');
  assert(board.isFree([[0, 4]]), 'empty cell should be free');
});

test('board clears full lines and keeps partial ones', () => {
  const board = new Board();
  for (let x = 0; x < WIDTH; x++) board.set(x, HEIGHT - 1, 1);
  for (let x = 0; x < WIDTH - 1; x++) board.set(x, HEIGHT - 2, 2);
  eq(board.clearLines(), 1, 'exactly one full line should clear');
  eq(board.grid[HEIGHT - 1][0], 2, 'row above should shift down');
  eq(board.grid[HEIGHT - 2][0], 0, 'cleared row becomes empty');
});

test('game spawns a piece and keeps a full next queue', () => {
  const game = new Game(mulberry32(1));
  eq(game.state, 'playing', 'game should be playing');
  assert(game.piece !== null, 'a piece should be falling');
  eq(game.nextQueue.length, NEXT_COUNT, 'next queue length');
  game.hardDrop();
  eq(game.nextQueue.length, NEXT_COUNT, 'next queue refills after a drop');
  assert(game.piece !== null, 'a new piece spawns after locking');
});

test('hard drop locks the piece and scores 2 per cell', () => {
  const game = new Game(mulberry32(2));
  const piece = game.piece!;
  const startY = piece.y;
  const landY = game.ghostY();
  game.hardDrop();
  eq(game.score, 2 * (landY - startY), 'hard drop score');
  // Exactly four cells of the dropped piece are on the board.
  const filled = game.board.grid.flat().filter((v) => v !== 0);
  eq(filled.length, 4, 'locked piece cells');
  // The locked cells are at the ghost landing position.
  const expected = pieceCells({ ...piece, y: landY });
  for (const [x, y] of expected) {
    assert(game.board.grid[y][x] !== 0, `cell (${x},${y}) should be filled`);
  }
});

test('soft drop scores 1 per cell and is faster than gravity', () => {
  const game = new Game(mulberry32(3));
  const startY = game.piece!.y;
  game.softDropping = true;
  game.update(0.26); // level 1 soft drop: 1 row per 50ms
  eq(game.piece!.y - startY, 5, 'soft dropped rows');
  eq(game.score, 5, 'soft drop score');
});

test('gravity drops one row per second at level 1', () => {
  const game = new Game(mulberry32(4));
  const startY = game.piece!.y;
  game.update(1.05);
  eq(game.piece!.y, startY + 1, 'one row after 1s of gravity');
  eq(game.score, 0, 'gravity is free');
  assert(Math.abs(gravityInterval(1) - 1) < 1e-9, 'level 1 gravity is 1s');
  assert(gravityInterval(2) < gravityInterval(1), 'gravity speeds up with level');
});

test('double line clear scores Guideline points', () => {
  const game = new Game(mulberry32(5));
  // Place an O piece and fill the bottom two rows except its landing columns.
  game.piece = { type: 'O', rotation: 0, x: 4, y: 2 };
  for (const y of [HEIGHT - 2, HEIGHT - 1]) {
    for (let x = 0; x < WIDTH; x++) {
      if (x !== 4 && x !== 5) game.board.set(x, y, 1);
    }
  }
  game.score = 0;
  game.hardDrop(); // 20 rows of drop + a double
  eq(game.lines, 2, 'two lines cleared');
  eq(game.score, 2 * 20 + 300, 'hard drop points + double score');
  eq(game.board.grid.flat().filter((v) => v !== 0).length, 0, 'board cleared');
});

test('hold swaps pieces and is limited to once per piece', () => {
  const game = new Game(mulberry32(6));
  const first = game.piece!.type;
  game.hold();
  eq(game.holdType, first, 'piece goes to hold');
  assert(!game.canHold, 'cannot hold twice in a row');
  const second = game.piece!.type;
  game.hold();
  eq(game.piece!.type, second, 'second hold is a no-op');
  game.hardDrop();
  assert(game.canHold, 'hold recharges after locking');
  const third = game.piece!.type;
  game.hold();
  eq(game.piece!.type, first, 'held piece comes back');
  eq(game.holdType, third, 'current piece goes to hold');
});

test('SRS wall kick moves the I piece away from the wall', () => {
  const game = new Game(mulberry32(7));
  // Vertical I at the right wall (column 9), rotating CW needs a kick.
  game.piece = { type: 'I', rotation: 1, x: 7, y: 10 };
  assert(game.rotate(1), 'rotation with a wall kick should succeed');
  eq(game.piece!.rotation, 2, 'rotated clockwise');
  eq(game.piece!.x, 6, 'kicked one column left');
});

test('rotation fails when no kick fits', () => {
  const game = new Game(mulberry32(8));
  game.piece = { type: 'T', rotation: 0, x: 3, y: 10 };
  // Wall in a 3-wide corridor so no kick can place the vertical T... use a
  // fully walled box instead: surround the piece so every kick collides.
  for (let y = 9; y <= 13; y++) {
    for (let x = 0; x <= 2; x++) game.board.set(x, y, 1);
    for (let x = 6; x <= 9; x++) game.board.set(x, y, 1);
  }
  game.board.set(3, 9, 1);
  game.board.set(3, 12, 1);
  game.board.set(4, 9, 1);
  game.board.set(4, 12, 1);
  game.board.set(5, 9, 1);
  game.board.set(5, 12, 1);
  assert(!game.rotate(1), 'rotation boxed in on all sides should fail');
  eq(game.piece!.rotation, 0, 'rotation unchanged');
});

test('lock delay holds a grounded piece before locking', () => {
  const game = new Game(mulberry32(9));
  game.piece = { type: 'O', rotation: 0, x: 4, y: HEIGHT - 2 };
  game.update(LOCK_DELAY * 0.6);
  assert(game.board.grid[HEIGHT - 1][4] === 0, 'not locked before the delay');
  game.update(LOCK_DELAY * 0.6);
  assert(game.board.grid[HEIGHT - 1][4] !== 0, 'locked after the delay');
});

test('move resets the lock delay up to the guideline cap', () => {
  const game = new Game(mulberry32(10));
  game.piece = { type: 'O', rotation: 0, x: 4, y: HEIGHT - 2 };
  const lockedCount = () => game.board.grid.flat().filter((v) => v !== 0).length;
  for (let i = 0; i < 15; i++) {
    game.update(LOCK_DELAY * 0.8);
    eq(lockedCount(), 0, `move ${i} should reset the delay`);
    game.move(i % 2 === 0 ? -1 : 1);
  }
  game.update(LOCK_DELAY * 0.8);
  game.move(-1);
  game.update(LOCK_DELAY * 0.8); // resets exhausted: delay no longer resets
  eq(lockedCount(), 4, 'locks once resets are exhausted');
});

test('top-out ends the game when the spawn is blocked', () => {
  const game = new Game(mulberry32(11));
  // Block the T spawn cells (4,2), (3,3), (4,3), (5,3).
  game.board.set(4, 2, 1);
  game.board.set(3, 3, 1);
  game.board.set(4, 3, 1);
  game.board.set(5, 3, 1);
  game.nextQueue = ['T'];
  game.piece = { type: 'I', rotation: 0, x: 0, y: 10 };
  game.hardDrop();
  eq(game.state, 'over', 'blocked spawn ends the game');
  game.restart();
  eq(game.state, 'playing', 'restart resumes play');
  eq(game.score, 0, 'restart resets the score');
  eq(game.board.grid.flat().filter((v) => v !== 0).length, 0, 'restart clears the board');
});

test('locking entirely inside the buffer is a lock-out game over', () => {
  const game = new Game(mulberry32(12));
  // Fill the whole visible field so a piece can only lock above it.
  for (let y = 4; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) game.board.set(x, y, 1);
  }
  game.piece = { type: 'O', rotation: 0, x: 4, y: 0 };
  game.hardDrop();
  // The O stops on top of the stack at buffer rows 2-3 -> lock out.
  eq(game.state, 'over', 'lock out ends the game');
});

if (failed > 0) {
  console.error(`\n${failed} of ${passed + failed} tests failed`);
  process.exit(1);
}
console.log(`\nAll ${passed} tests passed`);
