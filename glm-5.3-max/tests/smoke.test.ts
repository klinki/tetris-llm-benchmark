/**
 * Headless smoke tests for the game logic - no browser required.
 * Run with `npm test`.
 */
import { Board, HEIGHT, WIDTH } from "../src/core/board.js";
import { Game, LOCK_DELAY_MS, MAX_LOCK_RESETS, type ActivePiece } from "../src/core/game.js";
import { SevenBag } from "../src/core/randomizer.js";
import { gravitySeconds } from "../src/core/rules.js";
import { PIECES, type Cell, type PieceType } from "../src/core/tetromino.js";

type TestCase = { name: string; body: () => void };
const tests: TestCase[] = [];

function test(name: string, body: () => void): void {
  tests.push({ name, body });
}

function assert(condition: boolean, message = "assertion failed"): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEquals(actual: unknown, expected: unknown, message = ""): void {
  if (actual !== expected) {
    throw new Error(
      `${message}${message ? ": " : ""}expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
    );
  }
}

function assertClose(actual: number, expected: number, tolerance: number, message = ""): void {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${message}${message ? ": " : ""}expected ~${expected}, got ${actual}`);
  }
}

function key(cells: readonly Cell[]): string {
  return cells.map(([x, y]) => `${x},${y}`).sort().join(" ");
}

function fillRow(game: Game, y: number, cols: number[]): void {
  for (const x of cols) game.board.grid[y][x] = "J";
}

function allCols(): number[] {
  return Array.from({ length: WIDTH }, (_, i) => i);
}

function colsExcept(...excluded: number[]): number[] {
  return allCols().filter((x) => !excluded.includes(x));
}

/** Places a piece directly (bypassing the random queue) and hard drops it. */
function drop(game: Game, type: PieceType, place: (piece: ActivePiece) => void): void {
  const piece: ActivePiece = { type, rotation: 0, x: PIECES[type].spawnX, y: 0 };
  game.active = piece;
  place(piece);
  game.hardDrop();
}

/** Drops a vertical I piece into the given column. */
function dropVerticalI(game: Game, col: number): void {
  drop(game, "I", (piece) => {
    piece.rotation = 1;
    piece.x = col - 2;
    piece.y = 1;
  });
}

// ---------------------------------------------------------------- shapes ----

test("the 7-bag randomizer deals each piece exactly once per bag", () => {
  const bag = new SevenBag();
  const firstBag = Array.from({ length: 7 }, () => bag.next());
  assertEquals(new Set(firstBag).size, 7, "a bag holds seven distinct pieces");

  const counts = new Map<PieceType, number>();
  for (let i = 0; i < 70; i++) {
    const piece = bag.next();
    counts.set(piece, (counts.get(piece) ?? 0) + 1);
  }
  for (const type of Object.keys(PIECES) as PieceType[]) {
    assertEquals(counts.get(type), 10, `${type} appears exactly once per bag`);
  }
});

test("pieces spawn in the guideline columns", () => {
  assertEquals(PIECES.I.spawnX, 3, "I spawns centrally (columns 3-6)");
  assertEquals(PIECES.O.spawnX, 4, "O spawns centrally (columns 4-5)");
  for (const type of ["J", "L", "S", "T", "Z"] as const) {
    assertEquals(PIECES[type].spawnX, 3, `${type} spawns rounded to the left`);
  }
});

test("SRS rotation states match the guideline diagrams", () => {
  const expected: Partial<Record<PieceType, Cell[][]>> = {
    T: [
      [[1, 0], [0, 1], [1, 1], [2, 1]], // pointing up
      [[1, 0], [1, 1], [1, 2], [2, 1]], // pointing right
      [[0, 1], [1, 1], [2, 1], [1, 2]], // pointing down
      [[0, 1], [1, 0], [1, 1], [1, 2]], // pointing left
    ],
    I: [
      [[0, 1], [1, 1], [2, 1], [3, 1]],
      [[2, 0], [2, 1], [2, 2], [2, 3]],
      [[0, 2], [1, 2], [2, 2], [3, 2]],
      [[1, 0], [1, 1], [1, 2], [1, 3]],
    ],
    J: [
      [[0, 0], [0, 1], [1, 1], [2, 1]],
      [[1, 0], [1, 1], [1, 2], [2, 0]],
    ],
    L: [
      [[2, 0], [0, 1], [1, 1], [2, 1]],
      [[1, 0], [1, 1], [1, 2], [2, 2]],
    ],
    S: [
      [[1, 0], [2, 0], [0, 1], [1, 1]],
      [[1, 0], [1, 1], [2, 1], [2, 2]],
    ],
    Z: [
      [[0, 0], [1, 0], [1, 1], [2, 1]],
      [[2, 0], [2, 1], [1, 1], [1, 2]],
    ],
    O: [[[0, 0], [1, 0], [0, 1], [1, 1]]],
  };
  for (const [type, states] of Object.entries(expected) as [PieceType, Cell[][]][]) {
    for (let r = 0; r < states.length; r++) {
      assertEquals(key(PIECES[type].states[r]), key(states[r]), `${type} state ${r}`);
    }
  }
});

// ----------------------------------------------------------------- board ----

test("walls and floor are solid; the space above the field is open", () => {
  const board = new Board();
  assert(board.isBlocked(-1, 5) && board.isBlocked(WIDTH, 5), "side walls");
  assert(board.isBlocked(5, HEIGHT), "floor");
  assert(!board.isBlocked(5, -3), "above the field");
  board.grid[5][5] = "T";
  assert(board.isBlocked(5, 5) && !board.isBlocked(4, 5), "stack cells");
});

test("clearLines drops the rows above and reports the count", () => {
  const board = new Board();
  board.grid[21].fill("J");
  board.grid[20].fill("J");
  board.grid[20][9] = null;
  board.grid[19][0] = "O";
  assertEquals(board.clearLines(), 1);
  assertEquals(board.grid[21][9], null, "the cleared row is gone");
  assertEquals(board.grid[21][0], "J", "the row above dropped into place");
  assertEquals(board.grid[20][0], "O", "and the one above that");
  assertEquals(board.grid[19][0], null, "nothing left above");
});

// --------------------------------------------------------------- gravity ----

test("gravity follows the guideline curve", () => {
  assertEquals(gravitySeconds(1), 1, "level 1 takes one second per row");
  assertClose(gravitySeconds(2), 0.793, 1e-6, "level 2");
  assertClose(gravitySeconds(9), 0.0938, 0.0001, "level 9");
  assertClose(gravitySeconds(15), 0.00706, 0.0001, "level 15");
  assertClose(gravitySeconds(20), 0.000455, 0.00001, "level 20 is the fastest");
  assertEquals(gravitySeconds(99), gravitySeconds(20), "the curve is capped at level 20");
});

test("pieces spawn hidden and drop one row right away", () => {
  const game = new Game();
  const piece = game.active;
  assert(piece !== null, "a piece is active after start");
  assertEquals(piece.rotation, 0, "pieces spawn in their spawn state");
  assertEquals(piece.x, PIECES[piece.type].spawnX);
  assertEquals(piece.y, 1, "spawned pieces drop one row when unobstructed");
  assert(game.queue.length >= 5, "the next queue is filled");
});

test("gravity falls one row per second on level 1", () => {
  const game = new Game();
  const start = game.active!.y;
  game.update(999);
  assertEquals(game.active!.y, start, "just under a second is not a full row");
  game.update(2);
  assertEquals(game.active!.y, start + 1, "a full second drops one row");
});

test("the ghost position matches a straight drop", () => {
  const game = new Game();
  assertEquals(game.ghostY(), 20, "an empty board lands every spawn shape at row 20");
});

test("pieces move sideways until they hit a wall", () => {
  const game = new Game();
  const piece = game.active!;
  for (let i = 0; i < 30; i++) game.move(-1);
  assert(!game.move(-1), "cannot move further left");
  for (const [cx] of PIECES[piece.type].states[piece.rotation]) {
    assert(piece.x + cx >= 0, "stays inside the left wall");
  }
  const leftEdge = piece.x;
  for (let i = 0; i < 30; i++) game.move(1);
  assert(!game.move(1), "cannot move further right");
  for (const [cx] of PIECES[piece.type].states[piece.rotation]) {
    assert(piece.x + cx < WIDTH, "stays inside the right wall");
  }
  assert(leftEdge < piece.x, "the piece actually moved");
});

// ------------------------------------------------------------ drop & lock ----

test("soft drop steps immediately and scores one point per row", () => {
  const game = new Game();
  const lockVersionAtStart = game.lockVersion;
  const start = game.active!.y;
  game.softDropStep();
  assertEquals(game.active!.y, start + 1, "the press drops one row at once");
  assertEquals(game.score, 1, "one point per soft dropped row");

  game.update(1000, true); // 20x gravity: enough to reach the floor
  const fallen = game.active!.y - (start + 1);
  assertEquals(game.score, 1 + fallen, "one point per soft dropped row");

  game.update(LOCK_DELAY_MS); // grounded: soft drop does not skip lock delay
  assertEquals(game.lockVersion - lockVersionAtStart, 1, "the piece locked after the delay");
});

test("hard drop scores two points per row and locks instantly", () => {
  const game = new Game();
  const lockVersionAtStart = game.lockVersion;
  const type = game.active!.type;
  const startY = game.active!.y;
  game.hardDrop();
  assertEquals(game.score, 2 * (20 - startY), "two points per row dropped");
  assertEquals(game.lockVersion - lockVersionAtStart, 1, "locked without waiting");
  assert(game.board.grid[21].includes(type), "the piece rests on the floor");
  assert(game.active !== null && game.active.rotation === 0, "the next piece spawns");
  assert(game.canHold, "hold is available again after a lock");
});

test("grounded pieces lock after 500 ms unless moved (up to 15 refreshes)", () => {
  const game = new Game();
  const lockVersionAtStart = game.lockVersion;
  game.update(5000, true); // slam the piece onto the floor with soft drop
  const type = game.active!.type;
  assertEquals(game.lockVersion, lockVersionAtStart, "a single update can ground but not lock");

  game.update(LOCK_DELAY_MS - 1);
  assert(game.active !== null, "not locked before the delay elapses");

  for (let i = 0; i < MAX_LOCK_RESETS; i++) {
    assert(game.move(i % 2 === 0 ? 1 : -1), "the piece can still wiggle on the floor");
    game.update(LOCK_DELAY_MS - 50); // would lock without the refresh
    assert(game.active !== null, `refresh ${i + 1} keeps the piece alive`);
  }
  // The refresh budget is spent and the timer stands at 450 ms.
  assert(game.move(-1), "moving still works, but no longer refreshes the timer");
  game.update(60); // 450 + 60 >= 500
  assertEquals(game.lockVersion - lockVersionAtStart, 1, "locks once the refresh budget is used up");
  assert(game.board.grid.some((row) => row.includes(type)), "the piece was locked");
});

// --------------------------------------------------------------- scoring ----

test("line clears follow the guideline scoring table", () => {
  const game = new Game();

  // Single: 100 x level.
  fillRow(game, 21, colsExcept(0));
  dropVerticalI(game, 0);
  assertEquals(game.lines, 1);
  assertEquals(game.lastLock!.points, 100, "single at level 1");
  assertEquals(game.score, 100 + 34, "single + hard drop points");

  // Tetris: 800 x level, no back-to-back yet, first combo.
  for (const y of [18, 19, 20, 21]) fillRow(game, y, colsExcept(9));
  dropVerticalI(game, 9);
  assertEquals(game.lines, 5);
  assertEquals(game.lastLock!.points, 800 + 50, "tetris + combo 1");
  assertEquals(game.lastLock!.backToBack, false, "the first tetris starts the chain");

  // Back-to-back tetris: 800 x 1.5 + combo 2.
  for (const y of [18, 19, 20, 21]) fillRow(game, y, colsExcept(9));
  dropVerticalI(game, 9);
  assertEquals(game.lines, 9);
  assertEquals(game.lastLock!.points, 1200 + 100, "b2b tetris + combo 2");
  assertEquals(game.lastLock!.backToBack, true, "the second tetris is back-to-back");

  // A plain single breaks the chain; 10 lines raise the level.
  fillRow(game, 21, colsExcept(9));
  dropVerticalI(game, 9);
  assertEquals(game.lines, 10);
  assertEquals(game.level, 2, "one level every ten lines");
  assertEquals(game.lastLock!.points, 100 + 150, "single at the previous level + combo 3");
  assertEquals(game.lastLock!.backToBack, false, "a single breaks the chain");

  assertEquals(game.score, 134 + 884 + 1334 + 284, "running total");
});

test("clearing the whole field is reported as a perfect clear", () => {
  const game = new Game();
  fillRow(game, 21, [0, 1, 2, 3, 4, 5]);
  drop(game, "I", (piece) => {
    piece.rotation = 0;
    piece.x = 6;
    piece.y = 20; // horizontal on the floor, filling columns 6-9
  });
  assertEquals(game.lines, 1);
  assertEquals(game.lastLock!.perfectClear, true);
  assert(game.board.isEmpty(), "nothing is left on the field");
});

// --------------------------------------------------------------- T-spins ----

test("a twisted T registers as a full T-spin double", () => {
  const game = new Game();
  // Classic TSD slot: rows 20/21 full except the T's cells, an overhang
  // corner above the nub and a block ruling out the near kicks.
  fillRow(game, 20, colsExcept(5, 6)); // the T will fill (5,20) and (6,20)
  fillRow(game, 21, colsExcept(5)); // the T will fill (5,21)
  game.board.grid[19][6] = "J"; // overhang: front corner, blocks basic rotation
  game.board.grid[17][5] = "J"; // blocks the (-1,0) and (-1,-1) kicks

  const piece: ActivePiece = { type: "T", rotation: 0, x: 5, y: 17 };
  game.active = piece;
  assert(game.rotate(1), "the T twists into the slot");
  assertEquals(piece.rotation, 1);
  assertEquals(piece.x, 4, "kicked left");
  assertEquals(piece.y, 19, "kicked down two rows");
  assertEquals(key(game.cellsOf(piece)), key([[5, 19], [5, 20], [5, 21], [6, 20]]));

  game.hardDrop(); // distance 0, so the rotation stays the last action
  assertEquals(game.lastLock!.tspin, "full");
  assertEquals(game.lastLock!.lines, 2, "both slot rows clear");
  assertEquals(game.lastLock!.points, 1200, "T-spin double at level 1");
  assertEquals(game.lastLock!.backToBack, false, "the chain only starts here");
});

test("a T-spin without line clears scores 400 x level", () => {
  const game = new Game();
  game.board.grid[19][6] = "J"; // overhang + kick blocker, as above
  game.board.grid[17][5] = "J";
  game.board.grid[21][4] = "J"; // back corners make it three occupied corners
  game.board.grid[21][6] = "J";

  const piece: ActivePiece = { type: "T", rotation: 0, x: 5, y: 17 };
  game.active = piece;
  assert(game.rotate(1));
  game.hardDrop();
  assertEquals(game.lastLock!.tspin, "full");
  assertEquals(game.lastLock!.lines, 0);
  assertEquals(game.lastLock!.points, 400, "T-spin without lines at level 1");
  assertEquals(game.board.grid[19][5], "T", "the T is parked in the slot");
});

test("a T-spin with only one front corner is a mini", () => {
  const game = new Game();
  fillRow(game, 20, colsExcept(4, 5, 6)); // the T will fill its whole bottom bar
  game.board.grid[19][4] = "J"; // one top corner (front for a pointing-up T)
  game.board.grid[21][4] = "J"; // two bottom corners (back)
  game.board.grid[21][6] = "J";

  const piece: ActivePiece = { type: "T", rotation: 1, x: 4, y: 19 }; // nub right
  game.active = piece;
  assert(game.rotate(-1), "rotates back to the spawn orientation without a kick");
  game.hardDrop();
  assertEquals(game.lastLock!.tspin, "mini");
  assertEquals(game.lastLock!.lines, 1);
  assertEquals(game.lastLock!.points, 200, "mini T-spin single at level 1");
});

// ------------------------------------------------------------- wall kicks ----

test("SRS wall kicks: a floor-bound I rotates via the (+1,-2) kick", () => {
  const game = new Game();
  const piece: ActivePiece = { type: "I", rotation: 0, x: 3, y: 20 }; // lying on the floor
  game.active = piece;
  assert(game.rotate(1), "rotation succeeds with a kick");
  assertEquals(piece.x, 4);
  assertEquals(piece.y, 18);
  assertEquals(key(game.cellsOf(piece)), key([[6, 18], [6, 19], [6, 20], [6, 21]]));
});

test("SRS wall kicks: a floor-bound T rotates via the (-1,-1) kick", () => {
  const game = new Game();
  const piece: ActivePiece = { type: "T", rotation: 0, x: 3, y: 20 }; // resting on the floor
  game.active = piece;
  assert(game.rotate(1));
  assertEquals(key(game.cellsOf(piece)), key([[3, 19], [3, 20], [3, 21], [4, 20]]));
});

// ------------------------------------------------------------------ hold ----

test("hold swaps pieces and is usable once per piece", () => {
  const game = new Game();
  const first = game.active!.type;
  const second = game.queue[0];

  game.holdPiece();
  assertEquals(game.hold, first, "the first piece is stored");
  assertEquals(game.active!.type, second, "the next piece comes out");

  game.holdPiece(); // rejected: hold was already used for this piece
  assertEquals(game.hold, first, "hold unchanged");
  assertEquals(game.active!.type, second, "piece unchanged");

  game.hardDrop(); // locking restores hold
  assert(game.canHold, "hold is available again");
  const third = game.active!.type;
  game.holdPiece();
  assertEquals(game.hold, third);
  assertEquals(game.active!.type, first, "the held piece comes back");
  assertEquals(game.active!.rotation, 0, "it returns in its spawn state");
  assertEquals(game.active!.x, PIECES[first].spawnX, "at the spawn column");
});

// --------------------------------------------------------------- top out ----

test("a piece locking fully above the visible field ends the game (lock out)", () => {
  const game = new Game();
  fillRow(game, 2, allCols()); // the stack reaches the spawn area
  const piece: ActivePiece = { type: "J", rotation: 0, x: 3, y: 0 };
  game.active = piece;
  game.update(LOCK_DELAY_MS + 1);
  assert(game.gameOver, "lock out");
  assertEquals(game.active, null, "no piece is in play afterwards");
});

test("a blocked spawn ends the game (block out)", () => {
  const game = new Game();
  fillRow(game, 0, colsExcept(9));
  fillRow(game, 1, colsExcept(8, 9));
  game.hardDrop(); // the current piece locks low; the next spawn is blocked
  assert(game.gameOver, "block out");
  assertEquals(game.active, null, "no piece is in play afterwards");
});

test("the queue stays deep enough for the next preview", () => {
  const game = new Game();
  for (let i = 0; i < 100 && !game.gameOver; i++) {
    assert(game.queue.length >= 5, "five upcoming pieces are always available");
    game.hardDrop();
  }
  assert(game.queue.length >= 5);
});

// ------------------------------------------------------------------ run! ----

let failed = 0;
for (const { name, body } of tests) {
  try {
    body();
    console.log(`ok   ${name}`);
  } catch (error) {
    failed++;
    console.error(`FAIL ${name}\n     ${(error as Error).message}`);
  }
}

console.log(`\n${tests.length - failed}/${tests.length} tests passed`);
if (failed > 0) {
  throw new Error(`${failed} test(s) failed`);
}
