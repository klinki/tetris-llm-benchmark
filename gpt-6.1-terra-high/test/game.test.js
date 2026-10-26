import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,cells} from '../dist/game.js';

test('seven-bag queue contains each piece once per bag',()=>{const g=new Game(()=>0.5); const sequence=[g.active.kind]; for(let i=0;i<13;i++){sequence.push(g.queue[0]);g.hardDrop(); g.board=Array.from({length:20},()=>Array(10).fill(null));} assert.equal(new Set(sequence.slice(0,7)).size,7);assert.equal(new Set(sequence.slice(7,14)).size,7);});
test('hold is limited to once until a piece locks',()=>{const g=new Game(); const first=g.active.kind;g.swapHold();const second=g.active.kind;assert.equal(g.hold,first);g.swapHold();assert.equal(g.active.kind,second);g.hardDrop();g.swapHold();assert.equal(g.active.kind,first);});
test('hard drop lands and scores two points per row',()=>{const g=new Game();const distance=g.ghost().y-g.active.y;g.hardDrop();assert.equal(g.score,distance*2);assert.equal(g.board.flat().filter(Boolean).length,4);});
test('line clear scores and advances level',()=>{const g=new Game();g.lines=9;g.board[19]=Array(10).fill('J');for(let x=3;x<=6;x++)g.board[19][x]=null;g.active={kind:'I',rotation:0,x:3,y:18};g.lock();assert.equal(g.lines,10);assert.equal(g.level,2);assert.equal(g.score,100);assert.equal(g.board.flat().filter(Boolean).length,0);});
test('SRS rotation kicks a T away from a wall',()=>{const g=new Game();g.active={kind:'T',rotation:1,x:-1,y:5};assert.equal(g.valid(g.active),true);assert.equal(g.rotate(-1),true);assert.equal(g.active.rotation,0);assert.equal(g.active.x,0);});
test('ghost is at lowest legal position',()=>{const g=new Game();const ghost=g.ghost();assert.equal(g.valid(ghost),true);assert.equal(g.valid({...ghost,y:ghost.y+1}),false);assert.equal(cells(ghost).length,4);});
test('blocked spawn ends the game and restart clears it',()=>{const g=new Game();for(let x=3;x<7;x++)g.board[0][x]='J';g.active={kind:'O',rotation:0,x:3,y:17};g.lock();assert.equal(g.over,true);g.restart();assert.equal(g.over,false);assert.equal(g.board.flat().filter(Boolean).length,0);});
test('grounded pieces lock after delay',()=>{const g=new Game();g.active=g.ghost();g.update(499);assert.equal(g.board.flat().filter(Boolean).length,0);g.update(1);assert.equal(g.board.flat().filter(Boolean).length,4);});
