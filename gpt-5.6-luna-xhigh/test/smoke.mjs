import assert from "node:assert/strict";
import { Board } from "../dist/board.js";
import { TetrisGame } from "../dist/game.js";
import { SevenBag } from "../dist/randomizer.js";

const board = new Board();
assert.equal(board.canPlaceAt("T", 0, 3, 0), true, "a fresh board accepts a spawn");
board.place({ type: "I", rotation: 0, x: 0, y: 18 });
board.place({ type: "I", rotation: 0, x: 4, y: 18 });
board.place({ type: "I", rotation: 0, x: 6, y: 18 });
// A complete row is removed, leaving a clean bottom row.
assert.equal(board.clearLines(), 1, "full rows clear");
assert.equal(board.get(0, 19), null, "cleared rows are replaced from above");

const bag = new SevenBag();
const firstBag = Array.from({ length: 7 }, () => bag.next()).sort();
assert.deepEqual(firstBag, ["I", "J", "L", "O", "S", "T", "Z"], "seven-bag emits every tetromino once");

const game = new TetrisGame({
  pieces: ["T", "I", "O", "L", "J", "S", "Z"],
  next() { return this.pieces.shift() ?? "I"; },
});
assert.equal(game.getState().next.length, 5, "the next queue is visible");
assert.ok(game.active, "a piece spawns at game start");
assert.equal(game.hardDrop() >= 0, true, "hard drop locks a piece");
assert.equal(game.active?.type, "I", "the next piece is spawned after a lock");
const heldType = game.active?.type;
game.holdPiece();
assert.equal(game.hold, heldType, "hold stores the active piece");
assert.equal(game.holdPiece(), false, "hold is limited to once per turn");

console.log("TetrisJS smoke tests passed");
