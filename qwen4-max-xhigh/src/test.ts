// Headless logic smoke tests (npm test). No DOM required.

import { COLS, HIDDEN_ROWS, ROWS } from './constants.js';
import { Game } from './game.js';
import { Bag } from './random.js';
import { PIECE_TYPES, ROTATIONS, type PieceType } from './pieces.js';

declare const process: { exitCode: number };

let passed = 0;
const failures: string[] = [];

function check(name: string, cond: boolean): void {
  if (cond) {
    passed++;
    console.log(`  ok   ${name}`);
  } else {
    failures.push(name);
    console.error(`  FAIL ${name}`);
  }
}

function eq(name: string, actual: unknown, expected: unknown): void {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  check(ok ? name : `${name} — got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`, ok);
}

// Deterministic RNG so tests are reproducible.
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const newGame = (seed = 1): Game => new Game(lcg(seed));

function pieceCells(g: Game): [number, number][] {
  const p = g.current;
  return ROTATIONS[p.type][p.rot].map(([x, y]) => [p.x + x, p.y + y]);
}

console.log('7-bag randomizer');
{
  const bag = new Bag(lcg(42));
  const counts: Record<string, number> = {};
  let everyBagComplete = true;
  for (let b = 0; b < 100; b++) {
    const seen = new Set<PieceType>();
    for (let i = 0; i < 7; i++) {
      const t = bag.next();
      seen.add(t);
      counts[t] = (counts[t] ?? 0) + 1;
    }
    if (seen.size !== 7) everyBagComplete = false;
  }
  check('every bag contains all 7 pieces exactly once', everyBagComplete);
  check('piece distribution is uniform', PIECE_TYPES.every((t) => counts[t] === 100));
}

console.log('spawn and next queue');
{
  const g = newGame();
  check('piece spawns fully above the visible field', pieceCells(g).every(([, y]) => y < HIDDEN_ROWS));
  check('next queue shows at least 5 pieces', g.queue.length >= 5);
  check('spawn is horizontally centered', g.current.x >= 3 && g.current.x <= 4);
}

console.log('gravity and lock delay');
{
  const g = newGame();
  const y0 = g.current.y;
  g.update(1000, false);
  eq('level 1 gravity falls one row per second', g.current.y, y0 + 1);
  g.update(25000, false);
  check('piece reaches the floor and locks', g.board[ROWS - 1].some((c) => c !== null));
  eq('game keeps running after a lock', g.state, 'playing');
}
{
  const g = newGame();
  g.current = { type: 'I', rot: 0, x: 3, y: 20 }; // resting on the floor
  g.update(499, false);
  check('piece survives just before the 500ms lock delay', g.current.type === 'I' && g.current.y === 20);
  g.update(1, false);
  check('piece locks once the delay expires', g.board[ROWS - 1].some((c) => c === 'I'));
}

console.log('soft drop and hard drop');
{
  const g = newGame();
  g.update(1000, true); // 20x gravity at level 1 => 20 rows, 1 point each
  eq('soft drop scores 1 point per cell', g.score, 20);
  check('soft drop reaches the floor', g.grounded());
}
{
  const g = newGame();
  const type = g.current.type;
  const bottom = Math.max(...pieceCells(g).map(([, y]) => y));
  const dist = ROWS - 1 - bottom;
  g.hardDrop();
  eq('hard drop scores 2 points per cell', g.score, 2 * dist);
  check('hard drop locks immediately', g.board[ROWS - 1].some((c) => c === type));
}

console.log('line clears and Guideline scoring');
{
  const g = newGame();
  for (let x = 1; x < COLS; x++) {
    g.board[20][x] = 'J';
    g.board[21][x] = 'J';
  }
  g.current = { type: 'I', rot: 1, x: -2, y: 18 }; // vertical I into column 0
  g.hardDrop();
  eq('double scores 300 x level', g.score, 300);
  eq('double counts 2 lines', g.lines, 2);
  eq('clearing state during the flash', g.state, 'clearing');
  g.update(200, false);
  eq('rows collapse after the animation', g.state, 'playing');
  check('stack above shifted down', g.board[21][0] === 'I' && g.board[20][0] === 'I');
  check('cleared rows are gone', g.board[19].every((c) => c === null));
}
{
  const g = newGame();
  g.board[10][0] = 'J'; // stray cell prevents perfect clears
  const tetris = () => {
    for (let y = 18; y < ROWS; y++) for (let x = 1; x < COLS; x++) g.board[y][x] = 'J';
    g.current = { type: 'I', rot: 1, x: -2, y: 18 };
    g.hardDrop();
    g.update(200, false);
  };
  tetris();
  eq('tetris scores 800 x level', g.score, 800);
  check('tetris arms back-to-back', g.b2b);
  tetris();
  eq('b2b tetris scores 1200 plus 50 combo bonus', g.score, 800 + 1200 + 50);
}
{
  const g = newGame();
  const tetris = () => {
    for (let y = 18; y < ROWS; y++) for (let x = 1; x < COLS; x++) g.board[y][x] = 'J';
    g.current = { type: 'I', rot: 1, x: -2, y: 18 };
    g.hardDrop();
    g.update(200, false);
  };
  tetris();
  eq('tetris perfect clear adds 2000 x level', g.score, 800 + 2000);
  tetris();
  eq('b2b tetris perfect clear adds 3200 x level', g.score, 2800 + 1200 + 50 + 3200);
}
{
  const g = newGame();
  g.lines = 9;
  g.board[10][0] = 'J'; // stray cell so this is not a perfect clear
  for (let x = 0; x < 6; x++) g.board[21][x] = 'J';
  g.current = { type: 'I', rot: 0, x: 6, y: 20 };
  g.hardDrop();
  eq('single scores 100', g.score, 100);
  eq('level advances every 10 lines', g.level, 2);
  eq('line total accumulates', g.lines, 10);
}
{
  const g = newGame();
  for (let x = 0; x < 6; x++) g.board[21][x] = 'J';
  g.current = { type: 'I', rot: 0, x: 6, y: 20 };
  g.hardDrop();
  eq('perfect clear single scores 100 + 800', g.score, 900);
  check('perfect clear is announced', g.message.includes('PERFECT CLEAR'));
}

console.log('T-spins');
{
  const g = newGame();
  // T-spin double slot: overhangs at (3,19) and (5,19), notch at (4,21).
  for (let x = 0; x < COLS; x++) {
    if (x < 3 || x > 5) g.board[20][x] = 'J';
    if (x !== 4) g.board[21][x] = 'J';
  }
  g.board[19][3] = 'J';
  g.board[19][5] = 'J';
  g.current = { type: 'T', rot: 1, x: 3, y: 19 };
  check('T-spin setup position is legal', !g.collides(g.current));
  check('T rotates into the slot', g.rotate(1));
  g.update(600, false); // let lock delay expire
  eq('T-spin double scores 1200 x level', g.score, 1200);
  eq('T-spin double clears 2 lines', g.lines, 2);
  check('T-spin is announced', g.message.includes('T-SPIN'));
  check('T-spin arms back-to-back', g.b2b);
}
{
  const g = newGame();
  g.current = { type: 'T', rot: 0, x: 4, y: 10 };
  g.hardDrop(); // last action is a drop, not a rotation
  check('no T-spin without a final rotation', !g.message.includes('T-SPIN'));
}

console.log('SRS rotation and wall kicks');
{
  const g = newGame();
  g.current = { type: 'T', rot: 0, x: 4, y: 10 };
  check('clockwise rotation', g.rotate(1) && g.current.rot === 1);
  check('counter-clockwise rotation', g.rotate(-1) && g.current.rot === 0);
  g.current = { type: 'O', rot: 0, x: 4, y: 10 };
  check('O does not rotate', !g.rotate(1) && g.current.rot === 0);
}
{
  const g = newGame();
  g.current = { type: 'I', rot: 1, x: -2, y: 10 }; // vertical I hugging the left wall
  check('wall position is legal', !g.collides(g.current));
  check('I kicks away from the left wall (1->2)', g.rotate(1));
  eq('I kick lands at x = 0', g.current.x, 0);
  eq('I reaches rotation state 2', g.current.rot, 2);
}
{
  const g = newGame();
  g.current = { type: 'I', rot: 1, x: 7, y: 10 }; // vertical I hugging the right wall
  check('I kicks away from the right wall (1->2)', g.rotate(1));
  eq('I kick lands at x = 6', g.current.x, 6);
}

console.log('hold');
{
  const g = newGame();
  const first = g.current.type;
  const next = g.queue[0];
  g.holdPiece();
  eq('hold stores the current piece', g.hold, first);
  eq('hold spawns the next piece', g.current.type, next);
  check('hold is marked used', g.holdUsed);
  g.holdPiece();
  eq('hold cannot be used twice per piece', g.current.type, next);
  g.hardDrop();
  check('hold re-enables after a lock', !g.holdUsed);
  g.holdPiece();
  eq('hold swaps back the stored piece', g.current.type, first);
}

console.log('ghost piece');
{
  const g = newGame();
  g.board[21][4] = 'J';
  g.board[21][5] = 'J';
  const type = g.current.type;
  const gy = g.ghostY();
  const landing = pieceCells(g).map(([x, y]) => [x, y - g.current.y + gy] as [number, number]);
  g.hardDrop();
  check('ghost marks the exact hard-drop landing', landing.every(([x, y]) => g.board[y][x] === type));
}

console.log('lock delay move resets');
{
  const g = newGame();
  g.current = { type: 'I', rot: 0, x: 4, y: 20 };
  g.move(-1); // establishes the lowest row
  g.update(400, false);
  check('not locked before the delay expires', g.current.type === 'I' && g.current.y === 20);
  for (let i = 0; i < 15; i++) {
    g.move(i % 2 === 0 ? 1 : -1);
    g.update(400, false);
  }
  check('15 move resets keep the piece alive', g.current.type === 'I' && g.current.y === 20);
  g.move(-1); // 16th move: reset cap reached, timer keeps running
  g.update(150, false);
  check('piece locks once resets are exhausted', g.board[ROWS - 1].some((c) => c === 'I'));
}

console.log('top-out and restart');
{
  const g = newGame();
  for (let x = 0; x < COLS; x++) {
    g.board[0][x] = 'J';
    g.board[1][x] = 'J';
  }
  g.hardDrop();
  eq('blocked spawn / lock out ends the game', g.state, 'over');
  g.reset();
  eq('R restart returns to playing', g.state, 'playing');
  eq('restart clears the board', g.board.every((row) => row.every((c) => c === null)), true);
  eq('restart resets the score', g.score, 0);
  eq('restart resets lines and level', [g.lines, g.level], [0, 1]);
}

console.log('queue endurance');
{
  const g = newGame(7);
  let ok = true;
  let placed = 0;
  for (let i = 0; i < 40 && g.state !== 'over'; i++) {
    const dx = (i % 7) - 3; // spread pieces across the field
    for (let k = 0; k < Math.abs(dx); k++) g.move(Math.sign(dx));
    g.hardDrop();
    g.update(200, false);
    if (g.queue.length < 5) ok = false;
    placed++;
  }
  check('next queue never starves', ok);
  check('many pieces placed before any top-out', placed >= 10);
}

console.log('');
if (failures.length > 0) {
  console.error(`${failures.length} test(s) failed, ${passed} passed.`);
  process.exitCode = 1;
} else {
  console.log(`All ${passed} checks passed.`);
}
