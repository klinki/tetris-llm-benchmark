// Headless smoke tests for the game logic. Run with `npm test`.
import { Board, COLS, ROWS } from '../board.js';
import { Game, LOCK_DELAY, MAX_LOCK_RESETS, PREVIEW_COUNT } from '../game.js';
import { PIECE_TYPES, kicksFor, pieceCells, type PieceType } from '../pieces.js';
import { SevenBag } from '../randomizer.js';
import { clearPoints, gravityInterval, levelForLines } from '../scoring.js';

const tests: [string, () => void][] = [];
const test = (name: string, fn: () => void) => tests.push([name, fn]);

function expect<T>(actual: T, expected: T, what = ''): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${what} expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

/** Small deterministic random generator so failures are reproducible. */
function seeded(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A fresh game whose current piece is replaced by `type` at the given position. */
function gameWith(type: PieceType, x: number, y: number, rotation: 0 | 1 | 2 | 3 = 0): Game {
  const game = new Game(seeded(1));
  game.current = { type, rotation, x, y };
  return game;
}

/** Fills row `y` completely except for the columns listed in `gaps`. */
function fillRow(board: Board, y: number, gaps: number[] = []): void {
  for (let x = 0; x < COLS; x++) if (!gaps.includes(x)) board.set(x, y, 'J');
}

// ---- Pieces -------------------------------------------------------------------------------------

test('every piece has four cells in every rotation', () => {
  for (const type of PIECE_TYPES) {
    for (const r of [0, 1, 2, 3] as const) expect(pieceCells(type, r).length, 4, `${type}${r}`);
  }
});

const sortedCells = (type: PieceType, r: 0 | 1 | 2 | 3) => pieceCells(type, r).map(([x, y]) => `${x},${y}`).sort();

test('T rotates clockwise from pointing up to pointing right', () => {
  expect(sortedCells('T', 0), ['0,1', '1,0', '1,1', '2,1']);
  expect(sortedCells('T', 1), ['1,0', '1,1', '1,2', '2,1']);
});

test('O never changes shape and I turns vertical', () => {
  expect(sortedCells('O', 0), sortedCells('O', 1));
  expect(pieceCells('I', 1).map(([x]) => x), [2, 2, 2, 2]);
});

test('SRS kick tables are written for a y-down board', () => {
  expect(kicksFor('J', 0, true)[2], [-1, -1]); // Guideline (-1,+1) is one row up
  expect(kicksFor('I', 0, true)[1], [-2, 0]);
  expect(kicksFor('O', 2, false).length, 1);
});

// ---- Randomizer -----------------------------------------------------------------------------------

test('7-bag deals each piece once per seven draws', () => {
  const bag = new SevenBag(seeded(42));
  for (let i = 0; i < 5; i++) {
    const draw = Array.from({ length: 7 }, () => bag.next()).sort();
    expect(draw, [...PIECE_TYPES].sort(), `bag ${i}`);
  }
});

// ---- Board ----------------------------------------------------------------------------------------

test('walls and floor block pieces, space above does not', () => {
  const board = new Board();
  expect(board.isBlocked(-1, 5), true);
  expect(board.isBlocked(COLS, 5), true);
  expect(board.isBlocked(3, ROWS), true);
  expect(board.isBlocked(3, -1), false);
});

test('clearing lines drops the rows above', () => {
  const board = new Board();
  fillRow(board, ROWS - 1);
  fillRow(board, ROWS - 2, [0]);
  board.set(0, ROWS - 3, 'T');
  expect(board.clearLines(), 1);
  expect(board.get(0, ROWS - 2), 'T' as PieceType | null);
  expect(board.get(1, ROWS - 1), 'J' as PieceType | null);
  expect(board.get(0, ROWS - 1), null);
});

// ---- Scoring --------------------------------------------------------------------------------------

test('line clear scoring follows the Guideline', () => {
  const base = { level: 1, backToBack: false, combo: 0, perfectClear: false, tspin: 'none' as const };
  expect(clearPoints({ ...base, lines: 1 }), 100);
  expect(clearPoints({ ...base, lines: 4, level: 3 }), 2400);
  expect(clearPoints({ ...base, lines: 4, backToBack: true }), 1200);
  expect(clearPoints({ ...base, lines: 2, combo: 2 }), 400);
  expect(clearPoints({ ...base, lines: 2, tspin: 'full' }), 1200);
  expect(clearPoints({ ...base, lines: 0, tspin: 'mini' }), 100);
});

test('levels and gravity speed up', () => {
  expect(levelForLines(9), 1);
  expect(levelForLines(10), 2);
  expect(gravityInterval(1), 1000);
  expect(gravityInterval(2) < gravityInterval(1), true);
  expect(gravityInterval(15) < gravityInterval(10), true);
});

// ---- Game -----------------------------------------------------------------------------------------

test('new game spawns in the middle, already dropped one row', () => {
  const game = new Game(seeded(3));
  expect(game.current.x === 3 || game.current.x === 4, true);
  expect(game.current.y, 1);
  expect(game.queue.length, PREVIEW_COUNT);
  expect(game.status, 'playing');
});

test('gravity pulls the piece down one row per interval', () => {
  const game = new Game(seeded(3));
  const y = game.current.y;
  game.update(999);
  expect(game.current.y, y);
  game.update(1);
  expect(game.current.y, y + 1);
});

test('soft drop is faster and scores a point per row', () => {
  const game = new Game(seeded(3));
  game.setSoftDrop(true);
  game.update(100);
  expect(game.score, 2);
});

test('hard drop lands on the floor, scores two per row and spawns the next piece', () => {
  const game = gameWith('I', 3, 1);
  const next = game.queue[0];
  game.hardDrop();
  expect(game.board.get(3, ROWS - 1), 'I' as PieceType | null);
  expect(game.score, 2 * (ROWS - 3));
  expect(game.current.type, next);
});

test('ghost piece sits where a hard drop would land', () => {
  const game = gameWith('O', 4, 1);
  game.board.set(4, 15, 'Z');
  expect(game.ghostY(), 13);
});

test('hold swaps once per piece', () => {
  const game = new Game(seeded(5));
  const first = game.current.type;
  const second = game.queue[0];
  game.holdPiece();
  expect(game.held, first as PieceType | null);
  expect(game.current.type, second);
  game.holdPiece(); // not allowed again before locking
  expect(game.current.type, second);
  expect(game.held, first as PieceType | null);
  game.hardDrop();
  const third = game.current.type;
  game.holdPiece();
  expect(game.current.type, first);
  expect(game.held, third as PieceType | null);
});

test('piece locks after the lock delay', () => {
  const game = gameWith('O', 4, ROWS - 2);
  game.update(LOCK_DELAY - 1);
  expect(game.board.get(4, ROWS - 1), null);
  game.update(1);
  expect(game.board.get(4, ROWS - 1), 'O' as PieceType | null);
});

test('moving a resting piece restarts the lock delay, but only a limited number of times', () => {
  const game = gameWith('O', 4, ROWS - 2);
  game.update(LOCK_DELAY - 1);
  game.moveLeft();
  game.update(LOCK_DELAY - 1);
  expect(game.board.get(3, ROWS - 1), null);

  for (let i = 0; i < MAX_LOCK_RESETS; i++) {
    game.moveRight();
    game.moveLeft();
  }
  game.update(LOCK_DELAY); // resets are used up
  expect(game.board.get(3, ROWS - 1) ?? game.board.get(4, ROWS - 1), 'O' as PieceType | null);
});

test('rotation uses wall kicks', () => {
  const game = gameWith('T', -1, 10, 1); // pointing right, hugging the left wall
  expect(game.rotate(true), true);
  expect(game.current.rotation, 2);
  expect(game.current.x, 0);
});

test('rotation fails when every kick is blocked', () => {
  const game = gameWith('I', 3, 10);
  for (let x = 0; x < COLS; x++) for (let y = 7; y < 14; y++) if (y !== 11) game.board.set(x, y, 'J');
  expect(game.rotate(true), false);
  expect(game.current.rotation, 0);
});

test('vertical I clears four lines for a Tetris', () => {
  const game = gameWith('I', 7, 18, 1);
  for (let y = 18; y < 22; y++) fillRow(game.board, y, [9]);
  game.board.set(0, 17, 'Z'); // keep the board non-empty: no perfect clear
  game.hardDrop();
  expect(game.lines, 4);
  expect(game.score, 800);
  expect(game.board.get(0, ROWS - 1), 'Z' as PieceType | null);
});

test('a T rotated into a closed slot is a T-spin double', () => {
  const game = gameWith('T', 3, 19);
  fillRow(game.board, 21, [4]);
  fillRow(game.board, 20, [3, 4, 5]);
  game.board.set(3, 19, 'J'); // overhang
  expect(game.rotate(true), true);
  expect(game.rotate(true), true);
  expect(game.current.rotation, 2);
  game.hardDrop();
  expect(game.lines, 2);
  expect(game.score, 1200);
});

test('the same slot without a final rotation is only a double', () => {
  const game = gameWith('T', 3, 19, 2);
  fillRow(game.board, 21, [4]);
  fillRow(game.board, 20, [3, 4, 5]);
  game.board.set(3, 19, 'J');
  game.hardDrop();
  expect(game.score, 300);
});

test('a blocked spawn ends the game, and R restarts it', () => {
  const game = gameWith('O', 4, 10);
  game.board.set(4, 1, 'Z');
  game.hardDrop();
  expect(game.status, 'gameover');
  game.update(5000);
  expect(game.moveLeft(), false);
  game.restart();
  expect(game.status, 'playing');
  expect(game.score, 0);
  expect(game.board.isEmpty(), true);
});

test('pause freezes the game', () => {
  const game = new Game(seeded(3));
  const y = game.current.y;
  game.togglePause();
  game.update(5000);
  expect(game.current.y, y);
  game.togglePause();
  game.update(1000);
  expect(game.current.y, y + 1);
});

// ---- Runner ---------------------------------------------------------------------------------------

let failed = 0;
for (const [name, fn] of tests) {
  try {
    fn();
    console.log(`ok   ${name}`);
  } catch (error) {
    failed++;
    console.log(`FAIL ${name}\n     ${(error as Error).message}`);
  }
}
console.log(`\n${tests.length - failed}/${tests.length} tests passed`);
if (failed > 0) throw new Error(`${failed} test(s) failed`);
