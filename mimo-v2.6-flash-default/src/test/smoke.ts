/**
 * Headless logic smoke tests (no browser needed): `npm test`.
 * Covers the 7-bag, spawning, SRS wall kicks, line clears, scoring,
 * back-to-back, lock delay, hold, soft/hard drop and top-out.
 */
import { COLS, DAS, HIDDEN_ROWS, ROWS } from '../constants.js';
import type { PieceType } from '../constants.js';
import { Board } from '../board.js';
import { Game } from '../game.js';
import { InputHandler } from '../input.js';
import { SHAPES, PIECE_TYPES } from '../pieces.js';
import { Renderer } from '../render.js';
import { SevenBag } from '../randomizer.js';
import { mulberry32 } from '../rng.js';
import {
  comboPoints,
  gravitySeconds,
  levelFor,
  perfectClearBonus,
  pointsForClear,
} from '../scoring.js';

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail = ''): void {
  if (condition) {
    passed++;
    console.log(`  ok   ${name}`);
  } else {
    failed++;
    console.error(` FAIL  ${name}${detail ? ` -- ${detail}` : ''}`);
  }
}

function eq(name: string, actual: unknown, expected: unknown): void {
  check(name, actual === expected, `expected ${String(expected)}, got ${String(actual)}`);
}

// --- 7-bag randomizer ------------------------------------------------------

const bag = new SevenBag(mulberry32(12345));
const dealt: PieceType[] = [];
for (let i = 0; i < 70; i++) dealt.push(bag.next());
let batchesOk = true;
for (let i = 0; i < dealt.length; i += 7) {
  const batch = dealt.slice(i, i + 7);
  for (const type of PIECE_TYPES) {
    if (batch.filter((t) => t === type).length !== 1) batchesOk = false;
  }
}
check('7-bag deals every piece exactly once per batch of 7', batchesOk);

// --- spawning --------------------------------------------------------------

const spawnGame = new Game(mulberry32(7));
const spawn = spawnGame.current!;
const spawnCells = SHAPES[spawn.type][0];
check(
  'piece spawns in the top two visible rows',
  spawnCells.every(([, cy]) => {
    const y = spawn.y + cy;
    return y >= HIDDEN_ROWS && y < HIDDEN_ROWS + 2;
  }),
);
check(
  'piece spawns in the center columns 3..6',
  spawnCells.every(([cx]) => spawn.x + cx >= 3 && spawn.x + cx <= 6),
);
eq('next queue has 5 entries', spawnGame.peekNext(5).length, 5);

// --- movement and walls ----------------------------------------------------

const moveGame = new Game(mulberry32(3));
for (let i = 0; i < 20; i++) moveGame.moveHorizontal(-1);
const minCol = Math.min(...SHAPES[moveGame.current!.type][0].map(([cx]) => moveGame.current!.x + cx));
eq('left wall clamps the piece', minCol, 0);
for (let i = 0; i < 40; i++) moveGame.moveHorizontal(1);
const maxCol = Math.max(...SHAPES[moveGame.current!.type][0].map(([cx]) => moveGame.current!.x + cx));
eq('right wall clamps the piece', maxCol, COLS - 1);

// --- SRS wall kicks --------------------------------------------------------

const kickGame = new Game(mulberry32(1));
kickGame.current = { type: 'T', rot: 1, x: -1, y: 10 };
check('setup: T pointing right fits at the left wall', !kickGame.board.collides(SHAPES.T[1], -1, 10));
kickGame.rotate(1);
eq('T is kicked clear of the left wall', kickGame.current!.x, 0);
eq('T kick keeps the rotation', kickGame.current!.rot, 2);

kickGame.current = { type: 'I', rot: 1, x: -2, y: 10 };
check('setup: vertical I fits in the left wall column', !kickGame.board.collides(SHAPES.I[1], -2, 10));
kickGame.rotate(1);
eq('I is kicked clear of the left wall', kickGame.current!.x, 0);
eq('I kick keeps the rotation', kickGame.current!.rot, 2);

// --- T-spin double: score, back-to-back and combo ---------------------------

const tsdGame = new Game(mulberry32(5));
for (let x = 0; x < COLS; x++) {
  if (x !== 2) tsdGame.board.set(x, 39, 'I'); // bottom row: slot at column 2
  if (x !== 1 && x !== 2 && x !== 3) tsdGame.board.set(x, 38, 'I'); // slot across cols 1..3
  if (x !== 2) tsdGame.board.set(x, 37, 'I'); // overhang row above the slot
}
tsdGame.current = { type: 'T', rot: 2, x: 1, y: 36 };
tsdGame.lastActionWasRotation = true;
tsdGame.hardDrop(); // rotates into the slot, then hard drops the last row
eq('T-spin double clears 2 lines', tsdGame.lines, 2);
eq('T-spin double scores 1200 + hard drop', tsdGame.score, 1200 + 2);
check('T-spin is back-to-back eligible', tsdGame.backToBack);
eq('combo counter is 0 after the first clear', tsdGame.combo, 0);
check('clear message mentions the T-spin', tsdGame.message.includes('T-SPIN'), tsdGame.message);

// --- line clears -----------------------------------------------------------

const clearBoard = new Board();
for (let x = 1; x < COLS; x++) {
  clearBoard.set(x, ROWS - 1, 'I');
  clearBoard.set(x, ROWS - 2, 'I');
}
clearBoard.lock(SHAPES.O[0], -1, ROWS - 2, 'O'); // fills column 0 of both rows
eq('clearing returns the number of rows', clearBoard.clearLines(), 2);
eq('board is empty after the double', clearBoard.filledCells(), 0);
check('perfect clear is detected on an empty board', clearBoard.isPerfectClear());

// --- Guideline scoring -----------------------------------------------------

eq('single', pointsForClear(1, 'none', 1), 100);
eq('double', pointsForClear(2, 'none', 1), 300);
eq('triple', pointsForClear(3, 'none', 1), 500);
eq('tetris', pointsForClear(4, 'none', 1), 800);
eq('tetris at level 3', pointsForClear(4, 'none', 3), 2400);
eq('t-spin single', pointsForClear(1, 'full', 1), 800);
eq('t-spin double', pointsForClear(2, 'full', 1), 1200);
eq('t-spin triple at level 2', pointsForClear(3, 'full', 2), 3200);
eq('mini t-spin single', pointsForClear(1, 'mini', 1), 100);
eq('mini t-spin double', pointsForClear(2, 'mini', 1), 200);
eq('back-to-back tetris is 1.5x', Math.floor(pointsForClear(4, 'none', 1) * 1.5), 1200);
eq('combo of 3 at level 2', comboPoints(3, 2), 300);
eq('perfect clear tetris bonus', perfectClearBonus(4, 'none', 1), 800);
eq('level rises every 10 lines', levelFor(25), 3);

// --- gravity ---------------------------------------------------------------

eq('level 1 gravity is one row per second', gravitySeconds(1), 1);
check('level 2 gravity follows the Guideline formula', Math.abs(gravitySeconds(2) - 0.793) < 1e-9);
let gravityOk = true;
let previousGravity = Infinity;
for (let level = 1; level <= 15; level++) {
  const g = gravitySeconds(level);
  if (g > previousGravity) gravityOk = false;
  previousGravity = g;
}
check('gravity gets faster with the level', gravityOk);
check('gravity stays positive at absurd levels', gravitySeconds(100) > 0);

// --- back-to-back tetris through the game loop -----------------------------

const b2bGame = new Game(mulberry32(29));
for (let i = 0; i < 4; i++) {
  for (let x = 1; x < COLS; x++) b2bGame.board.set(x, ROWS - 1 - i, 'I');
}
b2bGame.board.set(9, ROWS - 10, 'I'); // keeps the board non-empty (no perfect clear)
b2bGame.current = { type: 'I', rot: 1, x: -2, y: ROWS - 4 };
b2bGame.hardDrop();
eq('first tetris scores 800', b2bGame.score, 800);
check('first tetris sets back-to-back', b2bGame.backToBack);
for (let i = 0; i < 4; i++) {
  for (let x = 1; x < COLS; x++) b2bGame.board.set(x, ROWS - 1 - i, 'I');
}
b2bGame.current = { type: 'I', rot: 1, x: -2, y: ROWS - 4 };
b2bGame.hardDrop();
eq('back-to-back tetris multiplies the score', b2bGame.score, 800 + 1200 + 50);
check('back-to-back is announced', b2bGame.message.includes('B2B'), b2bGame.message);

// --- hold ------------------------------------------------------------------

const holdGame = new Game(mulberry32(11));
const firstPiece = holdGame.current!.type;
holdGame.holdPiece();
eq('hold stores the current piece', holdGame.hold, firstPiece);
check('hold spawns the next piece', holdGame.current !== null && holdGame.current.type !== firstPiece);
const secondPiece = holdGame.current!.type;
holdGame.holdPiece();
eq('second hold is blocked until the piece locks', holdGame.current!.type, secondPiece);
holdGame.hardDrop();
const thirdPiece = holdGame.current!.type;
holdGame.holdPiece();
eq('hold works again after locking', holdGame.hold, thirdPiece);

// --- hard drop -------------------------------------------------------------

const hardDropGame = new Game(mulberry32(13));
const p = hardDropGame.current!;
const distance = hardDropGame.board.dropDistance(SHAPES[p.type][0], p.x, p.y);
check('hard drop has room to fall on an empty board', distance > 0);
hardDropGame.hardDrop();
eq('hard drop scores 2 points per cell', hardDropGame.score, distance * 2);
eq('hard drop locks all 4 cells', hardDropGame.board.filledCells(), 4);

// --- lock delay ------------------------------------------------------------

const lockGame = new Game(mulberry32(17));
lockGame.current = { type: 'O', rot: 0, x: 4, y: ROWS - 2 }; // resting on the floor
lockGame.update(0.4);
eq('piece is not locked before the lock delay', lockGame.board.filledCells(), 0);
lockGame.update(0.15);
eq('piece locks after the 500ms lock delay', lockGame.board.filledCells(), 4);
check('a new piece spawns after locking', lockGame.current !== null);

// --- soft drop -------------------------------------------------------------

const softGame = new Game(mulberry32(19));
const startY = softGame.current!.y;
softGame.setSoftDrop(true);
eq('starting a soft drop moves the piece at once', softGame.current!.y, startY + 1);
eq('the first soft dropped cell scores a point', softGame.score, 1);
softGame.update(0.05); // soft drop interval at level 1 is 1/20s
eq('soft drop keeps moving the piece down', softGame.current!.y, startY + 2);
eq('soft drop scores 1 point per cell', softGame.score, 2);

// --- top-out on a blocked spawn --------------------------------------------

const topOutGame = new Game(mulberry32(23));
// Block the spawn area, but leave column 9 open so no row ever completes.
for (let x = 0; x < COLS - 1; x++) {
  topOutGame.board.set(x, HIDDEN_ROWS, 'I');
  topOutGame.board.set(x, HIDDEN_ROWS + 1, 'I');
}
topOutGame.hardDrop();
check('blocked spawn ends the game', topOutGame.gameOver);
const frozenScore = topOutGame.score;
topOutGame.update(1);
eq('nothing moves after game over', topOutGame.score, frozenScore);
topOutGame.restart();
check('restart begins a fresh game', !topOutGame.gameOver && topOutGame.board.filledCells() === 0);

// --- renderer (stubbed 2D context, so draw paths are smoke tested headlessly)

interface CanvasStub {
  width: number;
  height: number;
}

const canvasStub: CanvasStub = { width: 0, height: 0 };
const ctxStub: Record<string, unknown> = {
  canvas: canvasStub,
  measureText: () => ({ width: 100 }),
};
for (const method of ['fillRect', 'strokeRect', 'beginPath', 'moveTo', 'lineTo', 'stroke', 'fillText']) {
  ctxStub[method] = () => undefined;
}

const renderGame = new Game(mulberry32(31));
const renderer = new Renderer(ctxStub as unknown as CanvasRenderingContext2D);
let renderOk = true;
try {
  renderer.render(renderGame); // fresh game: ghost, hold slot and next queue
  renderGame.current = { type: 'T', rot: 2, x: 4, y: ROWS - 3 }; // resting spot for a clear
  renderGame.message = 'T-SPIN DOUBLE B2B';
  renderGame.messageTimer = 2;
  renderer.render(renderGame); // message flash path
  renderGame.gameOver = true;
  renderer.render(renderGame); // game over overlay path
} catch (error) {
  renderOk = false;
  console.error(error);
}
check('renderer draws every state without errors', renderOk);
eq('renderer sizes the canvas to playfield + panel', canvasStub.width, 480);

// --- random play fuzz: the game must not break during arbitrary play -------

const fuzzRng = mulberry32(2024);
const fuzzGame = new Game(mulberry32(99));
let fuzzOk = true;
try {
  for (let i = 0; i < 3000 && !fuzzGame.gameOver; i++) {
    switch (Math.floor(fuzzRng() * 8)) {
      case 0: fuzzGame.moveHorizontal(-1); break;
      case 1: fuzzGame.moveHorizontal(1); break;
      case 2: fuzzGame.rotate(1); break;
      case 3: fuzzGame.rotate(-1); break;
      case 4:
        fuzzGame.setSoftDrop(true);
        fuzzGame.update(0.03);
        fuzzGame.setSoftDrop(false);
        break;
      case 5: fuzzGame.hardDrop(); break;
      case 6: fuzzGame.holdPiece(); break;
      default: fuzzGame.update(0.05); break;
    }
    if (fuzzGame.score < 0 || fuzzGame.lines < 0) fuzzOk = false;
    const cur = fuzzGame.current;
    if (cur && !fuzzGame.gameOver && fuzzGame.board.collides(SHAPES[cur.type][cur.rot], cur.x, cur.y)) {
      fuzzOk = false; // the active piece must always fit
    }
  }
} catch (error) {
  fuzzOk = false;
  console.error(error);
}
check('random play survives 3000 actions without breaking invariants', fuzzOk);
check('random play eventually tops out', fuzzGame.gameOver);

// --- keyboard controls (stubbed window, checks the README control scheme) --

type DomEvent = { code: string; repeat: boolean; preventDefault(): void };
type DomListener = (e: DomEvent) => void;
const domListeners = new Map<string, DomListener[]>();
(globalThis as unknown as Record<string, unknown>)['window'] = {
  addEventListener: (type: string, fn: DomListener) => {
    const list = domListeners.get(type) ?? [];
    list.push(fn);
    domListeners.set(type, list);
  },
};

let defaultPrevented = false;
function fire(type: string, code: string, repeat = false): void {
  defaultPrevented = false;
  for (const fn of domListeners.get(type) ?? []) {
    fn({ code, repeat, preventDefault: () => { defaultPrevented = true; } });
  }
}

const inputGame = new Game(mulberry32(41));
const input = new InputHandler(inputGame);
const firstType = inputGame.current!.type;
const startX = inputGame.current!.x;

fire('keydown', 'ArrowLeft');
eq('left arrow moves the piece left', inputGame.current!.x, startX - 1);
check('handled keys suppress the browser default', defaultPrevented);
fire('keyup', 'ArrowLeft');
fire('keydown', 'ArrowRight');
eq('right arrow moves the piece right', inputGame.current!.x, startX);
fire('keyup', 'ArrowRight');

const rot0 = inputGame.current!.rot;
fire('keydown', 'KeyX');
eq('x rotates clockwise', inputGame.current!.rot, (rot0 + 1) % 4);
fire('keyup', 'KeyX');
fire('keydown', 'ArrowUp');
eq('up arrow rotates clockwise', inputGame.current!.rot, (rot0 + 2) % 4);
fire('keyup', 'ArrowUp');
fire('keydown', 'KeyZ');
eq('z rotates counter-clockwise', inputGame.current!.rot, (rot0 + 1) % 4);
fire('keyup', 'KeyZ');
fire('keydown', 'ControlLeft');
eq('ctrl rotates counter-clockwise', inputGame.current!.rot, rot0);
fire('keyup', 'ControlLeft');

fire('keydown', 'KeyC');
eq('c holds the piece', inputGame.hold, firstType);
fire('keyup', 'KeyC');
const afterHold = inputGame.current!.type;
fire('keydown', 'KeyC');
eq('hold is blocked until the piece locks', inputGame.current!.type, afterHold);
fire('keyup', 'KeyC');

const softY = inputGame.current!.y;
fire('keydown', 'ArrowDown');
eq('down arrow soft drops one row', inputGame.current!.y, softY + 1);
fire('keyup', 'ArrowDown');

const dasX = inputGame.current!.x;
fire('keydown', 'ArrowLeft');
input.update(DAS + 0.05); // holding the key past DAS must repeat the move
check('holding a direction triggers the DAS repeat', inputGame.current!.x < dasX);
fire('keyup', 'ArrowLeft');

fire('keydown', 'Space');
check('space hard drops and locks the piece', inputGame.board.filledCells() === 4);
fire('keyup', 'Space');

inputGame.gameOver = true;
fire('keydown', 'KeyR');
check('r restarts after game over', !inputGame.gameOver && inputGame.board.filledCells() === 0);
fire('keyup', 'KeyR');

// --- summary ---------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) throw new Error(`${failed} smoke test(s) failed`);
