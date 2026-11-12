import { BOARD_ROWS, BOARD_WIDTH, LOCK_DELAY_MS } from '../core/constants.js';
import { Game } from '../core/game.js';
import { gravityMsPerRow } from '../core/gravity.js';
import { getCells, getKickOffsets, PIECE_TYPES, SHAPES } from '../core/pieces.js';
import { SevenBag } from '../core/randomizer.js';
import { levelForLines, lineClearPoints } from '../core/scoring.js';
import type { Piece, PieceType, Rotation } from '../core/types.js';

let checks = 0;
let failures = 0;

function check(name: string, condition: boolean, detail = ''): void {
  checks += 1;
  if (condition) {
    console.log(`  ok   ${name}`);
  } else {
    failures += 1;
    console.error(`  FAIL ${name}${detail ? ` -> ${detail}` : ''}`);
  }
}

function equal(name: string, actual: unknown, expected: unknown): void {
  check(name, Object.is(actual, expected), `expected ${String(expected)}, got ${String(actual)}`);
}

function section(title: string): void {
  console.log(`\n${title}`);
}

function piece(type: PieceType, x: number, y: number, rotation: Rotation = 0): Piece {
  return { type, rotation, x, y };
}

/** A small deterministic random number generator for reproducible bags. */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

section('7-bag randomizer');
{
  const bag = new SevenBag(() => 0.42);
  const first = Array.from({ length: 7 }, () => bag.next());
  const second = Array.from({ length: 7 }, () => bag.next());
  check('a bag holds every piece exactly once', new Set(first).size === 7);
  check('the next bag holds every piece exactly once', new Set(second).size === 7);

  const counts = new Map<PieceType, number>();
  const randomizer = new SevenBag(seededRandom(12345));
  for (let i = 0; i < 700; i += 1) {
    const type = randomizer.next();
    counts.set(type, (counts.get(type) ?? 0) + 1);
  }
  check(
    'every piece appears exactly once per bag over 100 bags',
    counts.size === 7 && [...counts.values()].every((count) => count === 100),
  );
}

section('piece shapes');
{
  let allSized = true;
  let oStable = true;
  for (const type of PIECE_TYPES) {
    for (let rotation = 0; rotation < 4; rotation += 1) {
      if (getCells(type, rotation as Rotation).length !== 4) allSized = false;
    }
    oStable =
      oStable &&
      JSON.stringify(getCells('O', 0)) === JSON.stringify(getCells('O', 1)) &&
      JSON.stringify(getCells('O', 0)) === JSON.stringify(getCells('O', 3));
  }
  check('every piece has four cells in every rotation', allSized);
  check('the O piece does not change when rotated', oStable);

  // Every rotation state has to be the previous one turned by 90 degrees.
  // The I piece is the exception: the guideline draws both of its vertical
  // states in the same column, the wall kicks make up for the difference.
  let consistent = true;
  for (const type of PIECE_TYPES) {
    if (type === 'I') continue;
    const width = SHAPES[type][0][0].length;
    const height = SHAPES[type][0].length;
    const centerX = (width - 1) / 2;
    const centerY = (height - 1) / 2;
    for (let rotation = 0; rotation < 4; rotation += 1) {
      const turned = getCells(type, rotation as Rotation)
        .map((cell) => ({
          x: Math.round(centerX - (cell.y - centerY)),
          y: Math.round(centerY + (cell.x - centerX)),
        }))
        .sort((a, b) => a.y - b.y || a.x - b.x);
      const next = [...getCells(type, ((rotation + 1) % 4) as Rotation)].sort(
        (a, b) => a.y - b.y || a.x - b.x,
      );
      if (JSON.stringify(turned) !== JSON.stringify(next)) consistent = false;
    }
  }
  check('the rotation states follow each other in 90 degree steps', consistent);
}

section('gravity');
{
  equal('level one drops a row per second', Math.round(gravityMsPerRow(1)), 1000);
  check('gravity speeds up with the level', gravityMsPerRow(6) < gravityMsPerRow(2));
  check('gravity is capped at the highest level', gravityMsPerRow(99) === gravityMsPerRow(20));
}

section('wall kicks');
{
  let symmetric = true;
  for (const type of ['J', 'L', 'S', 'T', 'Z'] as PieceType[]) {
    for (let from = 0; from < 4; from += 1) {
      const to = (from + 1) % 4;
      const forward = getKickOffsets(type, from as Rotation, to as Rotation);
      const backward = getKickOffsets(type, to as Rotation, from as Rotation);
      if (forward.length !== backward.length) symmetric = false;
      forward.forEach((offset, index) => {
        const opposite = backward[index];
        if (!opposite || opposite.x !== -offset.x || opposite.y !== -offset.y) symmetric = false;
      });
    }
  }
  check('the kick tables of the JLSTZ pieces mirror each other', symmetric);

  let complete = true;
  for (const type of ['I', 'J', 'L', 'S', 'T', 'Z'] as PieceType[]) {
    for (let from = 0; from < 4; from += 1) {
      const offsets = getKickOffsets(type, from as Rotation, ((from + 1) % 4) as Rotation);
      if (offsets.length !== 5) complete = false;
      if (offsets[0].x !== 0 || offsets[0].y !== 0) complete = false;
    }
  }
  check('every rotation has five kick candidates starting without an offset', complete);

  // The published table of the I piece, flipped to the y down playfield.
  const iKicks = getKickOffsets('I', 0, 1);
  const expected = [
    { x: 0, y: 0 },
    { x: -2, y: 0 },
    { x: 1, y: 0 },
    { x: -2, y: 1 },
    { x: 1, y: -2 },
  ];
  check(
    'the I piece uses the guideline wall kicks',
    JSON.stringify(iKicks) === JSON.stringify(expected),
    JSON.stringify(iKicks),
  );
}

section('rotation');
{
  const game = new Game();
  game.reset();
  const before = game.current?.rotation ?? 0;
  check('the piece rotates', game.rotate(1));
  equal('the rotation state advances', game.current?.rotation, (before + 1) % 4);
  check('the piece rotates back', game.rotate(-1));
  equal('the rotation state returns', game.current?.rotation, before);
}

section('rotation on the floor');
{
  const game = new Game();
  game.reset();
  game.current = piece('I', 3, BOARD_ROWS - 2);
  check('the I piece rotates while resting on the floor', game.rotate(1));
  equal('the wall kick lifts the I piece into the field', game.current?.y, BOARD_ROWS - 4);
  equal('the wall kick shifts the I piece to the right', game.current?.x, 4);
  check('the kicked piece stays inside the board', !game.board.collides(game.current as Piece));
}

section('movement');
{
  const game = new Game();
  game.reset();
  game.current = piece('O', 0, 2);
  check('the piece cannot leave the board on the left', !game.moveLeft());
  check('the piece moves to the right', game.moveRight());
  equal('the piece is one column to the right', game.current?.x, 1);
  game.current = piece('O', BOARD_WIDTH - 2, 2);
  check('the piece cannot leave the board on the right', !game.moveRight());
}

section('hard drop and ghost piece');
{
  const game = new Game();
  game.reset();
  game.current = piece('O', 4, 2);
  const ghost = game.ghost as Piece;
  const distance = ghost.y - (game.current as Piece).y;
  equal('the ghost of a piece rests on the floor', ghost.y, BOARD_ROWS - 2);

  const before = game.score;
  game.hardDrop();
  equal('the piece lands on the floor', game.board.cellAt(4, BOARD_ROWS - 1), 'O');
  equal('a hard drop scores two points per row', game.score - before, distance * 2);

  const second = new Game();
  second.reset();
  second.current = piece('T', 3, 2);
  second.board.setCell(3, 18, 'T');
  equal('the ghost stops above a block', second.ghost?.y, 16);
}

section('line clears');
{
  const game = new Game();
  game.reset();
  for (let x = 0; x < BOARD_WIDTH - 1; x += 1) game.board.setCell(x, BOARD_ROWS - 1, 'J');

  game.current = piece('I', 7, 2, 1);
  const distance = (game.ghost as Piece).y - (game.current as Piece).y;
  const before = game.score;
  game.hardDrop();

  equal('one line is cleared', game.lines, 1);
  equal('a single scores 100 points on top of the drop points', game.score - before, 100 + distance * 2);
  equal('the cleared row is empty afterwards', game.board.cellAt(0, BOARD_ROWS - 1), null);

  for (let x = 0; x < BOARD_WIDTH - 1; x += 1) game.board.setCell(x, BOARD_ROWS - 1, 'J');
  const beforeCombo = game.score;
  game.current = piece('I', 7, 2, 1);
  const comboDistance = (game.ghost as Piece).y - (game.current as Piece).y;
  game.hardDrop();
  equal('two lines are cleared in a row', game.lines, 2);
  equal(
    'the second clear of a combo adds 50 points',
    game.score - beforeCombo,
    150 + comboDistance * 2,
  );
  equal('the combo counts the consecutive clears', game.combo, 1);
}

section('scoring');
{
  equal('a single is worth 100 points', lineClearPoints(1, 1, 0, 0), 100);
  equal('a double is worth 300 points', lineClearPoints(2, 1, 0, 0), 300);
  equal('a triple is worth 500 points', lineClearPoints(3, 1, 0, 0), 500);
  equal('a tetris is worth 800 points', lineClearPoints(4, 1, 0, 0), 800);
  equal('the level multiplies the points', lineClearPoints(4, 3, 0, 0), 2400);
  equal('a combo adds 50 points per line', lineClearPoints(1, 1, 2, 0), 200);
  equal('a chained tetris gets the back-to-back bonus', lineClearPoints(4, 1, 0, 2), 1250);
  equal('the level rises every ten lines', levelForLines(10), 2);
  equal('the level is capped', levelForLines(999), 20);
}

section('soft drop');
{
  const game = new Game();
  game.reset();
  game.current = piece('O', 4, 2);
  game.setSoftDrop(true);
  const before = game.score;
  game.tick(200);
  equal('the soft drop moves the piece down', game.current?.y, 6);
  equal('the soft drop scores a point per row', game.score - before, 4);
  game.setSoftDrop(false);
}

section('gravity');
{
  const game = new Game();
  game.reset();
  const start = game.current?.y ?? 0;
  game.tick(1000);
  equal('a piece falls one row per second on level one', game.current?.y, start + 1);
}

section('lock delay');
{
  const game = new Game();
  game.reset();
  game.current = piece('O', 4, BOARD_ROWS - 2);
  game.tick(LOCK_DELAY_MS - 100);
  check('a resting piece waits for the lock delay', game.board.cellAt(4, BOARD_ROWS - 1) === null);
  game.tick(200);
  check('a resting piece locks when the delay elapsed', game.board.cellAt(4, BOARD_ROWS - 1) === 'O');

  const moving = new Game();
  moving.reset();
  moving.current = piece('O', 4, BOARD_ROWS - 2);
  moving.tick(400);
  moving.moveLeft();
  moving.tick(400);
  check('moving the piece postpones the lock', moving.board.cellAt(4, BOARD_ROWS - 1) === null);
  moving.tick(200);
  check('the piece locks once the delay elapsed again', moving.board.cellAt(3, BOARD_ROWS - 1) === 'O');
}

section('hold');
{
  const game = new Game();
  game.reset();
  const first = game.current?.type as PieceType;
  check('the first hold works', game.holdPiece());
  equal('the piece is kept in the hold slot', game.hold, first);
  check('a second hold in a row is refused', !game.holdPiece());
  equal('the hold slot is unchanged', game.hold, first);

  const swapping = new Game();
  swapping.reset();
  const original = swapping.current?.type as PieceType;
  swapping.holdPiece();
  swapping.hardDrop();
  const active = swapping.current?.type as PieceType;
  check('holding is possible again after a piece was locked', swapping.holdPiece());
  equal('the held piece comes back', swapping.current?.type, original);
  equal('the active piece goes into the hold slot', swapping.hold, active);
}

section('top out');
{
  const game = new Game();
  game.reset();
  // Block the spawn area without completing a row.
  for (let y = 2; y < 5; y += 1) {
    for (let x = 0; x < BOARD_WIDTH - 1; x += 1) game.board.setCell(x, y, 'J');
  }
  game.current = piece('O', 0, BOARD_ROWS - 2);
  game.hardDrop();
  equal('a blocked spawn ends the game', game.status, 'gameover');
  equal('the piece is removed from the board', game.current, null);

  game.reset();
  equal('the game restarts', game.status, 'playing');
  equal('the score starts at zero', game.score, 0);
  equal('the board is empty', game.board.cellAt(0, BOARD_ROWS - 1), null);
}

section('pause');
{
  const game = new Game();
  game.reset();
  game.togglePause();
  equal('the game is paused', game.status, 'paused');
  const start = game.current?.y ?? 0;
  game.tick(2000);
  equal('a paused game does not move', game.current?.y, start);
  game.togglePause();
  equal('the game continues', game.status, 'playing');
}

if (failures > 0) {
  throw new Error(`${failures} of ${checks} checks failed`);
}
console.log(`\nAll ${checks} checks passed.`);
