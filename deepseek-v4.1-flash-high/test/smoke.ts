/**
 * Headless logic smoke tests. No DOM and no test framework: `npm test` compiles
 * the sources and runs this file with Node.
 */

import { Board } from "../src/core/board.js";
import { BOARD_HEIGHT, BOARD_WIDTH, LOCK_DELAY_MS, NEXT_QUEUE_SIZE } from "../src/core/constants.js";
import { Game } from "../src/core/game.js";
import {
  PIECE_TYPES,
  getKicks,
  pieceBounds,
  shapeCells,
  spawnPosition,
} from "../src/core/pieces.js";
import { BagRandomizer, mulberry32 } from "../src/core/randomizer.js";
import {
  baseClearScore,
  gravityIntervalMs,
  levelForLines,
  scoreClear,
  type ScoreInput,
} from "../src/core/scoring.js";
import { detectTSpin } from "../src/core/tspin.js";
import type { ActivePiece, PieceType, Rotation, TSpinKind } from "../src/core/types.js";

let passed = 0;
const failures: string[] = [];

function test(name: string, run: () => void): void {
  try {
    run();
    passed += 1;
    console.log(`ok   ${name}`);
  } catch (error) {
    failures.push(name);
    console.error(`FAIL ${name}`);
    console.error(`     ${error instanceof Error ? error.message : String(error)}`);
  }
}

function assert(condition: unknown, message = "expected condition to be true"): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message = "values differ"): void {
  if (!Object.is(actual, expected)) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

const rotations: Rotation[] = [0, 1, 2, 3];

function score(
  lines: number,
  tspin: TSpinKind = "none",
  overrides: Partial<ScoreInput> = {},
): ReturnType<typeof scoreClear> {
  return scoreClear({
    lines,
    tspin,
    perfectClear: false,
    level: 1,
    backToBack: false,
    combo: 0,
    ...overrides,
  });
}

// --- Randomizer -----------------------------------------------------------

test("7-bag yields every tetromino exactly once per bag", () => {
  const bag = new BagRandomizer(mulberry32(1234));
  for (let index = 0; index < 100; index += 1) {
    const seen = new Set<PieceType>();
    for (let draw = 0; draw < 7; draw += 1) seen.add(bag.next());
    assertEqual(seen.size, 7, `bag ${index} should have 7 unique pieces`);
    for (const type of PIECE_TYPES) assert(seen.has(type), `bag ${index} missing ${type}`);
  }
});

test("seeded randomizer is deterministic", () => {
  const first = new BagRandomizer(mulberry32(77));
  const second = new BagRandomizer(mulberry32(77));
  for (let index = 0; index < 50; index += 1) {
    assertEqual(first.next(), second.next(), `draw ${index}`);
  }
});

// --- Pieces ---------------------------------------------------------------

test("every rotation of every piece has exactly four cells", () => {
  for (const type of PIECE_TYPES) {
    for (const rotation of rotations) {
      assertEqual(shapeCells(type, rotation).length, 4, `${type} rotation ${rotation}`);
    }
  }
});

test("spawn positions are centered and inside the board", () => {
  for (const type of PIECE_TYPES) {
    const spawn = spawnPosition(type);
    const bounds = pieceBounds(type);
    assertEqual(spawn.x, Math.floor((BOARD_WIDTH - bounds.width) / 2), `${type} horizontal centering`);
    for (const cell of shapeCells(type, 0)) {
      assert(
        spawn.x + cell.x >= 0 && spawn.x + cell.x < BOARD_WIDTH,
        `${type} spawns within the board walls`,
      );
      assert(spawn.y + cell.y >= 0 && spawn.y + cell.y < BOARD_HEIGHT, `${type} spawn row`);
    }
  }
});

test("wall kick tables follow SRS", () => {
  assertEqual(getKicks("O", 0, 1).length, 1);
  assertEqual(getKicks("T", 0, 1).length, 5);
  const lastI = getKicks("I", 0, 1)[4];
  assertEqual(lastI.x, 1, "I kick x");
  assertEqual(lastI.y, 2, "I kick y");
});

// --- Board ----------------------------------------------------------------

test("board blocks walls, floor and occupied cells but not empty space above", () => {
  const board = new Board();
  assert(board.isBlocked(-1, 5), "left wall");
  assert(board.isBlocked(BOARD_WIDTH, 5), "right wall");
  assert(board.isBlocked(5, BOARD_HEIGHT), "floor");
  assert(!board.isBlocked(0, -1), "space above the board is free");
  board.setCell(4, 4, "S");
  assert(!board.canPlace([{ x: 4, y: 4 }]), "occupied cell blocks placement");
  assert(board.canPlace([{ x: 4, y: 3 }]), "free cell allows placement");
});

test("clearing a line removes it and shifts everything down", () => {
  const board = new Board();
  for (let x = 0; x < BOARD_WIDTH; x += 1) {
    board.setCell(x, BOARD_HEIGHT - 1, "I");
  }
  board.setCell(0, BOARD_HEIGHT - 2, "T");

  const cleared = board.clearLines();
  assertEqual(cleared.length, 1);
  assertEqual(cleared[0], BOARD_HEIGHT - 1);
  assertEqual(board.getCell(0, BOARD_HEIGHT - 1), "T", "row above fell down");
  assert(board.isRowEmpty(BOARD_HEIGHT - 2), "the row above the cleared line is now empty");
  assertEqual(board.getCell(1, BOARD_HEIGHT - 1), null, "only the original stack remains");
});

test("perfect clear detection", () => {
  const board = new Board();
  for (let x = 0; x < BOARD_WIDTH; x += 1) board.setCell(x, BOARD_HEIGHT - 1, "J");
  board.clearLines();
  assert(board.isPerfectClear(), "clearing the only stack is a perfect clear");

  const dirty = new Board();
  dirty.setCell(0, 0, "J");
  for (let x = 0; x < BOARD_WIDTH; x += 1) dirty.setCell(x, BOARD_HEIGHT - 1, "J");
  dirty.clearLines();
  assert(!dirty.isPerfectClear(), "leftover blocks are not a perfect clear");
});

// --- Scoring --------------------------------------------------------------

test("base line scores match the Guideline", () => {
  assertEqual(baseClearScore(1, "none"), 100);
  assertEqual(baseClearScore(2, "none"), 300);
  assertEqual(baseClearScore(3, "none"), 500);
  assertEqual(baseClearScore(4, "none"), 800);
});

test("level multiplier, combo, back-to-back and perfect clear", () => {
  assertEqual(score(1).points, 100);
  assertEqual(score(1, "none", { level: 2 }).points, 200);
  assertEqual(score(4, "none", { combo: 1 }).points, 850, "tetris with one combo");
  assertEqual(score(4, "none", { backToBack: true }).points, 1200, "back-to-back tetris");
  assertEqual(score(1, "none", { perfectClear: true }).points, 900);
  assertEqual(score(4, "none", { perfectClear: true }).points, 2800);
  assertEqual(score(4, "none", { backToBack: true, perfectClear: true }).points, 4400);
});

test("back-to-back tracking only breaks on non-difficult line clears", () => {
  assertEqual(score(4, "none", { backToBack: true }).backToBack, true);
  assertEqual(score(1, "none", { backToBack: true }).backToBack, false);
  assertEqual(score(0, "none", { backToBack: true }).backToBack, true, "no clear keeps b2b");
  assertEqual(score(0, "full", { backToBack: false }).backToBack, false, "no-line T-spin keeps b2b");
});

test("T-spin scoring", () => {
  assertEqual(score(0, "full").points, 400);
  assertEqual(score(1, "full").points, 800);
  assertEqual(score(2, "full").points, 1200);
  assertEqual(score(3, "full").points, 1600);
  assertEqual(score(0, "mini").points, 100);
  assertEqual(score(1, "mini").points, 200);
  assertEqual(score(2, "mini").points, 400);
  assertEqual(score(1, "full", { backToBack: true }).points, 1200);
});

test("gravity follows the Guideline curve and levels advance every ten lines", () => {
  assertEqual(gravityIntervalMs(1), 1000);
  assert(gravityIntervalMs(2) < gravityIntervalMs(1), "gravity speeds up");
  assert(gravityIntervalMs(10) < gravityIntervalMs(9), "gravity speeds up further");
  assert(gravityIntervalMs(30) >= 16, "gravity is capped at one row per frame");
  assertEqual(levelForLines(0), 1);
  assertEqual(levelForLines(9), 1);
  assertEqual(levelForLines(10), 2);
  assertEqual(levelForLines(99), 10);
});

// --- T-spins --------------------------------------------------------------

test("T-spin detection uses the three-corner rule", () => {
  const board = new Board();
  const piece: ActivePiece = { type: "T", rotation: 0, x: 3, y: 18 };
  // Corners of the 3x3 box: (3,18), (5,18), (3,20), (5,20).
  board.setCell(3, 18, "J");
  board.setCell(5, 18, "J");
  board.setCell(3, 20, "J");
  assertEqual(detectTSpin(board, piece, true, 0), "full", "both front corners filled");

  board.setCell(3, 18, null);
  board.setCell(5, 20, "J");
  assertEqual(detectTSpin(board, piece, true, 0), "mini", "one front corner filled");

  assertEqual(detectTSpin(board, piece, false, 0), "none", "no rotation, no T-spin");
  assertEqual(detectTSpin(board, { ...piece, type: "L" }, true, 0), "none", "not a T piece");

  board.setCell(3, 18, "J");
  board.setCell(5, 20, null);
  assertEqual(detectTSpin(board, piece, true, 4), "full", "fifth kick upgrades a mini");
});

test("rotating a T on the floor uses an SRS kick", () => {
  const game = new Game({ seed: 2 });
  game.active = { type: "T", rotation: 0, x: 3, y: 20 };
  assert(game.rotateClockwise(), "rotation should succeed");
  assertEqual(game.active?.rotation, 1);
  assertEqual(game.active?.y, 19, "kick moved the piece up");
});

test("rotating an I near the floor uses an SRS kick", () => {
  const game = new Game({ seed: 2 });
  game.active = { type: "I", rotation: 0, x: 3, y: 19 };
  assert(game.rotateClockwise(), "rotation should succeed");
  assertEqual(game.active?.rotation, 1);
  assertEqual(game.active?.x, 1, "kicked two columns left");
  assertEqual(game.active?.y, 18, "and one row up");
});

// --- Game -----------------------------------------------------------------

test("a new game starts playing with a full queue", () => {
  const game = new Game({ seed: 9 });
  assertEqual(game.status, "playing");
  assert(game.active);
  assertEqual(game.nextQueue.length, NEXT_QUEUE_SIZE);
  assertEqual(game.level, 1);
  assertEqual(game.score, 0);
});

test("hard drop scores two points per cell and spawns the next piece", () => {
  const game = new Game({ seed: 3 });
  const piece = game.active;
  assert(piece);
  const distance = game.getGhostY() - piece.y;
  assert(distance > 0, "piece has room to fall");

  game.hardDrop();
  assertEqual(game.score, distance * 2);
  assertEqual(game.lines, 0);
  assert(game.active, "next piece spawned");
  assert(game.active !== piece, "a different piece is active");
});

test("soft drop scores one point per cell", () => {
  const game = new Game({ seed: 4 });
  game.setSoftDrop(true);
  game.update(50);
  assertEqual(game.score, 1);
});

test("hold swaps pieces but only once per piece", () => {
  const game = new Game({ seed: 21 });
  const first = game.active;
  const queued = game.nextQueue[0];
  assert(first && queued);

  assert(game.holdPiece(), "first hold succeeds");
  assertEqual(game.holdType, first.type);
  assertEqual(game.active?.type, queued);
  assertEqual(game.canHold, false);
  assert(!game.holdPiece(), "second hold is rejected until lock");

  game.hardDrop();
  assertEqual(game.canHold, true, "hold is available again after locking");
  const third = game.active;
  assert(third);
  assert(game.holdPiece(), "hold works after locking");
  assertEqual(game.active?.type, first.type, "held piece comes back");
  assertEqual(game.holdType, third.type, "current piece goes to hold");
});

test("lock delay keeps a grounded piece alive for half a second", () => {
  const game = new Game({ seed: 5 });
  game.setSoftDrop(true);

  let elapsed = 0;
  while (!game.isGrounded() && elapsed < 10_000) {
    game.update(10);
    elapsed += 10;
  }
  assert(game.isGrounded(), "piece reached the floor");

  const piece = game.active;
  assert(piece);
  game.update(LOCK_DELAY_MS - 100);
  assertEqual(game.active, piece, "piece has not locked yet");

  game.update(100);
  assert(game.active !== piece, "piece locked after the delay");
});

test("line clears, perfect clear bonus and combo run through the game", () => {
  const game = new Game({ seed: 12 });
  for (let x = 0; x < BOARD_WIDTH; x += 1) {
    game.board.setCell(x, BOARD_HEIGHT - 1, "J");
  }
  for (let x = 3; x <= 6; x += 1) {
    game.board.setCell(x, BOARD_HEIGHT - 1, null);
  }

  const piece: ActivePiece = { type: "I", rotation: 0, x: 3, y: 17 };
  game.active = piece;
  const distance = game.getGhostY() - piece.y;
  assertEqual(distance, 3, "I piece falls three rows");

  game.hardDrop();

  assertEqual(game.lines, 1);
  assertEqual(game.combo, 0, "first clear of a run is combo zero");
  assertEqual(game.score, distance * 2 + 100 + 800, "hard drop + single + perfect clear");
  assertEqual(game.lastClear?.perfectClear, true);
  assertEqual(game.lastClear?.lines, 1);
  assert(game.board.isPerfectClear(), "the field is empty after the perfect clear");
  assertEqual(game.status, "playing");
});

test("a blocked spawn tops the game out", () => {
  const game = new Game({ seed: 99 });
  for (let x = 3; x <= 6; x += 1) {
    for (let y = 0; y < 3; y += 1) game.board.setCell(x, y, "I");
  }

  game.hardDrop();
  assertEqual(game.status, "gameover");
});
test("restart clears the board and resets the score", () => {
  const game = new Game({ seed: 8 });
  game.hardDrop();
  game.score = 1234;
  assertEqual(game.status, "playing");

  game.restart();
  assertEqual(game.status, "playing");
  assertEqual(game.score, 0);
  assertEqual(game.lines, 0);
  assertEqual(game.level, 1);
  assert(game.board.isPerfectClear(), "board is empty after restart");
  assert(game.active);
});

// --- Summary --------------------------------------------------------------

if (failures.length > 0) {
  console.error(`\n${failures.length} test(s) failed:`);
  for (const name of failures) console.error(`  - ${name}`);
  throw new Error(`${failures.length} test(s) failed`);
}

console.log(`\n${passed} tests passed`);
