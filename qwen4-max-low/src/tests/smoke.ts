// Headless logic smoke tests. Run with: npm test
// These import only the pure logic modules (no DOM), so they run under Node.
import { Bag, seededRng } from "../random.js";
import { Board } from "../board.js";
import { Game } from "../game.js";
import { PIECES, PIECE_TYPES, SPAWN, pieceCells } from "../pieces.js";
import { getKicks, rotateState } from "../srs.js";
import { scoreClear } from "../scoring.js";
import { COLS, ROWS } from "../constants.js";
import type { PieceType } from "../types.js";

// The tests run under Node; declare the one global we use without pulling in
// @types/node, keeping TypeScript as the only dev dependency.
declare const process: { exit(code?: number): void };

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void): void {
  try {
    fn();
    passed++;
    console.log(`  ok  ${name}`);
  } catch (err) {
    failed++;
    console.error(`FAIL  ${name}\n      ${(err as Error).message}`);
  }
}

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

function eq<T>(actual: T, expected: T, msg: string): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${msg}: expected ${e}, got ${a}`);
}

// --- randomizer ----------------------------------------------------------

test("7-bag deals all seven pieces before repeating", () => {
  const bag = new Bag(seededRng(1));
  const first: PieceType[] = [];
  for (let i = 0; i < 7; i++) first.push(bag.next());
  eq(new Set(first).size, 7, "first bag has 7 distinct pieces");
  const second: PieceType[] = [];
  for (let i = 0; i < 7; i++) second.push(bag.next());
  eq(new Set(second).size, 7, "second bag has 7 distinct pieces");
});

test("bag preview does not consume pieces", () => {
  const bag = new Bag(seededRng(5));
  const preview = bag.preview(5);
  eq(preview.length, 5, "preview length");
  eq(bag.next(), preview[0], "next matches first previewed");
});

// --- pieces --------------------------------------------------------------

test("every piece has four cells in each of four rotations", () => {
  for (const type of PIECE_TYPES) {
    eq(PIECES[type].length, 4, `${type} rotation count`);
    for (const state of PIECES[type]) eq(state.length, 4, `${type} cell count`);
  }
});

test("spawn positions are inside the board", () => {
  for (const type of PIECE_TYPES) {
    const cells = pieceCells(type, 0, SPAWN[type].x, SPAWN[type].y);
    for (const c of cells) {
      assert(c.x >= 0 && c.x < COLS, `${type} spawn x in bounds`);
      assert(c.y >= 0 && c.y < ROWS, `${type} spawn y in bounds`);
    }
  }
});

// --- SRS -----------------------------------------------------------------

test("rotation states cycle correctly", () => {
  eq(rotateState(0, 1), 1, "CW from spawn");
  eq(rotateState(3, 1), 0, "CW wraps");
  eq(rotateState(0, -1), 3, "CCW from spawn");
  eq(rotateState(1, -1), 0, "CCW to spawn");
});

test("kick tables provide five tests starting at (0,0)", () => {
  for (const type of PIECE_TYPES) {
    if (type === "O") continue;
    const kicks = getKicks(type, 0, 1);
    eq(kicks.length, 5, `${type} kick count`);
    eq(kicks[0], [0, 0], `${type} first kick is identity`);
  }
});

test("I piece wall-kicks off the floor (SRS 0->R last test)", () => {
  const g = new Game({ rng: seededRng(2) });
  g.current = { type: "I", rotation: 0, x: 0, y: 22 };
  const ok = g.rotate(1);
  assert(ok, "rotation should succeed via kick");
  eq(g.current!.rotation, 1, "rotated to R");
  eq(g.current!.x, 1, "kicked x");
  eq(g.current!.y, 20, "kicked y");
});

// --- board ---------------------------------------------------------------

test("board detects walls, floor and stacked blocks", () => {
  const b = new Board();
  assert(b.collides([{ x: -1, y: 5 }]), "left wall");
  assert(b.collides([{ x: COLS, y: 5 }]), "right wall");
  assert(b.collides([{ x: 5, y: ROWS }]), "floor");
  assert(!b.collides([{ x: 5, y: -1 }]), "above field is open");
  b.grid[10][5] = "T";
  assert(b.collides([{ x: 5, y: 10 }]), "occupied cell");
});

test("clearing a row drops the rows above it", () => {
  const b = new Board();
  b.grid[ROWS - 1].fill("J");
  b.grid[ROWS - 2][0] = "T";
  eq(b.fullRows(), [ROWS - 1], "one full row");
  b.clearRows([ROWS - 1]);
  assert(b.grid[ROWS - 1][0] === "T", "row above moved down");
  assert(b.grid[0].every((c) => c === null), "new top row empty");
});

// --- scoring -------------------------------------------------------------

test("guideline line-clear scores", () => {
  eq(scoreClear(1, "none", false, 1, false).points, 100, "single");
  eq(scoreClear(2, "none", false, 1, false).points, 300, "double");
  eq(scoreClear(3, "none", false, 1, false).points, 500, "triple");
  eq(scoreClear(4, "none", false, 1, false).points, 800, "tetris");
  eq(scoreClear(1, "none", false, 2, false).points, 200, "single level 2");
  eq(scoreClear(4, "none", true, 1, false).points, 1200, "back-to-back tetris");
});

test("T-Spin and perfect clear scores", () => {
  eq(scoreClear(2, "full", false, 1, false).points, 1200, "T-Spin double");
  eq(scoreClear(1, "mini", false, 1, false).points, 200, "mini T-Spin single");
  eq(scoreClear(0, "full", false, 1, false).points, 400, "T-Spin no lines");
  eq(scoreClear(1, "none", false, 1, true).points, 100 + 800, "single perfect clear");
});

// --- game integration ----------------------------------------------------

test("new game starts playing with a piece and zero score", () => {
  const g = new Game({ rng: seededRng(9) });
  eq(g.phase, "playing", "phase");
  assert(g.current !== null, "has current piece");
  eq(g.score, 0, "score");
  eq(g.level, 1, "level");
  eq(g.nextQueue.length, 5, "next queue size");
});

test("ghost piece lands on the floor of an empty board", () => {
  const g = new Game({ rng: seededRng(9) });
  g.current = { type: "I", rotation: 0, x: 3, y: 3 };
  eq(g.ghostY(), 22, "ghost y");
  eq(g.ghostCells().length, 4, "ghost cells");
});

test("hard drop scores 2 per cell and locks the piece", () => {
  const g = new Game({ rng: seededRng(9) });
  g.current = { type: "I", rotation: 0, x: 3, y: 3 };
  g.hardDrop();
  eq(g.score, (22 - 3) * 2, "hard drop points");
  assert(g.current!.y <= 4, "a new piece spawned at the top");
});

test("soft drop scores 1 per cell", () => {
  const g = new Game({ rng: seededRng(9) });
  g.current = { type: "I", rotation: 0, x: 3, y: 3 };
  g.update(0.06, true);
  eq(g.score, 1, "soft drop point");
  eq(g.current!.y, 4, "fell one row");
});

test("completing a row clears it and scores a single", () => {
  const g = new Game({ rng: seededRng(42) });
  for (let x = 4; x < COLS; x++) g.board.grid[ROWS - 1][x] = "J";
  // A stray block above so the clear is not a perfect clear.
  g.board.grid[ROWS - 2][0] = "T";
  g.current = { type: "I", rotation: 0, x: 0, y: 22 };
  g.hardDrop();
  eq(g.lines, 1, "one line cleared");
  eq(g.score, 100, "single score");
  assert(!g.board.isEmpty(), "stray block remains");
  eq(g.phase, "playing", "still playing");
});

test("lock delay holds a grounded piece, then locks it", () => {
  const g = new Game({ rng: seededRng(9) });
  g.current!.y = g.ghostY();
  const groundedY = g.current!.y;
  g.update(0.1, false);
  eq(g.current!.y, groundedY, "not locked before delay elapses");
  g.update(0.5, false);
  eq(g.current!.y, 3, "locked and respawned at top");
});

test("hold swaps once per drop", () => {
  const g = new Game({ rng: seededRng(11) });
  const first = g.current!.type;
  g.holdPiece();
  eq(g.hold, first, "held first piece");
  eq(g.canHold, false, "cannot hold again yet");
  const second = g.current!.type;
  g.holdPiece();
  eq(g.current!.type, second, "second hold ignored");
  g.hardDrop();
  const third = g.current!.type;
  eq(g.canHold, true, "hold refreshed after lock");
  g.holdPiece();
  eq(g.hold, third, "swapped third into hold");
  eq(g.current!.type, first, "first piece returned");
});

test("blocked spawn tops out", () => {
  const g = new Game({ rng: seededRng(7) });
  g.hardDrop();
  // Fill the spawn region but leave a column empty so no line clears.
  for (let y = 0; y <= 5; y++) {
    for (let x = 0; x < COLS - 1; x++) g.board.grid[y][x] = "J";
  }
  g.hardDrop();
  eq(g.phase, "gameover", "game over on blocked spawn");
});

test("stacking hard drops eventually tops out", () => {
  const g = new Game({ rng: seededRng(3) });
  let drops = 0;
  while (g.phase === "playing" && drops < 300) {
    g.hardDrop();
    drops++;
  }
  eq(g.phase, "gameover", "reached game over");
  assert(drops < 300, "topped out within a reasonable number of pieces");
  assert(g.score > 0, "scored some hard-drop points");
});

test("restart resets the game", () => {
  const g = new Game({ rng: seededRng(3) });
  g.hardDrop();
  g.hardDrop();
  g.restart();
  eq(g.score, 0, "score reset");
  eq(g.lines, 0, "lines reset");
  eq(g.phase, "playing", "phase reset");
  assert(g.board.isEmpty(), "board reset");
  eq(g.hold, null, "hold reset");
});

// --- summary -------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
