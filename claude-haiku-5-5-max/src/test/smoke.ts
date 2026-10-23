import { Board } from '../board.js';
import { BOARD_HEIGHT, BOARD_WIDTH, SPAWN_ROW } from '../constants.js';
import { Game, gravityInterval, type PieceSource } from '../game.js';
import { offsetsOf, PIECE_TYPES, type PieceState, type PieceType } from '../pieces.js';
import { createSevenBag } from '../random.js';
import { Scorer } from '../scoring.js';
import { detectTSpin } from '../tspin.js';

/** Deals the given piece types in a repeating cycle. */
function sequence(...types: PieceType[]): PieceSource {
  let index = 0;
  return () => types[index++ % types.length];
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

const tests: [name: string, check: () => void][] = [];

function test(name: string, check: () => void): void {
  tests.push([name, check]);
}

test('the 7-bag deals every piece once in each bag of seven', () => {
  const next = createSevenBag(() => 0.42);
  const expected = [...PIECE_TYPES].sort().join('');
  for (let bag = 0; bag < 3; bag++) {
    const drawn = Array.from({ length: 7 }, () => next()).sort().join('');
    assertEqual(drawn, expected, `bag ${bag}`);
  }
});

test('shapes match the SRS rotation states', () => {
  const cells = (type: PieceType, rotation: 0 | 1 | 2 | 3) =>
    offsetsOf(type, rotation)
      .map(([x, y]) => `${x},${y}`)
      .sort()
      .join(' ');
  assertEqual(cells('T', 0), '0,1 1,0 1,1 2,1', 'T spawn');
  assertEqual(cells('T', 1), '1,0 1,1 1,2 2,1', 'T clockwise');
  assertEqual(cells('T', 2), '0,1 1,1 1,2 2,1', 'T half turn');
  assertEqual(cells('T', 3), '0,1 1,0 1,1 1,2', 'T counter-clockwise');
  assert(
    offsetsOf('I', 1).every(([x]) => x === 2) && offsetsOf('I', 1).length === 4,
    'I clockwise is the third column',
  );
});

test('a vertical I slides to the left wall and rotates there with a wall kick', () => {
  const game = new Game({ source: sequence('I') });
  game.rotate(1);
  for (let i = 0; i < 5; i++) game.move(-1);
  game.rotate(1);
  assertEqual(game.active?.rotation, 2, 'rotation after the kick');
  assertEqual(game.active?.x, 0, 'x after the kick');
});

test('gravity drops a piece one row per second at level 1', () => {
  const game = new Game({ source: sequence('O') });
  const start = game.active!.y;
  game.update(1);
  assertEqual(game.active?.y, start + 1, 'after one second');
  game.update(2);
  assertEqual(game.active?.y, start + 3, 'after three seconds');
});

test('gravity follows the Guideline formula and stays at 20G from level 20', () => {
  assertEqual(gravityInterval(1), 1, 'level 1');
  assert(Math.abs(gravityInterval(2) - 0.793) < 1e-9, 'level 2');
  assertEqual(gravityInterval(25), gravityInterval(20), 'levels above 20');
});

test('soft drop falls 20 rows per second and scores a point per row', () => {
  const game = new Game({ source: sequence('O') });
  game.setSoftDrop(true);
  game.update(0.52);
  assertEqual(game.active?.y, SPAWN_ROW + 10, 'rows fallen');
  assertEqual(game.score, 10, 'score');
});

test('hard drop lands the piece, scores two points per row and spawns the next piece', () => {
  const game = new Game({ source: sequence('O') });
  assertEqual(game.landingRow(), BOARD_HEIGHT - 2, 'ghost row');
  game.hardDrop();
  assertEqual(game.score, 38, 'score for 19 rows');
  assertEqual(game.board.cell(4, BOARD_HEIGHT - 1), 'O', 'piece is on the floor');
  assert(game.active !== null, 'next piece is spawned');
});

test('a piece that completes a row clears it and scores', () => {
  const game = new Game({ source: sequence('O') });
  for (let col = 0; col < BOARD_WIDTH; col++) {
    if (col !== 4 && col !== 5) game.board.setCell(col, BOARD_HEIGHT - 1, 'I');
  }
  game.hardDrop();
  assertEqual(game.lines, 1, 'lines cleared');
  assertEqual(game.score, 38 + 100, 'hard drop plus single');
});

test('line clears shift the rows above down', () => {
  const board = new Board();
  for (let col = 0; col < BOARD_WIDTH; col++) board.setCell(col, BOARD_HEIGHT - 1, 'I');
  board.setCell(0, BOARD_HEIGHT - 2, 'J');
  assertEqual(board.clearLines(), 1, 'cleared rows');
  assertEqual(board.cell(0, BOARD_HEIGHT - 1), 'J', 'row above moved down');
  assertEqual(board.cell(1, BOARD_HEIGHT - 1), null, 'empty cell');
});

test('line clears score the Guideline table at level 1', () => {
  [100, 300, 500, 800].forEach((points, index) => {
    assertEqual(new Scorer().lock(index + 1, 'none'), points, `${index + 1} lines`);
  });
});

test('combos add 50 per step and back-to-back Tetrises earn 1.5x', () => {
  const scorer = new Scorer();
  assertEqual(scorer.lock(1, 'none'), 100, 'first clear has no combo bonus');
  assertEqual(scorer.lock(1, 'none'), 150, 'second clear adds 50');
  assertEqual(scorer.lock(4, 'none'), 800 + 100, 'third clear adds 2 x 50');
  assertEqual(scorer.lock(4, 'none'), 1200 + 150, 'Tetris after a Tetris is 1.5x plus combo');
});

test('a non-difficult clear breaks the back-to-back chain', () => {
  const scorer = new Scorer();
  assertEqual(scorer.lock(4, 'none'), 800, 'first Tetris');
  assertEqual(scorer.lock(1, 'none'), 150, 'single breaks the chain');
  assertEqual(scorer.lock(4, 'none'), 800 + 100, 'Tetris gets no bonus');
});

test('T-spins score by lines cleared, and a T-spin counts as a difficult clear', () => {
  assertEqual(new Scorer().lock(0, 'full'), 400, 'T-spin, no lines');
  assertEqual(new Scorer().lock(1, 'full'), 800, 'T-spin single');
  assertEqual(new Scorer().lock(2, 'full'), 1200, 'T-spin double');
  assertEqual(new Scorer().lock(0, 'mini'), 100, 'mini T-spin, no lines');
  assertEqual(new Scorer().lock(1, 'mini'), 200, 'mini T-spin single');

  const scorer = new Scorer();
  scorer.lock(1, 'full');
  assertEqual(scorer.lock(4, 'none'), 1200 + 50, 'Tetris after a T-spin single');
});

test('level rises every ten lines', () => {
  const scorer = new Scorer();
  for (let i = 0; i < 9; i++) scorer.lock(1, 'none');
  assertEqual(scorer.level, 1, 'level after nine lines');
  scorer.lock(1, 'none');
  assertEqual(scorer.level, 2, 'level after ten lines');
});

test('a T that rotates into a pocket with three blocked corners is a full T-spin', () => {
  const board = new Board();
  // T pointing down at x=3, y=18, so its centre is (4, 19).
  board.setCell(3, 18, 'O');
  board.setCell(3, 20, 'O');
  board.setCell(5, 20, 'O');
  const piece: PieceState = { type: 'T', rotation: 2, x: 3, y: 18 };
  assert(board.canPlace(piece), 'the T fits in the pocket');
  assertEqual(detectTSpin(board, piece, 0), 'full', 'both front corners blocked');
});

test('with only one front corner blocked the T-spin is a mini unless the last kick was used', () => {
  const board = new Board();
  board.setCell(3, 18, 'O');
  board.setCell(5, 18, 'O');
  board.setCell(3, 20, 'O');
  const piece: PieceState = { type: 'T', rotation: 2, x: 3, y: 18 };
  assertEqual(detectTSpin(board, piece, 0), 'mini', 'one front corner blocked');
  assertEqual(detectTSpin(board, piece, 4), 'full', 'last kick test promotes to full');

  const open = new Board();
  open.setCell(3, 18, 'O');
  open.setCell(3, 20, 'O');
  assertEqual(detectTSpin(open, piece, 0), 'none', 'only two corners blocked');
});

test('the lock delay locks a grounded piece, and a move restarts it', () => {
  const game = new Game({ source: sequence('O') });
  while (game.landingRow() !== game.active!.y) game.update(0.1);
  const landedRow = game.active!.y;

  game.update(0.3);
  assertEqual(game.active?.y, landedRow, 'not locked before the delay');
  game.move(-1);
  game.update(0.4);
  assertEqual(game.active?.y, landedRow, 'move restarted the delay');
  game.update(0.2);
  assertEqual(game.active?.y, SPAWN_ROW, 'locked, and the next piece spawned');
});

test('a hold swaps pieces, but only once per lock', () => {
  const game = new Game({ source: sequence('T', 'I', 'O') });
  game.hold();
  assertEqual(game.held, 'T', 'T is held');
  assertEqual(game.active?.type, 'I', 'I spawns');
  game.hold();
  assertEqual(game.held, 'T', 'second hold is ignored');
  assertEqual(game.active?.type, 'I', 'I stays active');

  game.hardDrop();
  assertEqual(game.active?.type, 'O', 'O spawns after the lock');
  game.hold();
  assertEqual(game.held, 'O', 'O is held');
  assertEqual(game.active?.type, 'T', 'T comes back');
});

test('a blocked spawn ends the game, and restart clears the board', () => {
  const game = new Game({ source: sequence('O') });
  // Fill the stack but leave column 0 open, so no row is complete and nothing clears.
  for (let row = 4; row < BOARD_HEIGHT; row++) {
    for (let col = 1; col < BOARD_WIDTH; col++) game.board.setCell(col, row, 'I');
  }
  game.hardDrop();
  assertEqual(game.status, 'over', 'status after top-out');
  assertEqual(game.active, null, 'no active piece');

  game.restart();
  assertEqual(game.status, 'playing', 'status after restart');
  assertEqual(game.board.cell(0, BOARD_HEIGHT - 1), null, 'board cleared');
});

let failures = 0;
for (const [name, check] of tests) {
  try {
    check();
    console.log(`ok    ${name}`);
  } catch (error) {
    failures += 1;
    console.log(`FAIL  ${name}\n      ${(error as Error).message}`);
  }
}
console.log(`\n${tests.length - failures}/${tests.length} smoke tests passed`);
if (failures > 0) throw new Error(`${failures} smoke test(s) failed`);
