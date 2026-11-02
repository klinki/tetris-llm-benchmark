// Headless logic smoke tests: run with `npm test` (node dist/logic-test.js).
import { BagRandomizer } from './core/randomizer.js';
import { Board, BOARD_HEIGHT, BOARD_WIDTH, HIDDEN_ROWS } from './core/board.js';
import { TETROMINOES, Tetromino } from './core/pieces.js';
import { Game, gravityMs } from './core/game.js';

let passed = 0;
const failures: string[] = [];

function check(condition: boolean, name: string): void {
  if (condition) {
    passed += 1;
  } else {
    failures.push(name);
    console.error(`  FAIL: ${name}`);
  }
}

function section(name: string): void {
  console.log(name);
}

/** Deterministic piece source for repeatable scenarios. */
function fixedSource(pieces: Tetromino[]): { next(): Tetromino } {
  let index = 0;
  return { next: () => pieces[index++ % pieces.length] };
}

section('7-bag randomizer');
{
  const bag = new BagRandomizer();
  for (let round = 0; round < 10; round++) {
    const drawn = new Set<Tetromino>();
    for (let i = 0; i < 7; i++) drawn.add(bag.next());
    check(drawn.size === 7, `bag round ${round} deals every piece exactly once`);
  }
}

section('next queue');
{
  const game = new Game();
  check(game.queue.length === 5, 'queue holds the next five pieces');
  check(game.queue.every((type) => TETROMINOES.includes(type)), 'queue pieces are valid');
}

section('guideline gravity');
check(Math.abs(gravityMs(1) - 1000) < 0.001, 'level 1 falls one row per second');
check(Math.abs(gravityMs(2) - 793) < 1, 'level 2 falls one row per 0.793 s');
check(gravityMs(5) < gravityMs(4) && gravityMs(10) < gravityMs(5), 'gravity speeds up with level');

section('board line clears');
{
  const board = new Board();
  const bottom = BOARD_HEIGHT - 1;
  for (let x = 0; x < BOARD_WIDTH - 1; x++) board.grid[bottom][x] = 'J';
  check(board.clearFullRows() === 0, 'incomplete row is not cleared');
  board.grid[bottom][BOARD_WIDTH - 1] = 'T';
  check(board.clearFullRows() === 1, 'full row is cleared');
  check(board.grid[bottom].every((cell) => cell === null), 'cleared row collapses to empty');
}
{
  const board = new Board();
  for (let x = 0; x < BOARD_WIDTH; x++) {
    board.grid[BOARD_HEIGHT - 1][x] = 'J';
    board.grid[BOARD_HEIGHT - 2][x] = 'L';
  }
  board.grid[BOARD_HEIGHT - 3][0] = 'T';
  check(board.clearFullRows() === 2, 'two full rows clear together');
  check(board.grid[BOARD_HEIGHT - 1][0] === 'T', 'stack above the clears shifts down');
  check(board.grid[BOARD_HEIGHT - 2].every((cell) => cell === null), 'cleared space becomes empty');
}

section('SRS wall kicks');
{
  const game = new Game(fixedSource(['T']));
  const piece = game.active!;
  piece.x = 4;
  piece.y = 18;
  piece.rotation = 0;
  game.board.grid[20][5] = 'J';
  game.board.grid[19][6] = 'J';
  check(game.rotate(1), 'blocked T rotation succeeds via wall kick');
  const rotated = game.active!;
  check(rotated.rotation === 1 && rotated.x === 3 && rotated.y === 18, 'kick offset (-1, 0) applied');
}
{
  const game = new Game(fixedSource(['O']));
  const piece = game.active!;
  const { x, y } = piece;
  check(game.rotate(1) && piece.x === x && piece.y === y && piece.rotation === 1, 'O piece rotates in place');
}

section('hold');
{
  const game = new Game(fixedSource(['I', 'J', 'L']));
  check(game.active!.type === 'I', 'first piece is I');
  game.holdPiece();
  check(game.hold === 'I' && game.active!.type === 'J', 'hold stores the piece and spawns the next');
  game.holdPiece();
  check(game.hold === 'I' && game.active!.type === 'J' && !game.canHold, 'hold can only be used once per piece');
  game.hardDrop();
  check(game.active!.type === 'L' && game.canHold, 'hold unlocks after the piece locks');
  game.holdPiece();
  check(game.hold === 'L' && game.active!.type === 'I', 'hold swaps in the stored piece');
}

section('hard drop scoring');
{
  const game = new Game(fixedSource(['O']));
  game.hardDrop();
  check(game.score === 40, 'hard drop scores 2 points per row (20 rows)');
  check(game.active!.type === 'O' && game.status === 'playing', 'next piece spawns after the drop');
}

section('ghost piece');
{
  const game = new Game(fixedSource(['I']));
  check(game.ghostY() === BOARD_HEIGHT - 2, 'ghost shows where the piece would land');
}

section('line clear scoring');
{
  const game = new Game(fixedSource(['I']));
  for (let y = BOARD_HEIGHT - 4; y < BOARD_HEIGHT; y++) {
    for (let x = 0; x < BOARD_WIDTH - 1; x++) game.board.grid[y][x] = 'J';
  }
  check(game.rotate(1), 'I rotates to vertical');
  let moved = true;
  for (let i = 0; i < 4; i++) moved = game.move(1) && moved;
  check(moved && game.active!.x === 7, 'piece lines up above the open column');
  game.hardDrop();
  check(game.lines === 4, 'four rows cleared');
  check(game.score === 36 + 800, 'tetris scores 800 x level plus 2 per hard drop row');
  check(game.lastClearLabel === 'TETRIS', 'clear label reports TETRIS');
  check(game.backToBack, 'tetris starts a back-to-back chain');
  check(game.board.grid[BOARD_HEIGHT - 1].every((cell) => cell === null), 'board empty after the clear');
}

section('combo scoring');
{
  const game = new Game(fixedSource(['O', 'T']));
  const bottom = BOARD_HEIGHT - 1;
  for (let x = 0; x < BOARD_WIDTH; x++) {
    if (x !== 4 && x !== 5) game.board.grid[bottom][x] = 'J';
  }
  game.hardDrop();
  check(game.score === 40 + 100, 'single scores 100 x level');
  // The clear shifted the O cells to the bottom row; refill around them.
  for (let x = 0; x < BOARD_WIDTH; x++) {
    if (x !== 4 && x !== 5) game.board.grid[bottom][x] = 'J';
  }
  game.hardDrop();
  check(game.lines === 2, 'two lines total');
  check(game.score === 40 + 100 + 38 + 100 + 50, 'second consecutive clear adds a 50 x combo bonus');
}

section('lock delay');
{
  const game = new Game(fixedSource(['O', 'T']));
  const piece = game.active!;
  piece.y = BOARD_HEIGHT - 2; // resting on the floor
  game.update(499);
  check(game.active === piece, 'piece survives 499 ms of lock delay');
  check(game.move(-1), 'grounded move is allowed');
  game.update(400);
  check(game.active === piece, 'a successful move resets the lock delay');
  game.update(200);
  check(game.active !== piece, 'piece locks once the delay expires');
}
{
  const game = new Game(fixedSource(['O', 'T']));
  const piece = game.active!;
  piece.y = BOARD_HEIGHT - 2;
  game.update(100);
  for (let i = 0; i < 16; i++) game.move(i % 2 === 0 ? -1 : 1);
  check(game.active === piece, 'piece survives while lock resets remain');
  game.update(500);
  check(game.active !== piece, 'lock delay stops resetting after 15 moves');
}

section('soft drop');
{
  const game = new Game(fixedSource(['O']));
  game.softDropping = true;
  game.update(1000);
  check(game.active!.y === BOARD_HEIGHT - 2, 'soft drop crosses the field in a second (20x gravity)');
  check(game.score === 20, 'soft drop scores 1 point per row');
  check(game.status === 'playing', 'piece waits on lock delay after landing');
}

section('top out');
{
  const game = new Game(fixedSource(['T', 'I']));
  for (let x = 3; x <= 6; x++) game.board.grid[1][x] = 'J'; // blocks the I spawn cells
  game.hardDrop(); // T locks at the bottom, the next spawn is blocked
  check(game.status === 'over', 'blocked spawn ends the game');
  check(game.active === null, 'no active piece after top out');
}
{
  const game = new Game(fixedSource(['O']));
  for (let y = HIDDEN_ROWS; y < BOARD_HEIGHT; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) game.board.grid[y][x] = 'J';
  }
  game.hardDrop();
  check(game.status === 'over', 'locking entirely above the visible field ends the game');
}

section('T-spin');
{
  const game = new Game(fixedSource(['T']));
  const piece = game.active!;
  piece.rotation = 1;
  piece.x = 0;
  piece.y = BOARD_HEIGHT - 3;
  game.board.grid[19][2] = 'J';
  game.board.grid[21][2] = 'J';
  game.board.grid[19][0] = 'J';
  game.lastActionWasRotation = true;
  game.hardDrop();
  check(game.score === 400, 'T-spin without lines scores 400 x level');
  check(game.lastClearLabel === 'T-SPIN', 'T-spin is reported');
  check(game.status === 'playing', 'game continues after the T-spin');
}

console.log(`\n${passed} checks passed, ${failures.length} failed`);
if (failures.length > 0) {
  throw new Error(`${failures.length} smoke test check(s) failed`);
}
