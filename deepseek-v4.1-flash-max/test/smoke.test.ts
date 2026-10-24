import { Game, type GameEvent } from '../src/game.js';
import { BagRandomizer, mulberry32 } from '../src/randomizer.js';
import {
  PIECE_TYPES,
  absoluteCells,
  cellsFor,
  spawnPiece,
  type PieceType,
} from '../src/pieces.js';
import { baseClearPoints, gravitySeconds } from '../src/scoring.js';

let passed = 0;
const failures: string[] = [];

function test(name: string, run: () => void): void {
  try {
    run();
    passed += 1;
    console.log(`ok - ${name}`);
  } catch (error) {
    failures.push(name);
    const message = error instanceof Error ? error.message : String(error);
    console.error(`not ok - ${name}`);
    console.error(`  ${message}`);
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (!Object.is(actual, expected)) {
    throw new Error(`${message} (expected ${String(expected)}, got ${String(actual)})`);
  }
}

function assertClose(actual: number, expected: number, tolerance: number, message: string): void {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${message} (expected ~${expected}, got ${actual})`);
  }
}

function emptyBoard(): Array<Array<PieceType | null>> {
  return Array.from({ length: 20 }, () => Array<PieceType | null>(10).fill(null));
}

function pieceCount(game: Game): number {
  return game.board.reduce(
    (total, row) => total + row.filter((cell) => cell !== null).length,
    0,
  );
}

test('7-bag randomizer deals every tetromino exactly once per bag', () => {
  const bag = new BagRandomizer(mulberry32(1234));
  for (let round = 0; round < 4; round++) {
    const seen = new Set<PieceType>();
    for (let index = 0; index < 7; index++) seen.add(bag.next());
    assertEqual(seen.size, 7, `bag ${round} should contain seven distinct pieces`);
  }
});

test('every tetromino has four minos in every rotation state', () => {
  for (const type of PIECE_TYPES) {
    for (let rotation = 0; rotation < 4; rotation++) {
      assertEqual(
        cellsFor(type, rotation as 0 | 1 | 2 | 3).length,
        4,
        `${type} rotation ${rotation}`,
      );
    }
  }
});

test('pieces spawn centred at the top', () => {
  assertEqual(spawnPiece('T').x, 3, 'T spawns in the middle columns');
  assertEqual(spawnPiece('T').y, 0, 'T spawns on the top row');
  assertEqual(spawnPiece('I').x, 3, 'I spawns centered');
  assertEqual(spawnPiece('O').x, 4, 'O spawns centered');
});

test('SRS floor kick lifts a T piece during rotation', () => {
  const game = new Game({ seed: 1 });
  game.board = emptyBoard();
  game.active = { type: 'T', rotation: 0, x: 3, y: 18 };

  const rotated = game.rotate(1);

  assert(rotated, 'rotation should succeed with a floor kick');
  assert(game.active, 'active piece should still exist');
  assertEqual(game.active.rotation, 1, 'rotation state should advance');
  assertEqual(game.active.x, 2, 'third SRS kick should shift the piece left');
  assertEqual(game.active.y, 17, 'third SRS kick should lift the piece');
});

test('guideline gravity is one second per row at level 1', () => {
  assertClose(gravitySeconds(1), 1, 1e-9, 'level 1 gravity');
  assertClose(gravitySeconds(2), 0.793, 1e-9, 'level 2 gravity');
  assertClose(gravitySeconds(15), 0.00705, 1e-5, 'level 15 gravity');

  const game = new Game({ seed: 2 });
  const startY = game.active!.y;
  game.update(0.5);
  assertEqual(game.active!.y, startY, 'piece should not fall before one second');
  game.update(0.51);
  assertEqual(game.active!.y, startY + 1, 'piece should fall exactly one row');
});

test('soft drop accelerates gravity and awards one point per row', () => {
  const game = new Game({ seed: 3 });
  const startY = game.active!.y;
  game.setSoftDrop(true);
  game.update(0.12);
  assertEqual(game.active!.y, startY + 2, 'soft drop should move two rows');
  assertEqual(game.score, 2, 'soft drop should award one point per row');
});

test('lock delay waits half a second before locking', () => {
  const game = new Game({ seed: 4 });
  game.board = emptyBoard();
  game.active = { type: 'T', rotation: 0, x: 3, y: 18 };

  game.update(0.3);
  game.update(0.19);
  assertEqual(pieceCount(game), 0, 'piece should not lock before 0.5 seconds');

  game.update(0.02);
  assertEqual(pieceCount(game), 4, 'piece should lock after the delay');
  assert(game.active, 'next piece should spawn after locking');
});

test('hard drop lands the piece and awards two points per row', () => {
  const game = new Game({ seed: 5 });
  const distance = game.hardDrop();

  assert(distance > 0, 'piece should fall some distance');
  assertEqual(pieceCount(game), 4, 'four minos should be locked');
  assertEqual(game.score, distance * 2, 'hard drop score');
});

test('hold swaps the active and held pieces once per drop', () => {
  const game = new Game({ seed: 6 });
  const originalType = game.active!.type;
  const queuedType = game.nextQueue[0];

  assert(game.hold(), 'first hold should succeed');
  assertEqual(game.holdType, originalType, 'active piece should move to hold');
  assertEqual(game.active!.type, queuedType, 'next piece should become active');
  assertEqual(game.canHold, false, 'hold is unavailable until the piece locks');
  assertEqual(game.hold(), false, 'second hold should be rejected');
  assertEqual(game.nextQueue.length, 5, 'next queue should remain populated');

  game.hardDrop();
  assertEqual(game.canHold, true, 'hold should be available again after locking');
});

test('single line clear uses guideline scoring', () => {
  const game = new Game({ seed: 7 });
  game.board = emptyBoard();
  for (let x = 0; x < 10; x++) {
    if (x < 3 || x > 6) game.board[19][x] = 'J';
  }
  // Prevent this from also being a perfect clear.
  game.board[18][0] = 'J';
  game.active = spawnPiece('I');

  game.hardDrop();

  assertEqual(game.lines, 1, 'one line should be cleared');
  assertEqual(game.score, 136, 'single (100) plus hard drop (18 rows x 2)');
  assertEqual(game.combo, 0, 'first clear starts the combo counter');
  assertEqual(game.b2b, false, 'a single is not a difficult clear');
  assertEqual(game.board[19][0], 'J', 'remaining cells fall down');
});

test('back-to-back tetrises receive the 1.5x bonus and combo points', () => {
  const game = new Game({ seed: 8 });

  const setupTetris = (): void => {
    game.board = emptyBoard();
    for (let y = 16; y <= 19; y++) {
      for (let x = 0; x < 10; x++) {
        if (x !== 4) game.board[y][x] = 'J';
      }
    }
    // Prevent the four-row clear from also being a perfect clear.
    game.board[15][0] = 'J';
    game.active = { type: 'I', rotation: 1, x: 2, y: 0 };
  };

  setupTetris();
  game.hardDrop();
  assertEqual(game.lines, 4, 'first tetris clears four lines');
  assertEqual(game.b2b, true, 'tetris arms back-to-back');
  const scoreAfterFirst = game.score;

  setupTetris();
  game.hardDrop();

  assertEqual(game.lines, 8, 'second tetris clears four more lines');
  assertEqual(game.combo, 1, 'consecutive clear should build combo');
  assertEqual(
    game.score - scoreAfterFirst,
    1282,
    'tetris (800 x 1.5) + hard drop (16 rows x 2) + combo (50)',
  );
});

test('T-spin detection and zero-line T-spin scoring', () => {
  const game = new Game({ seed: 9 });
  const events: GameEvent[] = [];
  game.onEvent = (event) => events.push(event);

  game.board = emptyBoard();
  for (let x = 0; x < 10; x++) {
    if (x !== 4) game.board[19][x] = 'J';
  }
  game.board[17][3] = 'J';
  game.board[17][5] = 'J';
  game.active = { type: 'T', rotation: 1, x: 3, y: 17 };

  assert(game.rotate(-1), 'T should rotate into the overhang');
  game.hardDrop();

  assertEqual(game.score, 400, 'a T-spin with no lines is worth 400');
  const spinEvent = events.find((event) => event.type === 'clear');
  assert(spinEvent && spinEvent.type === 'clear', 'clear event should be emitted');
  assertEqual(spinEvent.spin, 'tspin', 'three-corner rule should identify a T-spin');
  assertEqual(spinEvent.count, 0, 'no lines should be cleared');
  assertEqual(spinEvent.label, 'T-SPIN', 'event label');
});

test('blocked spawn tops the game out', () => {
  const game = new Game({ seed: 10 });
  game.nextQueue[0] = 'O';
  const spawn = spawnPiece('O');
  for (const cell of absoluteCells(spawn)) {
    game.board[cell.y][cell.x] = 'J';
  }

  game.hardDrop();

  assertEqual(game.state, 'gameover', 'game should be over after a blocked spawn');
});

test('pause freezes gravity and resume continues play', () => {
  const game = new Game({ seed: 11 });
  game.togglePause();
  assertEqual(game.state, 'paused', 'game should pause');
  const y = game.active!.y;
  game.update(2);
  assertEqual(game.active!.y, y, 'paused game should not update');

  game.togglePause();
  assertEqual(game.state, 'playing', 'game should resume');
  game.update(1.01);
  assertEqual(game.active!.y, y + 1, 'gravity should resume');
});

test('ghost piece marks the hard drop landing row', () => {
  const game = new Game({ seed: 12 });
  const ghost = game.ghost();
  assert(ghost, 'ghost should exist while a piece is active');
  assert(ghost.y > game.active!.y, 'ghost should be below the active piece');
  assert(!game.canPlace({ ...ghost, y: ghost.y + 1 }), 'ghost should be grounded');
});

test('reset restores a clean, playable game', () => {
  const game = new Game({ seed: 13 });
  game.hardDrop();
  game.score = 12345;
  game.lines = 25;
  game.level = 3;
  game.state = 'gameover';

  game.reset();

  assertEqual(game.score, 0, 'score resets');
  assertEqual(game.lines, 0, 'lines reset');
  assertEqual(game.level, 1, 'level resets');
  assertEqual(game.state, 'playing', 'state resets');
  assertEqual(pieceCount(game), 0, 'board resets');
  assertEqual(game.nextQueue.length, 5, 'queue is filled');
  assert(game.active, 'a new piece is active');
});

test('a perfect clear awards its guideline bonus', () => {
  const game = new Game({ seed: 14 });
  const events: GameEvent[] = [];
  game.onEvent = (event) => events.push(event);

  game.board = emptyBoard();
  for (let x = 0; x < 10; x++) {
    if (x < 3 || x > 6) game.board[19][x] = 'J';
  }
  game.active = spawnPiece('I');

  game.hardDrop();

  assertEqual(game.lines, 1, 'line cleared');
  assert(pieceCount(game) === 0, 'board should be empty after a perfect clear');
  assertEqual(game.score, 936, 'single (100) + perfect clear (800) + hard drop (36)');

  const clearEvent = events.find((event) => event.type === 'clear');
  assert(clearEvent && clearEvent.type === 'clear', 'clear event should be emitted');
  assertEqual(clearEvent.perfectClear, true, 'perfect clear flag');
  assertEqual(clearEvent.label, 'PERFECT CLEAR', 'perfect clear label');
});

test('ten cleared lines advance the level', () => {
  const game = new Game({ seed: 15 });
  const levels: number[] = [];
  game.onEvent = (event) => {
    if (event.type === 'levelup') levels.push(event.level);
  };

  game.board = emptyBoard();
  for (let x = 0; x < 10; x++) {
    if (x < 3 || x > 6) game.board[19][x] = 'J';
  }
  game.board[18][0] = 'J';
  game.lines = 9;
  game.active = spawnPiece('I');

  game.hardDrop();

  assertEqual(game.lines, 10, 'ten total lines');
  assertEqual(game.level, 2, 'level should advance');
  assertEqual(levels.length, 1, 'one level-up event');
  assertEqual(levels[0], 2, 'event carries the new level');
});

test('guideline clear values are available to the scoring model', () => {
  assertEqual(baseClearPoints(1, 'none'), 100, 'single');
  assertEqual(baseClearPoints(2, 'none'), 300, 'double');
  assertEqual(baseClearPoints(3, 'none'), 500, 'triple');
  assertEqual(baseClearPoints(4, 'none'), 800, 'tetris');
  assertEqual(baseClearPoints(1, 'tspin'), 800, 'T-spin single');
  assertEqual(baseClearPoints(2, 'tspin'), 1200, 'T-spin double');
  assertEqual(baseClearPoints(3, 'tspin'), 1600, 'T-spin triple');
  assertEqual(baseClearPoints(1, 'mini'), 200, 'T-spin mini single');
});

if (failures.length > 0) {
  console.error(`\n${failures.length} smoke test(s) failed:`);
  for (const name of failures) console.error(`  - ${name}`);
  throw new Error(`${failures.length} smoke test(s) failed`);
}

console.log(`\nAll ${passed} smoke tests passed.`);
