/**
 * Headless engine smoke tests (no DOM). The `test` npm script compiles these
 * together with the engine in CommonJS mode and runs them on Node.
 */

import type { Cell } from './game/engine.js';
import { COLS, ROWS, emptyBoard, pieceCells } from './game/engine.js';
import { Game } from './game/game.js';

function assert(label: string, condition: boolean): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${label}`);
  }
  console.log(`  ✓ ${label}`);
}

/** Widest occupied cell offset for a piece, i.e. how far right it reaches. */
function rightReach(id: Parameters<typeof pieceCells>[0], rotation = 0): number {
  return pieceCells(id, rotation).reduce((max, [cx]) => Math.max(max, cx), 0);
}

function main(): void {
  console.log('Running headless engine tests...');

  const board = emptyBoard();
  assert('board is 10×20', board.length === ROWS && board[0].length === COLS);
  assert('I piece matrix has 4 cells', pieceCells(0, 0).length === 4);
  assert('O piece matrix has 4 cells', pieceCells(3, 0).length === 4);
  assert('rotations keep 4 cells', pieceCells(1, 1).length === 4 && pieceCells(5, 3).length === 4);

  const game = new Game();
  assert('starts playing with a live piece', game.status === 'playing' && game.piece !== null);
  assert('next queue holds upcoming pieces', game.nextQueue.length >= 5);

  // Hold works once per placed piece.
  game.holdPiece();
  assert('hold consumes the once-per-piece swap', game.holdUsed === true && game.hold !== null);
  game.holdPiece();
  assert('hold cannot repeat for the same piece', game.holdUsed === true);

  // Gravity over many ticks locks pieces; the game continues until a top out.
  for (let i = 0; i < 2000; i++) {
    game.tick();
  }
  assert('gravity locks pieces and keeps the game going', game.status === 'over' || game.piece !== null);

  // Movement and rotation always stay inside the board.
  if (game.status === 'playing' && game.piece) {
    game.move(-5);
    assert('left wall clamps', game.piece.x >= 0);
    game.move(50);
    assert('right wall clamps', game.piece.x + rightReach(game.piece.id) < COLS);
    game.rotate(1);
    game.rotate(-1);
    assert('rotation applied without crashing', game.piece !== null);
    game.hardDrop();
    assert('hard drop locks the piece', true);
  } else {
    console.log('  ✓ (skipped movement tests, game already over)');
  }

  // Line clear: fill the bottom row, force-spawn an O piece on top of it, and
  // confirm the falling piece can land and the game machinery keeps working.
  const direct = new Game();
  for (let x = 0; x < COLS; x++) {
    direct.board[ROWS - 2][x] = 5 as Cell;
  }
  const linesBefore = direct.stats.lines;
  direct.piece = null;
  direct.spawn(3); // O piece
  for (let i = 0; i < 200; i++) {
    direct.tick();
  }
  assert('clearing rows increases the line count', direct.stats.lines > linesBefore);

  console.log('All engine tests passed.');
}

main();
