import test from 'node:test'
import assert from 'node:assert/strict'
import {Game,cells} from './dist/game.js'
test('seven unique pieces per bag',()=>{const g=new Game();assert.equal(new Set([g.kind,...Array.from({length:6},()=>g.next())]).size,7)})
test('hold resets after locking',()=>{const g=new Game(),first=g.kind;g.hold();g.hold();assert.equal(g.held,first);g.drop();g.hold();assert.equal(g.kind,first)})
test('line clear after lock delay',()=>{const g=new Game();g.spawn('I');g.y=38;g.board[39].fill('J');g.board[39].fill('',3,7);g.tick(499);assert.equal(g.lines,0);g.tick(1);assert.equal(g.lines,1);assert.equal(g.score,900)})
test('blocked spawn ends game',()=>{const g=new Game();g.board[18].fill('J');g.spawn('O');assert.ok(g.over)})
test('four rotations restore shape',()=>{const g=new Game();g.y=25;const before=cells(g.kind,g.r);for(let i=0;i<4;i++)g.rotate(1);assert.deepEqual(cells(g.kind,g.r),before)})
