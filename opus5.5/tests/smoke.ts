// Headless logic tests. Run with `npm test`.

import { Bag } from '../src/bag.js';
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  Game,
  gravityIntervalMs,
  HIDDEN_ROWS,
  LOCK_DELAY_MS,
  MAX_LOCK_RESETS,
} from '../src/game.js';
import { PIECE_TYPES, pieceCells, PieceType } from '../src/pieces.js';

declare const process: { exitCode?: number };

let failures = 0;
function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`ok   ${name}`);
  } catch (error) {
    failures++;
    console.log(`FAIL ${name}\n     ${error instanceof Error ? error.message : String(error)}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message = ''): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${message} expected ${e}, got ${a}`);
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

/** Deterministic PRNG (mulberry32). */
function seeded(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function newGame(): Game {
  return new Game(seeded(42));
}

/** Clears the board and places a specific piece. */
function withPiece(game: Game, type: PieceType, rotation: 0 | 1 | 2 | 3, x: number, y: number): void {
  game.board = Array.from({ length: BOARD_HEIGHT }, () => new Array(BOARD_WIDTH).fill(null));
  game.active = { type, rotation, x, y };
}

/** Fills the given board row except for the listed columns. */
function fillRow(game: Game, y: number, holes: number[]): void {
  for (let x = 0; x < BOARD_WIDTH; x++) game.board[y][x] = holes.includes(x) ? null : 'Z';
}

test('7-bag yields every piece once per bag', () => {
  const bag = new Bag(seeded(7));
  for (let round = 0; round < 10; round++) {
    const pieces = Array.from({ length: 7 }, () => bag.next()).sort();
    assertEqual(pieces, PIECE_TYPES.slice().sort());
  }
});

test('pieces spawn in the middle and drop one row into view', () => {
  const game = newGame();
  const piece = game.active!;
  const cols = game.cellsOf(piece).map((c) => c.x);
  if (piece.type === 'O') assertEqual([Math.min(...cols), Math.max(...cols)], [4, 5]);
  else if (piece.type === 'I') assertEqual([Math.min(...cols), Math.max(...cols)], [3, 6]);
  else assertEqual([Math.min(...cols), Math.max(...cols)], [3, 5]);
  const lowest = Math.max(...game.cellsOf(piece).map((c) => c.y));
  assertEqual(lowest, HIDDEN_ROWS, 'lowest spawn row is the top visible row;');
  assertEqual(game.queue.length, 5);
});

test('rotation states follow SRS for the I piece', () => {
  const game = newGame();
  withPiece(game, 'I', 0, 3, 30);
  game.rotateClockwise();
  assertEqual(game.cellsOf(game.active!).map((c) => c.x), [5, 5, 5, 5]);
  game.rotateClockwise();
  assertEqual(game.cellsOf(game.active!).map((c) => c.y), [32, 32, 32, 32]);
});

test('SRS wall kick moves a T away from the left wall', () => {
  const game = newGame();
  withPiece(game, 'T', 1, -1, 30);
  assert(game.rotateClockwise(), 'rotation should succeed via kick');
  assertEqual({ x: game.active!.x, y: game.active!.y, r: game.active!.rotation }, { x: 0, y: 30, r: 2 });
});

test('O piece does not move when rotated', () => {
  const game = newGame();
  withPiece(game, 'O', 0, 4, 30);
  const before = game.cellsOf(game.active!);
  game.rotateClockwise();
  assertEqual(game.cellsOf(game.active!).sort((a, b) => a.x - b.x || a.y - b.y), before.sort((a, b) => a.x - b.x || a.y - b.y));
});

test('movement is blocked by walls', () => {
  const game = newGame();
  withPiece(game, 'O', 0, 0, 30);
  assert(!game.moveLeft(), 'cannot move into left wall');
  withPiece(game, 'O', 0, 8, 30);
  assert(!game.moveRight(), 'cannot move into right wall');
});

test('gravity follows the Guideline curve', () => {
  assertEqual(gravityIntervalMs(1), 1000);
  assert(Math.abs(gravityIntervalMs(2) - 793) < 1, 'level 2 is ~0.793s/row');
  const game = newGame();
  withPiece(game, 'T', 0, 3, 20);
  game.update(999);
  assertEqual(game.active!.y, 20);
  game.update(1);
  assertEqual(game.active!.y, 21);
});

test('soft drop is 20x faster and scores 1 point per row', () => {
  const game = newGame();
  withPiece(game, 'T', 0, 3, 20);
  game.setSoftDrop(true);
  game.update(50);
  game.update(50);
  assertEqual(game.active!.y, 22);
  assertEqual(game.score, 2);
});

test('hard drop scores 2 points per row and locks', () => {
  const game = newGame();
  withPiece(game, 'O', 0, 0, 30);
  game.hardDrop();
  assertEqual(game.score, 2 * 8);
  assertEqual(game.board[39][0], 'O');
  assertEqual(game.board[38][1], 'O');
});

test('lock delay is 500ms and moves reset it up to 15 times', () => {
  const game = newGame();
  withPiece(game, 'O', 0, 0, 38);
  game.update(LOCK_DELAY_MS - 1);
  assertEqual(game.board[39][0], null, 'not locked yet;');
  game.update(1);
  assertEqual(game.board[39][0], 'O', 'locked after delay;');

  withPiece(game, 'O', 0, 0, 38);
  for (let i = 0; i < MAX_LOCK_RESETS; i++) {
    game.update(LOCK_DELAY_MS - 10);
    if (i % 2 === 0) game.moveRight();
    else game.moveLeft();
  }
  assertEqual(game.board[39][0] ?? game.board[39][1], null, 'still active after 15 resets;');
  game.moveRight();
  assert(game.board[39].some((c) => c === 'O'), 'the 16th move on the ground locks immediately');
});

test('hold swaps pieces once per turn', () => {
  const game = newGame();
  const first = game.active!.type;
  const upcoming = game.queue[0];
  assert(game.holdPiece(), 'first hold works');
  assertEqual(game.hold, first);
  assertEqual(game.active!.type, upcoming);
  assert(!game.holdPiece(), 'second hold in the same turn is rejected');
  game.hardDrop();
  const third = game.active!.type;
  assert(game.holdPiece(), 'hold available again after lock');
  assertEqual(game.active!.type, first);
  assertEqual(game.active!.rotation, 0);
  assertEqual(game.hold, third);
});

test('line clears score by level, combo and back-to-back tetris', () => {
  const game = newGame();
  withPiece(game, 'I', 1, -2, 20);
  for (let y = 32; y < BOARD_HEIGHT; y++) fillRow(game, y, [0]);
  game.hardDrop();
  assertEqual(game.lines, 4);
  assertEqual(game.lastClear!.points, 800);
  const after = game.score;

  game.active = { type: 'I', rotation: 1, x: -2, y: 20 };
  game.hardDrop();
  assertEqual(game.lines, 8);
  // B2B tetris 800*1.5 + combo 50*1 + B2B perfect-clear tetris 3200.
  assertEqual(game.lastClear!.backToBack, true);
  assertEqual(game.lastClear!.perfectClear, true);
  assertEqual(game.lastClear!.points, 1200 + 50 + 3200);
  assert(game.score > after, 'score increases');
});

test('single clear breaks back-to-back and levels advance every 10 lines', () => {
  const game = newGame();
  game.backToBack = true;
  game.lines = 9;
  withPiece(game, 'I', 0, 0, 30);
  fillRow(game, 39, [0, 1, 2, 3]);
  fillRow(game, 38, [0, 1, 2, 3, 4, 5]);
  game.hardDrop();
  assertEqual(game.lastClear!.points, 100);
  assertEqual(game.backToBack, false);
  assertEqual(game.level, 2);
});

test('T-spin double is detected with the three-corner rule', () => {
  const game = newGame();
  withPiece(game, 'T', 1, 3, 37);
  fillRow(game, 39, [4]);
  fillRow(game, 38, [3, 4, 5]);
  game.board[37][3] = 'Z'; // overhang
  assert(game.rotateClockwise(), 'rotate into the slot');
  game.hardDrop();
  assertEqual(game.lastClear!.tSpin, 'full');
  assertEqual(game.lastClear!.lines, 2);
  assertEqual(game.lastClear!.points, 1200);
});

test('T-spin mini is detected when only back corners are filled', () => {
  const game = newGame();
  // Rotating CCW leaves the T pointing left with one front corner open.
  withPiece(game, 'T', 0, 7, 37);
  fillRow(game, 39, [7, 8, 9]);
  game.board[38][9] = null;
  for (let x = 0; x < 7; x++) game.board[38][x] = null;
  game.board[37][9] = 'Z';
  game.board[39][9] = 'Z';
  // Cells after CCW: (8,37),(7,38),(8,38),(8,39). Corners: (7,37) open, (9,37), (9,39), (7,39) filled.
  game.board[39][7] = 'Z';
  assert(game.rotateCounterClockwise(), 'rotation succeeds');
  assertEqual(game.active!.rotation, 3);
  game.hardDrop();
  assertEqual(game.lastClear!.tSpin, 'mini');
});

test('block out ends the game when spawn is obstructed; restart resets', () => {
  const game = newGame();
  withPiece(game, 'O', 0, 0, 38);
  for (let y = HIDDEN_ROWS - 2; y < HIDDEN_ROWS + 2; y++) {
    for (let x = 3; x <= 6; x++) game.board[y][x] = 'Z';
  }
  game.score = 123;
  game.hardDrop();
  assertEqual(game.status, 'gameover');
  game.moveLeft();
  game.update(10_000);
  assertEqual(game.status, 'gameover');
  game.restart();
  assertEqual(game.status, 'playing');
  assertEqual(game.score, 0);
  assert(game.board.every((row) => row.every((c) => c === null)), 'board cleared');
});

test('lock out ends the game when a piece locks above the visible field', () => {
  const game = newGame();
  withPiece(game, 'I', 1, -2, HIDDEN_ROWS - 4);
  for (let y = HIDDEN_ROWS; y < BOARD_HEIGHT; y++) game.board[y][0] = 'Z';
  game.hardDrop();
  assertEqual(game.status, 'gameover');
});

test('pause stops gravity', () => {
  const game = newGame();
  withPiece(game, 'T', 0, 3, 20);
  game.togglePause();
  game.update(5000);
  assertEqual(game.active!.y, 20);
  game.togglePause();
  game.update(1000);
  assertEqual(game.active!.y, 21);
});

test('every rotation of every piece has four cells', () => {
  for (const type of PIECE_TYPES) {
    for (const r of [0, 1, 2, 3] as const) assertEqual(pieceCells(type, r).length, 4);
  }
});

if (failures > 0) {
  console.log(`\n${failures} test(s) failed`);
  process.exitCode = 1;
} else {
  console.log('\nAll tests passed');
}
