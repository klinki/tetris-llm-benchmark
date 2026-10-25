import assert from "node:assert/strict";
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  PIECE_KINDS,
  TetrisGame,
  createSevenBag,
  emptyBoard,
  getPieceCells,
  gravityInterval
} from "../dist/game.js";

let assertions = 0;
function check(condition, message) {
  assert.ok(condition, message);
  assertions += 1;
}

// Every generated bag contains exactly one of each tetromino.
const samples = [0.02, 0.91, 0.37, 0.64, 0.12, 0.78];
let sampleIndex = 0;
const bag = createSevenBag(() => samples[sampleIndex++ % samples.length]);
assert.deepEqual([...bag].sort(), [...PIECE_KINDS].sort());
assertions += 1;

// Every rotation is made from four distinct blocks.
for (const kind of PIECE_KINDS) {
  for (const rotation of [0, 1, 2, 3]) {
    const cells = getPieceCells({ kind, x: 0, y: 0, rotation });
    check(cells.length === 4, `${kind} rotation ${rotation} must have four cells`);
    check(new Set(cells.map(([x, y]) => `${x},${y}`)).size === 4, `${kind} cells must be unique`);
  }
}

// The queue exposes five pieces and starts with a supplied deterministic sequence.
const sequenced = new TetrisGame({ sequence: ["I", "T", "L", "O", "S", "J", "Z"] });
let snapshot = sequenced.snapshot();
assert.equal(snapshot.active?.kind, "I");
assert.deepEqual(snapshot.next, ["T", "L", "O", "S", "J"]);
assertions += 2;

// Movement cannot cross the playfield boundary.
for (let index = 0; index < 10; index += 1) sequenced.move(-1);
snapshot = sequenced.snapshot();
check(Math.min(...getPieceCells(snapshot.active).map(([x]) => x)) === 0, "piece must stop at the left wall");
assert.equal(sequenced.move(-1), false);
assertions += 1;

// I-piece SRS kicks it left when rotating against the right wall.
const kickGame = new TetrisGame({ sequence: ["I", "O"] });
assert.equal(kickGame.rotate(1), true);
for (let index = 0; index < 8; index += 1) kickGame.move(1);
assert.equal(kickGame.rotate(1), true);
snapshot = kickGame.snapshot();
assert.equal(snapshot.active?.rotation, 2);
check(getPieceCells(snapshot.active).every(([x]) => x >= 0 && x < BOARD_WIDTH), "wall-kicked piece must stay in bounds");
assertions += 3;

// Hold is limited to once per active piece and resets after a lock.
const holdGame = new TetrisGame({ sequence: ["I", "T", "L", "O"] });
assert.equal(holdGame.hold(), true);
assert.equal(holdGame.snapshot().hold, "I");
assert.equal(holdGame.snapshot().active?.kind, "T");
assert.equal(holdGame.hold(), false);
holdGame.hardDrop();
assert.equal(holdGame.hold(), true);
assert.equal(holdGame.snapshot().active?.kind, "I");
assertions += 6;

// Hard drop locks exactly four cells and awards distance points.
const dropGame = new TetrisGame({ sequence: ["O", "T"] });
const distance = dropGame.hardDrop();
snapshot = dropGame.snapshot();
const occupied = snapshot.board.flat().filter(Boolean).length;
assert.equal(occupied, 4);
assert.equal(snapshot.score, distance * 2);
assert.equal(snapshot.active?.kind, "T");
assertions += 3;

// Completing a line clears it, scores it, and recognizes a perfect clear.
const lineBoard = emptyBoard();
for (let x = 0; x < BOARD_WIDTH; x += 1) {
  if (x < 3 || x > 6) lineBoard[BOARD_HEIGHT - 1][x] = "J";
}
const lineGame = new TetrisGame({ initialBoard: lineBoard, sequence: ["I", "S"] });
lineGame.hardDrop();
snapshot = lineGame.snapshot();
assert.equal(snapshot.lines, 1);
assert.equal(snapshot.board.flat().filter(Boolean).length, 0);
assert.equal(snapshot.event.label, "SINGLE");
check(snapshot.score >= 900, "line plus perfect clear bonus should be scored");
assertions += 3;

// A blocked spawn ends the game immediately.
const blockedBoard = emptyBoard();
for (let x = 3; x <= 6; x += 1) blockedBoard[0][x] = "Z";
const blockedGame = new TetrisGame({ initialBoard: blockedBoard, sequence: ["I"] });
assert.equal(blockedGame.snapshot().gameOver, true);
assert.equal(blockedGame.snapshot().event.label, "TOP OUT");
assertions += 2;

// Gravity accelerates with level and pause freezes the simulation.
check(gravityInterval(8) < gravityInterval(1), "gravity must speed up as level increases");
const pauseGame = new TetrisGame({ sequence: ["T"] });
const beforePause = pauseGame.snapshot().active?.y;
pauseGame.togglePause();
for (let index = 0; index < 20; index += 1) pauseGame.tick(100);
assert.equal(pauseGame.snapshot().active?.y, beforePause);
pauseGame.togglePause();
for (let index = 0; index < 10; index += 1) pauseGame.tick(100);
check((pauseGame.snapshot().active?.y ?? -2) > (beforePause ?? -1), "gravity should resume after pause");
assertions += 1;

console.log(`TetrisJS smoke tests passed (${assertions} assertions).`);
