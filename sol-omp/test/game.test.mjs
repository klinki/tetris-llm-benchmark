import test from "node:test";
import assert from "node:assert/strict";
import { PIECES, TetrisGame, cellsFor } from "../dist/game.js";

const fixedRandom = () => 0.999999;

test("the randomizer emits every tetromino before repeating", () => {
  const game = new TetrisGame(fixedRandom);
  const first = game.snapshot();
  const seen = [first.active.kind, ...first.next];
  game.hardDrop();
  seen.push(game.snapshot().next[4]);
  assert.deepEqual(new Set(seen), new Set(PIECES));
});

test("movement stops at the wall without changing the piece", () => {
  const game = new TetrisGame(fixedRandom);
  while (game.move(-1)) {
    // Move to the leftmost valid position.
  }
  const atWall = game.snapshot().active;
  assert.ok(atWall);
  const cells = cellsFor(atWall);
  assert.equal(Math.min(...cells.map(([x]) => x)), 0);
  assert.equal(game.move(-1), false);
  assert.deepEqual(game.snapshot().active, atWall);
});

test("hard drop locks immediately, scores distance, and spawns the next piece", () => {
  const game = new TetrisGame(fixedRandom);
  const firstKind = game.snapshot().active.kind;
  game.hardDrop();
  const state = game.snapshot();
  assert.notEqual(state.active.kind, firstKind);
  assert.ok(state.score > 0);
  assert.ok(state.board.flat().some((cell) => cell === firstKind));
});

test("hold swaps once per falling piece and resets after lock", () => {
  const game = new TetrisGame(fixedRandom);
  const original = game.snapshot().active.kind;
  assert.equal(game.hold(), true);
  assert.equal(game.snapshot().held, original);
  assert.equal(game.hold(), false);
  game.hardDrop();
  assert.equal(game.hold(), true);
  assert.equal(game.snapshot().active.kind, original);
});

test("rotation and pause are observable game state", () => {
  const game = new TetrisGame(fixedRandom);
  assert.equal(game.rotate(1), true);
  assert.equal(game.snapshot().active.rotation, 1);
  const before = game.snapshot().active;
  game.togglePause();
  game.tick(10_000);
  assert.deepEqual(game.snapshot().active, before);
  assert.equal(game.snapshot().paused, true);
});
