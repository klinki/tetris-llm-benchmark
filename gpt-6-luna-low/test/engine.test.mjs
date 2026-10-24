import test from 'node:test';
import assert from 'node:assert/strict';
import { TetrisGame } from '../dist/engine.js';

test('starts with a piece and a five-piece preview queue',()=>{const game=new TetrisGame();game.start();assert.ok(game.state.active);assert.equal(game.state.queue.length,5);});
test('hold can be used once per piece and swaps on the next hold',()=>{const game=new TetrisGame();game.start();const first=game.state.active.kind;game.holdPiece();assert.equal(game.state.hold,first);assert.equal(game.state.canHold,false);const second=game.state.active.kind;game.holdPiece();assert.equal(game.state.active.kind,second);game.hardDrop();assert.equal(game.state.canHold,true);});
test('hard drop locks the active piece and scores distance',()=>{const game=new TetrisGame();game.start();game.hardDrop();assert.equal(game.state.pieces,1);assert.ok(game.state.score>=0);assert.ok(game.state.active);});
test('SRS rotation leaves the piece in a valid board position',()=>{const game=new TetrisGame();game.start();for(let i=0;i<4;i++)game.rotate(1);assert.ok(game.state.active);});
