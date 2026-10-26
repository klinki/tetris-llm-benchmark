import { initGame, move, rotateCW, hardDrop, clearLines, newBoard } from './game';

function assert(cond: boolean, msg: string){ if(!cond){ throw new Error('FAIL '+msg);} }
const s = initGame();
assert(s.current !== null, 'spawn');
const before = s.current!.x;
move(s, 1);
assert(s.current!.x === before+1, 'move right');
// hard drop locks
hardDrop(s);
assert(s.current !== null || s.gameOver === false, 'after hard drop spawns');
// clear lines on full row
const b = newBoard();
for (let c=0;c<10;c++) b[19][c]=1;
assert(clearLines(b)===1, 'clear line');
console.log('ALL TESTS PASS');
