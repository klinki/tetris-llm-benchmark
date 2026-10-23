import { BagRandomizer } from './bag.js';
import {
  ALL_PIECES,
  COLS,
  LOCK_DELAY_MS,
  PIECE_COLORS,
  TOTAL_ROWS,
} from './constants.js';
import { TetrisEngine } from './engine.js';
import { CellValue } from './types.js';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function createEmptyBoard(): CellValue[][] {
  return Array.from({ length: TOTAL_ROWS }, () =>
    Array.from({ length: COLS }, () => null)
  );
}

function testSevenBagRandomizer(): void {
  const bag = new BagRandomizer();
  for (let round = 0; round < 10; round++) {
    const seen = new Set<string>();
    for (let i = 0; i < 7; i++) {
      seen.add(bag.next());
    }
    assert(
      seen.size === 7,
      `Expected 7 distinct pieces in bag #${round + 1}, got ${seen.size}`
    );
  }
}

function testDistinctColors(): void {
  const fills = new Set(ALL_PIECES.map((p) => PIECE_COLORS[p].fill));
  assert(
    fills.size === ALL_PIECES.length,
    'Every tetromino shape must have a distinct color'
  );
}

function testMovementAndDrops(): void {
  const engine = new TetrisEngine();
  engine.setActivePieceForTest({ type: 'T', rotation: 0, x: 3, y: 4 });

  assert(engine.moveLeft(), 'Should move left');
  assert(engine.getSnapshot().activePiece?.x === 2, 'x should be 2 after moveLeft');

  assert(engine.moveRight(), 'Should move right');
  assert(engine.getSnapshot().activePiece?.x === 3, 'x should be 3 after moveRight');

  const scoreBeforeSoft = engine.getSnapshot().score;
  assert(engine.softDrop(), 'Should soft drop 1 row');
  assert(
    engine.getSnapshot().score === scoreBeforeSoft + 1,
    'Soft drop should award 1 point per row'
  );

  const yBeforeHard = engine.getSnapshot().activePiece!.y;
  const ghostY = engine.getGhostY()!;
  const expectedDrop = ghostY - yBeforeHard;
  const dropped = engine.hardDrop();
  assert(dropped === expectedDrop, 'Hard drop distance should match ghost piece distance');
  assert(
    engine.getSnapshot().score === scoreBeforeSoft + 1 + expectedDrop * 2,
    'Hard drop should award 2 points per row'
  );
}

function testRotationAndWallKicks(): void {
  const engine = new TetrisEngine();
  // Place T piece against left wall in rotation 1 (pointing right, occupying x=1,2),
  // move it to x=-1 so its blocks are at x=0,1, then rotate CCW to state 0 (which needs x=0,1,2 via wall kick)
  engine.setActivePieceForTest({ type: 'T', rotation: 1, x: -1, y: 6 });
  const rotated = engine.rotate('ccw');
  assert(rotated, 'T piece against left wall should wall-kick into valid position');
  const snap = engine.getSnapshot().activePiece!;
  assert(snap.rotation === 0, 'Rotation should become 0 after CCW from 1');
  assert(snap.x === 0, 'Wall kick should shift piece right to x=0');
}

function testHoldMechanics(): void {
  const engine = new TetrisEngine();
  const firstType = engine.getSnapshot().activePiece!.type;
  assert(engine.hold(), 'First hold should succeed');
  assert(
    engine.getSnapshot().holdPiece === firstType,
    'Held piece should match original active piece'
  );
  assert(!engine.hold(), 'Cannot hold twice without locking a piece first');
  engine.hardDrop();
  assert(engine.hold(), 'Should be able to hold again after locking a piece');
}

function testLineClearAndTetrisScoring(): void {
  const engine = new TetrisEngine();
  const board = createEmptyBoard();

  // Fill bottom 4 rows except column 9
  for (let r = TOTAL_ROWS - 4; r < TOTAL_ROWS; r++) {
    for (let c = 0; c < COLS - 1; c++) {
      board[r][c] = 'J';
    }
  }
  engine.setBoardForTest(board);

  // Place vertical I piece (rotation 1 has cells at x+2, y+0..3) at x=7 so cells are at column 9
  engine.setActivePieceForTest({ type: 'I', rotation: 1, x: 7, y: TOTAL_ROWS - 4 });
  engine.hardDrop();

  const snap = engine.getSnapshot();
  assert(snap.lines === 4, `Expected 4 cleared lines, got ${snap.lines}`);
  assert(snap.score === 800, `Expected 800 score for level 1 Tetris, got ${snap.score}`);
  assert(snap.backToBack === true, 'Tetris clear should arm back-to-back');
}

function testLockDelayAndTopOut(): void {
  const engine = new TetrisEngine();
  engine.setActivePieceForTest({ type: 'O', rotation: 0, x: 4, y: TOTAL_ROWS - 2 });

  // Grounded piece should not lock before LOCK_DELAY_MS
  engine.update(LOCK_DELAY_MS - 50);
  assert(
    engine.getSnapshot().board[TOTAL_ROWS - 1][5] === null,
    'Piece should not lock before lock delay expires'
  );

  // After remaining lock delay, piece locks
  engine.update(100);
  assert(
    engine.getSnapshot().board[TOTAL_ROWS - 1][5] === 'O',
    'Piece should lock once lock delay expires'
  );

  // Fill columns 1..9 (leaving col 0 empty so lines don't clear) to obstruct spawn area
  const obstructedBoard = createEmptyBoard();
  for (let r = 0; r < TOTAL_ROWS - 2; r++) {
    for (let c = 1; c < COLS; c++) {
      obstructedBoard[r][c] = 'Z';
    }
  }
  engine.setBoardForTest(obstructedBoard);
  engine.setActivePieceForTest({ type: 'O', rotation: 0, x: 4, y: TOTAL_ROWS - 2 });
  engine.hardDrop();
  assert(engine.isGameOver(), 'Game should end (Block Out) when spawn position is obstructed');
}

function runAllTests(): void {
  testSevenBagRandomizer();
  testDistinctColors();
  testMovementAndDrops();
  testRotationAndWallKicks();
  testHoldMechanics();
  testLineClearAndTetrisScoring();
  testLockDelayAndTopOut();
  console.log('All 7 Tetris Guideline test suites passed!');
}

runAllTests();
