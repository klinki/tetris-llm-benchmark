import { BOARD_HEIGHT, BOARD_WIDTH, PIECES, TetrisGame, canPlace, cellsFor, emptyBoard, type ActivePiece } from "./engine.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function sequenceRandom(values: number[]): () => number {
  let index = 0;
  return () => values[index++ % values.length];
}

function testSevenBag(): void {
  const game = new TetrisGame(sequenceRandom([0.13, 0.74, 0.42, 0.92, 0.01, 0.6, 0.31]));
  const pieces = [game.active!.type, ...game.queue.slice(0, 6)];
  assert(new Set(pieces).size === PIECES.length, "A seven-bag should contain every tetromino exactly once");
}

function testSrsWallKick(): void {
  const game = new TetrisGame(() => 0);
  game.active = { type: "T", rotation: 1, x: -1, y: 4 };
  assert(game.rotate(-1), "T piece should rotate with an SRS wall kick");
  assert(game.active.x >= 0, "Wall kick should move rotated piece inside the board");
}

function testHardDropAndClear(): void {
  const game = new TetrisGame(() => 0);
  game.board = emptyBoard();
  for (let x = 4; x < BOARD_WIDTH; x += 1) game.board[BOARD_HEIGHT - 1][x] = "J";
  game.active = { type: "I", rotation: 0, x: 0, y: 0 };
  const result = game.hardDrop();
  assert(result.cleared === 1, "Hard drop should lock and clear a completed row");
  assert(game.lines === 1 && game.score >= 100, "Line clear should update scoring and lines");
}

function testHoldOncePerPiece(): void {
  const game = new TetrisGame(() => 0);
  const first = game.active!.type;
  assert(game.holdPiece(), "First hold should work");
  assert(game.hold === first && !game.canHold, "Hold should store the current piece and lock further holds");
  assert(!game.holdPiece(), "A second hold before locking must be blocked");
}

function testBlockedSpawn(): void {
  const game = new TetrisGame(() => 0);
  game.board = emptyBoard();
  game.active = { type: "O", rotation: 0, x: 3, y: BOARD_HEIGHT - 2 };
  game.board[1][4] = "Z";
  game.hardDrop();
  assert(game.gameOver, "A blocked spawn should top out the game");
}

function testPlacementBoundaries(): void {
  const board = emptyBoard();
  const outside: ActivePiece = { type: "L", rotation: 0, x: -1, y: 0 };
  assert(!canPlace(board, outside), "Pieces outside board bounds cannot be placed");
  assert(cellsFor({ type: "O", rotation: 3, x: 3, y: 0 }).length === 4, "Every rotation must keep four cells");
}

testSevenBag();
testSrsWallKick();
testHardDropAndClear();
testHoldOncePerPiece();
testBlockedSpawn();
testPlacementBoundaries();
console.log("All Tetris logic smoke tests passed.");
