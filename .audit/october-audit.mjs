import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Pass an isolated directory containing the five freshly built projects.
const root = resolve(process.argv[2] ?? fileURLToPath(new URL('..', import.meta.url)));
const load = relative => import(pathToFileURL(resolve(root, relative)));
const beam = await load('beam/dist/game.js');
const beamBoard = await load('beam/dist/board.js');
const beamPieces = await load('beam/dist/pieces.js');
const cat = await load('cat-jam/dist/game/game.js');
const catPieces = await load('cat-jam/dist/game/pieces.js');
const gemini = await load('gemini-4/dist/engine.js');
const geminiConstants = await load('gemini-4/dist/constants.js');
const bunny = await load('space-bunny/dist/game.js');
const bunnyPieces = await load('space-bunny/dist/tetromino.js');
// An extra CommonJS compile allows engine probes even though the original
// browser build's extensionless imports fail. This does not repair that build.
const require = createRequire(import.meta.url);
const nemotron = require(resolve(root, 'nemotron/audit-cjs/game.js'));
const nemoPieces = require(resolve(root, 'nemotron/audit-cjs/tetromino.js'));

const canonical = {
  I: [
    [[0, 1], [1, 1], [2, 1], [3, 1]], [[2, 0], [2, 1], [2, 2], [2, 3]],
    [[0, 2], [1, 2], [2, 2], [3, 2]], [[1, 0], [1, 1], [1, 2], [1, 3]],
  ],
  J: [
    [[0, 0], [0, 1], [1, 1], [2, 1]], [[1, 0], [2, 0], [1, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [2, 2]], [[1, 0], [1, 1], [0, 2], [1, 2]],
  ],
  L: [
    [[2, 0], [0, 1], [1, 1], [2, 1]], [[1, 0], [1, 1], [1, 2], [2, 2]],
    [[0, 1], [1, 1], [2, 1], [0, 2]], [[0, 0], [1, 0], [1, 1], [1, 2]],
  ],
  O: Array.from({ length: 4 }, () => [[1, 0], [2, 0], [1, 1], [2, 1]]),
  S: [
    [[1, 0], [2, 0], [0, 1], [1, 1]], [[1, 0], [1, 1], [2, 1], [2, 2]],
    [[1, 1], [2, 1], [0, 2], [1, 2]], [[0, 0], [0, 1], [1, 1], [1, 2]],
  ],
  T: [
    [[1, 0], [0, 1], [1, 1], [2, 1]], [[1, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [1, 2]], [[1, 0], [0, 1], [1, 1], [1, 2]],
  ],
  Z: [
    [[0, 0], [1, 0], [1, 1], [2, 1]], [[2, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [1, 2], [2, 2]], [[1, 0], [0, 1], [1, 1], [0, 2]],
  ],
};
const key = cells => cells.map(([x, y]) => `${x},${y}`).sort().join(' ');
const matrixCells = matrix => matrix.flatMap((row, y) =>
  row.flatMap((value, x) => value ? [[x, y]] : []));
const points = cells => cells.map(({ x, y }) => [x, y]);
const translatedO = (type, cells) => cells.map(([x, y]) => [x + (type === 'O' ? 1 : 0), y]);
const adapters = {
  beam: (type, rotation) => matrixCells(beamPieces.SHAPES[type][rotation]),
  'cat-jam': (type, rotation) => translatedO(type, catPieces.SHAPES[type][rotation]),
  'gemini-4': (type, rotation) => points(geminiConstants.PIECE_SHAPES[type][rotation]),
  nemotron: (type, rotation) => points(nemoPieces.cellsOf(type, rotation)).map(([x, y]) =>
    [x + (type === 'O' || type === 'I' ? 1 : 0), y + (type === 'I' ? 1 : 0)]),
  'space-bunny': (type, rotation) => translatedO(type, points(bunnyPieces.pieceCells(type, rotation))),
};
const expectedOrientationFailures = {
  beam: [],
  'cat-jam': ['L2'],
  'gemini-4': [],
  nemotron: ['I1', 'I3', 'J0', 'J1', 'J2', 'J3', 'L0', 'L1', 'L2', 'L3', 'T0', 'T2'],
  'space-bunny': ['L2', 'L3', 'T1', 'T2', 'T3'],
};
for (const [name, cellsFor] of Object.entries(adapters)) {
  const failures = [];
  for (const type of Object.keys(canonical)) {
    for (let rotation = 0; rotation < 4; rotation++) {
      if (key(cellsFor(type, rotation)) !== key(canonical[type][rotation])) failures.push(`${type}${rotation}`);
    }
  }
  assert.deepEqual(failures, expectedOrientationFailures[name], `${name}: SRS findings changed`);
  console.log(`${name}: canonical SRS mismatches = ${failures.join(', ') || 'none'}`);
}

// Core engine smoke checks are equivalent in intent across the different APIs.
{
  const game = beam.initGame(() => 0.5);
  const x = game.current.x;
  assert(beam.tryMove(game, -1, 0));
  assert.equal(game.current.x, x - 1);
  beam.holdPiece(game);
  assert.equal(game.canHold, false);
  beam.hardDropPiece(game);
  assert.equal(game.canHold, true);
  assert(game.board.flat().some(Boolean));
}
{
  const game = new cat.Game(() => 0.5);
  const x = game.active.x;
  assert(game.moveLeft());
  assert.equal(game.active.x, x - 1);
  game.hold();
  assert.equal(game.canHold, false);
  game.hardDrop();
  assert.equal(game.canHold, true);
}
{
  const game = new gemini.TetrisEngine(() => 0.5);
  const x = game.getSnapshot().activePiece.x;
  assert(game.moveLeft());
  assert.equal(game.getSnapshot().activePiece.x, x - 1);
  assert(game.hold());
  assert.equal(game.hold(), false);
  game.hardDrop();
  assert(game.hold());
}
{
  const game = new nemotron.Game();
  const x = game.state.piece.x;
  assert(game.moveLeft());
  assert.equal(game.state.piece.x, x - 1);
  assert(game.holdPiece());
  assert.equal(game.holdPiece(), false);
  assert(game.hardDrop());
  assert(game.holdPiece());
}
{
  const game = new bunny.Game({ random: () => 0.5 });
  const x = game.current.x;
  assert(game.moveLeft());
  assert.equal(game.current.x, x - 1);
  assert(game.holdPiece());
  assert.equal(game.holdPiece(), false);
  assert(game.hardDrop());
  assert(game.holdPiece());
}
console.log('All five engines: movement, hard drop and hold smoke checks passed');

// Spawn blocking and restart/reset are checked independently of the browser's
// ability to deliver the modules. No extra browser pass is implied for Nemo.
{
  const game = beam.initGame(() => 0.5);
  game.board[0].fill(1);
  game.board[1].fill(1);
  beam.spawnNext(game);
  assert.equal(game.isOver, true);
  Object.assign(game, beam.initGame(() => 0.5));
  assert.equal(game.isOver, false);
  assert.equal(game.score, 0);
}
{
  const game = new cat.Game(() => 0.5);
  game.board.lock('J', [[0, 0]], 4, 3);
  game.spawn('O');
  assert.equal(game.state, 'gameover');
  game.restart();
  assert.equal(game.state, 'playing');
  assert.equal(game.score, 0);
}
{
  const game = new gemini.TetrisEngine(() => 0.5);
  const board = Array.from({ length: 24 }, () => Array(10).fill(null));
  for (let y = 1; y < 5; y++) for (let x = 3; x < 7; x++) board[y][x] = 'J';
  game.setBoardForTest(board);
  game.spawnPieceOfType('O');
  assert.equal(game.isGameOver(), true);
  game.reset();
  assert.equal(game.isGameOver(), false);
}
{
  const game = new nemotron.Game();
  game.board[0].fill('J');
  game.board[1].fill('J');
  game.spawn();
  assert.equal(game.state.gameOver, true);
  game.restart();
  assert.equal(game.state.gameOver, false);
}
{
  const game = new bunny.Game({ random: () => 0.5 });
  for (let y = 0; y < 2; y++) for (let x = 0; x < 10; x++) game.playfield.set(x, y, 'J');
  game.holdPiece();
  assert.equal(game.state, 'gameover');
  game.reset();
  assert.equal(game.state, 'playing');
}
console.log('All five engines: blocked spawn and restart/reset smoke checks passed');

// Beam mixes a Unix timestamp with the animation clock after a grounded move.
{
  const game = beam.initGame(() => 0.5);
  game.current = { piece: 'O', rot: 0, x: 3, y: 20 };
  beam.updateLockDelay(game, 1000, 500);
  assert(beam.tryMove(game, 1, 0));
  assert(game.lockTimer > 1_000_000_000_000);
  beam.updateLockDelay(game, 10000, 500);
  assert.equal(game.current.piece, 'O');
  assert.equal(game.board.flat().filter(Boolean).length, 0);
  const before = game.score;
  game.current = { piece: 'T', rot: 0, x: 3, y: 5 };
  assert.equal(beam.softDrop(game), 1);
  assert.equal(game.score, before);
  assert.equal(beamBoard.lineScore(1, 0), 40);
  assert.equal(beamBoard.lineScore(4, 0), 1200);
  console.log('beam: grounded move prevents timed locking; soft drop awards 0; line table is 40/100/300/1200');
}

// Cat-jam has normal/combo scoring but no perfect-clear or spin/B2B scoring.
{
  const game = new cat.Game(() => 0.5);
  game.active = { type: 'I', rotation: 0, x: 3, y: 21 };
  for (const x of [0, 1, 2, 7, 8, 9]) game.board.lock('J', [[0, 0]], x, 22);
  game.hardDrop();
  assert.equal(game.score, 100);
  assert.equal(game.lines, 1);
  assert.equal(game.board.get(0, 22), null);
  console.log('cat-jam: single-line perfect clear awards 100 instead of 900');
}

// Gemini omits the perfect-clear bonus, while retaining its other score tables.
{
  const game = new gemini.TetrisEngine(() => 0.5);
  const board = Array.from({ length: 24 }, () => Array(10).fill(null));
  for (const x of [0, 1, 2, 7, 8, 9]) board[23][x] = 'J';
  game.setBoardForTest(board);
  game.setActivePieceForTest({ type: 'I', rotation: 0, x: 3, y: 22 });
  game.hardDrop();
  assert.equal(game.getSnapshot().score, 100);
  assert(game.getSnapshot().board.flat().every(value => value === null));
  console.log('gemini-4: single-line perfect clear awards 100 instead of 900');
}

// Nemotron's timer advances only on failed gravity ticks, and soft-drop points
// are calculated per frame rather than per cell that actually moved.
{
  const game = new nemotron.Game();
  game.piece = { type: 'O', rot: 0, x: 3, y: 18 };
  assert.equal(game.step(499), false);
  assert.equal(game.step(2), false);
  assert.equal(game.state.board.flat().filter(Boolean).length, 0);
  assert.equal(game.step(315), true);
  const falling = new nemotron.Game();
  falling.piece = { type: 'O', rot: 0, x: 3, y: 2 };
  falling.softDropStart();
  for (let frame = 0; frame < 4; frame++) falling.step(16);
  assert.equal(falling.state.piece.y, 3);
  assert.equal(falling.state.score, 0);
  const single = new nemotron.Game();
  single.board.forEach(row => row.fill(null));
  single.piece = { type: 'I', rot: 0, x: 1, y: 19 };
  for (let x = 4; x < 10; x++) single.board[19][x] = 'J';
  single.hardDrop();
  assert.equal(single.state.score, 40);
  assert.equal(single.state.lines, 1);
  console.log('nemotron: grounded piece locks at 816ms instead of 500ms; real soft-drop travel scores 0 at 60fps');
  console.log('nemotron: level-one single awards 40 instead of 100');
}

// Space-bunny's counterclockwise adapter incorrectly mirrors a reverse table.
{
  assert.deepEqual(
    bunnyPieces.kickOffsets('T', 1, 0, false).map(({ x, y }) => [x || 0, y || 0]),
    [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  );
  const canonicalScreen = [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]];
  assert.notDeepEqual(
    bunnyPieces.kickOffsets('T', 1, 0, false).map(({ x, y }) => [x || 0, y || 0]), canonicalScreen,
  );
  const game = new bunny.Game({ random: () => 0.5 });
  game.current = { type: 'O', rotation: 0, x: 3, y: 5 };
  const ghost = game.ghostCells();
  assert.equal(new Set(ghost.map(({ x, y }) => `${x},${y}`)).size, 2);
  assert.equal(new Set(ghost.map(({ y }) => y)).size, 1);
  console.log('space-bunny: incorrect CCW kick Y offsets; O ghost collapses from four distinct cells to two');
}

// Held soft drop travels repeatedly but only its initial tap scores.
{
  const game = new bunny.Game({ random: () => 0.5 });
  game.current = { type: 'O', rotation: 0, x: 3, y: 5 };
  assert(game.softDropStep());
  game.update(20);
  game.update(20);
  assert.equal(game.current.y, 8);
  assert.equal(game.score, 1);
  console.log('space-bunny: three soft-dropped rows award 1 instead of 3');
}

// Scoring integration: helper tests do not catch these engine-level defects.
{
  const game = new bunny.Game({ random: () => 0.5, startLevel: 2 });
  game.combo = 0;
  game.current = { type: 'I', rotation: 0, x: 3, y: 20 };
  for (const x of [0, 1, 2, 7, 8, 9]) game.playfield.set(x, 21, 'J');
  game.playfield.set(0, 18, 'J'); // Prevent perfect clear.
  game.hardDrop();
  assert.equal(game.score, 400);
  const chain = new bunny.Game({ random: () => 0.5 });
  chain.backToBack = true;
  chain.current = { type: 'O', rotation: 0, x: 0, y: 20 };
  chain.hardDrop();
  assert.equal(chain.backToBack, false);
  const corners = (x, y) => ['0,0', '2,0', '0,2'].includes(`${x},${y}`);
  assert.equal(bunnyPieces.detectTSpin('T', 0, 0, 0, 0, corners), 'mini');
  assert.equal(bunnyPieces.detectTSpin('T', 0, 0, 0, 4, () => false), 'full');
  console.log('space-bunny: level-two combo awards 400 instead of 300; no-clear placement breaks B2B; T-spin classifier fails reference cases');
}

console.log('October audit assertions passed: confirmed defects remain reproducible.');
