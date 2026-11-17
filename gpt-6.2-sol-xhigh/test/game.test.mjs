import assert from "node:assert/strict";
import test from "node:test";
import { Game, HIDDEN_ROWS, PREVIEW_COUNT } from "../dist/game.js";
import { Bag, KINDS, SHAPES } from "../dist/pieces.js";

function occupy(game, x, y) {
  game.board[y + HIDDEN_ROWS][x] = "J";
}

test("each seven-piece bag contains every kind exactly once", () => {
  let seed = 7;
  const bag = new Bag(() => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  });

  for (let i = 0; i < 4; i++) {
    const pieces = Array.from({ length: 7 }, () => bag.take());
    assert.deepEqual(pieces.sort(), [...KINDS].sort());
  }
});

test("hold consumes the queue only when empty and returns pieces at spawn facing", () => {
  const game = new Game(() => 0.5);
  const first = game.active.kind;
  const second = game.next[0];
  game.rotate(1);

  assert.ok(game.hold());
  assert.equal(game.held, first);
  assert.equal(game.active.kind, second);
  assert.equal(game.next.length, PREVIEW_COUNT);
  assert.equal(game.hold(), false);

  game.hardDrop();
  const third = game.active.kind;
  const queue = [...game.next];
  assert.ok(game.hold());
  assert.equal(game.held, third);
  assert.equal(game.active.kind, first);
  assert.equal(game.active.rotation, 0);
  assert.deepEqual(game.next, queue);
});

test("SRS tries the correct wall and floor kicks for T and I pieces", () => {
  const game = new Game();
  game.active = { kind: "T", rotation: 1, x: -1, y: 6 };
  assert.equal(game.move(-1), false);
  assert.ok(game.rotate(1));
  assert.deepEqual(game.active, { kind: "T", rotation: 2, x: 0, y: 6 });

  game.active = { kind: "I", rotation: 1, x: -2, y: 6 };
  assert.ok(game.rotate(-1));
  assert.deepEqual(game.active, { kind: "I", rotation: 0, x: 0, y: 6 });

  game.active = { kind: "T", rotation: 0, x: 3, y: 18 };
  assert.ok(game.rotate(1));
  assert.deepEqual(game.active, { kind: "T", rotation: 1, x: 2, y: 17 });
});

test("soft drop scores per row and hard drop immediately locks at the ghost", () => {
  const game = new Game(() => 0.99);
  const initial = game.active;
  assert.equal(game.tick(999), false);
  assert.ok(game.tick(1));
  assert.equal(game.active.y, initial.y + 1);
  assert.equal(game.score, 0);

  assert.ok(game.softDrop());
  assert.ok(game.tick(100, true));
  assert.equal(game.active.y, initial.y + 4);
  assert.equal(game.score, 3);

  const ghost = game.ghost();
  const distance = ghost.y - game.active.y;
  const next = game.next[0];
  assert.ok(game.hardDrop());
  assert.equal(game.score, 3 + 2 * distance);
  assert.equal(game.active.kind, next);
  for (const [x, y] of SHAPES[ghost.kind][ghost.rotation]) {
    assert.equal(game.board[ghost.y + y + HIDDEN_ROWS][ghost.x + x], ghost.kind);
  }
});

test("grounded pieces have 500 ms of lock delay and successful movement resets it", () => {
  const game = new Game();
  game.tick((game.ghost().y - game.active.y) * game.gravityInterval);
  assert.equal(game.active.y, game.ghost().y);
  assert.equal(game.tick(499), false);
  assert.ok(game.move(1));
  assert.equal(game.tick(499), false);
  assert.ok(game.tick(1));
  assert.equal(game.active.y, -1);
});

test("the fifteenth grounded manipulation locks the piece", () => {
  const game = new Game();
  game.tick((game.ghost().y - game.active.y) * game.gravityInterval);
  const bottom = game.active.y;
  for (let i = 0; i < 14; i++) assert.ok(game.move(i % 2 === 0 ? -1 : 1));
  assert.equal(game.active.y, bottom);
  assert.ok(game.move(-1));
  assert.equal(game.active.y, -1);
});

test("clearing lines compacts the board and scores at the level before the clear", () => {
  const game = new Game();
  game.lines = 8;

  function dropFour() {
    for (let y = 16; y < 20; y++) {
      for (let x = 0; x < 9; x++) occupy(game, x, y);
    }
    game.active = { kind: "I", rotation: 1, x: 7, y: 16 };
    assert.ok(game.hardDrop());
  }

  occupy(game, 0, 15);
  dropFour();
  assert.equal(game.lines, 12);
  assert.equal(game.score, 800);
  assert.equal(game.level, 2);
  assert.equal(game.gravityInterval, 793);
  assert.equal(game.board[19 + HIDDEN_ROWS][0], "J");
  assert.equal(game.board[18 + HIDDEN_ROWS][0], null);

  dropFour();
  assert.equal(game.lines, 16);
  assert.equal(game.score, 800 + (1200 + 50) * 2);
});

test("a grounded rotation scores full and mini T-spin singles by their front corners", () => {
  for (const [mini, score] of [[false, 800], [true, 200]]) {
    const game = new Game();
    for (const x of [0, 1, 2, 6, 7, 8, 9]) occupy(game, x, 18);
    occupy(game, 3, 17);
    occupy(game, 3, 19);
    occupy(game, 5, mini ? 19 : 17);
    game.active = { kind: "T", rotation: 3, x: 3, y: 17 };

    assert.ok(game.rotate(1));
    assert.equal(game.active.rotation, 0);
    assert.equal(game.active.y, game.ghost().y);
    assert.ok(game.hardDrop());
    assert.equal(game.lines, 1);
    assert.equal(game.score, score);
  }
});

test("a blocked spawn ends the game", () => {
  const game = new Game(() => 0.99);
  while (game.move(-1)) {}
  const [x, y] = SHAPES[game.next[0]][0][0];
  occupy(game, x + 3, y - 2);

  assert.ok(game.hardDrop());
  assert.equal(game.gameOver, true);
  assert.equal(game.ghost(), null);
  assert.equal(game.hold(), false);
  assert.equal(game.tick(1000), false);
});
