import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, Bag, blocks, TYPES, HIDDEN } from '../dist/game.js';

const empty = () => new Game(() => .5);
function fill(game, y, gaps = []) {
  game.board[y + HIDDEN] = Array.from({ length: 10 }, (_, x) => gaps.includes(x) ? null : 'J');
}

test('every consecutive bag contains all seven tetrominoes', () => {
  const bag = new Bag();
  for (let n = 0; n < 100; n++) assert.deepEqual(Array.from({ length: 7 }, () => bag.next()).sort(), [...TYPES].sort());
});
test('all rotation states have four unique cells and cycle after four rotations', () => {
  for (const kind of TYPES) {
    for (let r = 0; r < 4; r++) assert.equal(new Set(blocks(kind,r).map(String)).size,4);
    const game = empty(); game.active = { kind, x:3,y:5,rotation:0 };
    const initial = { ...game.active };
    for (let n = 0; n < 4; n++) assert.equal(game.rotate(1),true);
    assert.deepEqual(game.active,initial);
  }
});
test('movement respects both walls and floor', () => {
  const g = empty(); g.active = { kind:'O',x:3,y:18,rotation:0 };
  for (let n = 0; n < 20; n++) g.move(-1);
  assert.equal(g.active.x,-1);
  assert.equal(g.softDrop(),false);
  for (let n = 0; n < 20; n++) g.move(1);
  assert.equal(g.active.x,7);
});
test('SRS T floor kick and I wall kick use their distinct offsets', () => {
  const g = empty(); g.active = { kind:'T',x:3,y:18,rotation:0 };
  assert.equal(g.rotate(1),true);
  assert.deepEqual(g.active,{kind:'T',x:2,y:17,rotation:1});
  g.active = { kind:'I',x:-2,y:5,rotation:1 };
  assert.equal(g.rotate(-1),true);
  assert.deepEqual(g.active,{kind:'I',x:0,y:5,rotation:0});
});
test('a completely obstructed rotation leaves the piece unchanged', () => {
  const g = empty(); g.active = {kind:'T',x:3,y:17,rotation:0};
  for (let y = 14; y < 20; y++) fill(g,y);
  for (const [x,y] of blocks('T')) g.board[y+17+HIDDEN][x+3] = null;
  const before = { ...g.active };
  assert.equal(g.rotate(1),false);
  assert.deepEqual(g.active,before);
});
test('hold is limited to once per piece and swaps in spawn orientation', () => {
  const g = empty(); const first = g.active.kind; const next = g.queue[0];
  g.rotate(1); g.hold();
  assert.equal(g.held,first); assert.equal(g.active.kind,next);
  g.hold(); assert.equal(g.active.kind,next);
  g.hardDrop(); const current = g.active.kind;
  g.hold(); assert.equal(g.active.kind,first); assert.equal(g.active.rotation,0); assert.equal(g.held,current);
});
test('ghost and hard drop agree; hard drop awards two points per row', () => {
  const g = empty(); const distance = g.ghostY() - g.active.y;
  g.hardDrop(); assert.equal(g.score,distance*2); assert.equal(g.pieces,1);
  assert.equal(g.board.flat().filter(Boolean).length,4);
});
test('soft drop awards one point and gravity awards none', () => {
  const g = empty(); assert.equal(g.softDrop(),true); assert.equal(g.score,1);
  const y = g.active.y; g.tick(1000); assert.equal(g.active.y,y+1); assert.equal(g.score,1);
});
test('lock waits 500ms and a grounded move resets the delay', () => {
  const g = empty(); g.active = {kind:'O',x:3,y:18,rotation:0};
  g.tick(490); assert.equal(g.pieces,0);
  g.move(1); g.tick(490); assert.equal(g.pieces,0);
  g.tick(10); assert.equal(g.pieces,1);
});
test('lock delay is capped at fifteen movement resets', () => {
  const g = empty(); g.active = {kind:'O',x:3,y:18,rotation:0};
  for (let i = 0; i < 15; i++) { g.tick(400); g.move(i%2 ? -1 : 1); }
  g.tick(400); g.move(-1); g.tick(100); assert.equal(g.pieces,1);
});
test('single clear compacts the board and scores at pre-clear level', () => {
  const g = empty(); g.lines = 9;
  fill(g,19,[4,5]); g.board[HIDDEN+18][0]='Z';
  g.active={kind:'O',x:3,y:18,rotation:0};g.hardDrop();
  assert.equal(g.lines,10); assert.equal(g.level,2); assert.equal(g.score,100);
  assert.equal(g.cell(0,19),'Z'); assert.equal(g.cell(4,19),'O');
});
test('Tetris, back-to-back, combo and perfect clear scoring', () => {
  const g = empty();
  const tetris = () => {
    for (let y=16;y<20;y++) fill(g,y,[4]);
    g.active={kind:'I',x:2,y:16,rotation:1};g.hardDrop();
  };
  tetris(); assert.equal(g.score,2800); assert.equal(g.lines,4);
  tetris(); assert.equal(g.score,7250); assert.equal(g.lines,8);
  assert.equal(g.backToBack,true); assert.equal(g.combo,1);
});
test('three corner T-spin single is recognized after a rotation', () => {
  const g = empty();
  fill(g,18,[3,4,5]);
  g.board[HIDDEN+17][3]='J'; g.board[HIDDEN+17][5]='J';
  g.board[HIDDEN+19][3]='J'; g.board[HIDDEN+19][4]='J';
  g.active={kind:'T',x:3,y:17,rotation:3};
  assert.equal(g.rotate(1),true);g.hardDrop();
  assert.equal(g.lines,1);assert.equal(g.score,800);assert.match(g.message,/T-spin/);
});
test('blocked spawn and blocked held piece trigger game over', () => {
  const g = empty();
  fill(g,-1); fill(g,0);
  g.hold(); assert.equal(g.over,true);
  const h = empty(); h.held='O'; fill(h,0); h.hold();assert.equal(h.over,true);
});
test('pause freezes time and rejects all game actions; reset clears state', () => {
  const g = empty();g.paused=true;const initial={...g.active};
  g.move(1);g.rotate(1);g.hardDrop();g.hold();g.tick(1000);g.softDrop();
  assert.deepEqual(g.active,initial);assert.equal(g.elapsed,0);assert.equal(g.held,null);
  g.reset();assert.equal(g.paused,false);assert.equal(g.over,false);assert.equal(g.score,0);assert.equal(g.queue.length,6);
});
test('a long deterministic run never writes outside the board', () => {
  const g = empty();
  for (let i=0;i<250;i++) {
    if (g.over) g.reset();
    for (let r=0;r<i%4;r++) g.rotate(1);
    for (let x=0;x<i%5;x++) g.move(i%2?1:-1);
    g.hardDrop();
    assert.equal(g.board.length,40);
    assert.ok(g.board.every(row=>row.length===10));
    assert.ok(Number.isFinite(g.score));
  }
});
