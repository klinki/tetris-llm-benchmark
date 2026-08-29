import { Board } from "../src/board.js";
import { getKickTests } from "../src/constants.js";
import { TetrisGame } from "../src/game.js";
import { SevenBag } from "../src/randomizer.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function testSevenBag(): void {
  const bag = new SevenBag(() => 0.25);
  const first = Array.from({ length: 7 }, () => bag.next());
  assert(new Set(first).size === 7, "a seven-bag must contain each piece exactly once");
  const second = Array.from({ length: 7 }, () => bag.next());
  assert(new Set(second).size === 7, "each refilled bag must contain each piece exactly once");
}

function testBoardClearsLines(): void {
  const board = new Board();
  for (let column = 0; column < board.width - 1; column += 1) {
    board.setCell(column, board.height - 1, "J");
  }
  board.setCell(board.width - 1, board.height - 2, "J");
  assert(board.clearLines() === 0, "an incomplete row must not clear");
  board.setCell(board.width - 1, board.height - 1, "I");
  assert(board.clearLines() === 1, "a complete row must clear");
  assert(board.getCell(0, board.height - 1) === null, "cleared rows must be replaced with empty rows");
}

function testRotationKickAndHold(): void {
  const game = new TetrisGame(() => 0);
  game.current = { type: "I", rotation: 1, x: 7, y: 0 };
  assert(game.rotate(1), "an I piece should use an SRS wall kick");
  assert(game.current.x === 6, "the I piece should kick one cell away from the wall");

  const beforeHold = game.current.type;
  assert(game.hold(), "the first hold should succeed");
  assert(game.holdPiece === beforeHold, "hold should store the falling piece");
  assert(!game.canHold, "a piece may only be held once before locking");
  game.hardDrop();
  assert(game.canHold, "holding should be available again after a lock");
}

function testGravityAndGhost(): void {
  const game = new TetrisGame(() => 0);
  const startY = game.current.y;
  game.update(1000);
  assert(game.current.y > startY || game.score > 0, "gravity should advance after elapsed time");
  const ghost = game.getGhostPiece();
  assert(ghost.y >= game.current.y, "the ghost cannot be above the active piece");
  assert(getKickTests("T", 0, 1).length === 5, "JLSTZ pieces should have five SRS kick tests");
}

function testGuidelineLineScore(): void {
  const game = new TetrisGame(() => 0);
  game.current = { type: "I", rotation: 0, x: 3, y: 0 };
  for (const column of [0, 1, 2, 7, 8, 9]) {
    game.board.setCell(column, game.board.height - 1, "J");
  }
  // The hard drop is 18 rows (36 points), followed by a single (100) and
  // perfect-clear (800) bonus at level one.
  game.hardDrop();
  assert(game.score === 936, "single-line perfect-clear scoring should follow the Guideline");
  assert(game.lines === 1, "locking a complete row should increment the line count");
}

testSevenBag();
testBoardClearsLines();
testRotationKickAndHold();
testGravityAndGhost();
testGuidelineLineScore();
console.log("Tetris logic smoke tests passed");
