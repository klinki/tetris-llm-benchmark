import { Bag } from '../core/bag.js';
import { Board } from '../core/board.js';
import { COLS, ROWS } from '../core/constants.js';
import { Game } from '../core/game.js';
import { absoluteCells, pieceCells } from '../core/pieces.js';
import type { ActivePiece, PieceType } from '../core/types.js';

/** The test runner runs in node, only the exit code is needed. */
declare const process: { exitCode: number };

let passed = 0;
const failures: string[] = [];

/** Runs a single test case. */
function test(name: string, run: () => void): void {
  try {
    run();
    passed++;
    console.log(`  ok   ${name}`);
  } catch (error) {
    failures.push(`${name}: ${(error as Error).message}`);
    console.log(`  FAIL ${name}`);
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual: unknown, expected: unknown, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}, expected ${String(expected)} but got ${String(actual)}`);
  }
}

/** Creates a game with a predictable bag. */
function newGame(): Game {
  return new Game({ random: () => 0 });
}

/** Cells of a piece, sorted and formatted. */
function format(cells: readonly { x: number; y: number }[]): string {
  return cells
    .map((cell) => `${cell.x},${cell.y}`)
    .sort()
    .join(' ');
}

/** Fills the three bottom rows so that a single line can be cleared. */
function setupSingleLineClear(game: Game): void {
  for (let y = ROWS - 3; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      game.board.set(x, y, 1);
    }
  }
  // The slot of the O piece and one hole that keeps the middle row open.
  game.board.set(4, ROWS - 3, 0);
  game.board.set(5, ROWS - 3, 0);
  game.board.set(4, ROWS - 2, 0);
  game.board.set(5, ROWS - 2, 0);
  game.board.set(4, ROWS - 1, 0);
  game.board.set(5, ROWS - 1, 0);
  game.board.set(0, ROWS - 2, 0);
}

console.log('Tetris logic tests');

test('the bag randomiser hands out every piece once per bag', () => {
  const bag = new Bag(() => 0.42);
  const first = new Set<PieceType>();
  for (let index = 0; index < 7; index++) {
    first.add(bag.next());
  }
  assertEqual(first.size, 7, 'the first bag holds seven different pieces');

  const second = new Set<PieceType>();
  for (let index = 0; index < 7; index++) {
    second.add(bag.next());
  }
  assertEqual(second.size, 7, 'the second bag holds seven different pieces');
});

test('the rotation states follow the guideline', () => {
  assertEqual(format(pieceCells('T', 0)), '0,1 1,0 1,1 2,1', 'the T spawn state');
  assertEqual(format(pieceCells('T', 1)), '1,0 1,1 1,2 2,1', 'the T rotated clockwise');
  assertEqual(format(pieceCells('T', 2)), '0,1 1,1 1,2 2,1', 'the T upside down');
  assertEqual(format(pieceCells('T', 3)), '0,1 1,0 1,1 1,2', 'the T rotated twice');
  assertEqual(format(pieceCells('I', 0)), '0,1 1,1 2,1 3,1', 'the I spawn state');
  assertEqual(format(pieceCells('I', 1)), '2,0 2,1 2,2 2,3', 'the I rotated clockwise');
  assertEqual(format(pieceCells('O', 1)), '0,0 0,1 1,0 1,1', 'the O does not change');
});

test('a piece rotates around the middle of its box', () => {
  const game = newGame();
  game.spawn('T');
  const piece = game.current as ActivePiece;
  assertEqual(format(absoluteCells(piece)), '3,0 4,-1 4,0 5,0', 'the T at its spawn position');

  assert(game.rotate(1), 'the T rotates');
  assertEqual(piece.rotation, 1, 'the rotation state changed');
  assertEqual(format(absoluteCells(piece)), '4,-1 4,0 4,1 5,0', 'the T turned clockwise');
});

test('the wall kick moves the I piece away from the right wall', () => {
  const game = newGame();
  game.spawn('I');
  const piece = game.current as ActivePiece;
  piece.rotation = 1;
  piece.x = 7;
  piece.y = 5;

  assert(game.rotate(1), 'the I rotates');
  assertEqual(piece.rotation, 2, 'the rotation state changed');
  assertEqual(piece.x, 6, 'the I was kicked one column to the left');
});

test('the wall kick lifts the T piece over the floor', () => {
  const game = newGame();
  game.spawn('T');
  const piece = game.current as ActivePiece;
  piece.y = ROWS - 2;

  assert(game.rotate(1), 'the T rotates');
  assertEqual(piece.y, ROWS - 3, 'the T was lifted by one row');
  assertEqual(piece.x, 2, 'the T was moved one column to the left');
});

test('the board removes full rows and drops the rows above', () => {
  const board = new Board();
  for (let x = 0; x < COLS; x++) {
    board.set(x, ROWS - 1, 1);
  }
  board.set(3, ROWS - 2, 2);

  assertEqual(board.clearLines(), 1, 'one row was removed');
  assertEqual(board.valueAt(3, ROWS - 1), 2, 'the row above fell down');
  assertEqual(board.valueAt(3, ROWS - 2), 0, 'the cleared row is empty');
});

test('the ghost piece shows where the piece lands', () => {
  const game = newGame();
  game.spawn('O');
  const piece = game.current as ActivePiece;
  const ghost = game.ghostY();

  assert(ghost > piece.y, 'the ghost is below the piece');
  assert(game.board.fits('O', 0, piece.x, ghost), 'the ghost does not collide');
  assert(!game.board.fits('O', 0, piece.x, ghost + 1), 'the ghost rests on the floor');
});

test('the hold slot swaps the pieces and locks until the next lock', () => {
  const game = newGame();
  game.spawn('T');

  assert(game.hold(), 'the piece is held');
  assertEqual(game.heldPiece, 'T', 'the T piece is held');
  assertEqual((game.current as ActivePiece).type, 'Z', 'the held piece is played');

  assert(!game.canHold, 'the hold slot is locked');
  const type = (game.current as ActivePiece).type;
  game.hold();
  assertEqual((game.current as ActivePiece).type, type, 'a second hold does nothing');
});

test('the next queue holds five pieces', () => {
  const game = newGame();
  assertEqual(game.nextQueue.length, 5, 'five pieces are queued');
});

test('a single line clear scores 100 points per level', () => {
  const game = newGame();
  setupSingleLineClear(game);
  game.spawn('O');

  game.hardDrop();

  assertEqual(game.lines, 1, 'one line was cleared');
  assertEqual(game.score, 138, 'the line and the hard drop are scored');
  assertEqual(game.level, 1, 'the level did not change');
});

test('a tetris scores 800 points per level', () => {
  const game = newGame();
  for (let y = ROWS - 4; y < ROWS; y++) {
    for (let x = 0; x < COLS - 1; x++) {
      game.board.set(x, y, 1);
    }
  }
  // A block that survives the clear, so the board is not perfect.
  game.board.set(0, ROWS - 5, 1);
  game.spawn('I');
  const piece = game.current as ActivePiece;
  piece.rotation = 1;
  piece.x = 7;
  piece.y = ROWS - 6;

  game.hardDrop();

  assertEqual(game.lines, 4, 'four lines were cleared');
  assertEqual(game.score, 804, 'the tetris and the hard drop are scored');
});

test('ten lines raise the level', () => {
  const game = newGame();
  setupSingleLineClear(game);
  game.lines = 9;
  game.spawn('O');

  game.hardDrop();

  assertEqual(game.lines, 10, 'ten lines were cleared');
  assertEqual(game.level, 2, 'the level was raised');
});

test('a t-spin double is detected and scored', () => {
  const game = newGame();
  for (let x = 0; x < COLS; x++) {
    if (x <= 3 || x >= 7) {
      game.board.set(x, ROWS - 2, 1);
      game.board.set(x, ROWS - 1, 1);
    }
  }
  game.board.set(4, ROWS - 1, 1);
  game.board.set(6, ROWS - 1, 1);
  game.board.set(4, ROWS - 3, 1);

  game.spawn('T');
  const piece = game.current as ActivePiece;
  piece.rotation = 1;
  piece.x = 4;
  piece.y = ROWS - 3;

  assert(game.rotate(1), 'the T rotates into the slot');
  game.update(600);

  assertEqual(game.lines, 2, 'two lines were cleared');
  assertEqual(game.score, 1200, 'the t-spin double is scored');
  assertEqual(game.lastClear?.tspin, 'full', 'the t-spin was detected');
});

test('the soft drop scores one point per row', () => {
  const game = newGame();
  game.spawn('O');
  game.setSoftDrop(true);

  game.update(100);

  assertEqual(game.score, 2, 'two rows were dropped');
  assertEqual((game.current as ActivePiece).y, 1, 'the piece fell two rows');
});

test('a piece that rests on the ground is locked after the lock delay', () => {
  const game = newGame();
  game.spawn('O');
  const piece = game.current as ActivePiece;
  piece.y = ROWS - 2;

  game.update(400);
  assert(game.current !== null, 'the piece is still falling');

  game.update(200);
  assert(game.board.valueAt(4, ROWS - 1) !== 0, 'the piece was locked');
});

test('a blocked spawn ends the game', () => {
  const game = newGame();
  for (let x = 0; x < COLS; x++) {
    game.board.set(x, 0, 1);
  }

  game.spawn('T');

  assertEqual(game.status, 'gameover', 'the game is over');
});

test('a new game starts from scratch', () => {
  const game = newGame();
  setupSingleLineClear(game);
  game.hardDrop();
  assert(game.score > 0, 'the game is played');

  game.reset();

  assertEqual(game.score, 0, 'the score is back to zero');
  assertEqual(game.lines, 0, 'the lines are back to zero');
  assertEqual(game.level, 1, 'the level is back to one');
  assertEqual(game.heldPiece, null, 'the hold slot is empty');
  assertEqual(game.status, 'playing', 'the game is running');
  assert(game.board.isEmpty(), 'the board is empty');
});

console.log('');
if (failures.length > 0) {
  console.log(`${failures.length} test(s) failed:`);
  for (const failure of failures) {
    console.log(`  - ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log(`All ${passed} tests passed.`);
}
