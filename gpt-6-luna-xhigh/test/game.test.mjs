import assert from "node:assert/strict";
import test from "node:test";
import { COLS, ROWS, createGame, hardDrop, holdPiece } from "../dist/game.js";

test("the 7-bag queue gives every piece once per bag", () => {
  const game = createGame(1234);
  const dealt = [];
  for (let i = 0; i < 14; i += 1) {
    dealt.push(game.active.type);
    hardDrop(game);
  }
  for (let offset = 0; offset < 14; offset += 7) {
    assert.deepEqual(new Set(dealt.slice(offset, offset + 7)).size, 7);
  }
});

test("hold can be used once until the active piece locks", () => {
  const game = createGame(55);
  const first = game.active.type;
  assert.equal(holdPiece(game), true);
  assert.equal(game.hold, first);
  assert.equal(holdPiece(game), false);
  hardDrop(game);
  assert.equal(game.holdUsed, false);
});

test("hard drop locks a piece and clears a completed row", () => {
  const game = createGame(99);
  game.board[ROWS - 1] = Array(COLS).fill("Z");
  for (let x = 3; x <= 6; x += 1) game.board[ROWS - 1][x] = null;
  game.active = { type: "I", x: 3, y: ROWS - 2, rotation: 0 };
  hardDrop(game);
  assert.equal(game.lines, 1);
  assert.equal(game.board[ROWS - 1].every((cell) => cell === null), true);
});
