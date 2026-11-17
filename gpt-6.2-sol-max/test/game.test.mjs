import assert from "node:assert/strict";
import { test } from "node:test";
import {
  cellsFor, Game, gravityInterval, HEIGHT, LOCK_DELAY_MS, MAX_LOCK_RESETS, PIECES, PREVIEW_COUNT, WIDTH,
} from "../dist/game.js";

function playingGame(random = () => 0.999) {
  const game = new Game(random);
  game.start();
  return game;
}

function positions(piece) {
  return cellsFor(piece.kind, piece.rotation).map(([x, y]) => [piece.x + x, piece.y + y]);
}

function fillRowsAround(game, piece, firstRow) {
  for (let y = firstRow; y < HEIGHT; y++) game.board[y].fill("pocket");
  for (const [x, y] of positions(piece)) {
    if (y >= firstRow) game.board[y][x] = null;
  }
}

test("a fresh game has an empty well and waits to start", () => {
  const game = new Game(() => 0.999);
  assert.equal(game.status, "ready");
  assert.equal(game.board.length, HEIGHT);
  assert.ok(game.board.every((row) => row.length === WIDTH && row.every((cell) => cell === null)));
  assert.equal(game.active.kind, "bar");
  assert.equal(game.next.length, PREVIEW_COUNT);
  assert.equal(game.score, 0);
  assert.equal(game.level, 1);
  assert.equal(game.advance(1_000), false);
  assert.equal(game.act("left"), false);

  game.start();
  assert.equal(game.act("left"), true);
  const moved = game.active;
  game.pause();
  assert.equal(game.advance(1_000), false);
  assert.equal(game.act("hard-drop"), false);
  game.start();
  assert.deepEqual(game.active, moved);
});

test("each seven-piece bag contains every shape and previews match the spawn order", () => {
  let seed = 42;
  const game = playingGame(() => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  });
  const expected = Object.keys(PIECES).sort();

  for (let bag = 0; bag < 3; bag++) {
    const seen = [];
    for (let index = 0; index < expected.length; index++) {
      seen.push(game.active.kind);
      const preview = game.next;
      game.act("hard-drop");
      assert.equal(game.active.kind, preview[0]);
      assert.deepEqual(game.next.slice(0, PREVIEW_COUNT - 1), preview.slice(1));
      for (const row of game.board) row.fill(null);
    }
    assert.deepEqual(seen.sort(), expected);
  }
});

test("horizontal movement stops at the wall and at occupied cells", () => {
  const game = playingGame();
  for (let move = game.active.x; move > 0; move--) assert.equal(game.act("left"), true);
  assert.equal(game.active.x, 0);
  assert.equal(game.act("left"), false);

  game.board[1][4] = "box";
  assert.equal(game.act("right"), false);
  assert.equal(game.active.x, 0);
  game.board[1][4] = null;
  assert.equal(game.act("right"), true);
});

test("rotation can kick away from the wall and off the floor", () => {
  const game = playingGame();
  assert.equal(game.act("clockwise"), true);
  while (game.act("left")) {}
  assert.ok(game.active.x < 0);
  assert.equal(game.act("counterclockwise"), true);
  assert.equal(game.active.rotation, 0);
  assert.equal(game.active.x, 0);

  while (game.act("soft-drop")) {}
  assert.equal(game.active.y, HEIGHT - 2);
  assert.equal(game.act("clockwise"), true);
  assert.equal(game.active.rotation, 1);
  assert.equal(game.active.y, HEIGHT - 4);
});

test("a blocked rotation leaves the piece in place", () => {
  const game = playingGame();
  const original = game.active;
  for (const row of game.board) row.fill("box");
  for (const [x, y] of positions(original)) game.board[y][x] = null;
  assert.equal(game.act("clockwise"), false);
  assert.equal(game.act("counterclockwise"), false);
  assert.deepEqual(game.active, original);
});

test("soft drop falls one cell, and hard drop lands exactly on the ghost", () => {
  const game = playingGame();
  const startY = game.active.y;
  assert.equal(game.act("soft-drop"), true);
  assert.equal(game.active.y, startY + 1);
  assert.equal(game.score, 1);
  const landing = game.ghost;
  const distance = landing.y - game.active.y;
  assert.ok(game.board.every((row) => row.every((cell) => cell === null)));

  assert.equal(game.act("hard-drop"), true);
  for (const [x, y] of positions(landing)) assert.equal(game.board[y][x], landing.kind);
  assert.equal(game.score, 1 + distance * 2);
  assert.equal(game.active.kind, "elbow");
});

test("holding uses the queue once, then swaps at spawn orientation after a lock", () => {
  const game = playingGame();
  const original = game.active;
  game.act("clockwise");
  game.act("left");
  assert.equal(game.act("hold"), true);
  assert.equal(game.held, "bar");
  assert.equal(game.active.kind, "elbow");
  assert.equal(game.canHold, false);
  assert.equal(game.act("hold"), false);

  game.act("hard-drop");
  assert.equal(game.canHold, true);
  const queue = game.next;
  assert.equal(game.act("hold"), true);
  assert.equal(game.held, "box");
  assert.deepEqual(game.active, original);
  assert.deepEqual(game.next, queue);
});

test("cleared rows collapse the well, level up, and award a streak bonus", () => {
  const game = playingGame();
  game.lines = 7;
  game.act("clockwise");
  const landing = game.ghost;
  fillRowsAround(game, landing, HEIGHT - 4);
  game.board[HEIGHT - 5][0] = "cross";
  const dropPoints = (landing.y - game.active.y) * 2;

  game.act("hard-drop");
  assert.equal(game.lines, 11);
  assert.equal(game.level, 2);
  assert.equal(game.streak, 1);
  assert.equal(game.score, dropPoints + 1000);
  assert.equal(game.board[HEIGHT - 1][0], "cross");
  assert.equal(game.board.flat().filter(Boolean).length, 1);

  const nextLanding = game.ghost;
  const before = game.score;
  fillRowsAround(game, nextLanding, HEIGHT - 1);
  game.act("hard-drop");
  assert.equal(game.lines, 12);
  assert.equal(game.streak, 2);
  assert.equal(game.score, before + nextLanding.y * 2 + (100 + 75) * 2);

  game.act("hard-drop");
  assert.equal(game.streak, 0);
});

test("gravity starts the lock delay only once the piece reaches the stack", () => {
  const game = playingGame();
  const interval = gravityInterval(game.level);
  assert.ok(gravityInterval(2) < interval);
  assert.ok(gravityInterval(100) > 0);
  assert.equal(game.advance(interval - 1), false);
  assert.equal(game.advance(1), true);
  assert.equal(game.active.y, 1);

  const timeToFloor = (game.ghost.y - game.active.y) * interval;
  game.advance(timeToFloor + LOCK_DELAY_MS - 1);
  assert.equal(game.active.kind, "bar");
  assert.equal(game.active.y, game.ghost.y);
  assert.equal(game.act("soft-drop"), false);
  assert.equal(game.advance(1), true);
  assert.equal(game.active.kind, "elbow");
  assert.equal(game.score, 0);
});

test("grounded movement resets the lock timer up to a fixed limit", () => {
  const game = playingGame();
  game.advance(game.ghost.y * gravityInterval(game.level));
  for (let reset = 0; reset < MAX_LOCK_RESETS; reset++) {
    assert.equal(game.advance(LOCK_DELAY_MS - 1), false);
    assert.equal(game.act(reset % 2 === 0 ? "left" : "right"), true);
  }

  assert.equal(game.advance(LOCK_DELAY_MS - 1), false);
  assert.equal(game.act("left"), true);
  assert.equal(game.advance(1), true);
  assert.equal(game.active.kind, "elbow");
});

test("an obstructed spawn ends the game and restarting resets the whole well", () => {
  const game = playingGame();
  const kind = game.next[0];
  const [x, y] = cellsFor(kind)[0];
  game.board[y][Math.floor((WIDTH - PIECES[kind].size) / 2) + x] = "pocket";
  game.act("hard-drop");
  assert.equal(game.status, "game-over");
  assert.equal(game.active, null);
  assert.equal(game.ghost, null);
  assert.equal(game.act("hold"), false);

  game.start();
  assert.equal(game.status, "playing");
  assert.equal(game.score, 0);
  assert.equal(game.lines, 0);
  assert.equal(game.held, null);
  assert.equal(game.canHold, true);
  assert.ok(game.active);
  assert.ok(game.board.flat().every((cell) => cell === null));
});
