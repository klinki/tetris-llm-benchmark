// Headless smoke tests for the game logic. Run with `npm test`.
import { COLS, ROWS, Game } from "./game.js";
import { PIECE_TYPES, SHAPES, type PieceType } from "./pieces.js";

let passed = 0;
function test(name: string, fn: () => void): void {
  fn();
  passed++;
  console.log(`ok - ${name}`);
}
function eq<T>(actual: T, expected: T, what = "value"): void {
  if (actual !== expected) throw new Error(`${what}: expected ${expected}, got ${actual}`);
}

/** Deterministic RNG so tests are repeatable. */
function seeded(seed = 1): () => number {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

function gameWith(first: PieceType): Game {
  const game = new Game(seeded());
  game.queue.unshift(first);
  game.restart(); // restart rebuilds the queue, so force the first piece afterwards
  game.active = { type: first, rot: 0, x: 3, y: 1 };
  return game;
}

function fillRow(game: Game, y: number, gaps: number[] = []): void {
  for (let x = 0; x < COLS; x++) game.board[y * COLS + x] = gaps.includes(x) ? null : "J";
}

test("every piece has four cells in all rotations", () => {
  for (const type of PIECE_TYPES) for (const shape of SHAPES[type]) eq(shape.length, 4, type);
});

test("7-bag deals each piece once per seven", () => {
  const game = new Game(seeded(7));
  const dealt: PieceType[] = [];
  for (let i = 0; i < 14; i++) {
    dealt.push(game.active.type);
    game.hardDrop();
    game.board.fill(null); // keep the stack from topping out
  }
  eq(new Set(dealt.slice(0, 7)).size, 7, "first bag");
  eq(new Set(dealt.slice(7)).size, 7, "second bag");
});

test("moves stop at the walls", () => {
  const game = gameWith("T");
  while (game.moveLeft());
  eq(Math.min(...game.cellsOf(game.active).map(([x]) => x)), 0);
  while (game.moveRight());
  eq(Math.max(...game.cellsOf(game.active).map(([x]) => x)), COLS - 1);
});

test("hard drop lands on the floor and scores 2 per row", () => {
  const game = gameWith("O");
  const start = game.ghost().y - game.active.y;
  game.hardDrop();
  eq(game.board[(ROWS - 1) * COLS + 4], "O");
  eq(game.score, 2 * start, "score");
});

test("ghost matches where the piece lands", () => {
  const game = gameWith("L");
  const ghost = game.ghost();
  game.hardDrop();
  for (const [x, y] of game.cellsOf(ghost)) eq(game.board[y * COLS + x], "L");
});

test("clearing four lines with an I piece scores 800", () => {
  const game = gameWith("I");
  for (let y = ROWS - 4; y < ROWS; y++) fillRow(game, y, [0]);
  game.rotate(1); // vertical I
  while (game.moveLeft());
  game.hardDrop();
  eq(game.lines, 4, "lines");
  eq(game.board.every((c) => c === null), true, "board empty");
  eq(game.score >= 800, true, "score");
});

test("level goes up every ten lines and speeds up gravity", () => {
  const game = gameWith("O");
  const before = game.gravityInterval();
  game.lines = 9;
  fillRow(game, ROWS - 1, [4, 5]);
  game.hardDrop();
  eq(game.level, 2, "level");
  eq(game.gravityInterval() < before, true, "gravity");
});

test("rotation uses wall kicks next to the wall", () => {
  const game = gameWith("I");
  game.rotate(1);
  while (game.moveRight());
  eq(game.rotate(-1), true, "rotate back against wall");
  eq(game.cellsOf(game.active).every(([x]) => x >= 0 && x < COLS), true, "inside the field");
});

test("hold swaps once per piece", () => {
  const game = gameWith("T");
  game.hold();
  eq(game.held, "T");
  const current = game.active.type;
  game.hold();
  eq(game.active.type, current, "second hold ignored");
  game.hardDrop();
  game.hold();
  eq(game.active.type, "T", "hold released after lock");
});

test("lock delay locks a grounded piece after 500ms", () => {
  const game = gameWith("O");
  const locked = () => game.board.some((c) => c !== null);
  while (game.active.y < game.ghost().y) game.update(16); // fall to the floor
  game.update(400);
  eq(locked(), false, "inside lock delay");
  game.update(200);
  eq(locked(), true, "locked");
});

test("T-Spin double scores 1200", () => {
  const game = gameWith("T");
  fillRow(game, ROWS - 1, [1]);
  fillRow(game, ROWS - 2, [0, 1, 2]);
  game.board[(ROWS - 3) * COLS + 2] = "J"; // overhang: third corner of the T
  game.active = { type: "T", rot: 3, x: 0, y: ROWS - 3 };
  eq(game.rotate(-1), true, "rotate into the slot");
  game.hardDrop();
  eq(game.lines, 2, "lines");
  eq(game.score, 1200, "score");
});

test("top-out when the spawn area is blocked", () => {
  const game = gameWith("O");
  for (let y = 0; y < 4; y++) fillRow(game, y, [9]); // a gap keeps the rows from clearing
  game.hardDrop();
  eq(game.gameOver, true);
  game.restart();
  eq(game.gameOver, false, "restart");
  eq(game.score, 0, "score reset");
});

console.log(`\n${passed} tests passed`);
