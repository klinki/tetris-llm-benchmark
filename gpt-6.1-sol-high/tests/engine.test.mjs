import test from "node:test";
import assert from "node:assert/strict";
import {
  Game,
  SevenBag,
  TYPES,
  HIDDEN,
  LOCK_DELAY,
  MAX_LOCK_RESETS,
  shape,
} from "../dist/engine.js";

const game = () => {
  const result = new Game(() => 0.5);
  result.start();
  return result;
};
const set = (g, x, y, kind = "J") => {
  g.board[y + HIDDEN][x] = kind;
};
const occupied = (g) => g.board.flat().filter(Boolean).length;
function tetris(g) {
  for (let y = 16; y < 20; y++) for (let x = 0; x < 9; x++) set(g, x, y);
  g.active = { kind: "I", rotation: 1, x: 7, y: 16 };
  g.hardDrop();
}

test("every seven-bag contains all seven pieces, including across many refills", () => {
  const bag = new SevenBag();
  for (let i = 0; i < 100; i++) {
    const batch = Array.from({ length: 7 }, () => bag.next());
    assert.deepEqual([...batch].sort(), [...TYPES].sort());
  }
});

test("all four orientations have exactly four unique minos", () => {
  for (const kind of TYPES)
    for (let rotation = 0; rotation < 4; rotation++) {
      const cells = shape(kind, rotation);
      assert.equal(cells.length, 4);
      assert.equal(new Set(cells.map(String)).size, 4);
    }
  assert.deepEqual(shape("O", 0), shape("O", 3));
});

test("ready and paused games do not advance or accept gameplay actions", () => {
  const g = new Game();
  const original = { ...g.active };
  g.update(5000);
  assert.deepEqual(g.active, original);
  assert.equal(g.hold(), false);
  g.start();
  g.pause();
  g.update(5000);
  g.hardDrop();
  g.softDrop();
  g.move(1);
  g.rotate(1);
  assert.deepEqual(g.active, original);
  assert.equal(g.elapsed, 0);
  g.pause();
  assert.equal(g.status, "playing");
});

test("collision respects walls, hidden buffer, floor, and settled pieces", () => {
  const g = game();
  assert.equal(g.board.length, 40);
  assert.equal(g.fits({ kind: "O", rotation: 0, x: -1, y: 18 }), true);
  assert.equal(g.fits({ kind: "O", rotation: 0, x: -2, y: 18 }), false);
  assert.equal(g.fits({ kind: "O", rotation: 0, x: 7, y: 19 }), false);
  assert.equal(g.fits({ kind: "O", rotation: 0, x: 7, y: -21 }), false);
  set(g, 4, 0);
  assert.equal(g.fits({ kind: "O", rotation: 0, x: 3, y: -1 }), false);
});

test("four clockwise rotations and reverse rotations return to original orientation", () => {
  const g = game();
  for (const kind of TYPES.filter((k) => k !== "O")) {
    g.active = { kind, rotation: 0, x: 3, y: 4 };
    const original = { ...g.active };
    for (let i = 0; i < 4; i++) assert.equal(g.rotate(1), true);
    assert.deepEqual(g.active, original);
    g.rotate(1);
    g.rotate(-1);
    assert.deepEqual(g.active, original);
  }
});

test("JLSTZ use SRS floor and wall kicks in order", () => {
  const g = game();
  g.active = { kind: "T", rotation: 0, x: 3, y: 18 };
  assert.equal(g.rotate(1), true);
  assert.deepEqual(g.active, { kind: "T", rotation: 1, x: 2, y: 17 });
  g.active = { kind: "T", rotation: 1, x: -1, y: 5 };
  assert.equal(g.rotate(1), true);
  assert.deepEqual(g.active, { kind: "T", rotation: 2, x: 0, y: 5 });
});

test("I piece uses its own SRS kick table", () => {
  const g = game();
  g.active = { kind: "I", rotation: 0, x: 3, y: 18 };
  assert.equal(g.rotate(1), true);
  assert.deepEqual(g.active, { kind: "I", rotation: 1, x: 4, y: 16 });
});

test("blocked rotation fails without changing the piece", () => {
  const g = game();
  g.active = { kind: "T", rotation: 0, x: 3, y: 5 };
  const allowed = new Set(g.cells(g.active).map(String));
  for (let y = 2; y < 11; y++)
    for (let x = 0; x < 10; x++) {
      if (!allowed.has(String([x, y]))) set(g, x, y);
    }
  const original = { ...g.active };
  assert.equal(g.rotate(1), false);
  assert.deepEqual(g.active, original);
});

test("hold is once per piece and swapped pieces reset orientation and position", () => {
  const g = game();
  const first = g.active.kind;
  const next = g.queue[0];
  g.rotate(1);
  g.move(1);
  assert.equal(g.hold(), true);
  assert.equal(g.held, first);
  assert.equal(g.active.kind, next);
  assert.equal(g.hold(), false);
  g.hardDrop();
  const queue = [...g.queue];
  assert.equal(g.hold(), true);
  assert.equal(g.active.kind, first);
  assert.equal(g.active.rotation, 0);
  assert.equal(g.active.x, 3);
  assert.deepEqual(g.queue, queue);
  assert.equal(g.queue.length, 5);
});

test("ghost is nonmutating and hard drop locks at its location with two points per cell", () => {
  const g = game();
  const original = { ...g.active };
  const ghost = g.ghost();
  assert.deepEqual(g.active, original);
  assert.equal(g.fits(ghost), true);
  assert.equal(g.fits({ ...ghost, y: ghost.y + 1 }), false);
  const cells = g.cells(ghost);
  const distance = g.hardDrop();
  assert.equal(g.score, distance * 2);
  assert.equal(g.pieces, 1);
  for (const [x, y] of cells) assert.equal(g.cell(x, y), original.kind);
});

test("soft drop awards one point per cell and never locks immediately", () => {
  const g = game();
  let steps = 0;
  while (g.softDrop()) steps++;
  assert.equal(g.score, steps);
  assert.equal(g.pieces, 0);
  assert.equal(g.softDrop(), false);
  g.update(LOCK_DELAY);
  assert.equal(g.pieces, 1);
});

test("gravity and soft drop respect elapsed time", () => {
  const g = game();
  const y = g.active.y;
  g.update(999);
  assert.equal(g.active.y, y);
  g.update(1);
  assert.equal(g.active.y, y + 1);
  assert.equal(g.score, 0);
  const s = game();
  const sy = s.active.y;
  s.update(100, true);
  assert.equal(s.active.y, sy + 2);
  assert.equal(s.score, 2);
});

test("lock delay is 500ms and movement resets it at most 15 times", () => {
  const g = game();
  g.active = { kind: "O", rotation: 0, x: 3, y: 18 };
  g.update(499);
  assert.equal(g.pieces, 0);
  for (let i = 0; i < MAX_LOCK_RESETS; i++) {
    g.move(i % 2 === 0 ? 1 : -1);
    g.update(499);
    assert.equal(g.pieces, 0);
  }
  g.move(-1);
  g.update(1);
  assert.equal(g.pieces, 1);
});

test("O rotations preserve the occupied cells and reset the lock delay", () => {
  const g = game();
  g.active = { kind: "O", rotation: 0, x: 3, y: 18 };
  const cells = g.cells(g.active);
  g.update(400);
  assert.equal(g.rotate(1), true);
  assert.deepEqual(g.cells(g.active), cells);
  g.update(400);
  assert.equal(g.pieces, 0);
  g.update(100);
  assert.equal(g.pieces, 1);
});

test("frame segmentation does not alter gravity, lock, or spawn results", () => {
  const a = game(),
    b = game();
  a.update(25000);
  for (let i = 0; i < 2500; i++) b.update(10);
  assert.deepEqual(a.board, b.board);
  assert.deepEqual(a.active, b.active);
  assert.equal(a.pieces, b.pieces);
  assert.equal(a.elapsed, b.elapsed);
});

test("single clears shift every row above downward", () => {
  const g = game();
  for (let x = 0; x < 8; x++) set(g, x, 19);
  set(g, 0, -1, "S");
  g.active = { kind: "O", rotation: 0, x: 7, y: 18 };
  g.hardDrop();
  assert.equal(g.lines, 1);
  assert.equal(g.score, 100);
  assert.equal(g.cell(8, 19), "O");
  assert.equal(g.cell(0, 0), "S");
  assert.equal(g.board.length, 40);
});

test("Tetris, back-to-back and combo scoring, including chain preservation on no clear", () => {
  const g = game();
  set(g, 0, 10);
  tetris(g);
  assert.equal(g.score, 800);
  assert.equal(g.backToBack, true);
  assert.equal(g.combo, 0);
  tetris(g);
  assert.equal(g.score, 800 + 1200 + 50);
  assert.equal(g.combo, 1);
  g.active = { kind: "O", rotation: 0, x: 2, y: 18 };
  g.hardDrop();
  assert.equal(g.combo, -1);
  assert.equal(g.backToBack, true);
});

test("ordinary clear breaks back-to-back and ten lines advance the level", () => {
  const g = game();
  g.backToBack = true;
  g.lines = 9;
  for (let x = 0; x < 8; x++) set(g, x, 19);
  g.active = { kind: "O", rotation: 0, x: 7, y: 18 };
  g.hardDrop();
  assert.equal(g.score, 100); // The old level applies to this clear.
  assert.equal(g.lines, 10);
  assert.equal(g.level, 2);
  assert.ok(g.gravityMs < 1000);
  assert.equal(g.backToBack, false);
});

test("perfect clear awards the extra Guideline bonus", () => {
  const g = game();
  tetris(g);
  assert.equal(occupied(g), 0);
  assert.equal(g.score, 800 + 2000);
  assert.match(g.lastClear.text, /Perfect clear/);
});

test("three-corner T-spin and mini recognition require the last move to be rotation", () => {
  const g = game();
  g.active = { kind: "T", rotation: 3, x: 3, y: 17 };
  for (const [x, y] of [
    [3, 17],
    [5, 17],
    [3, 19],
    [4, 19],
  ])
    set(g, x, y);
  assert.equal(g.rotate(1), true);
  assert.equal(g.hardDrop(), 0);
  assert.equal(g.score, 400);
  assert.match(g.lastClear.text, /T-spin/);
  const mini = game();
  mini.active = { kind: "T", rotation: 1, x: 3, y: 17 };
  for (const [x, y] of [
    [3, 17],
    [3, 19],
    [5, 19],
  ])
    set(mini, x, y);
  assert.equal(mini.rotate(-1), true);
  mini.hardDrop();
  assert.equal(mini.score, 100);
  assert.match(mini.lastClear.text, /Mini T-spin/);
});

test("T-spin single scores 800 and starts a back-to-back chain", () => {
  const g = game();
  g.active = { kind: "T", rotation: 3, x: 3, y: 17 };
  for (const [x, y] of [
    [3, 17],
    [5, 17],
    [3, 19],
    [4, 19],
  ])
    set(g, x, y);
  for (let x = 0; x < 10; x++) if (x < 3 || x > 5) set(g, x, 18);
  assert.equal(g.rotate(1), true);
  g.hardDrop();
  assert.equal(g.lines, 1);
  assert.equal(g.score, 800);
  assert.equal(g.backToBack, true);
});

test("blocked spawn and completely hidden locks cause game over", () => {
  const g = game();
  g.held = "O";
  set(g, 4, -2);
  g.hold();
  assert.equal(g.status, "over");
  const h = game();
  h.active = { kind: "O", rotation: 0, x: 3, y: -2 };
  set(h, 4, 0);
  set(h, 5, 0);
  h.hardDrop();
  assert.equal(h.status, "over");
});

test("restart resets board, hold, statistics, queue, and game-over state", () => {
  const g = game();
  g.hold();
  g.hardDrop();
  g.status = "over";
  g.restart();
  assert.equal(g.status, "playing");
  assert.equal(g.score, 0);
  assert.equal(g.lines, 0);
  assert.equal(g.level, 1);
  assert.equal(g.elapsed, 0);
  assert.equal(g.pieces, 0);
  assert.equal(g.held, null);
  assert.equal(g.canHold, true);
  assert.equal(occupied(g), 0);
  assert.equal(g.queue.length, 5);
  assert.equal(g.combo, -1);
  assert.equal(g.backToBack, false);
});
