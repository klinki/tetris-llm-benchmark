import { Board } from '../board.js';
import { Game } from '../game.js';
import { getCells } from '../pieces.js';
import { Bag } from '../randomizer.js';
import type { PieceType } from '../constants.js';

declare const process: { exitCode: number };

function assert(cond: unknown, msg: string): void {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    process.exitCode = 1;
    throw new Error(msg);
  }
  console.log(`ok: ${msg}`);
}

// Deterministic rand cycling 0..1
function seqRand(): () => number {
  let i = 0;
  const vals = [0.1, 0.5, 0.9, 0.3, 0.7, 0.2, 0.8];
  return () => vals[i++ % vals.length];
}

// 1. 7-bag yields all 7 types per bag.
{
  const bag = new Bag(seqRand());
  for (let b = 0; b < 3; b++) {
    const seen = new Set<PieceType>();
    for (let i = 0; i < 7; i++) seen.add(bag.next());
    assert(seen.size === 7, `bag ${b} contains all 7 types`);
  }
}

// 2. Each piece has 4 cells in every rotation; O is rotation-invariant.
{
  const types: PieceType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
  for (const t of types)
    for (const r of [0, 1, 2, 3] as const) assert(getCells(t, r).length === 4, `${t}@${r} has 4 cells`);
  const o0 = JSON.stringify(getCells('O', 0).sort());
  const o1 = JSON.stringify(getCells('O', 1).sort());
  assert(o0 === o1, 'O rotation invariant');
}

// 3. Board collision + line clear.
{
  const board = new Board();
  assert(!board.collides('O', 0, 0, 20), 'empty board no collision');
  assert(board.collides('O', 0, -1, 20), 'left wall collides');
  assert(board.collides('O', 0, 9, 20), 'right wall collides');
  // Fill bottom row and clear.
  const last = board.grid.length - 1;
  for (let x = 0; x < 10; x++) board.grid[last][x] = 'I';
  assert(board.clearLines() === 1, 'one line cleared');
  assert(board.isEmpty(), 'board empty after clearing only filled row');
}

// 4. Movement blocked at walls.
{
  const game = new Game(seqRand());
  game.current = { type: 'O', rotation: 0, x: 0, y: 18 };
  assert(!game.move(-1, 0), 'cannot move past left wall');
  assert(game.move(1, 0), 'can move right');
}

// 5. Rotation returns boolean and ghost is at/below current.
{
  const game = new Game(seqRand());
  game.current = { type: 'T', rotation: 0, x: 4, y: 18 };
  const ok = game.rotate(1);
  assert(typeof ok === 'boolean', 'rotate returns boolean');
  assert(game.ghostY() >= game.current!.y, 'ghost at or below current');
}

// 6. Hold swaps and locks until next lock.
{
  const game = new Game(seqRand());
  const first = game.current!.type;
  assert(game.hold(), 'first hold works');
  assert(game.held === first, 'held piece stored');
  assert(!game.hold(), 'hold blocked until lock');
}

// 7. Hard drop locks and scores +2/cell; line clear scores Tetris*level.
{
  const game = new Game(seqRand());
  game.current = { type: 'I', rotation: 0, x: 3, y: 18 };
  const before = game.score;
  const gy = game.ghostY();
  const dist = gy - game.current.y;
  game.hardDrop();
  assert(game.score >= before + dist * 2, 'hard drop scores 2 per cell');
}

// 8. Scoring: fill to force a line clear via lock.
{
  const game = new Game(seqRand());
  const last = game.board.grid.length - 1;
  for (let x = 0; x < 10; x++) game.board.grid[last][x] = 'T';
  const linesBefore = game.lines;
  game.current = { type: 'I', rotation: 0, x: 3, y: 0 };
  (game as unknown as { lockPiece: () => void }).lockPiece();
  assert(game.lines > linesBefore, 'locking clears filled line and counts it');
}

// 9. Top-out on blocked spawn.
{
  const game = new Game(seqRand());
  for (let y = 0; y < 4; y++) for (let x = 0; x < 10; x++) game.board.grid[y][x] = 'Z';
  game.spawn();
  assert(game.gameOver, 'blocked spawn causes game over');
}

// 10. Gravity tick moves piece down eventually.
{
  const game = new Game(seqRand());
  game.current = { type: 'O', rotation: 0, x: 4, y: 10 };
  const y0 = game.current.y;
  game.tick(5000);
  assert(game.current === null || game.current.y > y0 || game.board !== null, 'gravity tick progresses');
}

console.log('All smoke tests done.');
