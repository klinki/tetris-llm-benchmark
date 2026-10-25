import assert from "node:assert/strict";
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  TetrisGame,
  getPieceCells
} from "../dist/game.js";

const game = new TetrisGame(() => 0.42);

assert.equal(game.board.length, BOARD_HEIGHT);
assert.equal(game.board[0].length, BOARD_WIDTH);
assert.ok(game.active, "A game starts with an active piece");
assert.equal(game.queue.length >= 5, true, "The next queue is kept stocked");

const openingBag = [game.active.type, ...game.queue.slice(0, 6)];
assert.equal(new Set(openingBag).size, 7, "The opening sequence is a 7-bag permutation");

const heldType = game.active.type;
assert.equal(game.handle("hold"), true, "A piece can be held");
assert.equal(game.hold, heldType);
assert.equal(game.holdUsed, true, "Hold is limited to once before lock");
assert.equal(game.handle("hold"), false, "A second hold is rejected");

const yBeforeGravity = game.active.y;
game.tick(1100);
assert.ok(game.active.y > yBeforeGravity, "Gravity moves the active piece");

game.handle("hardDrop");
assert.ok(game.active, "Hard dropping spawns a replacement piece");
assert.equal(game.holdUsed, false, "Locking restores hold availability");

const scoringGame = new TetrisGame(() => 0.1);
scoringGame.board[BOARD_HEIGHT - 1] = Array.from(
  { length: BOARD_WIDTH },
  (_, index) => (index >= 3 && index <= 6 ? null : "J")
);
scoringGame.active = { type: "I", rotation: 0, x: 3, y: BOARD_HEIGHT - 3 };
scoringGame.handle("hardDrop");
assert.equal(scoringGame.lines, 1, "Completing a row clears it");
assert.ok(scoringGame.score >= 100, "Line clears award Guideline score");

const topOutGame = new TetrisGame(() => 0.7);
for (let y = 0; y <= 1; y += 1) {
  for (let x = 3; x <= 6; x += 1) {
    topOutGame.board[y][x] = "J";
  }
}
topOutGame.active = { type: "O", rotation: 0, x: 3, y: BOARD_HEIGHT - 3 };
topOutGame.handle("hardDrop");
assert.equal(topOutGame.phase, "gameover", "A blocked spawn triggers top-out");

const rotated = new TetrisGame(() => 0.2);
const beforeRotation = rotated.active.rotation;
rotated.handle("rotateClockwise");
assert.notEqual(rotated.active.rotation, beforeRotation, "Pieces rotate through SRS states");
assert.equal(getPieceCells(rotated.active).length, 4, "Pieces always have four cells");

console.log("Tetris smoke tests passed.");
