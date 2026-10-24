import { BagRandomizer } from './bag.js';
import { BOARD_HEIGHT, BOARD_WIDTH } from './board.js';
import {
  LOCK_DELAY_MS,
  MAX_LOCK_RESETS,
  TetrisGame,
  getGravityIntervalMs,
} from './game.js';
import { COLORS, TETROMINO_TYPES } from './tetrominoes.js';
import { TetrominoType } from './types.js';

const assert = {
  ok(value: unknown, message: string = 'Assertion failed: expected truthy value'): void {
    if (!value) {
      throw new Error(message);
    }
  },
  equal<T>(actual: T, expected: T, message?: string): void {
    if (actual !== expected) {
      throw new Error(
        message ?? `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
      );
    }
  },
  deepEqual<T>(actual: T, expected: T, message?: string): void {
    const a = JSON.stringify(actual);
    const e = JSON.stringify(expected);
    if (a !== e) {
      throw new Error(message ?? `Expected ${e}, got ${a}`);
    }
  },
};

let passed = 0;

function test(name: string, fn: () => void): void {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

console.log('Running Tetris Guideline headless smoke tests...\n');

test('Each tetromino shape has a distinct Guideline color', () => {
  const seenColors = new Set<string>();
  for (const type of TETROMINO_TYPES) {
    const color = COLORS[type];
    assert.ok(color && color.startsWith('#'), `Missing color for ${type}`);
    seenColors.add(color.toLowerCase());
  }
  assert.equal(seenColors.size, 7, 'All 7 tetrominoes must have distinct colors');
});

test('7-bag randomizer deals permutations of all 7 tetrominoes', () => {
  const bag = new BagRandomizer();
  for (let b = 0; b < 10; b++) {
    const drawn = new Set<TetrominoType>();
    for (let i = 0; i < 7; i++) {
      drawn.add(bag.next());
    }
    assert.equal(drawn.size, 7, `Bag #${b + 1} must contain all 7 unique pieces`);
  }
});

test('Next queue accurately previews upcoming pieces from the 7-bag', () => {
  const game = new TetrisGame({ seedQueue: ['I', 'T', 'O', 'S', 'Z', 'J', 'L'] });
  assert.equal(game.activePiece?.type, 'I');
  assert.deepEqual(game.nextQueue, ['T', 'O', 'S', 'Z', 'J']);

  game.hardDrop();
  assert.equal(game.activePiece?.type, 'T');
  assert.equal(game.nextQueue[0], 'O');
});

test('Horizontal movement and wall collision boundaries', () => {
  const game = new TetrisGame({ seedQueue: ['O', 'T'] });
  assert.equal(game.activePiece?.x, 3);

  // Move O piece all the way left (O occupies local x=1,2, so min board x is -1 -> cols 0,1)
  let movesLeft = 0;
  while (game.moveLeft()) {
    movesLeft++;
  }
  assert.equal(movesLeft, 4);
  assert.equal(game.activePiece?.x, -1);
  assert.equal(game.moveLeft(), false);

  // Move O piece all the way right (cols 8,9 -> piece.x = 7)
  let movesRight = 0;
  while (game.moveRight()) {
    movesRight++;
  }
  assert.equal(movesRight, 8);
  assert.equal(game.activePiece?.x, 7);
  assert.equal(game.moveRight(), false);
});

test('Ghost piece projects exact landing row', () => {
  const game = new TetrisGame({ seedQueue: ['I', 'O'] });
  // Spawned horizontal I at y=0 has blocks on row y+1=1; bottom row is 19 -> ghostY = 18
  assert.equal(game.getGhostY(), 18);

  game.hardDrop();
  // O piece now spawns above the I piece at columns 4,5 (which are occupied at row 19)
  // O has blocks at local y=0,1, so landing above row 19 means ghostY + 1 = 18 -> ghostY = 17
  assert.equal(game.getGhostY(), 17);
});

test('Soft drop awards 1 pt/cell and hard drop awards 2 pts/cell', () => {
  const game = new TetrisGame({ seedQueue: ['O', 'I'] });
  assert.equal(game.score, 0);

  assert.equal(game.softDrop(), true);
  assert.equal(game.softDrop(), true);
  assert.equal(game.score, 2);
  assert.equal(game.activePiece?.y, 2);

  // Remaining distance to ghostY (18) is 16 cells -> 32 points
  const dropped = game.hardDrop();
  assert.equal(dropped, 16);
  assert.equal(game.score, 2 + 16 * 2);
});

test('Hold piece stores, swaps, and enforces once-per-lock limit', () => {
  const game = new TetrisGame({ seedQueue: ['T', 'J', 'L', 'S'] });
  assert.equal(game.activePiece?.type, 'T');
  assert.equal(game.holdPiece, null);
  assert.equal(game.canHold, true);

  // First hold stores T and spawns J
  assert.equal(game.hold(), true);
  assert.equal(game.holdPiece, 'T');
  assert.equal(game.activePiece?.type, 'J');
  assert.equal(game.canHold, false);

  // Cannot hold again before locking
  assert.equal(game.hold(), false);
  assert.equal(game.activePiece?.type, 'J');

  // Lock J via hard drop -> canHold becomes true again
  game.hardDrop();
  assert.equal(game.activePiece?.type, 'L');
  assert.equal(game.canHold, true);

  // Hold swaps L with T
  assert.equal(game.hold(), true);
  assert.equal(game.holdPiece, 'L');
  assert.equal(game.activePiece?.type, 'T');
  assert.equal(game.canHold, false);
});

test('SRS rotation states and wall kicks (including I-piece kicks)', () => {
  const game = new TetrisGame({ seedQueue: ['T', 'I'] });

  // Rotate CW and CCW cycle
  assert.equal(game.activePiece?.rotation, 0);
  assert.equal(game.rotateClockwise(), true);
  assert.equal(game.activePiece?.rotation, 1);
  assert.equal(game.rotateClockwise(), true);
  assert.equal(game.activePiece?.rotation, 2);
  assert.equal(game.rotateClockwise(), true);
  assert.equal(game.activePiece?.rotation, 3);
  assert.equal(game.rotateClockwise(), true);
  assert.equal(game.activePiece?.rotation, 0);

  assert.equal(game.rotateCounterClockwise(), true);
  assert.equal(game.activePiece?.rotation, 3);

  // Push T in state 3 (local x=0,1) against right wall (local x=0,1 at board x=8,9 -> piece.x=8)
  while (game.moveRight()) {
    // move to right wall
  }
  assert.equal(game.activePiece?.x, 8);
  // Rotate CCW (3 -> 2) or CW (3 -> 0) requires local x=2 which would be at board x=10 without a wall kick!
  assert.equal(game.rotateClockwise(), true);
  assert.equal(game.activePiece?.rotation, 0);
  assert.equal(game.activePiece?.x, 7, 'T piece should wall-kick left to x=7');

  // Now test I piece wall kick off left wall
  game.hardDrop();
  assert.equal(game.activePiece?.type, 'I');
  game.rotateClockwise(); // state 1 (vertical at local x=2)
  while (game.moveLeft()) {
    // push to left wall: local x=2 at board x=0 -> piece.x = -2
  }
  assert.equal(game.activePiece?.x, -2);
  // Rotate CCW (1 -> 0) kicks +2 to the right -> piece.x = 0
  assert.equal(game.rotateCounterClockwise(), true);
  assert.equal(game.activePiece?.rotation, 0);
  assert.equal(game.activePiece?.x, 0, 'I piece should wall-kick +2 right to x=0');
});

test('Lock delay (500ms) and Extended Placement move resets', () => {
  const game = new TetrisGame({ seedQueue: ['O', 'T'] });

  // Move O piece down to the floor without hard dropping
  while (game.moveDown(false)) {
    // drop to floor
  }
  assert.equal(game.isGrounded(), true);
  assert.equal(game.activePiece?.type, 'O');

  // Tick 400ms (less than 500ms lock delay) -> still not locked
  game.tick(400);
  assert.equal(game.activePiece?.type, 'O');
  assert.equal(game.lockTimer, 400);

  // Move left while grounded -> resets lockTimer to 0 and increments lockResets
  assert.equal(game.moveLeft(), true);
  assert.equal(game.lockTimer, 0);
  assert.equal(game.lockResets, 1);

  // Tick another 400ms -> still not locked because timer was reset
  game.tick(400);
  assert.equal(game.activePiece?.type, 'O');

  // Tick remaining 100ms -> reaches 500ms and locks O, spawning T
  game.tick(100);
  assert.equal(game.activePiece?.type, 'T');
  assert.ok(MAX_LOCK_RESETS === 15 && LOCK_DELAY_MS === 500);
});

test('Guideline line clear scoring (Single, Double, Triple, Tetris, B2B) and gravity', () => {
  const game = new TetrisGame({ seedQueue: ['I', 'I', 'I'] });

  // Fill bottom 4 rows columns 0..8, leaving column 9 empty for vertical I piece
  for (let y = BOARD_HEIGHT - 4; y < BOARD_HEIGHT; y++) {
    for (let x = 0; x < BOARD_WIDTH - 1; x++) {
      game.board[y]![x] = 'J';
    }
  }

  // Rotate I vertical (state 1), move to right wall (column 9), and lock at bottom
  game.rotateClockwise();
  while (game.moveRight()) {
    // move to right wall
  }
  while (game.moveDown(false)) {
    // move to bottom without soft/hard drop points
  }
  const result1 = game.lockPiece();
  assert.equal(result1.clearedLines, 4);
  assert.equal(result1.scoreGained, 800, 'First Tetris at level 1 scores 800');
  assert.equal(game.score, 800);
  assert.equal(game.lines, 4);

  // Set up another 4-line clear to verify Back-to-Back (1.5x = 1200)
  for (let y = BOARD_HEIGHT - 4; y < BOARD_HEIGHT; y++) {
    for (let x = 0; x < BOARD_WIDTH - 1; x++) {
      game.board[y]![x] = 'L';
    }
  }
  game.rotateClockwise();
  while (game.moveRight()) {
    // move to right wall
  }
  while (game.moveDown(false)) {
    // move to bottom
  }
  const result2 = game.lockPiece();
  assert.equal(result2.clearedLines, 4);
  assert.equal(result2.backToBack, true);
  // B2B Tetris (1200) + 1x Combo bonus (50) = 1250
  assert.equal(result2.scoreGained, 1250);
  assert.equal(game.lines, 8);

  // Verify gravity speeds up with level
  const level1Gravity = getGravityIntervalMs(1);
  const level5Gravity = getGravityIntervalMs(5);
  const level10Gravity = getGravityIntervalMs(10);
  assert.equal(level1Gravity, 1000);
  assert.ok(level5Gravity < level1Gravity);
  assert.ok(level10Gravity < level5Gravity);
});

test('Top-out on blocked spawn and restart via R key', () => {
  const game = new TetrisGame();
  let drops = 0;
  while (!game.gameOver && drops < 25) {
    game.handleKey(' ', 'Space');
    drops++;
  }
  assert.equal(game.gameOver, true, 'Repeated hard drops must top-out on blocked spawn');

  const scoreAtGameOver = game.score;
  assert.equal(game.handleKey('ArrowLeft', 'ArrowLeft'), false);
  assert.equal(game.handleKey(' ', 'Space'), false);
  assert.equal(game.score, scoreAtGameOver);

  // Press R to restart after game over
  assert.equal(game.handleKey('r', 'KeyR'), true);
  assert.equal(game.gameOver, false);
  assert.equal(game.score, 0);
  assert.equal(game.lines, 0);
  assert.equal(game.level, 1);
});

console.log(`\nAll ${passed} smoke tests passed!`);
