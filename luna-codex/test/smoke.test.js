import assert from "node:assert/strict";
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  TetrisGame,
  SevenBag,
  createSeededRandom,
  gravityIntervalForLevel,
  lineClearScore
} from "../dist/engine.js";

const types = new Set(["I", "O", "T", "S", "Z", "J", "L"]);
const bag = new SevenBag(createSeededRandom(42));
const firstTwoBags = Array.from({ length: 14 }, () => bag.next());
assert.equal(new Set(firstTwoBags.slice(0, 7)).size, 7, "first bag should contain every piece once");
assert.equal(new Set(firstTwoBags.slice(7)).size, 7, "second bag should contain every piece once");
assert.ok(firstTwoBags.every((type) => types.has(type)), "bag should only produce tetrominoes");

const game = new TetrisGame({ random: createSeededRandom(7) });
assert.equal(game.board.length, BOARD_HEIGHT);
assert.equal(game.board[0].length, BOARD_WIDTH);
assert.ok(game.active, "game should spawn a piece");
assert.equal(game.getNext().length, 5, "game should expose a useful next queue");

const startingType = game.active.type;
assert.equal(game.hold(), true, "first hold should be accepted");
assert.equal(game.hold(), false, "a second hold before a lock should be rejected");
assert.equal(game.holdType, startingType);
game.hardDrop();
assert.equal(game.canHold, true, "hold should become available after locking");

assert.equal(gravityIntervalForLevel(1), 1000);
assert.ok(gravityIntervalForLevel(2) < gravityIntervalForLevel(1));
assert.equal(lineClearScore(4, 1), 800);
assert.equal(lineClearScore(4, 1, false, true), 1200);
assert.equal(lineClearScore(0, 1, true), 400);
assert.equal(lineClearScore(0, 1, true, true), 400);

const clearGame = new TetrisGame({ random: createSeededRandom(1) });
const nearlyFull = Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null));
for (let column = 0; column < BOARD_WIDTH; column += 1) nearlyFull[BOARD_HEIGHT - 1][column] = column < 3 || column > 6 ? "J" : null;
clearGame.setBoard(nearlyFull);
clearGame.setActivePiece("I", 3, BOARD_HEIGHT - 2, 0);
clearGame.hardDrop();
assert.equal(clearGame.lines, 1, "a completed row should clear");
assert.equal(clearGame.board[BOARD_HEIGHT - 1].every((cell) => cell === null), true);

const topOutGame = new TetrisGame({ random: createSeededRandom(3) });
const blocked = Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null));
blocked[0].fill("Z");
topOutGame.setBoard(blocked);
topOutGame.setActivePiece("I", 3, -1, 0);
topOutGame.hardDrop();
assert.equal(topOutGame.gameOver, true, "a piece blocked above the playfield should top out");

console.log("TetrisJS smoke tests passed");
