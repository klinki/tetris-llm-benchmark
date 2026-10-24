// Headless smoke tests for the game logic. No test framework: run with `npm test`.
import { SevenBag, type PieceSource } from "../src/bag.js";
import { Board } from "../src/board.js";
import { ARR_MS, COLS, DAS_MS, HIDDEN_ROWS, LOCK_DELAY_MS, ROWS, SPAWN_Y } from "../src/constants.js";
import { Game } from "../src/game.js";
import { InputController } from "../src/input.js";
import { cellsOf, PIECE_TYPES, SHAPES, type PieceType } from "../src/pieces.js";
import { gravityMs, levelFor } from "../src/scoring.js";

declare const process: { exitCode?: number };

const BOTTOM = ROWS - 1;

const tests: [name: string, run: () => void][] = [];

function test(name: string, run: () => void): void {
  tests.push([name, run]);
}

function expect<T>(actual: T, expected: T, what = "value"): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${what}: expected ${e}, got ${a}`);
}

/** A piece source that deals the given pieces over and over. */
function scripted(types: PieceType[]): PieceSource {
  let index = 0;
  return {
    next: () => types[index++ % types.length],
    peek: (count) => Array.from({ length: count }, (_, i) => types[(index + i) % types.length]),
  };
}

function gameWith(...types: PieceType[]): Game {
  return new Game(scripted(types));
}

/** Fills the cells of the given rows, except for the listed columns. */
function fillRows(board: Board, rows: number[], emptyColumns: number[]): void {
  for (const y of rows) {
    for (let x = 0; x < COLS; x++) {
      if (!emptyColumns.includes(x)) board.set(x, y, "J");
    }
  }
}

function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- Pieces and randomizer -------------------------------------------------

test("7-bag deals every piece exactly once per bag", () => {
  const bag = new SevenBag(seededRandom(1));
  for (let i = 0; i < 10; i++) {
    const dealt = Array.from({ length: 7 }, () => bag.next());
    expect([...dealt].sort(), [...PIECE_TYPES].sort(), `bag ${i}`);
  }
});

test("peeking at the queue does not consume pieces", () => {
  const bag = new SevenBag(seededRandom(2));
  const preview = bag.peek(10);
  expect(Array.from({ length: 10 }, () => bag.next()), preview);
});

test("every piece has four blocks in every rotation", () => {
  for (const type of PIECE_TYPES) {
    for (const cells of SHAPES[type].rotations) expect(cells.length, 4, `${type} blocks`);
  }
});

test("rotating clockwise follows the Super Rotation System", () => {
  const sorted = (type: PieceType, rotation: number) =>
    JSON.stringify([...SHAPES[type].rotations[rotation]].sort());
  expect(sorted("T", 1), JSON.stringify([[1, 0], [1, 1], [1, 2], [2, 1]]));
  expect(sorted("I", 1), JSON.stringify([[2, 0], [2, 1], [2, 2], [2, 3]]));
  expect(sorted("O", 3), sorted("O", 0));
});

test("pieces spawn centred above the playfield and drop one row", () => {
  const spawnColumns = (type: PieceType) => {
    const game = gameWith(type);
    expect(game.piece.y, SPAWN_Y + 1, `${type} y`);
    return cellsOf(game.piece).map(([x]) => x);
  };
  expect(Math.min(...spawnColumns("T")), 3);
  expect(Math.max(...spawnColumns("T")), 5);
  expect(Math.min(...spawnColumns("O")), 4);
  expect(Math.max(...spawnColumns("O")), 5);
  expect(Math.min(...spawnColumns("I")), 3);
  expect(Math.max(...spawnColumns("I")), 6);
});

// --- Movement and rotation -------------------------------------------------

test("pieces cannot move through the walls", () => {
  const game = gameWith("T");
  for (let i = 0; i < 20; i++) game.move(-1);
  expect(Math.min(...cellsOf(game.piece).map(([x]) => x)), 0, "left edge");
  expect(game.move(-1), false, "move into wall");
  for (let i = 0; i < 20; i++) game.move(1);
  expect(Math.max(...cellsOf(game.piece).map(([x]) => x)), COLS - 1, "right edge");
});

test("rotation wall-kicks away from a wall", () => {
  const game = gameWith("I");
  game.piece = { type: "I", rotation: 1, x: 7, y: 10 }; // vertical, in the last column
  expect(game.rotate(-1), true, "rotated");
  expect(game.piece.rotation, 0, "rotation");
  expect(Math.max(...cellsOf(game.piece).map(([x]) => x)), COLS - 1, "kicked back inside");
});

test("rotation fails when no kick fits", () => {
  const game = gameWith("I");
  game.piece = { type: "I", rotation: 1, x: 3, y: 10 }; // vertical in column 5
  fillRows(game.board, Array.from({ length: BOTTOM }, (_, y) => y), [5]); // a one-wide shaft
  expect(game.rotate(1), false, "blocked rotation");
  expect(game.piece.rotation, 1, "rotation unchanged");
});

// --- Dropping, locking and hold --------------------------------------------

test("hard drop lands on the floor, scores two points per row and spawns the next piece", () => {
  const game = gameWith("O", "T");
  const rows = BOTTOM - 1 - game.piece.y;
  game.hardDrop();
  expect(game.board.get(4, BOTTOM), "O");
  expect(game.board.get(5, BOTTOM - 1), "O");
  expect(game.score, rows * 2, "score");
  expect(game.piece.type, "T", "next piece");
});

test("the ghost piece shows where the piece will land", () => {
  const game = gameWith("L");
  fillRows(game.board, [BOTTOM], [0, 1]);
  const ghost = game.ghost();
  game.hardDrop();
  for (const [x, y] of cellsOf(ghost)) expect(game.board.get(x, y), "L", `block ${x},${y}`);
});

test("the next queue previews upcoming pieces", () => {
  const game = gameWith("I", "O", "T", "S", "Z", "J", "L");
  expect(game.next, ["O", "T", "S", "Z", "J"]);
  game.hardDrop();
  expect(game.piece.type, "O");
  expect(game.next, ["T", "S", "Z", "J", "L"]);
});

test("hold swaps pieces once per drop", () => {
  const game = gameWith("I", "O", "T");
  game.holdPiece();
  expect([game.hold, game.piece.type], ["I", "O"]);
  game.holdPiece(); // not allowed twice in a row
  expect([game.hold, game.piece.type], ["I", "O"]);
  game.hardDrop();
  expect(game.piece.type, "T");
  game.holdPiece();
  expect([game.hold, game.piece.type], ["T", "I"]);
});

test("gravity pulls a piece down one row per second on level 1", () => {
  const game = gameWith("T");
  const y = game.piece.y;
  game.update(999);
  expect(game.piece.y, y, "before a second");
  game.update(2);
  expect(game.piece.y, y + 1, "after a second");
});

test("soft drop falls faster and scores a point per row", () => {
  const game = gameWith("T");
  const y = game.piece.y;
  game.setSoftDrop(true);
  game.update(50);
  expect(game.piece.y, y + 1);
  expect(game.score, 1);
});

test("a resting piece locks after the lock delay", () => {
  const game = gameWith("O");
  game.piece = { type: "O", rotation: 0, x: 4, y: BOTTOM - 1 };
  game.update(LOCK_DELAY_MS - 1);
  expect(game.board.get(4, BOTTOM), null, "still falling");
  game.update(2);
  expect(game.board.get(4, BOTTOM), "O", "locked");
});

test("moving a resting piece restarts the lock delay, but only 15 times", () => {
  const game = gameWith("O");
  game.piece = { type: "O", rotation: 0, x: 4, y: BOTTOM - 1 };
  game.update(LOCK_DELAY_MS - 100);
  game.move(-1);
  game.update(LOCK_DELAY_MS - 100);
  expect(game.piece.y, BOTTOM - 1, "timer was restarted");

  let moves = 1;
  while (game.piece.y === BOTTOM - 1 && moves < 100) {
    game.move(moves % 2 ? 1 : -1);
    game.update(100);
    moves++;
  }
  expect(moves > 15 && moves < 30, true, `locked after ${moves} moves`);
});

// --- Scoring ---------------------------------------------------------------

test("clearing a line scores and removes the row", () => {
  const game = gameWith("I");
  fillRows(game.board, [BOTTOM], [0, 1, 2, 3]);
  game.piece = { type: "I", rotation: 0, x: 0, y: BOTTOM - 1 };
  game.hardDrop();
  expect([game.lines, game.score], [1, 100 + 800], "single + perfect clear");
  expect(game.board.isEmpty(), true, "board cleared");
});

test("a tetris scores 800, and back-to-back tetrises score 1.5x plus combo", () => {
  const game = gameWith("I");
  const tetris = () => {
    fillRows(game.board, [BOTTOM - 3, BOTTOM - 2, BOTTOM - 1, BOTTOM], [9]);
    game.board.set(0, BOTTOM - 4, "O"); // keeps the board from being a perfect clear
    game.piece = { type: "I", rotation: 1, x: 7, y: BOTTOM - 3 };
    game.hardDrop();
  };
  tetris();
  expect(game.score, 800, "first tetris");
  tetris();
  expect(game.score, 800 + 1200 + 50, "back-to-back tetris with combo");
  expect(game.announcement, ["Tetris", "Back-to-Back", "Combo x1"]);
  expect(game.lines, 8);
});

test("a T piece rotated into a slot scores as a T-Spin", () => {
  const setup = (rotation: 1 | 2): Game => {
    const game = gameWith("T");
    fillRows(game.board, [BOTTOM], [4]);
    fillRows(game.board, [BOTTOM - 1], [3, 4, 5]);
    game.board.set(3, BOTTOM - 2, "O"); // overhang
    game.piece = { type: "T", rotation, x: 3, y: BOTTOM - 2 };
    return game;
  };

  const spun = setup(1);
  expect(spun.rotate(1), true, "rotate into slot");
  spun.hardDrop();
  expect([spun.lines, spun.score, spun.announcement], [2, 1200, ["T-Spin Double"]]);

  const dropped = setup(2); // same placement, but without a rotation
  dropped.hardDrop();
  expect([dropped.lines, dropped.score, dropped.announcement], [2, 300, ["Double"]]);
});

test("levels rise every ten lines and gravity speeds up", () => {
  expect([levelFor(0), levelFor(9), levelFor(10), levelFor(10_000)], [1, 1, 2, 15]);
  expect(gravityMs(1), 1000);
  expect(gravityMs(5) < gravityMs(2) && gravityMs(2) < gravityMs(1), true, "faster with level");
});

// --- Game flow -------------------------------------------------------------

test("the game ends when a new piece cannot spawn, and r restarts it", () => {
  const game = gameWith("O", "T");
  game.board.set(4, SPAWN_Y, "J"); // blocks the T's spawn position
  game.hardDrop();
  expect(game.status, "gameOver");
  expect(game.move(-1), false, "no moves after game over");

  game.restart();
  expect([game.status, game.score, game.board.isEmpty()], ["playing", 0, true]);
});

test("the game ends when a piece locks above the visible playfield", () => {
  const game = gameWith("O");
  game.board.set(4, 7, "J");
  game.piece = { type: "O", rotation: 0, x: 4, y: 5 };
  game.hardDrop();
  expect(game.status, "gameOver");
  expect(cellsOf(game.piece).every(([, y]) => y < HIDDEN_ROWS), true, "locked in the hidden rows");
});

test("restart is ignored while playing", () => {
  const game = gameWith("O");
  game.hardDrop();
  const score = game.score;
  game.restart();
  expect(game.score, score);
});

test("pausing freezes the game", () => {
  const game = gameWith("T");
  const y = game.piece.y;
  game.togglePause();
  game.update(5000);
  expect([game.status, game.piece.y, game.move(1)], ["paused", y, false]);
  game.togglePause();
  expect(game.status, "playing");
});

// --- Input -----------------------------------------------------------------

test("holding left or right auto-repeats after DAS at the ARR rate", () => {
  const game = gameWith("T");
  const input = new InputController(game);
  const x = game.piece.x;

  input.press("left");
  expect(game.piece.x, x - 1, "initial move");
  input.update(DAS_MS - 1);
  expect(game.piece.x, x - 1, "before DAS");
  input.update(1);
  expect(game.piece.x, x - 2, "after DAS");
  input.update(ARR_MS);
  expect(game.piece.x, x - 3, "repeat");

  input.press("right"); // the most recently pressed direction wins
  expect(game.piece.x, x - 2, "switched direction");
  input.release("right");
  input.release("left");
  input.update(1000);
  expect(game.piece.x, x - 2, "released");
});

// --- Runner ----------------------------------------------------------------

let failures = 0;
for (const [name, run] of tests) {
  try {
    run();
    console.log(`  ok    ${name}`);
  } catch (error) {
    failures++;
    console.log(`  FAIL  ${name}\n        ${error instanceof Error ? error.message : error}`);
  }
}
console.log(`\n${tests.length - failures}/${tests.length} tests passed`);
if (failures > 0) process.exitCode = 1;
