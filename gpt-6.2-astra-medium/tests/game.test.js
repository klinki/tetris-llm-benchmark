import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,cells,shapes} from '../dist/game.js';
test('bags contain each tetromino once',()=>{
  const g=new Game(),sequence=[g.kind,...Array.from({length:20},()=>g.next())];
  for(let i=0;i<21;i+=7)assert.equal(new Set(sequence.slice(i,i+7)).size,7);
});
test('every rotation has four cells and cycles',()=>{
  for(const k of Object.keys(shapes))for(let r=0;r<4;r++) assert.equal(new Set(cells(k,r).map(String)).size,4);
});
test('hold is available once per piece',()=>{
  const g=new Game(),first=g.kind;g.hold();const second=g.kind;
  g.hold();assert.equal(g.kind,second);g.drop();g.hold();assert.equal(g.kind,first);
});
test('hard drop clears a filled row and awards points',()=>{
  const g=new Game();g.spawn('I');g.grid[39].fill('J');g.grid[39].fill(null,3,7);
  const distance=g.ghost()-g.y;g.drop();assert.equal(g.lines,1);assert.equal(g.score,900+distance*2);
});
test('grounded piece locks after half a second',()=>{
  const g=new Game();g.y=g.ghost();g.tick(499);assert.ok(g.grid.flat().every(v=>!v));g.tick(1);assert.equal(g.grid.flat().filter(Boolean).length,4);
});
test('I rotation kicks off left wall and blocked spawn ends game',()=>{
  const g=new Game();g.spawn('I');g.rotation=1;g.x=-2;g.rotate(-1);assert.equal(g.rotation,0);assert.equal(g.x,0);
  g.grid[19].fill('O');g.spawn('I');assert.equal(g.over,true);
});
