import assert from "node:assert/strict";
import { BOARD_HEIGHT, BOARD_WIDTH, PIECE_TYPES, TetrisGame, gravityIntervalForLevel } from "../dist/game.js";

function firstBagFromDrops(game) {
  const pieces = [];
  for (let index = 0; index < PIECE_TYPES.length; index += 1) {
    pieces.push(game.getSnapshot().active.type);
    game.hardDrop();
  }
  return pieces;
}

const game = new TetrisGame(() => 0.5);
assert.equal(game.getSnapshot().board.length, BOARD_HEIGHT);
assert.equal(game.getSnapshot().board[0].length, BOARD_WIDTH);
assert.equal(new Set(firstBagFromDrops(game)).size, PIECE_TYPES.length);
assert.equal(game.getSnapshot().next.length, 5);

const firstType = game.getSnapshot().active.type;
assert.equal(game.holdPiece(), true);
assert.equal(game.canHold, false);
assert.equal(game.holdPiece(), false);
assert.equal(game.hardDrop() >= 0, true);
assert.equal(game.canHold, true);
assert.notEqual(game.getSnapshot().active.type, firstType);

const movementGame = new TetrisGame(() => 0.25);
for (let index = 0; index < 20; index += 1) {
  movementGame.move(-1);
}
assert.equal(movementGame.getSnapshot().active.x >= 0, true);
for (let index = 0; index < 20; index += 1) {
  movementGame.move(1);
}
assert.equal(movementGame.getSnapshot().active.x <= BOARD_WIDTH - 1, true);

const gravityGame = new TetrisGame(() => 0.75);
const startingY = gravityGame.getSnapshot().active.y;
gravityGame.tick(gravityIntervalForLevel(1));
assert.equal(gravityGame.getSnapshot().active.y >= startingY, true);

console.log("TetrisJS smoke tests passed.");
