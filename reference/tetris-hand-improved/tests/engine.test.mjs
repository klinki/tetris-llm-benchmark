import test from "node:test";
import assert from "node:assert/strict";
import { Game, HIDDEN, LOCK_DELAY, MAX_LOCK_RESETS, NEXT_COUNT, describeLock } from "../dist/engine.js";
import { COLORS, KINDS, SevenBag, shape } from "../dist/pieces.js";

// ---------- helpers ----------

/** Deterministic PRNG (mulberry32). */
function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function playing(seed = 1) {
  const game = new Game(seeded(seed));
  game.play();
  return game;
}
/** Stack fixture: occupy visible-field cells (y may be negative for hidden rows). */
function fill(game, cells, kind = "J") {
  game.setUp({ stack: cells.map(([x, y]) => [x, y, kind]) });
}
function fillRows(game, rows, exceptColumns = []) {
  for (const y of rows) for (let x = 0; x < 10; x++) if (!exceptColumns.includes(x)) fill(game, [[x, y]]);
}
const clearBoard = (game) => game.setUp({ clear: true });
/** Fill both spawn rows above column 4 and lock a piece: the next spawn is blocked. */
function topOut(game) {
  game.setUp({ stack: [[4, -2, "J"], [4, -1, "J"]], active: { kind: "O", rotation: 0, x: -1, y: 10 } });
  game.hardDrop();
  assert.equal(game.status, "over");
}
const occupied = (game) => game.board.flat().filter(Boolean).length;
const sorted = (cells) => cells.map(String).sort();
/** Score gained by running `action`. */
function gain(game, action) {
  const before = game.score;
  action();
  return game.score - before;
}
/** Advance in 1 ms steps until the active piece is grounded; returns the time taken. */
function untilGrounded(game, limit = 60_000) {
  let time = 0;
  while (!game.grounded && time < limit) {
    game.update(1);
    time++;
  }
  return time;
}
/** Hard-drops an I into column 9 over rows 16–19 that are otherwise full: a Tetris. */
function tetris(game) {
  fillRows(game, [16, 17, 18, 19], [9]);
  game.setUp({ active: { kind: "I", rotation: 1, x: 7, y: 12 } });
  return gain(game, () => game.hardDrop()) - 8; // minus 4 rows × 2 drop points
}

// ---------- pieces and randomizer ----------

test("seven-bag deals every tetromino once per seven pieces for many bags and seeds", () => {
  for (let seed = 1; seed <= 10; seed++) {
    const bag = new SevenBag(seeded(seed));
    for (let i = 0; i < 100; i++) {
      const group = Array.from({ length: 7 }, () => bag.next());
      assert.deepEqual([...group].sort(), [...KINDS].sort());
    }
  }
});

test("the same seed produces the same piece sequence", () => {
  const a = new SevenBag(seeded(42));
  const b = new SevenBag(seeded(42));
  const sequence = (bag) => Array.from({ length: 21 }, () => bag.next()).join("");
  assert.equal(sequence(a), sequence(b));
});

test("all 28 orientations match the canonical SRS cell layout", () => {
  // Rows of each orientation from https://tetris.wiki/Super_Rotation_System ('#' = mino).
  const canonical = {
    I: [["....", "####", "....", "...."], ["..#.", "..#.", "..#.", "..#."], ["....", "....", "####", "...."], [".#..", ".#..", ".#..", ".#.."]],
    J: [["#..", "###", "..."], [".##", ".#.", ".#."], ["...", "###", "..#"], [".#.", ".#.", "##."]],
    L: [["..#", "###", "..."], [".#.", ".#.", ".##"], ["...", "###", "#.."], ["##.", ".#.", ".#."]],
    O: [[".##.", ".##.", "...."], [".##.", ".##.", "...."], [".##.", ".##.", "...."], [".##.", ".##.", "...."]],
    S: [[".##", "##.", "..."], [".#.", ".##", "..#"], ["...", ".##", "##."], ["#..", "##.", ".#."]],
    T: [[".#.", "###", "..."], [".#.", ".##", ".#."], ["...", "###", ".#."], [".#.", "##.", ".#."]],
    Z: [["##.", ".##", "..."], ["..#", ".##", ".#."], ["...", "##.", ".##"], [".#.", "##.", "#.."]],
  };
  for (const kind of KINDS)
    for (let rotation = 0; rotation < 4; rotation++) {
      const expected = canonical[kind][rotation].flatMap((row, y) =>
        [...row].flatMap((c, x) => (c === "#" ? [[x, y]] : [])),
      );
      assert.deepEqual(sorted(shape(kind, rotation)), sorted(expected), `${kind} r${rotation}`);
    }
});

test("each piece has its own color", () => {
  assert.equal(new Set(KINDS.map((kind) => COLORS[kind])).size, 7);
});

test("pieces spawn in the Guideline columns and enter the top visible row", () => {
  const columns = { I: [3, 4, 5, 6], O: [4, 5], J: [3, 4, 5], L: [3, 4, 5], S: [3, 4, 5], T: [3, 4, 5], Z: [3, 4, 5] };
  const seen = new Set();
  const game = playing(3);
  while (seen.size < 7) {
    const piece = game.active;
    seen.add(piece.kind);
    const cells = game.cells(piece);
    assert.equal(piece.rotation, 0);
    assert.deepEqual([...new Set(cells.map(([x]) => x))].sort(), columns[piece.kind], piece.kind);
    assert.equal(Math.max(...cells.map(([, y]) => y)), 0, `${piece.kind} reaches row 0`);
    game.restart();
  }
});

test("the next queue always shows five pieces and follows the bag", () => {
  const game = playing(5);
  const reference = new SevenBag(seeded(5));
  const dealt = Array.from({ length: 30 }, () => reference.next());
  const observed = [game.active.kind];
  for (let i = 0; i < 20; i++) {
    assert.equal(game.queue.length, NEXT_COUNT);
    assert.deepEqual(game.queue, dealt.slice(observed.length, observed.length + NEXT_COUNT));
    clearBoard(game); // keep the stack low
    game.hardDrop();
    observed.push(game.active.kind);
  }
  assert.deepEqual(observed, dealt.slice(0, observed.length));
});

// ---------- movement, rotation, and SRS ----------

test("movement stops at walls, the floor, and the stack", () => {
  const game = playing();
  game.setUp({ active: { kind: "O", rotation: 0, x: 3, y: 5 } });
  while (game.move(-1));
  assert.deepEqual(game.cells(game.active).map(([x]) => x).sort(), [0, 0, 1, 1]);
  while (game.move(1));
  assert.deepEqual(game.cells(game.active).map(([x]) => x).sort(), [8, 8, 9, 9]);
  fill(game, [[7, 5]]);
  game.setUp({ active: { kind: "O", rotation: 0, x: 3, y: 4 } });
  assert.equal(game.move(1), true);
  assert.equal(game.move(1), false);
  assert.equal(game.fits({ kind: "O", rotation: 0, x: 3, y: 19 }), false, "below the floor");
  assert.equal(game.fits({ kind: "O", rotation: 0, x: 3, y: -HIDDEN - 1 }), false, "above the buffer");
});

test("four rotations either way return a piece to its starting state", () => {
  const game = playing();
  for (const kind of KINDS) {
    for (const direction of [1, -1]) {
      game.setUp({ active: { kind, rotation: 0, x: 3, y: 8 } });
      const start = { ...game.active };
      for (let i = 0; i < 4; i++) assert.equal(game.rotate(direction), true);
      assert.deepEqual(game.active, start, `${kind} ${direction}`);
    }
  }
});

test("every SRS kick is tried in the documented order for J, L, S, T, Z and I", () => {
  // Wiki offsets, x right and y up: https://tetris.wiki/Super_Rotation_System
  const jlstz = {
    "0>1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
    "1>0": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
    "1>2": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
    "2>1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
    "2>3": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
    "3>2": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
    "3>0": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
    "0>3": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  };
  const i = {
    "0>1": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
    "1>0": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
    "1>2": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
    "2>1": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
    "2>3": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
    "3>2": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
    "3>0": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
    "0>3": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  };
  let checked = 0;
  let reached = 0;
  for (const kind of ["J", "L", "S", "T", "Z", "I"]) {
    const table = kind === "I" ? i : jlstz;
    for (const [key, offsets] of Object.entries(table)) {
      const [from, to] = key.split(">").map(Number);
      const direction = (to - from + 4) % 4 === 1 ? 1 : -1;
      offsets.forEach(([dx, dy], index) => {
        // Legal start: the source pose and candidate `index` are the only open cells,
        // so the rotation must take the first listed candidate that fits there.
        const game = playing();
        const source = { kind, rotation: from, x: 4, y: 10 };
        const target = { kind, rotation: to, x: 4 + dx, y: 10 - dy };
        const open = new Set([...game.cells(source), ...game.cells(target)].map(String));
        for (let y = 0; y < 20; y++) for (let x = 0; x < 10; x++) if (!open.has(`${x},${y}`)) fill(game, [[x, y]]);
        game.setUp({ active: { ...source } });
        assert.equal(game.fits(source), true);
        const first = offsets.findIndex(([ox, oy]) =>
          game.cells({ kind, rotation: to, x: 4 + ox, y: 10 - oy }).every((cell) => open.has(String(cell))),
        );
        assert.equal(game.rotate(direction), true, `${kind} ${key} kick ${index}`);
        const [fx, fy] = offsets[first];
        assert.deepEqual(game.active, { kind, rotation: to, x: 4 + fx, y: 10 - fy }, `${kind} ${key} kick ${index}`);
        if (first === index) reached++;
        checked++;
      });
    }
  }
  assert.equal(checked, 6 * 8 * 5);
  assert.equal(reached, 236, "all but four candidates are reachable from a legal start");
});

test("a rotation with no fitting kick fails and leaves the piece unchanged", () => {
  const game = playing();
  game.setUp({ active: { kind: "T", rotation: 0, x: 3, y: 5 } });
  const own = new Set(game.cells(game.active).map(String));
  for (let y = 0; y < 20; y++) for (let x = 0; x < 10; x++) if (!own.has(`${x},${y}`)) fill(game, [[x, y]]);
  const before = { ...game.active };
  assert.equal(game.rotate(1), false);
  assert.equal(game.rotate(-1), false);
  assert.deepEqual(game.active, before);
});

test("O rotation never kicks or moves its cells", () => {
  const game = playing();
  game.setUp({ active: { kind: "O", rotation: 0, x: -1, y: 18 } });
  const cells = sorted(game.cells(game.active));
  for (let i = 0; i < 4; i++) {
    assert.equal(game.rotate(1), true);
    assert.deepEqual(sorted(game.cells(game.active)), cells);
  }
});

// ---------- drops, ghost, hold ----------

test("ghost shows the landing position of an obstructed column without moving the piece", () => {
  const game = playing();
  fill(game, [[4, 12]]);
  game.setUp({ active: { kind: "T", rotation: 0, x: 3, y: 2 } });
  const before = { ...game.active };
  assert.deepEqual(game.ghost(), { ...before, y: 10 });
  assert.deepEqual(game.active, before);
  assert.equal(game.hardDrop(), 8);
  assert.equal(game.score, 16, "two points per hard-dropped row");
  for (const [x, y] of [[4, 10], [3, 11], [4, 11], [5, 11]]) assert.equal(game.cell(x, y), "T");
});

test("soft drop moves one row per press for one point and never locks by itself", () => {
  const game = playing();
  let rows = 0;
  while (game.softDrop()) rows++;
  assert.equal(rows, 19);
  assert.equal(game.score, 19);
  assert.equal(game.softDrop(), false);
  assert.equal(game.pieces, 0, "a grounded soft drop does not lock");
  game.update(LOCK_DELAY);
  assert.equal(game.pieces, 1);
});

test("hold swaps once per piece and returns a held piece in spawn state", () => {
  const game = playing(9);
  const first = game.active.kind;
  const second = game.queue[0];
  game.rotate(1);
  game.move(1);
  assert.equal(game.hold(), true);
  assert.equal(game.held, first);
  assert.equal(game.active.kind, second);
  assert.equal(game.hold(), false, "only one hold per piece");
  game.hardDrop();
  const queue = [...game.queue];
  assert.equal(game.hold(), true);
  assert.deepEqual(game.active, { kind: first, rotation: 0, x: 3, y: -1 });
  assert.deepEqual(game.queue, queue, "swapping with the hold leaves the queue alone");
});

test("a held piece that cannot spawn ends the game", () => {
  const game = playing();
  game.hold();
  game.hardDrop();
  fillRows(game, [-2, -1], [0, 1, 2, 7, 8, 9]);
  assert.equal(game.hold(), true);
  assert.equal(game.status, "over");
});

// ---------- gravity, timing, and lock delay ----------

test("gravity follows the Guideline curve and awards no points", () => {
  for (const level of [1, 2, 5, 9, 10, 14, 15, 20]) {
    const game = playing();
    game.setUp({ level });
    const interval = 1000 * (0.8 - (level - 1) * 0.007) ** (level - 1);
    assert.ok(Math.abs(game.gravityMs - Math.max(1, interval)) < 1e-9, `level ${level}`);
    const y = game.active.y;
    game.update(game.gravityMs * 0.999);
    assert.equal(game.active.y, y, `level ${level} before the interval`);
    game.update(game.gravityMs * 0.002);
    assert.equal(game.active.y, y + 1, `level ${level} after the interval`);
    assert.equal(game.score, 0);
  }
  assert.equal(playing().gravityMs, 1000);
});

test("held soft drop is twenty times gravity and scores each row", () => {
  const game = playing();
  assert.equal(game.softDropMs, 50);
  const y = game.active.y;
  game.update(149, true);
  assert.equal(game.active.y, y + 2);
  game.update(1, true);
  assert.equal(game.active.y, y + 3);
  assert.equal(game.score, 3);
  game.setUp({ level: 10 });
  assert.ok(Math.abs(game.softDropMs - game.gravityMs / 20) < 1e-9);
});

test("starting a soft drop does not cash in accumulated gravity time", () => {
  const game = playing();
  const y = game.active.y;
  game.update(800);
  assert.equal(game.softDrop(), true); // the key press moves one row
  game.update(1, true);
  assert.equal(game.active.y, y + 1);
  assert.equal(game.score, 1);
  game.update(49, true);
  assert.equal(game.active.y, y + 2);
  assert.equal(game.score, 2);
});

test("results do not depend on frame rate", () => {
  const run = (frame) => {
    const game = playing(11);
    let soft = false;
    const script = [
      [500, () => game.move(-1)],
      [1700, () => game.rotate(1)],
      [2600, () => game.hardDrop()],
      [3000, () => (soft = true)],
      [4000, () => (soft = false)],
      [5000, () => game.hold()],
      [40_500, () => {}], // not on a gravity tick, so float rounding cannot decide it
    ];
    let time = 0;
    for (const [at, action] of script) {
      for (; time + frame < at; time += frame) game.update(frame, soft);
      game.update(at - time, soft);
      time = at;
      action();
    }
    return JSON.stringify([game.board, game.active, game.score, game.pieces, game.queue, game.status]);
  };
  const reference = run(Infinity);
  assert.equal(run(1000 / 60), reference);
  assert.equal(run(1000 / 144), reference);
  assert.equal(run(7), reference);
});

test("a grounded piece locks after exactly 500 ms", () => {
  const game = playing();
  game.setUp({ active: { kind: "O", rotation: 0, x: 3, y: 18 } });
  game.update(LOCK_DELAY - 1);
  assert.equal(game.pieces, 0);
  game.update(1);
  assert.equal(game.pieces, 1);
});

test("a piece that falls onto the stack gets the full lock delay after landing", () => {
  const game = playing();
  const fall = untilGrounded(game);
  assert.equal(fall, 19 * 1000);
  game.update(LOCK_DELAY - 1);
  assert.equal(game.pieces, 0);
  game.update(1);
  assert.equal(game.pieces, 1);
});

test("moves and rotations reset the lock delay at most fifteen times", () => {
  const game = playing();
  while (game.softDrop()); // land on the floor through play, not by placing the piece
  for (let i = 0; i < MAX_LOCK_RESETS; i++) {
    game.update(LOCK_DELAY - 1);
    assert.equal(game.move(i % 2 ? -1 : 1), true);
    assert.equal(game.pieces, 0, `reset ${i + 1}`);
  }
  game.update(LOCK_DELAY - 1);
  assert.equal(game.move(1), true, "the sixteenth action still moves the piece…");
  game.update(1);
  assert.equal(game.pieces, 1, "…but no longer resets the timer");
});

test("failed moves and rotations do not reset the lock delay", () => {
  const game = playing();
  game.setUp({ active: { kind: "O", rotation: 0, x: -1, y: 18 } });
  game.update(400);
  assert.equal(game.move(-1), false);
  game.update(100);
  assert.equal(game.pieces, 1);
});

test("moving off a ledge then landing lower restores the full delay and all resets", () => {
  const game = playing();
  fill(game, [[0, 14]]);
  game.setUp({ active: { kind: "O", rotation: 0, x: -1, y: 12 } }); // resting on one cell
  for (let i = 0; i < MAX_LOCK_RESETS; i++) assert.equal(game.rotate(1), true); // spend every reset
  game.update(490);
  assert.equal(game.move(1), true); // off the ledge: no reset is left for this move
  untilGrounded(game);
  assert.equal(game.active.y, 18);
  game.update(LOCK_DELAY - 1);
  assert.equal(game.pieces, 0, "new lowest row: full delay again");
  for (let i = 0; i < MAX_LOCK_RESETS; i++) {
    assert.equal(game.rotate(1), true);
    game.update(LOCK_DELAY - 1);
    assert.equal(game.pieces, 0, `fresh reset ${i + 1}`);
  }
  game.update(1);
  assert.equal(game.pieces, 1);
});

test("a downward kick to a new lowest row also restores the lock delay and resets", () => {
  const game = playing();
  fill(game, [[3, 12], [4, 14], [4, 16]]);
  game.setUp({ active: { kind: "T", rotation: 0, x: 4, y: 11 } });
  assert.equal(game.softDrop(), true); // lands at y 12 through play
  assert.equal(game.grounded, true);
  for (let i = 0; i < MAX_LOCK_RESETS; i++) assert.equal(game.move(i % 2 ? 1 : -1), true);
  assert.deepEqual(game.active, { kind: "T", rotation: 0, x: 3, y: 12 });
  game.update(490);
  assert.equal(game.rotate(1), true);
  assert.deepEqual(game.active, { kind: "T", rotation: 1, x: 2, y: 14 }, "fifth kick, two rows down");
  assert.equal(game.grounded, true);
  game.update(LOCK_DELAY - 1);
  assert.equal(game.pieces, 0, "not 10 ms later");
  game.update(1);
  assert.equal(game.pieces, 1);
});

test("a piece in mid-air never locks, even after its old deadline", () => {
  const game = playing();
  fill(game, [[0, 14]]);
  game.setUp({ active: { kind: "O", rotation: 0, x: -1, y: 12 } });
  game.update(490);
  game.move(1);
  game.update(400);
  assert.equal(game.pieces, 0);
  assert.equal(game.grounded, false);
});

// ---------- line clears and scoring ----------

test("cleared rows are removed and everything above, including hidden rows, shifts down", () => {
  const game = playing();
  fillRows(game, [19], [8, 9]);
  fill(game, [[0, 18], [0, -1]], "S");
  game.setUp({ active: { kind: "O", rotation: 0, x: 7, y: 18 } });
  assert.equal(gain(game, () => game.hardDrop()), 100);
  assert.equal(game.lines, 1);
  assert.equal(game.cell(0, 19), "S");
  assert.equal(game.cell(8, 19), "O");
  assert.equal(game.cell(0, 0), "S", "hidden row moved into view");
  assert.equal(game.board.length, 40);
});

test("line clears score 100/300/500/800 times the level", () => {
  for (const [lines, points] of [[1, 100], [2, 300], [3, 500], [4, 800]]) {
    for (const level of [1, 3]) {
      const game = playing();
      game.setUp({ level });
      fill(game, [[0, 10]]); // avoid a perfect clear
      fillRows(game, Array.from({ length: lines }, (_, i) => 19 - i), [9]);
      game.setUp({ active: { kind: "I", rotation: 1, x: 7, y: 16 } });
      assert.equal(gain(game, () => game.hardDrop()), points * level, `${lines} lines at level ${level}`);
    }
  }
});

test("ten lines raise the level, and the clear that crosses scores at the old level", () => {
  const game = playing();
  game.setUp({ lines: 9 });
  fill(game, [[0, 10]]);
  fillRows(game, [19], [8, 9]);
  game.setUp({ active: { kind: "O", rotation: 0, x: 7, y: 18 } });
  assert.equal(gain(game, () => game.hardDrop()), 100);
  assert.equal(game.lines, 10);
  assert.equal(game.level, 2);
  assert.ok(Math.abs(game.gravityMs - 793) < 0.1);
});

test("combos add 50 × combo × level for consecutive clears and end on a lock without one", () => {
  const game = playing();
  const single = () => {
    clearBoard(game);
    fill(game, [[0, 0]]); // avoid a perfect clear
    fillRows(game, [19], [8, 9]);
    game.setUp({ active: { kind: "O", rotation: 0, x: 7, y: 17 } });
    return gain(game, () => game.hardDrop()) - 2; // minus one hard-drop row
  };
  assert.equal(single(), 100);
  assert.equal(single(), 150);
  assert.equal(single(), 200);
  assert.equal(game.combo, 2);
  game.setUp({ active: { kind: "O", rotation: 0, x: 3, y: 10 } });
  game.hardDrop();
  assert.equal(game.combo, -1, "a lock without a clear ends the combo");
  game.setUp({ lines: 10 }); // level 2
  assert.equal(single(), 200, "the combo restarts at zero");
  assert.equal(single(), 300, "level-two combo single: 100×2 + 50×1×2");
});

test("back-to-back Tetrises earn 1.5×; a lock without a clear keeps the chain, a single breaks it", () => {
  const game = playing();
  const nextTetris = () => {
    clearBoard(game);
    fill(game, [[0, 0]]); // avoid a perfect clear
    return tetris(game);
  };
  assert.equal(nextTetris(), 800);
  assert.equal(game.backToBack, true);
  game.setUp({ active: { kind: "O", rotation: 0, x: 3, y: 10 } });
  game.hardDrop();
  assert.equal(nextTetris(), 1200, "chain kept across a lock with no clear");
  assert.equal(describeLock(game.lastLock), "Back-to-back · Tetris");
  assert.equal(nextTetris(), 1200 + 50, "consecutive Tetrises also combo");
  clearBoard(game);
  fill(game, [[0, 0]]);
  fillRows(game, [19], [8, 9]);
  game.setUp({ active: { kind: "O", rotation: 0, x: 7, y: 17 } });
  assert.equal(game.level, 2, "twelve lines so far");
  assert.equal(gain(game, () => game.hardDrop()) - 2, (100 + 2 * 50) * 2, "a single is not back-to-back");
  assert.equal(game.backToBack, false);
  game.setUp({ active: { kind: "O", rotation: 0, x: 3, y: 10 } });
  game.hardDrop();
  assert.equal(nextTetris(), 800 * 2, "the next Tetris starts a new chain");
});

test("perfect clears add 800/1200/2000 for single/double/Tetris", () => {
  const single = playing();
  fillRows(single, [19], [6, 7, 8, 9]);
  single.setUp({ active: { kind: "I", rotation: 0, x: 6, y: 17 } });
  assert.equal(gain(single, () => single.hardDrop()) - 2, 100 + 800);
  assert.equal(single.lastLock.perfectClear, true);
  assert.equal(occupied(single), 0);

  const double = playing();
  fillRows(double, [18, 19], [8, 9]);
  double.setUp({ active: { kind: "O", rotation: 0, x: 7, y: 17 } });
  assert.equal(gain(double, () => double.hardDrop()) - 2, 300 + 1200);

  const four = playing();
  assert.equal(tetris(four), 800 + 2000);
  assert.match(describeLock(four.lastLock), /Perfect clear$/);

  const leftover = playing();
  fillRows(leftover, [19], [8, 9]);
  leftover.setUp({ active: { kind: "O", rotation: 0, x: 7, y: 17 } });
  leftover.hardDrop();
  assert.equal(leftover.lastLock.perfectClear, false, "the O's top half remains");
});

test("a back-to-back Tetris perfect clear adds 3200 instead of 2000", () => {
  const game = playing();
  fill(game, [[0, 15]]);
  assert.equal(tetris(game), 800, "the leftover cell prevents a perfect clear");
  game.setUp({ active: { kind: "O", rotation: 0, x: -1, y: 10 } });
  game.hardDrop(); // no clear: keeps back-to-back, ends the combo
  assert.equal(tetris(game), 1200 + 3200);
  assert.equal(occupied(game), 0);
});

// ---------- T-spins (fixtures set only the stack and pose; spin credit comes from real rotations) ----------

/** T r3 at (3,17) rotated clockwise into the slot: mini, or full with `full`. */
function spinFixture(full) {
  const game = playing();
  fill(game, full ? [[5, 17], [3, 19], [3, 17]] : [[5, 17], [3, 19], [5, 19]]);
  game.setUp({ active: { kind: "T", rotation: 3, x: 3, y: 17 } });
  assert.equal(game.rotate(1), true);
  assert.deepEqual(game.active, { kind: "T", rotation: 0, x: 3, y: 17 });
  assert.equal(game.ghost().y, 17, "zero-distance drop");
  return game;
}

test("T-spin and mini T-spin with no lines score 400 and 100 by hard drop or timed lock", () => {
  for (const full of [true, false]) {
    const dropped = spinFixture(full);
    assert.equal(gain(dropped, () => dropped.hardDrop()), full ? 400 : 100);
    assert.equal(dropped.lastLock.spin, full ? "full" : "mini");
    assert.equal(describeLock(dropped.lastLock), full ? "T-spin" : "Mini T-spin");
    const timed = spinFixture(full);
    assert.equal(gain(timed, () => timed.update(LOCK_DELAY)), full ? 400 : 100);
    assert.equal(timed.pieces, 1);
  }
});

test("T-spin single, double and mini single score 800, 1200 and 200", () => {
  const single = spinFixture(true);
  fillRows(single, [18], [3, 4, 5]);
  assert.equal(gain(single, () => single.hardDrop()), 800);
  assert.equal(describeLock(single.lastLock), "T-spin Single");
  assert.equal(single.backToBack, true);

  const mini = spinFixture(false);
  fillRows(mini, [18], [3, 4, 5]);
  assert.equal(gain(mini, () => mini.hardDrop()), 200);
  assert.equal(mini.lastLock.spin, "mini");
  assert.equal(mini.backToBack, true, "minis with lines are difficult clears");

  // T-spin double: a T pointing down into a slot under an overhang.
  const double = playing();
  fillRows(double, [18], [3, 4, 5]);
  fillRows(double, [19], [4]);
  fill(double, [[5, 17]]);
  double.setUp({ active: { kind: "T", rotation: 1, x: 3, y: 17 } });
  assert.equal(double.rotate(1), true);
  assert.deepEqual(double.active, { kind: "T", rotation: 2, x: 3, y: 17 });
  assert.equal(gain(double, () => double.hardDrop()), 1200);
  assert.equal(double.lines, 2);
});

test("the fifth SRS kick promotes a mini corner pattern to a full T-spin", () => {
  const game = playing();
  // Kicks 0–3 are blocked; kick 4 drops the T two rows into the slot. Afterwards
  // three corners are filled but only one front corner: mini without promotion.
  fill(game, [[2, 15], [3, 17], [1, 17], [1, 19]]);
  fillRows(game, [18], [2, 3]);
  game.setUp({ active: { kind: "T", rotation: 0, x: 2, y: 15 } });
  assert.equal(game.rotate(1), true);
  assert.deepEqual(game.active, { kind: "T", rotation: 1, x: 1, y: 17 });
  assert.equal(gain(game, () => game.hardDrop()), 800, "T-spin single, not mini (200)");
  assert.equal(game.lastLock.spin, "full");
});

test("a T locked in a slot without rotating gets no spin bonus", () => {
  const game = playing();
  fill(game, [[5, 17], [3, 19], [3, 17]]);
  game.setUp({ active: { kind: "T", rotation: 0, x: 3, y: 17 } });
  assert.equal(gain(game, () => game.hardDrop()), 0);
  assert.equal(game.lastLock.spin, null);
});

test("moving or soft dropping after a rotation cancels the spin", () => {
  const spun = () => {
    const game = playing();
    fill(game, [[2, 17], [2, 18], [3, 18], [6, 18]]);
    game.setUp({ active: { kind: "T", rotation: 3, x: 4, y: 17 } });
    assert.equal(game.rotate(1), true);
    assert.deepEqual(game.active, { kind: "T", rotation: 0, x: 3, y: 18 });
    return game;
  };
  const control = spun();
  assert.equal(gain(control, () => control.hardDrop()), 100, "control: mini T-spin");
  const moved = spun();
  assert.equal(moved.move(1) && moved.move(-1), true);
  assert.deepEqual(moved.active, { kind: "T", rotation: 0, x: 3, y: 18 });
  assert.equal(gain(moved, () => moved.hardDrop()), 0, "same cells, but the last action was a move");

  const game = playing();
  fill(game, [[0, 17], [0, 19], [2, 19]]);
  game.setUp({ active: { kind: "T", rotation: 0, x: 0, y: 3 } });
  assert.equal(game.rotate(1), true);
  let rows = 0;
  while (game.softDrop()) rows++;
  assert.equal(rows, 14);
  assert.equal(gain(game, () => game.update(LOCK_DELAY)), 0);
});

test("a hard drop that travels cancels the spin; a zero-distance one keeps it", () => {
  const game = playing();
  fill(game, [[0, 17], [0, 19], [2, 19]]);
  game.setUp({ active: { kind: "T", rotation: 0, x: 0, y: 3 } });
  assert.equal(game.rotate(1), true);
  assert.deepEqual(game.active, { kind: "T", rotation: 1, x: 0, y: 3 });
  assert.deepEqual(game.ghost(), { kind: "T", rotation: 1, x: 0, y: 17 });
  assert.equal(gain(game, () => game.hardDrop()), 28, "14 rows × 2, no spin");
  assert.equal(game.lastLock.spin, null);
  for (const full of [false, true]) {
    const zero = spinFixture(full);
    assert.equal(gain(zero, () => zero.hardDrop()), full ? 400 : 100);
  }
});

test("T-spins count toward back-to-back", () => {
  const game = spinFixture(true);
  fillRows(game, [18], [3, 4, 5]);
  game.hardDrop();
  clearBoard(game);
  fill(game, [[0, 0]]);
  assert.equal(tetris(game), 1200 + 50, "back-to-back after the T-spin single, combo 1");
});

// ---------- game over, state, and restart ----------

test("block out: a spawn overlapping the stack ends the game", () => {
  const game = playing();
  clearBoard(game);
  fill(game, [[4, -2], [4, -1]]); // every spawn shape covers one of these
  game.setUp({ active: { kind: "O", rotation: 0, x: -1, y: 10 } });
  game.hardDrop();
  assert.equal(game.status, "over");
  assert.equal(game.fits(game.active), false);
});

test("lock out: a piece locked wholly above the field ends the game; partly visible does not", () => {
  for (const [row, over] of [[0, true], [1, false]]) {
    const game = playing(2);
    fillRows(game, [row], [0, 1, 7, 8, 9]);
    game.setUp({ active: { kind: "O", rotation: 0, x: 7, y: 10 } });
    game.hardDrop(); // the next piece spawns over the filled columns 2–6
    assert.equal(game.status, "playing");
    const top = Math.max(...game.cells(game.active).map(([, y]) => y));
    assert.equal(top, over ? -1 : 0, "spawned wholly hidden / reaching row 0");
    assert.equal(game.hardDrop(), 0);
    assert.equal(game.status, over ? "over" : "playing");
  }
});

test("after game over every gameplay input is ignored", () => {
  const game = playing();
  topOut(game);
  const snapshot = JSON.stringify(game);
  game.move(1);
  game.rotate(1);
  game.softDrop();
  game.hardDrop();
  game.hold();
  game.update(10_000);
  game.pause();
  assert.equal(JSON.stringify(game), snapshot);
  game.play();
  assert.equal(game.status, "playing", "play() after game over starts a new game");
  assert.equal(occupied(game), 0);
});

test("ready and paused games ignore time and actions; play resumes", () => {
  const game = new Game(seeded(1));
  const before = { ...game.active };
  game.update(5000);
  assert.equal(game.move(1) || game.rotate(1) || game.softDrop() || game.hold(), false);
  assert.equal(game.hardDrop(), 0);
  assert.deepEqual(game.active, before);
  game.pause();
  assert.equal(game.status, "ready", "a game that has not started cannot pause");
  game.play();
  game.pause();
  assert.equal(game.status, "paused");
  game.update(5000);
  assert.equal(game.move(1), false);
  assert.deepEqual(game.active, before);
  assert.equal(game.elapsed, 0);
  game.play();
  assert.equal(game.status, "playing");
  game.update(250);
  assert.equal(game.elapsed, 250);
});

test("restarting after game over clears everything and deals from a fresh bag", () => {
  const game = playing(4);
  game.hold();
  for (let i = 0; i < 3; i++) game.hardDrop();
  topOut(game);
  game.play();
  assert.equal(game.status, "playing");
  assert.deepEqual(
    [game.score, game.lines, game.level, game.elapsed, game.pieces, game.combo, game.backToBack, game.held, game.canHold],
    [0, 0, 1, 0, 0, -1, false, null, true],
  );
  assert.equal(occupied(game), 0);
  const first = [game.active.kind, ...game.queue];
  game.hardDrop();
  first.push(game.queue.at(-1));
  assert.deepEqual([...first].sort(), [...KINDS].sort(), "first seven pieces are one full bag");
});

test("lock events describe the clear for the interface", () => {
  assert.equal(
    describeLock({ id: 1, lines: 2, spin: "full", points: 1, backToBack: true, combo: 3, perfectClear: true }),
    "Back-to-back · T-spin Double · Combo ×3 · Perfect clear",
  );
  assert.equal(describeLock({ id: 1, lines: 1, spin: "mini", points: 1, backToBack: false, combo: 0, perfectClear: false }), "Mini T-spin Single");
});
