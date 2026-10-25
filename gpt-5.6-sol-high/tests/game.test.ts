import { BOARD_HEIGHT, BOARD_WIDTH, cellsFor, createEmptyBoard, TetrisGame, type PieceType } from "../src/game.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function sequenceRandom(values: number[]): () => number {
  let index = 0;
  return () => values[index++ % values.length] ?? 0;
}

function testSevenBag(): void {
  const game = new TetrisGame(sequenceRandom([0.12, 0.75, 0.33, 0.9, 0.4, 0.01]));
  const pieces: PieceType[] = [game.active.type];
  for (let i = 0; i < 6; i += 1) {
    game.hardDrop();
    pieces.push(game.active.type);
  }
  assert(new Set(pieces).size === 7, "the first seven pieces should be a complete 7-bag");
}

function testMovementBoundaries(): void {
  const game = new TetrisGame(() => 0);
  for (let i = 0; i < 20; i += 1) game.move(-1);
  assert(cellsFor(game.active).every(({ x }) => x >= 0), "piece must stay inside the left wall");
  for (let i = 0; i < 30; i += 1) game.move(1);
  assert(cellsFor(game.active).every(({ x }) => x < BOARD_WIDTH), "piece must stay inside the right wall");
}

function testHardDropAndHold(): void {
  const game = new TetrisGame(() => 0.25);
  const first = game.active.type;
  const distance = game.hardDrop();
  assert(distance > 0, "hard drop should move the piece");
  assert(game.score === distance * 2, "hard drop should award two points per cell");
  const second = game.active.type;
  assert(game.hold(), "first hold should succeed");
  assert(game.held === second, "hold should store the active piece");
  assert(!game.hold(), "hold should only work once per active piece");
  game.hardDrop();
  assert(game.hold(), "hold should reset after locking");
  assert(game.active.type === second, "held piece should return on a later turn");
  assert(first !== undefined, "the initial piece exists");
}

function testLineClearAndScoring(): void {
  const game = new TetrisGame(() => 0);
  game.board = createEmptyBoard();
  const bottom = BOARD_HEIGHT - 1;
  for (let x = 0; x < BOARD_WIDTH; x += 1) game.board[bottom]![x] = x < 6 ? "J" : null;
  game.active = { type: "I", x: 6, y: bottom - 1, rotation: 0 };
  game.hardDrop();
  assert(game.lines === 1, "completing a row should clear one line");
  assert(game.score >= 100, "a single should award Guideline line-clear points");
}

function testRotationKick(): void {
  const game = new TetrisGame(() => 0.5);
  game.board = createEmptyBoard();
  game.active = { type: "T", x: -1, y: 8, rotation: 1 };
  assert(game.rotate(-1), "SRS should kick a rotation away from the wall");
  assert(cellsFor(game.active).every(({ x }) => x >= 0), "the kicked piece should be in bounds");
}

function testTopOut(): void {
  const game = new TetrisGame(() => 0);
  game.board = createEmptyBoard();
  const incoming = game.next[0]!;
  const spawnCell = cellsFor({ type: incoming, x: 3, y: 2, rotation: 0 })[0]!;
  game.board[spawnCell.y]![spawnCell.x] = "Z";
  game.active = { type: "O", x: 3, y: BOARD_HEIGHT - 3, rotation: 0 };
  game.hardDrop();
  assert(game.status === "over", "a blocked spawn should top out");
}

const tests = [
  ["7-bag randomizer", testSevenBag],
  ["movement boundaries", testMovementBoundaries],
  ["hard drop and hold", testHardDropAndHold],
  ["line clear scoring", testLineClearAndScoring],
  ["SRS wall kick", testRotationKick],
  ["top out", testTopOut],
] as const;

for (const [name, test] of tests) {
  test();
  console.log(`✓ ${name}`);
}

console.log(`${tests.length} logic smoke tests passed.`);
