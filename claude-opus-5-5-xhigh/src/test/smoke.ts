// Headless smoke tests for the game logic. Run with `npm test`.
import { Board, COLS, HIDDEN_ROWS } from '../board.js';
import { Game, LOCK_DELAY, MAX_LOCK_RESETS, gravityInterval } from '../game.js';
import { PIECE_TYPES, SHAPES, type PieceType, type Point } from '../pieces.js';
import { Bag, type PieceSource } from '../randomizer.js';

declare const process: { exitCode?: number };

const tests: [name: string, run: () => void][] = [];

function test(name: string, run: () => void): void {
  tests.push([name, run]);
}

function assertEqual<T>(actual: T, expected: T, message = 'value'): void {
  const [a, e] = [JSON.stringify(actual), JSON.stringify(expected)];
  if (a !== e) throw new Error(`${message}: expected ${e}, got ${a}`);
}

/** Deals the given pieces in order, repeating forever. */
function sequence(...types: PieceType[]): PieceSource {
  let index = 0;
  return {
    next: () => types[index++ % types.length],
    peek: (count) => Array.from({ length: count }, (_, k) => types[(index + k) % types.length]),
  };
}

/** Deterministic PRNG (mulberry32) so randomizer tests are repeatable. */
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fills rows `from..to` (inclusive) except for the `gaps` columns. */
function fillRows(board: Board, from: number, to: number, gaps: number[]): void {
  for (let y = from; y <= to; y++) {
    for (let x = 0; x < COLS; x++) board.set(x, y, gaps.includes(x) ? null : 'Z');
  }
}

function sorted(points: readonly Point[]): Point[] {
  return [...points].sort((a, b) => a[1] - b[1] || a[0] - b[0]);
}

/** Soft drops the active piece in small steps until it rests on the stack. */
function land(game: Game): void {
  game.setSoftDrop(true);
  while (game.active && game.active.y < game.ghostY()) game.update(10);
  game.setSoftDrop(false);
}

test('7-bag deals every piece exactly once per bag', () => {
  const bag = new Bag(seededRandom(42));
  for (let round = 0; round < 20; round++) {
    const dealt = Array.from({ length: 7 }, () => bag.next());
    assertEqual([...dealt].sort(), [...PIECE_TYPES].sort(), `bag ${round}`);
  }
});

test('next queue preview matches the dealt pieces', () => {
  const bag = new Bag(seededRandom(7));
  const preview = bag.peek(12);
  assertEqual(Array.from({ length: 12 }, () => bag.next()), preview);
});

test('SRS rotation states', () => {
  assertEqual(sorted(SHAPES.I[1]), [[2, 0], [2, 1], [2, 2], [2, 3]], 'I clockwise');
  assertEqual(sorted(SHAPES.I[3]), [[1, 0], [1, 1], [1, 2], [1, 3]], 'I counter-clockwise');
  assertEqual(sorted(SHAPES.T[1]), [[1, 0], [1, 1], [2, 1], [1, 2]], 'T clockwise');
  assertEqual(sorted(SHAPES.T[2]), [[0, 1], [1, 1], [2, 1], [1, 2]], 'T 180');
  assertEqual(sorted(SHAPES.O[1]), sorted(SHAPES.O[0]), 'O never changes');
});

test('pieces spawn centered above the field and drop one row', () => {
  assertEqual(new Game(sequence('T')).active, { type: 'T', rotation: 0, x: 3, y: HIDDEN_ROWS - 1 });
  assertEqual(new Game(sequence('O')).active?.x, 4, 'O column');
  assertEqual(new Game(sequence('I')).active?.y, HIDDEN_ROWS - 1, 'I row');
});

test('wall kicks push rotating pieces off the walls', () => {
  const game = new Game(sequence('T'));
  game.active = { type: 'T', rotation: 1, x: -1, y: 30 };
  assertEqual(game.rotate(-1), true, 'T rotated');
  assertEqual(game.active, { type: 'T', rotation: 0, x: 0, y: 30 }, 'T kicked right');

  game.active = { type: 'I', rotation: 1, x: 7, y: 30 };
  assertEqual(game.rotate(1), true, 'I rotated');
  assertEqual(game.active, { type: 'I', rotation: 2, x: 6, y: 30 }, 'I kicked left');
});

test('soft drop falls 20x faster and scores 1 point per row', () => {
  const game = new Game(sequence('O'));
  const startY = game.active!.y;
  game.setSoftDrop(true);
  game.update(gravityInterval(1) / 20);
  assertEqual(game.active!.y, startY + 2, 'rows dropped');
  assertEqual(game.score, 2, 'score');
});

test('hard drop scores 2 points per row and locks immediately', () => {
  const game = new Game(sequence('O', 'T'));
  const distance = game.ghostY() - game.active!.y;
  game.hardDrop();
  assertEqual(game.score, 2 * distance, 'score');
  assertEqual(game.board.get(4, 39), 'O', 'locked cell');
  assertEqual(game.active?.type, 'T', 'next piece');
});

test('lock delay is 500 ms and movement resets it', () => {
  const game = new Game(sequence('O', 'T'));
  land(game);
  game.update(LOCK_DELAY - 20);
  assertEqual(game.active?.type, 'O', 'still falling piece');
  game.shift(-1);
  game.update(LOCK_DELAY - 20);
  assertEqual(game.active?.type, 'O', 'timer was reset');
  game.update(20);
  assertEqual(game.active?.type, 'T', 'locked after delay');
});

test(`lock delay resets are limited to ${MAX_LOCK_RESETS}`, () => {
  const game = new Game(sequence('O', 'T'));
  land(game);
  for (let i = 0; i < MAX_LOCK_RESETS - 1; i++) game.shift(i % 2 === 0 ? -1 : 1);
  game.update(1);
  assertEqual(game.active?.type, 'O', 'resets left');
  game.shift(1);
  game.update(1);
  assertEqual(game.active?.type, 'T', 'locked once resets ran out');
});

test('hold swaps once per piece', () => {
  const game = new Game(sequence('T', 'I', 'O'));
  assertEqual(game.hold(), true, 'first hold');
  assertEqual([game.held, game.active?.type], ['T', 'I']);
  assertEqual(game.hold(), false, 'second hold before locking');
  game.hardDrop();
  assertEqual(game.hold(), true, 'hold after locking');
  assertEqual([game.held, game.active?.type], ['O', 'T']);
});

test('tetris, back-to-back and combo scoring', () => {
  const game = new Game(sequence('I'));
  fillRows(game.board, 36, 39, [9]);
  game.active = { type: 'I', rotation: 1, x: 7, y: 36 };
  game.hardDrop();
  assertEqual([game.score, game.lines], [800, 4], 'tetris');

  fillRows(game.board, 36, 39, [9]);
  game.active = { type: 'I', rotation: 1, x: 7, y: 36 };
  game.hardDrop();
  assertEqual(game.score, 800 + 800 * 1.5 + 50, 'back-to-back tetris with combo');
  assertEqual(game.lastAction?.labels, ['Back-to-Back', 'Tetris', 'Combo ×1'], 'labels');
});

test('level goes up every 10 lines', () => {
  const game = new Game(sequence('I'));
  for (let i = 0; i < 3; i++) {
    fillRows(game.board, 36, 39, [9]);
    game.active = { type: 'I', rotation: 1, x: 7, y: 36 };
    game.hardDrop();
  }
  assertEqual([game.lines, game.level], [12, 2]);
});

test('T-spin double is detected with the 3-corner rule', () => {
  const game = new Game(sequence('T'));
  // Slot for a T pointing down, with an overhang over its left corner.
  fillRows(game.board, 39, 39, [4]);
  fillRows(game.board, 38, 38, [3, 4, 5]);
  game.board.set(3, 37, 'Z');
  game.active = { type: 'T', rotation: 1, x: 3, y: 37 };
  assertEqual(game.rotate(1), true, 'rotated into the slot');
  game.hardDrop();
  assertEqual(game.lastAction?.labels, ['T-Spin Double'], 'labels');
  assertEqual([game.score, game.lines], [1200, 2], 'score and lines');
});

test('gravity follows the Guideline curve', () => {
  assertEqual(gravityInterval(1), 1000, 'level 1');
  assertEqual(Math.round(gravityInterval(2)), 793, 'level 2');
  assertEqual(Math.round(gravityInterval(15) * 100) / 100, 7.06, 'level 15');
});

test('locking above the visible field ends the game (lock out)', () => {
  const game = new Game(sequence('O'));
  let drops = 0;
  while (game.state === 'playing' && drops < 50) {
    game.hardDrop();
    drops++;
  }
  assertEqual([game.state, drops], ['over', 11]);
  assertEqual(game.shift(-1), false, 'no moves after game over');
});

test('a blocked spawn ends the game (block out)', () => {
  const game = new Game(sequence('O'));
  game.board.set(4, HIDDEN_ROWS - 2, 'Z');
  game.hardDrop();
  assertEqual([game.state, game.active], ['over', null]);
});

let failed = 0;
for (const [name, run] of tests) {
  try {
    run();
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failed++;
    console.error(`  ✗ ${name}\n      ${error instanceof Error ? error.message : String(error)}`);
  }
}
console.log(`\n${tests.length - failed}/${tests.length} tests passed`);
if (failed > 0) process.exitCode = 1;
