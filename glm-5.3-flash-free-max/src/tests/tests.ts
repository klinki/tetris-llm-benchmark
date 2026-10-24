/**
 * Headless logic smoke tests.
 *
 * Pure game logic only (field, tetromino geometry, game state) — no DOM.
 * Built together with the game by `npm run build` and executed under Node:
 *
 *   npm test
 */

import { COLS, GRAVITY_MS_BY_LEVEL, ROWS, gravityMs } from "../constants.js";
import { Field } from "../field.js";
import { Game, detectTSpin } from "../game.js";
import { SevenBag } from "../randomizer.js";
import {
  PIECE_TYPES,
  attemptRotation,
  cellsOf,
  type ActivePiece,
  type PieceType,
} from "../tetromino.js";

// Node globals without @types/node (TypeScript is the only dev dependency).
declare const process: { exitCode?: number };

// ---------------------------------------------------------------------------
// Tiny harness
// ---------------------------------------------------------------------------

let passed = 0;
const failures: string[] = [];

function test(name: string, body: () => void): void {
  try {
    body();
    passed += 1;
    console.log(`  ok ${name}`);
  } catch (err) {
    failures.push(`${name}: ${String(err)}`);
    console.log(`  NOT OK ${name}`);
  }
}

function assert(condition: boolean, what: string): void {
  if (!condition) throw new Error(what);
}

function assertEquals(actual: unknown, expected: unknown, what: string): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${what}: got ${a}, want ${e}`);
}

function fill(g: Game, x: number, y: number, type: PieceType = "Z"): void {
  g.field.cells[y][x] = type;
}

function fillRange(g: Game, y: number, from: number, to: number): void {
  for (let x = from; x <= to; x++) fill(g, x, y);
}

// ---------------------------------------------------------------------------
// 7-bag randomizer
// ---------------------------------------------------------------------------

test("7-bag: every seven draws contain all seven pieces", () => {
  const bag = new SevenBag();
  const drawn: PieceType[] = [];
  for (let i = 0; i < 28; i++) drawn.push(bag.take());
  for (let i = 0; i < 28; i += 7) {
    assertEquals(new Set(drawn.slice(i, i + 7)).size, 7, `bag window at ${i}`);
  }
  assertEquals(drawn.length, 28, "draws");
});

test("7-bag: long run distributes uniformly", () => {
  const bag = new SevenBag();
  const counts = new Map<PieceType, number>(PIECE_TYPES.map((t) => [t, 0]));
  for (let i = 0; i < 140; i++) {
    const t = bag.take();
    counts.set(t, counts.get(t) as number + 1);
  }
  for (const type of PIECE_TYPES) assertEquals(counts.get(type), 20, `count ${type}`);
});

// ---------------------------------------------------------------------------
// Field
// ---------------------------------------------------------------------------

test("field: walls, floor and open space above the top", () => {
  const field = new Field();
  assert(!field.isOpen(-1, 5), "left wall is solid");
  assert(!field.isOpen(COLS, 5), "right wall is solid");
  assert(!field.isOpen(0, ROWS), "floor is solid");
  assert(field.isOpen(0, -1), "above the top edge is open");
  assert(field.isOpen(5, 5), "empty center is open");
});

test("field: clearLines removes only completed rows and shifts down", () => {
  const field = new Field();
  fillRowFull(field, ROWS - 1);
  fillRowRange(field, ROWS - 3, 0, COLS - 2); // one gap: not completed
  assertEquals(field.clearLines(), 1, "only the completed row");
  assertEquals(field.cells[ROWS - 2][0], "I", "row above the gap shifted down by one");
  assertEquals(field.cells[ROWS - 1][0], null, "the emptied slot was backfilled empty");
  assertEquals(field.cells[ROWS - 3][0], null, "old neighborhood above shifted cleanly");
});

function fillRowFull(field: Field, y: number): void {
  fillRowRange(field, y, 0, COLS - 1);
}

function fillRowRange(field: Field, y: number, from: number, to: number): void {
  for (let x = from; x <= to; x++) field.cells[y][x] = "I";
}

// ---------------------------------------------------------------------------
// Tetromino geometry / SRS
// ---------------------------------------------------------------------------

test("tetromino: T rotation states reproduce the SRS figures", () => {
  const sorted = (cells: ReadonlyArray<readonly [number, number]>) =>
    [...cells].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  assertEquals(sorted(cellsOf("T", 0)), [[0, 1], [1, 0], [1, 1], [2, 1]], "T spawn");
  assertEquals(sorted(cellsOf("T", 1)), [[1, 0], [1, 1], [1, 2], [2, 1]], "T cw");
  assertEquals(sorted(cellsOf("T", 2)), [[0, 1], [1, 1], [1, 2], [2, 1]], "T 180");
  assertEquals(sorted(cellsOf("T", 3)), [[0, 1], [1, 0], [1, 1], [1, 2]], "T ccw");
});

test("SRS: I-piece floor kick (0>1) uses the far table entry", () => {
  const field = new Field();
  const piece: ActivePiece = { type: "I", x: 0, y: 20, rot: 0 }; // flat on the floor
  const result = attemptRotation(field, piece, "cw");
  assert(result !== null, "rotation should succeed");
  assertEquals(result?.kickIndex, 4, "kick index");
  assertEquals(result?.piece, { type: "I", x: 1, y: 18, rot: 1 }, "kicked position");
});

test("SRS: T-piece floor kick (0>1) shifts up-left", () => {
  const field = new Field();
  const piece: ActivePiece = { type: "T", x: 3, y: 20, rot: 0 }; // resting on the floor
  const result = attemptRotation(field, piece, "cw");
  assert(result !== null, "rotation should succeed");
  assertEquals(result?.kickIndex, 2, "kick index");
  assertEquals(result?.piece, { type: "T", x: 2, y: 19, rot: 1 }, "kicked position");
});

test("SRS: rotation into a filled pocket fails", () => {
  const field = new Field();
  fillRowFull(field, ROWS - 1); // solid floor
  const piece: ActivePiece = { type: "T", x: 0, y: 20, rot: 0 };
  assertEquals(attemptRotation(field, piece, "cw"), null, "every kick test must fail");
});

// ---------------------------------------------------------------------------
// Gravity, dropping and locking
// ---------------------------------------------------------------------------

test("gravity: level 1 drops a row every 267ms; huge levels clamp to the table", () => {
  const game = new Game();
  game.update(300);
  assertEquals(game.piece?.y, 2, "one step after 300ms");
  assertEquals(gravityMs(1), GRAVITY_MS_BY_LEVEL[0], "level 1 gravity");
  assertEquals(gravityMs(GRAVITY_MS_BY_LEVEL.length + 5), 17, "clamped gravity");
});

test("hard drop: lands instantly, earns 2 points per cell and locks", () => {
  const game = new Game();
  game.piece = { type: "I", x: 0, y: 5, rot: 0 };
  assert(game.hardDrop(), "hardDrop succeeds");
  assertEquals(game.score, 30, "15 rows x 2 points");
  assertEquals(game.field.cells[ROWS - 1][0], "I", "I welded into the bottom row");
  assert(game.piece !== null && game.piece.type !== "I", "next piece already spawned");
});

test("ghost: shows the landing row", () => {
  const game = new Game();
  game.piece = { type: "I", x: 0, y: 5, rot: 0 };
  assertEquals(game.ghost()?.y, 20, "ghost rests on the floor");
});

test("soft drop: earns 1 point per cell at 20x gravity speed", () => {
  const game = new Game();
  game.softDrop = true;
  game.update(40); // interval is max(10, 267/20) ~ 13.35ms -> two steps
  assertEquals(game.score, 2, "two soft-dropped rows");
  assertEquals(game.piece?.y, 3, "piece moved two rows");
});

test("lock delay: 500ms of grounding locks the piece and spawns the next", () => {
  const game = new Game();
  game.piece = { type: "O", x: 0, y: 20, rot: 0 }; // grounded from the start
  const before = game.piece;
  game.update(300);
  assertEquals(game.piece, before, "not locked within the lock delay");
  game.update(300);
  assert(game.piece !== before, "locked after 600ms and replaced by a new piece");
});

test("move: blocked at the walls, free elsewhere", () => {
  const game = new Game();
  game.piece = { type: "I", x: 0, y: 5, rot: 0 };
  assert(!game.move(-1), "cannot move past the left wall");
  assert(game.move(1), "can move right");
  assertEquals(game.piece?.x, 1, "moved one cell");
});

// ---------------------------------------------------------------------------
// Hold
// ---------------------------------------------------------------------------

test("hold: swaps once per piece, re-allowed after the next lock", () => {
  const game = new Game();
  const first = game.piece as ActivePiece;
  assert(game.holdPiece(), "first hold works");
  assertEquals(game.hold, first.type, "hold slot stores the piece");
  assert(game.piece !== first, "new piece taken from the queue");
  const secondPiece = game.piece as ActivePiece;
  assert(!game.holdPiece(), "second hold is locked out while the piece is falling");
  assertEquals(game.piece, secondPiece, "piece unchanged by the blocked hold");
  game.hardDrop();
  assert(game.holdPiece(), "hold unlocked after the next lock");
  assertEquals(game.piece?.type, first.type, "the held piece came back");
});

// ---------------------------------------------------------------------------
// Top out and restart
// ---------------------------------------------------------------------------

test("top out: blocked spawn ends the game; restart resets everything", () => {
  const game = new Game();
  game.hardDrop(); // bury the first piece at the bottom
  for (let y = 0; y < 3; y++) fillRange(game, y, 0, COLS - 1);
  game.holdPiece(); // forces a spawn attempt into the filled top
  assertEquals(game.state, "over", "blocked spawn tops out");
  assertEquals(game.piece, null, "no active piece after top out");
  game.restart();
  assertEquals(game.state, "playing", "restart resets the state");
  assert(game.piece !== null, "a piece is falling again");
  assertEquals(game.score, 0, "score reset");
});

// ---------------------------------------------------------------------------
// Line clears, combo, levels
// ---------------------------------------------------------------------------

function dropO(game: Game): void {
  game.piece = { type: "O", x: 0, y: 5, rot: 0 };
  game.hardDrop();
}

test("scoring: double clear is 300 x level", () => {
  const game = new Game();
  fillRange(game, ROWS - 1, 2, 9);
  fillRange(game, ROWS - 2, 2, 9);
  dropO(game); // 15 rows x 2 drop points + 300
  assertEquals(game.score, 330, "score after the double");
  assertEquals(game.lines, 2, "lines");
  assertEquals(
    game.field.cells[ROWS - 1].every((c) => c === null),
    true,
    "bottom row empty again",
  );
});

test("combo: consecutive clears earn 50 x combo x level", () => {
  const game = new Game();
  fillRange(game, ROWS - 1, 2, 9);
  dropO(game); // single: 30 drop + 100 clear, combo counter 0
  assertEquals(game.score, 130, "after the first single");
  for (let x = 0; x <= 1; x++) game.field.cells[ROWS - 1][x] = null; // clear strays
  fillRange(game, ROWS - 1, 2, 9);
  dropO(game); // second consecutive single adds 30 + 100 + 50 combo bonus
  assertEquals(game.score, 310, "combo bonus applied");
  assertEquals(game.combo, 1, "combo counter");
});

test("level: rises every 10 lines", () => {
  const game = new Game();
  fillRange(game, ROWS - 1, 2, 9);
  fillRange(game, ROWS - 2, 2, 9);
  game.lines = 8;
  dropO(game);
  assertEquals(game.level, 2, "level after the 10th line");
  assertEquals(gravityMs(2), 217, "gravity speeds up at level 2");
});

// ---------------------------------------------------------------------------
// T-Spins
// ---------------------------------------------------------------------------

/** Corner geometry for a T resting with its tip left, sitting on a filled floor. */
function buildFullPocket(game: Game): ActivePiece {
  fill(game, 3, 18); // back-top corner
  fill(game, 3, 20); // front-bottom corner
  fill(game, 5, 20); // far-bottom corner (back-bottom for tip-left)
  fill(game, 3, 21); // floor
  fill(game, 4, 21); // floor under the piece
  return { type: "T", x: 3, y: 18, rot: 2 };
}

function buildMiniPocket(game: Game): ActivePiece {
  fill(game, 5, 18); // far-top corner
  fill(game, 5, 20); // far-bottom corner
  fill(game, 3, 20); // front-bottom corner only -> not both front corners
  fill(game, 4, 21); // floor under the piece
  return { type: "T", x: 3, y: 18, rot: 2 };
}

test("t-spin: full spin scored and announced", () => {
  const game = new Game();
  game.piece = buildFullPocket(game);
  assert(game.rotate("cw"), "rotation takes the (0,0) kick into the pocket");
  game.update(600); // grounded -> lock delay expires -> lock
  assertEquals(game.score, 400, "T-spin (0 lines) x level 1");
  assertEquals(game.message, "T-SPIN", "message");
  assertEquals(game.state, "playing", "no top out");
});

test("t-spin mini: 100 x level", () => {
  const game = new Game();
  game.piece = buildMiniPocket(game);
  assert(game.rotate("cw"), "rotation succeeds");
  game.update(600);
  assertEquals(game.score, 100, "mini t-spin award");
  assertEquals(game.message, "T-SPIN MINI", "message");
});

test("t-spin: the far SRS kick (test 5) upgrades a mini to a full spin", () => {
  const field = new Field();
  const piece: ActivePiece = { type: "T", x: 3, y: 18, rot: 3 };
  field.cells[18][5] = "Z";
  field.cells[20][3] = "Z";
  field.cells[20][5] = "Z";
  assertEquals(detectTSpin(field, piece, 0), "mini", "short kick -> mini");
  assertEquals(detectTSpin(field, piece, 4), "full", "far kick -> full");
});

test("t-spin: non-T pieces never spin", () => {
  const game = new Game();
  buildFullPocket(game);
  game.piece = { type: "L", x: 3, y: 18, rot: 2 };
  game.update(600);
  assertEquals(game.score, 0, "no t-spin award for L");
});

// ---------------------------------------------------------------------------

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length > 0) {
  for (const f of failures) console.error(`FAILED ${f}`);
  process.exitCode = 1;
}
