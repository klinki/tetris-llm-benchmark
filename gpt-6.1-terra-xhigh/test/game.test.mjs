import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, blocks, BUFFER, HEIGHT, WIDTH } from '../dist/game.js';

test('each seven-bag contains every piece once', () => {
  const game = new Game(() => 0.4);
  const seen = [game.current.kind];
  for (let i = 0; i < 13; i++) { game.hardDrop(); seen.push(game.current.kind); game.board = game.board.map(row => row.map(() => null)); }
  assert.equal(new Set(seen.slice(0,7)).size, 7);
  assert.equal(new Set(seen.slice(7,14)).size, 7);
});
test('movement respects walls and ghost marks the landing', () => {
  const game = new Game();
  for (let i = 0; i < 20; i++) game.move(-1);
  assert.equal(game.move(-1), false);
  const landing = game.ghostY();
  assert.equal(game.valid({...game.current, y:landing}), true);
  assert.equal(game.valid({...game.current, y:landing+1}), false);
  game.hardDrop();
  assert.ok(game.board.slice(BUFFER).flat().some(Boolean));
  assert.equal(game.score, (landing + 2) * 2);
});
test('hold is limited to once per piece and swaps after a lock', () => {
  const game = new Game(); const first = game.current.kind;
  game.hold(); const second = game.current.kind;
  assert.equal(game.held, first); game.hold(); assert.equal(game.current.kind, second);
  game.hardDrop(); game.hold(); assert.equal(game.current.kind, first); assert.notEqual(game.held, null);
});
test('rotations kick pieces away from a wall', () => {
  const game = new Game(); game.current = {kind:'T', rotation:1, x:-1, y:5};
  assert.equal(game.valid(game.current), true); assert.equal(game.rotate(-1), true);
  assert.equal(game.current.rotation, 0); assert.equal(game.current.x, 0);
});
test('line clear scores and advances level', () => {
  const game = new Game(); game.lines = 9;
  game.board[BUFFER + HEIGHT - 1] = Array(WIDTH).fill('J');
  for (let x = 3; x <= 6; x++) game.board[BUFFER + HEIGHT - 1][x] = null;
  game.current = { kind:'I', rotation:0, x:3, y:HEIGHT-2 };
  game.hardDrop();
  assert.equal(game.lines,10); assert.equal(game.level,2);
  assert.equal(game.score,900); // single plus perfect clear
});
test('blocked spawn causes top out and restart resets state', () => {
  const game = new Game();
  for (let y = -2; y <= 0; y++) game.board[y+BUFFER].fill('Z');
  game.hardDrop(); assert.equal(game.gameOver, true);
  game.restart(); assert.equal(game.gameOver, false); assert.equal(game.score,0); assert.equal(game.held,null);
});
test('piece rotations preserve four unique cells', () => {
  for (const kind of ['I','J','L','O','S','T','Z']) for (let r=0;r<4;r++) assert.equal(new Set(blocks(kind,r).map(String)).size,4);
});
