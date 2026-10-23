import { Game } from './game.js';
import { ALL_PIECES, COLS, LOCK_DELAY_MS, PIECE_COLORS, TOTAL_ROWS } from './pieces.js';
import { SevenBag } from './randomizer.js';
import type { CellValue } from './types.js';

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`Assertion failed: ${msg}`);
}

function emptyBoard(): CellValue[][] {
  return Array.from({ length: TOTAL_ROWS }, () => Array<CellValue>(COLS).fill(null));
}

function testBag(): void {
  const bag = new SevenBag(() => 0.5);
  for (let round = 0; round < 10; round++) {
    const seen = new Set<string>();
    for (let i = 0; i < 7; i++) seen.add(bag.next());
    assert(seen.size === 7, `bag round ${round} should have 7 distinct pieces`);
  }
}

function testColors(): void {
  const fills = new Set(ALL_PIECES.map((p) => PIECE_COLORS[p]));
  assert(fills.size === ALL_PIECES.length, 'each piece needs a distinct color');
}

function testMoves(): void {
  const g = new Game(() => 0.1);
  g.setActivePieceForTest({ type: 'T', rotation: 0, x: 3, y: 4 });
  assert(g.moveLeft(), 'move left');
  assert(g.snapshot().activePiece?.x === 2, 'x=2 after left');
  assert(g.moveRight(), 'move right');
  assert(g.snapshot().activePiece?.x === 3, 'x=3 after right');
  const before = g.snapshot().score;
  assert(g.softDropStep(), 'soft drop');
  assert(g.snapshot().score === before + 1, 'soft drop scores 1');
  const y0 = g.snapshot().activePiece?.y as number;
  const gy = g.ghostY() as number;
  const dropped = g.hardDrop();
  assert(dropped === gy - y0, 'hard drop matches ghost distance');
}

function testRotateKick(): void {
  const g = new Game(() => 0.2);
  g.setActivePieceForTest({ type: 'T', rotation: 1, x: -1, y: 6 });
  assert(g.rotate('ccw'), 'wall kick rotation should succeed');
  const s = g.snapshot().activePiece;
  assert(s?.rotation === 0, 'rotation becomes 0');
  assert(s?.x === 0, 'kick shifts to x=0');
}

function testHold(): void {
  const g = new Game(() => 0.3);
  const first = g.snapshot().activePiece?.type as string;
  assert(g.hold(), 'first hold works');
  assert(g.snapshot().holdPiece === first, 'held matches');
  assert(!g.hold(), 'no double hold');
  g.hardDrop();
  assert(g.hold(), 'hold works after lock');
}

function testTetris(): void {
  const g = new Game(() => 0.4);
  const b = emptyBoard();
  for (let r = TOTAL_ROWS - 4; r < TOTAL_ROWS; r++) {
    for (let c = 0; c < COLS - 1; c++) b[r][c] = 'J';
  }
  g.setBoardForTest(b);
  g.setActivePieceForTest({ type: 'I', rotation: 1, x: 7, y: TOTAL_ROWS - 4 });
  g.hardDrop();
  const s = g.snapshot();
  assert(s.lines === 4, `expected 4 lines, got ${s.lines}`);
  assert(s.score >= 800, `expected >= 800, got ${s.score}`);
  assert(s.backToBack === true, 'tetris arms back-to-back');
}

function testLockAndTopOut(): void {
  const g = new Game(() => 0.5);
  g.setActivePieceForTest({ type: 'O', rotation: 0, x: 4, y: TOTAL_ROWS - 2 });
  g.update(LOCK_DELAY_MS - 50);
  assert(g.snapshot().board[TOTAL_ROWS - 1][5] === null, 'no early lock');
  g.update(100);
  assert(g.snapshot().board[TOTAL_ROWS - 1][5] === 'O', 'locks after delay');
  const blocked = emptyBoard();
  for (let r = 0; r < TOTAL_ROWS - 2; r++) {
    for (let c = 1; c < COLS; c++) blocked[r][c] = 'Z';
  }
  g.setBoardForTest(blocked);
  g.setActivePieceForTest({ type: 'O', rotation: 0, x: 4, y: TOTAL_ROWS - 2 });
  g.hardDrop();
  assert(g.isGameOver(), 'blocked spawn ends game');
}

testBag();
testColors();
testMoves();
testRotateKick();
testHold();
testTetris();
testLockAndTopOut();
console.log('All 7 Tetris Guideline test suites passed!');
