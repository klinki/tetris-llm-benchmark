import { Bag } from '../src/game/bag.js';
import { Board } from '../src/game/board.js';
import { BOARD_WIDTH, FIELD_HEIGHT, BUFFER_ROWS } from '../src/game/constants.js';
import { Game } from '../src/game/game.js';
import {
  SHAPES,
  PIECE_TYPES,
  kicksFor,
  type PieceType,
  type Rotation,
} from '../src/game/pieces.js';
import { lineClearScore, levelForLines } from '../src/game/scoring.js';

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void): void {
  try {
    fn();
    passed++;
    console.log(`  ok - ${name}`);
  } catch (error) {
    failed++;
    console.error(`  not ok - ${name}`);
    console.error(`    ${(error as Error).message}`);
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message = ''): void {
  if (actual !== expected) {
    throw new Error(`${message}expected ${String(expected)}, got ${String(actual)}`);
  }
}

// A deterministic RNG that always picks index 0, which makes the first bag
// deal an I piece first (see the Fisher-Yates shuffle in Bag).
const rng = (): number => 0;

test('7-bag deals each of the seven pieces exactly once', () => {
  const bag = new Bag(rng);
  const seen = new Set<PieceType>();
  for (let i = 0; i < 7; i++) seen.add(bag.next());
  assertEqual(seen.size, 7, 'a bag must contain seven unique pieces: ');
  for (const type of PIECE_TYPES) assert(seen.has(type), `bag is missing ${type}`);
});

test('every piece has four cells in all four rotation states', () => {
  for (const type of PIECE_TYPES) {
    assertEqual(SHAPES[type].length, 4, `${type} rotations: `);
    for (const rotation of SHAPES[type]) {
      assertEqual(rotation.length, 4, `${type} cell count: `);
    }
  }
});

test('every rotation transition has SRS wall kicks defined', () => {
  const kickTypes: PieceType[] = ['I', 'J', 'L', 'S', 'T', 'Z'];
  for (const type of kickTypes) {
    for (let from = 0; from < 4; from++) {
      for (const to of [(from + 1) % 4, (from + 3) % 4]) {
        const kicks = kicksFor(type, from as Rotation, to as Rotation);
        assert(kicks.length > 0, `missing kicks for ${type} ${from}>${to}`);
      }
    }
  }
});

test('board rejects pieces outside the playfield', () => {
  const board = new Board();
  const cells = SHAPES.T[0];
  assert(board.collides(cells, -1, BUFFER_ROWS), 'should collide with the left wall');
  assert(board.collides(cells, BOARD_WIDTH - 1, BUFFER_ROWS), 'should collide with the right wall');
  assert(board.collides(cells, 3, FIELD_HEIGHT), 'should collide with the floor');
  assert(!board.collides(cells, 3, BUFFER_ROWS), 'the spawn area should be free');
});

test('clearing a line removes it and shifts rows above down', () => {
  const board = new Board();
  board.lock('T', [[0, 0]], 0, BUFFER_ROWS);
  for (let x = 0; x < BOARD_WIDTH; x++) {
    board.lock('I', [[0, 0]], x, FIELD_HEIGHT - 1);
  }
  const cleared = board.clearLines();
  assertEqual(cleared.length, 1, 'one row cleared: ');
  assertEqual(cleared[0], FIELD_HEIGHT - 1, 'bottom row cleared: ');
  assertEqual(board.get(0, BUFFER_ROWS + 1), 'T', 'row above shifted down: ');
  assertEqual(board.get(0, BUFFER_ROWS), null, 'old row should be empty: ');
});

test('a new game spawns a piece, a lookahead queue and no score', () => {
  const game = new Game(rng);
  assert(game.active !== null, 'an active piece is required');
  assertEqual(game.active!.type, 'I', 'deterministic first piece: ');
  assertEqual(game.nextPieces().length, 3, 'next queue size: ');
  assertEqual(game.state, 'playing', 'initial state: ');
  assertEqual(game.score, 0, 'initial score: ');
});

test('hard drop adds points and locks the piece', () => {
  const game = new Game(rng);
  game.hardDrop();
  assert(game.score > 0, 'hard drop should award points');
  assert(game.active !== null, 'a new piece should spawn');
  let locked = 0;
  for (let y = BUFFER_ROWS; y < FIELD_HEIGHT; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      if (game.board.get(x, y) !== null) locked++;
    }
  }
  assertEqual(locked, 4, 'locked cells on the board: ');
});

test('hard dropping an I piece clears a line and scores', () => {
  const game = new Game(rng);
  const bottom = FIELD_HEIGHT - 1;
  for (let x = 0; x < BOARD_WIDTH; x++) {
    if (x >= 3 && x <= 6) continue; // leave a shaft for the I piece
    game.board.lock('J', [[0, 0]], x, bottom);
  }
  const before = game.score;
  game.hardDrop();
  assertEqual(game.lines, 1, 'one line cleared: ');
  assert(game.score > before, 'line clear should add score');
});

test('hold swaps the active piece and is limited to once per lock', () => {
  const game = new Game(rng);
  const first = game.active!.type;
  game.hold();
  assertEqual(game.holdPiece, first, 'held piece: ');
  const second = game.active!.type;
  assert(second !== first, 'a new piece should spawn after hold');

  game.hold(); // should be rejected until the piece locks
  assertEqual(game.active!.type, second, 'second hold is rejected: ');
  assertEqual(game.holdPiece, first, 'held piece unchanged: ');

  game.hardDrop();
  const afterDrop = game.active!.type;
  game.hold();
  assertEqual(game.holdPiece, afterDrop, 'hold works again after locking: ');
});

test('the ghost piece rests on the floor', () => {
  const game = new Game(rng);
  assertEqual(game.ghostY(), FIELD_HEIGHT - 2, 'I piece resting on the bottom row: ');
});

test('rotation updates the active piece', () => {
  const game = new Game(rng);
  assertEqual(game.active!.rotation, 0, 'initial rotation: ');
  game.rotateClockwise();
  assertEqual(game.active!.rotation, 1, 'rotation after clockwise turn: ');
  game.rotateCounterClockwise();
  assertEqual(game.active!.rotation, 0, 'rotation after counter-clockwise turn: ');
});

test('the game ends when a new piece cannot spawn', () => {
  const game = new Game(rng);
  for (let y = BUFFER_ROWS + 1; y < FIELD_HEIGHT; y++) {
    for (let x = 3; x <= 6; x++) {
      game.board.lock('I', [[0, 0]], x, y);
    }
  }
  game.hardDrop();
  assertEqual(game.state, 'gameover', 'spawn is blocked: ');
});

test('restarting resets the run', () => {
  const game = new Game(rng);
  for (let y = BUFFER_ROWS + 1; y < FIELD_HEIGHT; y++) {
    for (let x = 3; x <= 6; x++) {
      game.board.lock('I', [[0, 0]], x, y);
    }
  }
  game.hardDrop();
  assertEqual(game.state, 'gameover', 'game over before restart: ');
  game.restart();
  assertEqual(game.state, 'playing', 'state after restart: ');
  assertEqual(game.score, 0, 'score after restart: ');
  assertEqual(game.lines, 0, 'lines after restart: ');
});

test('guideline line scoring', () => {
  assertEqual(lineClearScore(1, 1, 0), 100);
  assertEqual(lineClearScore(2, 1, 0), 300);
  assertEqual(lineClearScore(3, 1, 0), 500);
  assertEqual(lineClearScore(4, 1, 0), 800);
  assertEqual(lineClearScore(4, 5, 0), 4000);
  assertEqual(lineClearScore(1, 1, 3), 100 + 50 * 3);
  assertEqual(lineClearScore(0, 1, 0), 0);
});

test('guideline level progression', () => {
  assertEqual(levelForLines(0), 1);
  assertEqual(levelForLines(9), 1);
  assertEqual(levelForLines(10), 2);
  assertEqual(levelForLines(20), 3);
});

test('the simulation survives many frames of random input', () => {
  let seed = 0x12345678;
  const random = (): number => {
    // xorshift32, deterministic so failures are reproducible.
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return (seed >>> 0) / 0xffffffff;
  };
  const game = new Game(random);
  for (let frame = 0; frame < 5000; frame++) {
    const action = Math.floor(random() * 6);
    switch (action) {
      case 0:
        game.moveLeft();
        break;
      case 1:
        game.moveRight();
        break;
      case 2:
        game.rotateClockwise();
        break;
      case 3:
        game.rotateCounterClockwise();
        break;
      case 4:
        game.hardDrop();
        break;
      default:
        game.hold();
        break;
    }
    if (game.state === 'gameover') game.restart();
    game.update(1000 / 60);
    assert(
      game.state === 'playing' || game.state === 'gameover',
      `unexpected state ${game.state} at frame ${frame}`,
    );
    assert(game.score >= 0, `score went negative at frame ${frame}`);
  }
  assert(game.score > 0, 'random play should eventually score');
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
