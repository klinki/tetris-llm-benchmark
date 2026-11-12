import { Board } from '../src/core/board.js';
import { Game } from '../src/core/game.js';
import { cellsOf, type PieceType } from '../src/core/pieces.js';
import { PieceBag } from '../src/core/randomizer.js';
import { scoreClear } from '../src/core/scoring.js';
import { assertDeepEqual, assertEqual, assertOk, describe, it, run } from './harness.js';

const BOTTOM_ROW = 21;

/** Creates a game with a deterministic piece order. */
function makeGame(): Game {
  return new Game(() => 0);
}

/** Fills the given cells of a row. */
function fillRow(game: Game, row: number, columns: readonly number[]): void {
  for (const x of columns) game.board.cells[row * game.board.width + x] = 1;
}

describe('7-bag randomizer', () => {
  it('delivers every piece exactly once per bag', () => {
    const bag = new PieceBag(() => 0.5);
    for (let i = 0; i < 10; i++) {
      const round: PieceType[] = [];
      for (let j = 0; j < 7; j++) round.push(bag.next());
      assertEqual(new Set(round).size, 7, 'every bag holds seven distinct pieces');
    }
  });

  it('is evenly distributed over many pieces', () => {
    const bag = new PieceBag();
    const counts = new Map<PieceType, number>();
    for (let i = 0; i < 700; i++) {
      const type = bag.next();
      counts.set(type, (counts.get(type) ?? 0) + 1);
    }
    assertEqual(counts.size, 7);
    for (const count of counts.values()) assertEqual(count, 100);
  });
});

describe('shapes', () => {
  it('uses the SRS layout for the T piece', () => {
    assertDeepEqual(
      cellsOf('T', 0)
        .map(([x, y]) => `${x},${y}`)
        .sort(),
      ['0,1', '1,0', '1,1', '2,1'],
    );
    assertDeepEqual(
      cellsOf('T', 1)
        .map(([x, y]) => `${x},${y}`)
        .sort(),
      ['1,0', '1,1', '1,2', '2,1'],
    );
    assertDeepEqual(
      cellsOf('T', 2)
        .map(([x, y]) => `${x},${y}`)
        .sort(),
      ['0,1', '1,1', '1,2', '2,1'],
    );
  });

  it('rotates the I piece into a vertical column', () => {
    assertDeepEqual(
      cellsOf('I', 1)
        .map(([x, y]) => `${x},${y}`)
        .sort(),
      ['2,0', '2,1', '2,2', '2,3'],
    );
  });

  it('keeps the O piece in place while rotating', () => {
    for (let rotation = 0; rotation < 4; rotation++) {
      assertDeepEqual(
        cellsOf('O', rotation)
          .map(([x, y]) => `${x},${y}`)
          .sort(),
        ['0,0', '0,1', '1,0', '1,1'],
      );
    }
  });
});

describe('board', () => {
  it('detects filled rows and shifts the stack down', () => {
    const board = new Board();
    for (let x = 0; x < board.width; x++) board.cells[BOTTOM_ROW * board.width + x] = 1;
    board.cells[(BOTTOM_ROW - 1) * board.width + 0] = 1;

    const rows = board.findFullRows();
    assertDeepEqual(rows, [BOTTOM_ROW]);

    board.clearRows(rows);
    assertDeepEqual(board.findFullRows(), []);
    assertEqual(board.cells[(BOTTOM_ROW - 1) * board.width + 0], 0);
    assertEqual(board.cells[BOTTOM_ROW * board.width + 0], 1);
  });
});

describe('scoring', () => {
  it('scores single, double, triple and tetris', () => {
    const scores = [0, 100, 300, 500, 800];
    for (let lines = 1; lines <= 4; lines++) {
      const result = scoreClear({ lines, tspin: 'none', level: 1, combo: -1, backToBack: false });
      assertEqual(result.points, scores[lines]!);
    }
  });

  it('multiplies with the level', () => {
    const result = scoreClear({ lines: 4, tspin: 'none', level: 3, combo: -1, backToBack: false });
    assertEqual(result.points, 2400);
  });

  it('adds combo points and applies the back to back multiplier', () => {
    const first = scoreClear({ lines: 1, tspin: 'none', level: 1, combo: -1, backToBack: false });
    assertEqual(first.points, 100);
    assertEqual(first.combo, 0);

    const second = scoreClear({ lines: 1, tspin: 'none', level: 1, combo: 0, backToBack: false });
    assertEqual(second.points, 150);
    assertEqual(second.combo, 1);

    const backToBack = scoreClear({ lines: 4, tspin: 'none', level: 1, combo: -1, backToBack: true });
    assertEqual(backToBack.points, 1200);
    assertEqual(backToBack.backToBack, true);
  });

  it('scores t-spins', () => {
    const full = scoreClear({ lines: 2, tspin: 'full', level: 1, combo: -1, backToBack: false });
    assertEqual(full.points, 1200);
    const single = scoreClear({ lines: 1, tspin: 'full', level: 1, combo: -1, backToBack: false });
    assertEqual(single.points, 800);
    const mini = scoreClear({ lines: 0, tspin: 'mini', level: 1, combo: -1, backToBack: false });
    assertEqual(mini.points, 100);
  });
});

describe('game', () => {
  it('spawns a piece and keeps the next queue filled', () => {
    const game = makeGame();
    assertOk(game.current);
    assertEqual(game.queue.length, 5);
    assertEqual(game.status, 'playing');
  });

  it('clears a single line and scores it', () => {
    const game = makeGame();
    fillRow(game, BOTTOM_ROW, [0, 1, 2, 3, 4, 5, 6, 7, 8]);
    game.current = { type: 'I', rotation: 1, x: 7, y: 1 };

    game.hardDrop();

    assertEqual(game.lines, 1);
    assertEqual(game.score, 100 + 17 * 2);
    assertDeepEqual(game.board.findFullRows(), []);
  });

  it('clears four lines for a tetris', () => {
    const game = makeGame();
    for (let row = BOTTOM_ROW - 3; row <= BOTTOM_ROW; row++) {
      fillRow(game, row, [0, 1, 2, 3, 4, 5, 6, 7, 8]);
    }
    game.current = { type: 'I', rotation: 1, x: 7, y: 1 };

    game.hardDrop();

    assertEqual(game.lines, 4);
    assertEqual(game.score, 800 + 17 * 2);
    assertEqual(game.board.findFullRows().length, 0);
  });

  it('awards soft drop points', () => {
    const game = makeGame();
    game.current = { type: 'O', rotation: 0, x: 4, y: 1 };
    game.setSoftDrop(true);
    game.update(100);
    game.setSoftDrop(false);

    assertOk(game.score > 0, 'soft drop awards points');
  });

  it('swaps the piece with the hold slot only once per piece', () => {
    const game = makeGame();
    const first = game.current!.type;
    game.holdPiece();
    assertEqual(game.hold, first);
    assertEqual(game.holdUsed, true);
    const second = game.current!.type;

    game.holdPiece();
    assertEqual(game.hold, first);
    assertEqual(game.current!.type, second);
  });

  it('allows holding again after a piece was locked', () => {
    const game = makeGame();
    game.holdPiece();
    assertEqual(game.holdUsed, true);
    game.hardDrop();
    assertEqual(game.holdUsed, false);
    game.holdPiece();
    assertEqual(game.holdUsed, true);
  });

  it('computes the ghost piece position', () => {
    const game = makeGame();
    game.current = { type: 'O', rotation: 0, x: 4, y: 1 };
    assertEqual(game.ghost()!.y, 20);
  });

  it('applies wall kicks when rotating on the floor', () => {
    const game = makeGame();
    game.current = { type: 'T', rotation: 0, x: 3, y: 20 };

    assertEqual(game.rotate(1), true);
    assertEqual(game.current!.rotation, 1);
    assertEqual(game.current!.x, 2);
    assertEqual(game.current!.y, 19);
  });

  it('refuses to rotate when the piece is blocked', () => {
    const game = makeGame();
    // Fill a single column so that no rotation fits.
    for (let row = 0; row < game.board.height; row++) game.board.cells[row * game.board.width + 4] = 1;
    game.current = { type: 'T', rotation: 0, x: 3, y: 1 };
    assertEqual(game.rotate(1), false);
    assertEqual(game.current!.rotation, 0);
  });

  it('locks the piece after the lock delay', () => {
    const game = makeGame();
    game.current = { type: 'O', rotation: 0, x: 4, y: 20 };

    game.update(250);
    assertEqual(game.current!.type, 'O');

    game.update(250);
    assertOk(game.current!.type !== 'O', 'the piece was locked');
  });

  it('resets the lock delay when the piece is moved', () => {
    const game = makeGame();
    game.current = { type: 'O', rotation: 0, x: 4, y: 20 };

    game.update(250);
    game.moveLeft();
    game.update(250);
    assertEqual(game.current!.type, 'O');

    game.update(250);
    assertOk(game.current!.type !== 'O', 'the piece was locked');
  });

  it('ends the game when the spawn is blocked', () => {
    const game = makeGame();
    // Block the spawn area of every piece without completing a row.
    for (const x of [3, 4, 5, 6]) game.board.cells[1 * game.board.width + x] = 1;
    for (const x of [3, 4, 5]) game.board.cells[2 * game.board.width + x] = 1;

    game.hardDrop();

    assertEqual(game.status, 'gameover');
  });

  it('starts over when the game is reset', () => {
    const game = makeGame();
    fillRow(game, BOTTOM_ROW, [0, 1, 2, 3, 4, 5, 6, 7, 8]);
    game.hardDrop();
    assertOk(game.score > 0);

    game.reset();
    assertEqual(game.score, 0);
    assertEqual(game.lines, 0);
    assertEqual(game.level, 1);
    assertEqual(game.status, 'playing');
    assertOk(game.board.isEmpty());
  });

  it('gets faster with every level', () => {
    const game = makeGame();
    const slow = game.gravityInterval();
    game.level = 10;
    assertOk(game.gravityInterval() < slow);
  });
});

run();
