/** Headless smoke tests for the game logic. Run with `npm test`.
 *  No DOM, no test framework: plain assertions, non-zero exit on failure. */

import { COLS, ROWS, HIDDEN } from './constants.js';
import { PIECES, pieceId, type PieceType } from './pieces.js';
import { Bag } from './bag.js';
import { Game } from './game.js';

let passed = 0;
const failures: string[] = [];

function check(name: string, fn: () => void): void {
  try {
    fn();
    passed++;
    console.log(`  ok  ${name}`);
  } catch (err) {
    failures.push(name);
    console.error(`FAIL  ${name}: ${(err as Error).message}`);
  }
}

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

function eq<T>(actual: T, expected: T, msg: string): void {
  if (actual !== expected) throw new Error(`${msg}: expected ${expected}, got ${actual}`);
}

/** Deterministic PRNG so tests are reproducible. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function newGame(): Game {
  return new Game(mulberry32(42));
}

function fill(game: Game, x: number, y: number, type: PieceType = 'I'): void {
  game.board[y * COLS + x] = pieceId(type);
}

function fillRow(game: Game, y: number, except: number[] = []): void {
  for (let x = 0; x < COLS; x++) {
    if (!except.includes(x)) fill(game, x, y);
  }
}

function setCurrent(game: Game, type: PieceType, rot: number, x: number, y: number): void {
  game.current = { type, rot, x, y };
}

/** Hard-drop without distance points, to isolate line-clear scoring. */
function dropInPlace(game: Game): void {
  game.current!.y = game.ghostY();
  game.hardDrop();
}

// --- Randomizer ------------------------------------------------------------

check('7-bag: each bag is a permutation of all seven pieces', () => {
  const bag = new Bag(mulberry32(7));
  for (let b = 0; b < 100; b++) {
    const drawn = Array.from({ length: 7 }, () => bag.draw());
    eq(new Set(drawn).size, 7, `bag ${b} has duplicates`);
  }
});

check('7-bag: uniform distribution over many bags', () => {
  const bag = new Bag(mulberry32(1));
  const counts = new Map<PieceType, number>();
  for (let i = 0; i < 700; i++) {
    const t = bag.draw();
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  for (const t of PIECES) eq(counts.get(t), 100, `count of ${t}`);
});

// --- Spawn, gravity, ghost ---------------------------------------------------

check('spawn: piece starts in the hidden rows and queue shows 5 pieces', () => {
  const g = newGame();
  assert(g.current !== null, 'no active piece');
  assert(g.current!.y <= 1, 'spawn should be at the top');
  eq(g.queue.length, 5, 'next queue length');
  eq(g.over, false, 'fresh game is not over');
});

check('gravity: one row per interval at level 1 (1000 ms)', () => {
  const g = newGame();
  const y0 = g.current!.y;
  g.update(999, false);
  eq(g.current!.y, y0, 'should not drop before 1000 ms');
  g.update(1, false);
  eq(g.current!.y, y0 + 1, 'should drop one row at 1000 ms');
});

check('gravity speeds up with level', () => {
  const g = newGame();
  const g1 = g.gravityMs();
  g.level = 5;
  const g5 = g.gravityMs();
  g.level = 10;
  const g10 = g.gravityMs();
  assert(g1 > g5 && g5 > g10, 'gravity must decrease with level');
  eq(g1, 1000, 'level 1 gravity is 1 s/row');
});

check('ghost piece lands on the floor and hard drop scores 2 per cell', () => {
  const g = newGame();
  const p = g.current!;
  const gy = g.ghostY();
  assert(!g.collides(p.type, p.rot, p.x, gy), 'ghost position must fit');
  assert(g.collides(p.type, p.rot, p.x, gy + 1), 'ghost must rest on something');
  const dist = gy - p.y;
  g.hardDrop();
  eq(g.score, 2 * dist, 'hard drop points');
  assert(g.current !== null && g.current !== p, 'a new piece should spawn');
});

check('soft drop scores 1 per cell and falls faster', () => {
  const g = newGame();
  const y0 = g.current!.y;
  g.update(100, true); // soft drop interval = 1000/20 = 50 ms -> 2 rows
  eq(g.current!.y, y0 + 2, 'soft drop distance');
  eq(g.score, 2, 'soft drop points');
});

// --- Movement and SRS --------------------------------------------------------

check('movement is blocked by walls', () => {
  const g = newGame();
  setCurrent(g, 'O', 0, 0, 5);
  eq(g.move(-1), false, 'cannot move through the left wall');
  setCurrent(g, 'O', 0, COLS - 2, 5);
  eq(g.move(1), false, 'cannot move through the right wall');
});

check('SRS: I piece kicks off the left wall (R -> 2)', () => {
  const g = newGame();
  setCurrent(g, 'I', 1, -2, 5); // vertical I hugging the left wall
  eq(g.rotate(1), true, 'rotation should succeed via kick');
  eq(g.current!.rot, 2, 'rotation state');
  eq(g.current!.x, 0, 'kick offset (+2, 0) expected');
});

check('SRS: T piece kicks off the left wall (R -> 0)', () => {
  const g = newGame();
  setCurrent(g, 'T', 1, -1, 5);
  eq(g.rotate(-1), true, 'rotation should succeed via kick');
  eq(g.current!.rot, 0, 'rotation state');
  eq(g.current!.x, 0, 'kick offset (+1, 0) expected');
});

check('SRS: rotation fails when no kick fits', () => {
  const g = newGame();
  // Bury a T so that every kick target is blocked.
  for (let y = 4; y <= 8; y++) fillRow(g, y);
  setCurrent(g, 'T', 0, 4, 5);
  eq(g.rotate(1), false, 'fully surrounded piece cannot rotate');
});

// --- Line clears and scoring ---------------------------------------------------

check('single line clear: row removed, stack above shifts down, 100 points', () => {
  const g = newGame();
  fillRow(g, ROWS - 1, [0, 1]);
  setCurrent(g, 'O', 0, 0, 0);
  dropInPlace(g);
  eq(g.lines, 1, 'lines cleared');
  eq(g.score, 100, 'single score');
  assert(g.board[(ROWS - 1) * COLS] === pieceId('O'), 'row above should fall to the bottom');
  assert(g.board[(ROWS - 2) * COLS] === 0, 'old row position must be empty');
});

check('tetris scores 800 and back-to-back tetris scores 1200', () => {
  const g = newGame();
  for (let y = ROWS - 4; y < ROWS; y++) fillRow(g, y, [9]);
  fill(g, 0, 17); // leftover block so the clear is not a perfect clear
  setCurrent(g, 'I', 1, 7, 0); // vertical I in column 9
  dropInPlace(g);
  eq(g.lines, 4, 'four lines');
  eq(g.score, 800, 'tetris score');
  eq(g.b2b, true, 'back-to-back armed');
  for (let y = ROWS - 4; y < ROWS; y++) fillRow(g, y, [9]);
  fill(g, 0, 17);
  setCurrent(g, 'I', 1, 7, 0);
  dropInPlace(g);
  eq(g.score, 800 + 1200 + 50, 'back-to-back tetris is 1.5x, plus combo bonus');
});

check('T-spin double is detected and scores 1200', () => {
  const g = newGame();
  fill(g, 3, 18);                                  // overhang corner
  fillRow(g, 19, [3, 4, 5]);
  fillRow(g, 20, [4]);
  fill(g, 0, 21); fill(g, 1, 21); fill(g, 2, 21); fill(g, 4, 21);
  setCurrent(g, 'T', 1, 3, 18);                    // T facing right above the slot
  eq(g.rotate(1), true, 'rotate into the slot');
  eq(g.current!.rot, 2, 'T should face down');
  g.hardDrop();
  eq(g.lines, 2, 'two lines cleared');
  eq(g.score, 1200, 'T-spin double score');
  assert(g.message.includes('T-SPIN DOUBLE'), `message was "${g.message}"`);
});

check('perfect clear adds its bonus', () => {
  const g = newGame();
  fillRow(g, ROWS - 1, [6, 7, 8, 9]);
  setCurrent(g, 'I', 0, 6, 0);
  dropInPlace(g);
  assert(g.board.every((c) => c === 0), 'board must be empty');
  eq(g.score, 100 + 800, 'single + perfect clear bonus');
});

check('combo adds 50 x combo count on consecutive clears', () => {
  const g = newGame();
  fillRow(g, ROWS - 1, [0, 1]);
  setCurrent(g, 'O', 0, 0, 0);
  dropInPlace(g);
  eq(g.score, 100, 'first clear');
  fillRow(g, ROWS - 1, [0, 1]);
  setCurrent(g, 'O', 0, 0, 0);
  dropInPlace(g);
  eq(g.score, 100 + 100 + 50, 'second consecutive clear adds combo bonus');
});

check('level advances every 10 lines', () => {
  const g = newGame();
  g.lines = 9;
  fillRow(g, ROWS - 1, [0, 1]);
  setCurrent(g, 'O', 0, 0, 0);
  dropInPlace(g);
  eq(g.level, 2, 'level after 10 lines');
});

// --- Hold ---------------------------------------------------------------------

check('hold swaps once per piece and resets after lock', () => {
  const g = newGame();
  const first = g.current!.type;
  g.holdPiece();
  eq(g.hold, first, 'held piece');
  const afterHold = g.current!.type;
  g.holdPiece(); // must be ignored until the piece locks
  eq(g.current!.type, afterHold, 'second hold before lock is ignored');
  eq(g.hold, first, 'hold unchanged');
  g.hardDrop();
  g.holdPiece();
  eq(g.current!.type, first, 'after lock the held piece comes back');
});

// --- Lock delay -----------------------------------------------------------------

check('lock delay: grounded piece locks after 500 ms, movement resets it', () => {
  const g = newGame();
  const p = g.current!;
  p.y = g.ghostY();
  g.update(499, false);
  assert(g.current === p, 'piece must not lock before 500 ms');
  assert(g.move(1) || g.move(-1), 'a sideways move should be possible');
  g.update(499, false);
  assert(g.current === p, 'move should reset the lock delay');
  g.update(2, false);
  assert(g.current !== p, 'piece should lock after the delay expires');
});

check('lock delay resets are capped at 15 (guideline move reset)', () => {
  const g = newGame();
  setCurrent(g, 'I', 0, 3, ROWS - 2); // horizontal I resting on the floor
  const p = g.current!;
  for (let i = 0; i < 30; i++) g.move(i % 2 === 0 ? -1 : 1);
  g.update(501, false);
  assert(g.current !== p, 'after 15 resets the piece must lock regardless of moves');
});

// --- Top-out ----------------------------------------------------------------------

check('block out: spawn into a filled field ends the game', () => {
  const g = newGame();
  fillRow(g, 0, [0]); // leave a gap so these rows are not cleared as full lines
  fillRow(g, 1, [0]);
  g.hardDrop(); // locks the current piece, next spawn is blocked
  eq(g.over, true, 'game should be over');
});

check('lock out: piece locking entirely above the visible field ends the game', () => {
  const g = newGame();
  for (let y = HIDDEN; y < ROWS; y++) fillRow(g, y);
  setCurrent(g, 'O', 0, 4, 0); // O sits fully in the hidden rows
  g.hardDrop();
  eq(g.over, true, 'lock out should end the game');
});

check('restart resets the whole state', () => {
  const g = newGame();
  g.score = 999;
  g.lines = 25;
  g.level = 3;
  g.over = true;
  g.restart();
  eq(g.score, 0, 'score');
  eq(g.lines, 0, 'lines');
  eq(g.level, 1, 'level');
  eq(g.over, false, 'over flag');
  assert(g.board.every((c) => c === 0), 'board');
  assert(g.current !== null, 'new piece');
});

// --- Summary ------------------------------------------------------------------------

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length > 0) {
  throw new Error(`${failures.length} smoke test(s) failed: ${failures.join(', ')}`);
}