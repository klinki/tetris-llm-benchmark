// Headless smoke tests for the core Tetris logic (runs against dist/ in Node).
// Usage: npm test  (builds first, then runs this file)
import assert from "node:assert/strict";

import { Board } from "../dist/board.js";
import { COLS, ROWS } from "../dist/constants.js";
import { Game, gravityMsPerRow } from "../dist/game.js";
import { KINDS, PIECE_CELLS, SPAWN_X } from "../dist/pieces.js";
import { BagRandomizer } from "../dist/random.js";

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

// Put a known piece in the spawn position.
function setCurrent(game, kind) {
  game.current = { kind, rotation: 0, x: SPAWN_X[kind], y: 0 };
}

test("7-bag randomizer deals every kind once per bag", () => {
  const bag = new BagRandomizer();
  const dealt = [];
  for (let i = 0; i < 28; i++) dealt.push(bag.next());
  for (let start = 0; start < dealt.length; start += 7) {
    const window = dealt.slice(start, start + 7).sort();
    assert.deepEqual(window, [...KINDS].sort());
  }
});

test("every rotation state of every piece has 4 cells", () => {
  for (const kind of KINDS) {
    for (let rotation = 0; rotation < 4; rotation++) {
      assert.equal(PIECE_CELLS[kind][rotation].length, 4, `${kind} rotation ${rotation}`);
    }
  }
  // O is identical in all four states
  for (let rotation = 0; rotation < 4; rotation++) {
    assert.deepEqual(PIECE_CELLS.O[rotation], PIECE_CELLS.O[0]);
  }
  // SRS orientation spot checks
  assert.deepEqual(PIECE_CELLS.I[0], [
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
    { x: 3, y: 1 },
  ]);
  assert.deepEqual(PIECE_CELLS.T[1], [
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
    { x: 1, y: 2 },
  ]);
});

test("board clears full rows and shifts the stack down", () => {
  const board = new Board();
  for (let x = 0; x < COLS; x++) {
    board.set(x, ROWS - 1, "I");
    board.set(x, ROWS - 2, "J");
  }
  board.set(0, ROWS - 3, "T"); // rests on top of the filled rows
  assert.equal(board.clearLines(), 2);
  assert.equal(board.get(0, ROWS - 1), "T");
  assert.equal(board.get(1, ROWS - 1), null);
  assert.equal(board.get(0, ROWS - 2), null);
});

test("pieces cannot pass the walls", () => {
  const game = new Game();
  game.start();
  setCurrent(game, "I");
  for (let i = 0; i < 10; i++) game.moveLeft();
  assert.equal(game.current.x, 0, "I is flush with the left wall");
  game.moveLeft();
  assert.equal(game.current.x, 0, "cannot move past the left wall");
  for (let i = 0; i < 10; i++) game.moveRight();
  assert.equal(game.current.x, COLS - 4, "I is flush with the right wall");
  game.moveRight();
  assert.equal(game.current.x, COLS - 4, "cannot move past the right wall");
});

test("gravity drops one row per second at level 1", () => {
  const game = new Game();
  game.start();
  assert.equal(game.level, 1);
  game.update(999);
  assert.equal(game.current.y, 0);
  game.update(1);
  assert.equal(game.current.y, 1);
});

test("gravity follows the guideline curve", () => {
  assert.equal(gravityMsPerRow(1), 1000);
  assert.ok(Math.abs(gravityMsPerRow(2) - 793) < 1);
  assert.ok(gravityMsPerRow(9) < gravityMsPerRow(8));
  assert.ok(gravityMsPerRow(20) < 20);
  assert.ok(gravityMsPerRow(500) > 0, "extreme levels stay well behaved");
});

test("hard drop lands on the floor and scores 2 per cell", () => {
  const game = new Game();
  game.start();
  setCurrent(game, "I");
  game.hardDrop();
  // I fell from row 0 to row ROWS - 2: (ROWS - 2) cells at 2 points each
  assert.equal(game.score, (ROWS - 2) * 2);
  for (let x = 3; x <= 6; x++) assert.equal(game.board.get(x, ROWS - 1), "I");
  assert.equal(game.board.get(2, ROWS - 1), null);
  assert.notEqual(game.current, null, "next piece spawned");
  assert.equal(game.current.y, 0);
});

test("soft drop scores 1 per cell", () => {
  const game = new Game();
  game.start();
  setCurrent(game, "T");
  game.softDropping = true;
  game.update(100); // 20x level-1 gravity => two rows
  game.softDropping = false;
  assert.equal(game.current.y, 2);
  assert.equal(game.score, 2);
});

test("single line clear scores 100 x level", () => {
  const game = new Game();
  game.start();
  const { board } = game;
  for (let x = 0; x < COLS; x++) {
    if (x !== 4 && x !== 5) board.set(x, ROWS - 1, "L");
  }
  setCurrent(game, "O");
  game.hardDrop();
  // O fell (ROWS - 2) cells (2 points each) and cleared a single (100 at level 1)
  assert.equal(game.score, (ROWS - 2) * 2 + 100);
  assert.equal(game.lines, 1);
  assert.equal(game.level, 1);
  // the top half of the O survived the clear and landed on the floor
  assert.equal(board.get(4, ROWS - 1), "O");
  assert.equal(board.get(5, ROWS - 1), "O");
  assert.equal(board.get(3, ROWS - 1), null);
});

test("tetris, back-to-back and combo scoring", () => {
  const game = new Game();
  game.start();
  const { board } = game;
  const fillWell = () => {
    for (let y = ROWS - 4; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (x !== 5) board.set(x, y, "S");
      }
    }
  };
  const dropVerticalI = () => {
    setCurrent(game, "I");
    game.rotateClockwise(); // stand the I up (column 5, over the well)
    assert.equal(game.current.rotation, 1);
    game.hardDrop(); // falls 18 cells into the well
  };

  fillWell();
  dropVerticalI();
  assert.equal(game.score, 18 * 2 + 800, "tetris scores 800 x level");
  assert.equal(game.lines, 4);
  assert.equal(game.backToBack, true);

  fillWell();
  dropVerticalI();
  // 18 cells dropped (36) + back-to-back tetris (800 x 1.5) + combo (50 x 1)
  assert.equal(game.score, 18 * 2 + 800 + (18 * 2 + 1200 + 50));
  assert.equal(game.lines, 8);
  assert.equal(game.level, 1);
});

test("level increases every 10 lines", () => {
  const game = new Game();
  game.start();
  const { board } = game;
  const clearSingle = () => {
    for (let x = 0; x < COLS; x++) {
      if (x !== 4 && x !== 5) board.set(x, ROWS - 1, "L");
    }
    setCurrent(game, "O");
    game.hardDrop();
    board.set(4, ROWS - 1, null); // clean up the O remains
    board.set(5, ROWS - 1, null);
  };
  for (let i = 0; i < 10; i++) clearSingle();
  assert.equal(game.lines, 10);
  assert.equal(game.level, 2);
});

test("SRS wall kick stands a grounded I piece up", () => {
  const game = new Game();
  game.start();
  setCurrent(game, "I");
  game.current.y = ROWS - 2; // lying flat on the floor
  game.rotateClockwise();
  assert.equal(game.current.rotation, 1);
  // kick test 5 (+1, +2 up) lifts it upright one column to the right
  assert.equal(game.current.x, SPAWN_X.I + 1);
  assert.equal(game.current.y, ROWS - 4);
});

test("SRS wall kick pushes a T piece off the left wall", () => {
  const game = new Game();
  game.start();
  setCurrent(game, "T");
  game.current.rotation = 1; // pointing right
  game.current.x = -1; // flush with the left wall
  game.rotateClockwise();
  assert.equal(game.current.rotation, 2);
  assert.equal(game.current.x, 0, "kick (1, 0) moved it off the wall");
});

test("lock delay holds a grounded piece and movement resets it", () => {
  const game = new Game();
  game.start();
  setCurrent(game, "I");
  // ledge for the I to rest on: floor cells under its landing spot
  for (let x = 3; x <= 6; x++) game.board.set(x, ROWS - 1, "Z");

  game.softDropping = true;
  for (let i = 0; i < 19; i++) game.update(50); // 20x gravity: one row per call
  game.softDropping = false;
  assert.equal(game.current.y, ROWS - 3, "resting on the ledge");
  assert.equal(game.current.kind, "I", "not locked yet");

  for (let i = 0; i < 8; i++) game.update(50); // 400ms of lock delay
  assert.equal(game.current.kind, "I", "still inside the 500ms lock delay");

  game.moveLeft(); // resets the lock delay
  for (let i = 0; i < 9; i++) game.update(50); // 450ms more
  assert.equal(game.current.kind, "I", "movement reset the lock delay");

  game.update(50); // 500ms reached
  assert.equal(game.board.get(2, ROWS - 2), "I", "piece locked into the stack");
  assert.equal(game.current.y, 0, "fresh piece spawned");
});

test("hold swaps the piece and works once per drop", () => {
  const game = new Game();
  game.start();
  setCurrent(game, "T");
  game.holdPiece();
  assert.equal(game.held, "T");
  assert.equal(game.current.y, 0);
  assert.equal(game.current.rotation, 0);
  const spawned = game.current;

  game.holdPiece(); // ignored until the current piece locks
  assert.equal(game.current, spawned);
  assert.equal(game.held, "T");

  game.hardDrop();
  game.holdPiece();
  assert.equal(game.current.kind, "T", "held piece comes back");
  assert.equal(game.current.x, SPAWN_X.T);
  assert.equal(game.current.y, 0);
  assert.equal(game.current.rotation, 0);
  const held = game.current;
  game.holdPiece(); // only once per piece again
  assert.equal(game.current, held);
});

test("ghost piece marks the landing position", () => {
  const game = new Game();
  game.start();
  setCurrent(game, "I");
  assert.equal(game.ghostY(), ROWS - 2);
  game.board.set(5, ROWS - 5, "T");
  assert.equal(game.ghostY(), ROWS - 7);
});

test("game over on blocked spawn, restart resets everything", () => {
  const game = new Game();
  game.start();
  // Block the spawn zone so that no piece can spawn. The rows are only
  // partially filled so they never clear when the current piece locks.
  for (const [x, y] of [
    [3, 0], [4, 0], [5, 0],
    [3, 1], [4, 1], [5, 1], [6, 1],
  ]) {
    game.board.set(x, y, "Z");
  }
  game.hardDrop(); // locks the current piece, the next spawn is blocked
  assert.equal(game.status, "gameover");

  game.update(100); // inert after game over
  game.hardDrop();
  assert.equal(game.status, "gameover");

  game.restart();
  assert.equal(game.status, "playing");
  assert.equal(game.score, 0);
  assert.equal(game.lines, 0);
  assert.equal(game.level, 1);
  assert.equal(game.held, null);
  assert.notEqual(game.current, null);
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      assert.equal(game.board.get(x, y), null);
    }
  }
});

let passed = 0;
let failed = 0;
for (const { name, fn } of tests) {
  try {
    fn();
    passed++;
    console.log(`ok    - ${name}`);
  } catch (error) {
    failed++;
    console.error(`FAIL  - ${name}`);
    console.error(error);
  }
}
console.log(`\n${passed} passed, ${failed} failed, ${passed + failed} total`);
if (failed > 0) process.exitCode = 1;
