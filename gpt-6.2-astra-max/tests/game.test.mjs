import test from "node:test";
import assert from "node:assert/strict";
import { Game, HEIGHT, HIDDEN, LOCK_DELAY, WIDTH, gravityInterval } from "../dist/game.js";
import { cells, SevenBag, TYPES } from "../dist/pieces.js";

const floor = HEIGHT + HIDDEN - 1;
const freshGame = () => new Game(() => 0.25);
const occupied = game => game.board.flat().filter(Boolean).length;

function position(game, kind, x, y, rotation = 0) {
  game.active = { kind, x, y, rotation };
}

function land(game) {
  while (game.softDrop()) { /* Stop at first contact without locking. */ }
}

// Leave a one-cell well for a vertical I. The marker above it survives the clear.
function prepareClear(game, count, perfect = false) {
  for (const row of game.board) row.fill(null);
  for (let y = floor - count + 1; y <= floor; y++) {
    game.board[y].fill("J");
    game.board[y][5] = null;
  }
  if (!perfect) game.board[floor - count][0] = "L";
  position(game, "I", 3, floor - 3, 1);
}

test("each shuffled bag contains exactly one of every tetromino", () => {
  let state = 37;
  const bag = new SevenBag(() => {
    state = (state * 16807) % 2147483647;
    return state / 2147483647;
  });
  const orders = new Set();
  for (let n = 0; n < 50; n++) {
    const pieces = Array.from({ length: 7 }, () => bag.take());
    orders.add(pieces.join(""));
    assert.deepEqual(pieces.sort(), [...TYPES].sort());
  }
  assert.ok(orders.size > 1);
});

test("a new game has an empty field, centered spawn and a populated queue", () => {
  const game = freshGame();
  assert.equal(game.board.length, 40);
  assert.ok(game.board.every(row => row.length === WIDTH));
  assert.equal(occupied(game), 0);
  assert.deepEqual([game.level, game.score, game.lines, game.held, game.over], [1, 0, 0, null, false]);
  assert.equal(game.active.x, 3);
  assert.equal(game.active.y, HIDDEN - 1);
  assert.equal(game.active.rotation, 0);
  assert.equal(new Set([game.active.kind, ...game.next]).size, 4);
});

test("all seven pieces rotate in both directions around their SRS pivots", () => {
  for (const kind of TYPES) {
    const game = freshGame();
    position(game, kind, 3, HIDDEN);
    const initial = { ...game.active };
    for (const direction of [1, -1]) {
      for (let i = 0; i < 4; i++) {
        assert.ok(game.rotate(direction));
        assert.equal(new Set(cells(kind, game.active.rotation).map(point => point.join(","))).size, 4);
        if (kind === "O") assert.deepEqual(cells(kind, game.active.rotation), cells("O"));
      }
      assert.deepEqual(game.active, initial);
    }
  }
});

test("SRS kicks a T one cell and an I two cells away from the wall", () => {
  for (const [kind, x] of [["T", -1], ["I", -2]]) {
    const game = freshGame();
    position(game, kind, x, HIDDEN + 5, 1);
    assert.equal(game.move(-1), false);
    assert.ok(game.rotate(-1));
    assert.deepEqual(game.active, { kind, x: 0, y: HIDDEN + 5, rotation: 0 });
  }
});

test("floor kicks use the correct vertical sign and the I-specific fifth test", () => {
  for (const [kind, expectedX, expectedY] of [["T", 2, floor - 2], ["I", 4, floor - 3]]) {
    const game = freshGame();
    position(game, kind, 3, floor - 1);
    assert.ok(game.rotate(1));
    assert.deepEqual(game.active, { kind, x: expectedX, y: expectedY, rotation: 1 });
    assert.ok(game.grounded);
  }
});

test("a rotation that fails all five kicks leaves the piece in place", () => {
  const game = freshGame();
  position(game, "T", 3, 25);
  for (let y = 21; y < 33; y++) game.board[y].fill("S");
  for (const [dx, dy] of cells("T")) game.board[25 + dy][3 + dx] = null;
  const before = { ...game.active };
  assert.equal(game.rotate(1), false);
  assert.deepEqual(game.active, before);
});

test("ghost projection, soft drop and hard drop agree on the landing cells", () => {
  const game = freshGame();
  position(game, "O", 3, 22);
  game.board[31][4] = "S";
  const next = game.next[0];
  assert.equal(game.ghostY, 29);
  assert.equal(game.active.y, 22);
  assert.equal(occupied(game), 1);
  assert.ok(game.softDrop());
  game.hardDrop();
  assert.equal(game.score, 1 + 2 * 6);
  for (const [x, y] of cells("O")) assert.equal(game.board[29 + y][3 + x], "O");
  assert.equal(occupied(game), 5);
  assert.equal(game.active.kind, next);
});

test("gravity accumulates elapsed time and held soft drop runs at twenty times gravity", () => {
  const game = freshGame();
  const y = game.active.y;
  game.advance(999);
  assert.equal(game.active.y, y);
  game.advance(1);
  assert.equal(game.active.y, y + 1);
  assert.equal(game.score, 0);
  game.advance(200, true);
  assert.equal(game.active.y, y + 5);
  assert.equal(game.score, 4);
  assert.equal(gravityInterval(1), 1000);
  assert.equal(gravityInterval(2), 793);
  assert.ok(Math.abs(gravityInterval(10) - 64.15) < 1);
});

test("lock delay starts at contact, even when landing halfway through an update", () => {
  const game = freshGame();
  game.active.y = game.ghostY - 1;
  game.advance(1000 + LOCK_DELAY - 1);
  assert.ok(game.grounded);
  assert.equal(occupied(game), 0);
  game.advance(1);
  assert.equal(occupied(game), 4);
});

test("grounded moves renew the timer, and the fifteenth adjustment locks the piece", () => {
  const game = freshGame();
  land(game);
  for (let i = 0; i < 15; i++) {
    game.advance(LOCK_DELAY - 1);
    assert.equal(occupied(game), 0);
    assert.ok(game.move(i % 2 ? -1 : 1));
  }
  assert.equal(occupied(game), 4);
});

test("failed slides and blocked soft drops do not renew lock delay", () => {
  const game = freshGame();
  while (game.move(-1)) { /* Move to the wall. */ }
  land(game);
  game.advance(LOCK_DELAY - 1);
  assert.equal(game.move(-1), false);
  assert.equal(game.softDrop(), false);
  game.advance(1);
  assert.equal(occupied(game), 4);
});

test("falling below the previous lowest position restores the lock move budget", () => {
  const game = freshGame();
  position(game, "O", -1, HIDDEN);
  game.board[floor - 2][0] = "J";
  land(game);
  for (let i = 0; i < 14; i++) game.rotate(1);
  game.move(1);
  assert.equal(game.grounded, false);
  land(game);
  assert.ok(game.rotate(1));
  assert.equal(occupied(game), 1);
  game.advance(LOCK_DELAY);
  assert.equal(occupied(game), 5);
});

test("hold consumes the queue once, and a swap restores the held piece's spawn state", () => {
  const game = freshGame();
  const original = { ...game.active };
  const [first, second] = game.next;
  game.move(-1);
  game.rotate(1);
  assert.ok(game.hold());
  assert.equal(game.held, original.kind);
  assert.equal(game.active.kind, first);
  assert.equal(game.next[0], second);
  assert.equal(game.hold(), false);
  game.hardDrop();
  const queue = [...game.next];
  assert.ok(game.hold());
  assert.deepEqual(game.active, original);
  assert.equal(game.held, second);
  assert.deepEqual(game.next, queue);
});

test("one through four completed rows clear and score at the pre-clear level", () => {
  for (const [index, award] of [100, 300, 500, 800].entries()) {
    const game = freshGame();
    game.lines = 19;
    prepareClear(game, index + 1);
    game.hardDrop();
    assert.equal(game.score, 2 * award);
    assert.equal(game.lines, 20 + index);
    assert.equal(game.level, 3);
    assert.equal(game.board[floor][0], "L");
    assert.equal(game.board.length, HEIGHT + HIDDEN);
  }
});

test("nonadjacent full rows collapse together without scrambling intervening rows", () => {
  const game = freshGame();
  for (const y of [floor, floor - 2]) {
    game.board[y].fill("O");
    game.board[y][5] = null;
  }
  game.board[floor - 1][0] = "S";
  game.board[floor - 3][1] = "Z";
  position(game, "I", 3, floor - 3, 1);
  game.hardDrop();
  assert.equal(game.lines, 2);
  assert.equal(game.board[floor][0], "S");
  assert.equal(game.board[floor - 1][1], "Z");
  assert.equal(occupied(game), 4);
});

test("back-to-back survives an empty placement, while a normal clear breaks the chain", () => {
  const game = freshGame();
  prepareClear(game, 4);
  game.hardDrop();
  assert.equal(game.lastPlacement.points, 800);
  game.hardDrop();
  assert.equal(game.combo, -1);
  assert.ok(game.backToBack);
  prepareClear(game, 4);
  game.hardDrop();
  assert.equal(game.lastPlacement.points, 1200);
  assert.ok(game.lastPlacement.backToBack);
  prepareClear(game, 1);
  game.hardDrop();
  assert.equal(game.lastPlacement.points, 150);
  assert.equal(game.backToBack, false);
});

test("a T-spin double receives spin scoring and starts a back-to-back chain", () => {
  const game = freshGame();
  game.board[floor].fill("J");
  game.board[floor][4] = null;
  game.board[floor - 1].fill("J");
  game.board[floor - 1].fill(null, 3, 6);
  game.board[floor - 2][3] = "J";
  position(game, "T", 3, floor - 2, 1);
  assert.ok(game.rotate(1));
  game.hardDrop();
  assert.equal(game.lastPlacement.spin, "full");
  assert.equal(game.score, 1200);
  assert.equal(game.lines, 2);
  assert.ok(game.backToBack);
});

test("the facing corners distinguish mini and full zero-line T-spins", () => {
  for (const full of [false, true]) {
    const game = freshGame();
    game.board[floor - 2][3] = game.board[floor][3] = game.board[floor][5] = "J";
    if (full) game.board[floor - 2][5] = "S";
    position(game, "T", 3, floor - 2);
    game.rotate(1);
    game.hardDrop();
    assert.equal(game.lastPlacement.spin, full ? "full" : "mini");
    assert.equal(game.score, full ? 400 : 100);
  }
});

test("perfect clears add their bonus, including a back-to-back four-line perfect clear", () => {
  const game = freshGame();
  for (const award of [2800, 4450]) {
    prepareClear(game, 4, true);
    game.hardDrop();
    assert.equal(game.lastPlacement.points, award);
    assert.ok(game.lastPlacement.perfect);
    assert.equal(occupied(game), 0);
  }
});

test("a blocked spawn tops out from both the queue and hold, and freezes the field", () => {
  for (const viaHold of [false, true]) {
    const game = freshGame();
    position(game, "O", 0, floor - 1);
    const incoming = game.next[0];
    const [dx, dy] = cells(incoming)[0];
    game.board[HIDDEN - 2 + dy][3 + dx] = "Z";
    if (viaHold) game.hold();
    else game.hardDrop();
    assert.ok(game.over);
    const board = structuredClone(game.board);
    const score = game.score;
    assert.equal(game.move(1), false);
    assert.equal(game.rotate(-1), false);
    assert.equal(game.hold(), false);
    assert.equal(game.softDrop(), false);
    game.hardDrop();
    game.advance(10000);
    assert.deepEqual(game.board, board);
    assert.equal(game.score, score);
  }
});
