import test from "node:test";
import assert from "node:assert/strict";
import { Game, emptyBoard, gravityInterval, HEIGHT, WIDTH, HIDDEN_ROWS, LOCK_DELAY, MAX_LOCK_RESETS } from "../dist/game.js";
import { SevenBag, PIECE_TYPES, cellsFor, occupiedCells } from "../dist/pieces.js";
import { scoreClear } from "../dist/scoring.js";

function fresh(type = "T", rotation = 0, x = 3, y = 3) {
  const game = new Game(() => 0.5);
  game.start();
  game.active = { type, rotation, x, y };
  return game;
}
function put(game, x, y, type = "J") {
  game.board[y + HIDDEN_ROWS][x] = type;
}
function fillRow(game, y, holes = []) {
  for (let x = 0; x < WIDTH; x++) if (!holes.includes(x)) put(game, x, y);
}
function prepareTetris(game, perfect = false) {
  game.board = emptyBoard();
  if (!perfect) put(game, 0, 10);
  for (let y = 16; y < HEIGHT; y++) fillRow(game, y, [9]);
  game.active = { type: "I", rotation: 1, x: 7, y: 16 };
}
function score(overrides = {}) {
  return scoreClear({ lines: 0, spin: "none", level: 1, combo: -1, backToBack: false, perfectClear: false, ...overrides });
}

// A seeded generator makes stress cases and bag tests reproducible.
function random(seed = 17) {
  return () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

test("every seven-bag contains each shape exactly once, with bounded droughts", () => {
  const bag = new SevenBag(random());
  const sequence = Array.from({ length: 700 }, () => bag.next());
  for (let i = 0; i < sequence.length; i += 7) {
    assert.deepEqual(sequence.slice(i, i + 7).sort(), [...PIECE_TYPES].sort());
  }
  for (const type of PIECE_TYPES) {
    let previous = -1;
    sequence.forEach((piece, index) => {
      if (piece !== type) return;
      if (previous >= 0) assert.ok(index - previous <= 13);
      previous = index;
    });
  }
});

test("all pieces have four unique cells in every orientation; four turns return to spawn", () => {
  for (const type of PIECE_TYPES) {
    for (let rotation = 0; rotation < 4; rotation++) {
      const cells = cellsFor(type, rotation);
      assert.equal(cells.length, 4);
      assert.equal(new Set(cells.map(String)).size, 4);
    }
    const game = fresh(type);
    const original = occupiedCells(game.active);
    for (let i = 0; i < 4; i++) assert.equal(game.rotate(1), true);
    assert.deepEqual(occupiedCells(game.active), original);
    assert.equal(game.rotate(-1), true);
    assert.equal(game.active.rotation, 3);
  }
});

test("the game starts with a centered piece, five previews, and a 20-row hidden buffer", () => {
  const game = new Game(random());
  assert.equal(game.status, "ready");
  assert.equal(game.active, null);
  game.start();
  assert.equal(game.status, "playing");
  assert.equal(game.board.length, 40);
  assert.equal(game.queue.length, 5);
  assert.equal(game.active.x, 3);
  assert.equal(game.active.y, -1);
  assert.equal(game.collides(game.active), false);
  assert.equal(game.level, 1);
});

test("gravity advances on its exact deadline and accelerates with level", () => {
  const game = fresh();
  game.update(999);
  assert.equal(game.active.y, 3);
  game.update(1);
  assert.equal(game.active.y, 4);
  assert.equal(game.score, 0);
  assert.equal(game.elapsed, 1000);
  assert.equal(gravityInterval(1), 1000);
  assert.ok(gravityInterval(10) < gravityInterval(2));
  assert.ok(gravityInterval(1000) > 0);
});

test("held soft drop is twenty times gravity and awards one point per cell", () => {
  const game = fresh();
  assert.equal(game.softDrop(), true);
  assert.equal(game.score, 1);
  game.update(200, true);
  assert.equal(game.active.y, 8);
  assert.equal(game.score, 5);
  assert.equal(game.pieces, 0);
});

test("20G gravity and accelerated soft drop still stop at the stack and honor lock delay", () => {
  for (const softDropping of [false, true]) {
    const game = fresh("O", 0, 3, 3);
    game.level = 30;
    put(game, 4, 16);
    game.update(100, softDropping);
    assert.equal(game.active.y, 14);
    assert.equal(game.collides(game.active), false);
    assert.equal(game.pieces, 0);
    assert.equal(game.score, softDropping ? 11 : 0);
    game.update(399, softDropping);
    assert.equal(game.pieces, 0);
    game.update(101, softDropping);
    assert.equal(game.pieces, 1);
  }
});

test("soft drop on the floor cannot score or lock early", () => {
  const game = fresh("O", 0, 3, 18);
  assert.equal(game.softDrop(), false);
  assert.equal(game.score, 0);
  assert.equal(game.pieces, 0);
  game.update(LOCK_DELAY - 1, true);
  assert.equal(game.pieces, 0);
  game.update(1, true);
  assert.equal(game.pieces, 1);
});

test("ghost respects the stack without changing the active piece", () => {
  const game = fresh("O");
  put(game, 4, 15);
  const original = { ...game.active };
  assert.equal(game.ghostY, 13);
  assert.deepEqual(game.active, original);
  assert.equal(game.collides({ ...game.active, y: game.ghostY }), false);
  assert.equal(game.collides({ ...game.active, y: game.ghostY + 1 }), true);
});

test("hard drop matches the ghost, scores two per cell, locks, and spawns the preview", () => {
  const game = fresh("O", 0, 3, 3);
  const next = game.queue[0];
  assert.equal(game.hardDrop(), 15);
  assert.equal(game.score, 30);
  assert.equal(game.pieces, 1);
  assert.equal(game.cellAt(4, 19), "O");
  assert.equal(game.cellAt(5, 18), "O");
  assert.equal(game.active.type, next);
  assert.equal(game.queue.length, 5);
});

test("movement stops at the walls, the floor, and occupied cells", () => {
  const game = fresh("O", 0, -1, 18);
  assert.equal(game.move(-1), false);
  assert.equal(game.softDrop(), false);
  assert.equal(game.move(1), true);
  put(game, 3, 18);
  assert.equal(game.move(1), false);
  assert.equal(game.collides({ ...game.active, x: 8 }), true);
  assert.equal(game.collides({ ...game.active, y: -21 }), true);
});

test("JLSTZ SRS kicks away from both walls", () => {
  const left = fresh("T", 1, -1, 4);
  assert.equal(left.collides(left.active), false);
  assert.equal(left.rotate(1), true);
  assert.deepEqual(left.active, { type: "T", rotation: 2, x: 0, y: 4 });
  const right = fresh("T", 3, 8, 4);
  assert.equal(right.rotate(1), true);
  assert.deepEqual(right.active, { type: "T", rotation: 0, x: 7, y: 4 });
});

test("I uses its own two-cell wall kicks", () => {
  const left = fresh("I", 1, -2, 4);
  assert.equal(left.rotate(1), true);
  assert.deepEqual(left.active, { type: "I", rotation: 2, x: 0, y: 4 });
  const right = fresh("I", 3, 8, 4);
  assert.equal(right.rotate(1), true);
  assert.deepEqual(right.active, { type: "I", rotation: 0, x: 6, y: 4 });
});

test("SRS supports JLSTZ floor kicks and the fifth I kick", () => {
  const tee = fresh("T", 0, 3, 18);
  assert.equal(tee.rotate(1), true);
  assert.deepEqual(tee.active, { type: "T", rotation: 1, x: 2, y: 17 });
  const line = fresh("I", 0, 3, 18);
  assert.equal(line.rotate(1), true);
  assert.deepEqual(line.active, { type: "I", rotation: 1, x: 4, y: 16 });
});

test("a blocked rotation leaves the piece unchanged after all kicks fail", () => {
  const game = fresh("T", 0, 3, 5);
  game.board.forEach((row) => row.fill("J"));
  for (const [x, y] of occupiedCells(game.active)) put(game, x, y, null);
  const before = { ...game.active };
  assert.equal(game.rotate(1), false);
  assert.deepEqual(game.active, before);
});

test("hold can be used once per piece and swaps back in spawn orientation", () => {
  const game = fresh("T", 2, 0, 10);
  const next = game.queue[0];
  assert.equal(game.hold(), true);
  assert.equal(game.held, "T");
  assert.equal(game.active.type, next);
  assert.equal(game.canHold, false);
  const queue = [...game.queue];
  assert.equal(game.hold(), false);
  assert.deepEqual(game.queue, queue);
  game.hardDrop();
  const outgoing = game.active.type;
  const beforeSwapQueue = [...game.queue];
  assert.equal(game.hold(), true);
  assert.equal(game.held, outgoing);
  assert.equal(game.active.type, "T");
  assert.equal(game.active.rotation, 0);
  assert.equal(game.active.x, 3);
  assert.deepEqual(game.queue, beforeSwapQueue);
});

test("locking waits 500 ms after touchdown", () => {
  const game = fresh("O", 0, 3, 17);
  game.update(1000);
  assert.equal(game.active.y, 18);
  assert.equal(game.pieces, 0);
  game.update(499);
  assert.equal(game.pieces, 0);
  game.update(1);
  assert.equal(game.pieces, 1);
});

test("a successful grounded move resets the lock timer", () => {
  const game = fresh("O", 0, 3, 18);
  game.update(400);
  assert.equal(game.move(1), true);
  game.update(499);
  assert.equal(game.pieces, 0);
  game.update(1);
  assert.equal(game.pieces, 1);
});

test("failed moves do not reset lock time", () => {
  const game = fresh("O", 0, -1, 18);
  game.update(499);
  assert.equal(game.move(-1), false);
  game.update(1);
  assert.equal(game.pieces, 1);
});

test("fifteen resets are allowed; further moves cannot stall locking", () => {
  const game = fresh("O", 0, 3, 18);
  game.update(400);
  for (let i = 0; i < MAX_LOCK_RESETS; i++) {
    assert.equal(game.move(i % 2 ? -1 : 1), true);
    game.update(400);
    assert.equal(game.pieces, 0);
  }
  game.move(-1);
  game.update(99);
  assert.equal(game.pieces, 0);
  game.update(1);
  assert.equal(game.pieces, 1);
});

test("a single line collapses rows and brings hidden blocks down", () => {
  const game = fresh("O", 0, 3, 18);
  fillRow(game, 19, [4, 5]);
  put(game, 0, 18, "S");
  put(game, 9, -1, "Z");
  game.hardDrop();
  assert.equal(game.lines, 1);
  assert.equal(game.score, 100);
  assert.equal(game.cellAt(0, 19), "S");
  assert.equal(game.cellAt(9, 0), "Z");
  assert.equal(game.cellAt(0, 18), null);
  assert.equal(game.board.length, 40);
  assert.equal(new Set(game.board).size, 40);
});

for (const count of [2, 3, 4]) {
  test(`${count} simultaneous lines clear and use the appropriate score`, () => {
    const game = count === 2 ? fresh("O", 0, 3, 18) : fresh("I", 1, 7, 16);
    put(game, 0, 10);
    for (let y = HEIGHT - count; y < HEIGHT; y++) fillRow(game, y, count === 2 ? [4, 5] : [9]);
    game.hardDrop();
    assert.equal(game.lines, count);
    assert.equal(game.score, { 2: 300, 3: 500, 4: 800 }[count]);
    assert.equal(game.backToBack, count === 4);
  });
}

test("level advances every ten lines using the previous level's clear score", () => {
  const game = fresh("O", 0, 3, 18);
  game.lines = 9;
  fillRow(game, 19, [4, 5]);
  game.hardDrop();
  assert.equal(game.lines, 10);
  assert.equal(game.level, 2);
  assert.equal(game.score, 100);
  assert.ok(game.drainEvents().some((event) => event.type === "level" && event.level === 2));
});

test("successive Tetrises receive both back-to-back and combo bonuses", () => {
  const game = fresh();
  prepareTetris(game);
  game.hardDrop();
  assert.equal(game.score, 800);
  prepareTetris(game);
  game.hardDrop();
  assert.equal(game.score, 800 + 1200 + 50);
  assert.equal(game.lastClear.backToBackBonus, true);
  assert.equal(game.combo, 1);
});

test("a perfect clear adds its bonus to regular clear points", () => {
  const game = fresh();
  prepareTetris(game, true);
  game.hardDrop();
  assert.equal(game.score, 800 + 2000);
  assert.equal(game.lastClear.perfectClear, true);
  assert.ok(game.board.every((row) => row.every((cell) => cell === null)));
  assert.equal(score({ lines: 4, backToBack: true, perfectClear: true }).points, 1200 + 3200);
});

for (const mini of [false, true]) {
  for (const clear of [false, true]) {
    test(`${mini ? "mini" : "full"} T-spin ${clear ? "single" : "without lines"} is detected and scored`, () => {
      const game = fresh("T", 3, 3, 17);
      put(game, 3, 17);
      put(game, 3, 19);
      put(game, 5, mini ? 19 : 17);
      if (clear) fillRow(game, 18, [3, 4, 5]);
      assert.equal(game.collides(game.active), false);
      assert.equal(game.rotate(1), true);
      assert.equal(game.hardDrop(), 0);
      assert.equal(game.lastClear.spin, mini ? "mini" : "full");
      assert.equal(game.lastClear.lines, clear ? 1 : 0);
      assert.equal(game.score, mini ? (clear ? 200 : 100) : (clear ? 800 : 400));
    });
  }
}

test("moving after a spin invalidates the spin bonus", () => {
  const game = fresh("T", 3, 3, 17);
  put(game, 3, 17);
  put(game, 5, 19);
  put(game, 3, 19);
  game.rotate(1);
  assert.equal(game.move(1), true);
  assert.equal(game.move(-1), true);
  game.hardDrop();
  assert.equal(game.lastClear.spin, "none");
});

test("the fifth SRS kick upgrades a pointing-side mini to a full T-spin", () => {
  const game = fresh("T", 0, 3, 14);
  for (const [x, y] of [[4, 16], [3, 14], [2, 16], [2, 18], [3, 19]]) put(game, x, y);
  assert.equal(game.collides(game.active), false);
  assert.equal(game.rotate(1), true);
  assert.deepEqual(game.active, { type: "T", rotation: 1, x: 2, y: 16 });
  assert.equal(game.hardDrop(), 0);
  assert.equal(game.lastClear.spin, "full");
  assert.equal(game.score, 400);
});

for (const count of [2, 3]) {
  test(`a fifth-kick T-spin clears ${count} lines`, () => {
    const game = fresh("T", 0, 3, 14);
    put(game, 3, 14);
    fillRow(game, 17, [3, 4]);
    fillRow(game, 18, [3]);
    if (count === 3) fillRow(game, 16, [3]);
    else {
      put(game, 2, 16);
      put(game, 4, 16);
    }
    assert.equal(game.collides(game.active), false);
    assert.equal(game.rotate(1), true);
    assert.equal(game.hardDrop(), 0);
    assert.equal(game.lastClear.spin, "full");
    assert.equal(game.lines, count);
    assert.equal(game.score, count === 2 ? 1200 : 1600);
    assert.equal(game.backToBack, true);
  });
}

test("spin, combo, back-to-back, and level multipliers combine correctly", () => {
  assert.equal(score({ spin: "full", lines: 2, level: 3, backToBack: true, combo: 1 }).points, (1800 + 100) * 3);
  assert.equal(score({ spin: "full", lines: 3 }).points, 1600);
  assert.equal(score({ spin: "mini", lines: 2 }).points, 400);
  assert.equal(score({ lines: 1, perfectClear: true }).points, 900);
  assert.equal(score({ lines: 2, perfectClear: true }).points, 1500);
  assert.equal(score({ lines: 3, perfectClear: true }).points, 2300);
  assert.equal(score({ backToBack: true }).backToBack, true);
  assert.equal(score({ spin: "full", backToBack: true }).backToBack, true);
  assert.equal(score({ lines: 1, backToBack: true }).backToBack, false);
  assert.equal(score({ combo: 4 }).combo, -1);
  assert.equal(score({ lines: 1, combo: 0 }).points, 150);
});

test("pause freezes gravity, time, input, hold, and score", () => {
  const game = fresh();
  game.update(300);
  game.togglePause();
  const active = { ...game.active };
  assert.equal(game.status, "paused");
  assert.equal(game.move(1), false);
  assert.equal(game.rotate(1), false);
  assert.equal(game.hold(), false);
  assert.equal(game.softDrop(), false);
  assert.equal(game.hardDrop(), 0);
  game.update(2000, true);
  assert.deepEqual(game.active, active);
  assert.equal(game.elapsed, 300);
  assert.equal(game.score, 0);
  game.togglePause();
  game.update(700);
  assert.equal(game.active.y, active.y + 1);
});

test("a blocked spawn ends the game instead of overwriting the stack", () => {
  const game = fresh("O", 0, 3, 18);
  const [x, y] = cellsFor(game.queue[0])[0];
  put(game, x + 3, y - 2, "Z");
  game.hardDrop();
  assert.equal(game.status, "over");
  assert.equal(game.active, null);
  assert.equal(game.cellAt(x + 3, y - 2), "Z");
  assert.ok(game.drainEvents().some((event) => event.type === "over"));
});

test("a blocked hold spawn also ends the game", () => {
  const game = fresh("O");
  game.held = "T";
  put(game, 4, -2);
  assert.equal(game.hold(), true);
  assert.equal(game.status, "over");
  assert.equal(game.held, "O");
});

test("a piece locking completely above the visible field tops out", () => {
  const game = fresh("O", 0, 3, -3);
  put(game, 4, -1);
  assert.equal(game.hardDrop(), 0);
  assert.equal(game.status, "over");
});

test("restart resets all session state and discards pending events", () => {
  const game = fresh();
  game.hold();
  game.hardDrop();
  game.update(200);
  game.togglePause();
  game.start();
  assert.equal(game.status, "playing");
  assert.equal(game.score, 0);
  assert.equal(game.lines, 0);
  assert.equal(game.pieces, 0);
  assert.equal(game.elapsed, 0);
  assert.equal(game.level, 1);
  assert.equal(game.held, null);
  assert.equal(game.canHold, true);
  assert.equal(game.combo, -1);
  assert.equal(game.backToBack, false);
  assert.equal(game.lastClear, null);
  assert.equal(game.queue.length, 5);
  assert.equal(game.drainEvents().length, 0);
  assert.ok(game.board.every((row) => row.every((cell) => cell === null)));
});

test("invalid update deltas do not change a running game", () => {
  const game = fresh();
  const active = { ...game.active };
  for (const delta of [0, -100, NaN, Infinity]) game.update(delta);
  assert.deepEqual(game.active, active);
  assert.equal(game.elapsed, 0);
});

test("seeded games preserve board and collision invariants through top-out", () => {
  const nextRandom = random(42);
  for (let round = 0; round < 30; round++) {
    const game = new Game(nextRandom);
    game.start();
    let turns = 0;
    while (game.status === "playing" && turns++ < 100) {
      for (let r = 0; r < Math.floor(nextRandom() * 4); r++) game.rotate(1);
      const direction = nextRandom() < 0.5 ? -1 : 1;
      for (let m = 0; m < Math.floor(nextRandom() * 7); m++) game.move(direction);
      if (nextRandom() < 0.2) game.hold();
      if (game.status !== "playing") break;
      assert.equal(game.collides(game.active), false);
      game.hardDrop();
      assert.equal(game.board.length, 40);
      assert.ok(game.board.every((row) => row.length === 10 && row.includes(null)));
      assert.ok(Number.isSafeInteger(game.score) && game.score >= 0);
      if (game.active) assert.equal(game.collides(game.active), false);
    }
    assert.equal(game.status, "over");
  }
});
