import { Board } from '../board.js';
import { Game } from '../game.js';
import { SevenBagRandomizer } from '../randomizer.js';
import { PIECE_TYPES } from '../tetromino.js';

let passed = 0;
let failed = 0;
const failures: string[] = [];

function test(name: string, fn: () => void): void {
  try {
    fn();
    passed++;
    console.log(`  ok  ${name}`);
  } catch (err) {
    failed++;
    const msg = err instanceof Error ? err.message : String(err);
    failures.push(`${name}: ${msg}`);
    console.error(`FAIL  ${name} — ${msg}`);
  }
}

function assert(condition: unknown, msg: string): void {
  if (!condition) throw new Error(msg);
}

function assertEq(actual: unknown, expected: unknown, msg = ''): void {
  if (actual !== expected) {
    throw new Error(`${msg} — expected ${String(expected)}, got ${String(actual)}`);
  }
}

test('7-bag: 14 draws are two complete sets of all seven pieces', () => {
  const bag = new SevenBagRandomizer();
  const counts: Record<string, number> = {};
  for (let i = 0; i < 14; i++) {
    const type = bag.next();
    counts[type] = (counts[type] ?? 0) + 1;
  }
  for (const type of PIECE_TYPES) assertEq(counts[type], 2, `piece ${type}`);
});

test('board: bounds count as occupied; line clears shift the stack down', () => {
  const board = new Board();
  assert(board.isOccupied(-1, 0) && board.isOccupied(10, 0), 'walls are solid');
  assert(board.isOccupied(0, 22) && board.isOccupied(0, -1), 'floor and ceiling are solid');
  assert(!board.isOccupied(5, 5), 'empty cell is free');
  for (let x = 0; x < 10; x++) board.set(x, 21, 'J');
  board.set(4, 20, 'T');
  assertEq(board.clearLines(), 1, 'one full row');
  assertEq(board.get(4, 21), 'T', 'row above shifted down');
  assertEq(board.get(4, 20), null, 'old position emptied');
});

test('movement: pieces stop at the side walls', () => {
  const game = new Game();
  const startY = game.current!.y;
  let leftCount = 0;
  while (game.moveLeft()) leftCount++;
  assert(!game.moveLeft(), 'left blocked at the left wall');
  let rightCount = 0;
  while (game.moveRight()) rightCount++;
  assert(!game.moveRight(), 'right blocked at the right wall');
  assert(leftCount > 0 && rightCount > 0, 'moves should succeed');
  assertEq(game.current!.y, startY, 'horizontal moves never drop the piece');
});

test('gravity: one row per interval, 20× faster while soft dropping', () => {
  const game = new Game();
  assertEq(game.current!.y, 1, 'piece drops one row right after spawn');
  game.update(999);
  assertEq(game.current!.y, 1, 'no fall before the interval elapses');
  game.update(1);
  assertEq(game.current!.y, 2, 'one row after 1s at level 1');
  game.softDropping = true;
  game.update(50);
  assertEq(game.current!.y, 3, 'soft drop interval is gravity / 20');
  assertEq(game.score, 1, 'soft drop awards one point per row');
});

test('ghost: matches the landing row on an empty board', () => {
  const game = new Game();
  assertEq(game.ghostY(), 20, 'every piece lands on row 20 of 0..21');
});

test('SRS wall kicks: rotation is nudged sideways when blocked', () => {
  const game = new Game();
  // A floor under and right of a T that wants to rotate clockwise.
  for (let x = 5; x < 10; x++) game.board.set(x, 20, 'J');
  game.current = { type: 'T', rotation: 0, x: 4, y: 18 };
  assert(game.rotate(1), 'rotation succeeds via kick');
  assertEq(game.current.rotation, 1);
  assertEq(game.current.x, 3, 'kicked one column left');
  assertEq(game.current.y, 18, 'same row');
});

test('T-spin: rotating into a three-corner slot scores a T-spin', () => {
  const game = new Game();
  game.board.set(4, 17, 'J');
  game.board.set(6, 17, 'J');
  game.board.set(4, 19, 'J');
  game.board.set(6, 19, 'J');
  game.current = { type: 'T', rotation: 3, x: 4, y: 17 };
  assert(game.rotate(1), 'rotate into the slot');
  game.lockPiece();
  assertEq(game.score, 400, 'T-spin with no lines = 400 × level 1');
  assert((game.lastClearText ?? '').includes('T-SPIN'), `banner text: ${game.lastClearText}`);
  assertEq(game.combo, -1, 'a lock without clears breaks the combo');
});

test('scoring: tetris, back-to-back, combo and level progression', () => {
  const game = new Game();
  const dropTetris = () => {
    for (let y = 18; y <= 21; y++) {
      for (let x = 0; x <= 8; x++) game.board.set(x, y, 'J');
    }
    game.current = { type: 'I', rotation: 1, x: 7, y: 0 };
    game.hardDrop();
  };
  dropTetris();
  assertEq(game.lines, 4);
  assertEq(game.score, 836, 'tetris 1 (800 + 2×18 hard drop)');
  dropTetris();
  assertEq(game.lines, 8);
  assertEq(game.score, 2122, 'tetris 2 (×1.5 B2B + 50 combo + 36)');
  dropTetris();
  assertEq(game.lines, 12);
  assertEq(game.level, 2, 'level up after 10 lines');
  assertEq(game.score, 3458, 'tetris 3 (B2B + combo ×2 at level 1 + 36)');
  assertEq(game.combo, 2);
  assert(game.backToBack, 'back-to-back chain holds');
});

test('hold: one swap per piece, exchanged again after the next lock', () => {
  const game = new Game();
  assertEq(game.queue.length, 5, 'queue stays full');
  const first = game.current!.type;
  const second = game.queue[0];
  game.holdPiece();
  assertEq(game.hold, first, 'active piece moved to hold');
  assertEq(game.current!.type, second, 'next piece became active');
  assert(!game.canHold, 'hold locked until the next lock');
  game.holdPiece();
  assertEq(game.current!.type, second, 'second hold without a lock is ignored');
  game.hardDrop();
  assert(game.canHold, 'hold re-enabled after locking');
  const third = game.current!.type;
  game.holdPiece();
  assertEq(game.hold, third, 'swapped piece stored');
  assertEq(game.current!.type, first, 'held piece back in play');
});

test('lock delay: 500 ms on the floor, reset by moves up to 15 times', () => {
  const game = new Game();
  game.current = { type: 'J', rotation: 0, x: 3, y: 20 };
  const jLocked = () => {
    for (let y = 20; y <= 21; y++) {
      for (let x = 0; x < 10; x++) {
        if (game.board.get(x, y) === 'J') return true;
      }
    }
    return false;
  };
  game.update(400);
  assert(!jLocked(), 'not locked before the delay expires');
  for (let i = 0; i < 15; i++) {
    assert(game.moveLeft() || game.moveRight(), 'move succeeds');
    game.update(400);
    assert(!jLocked(), `survives reset ${i + 1}`);
  }
  assert(game.moveLeft() || game.moveRight(), '16th move succeeds');
  game.update(200);
  assert(jLocked(), 'locks once the reset budget is spent');
});

test('top-out: a blocked spawn ends the game', () => {
  const game = new Game();
  // Wall off both hidden spawn rows while keeping every row clearable (not full).
  for (let y = 0; y <= 1; y++) {
    for (let x = 1; x < 10; x++) game.board.set(x, y, 'J');
  }
  game.lockPiece(); // locks the spawn piece, then tries to spawn the next one
  assertEq(game.status, 'gameover', 'blocked spawn must end the game');
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  throw new Error(`smoke tests failed:\n  - ${failures.join('\n  - ')}`);
}
