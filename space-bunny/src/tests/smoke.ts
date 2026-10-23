/**
 * Headless smoke tests for the game logic: `npm test` builds the project and
 * runs this file. No test framework, no dependencies.
 */

import { COLS, HIDDEN_ROWS, ROWS, VISIBLE_ROWS } from '../constants.js';
import { Game } from '../game.js';
import { Playfield } from '../playfield.js';
import { mulberry32, SevenBagRandomizer } from '../randomizer.js';
import {
  clearScore,
  comboScore,
  gravityMs,
  isDifficult,
  perfectClearScore,
} from '../scoring.js';
import { detectTSpin, kickOffsets, PIECE_ORDER, pieceBox, pieceCells, previewBox } from '../tetromino.js';
import type { Cell, PieceType, Rotation } from '../types.js';

let checks = 0;
let failures = 0;
let group = '';

function section(name: string): void {
  group = name;
}

function check(name: string, condition: boolean, detail = ''): void {
  checks += 1;
  if (condition) return;
  failures += 1;
  console.error(`FAIL  ${group} > ${name}${detail ? ` (${detail})` : ''}`);
}

function equal<T>(name: string, actual: T, expected: T): void {
  check(name, Object.is(actual, expected), `expected ${String(expected)}, got ${String(actual)}`);
}

function newGame(seed = 1): Game {
  return new Game({ random: mulberry32(seed) });
}

// --- helpers ---------------------------------------------------------------

function put(field: Playfield, x: number, y: number, type: PieceType = 'J'): void {
  field.set(x, y, type);
}

/** Fills a row with `type`, leaving the given columns empty. */
function fillRow(field: Playfield, y: number, gaps: number[] = [], type: PieceType = 'J'): void {
  for (let x = 0; x < COLS; x += 1) {
    if (gaps.includes(x)) continue;
    put(field, x, y, type);
  }
}

function fillGameRow(game: Game, y: number, gaps: number[] = [], type: PieceType = 'J'): void {
  fillRow(game.playfield, y, gaps, type);
}

/** Runs the active piece down until it rests on the stack. */
function dropToFloor(game: Game): void {
  let guard = 0;
  while (guard < ROWS + 4) {
    guard += 1;
    if (!game.stepDown()) break;
  }
}

/** Force the next pieces to spawn. */
function queue(game: Game, pieces: PieceType[]): void {
  game.next = [...pieces];
  while (game.next.length < 5) game.next.push('O');
}

function inBounds(type: PieceType, x: number, y: number): boolean {
  return pieceCells(type, 0).every((c) => {
    const bx = x + c.x;
    const by = y + c.y;
    return bx >= 0 && bx < COLS && by >= 0 && by < ROWS;
  });
}

/** Blocks a piece would rest on when dropped at the given position. */
function landingY(field: Playfield, cells: readonly Cell[], x: number): number {
  let landing = -1;
  for (let y = 0; y < ROWS; y += 1) {
    const blocked = cells.some((c) => {
      const bx = x + c.x;
      const by = y + c.y;
      return bx < 0 || bx >= COLS || by >= ROWS || field.isOccupied(bx, by);
    });
    if (blocked) break;
    landing = y;
  }
  return landing;
}

function copyInto(source: Playfield, target: Playfield): void {
  target.reset();
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const value = source.at(x, y);
      if (value) target.set(x, y, value);
    }
  }
}

/** Height, buried holes and bumpiness of a field - lower is better. */
function fieldPenalty(field: Playfield): number {
  const heights: number[] = [];
  let holes = 0;
  for (let x = 0; x < COLS; x += 1) {
    let height = 0;
    let seen = false;
    for (let y = 0; y < ROWS; y += 1) {
      if (field.isOccupied(x, y)) {
        if (!seen) {
          height = ROWS - y;
          seen = true;
        }
      } else if (seen) {
        holes += 1;
      }
    }
    heights.push(height);
  }
  const total = heights.reduce((sum, height) => sum + height, 0);
  const tallest = Math.max(...heights);
  let bumpiness = 0;
  for (let x = 1; x < COLS; x += 1) {
    bumpiness += Math.abs((heights[x] as number) - (heights[x - 1] as number));
  }
  return total + tallest * 2 + holes * 8 + bumpiness;
}

/**
 * Places the active piece the way a simple bot would: try every rotation and
 * column, keep the spot with the best trade off between lines and stack
 * shape, then reach it with real player moves.
 */
function autoPlace(game: Game): void {
  const piece = game.current;
  if (!piece) return;
  const scratch = new Playfield();
  const trial = new Playfield();
  let best = { rotation: piece.rotation, x: piece.x, penalty: Infinity };

  for (let rotation = 0; rotation < 4; rotation += 1) {
    const cells = pieceCells(piece.type, rotation as Rotation);
    for (let x = -2; x <= COLS; x += 1) {
      copyInto(game.playfield, scratch);
      const y = landingY(scratch, cells, x);
      if (y < 0) continue;
      copyInto(scratch, trial);
      let cleared = 0;
      for (const cell of cells) trial.set(x + cell.x, y + cell.y, piece.type);
      for (let row = 0; row < ROWS; row += 1) {
        if (trial.isRowFull(row)) {
          cleared += 1;
          trial.clearRows([row]);
        }
      }
      const penalty = fieldPenalty(trial) - cleared * 25;
      if (penalty < best.penalty) best = { rotation: rotation as Rotation, x, penalty };
    }
  }

  let guard = 0;
  while (game.current && game.current.rotation !== best.rotation && guard < 4) {
    guard += 1;
    if (!game.rotate(true)) game.rotate(false);
  }
  while (game.current && game.current.x < best.x) {
    if (!game.moveRight()) break;
  }
  while (game.current && game.current.x > best.x) {
    if (!game.moveLeft()) break;
  }
  game.hardDrop();
}

// --- randomizer ------------------------------------------------------------

section('randomizer');
{
  const random = new SevenBagRandomizer(mulberry32(11));
  const first = Array.from({ length: 7 }, () => random.next()).sort();
  equal('first bag holds every piece once', first.join(''), [...PIECE_ORDER].sort().join(''));

  const counts = new Map<PieceType, number>();
  for (let i = 0; i < 700; i += 1) {
    const piece = random.next();
    counts.set(piece, (counts.get(piece) ?? 0) + 1);
  }
  check(
    '700 draws give exactly 100 of each piece',
    counts.size === 7 && [...counts.values()].every((n) => n === 100),
    JSON.stringify([...counts]),
  );

  const a = new SevenBagRandomizer(mulberry32(5));
  const b = new SevenBagRandomizer(mulberry32(5));
  equal(
    'same seed gives the same sequence',
    Array.from({ length: 20 }, () => a.next()).join(''),
    Array.from({ length: 20 }, () => b.next()).join(''),
  );

  // The game itself must deal from bags as well.
  const bag = newGame(31);
  const spawns: PieceType[] = [bag.current!.type];
  for (let i = 0; i < 6; i += 1) {
    bag.hardDrop();
    spawns.push(bag.current!.type);
  }
  equal('the game deals seven different pieces in a row', new Set(spawns.slice(0, 7)).size, 7);
  equal('and keeps five queued up', bag.next.length, 5);
}

// --- playfield -------------------------------------------------------------

section('playfield');
{
  const field = new Playfield();
  check('starts empty', field.isEmpty());
  fillRow(field, ROWS - 1);
  equal('fullRows finds a full row', field.fullRows().length, 1);
  field.set(3, ROWS - 2, 'T');
  equal('clearRows returns the number of rows', field.clearRows([ROWS - 1]), 1);
  equal('blocks above a cleared row fall down', field.at(3, ROWS - 1), 'T');
  check('the cleared row is gone', field.at(0, ROWS - 1) === null);
  equal('nothing else survives', field.filled, 1);

  const gap = new Playfield();
  fillRow(gap, ROWS - 1, [4]);
  check('a row with a gap is not full', !gap.isRowFull(ROWS - 1));
  gap.set(4, ROWS - 1, 'Z');
  check('filling the gap completes the row', gap.isRowFull(ROWS - 1));
  equal('height counts from the top of the field', gap.height, 1);
  equal('out of bounds reads are empty', gap.at(-1, 0), null);
  equal('out of bounds writes are ignored', (gap.set(99, 0, 'I'), gap.filled), 10);
  equal('rows are dumped top to bottom', gap.toRows().length, ROWS);
}

// --- scoring ---------------------------------------------------------------

section('scoring tables');
{
  equal('single', clearScore('line', 1), 100);
  equal('double', clearScore('line', 2), 300);
  equal('triple', clearScore('line', 3), 500);
  equal('tetris', clearScore('line', 4), 800);
  equal('t-spin single', clearScore('tspin', 1), 800);
  equal('t-spin double', clearScore('tspin', 2), 1200);
  equal('t-spin triple', clearScore('tspin', 3), 1600);
  equal('t-spin without a clear', clearScore('tspin', 0), 400);
  equal('mini t-spin single', clearScore('tspin-mini', 1), 200);
  equal('mini t-spin double', clearScore('tspin-mini', 2), 400);
  equal('a combo needs at least one clear', comboScore(0, 1), 0);
  equal('combo bonus', comboScore(3, 2), 300);
  equal('perfect clear bonus', perfectClearScore(2), 1200);
  check('tetris is a difficult clear', isDifficult('line', 4));
  check('a single is not', !isDifficult('line', 1));
  check('a t-spin is', isDifficult('tspin', 1));
  equal('level 1 gravity', Math.round(gravityMs(1)), 1000);
  equal('level 2 gravity', Math.round(gravityMs(2)), 793);
  check('gravity speeds up with the level', gravityMs(15) < gravityMs(5));
}

// --- rotation system -------------------------------------------------------

section('super rotation system');
{
  const cycle = newGame(2);
  const start = { ...cycle.current! };
  for (let i = 0; i < 4; i += 1) cycle.rotate(true);
  equal('four clockwise turns restore the rotation', cycle.current!.rotation, 0);
  equal('and the position', `${cycle.current!.x},${cycle.current!.y}`, `${start.x},${start.y}`);

  const back = newGame(2);
  back.current = { type: 'T', rotation: 0, x: 3, y: 5 };
  back.rotate(true);
  back.rotate(false);
  equal('rotating back undoes the rotation', back.current!.rotation, 0);
  equal('and keeps the piece in place', `${back.current!.x},${back.current!.y}`, '3,5');

  const wall = newGame(3);
  wall.current = { type: 'I', rotation: 1, x: -2, y: 4 };
  check('rotating against a wall succeeds', wall.rotate(true));
  equal('the wall kick pulls the I piece inside', wall.current!.x, 0);
  check('all blocks stay on the board', inBounds('I', wall.current!.x, wall.current!.y));

  const o = newGame(4);
  o.current = { type: 'O', rotation: 0, x: 4, y: 6 };
  o.rotate(true);
  equal('the O piece never moves', `${o.current!.rotation},${o.current!.x},${o.current!.y}`, '1,4,6');
  equal('and keeps its four blocks', pieceCells('O', o.current!.rotation).length, 4);

  for (const type of PIECE_ORDER) {
    for (const from of [0, 1, 2, 3] as Rotation[]) {
      for (const step of [1, 3]) {
        const to = ((from + step) % 4) as Rotation;
        const cw = kickOffsets(type, from, to, true);
        const ccw = kickOffsets(type, from, to, false);
        check(`${type} ${from}->${to} has kicks`, cw.length > 0 && ccw.length > 0);
        equal(`${type} ${from}->${to} starts unshifted`, `${cw[0]!.x},${cw[0]!.y}`, '0,0');
        equal(`${type} ${from}->${to} counter clockwise too`, `${ccw[0]!.x},${ccw[0]!.y}`, '0,0');
        equal(
          `${type} ${from}->${to} counter clockwise mirrors the opposite table`,
          ccw.map((c) => `${c.x},${c.y}`).join(' '),
          kickOffsets(type, to, from, true)
            .map((c) => `${-c.x},${c.y}`)
            .join(' '),
        );
      }
    }
  }
  equal('the guideline tests five kick offsets', kickOffsets('T', 0, 1, true).length, 5);
  equal('and five for the I piece', kickOffsets('I', 0, 1, true).length, 5);
  equal('a half turn has no kicks', kickOffsets('T', 0, 2, true).length, 0);

  // Rotating must never push a block off the field.
  const fuzz = newGame(9);
  let escaped = 0;
  let rotations = 0;
  for (const type of PIECE_ORDER) {
    for (const rotation of [0, 1, 2, 3] as Rotation[]) {
      for (let x = 0; x < COLS; x += 1) {
        for (const clockwise of [true, false]) {
          fuzz.current = { type, rotation, x, y: 5 };
          if (!fuzz.rotate(clockwise)) continue;
          rotations += 1;
          for (const cell of pieceCells(type, fuzz.current!.rotation)) {
            const bx = fuzz.current!.x + cell.x;
            const by = fuzz.current!.y + cell.y;
            if (bx < 0 || bx >= COLS || by < 0 || by >= ROWS) escaped += 1;
          }
        }
      }
    }
  }
  check('the fuzz test rotated something', rotations > 100, `${rotations} rotations`);
  equal('rotations never leave the field', escaped, 0);
}

// --- t-spin detection ------------------------------------------------------

section('t-spin detection');
{
  const corners = new Set(['0,0', '2,0', '0,2']);
  const filled = (x: number, y: number): boolean => corners.has(`${x},${y}`);
  equal('the last kick is a full t-spin', detectTSpin('T', 0, 0, 0, 4, () => true), 'full');
  equal('an earlier kick with three corners is a mini', detectTSpin('T', 0, 0, 0, 2, filled), 'mini');
  equal('two corners are not enough', detectTSpin('T', 0, 0, 0, 2, (_x, y) => y !== 2), 'none');
  equal('no rotation means no t-spin', detectTSpin('T', 0, 0, 0, null, () => true), 'none');
  equal('other pieces never t-spin', detectTSpin('L', 0, 0, 0, 4, () => true), 'none');
  equal(
    'a piece pointing down is judged by the corners below it',
    detectTSpin('T', 2, 0, 0, 1, (x, y) => x === 0 && y === 2),
    'none',
  );
  equal(
    'and finds them there',
    detectTSpin('T', 2, 0, 0, 1, (x, y) => ((x === 0 || x === 2) && y === 2) || (x === 0 && y === 0)),
    'mini',
  );
}

// --- gravity and lock delay ------------------------------------------------

section('gravity and lock delay');
{
  const falling = newGame(5);
  const startY = falling.current!.y;
  falling.update(999);
  equal('nothing happens before the gravity step', falling.current!.y, startY);
  falling.update(2);
  equal('gravity moves the piece one row', falling.current!.y, startY + 1);

  const resting = newGame(6);
  dropToFloor(resting);
  check('the piece rests on the floor', resting.isGrounded);
  resting.update(499);
  equal('no lock before the delay elapsed', resting.piecesPlaced, 0);
  resting.update(2);
  equal('lock after 500ms', resting.piecesPlaced, 1);

  const nudged = newGame(7);
  dropToFloor(nudged);
  check('a grounded piece can slide', nudged.moveLeft());
  nudged.update(499);
  equal('sliding restarts the lock delay', nudged.piecesPlaced, 0);
  nudged.update(2);
  equal('and it locks afterwards', nudged.piecesPlaced, 1);

  const stubborn = newGame(8);
  dropToFloor(stubborn);
  for (let i = 0; i < 20; i += 1) {
    stubborn.move(i % 2 === 0 ? -1 : 1);
    stubborn.update(400);
  }
  equal('the lock delay can be reset at most 15 times', stubborn.piecesPlaced, 1);

  const soft = newGame(10);
  const softStart = soft.current!.y;
  soft.setSoftDropping(true);
  soft.update(20);
  equal('soft drop falls every 20ms', soft.current!.y, softStart + 1);
  soft.setSoftDropping(false);

  const frozen = newGame(12);
  dropToFloor(frozen);
  frozen.togglePause();
  frozen.update(5000);
  equal('a paused game does not advance', frozen.piecesPlaced, 0);
  equal('nor does it score', frozen.score, 0);
  frozen.togglePause();
  equal('unpausing resumes play', frozen.state, 'playing');
}

// --- movement --------------------------------------------------------------

section('movement');
{
  const game = newGame(13);
  const startX = game.current!.x;
  check('can move left', game.moveLeft());
  equal('moved one left', game.current!.x, startX - 1);
  check('can move right', game.moveRight());
  equal('back to the start', game.current!.x, startX);
  equal('a move of zero does nothing', game.move(0), false);

  const wall = newGame(14);
  wall.current = { type: 'O', rotation: 0, x: 0, y: 4 };
  equal('the left wall blocks movement', wall.moveLeft(), false);
  wall.current = { type: 'O', rotation: 0, x: COLS - 2, y: 4 };
  equal('the right wall blocks movement', wall.moveRight(), false);

  const soft = newGame(15);
  const softStartY = soft.current!.y;
  check('a soft drop tap steps down', soft.softDropStep());
  equal('soft drop moves one row', soft.current!.y, softStartY + 1);
  equal('and scores one point', soft.score, 1);

  const hard = newGame(16);
  const distance = hard.ghostY - hard.current!.y;
  hard.hardDrop();
  equal('hard drop scores two points per row', hard.score, distance * 2);
  equal('and locks the piece', hard.piecesPlaced, 1);
  equal('the piece is on the field', hard.playfield.filled, 4);
}

// --- hold ------------------------------------------------------------------

section('hold');
{
  const game = newGame(17);
  queue(game, ['L', 'J', 'S', 'T', 'Z']);
  const first = game.current!.type;
  check('holding succeeds', game.holdPiece());
  equal('the hold slot took the piece', game.hold, first);
  equal('the next piece spawned', game.current!.type, 'L');
  equal('hold is locked right away', game.holdPiece(), false);
  game.hardDrop();
  equal('the queue moved on', game.current!.type, 'J');
  check('hold unlocks once the piece locks', game.holdPiece());
  equal('the held piece swapped in', game.current!.type, first);
  equal('and the dropped piece is held now', game.hold, 'J');
  equal('the queue moved on again', game.next[0], 'S');
}

// --- line clears -----------------------------------------------------------

section('line clears');
{
  // A single: one gap in the bottom row, an I piece fills it. The stray block
  // up left keeps the field from being empty, so this is not a perfect clear.
  const single = newGame(18);
  queue(single, ['I']);
  fillGameRow(single, ROWS - 1, [9]);
  put(single.playfield, 0, ROWS - 5);
  single.current = { type: 'I', rotation: 1, x: 7, y: 0 };
  const singleDistance = single.ghostY - single.current!.y;
  const singleScore = single.score;
  single.hardDrop();
  equal('one line cleared', single.lines, 1);
  equal('a single scores 100', single.score - singleScore, 100 + singleDistance * 2);
  equal('announced as a single', single.lastClear?.label, 'SINGLE');

  // A tetris: four gaps in four rows, a vertical I fills them.
  const tetris = newGame(19);
  queue(tetris, ['I']);
  for (let y = ROWS - 4; y < ROWS; y += 1) fillGameRow(tetris, y, [9]);
  put(tetris.playfield, 0, ROWS - 6);
  tetris.current = { type: 'I', rotation: 1, x: 7, y: 0 };
  const tetrisDistance = tetris.ghostY - tetris.current!.y;
  const tetrisScore = tetris.score;
  tetris.hardDrop();
  equal('four lines cleared', tetris.lines, 4);
  equal('a tetris scores 800', tetris.score - tetrisScore, 800 + tetrisDistance * 2);
  equal('announced as a tetris', tetris.lastClear?.label, 'TETRIS');
  check('back to back is now armed', tetris.backToBack);

  // Two tetrises in a row: the second one is worth 1.5x.
  const b2b = newGame(20);
  queue(b2b, ['I', 'I']);
  for (let y = ROWS - 4; y < ROWS; y += 1) fillGameRow(b2b, y, [9]);
  put(b2b.playfield, 0, ROWS - 6);
  b2b.current = { type: 'I', rotation: 1, x: 7, y: 0 };
  b2b.hardDrop();
  for (let y = ROWS - 4; y < ROWS; y += 1) fillGameRow(b2b, y, [9]);
  put(b2b.playfield, 1, ROWS - 6);
  const beforeB2B = b2b.score;
  b2b.current = { type: 'I', rotation: 1, x: 7, y: 0 };
  const b2bDistance = b2b.ghostY - b2b.current!.y;
  b2b.hardDrop();
  equal('back to back tetris is worth 1.5x plus a combo', b2b.score - beforeB2B, 1250 + b2bDistance * 2);
  equal('and counts the lines', b2b.lines, 8);

  // A combo: two singles in a row.
  const combo = newGame(21);
  queue(combo, ['O', 'O', 'O']);
  fillGameRow(combo, ROWS - 1, [0, 1]);
  put(combo.playfield, 5, ROWS - 6);
  combo.current = { type: 'O', rotation: 0, x: 0, y: 0 };
  const firstDrop = combo.ghostY - combo.current!.y;
  const beforeCombo = combo.score;
  combo.hardDrop();
  equal('the first clear of a combo', combo.score - beforeCombo, 100 + firstDrop * 2);
  equal('no combo bonus yet', combo.combo, 0);
  fillGameRow(combo, ROWS - 1, [0, 1]);
  const beforeSecond = combo.score;
  const secondDrop = combo.ghostY - combo.current!.y;
  combo.hardDrop();
  equal('the second clear adds a combo bonus', combo.score - beforeSecond, 150 + secondDrop * 2);
  equal('combo counter', combo.combo, 1);
  combo.hardDrop();
  equal('the combo ends without a clear', combo.combo, -1);
  check('and back to back was dropped', !combo.backToBack);

  // A perfect clear: the last gap of the last row.
  const perfect = newGame(22);
  queue(perfect, ['I']);
  fillGameRow(perfect, ROWS - 1, [0, 1, 2, 3]);
  perfect.current = { type: 'I', rotation: 0, x: 3, y: 0 };
  perfect.moveLeft();
  perfect.moveLeft();
  perfect.moveLeft();
  const perfectDistance = perfect.ghostY - perfect.current!.y;
  const beforePerfect = perfect.score;
  perfect.hardDrop();
  equal('perfect clear scores 100 + 800', perfect.score - beforePerfect, 900 + perfectDistance * 2);
  check('and leaves an empty field', perfect.playfield.isEmpty());
  equal('announced as a perfect clear', perfect.lastClear?.label, 'SINGLE · PERFECT CLEAR');

  // Levels: every ten lines.
  const levels = newGame(23);
  queue(levels, ['I', 'I', 'I']);
  for (let round = 0; round < 3; round += 1) {
    for (let y = ROWS - 4; y < ROWS; y += 1) fillGameRow(levels, y, [9]);
    put(levels.playfield, round, ROWS - 6);
    levels.current = { type: 'I', rotation: 1, x: 7, y: 0 };
    levels.hardDrop();
  }
  equal('twelve lines cleared', levels.lines, 12);
  equal('which is level two', levels.level, 2);
  check('the score grew', levels.score > 3000, `score ${levels.score}`);
}

// --- t-spin scoring --------------------------------------------------------

section('t-spin scoring');
{
  // Classic T-spin double: the T drops into a notch, then rotates down into the
  // slot on the last kick offset.
  const game = newGame(24);
  queue(game, ['T']);
  fillGameRow(game, ROWS - 6, [3, 4, 5]); // row 16: the ledge
  fillGameRow(game, ROWS - 5, [4]); // row 17: the drop for the nub
  fillGameRow(game, ROWS - 4, [5]); // row 18: the single gap of the top clear
  fillGameRow(game, ROWS - 3, [5, 6]); // row 19: the two gaps of the lower clear
  fillGameRow(game, ROWS - 2, [4, 5]); // row 20: the slot floor
  game.current = { type: 'T', rotation: 2, x: 3, y: ROWS - 6 };
  const before = game.score;
  check('the tuck rotation works', game.rotate(true));
  equal('the T ends up in the slot', `${game.current!.rotation},${game.current!.x},${game.current!.y}`, `3,4,${ROWS - 4}`);
  game.hardDrop();
  equal('two lines cleared', game.lines, 2);
  equal('a t-spin double scores 1200', game.score - before, 1200);
  equal('announced as a t-spin double', game.lastClear?.label, 'T-SPIN DOUBLE');
  check('back to back is armed', game.backToBack);

  // The same slot, but the piece is placed there without rotating into it:
  // the lines still clear, yet it is a plain double instead of a t-spin.
  const placed = newGame(25);
  queue(placed, ['T']);
  fillGameRow(placed, ROWS - 6, [3, 4, 5]);
  fillGameRow(placed, ROWS - 5, [4]);
  fillGameRow(placed, ROWS - 4, [5]);
  fillGameRow(placed, ROWS - 3, [5, 6]);
  fillGameRow(placed, ROWS - 2, [4, 5]);
  placed.current = { type: 'T', rotation: 3, x: 4, y: ROWS - 4 };
  const beforePlace = placed.score;
  placed.hardDrop();
  equal('the same two lines clear', placed.lines, 2);
  equal('but without a rotation it is a plain double', placed.score - beforePlace, 300);
  equal('announced as a double', placed.lastClear?.label, 'DOUBLE');
  check('and back to back stays off', !placed.backToBack);
}

// --- ghost piece -----------------------------------------------------------

section('ghost piece');
{
  const game = newGame(26);
  game.current = { type: 'I', rotation: 0, x: 3, y: 0 };
  equal('the ghost rests on the floor', game.ghostY, ROWS - 2);
  put(game.playfield, 4, 10);
  equal('and stops above the stack', game.ghostY, 8);
  const ghost = game.ghostCells();
  equal('the ghost has four blocks', ghost.length, 4);
  check(
    'none of them collide',
    ghost.every((c) => !game.playfield.isOccupied(c.x, c.y)),
  );
  equal('the active piece is still up top', game.current!.y, 0);
}

// --- top out ---------------------------------------------------------------

section('top out');
{
  const locked = newGame(27);
  for (let y = 0; y < ROWS; y += 1) fillGameRow(locked, y, [0]);
  locked.hardDrop();
  equal('locking above the field ends the game', locked.state, 'gameover');
  equal('and the piece is gone', locked.current, null);

  const blocked = newGame(28);
  fillGameRow(blocked, 0);
  fillGameRow(blocked, 1);
  blocked.holdPiece();
  equal('a blocked spawn ends the game', blocked.state, 'gameover');

  const ignored = newGame(29);
  ignored.state = 'gameover';
  equal('a finished game ignores input', ignored.moveLeft(), false);
  equal('and rotations', ignored.rotate(true), false);
  equal('and hard drops', ignored.hardDrop(), false);

  const restart = newGame(30);
  restart.score = 500;
  restart.lines = 40;
  restart.reset();
  equal('restart resets the score', restart.score, 0);
  equal('restart resets the lines', restart.lines, 0);
  equal('restart resets the state', restart.state, 'playing');
  check('restart empties the field', restart.playfield.isEmpty());
  equal('restart refills the queue', restart.next.length, 5);
  check('restart puts a piece on the field', restart.current !== null);
  equal('restart clears the hold slot', restart.hold, null);
}

// --- pieces ----------------------------------------------------------------

section('pieces');
{
  for (const type of PIECE_ORDER) {
    const box = previewBox(type);
    const srs = pieceBox(type);
    equal(`${type} preview has four blocks`, box.cells.length, 4);
    check(`${type} preview starts at the origin`, box.cells.every((c) => c.x >= 0 && c.y >= 0));
    check(
      `${type} preview fits its box`,
      box.cells.every((c) => c.x < box.width && c.y < box.height),
    );
    for (const rotation of [0, 1, 2, 3] as Rotation[]) {
      const cells = pieceCells(type, rotation);
      equal(`${type} rotation ${rotation} has four blocks`, cells.length, 4);
      equal(
        `${type} rotation ${rotation} has no duplicate blocks`,
        new Set(cells.map((c) => `${c.x},${c.y}`)).size,
        4,
      );
      check(
        `${type} rotation ${rotation} stays inside its srs box`,
        cells.every((c) => c.x >= 0 && c.x < srs.width && c.y >= 0 && c.y < srs.height),
      );
    }
  }
}

// --- long run --------------------------------------------------------------

section('long run');
{
  const game = newGame(32);
  let frames = 0;
  while (game.state === 'playing' && frames < 20000) {
    frames += 1;
    game.update(16);
    autoPlace(game);
  }
  check('the bot stacked a long game', game.piecesPlaced > 60, `${game.piecesPlaced} pieces`);
  equal('the game ended by topping out', game.state, 'gameover');
  check('lines were cleared', game.lines > 20, `${game.lines} lines`);
  check('the level followed the lines', game.level === 1 + Math.floor(game.lines / 10));
  check('the score is a sane number', Number.isFinite(game.score) && game.score > 1000);
  check('no piece is left in flight', game.current === null);
  check(
    'the field never grew past its bounds',
    game.playfield.toRows().length === ROWS &&
      game.playfield.toRows().every((row) => row.length === COLS),
  );
  check(
    'the field holds no more blocks than were dropped',
    game.playfield.filled <= game.piecesPlaced * 4,
    `${game.playfield.filled} blocks, ${game.piecesPlaced} pieces`,
  );
  equal('geometry constants agree', ROWS, VISIBLE_ROWS + HIDDEN_ROWS);
}

// --------------------------------------------------------------------------

if (failures === 0) {
  console.log(`ok  ${checks} checks passed`);
} else {
  console.error(`${failures} of ${checks} checks failed`);
}
process.exit(failures === 0 ? 0 : 1);