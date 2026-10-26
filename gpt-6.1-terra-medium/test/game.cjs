const assert = require('node:assert/strict');
(async()=>{const {Game,cells}=await import('../dist/game.js');
const g=new Game(()=>0.5);assert.equal(new Set([g.active.kind,...g.queue.slice(0,6)]).size,7,'first bag has all pieces');
assert.equal(cells(g.active).length,4);const before=g.active.kind;g.swap();assert.equal(g.hold,before);const current=g.active.kind;g.swap();assert.equal(g.active.kind,current,'hold once per piece');
const d=new Game(()=>0.5);const y=d.active.y;const landing=d.ghost().y;d.hardDrop();assert.equal(d.score,(landing-y)*2);assert.equal(d.board.flat().filter(Boolean).length,4);
const l=new Game(()=>0.5);l.board[21]=Array(10).fill('I');l.board[21][4]=null;l.board[21][5]=null;l.active={kind:'O',x:3,y:20,rotation:0};l.lock();assert.equal(l.lines,1);assert.equal(l.score,100);
const r=new Game();r.active={kind:'T',x:3,y:1,rotation:0};assert(r.rotate(1));assert.equal(r.active.rotation,1);assert(r.rotate(-1));assert.equal(r.active.rotation,0);
console.log('Game logic smoke tests passed');})().catch(e=>{console.error(e);process.exit(1)});
