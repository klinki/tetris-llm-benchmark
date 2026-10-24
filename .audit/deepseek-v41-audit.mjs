import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
if (!process.argv[2]) throw new Error('Pass a built disposable run directory');
const root = resolve(process.argv[2]), mode = process.argv[3];
assert(['low','high','max'].includes(mode));
const load = file => import(pathToFileURL(resolve(root,'dist',file)));
// Identical canonical coordinate oracle to the October 23 audit.
const reference = {
  I: [
    [[0, 1], [1, 1], [2, 1], [3, 1]], [[2, 0], [2, 1], [2, 2], [2, 3]],
    [[0, 2], [1, 2], [2, 2], [3, 2]], [[1, 0], [1, 1], [1, 2], [1, 3]],
  ],
  J: [
    [[0, 0], [0, 1], [1, 1], [2, 1]], [[1, 0], [2, 0], [1, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [2, 2]], [[1, 0], [1, 1], [0, 2], [1, 2]],
  ],
  L: [
    [[2, 0], [0, 1], [1, 1], [2, 1]], [[1, 0], [1, 1], [1, 2], [2, 2]],
    [[0, 1], [1, 1], [2, 1], [0, 2]], [[0, 0], [1, 0], [1, 1], [1, 2]],
  ],
  O: Array.from({ length: 4 }, () => [[1, 0], [2, 0], [1, 1], [2, 1]]),
  S: [
    [[1, 0], [2, 0], [0, 1], [1, 1]], [[1, 0], [1, 1], [2, 1], [2, 2]],
    [[1, 1], [2, 1], [0, 2], [1, 2]], [[0, 0], [0, 1], [1, 1], [1, 2]],
  ],
  T: [
    [[1, 0], [0, 1], [1, 1], [2, 1]], [[1, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [1, 2]], [[1, 0], [0, 1], [1, 1], [1, 2]],
  ],
  Z: [
    [[0, 0], [1, 0], [1, 1], [2, 1]], [[2, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [1, 2], [2, 2]], [[1, 0], [0, 1], [1, 1], [0, 2]],
  ],
};

// Independent published SRS offsets: positive Y points up; normalize the run below.
const normalKicks = {
  '0>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '1>0': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '1>2': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '2>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '2>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '3>2': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '3>0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '0>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
};
const iKicks = {
  '0>1': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '1>0': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '1>2': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  '2>1': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '2>3': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '3>2': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '3>0': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '0>3': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
};

const core = await load(mode==='high'?'core/game.js':'game.js');
const pieces = await load(mode==='low'?'tetromino.js':mode==='high'?'core/pieces.js':'pieces.js');
const rules = mode==='low'?core:await load(mode==='high'?'core/scoring.js':'scoring.js');
const Game=core.Game,types=Object.keys(reference),bottom=mode==='max'?19:21,skyline=mode==='max'?0:2;
const local=(t,r)=>mode==='low'?pieces.getCells(t,r):(mode==='high'?pieces.shapeCells(t,r):pieces.cellsFor(t,r)).map(c=>[c.x,c.y]);
const grid=g=>mode==='high'?g.board.cells:g.board;
const clear=g=>grid(g).forEach(row=>row.fill(null));
const put=(g,x,y)=>{grid(g)[y][x]='J';};
const empty=g=>grid(g).flat().every(c=>c===null);
const absolute=p=>local(p.type,p.rotation).map(([x,y])=>[x+p.x,y+p.y]);
const fits=(g,p)=>absolute(p).every(([x,y])=>x>=0&&x<10&&y<=bottom&&(y>=0?grid(g)[y][x]===null:mode!=='max'));
const over=g=>mode==='low'?g.gameOver:mode==='high'?g.status==='gameover':g.state==='gameover';
const step=(g,ms)=>g.update(mode==='max'?ms/1000:ms);
const advance=(g,ms)=>{while(ms>0){const dt=Math.min(16,ms);step(g,dt);ms-=dt;}};
const move=(g,d)=>mode==='high'?(d===1?g.moveRight():g.moveLeft()):g.move(d);
const hold=g=>mode==='high'?g.holdPiece():g.hold();
const soft=(g,on)=>mode==='low'?(g.softDropping=on):g.setSoftDrop(on);
const ghost=g=>mode==='low'?g.ghostY():mode==='high'?g.getGhostY():g.ghost().y;
const restart=g=>mode==='max'?g.reset():g.restart();
const queue=g=>mode==='low'?g.queue:g.nextQueue;
const b2b=g=>mode==='high'?g.backToBack:g.b2b;
const place=(g,t,r,x,y)=>{
  g.active={type:t,rotation:r,x,y};
  Object.assign(g,{gravityAccum:0,dropTimer:0,lockTimer:0,lockResets:0,lowestY:y,lastAction:null,lastMoveWasRotation:false,lastKickIndex:0});
  assert(fits(g,g.active),'fixture starts collision-free');
};
const make=(sequence)=>{
  const g=mode==='low'?new Game(()=>0.42):new Game({seed:42});
  if(sequence){
    // Only constrain the piece source; spawn uses the unchanged engine path.
    const seq=[...sequence,...Array(10).fill('I')];let i=1;
    if(mode==='low'){g.randomizer.next=()=>seq[i++%seq.length];g.randomizer.peek=n=>Array.from({length:n},(_,j)=>seq[(i+j)%seq.length]);g.replacePiece(seq[0]);g.queue=g.randomizer.peek(5);}
    else {g.nextQueue.splice(0,g.nextQueue.length,...seq);(mode==='high'?g.spawn:g.spawnNext).call(g);}
  }
  return g;
};
const key=c=>c.map(([x,y])=>`${x},${y}`).sort().join(' ');
for(const t of types)for(let r=0;r<4;r++)assert.equal(key(local(t,r).map(([x,y])=>[x+(t==='O'?1:0),y])),key(reference[t][r]),`${t}${r}`);
assert.equal(new Set(Object.values(pieces.COLORS??pieces.PIECE_COLORS)).size,7);
const wrongKicks=[];
for(const t of types)for(const k of Object.keys(normalKicks)){
  const [from,to]=k.split('>').map(Number);
  const kicks=mode==='low'?pieces.kicksFor(t,from,to):pieces.getKicks(t,from,to).map(c=>[c.x,c.y]);
  const up=kicks.map(([x,y])=>[x||0,(-y)||0]);
  if(JSON.stringify(up)!==JSON.stringify(t==='O'?[[0,0]]:(t==='I'?iKicks:normalKicks)[k]))wrongKicks.push(`${t}:${k}`);
}
assert.deepEqual(wrongKicks,mode==='high'?Object.keys(iKicks).map(k=>`I:${k}`):[]);
for(const [t,x]of [['T',-1],['I',-2]]){const g=make();place(g,t,1,x,10);assert(g.rotate(-1));assert.deepEqual(g.active,{type:t,rotation:0,x:0,y:10});}
for(const [t,x]of [['T',7],['I',6]]){const g=make();place(g,t,3,8,10);assert(g.rotate(1));assert.deepEqual(g.active,{type:t,rotation:0,x,y:10});}
{
  const g=make();place(g,'I',0,3,bottom-2);assert(g.rotate(1));
  assert.deepEqual(g.active,{type:'I',rotation:1,x:mode==='high'?1:4,y:mode==='high'?bottom-3:bottom-4});
}
{
  const g=mode==='low'?new Game((()=>{let s=42;return()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/2**32);})()):new Game({seed:42});
  for(let b=0;b<10;b++){const bag=[];for(let i=0;i<7;i++){bag.push(g.active.type);clear(g);g.hardDrop();assert(!over(g));}assert.deepEqual(bag.sort(),[...types].sort());}
}
{
  const g=make(['T','I','O']);assert.equal(queue(g)[0],'I');g.rotate(1);hold(g);
  assert.equal(g.holdType,'T');assert.equal(g.active.type,'I');assert(!g.canHold);hold(g);assert.equal(g.active.type,'I');
  g.hardDrop();assert(g.canHold);hold(g);assert.equal(g.active.type,'T');assert.equal(g.active.rotation,0);assert(!g.canHold);
  const w=make();place(w,'O',0,4,10);while(move(w,-1)){}assert.equal(w.active.x,0);while(move(w,1)){}assert.equal(w.active.x,8);
}
for(const t of types){const g=make([t]);put(g,4,bottom-1);const p={...g.active},y=ghost(g),land={...p,y};
  assert(fits(g,land));assert(!fits(g,{...land,y:y+1}));assert.equal(new Set(absolute(land).map(String)).size,4);
  g.hardDrop();assert.equal(g.score,2*(y-p.y));for(const [x,y]of absolute(land))assert.equal(grid(g)[y][x],t);
}
console.log(`${mode}: 28 canonical states, colors, kick tables (${wrongKicks.length} documented mismatches), actual T/I kicks, ten actual bags, walls, hold and seven ghosts passed`);
{
  const g=make();place(g,'O',0,4,bottom-1);advance(g,499);assert(empty(g));step(g,1.000001);assert.equal(grid(g)[bottom][4],'O');
}
{
  const g=make();place(g,'O',0,4,bottom-1);
  for(let i=0;i<30;i++){advance(g,490);assert(empty(g));assert(move(g,i%2?-1:1));if(i===14)assert.equal(g.lockResets,15);
    if(mode!=='max'&&i===14)break;}
  advance(g,490);move(g,-1);advance(g,10.000001);
  assert.equal(empty(g),mode==='max');
  console.log(`${mode}: after ${mode==='max'?30:15} grounded resets and an extra action, locked=${!empty(g)}`);
}
{
  const g=make();place(g,'O',0,0,bottom-4);put(g,0,bottom-2);advance(g,490);assert(move(g,1));assert(fits(g,{...g.active,y:g.active.y+1}));
  advance(g,20);assert.equal(g.active.y,bottom-4);assert.equal(grid(g)[bottom-4][1],null);
  for(let i=0;i<400&&grid(g)[bottom][1]===null;i++)step(g,16);
  assert.equal(grid(g)[bottom][1],'O');assert.equal(grid(g)[bottom-4][1],null);
}
console.log(`${mode}: 499/500 ms lock and ledge mid-air safety passed`);
const single=(g,perfect=false)=>{clear(g);for(const x of [0,1,2,7,8,9])put(g,x,bottom);if(!perfect)put(g,0,bottom-9);place(g,'I',0,3,bottom-1);};
const tetris=g=>{clear(g);for(let y=bottom-3;y<=bottom;y++)for(let x=0;x<10;x++)if(x!==4)put(g,x,y);put(g,0,bottom-9);place(g,'I',1,2,bottom-3);};
const evidence={wrongKicks};
for(const [n,expected]of [[1,100],[2,300],[3,500],[4,800]]){
  const g=make();if(n===1)single(g);else{for(let y=bottom-n+1;y<=bottom;y++)for(let x=0;x<10;x++)if(x!==4)put(g,x,y);put(g,0,bottom-9);place(g,'I',1,2,bottom-3);}
  g.hardDrop();assert.equal(g.score,expected);assert.equal(g.lines,n);
}
{
  const g=make();single(g,true);g.hardDrop();assert.equal(g.score,mode==='low'?100:900);assert(empty(g));evidence.perfectClear=g.score;
  const b=make();tetris(b);b.hardDrop();clear(b);place(b,'O',0,0,bottom-1);b.hardDrop();assert(b2b(b));tetris(b);b.hardDrop();assert.equal(b.score,2000);
  single(b);b.hardDrop();assert.equal(b.score,2150);assert(!b2b(b));evidence.b2b=b.score;
  const c=make();c.level=2;c.lines=10;c.combo=mode==='low'?1:0;single(c);c.hardDrop();assert.equal(c.score,mode==='low'?400:300);evidence.levelTwoCombo=c.score;
  const crossing=make();crossing.lines=9;single(crossing);crossing.hardDrop();assert.equal(crossing.score,100);assert.equal(crossing.level,2);
}
for(const timed of [false,true])for(const full of [false,true])for(const line of [false,true]){
  const g=make(),y=bottom-2;put(g,5,y);put(g,3,bottom);put(g,full?3:5,full?y:bottom);
  if(line)for(const x of [0,1,2,6,7,8,9])put(g,x,bottom-1);
  place(g,'T',3,3,y);assert(g.rotate(1));assert.equal(g.active.rotation,0);assert.equal(ghost(g),y);
  if(timed)advance(g,500.000001);else g.hardDrop();
  const expected=mode==='low'?(timed?(line?800:400):(line?100:0)):full?(line?800:400):(line?200:100);
  assert.equal(g.score,expected);assert.equal(g.lines,Number(line));evidence[`${timed?'timed':'hard'}-${full?'full':'mini'}-${line?'single':'zero'}`]=g.score;
}
// Mini line clears must qualify for and continue B2B as in the prior scoring profile.
{
  const g=make();tetris(g);g.hardDrop();clear(g);g.combo=mode==='low'?0:-1;
  const y=bottom-2;for(const [x,yy]of [[5,y],[3,bottom],[5,bottom]])put(g,x,yy);
  for(const x of [0,1,2,6,7,8,9])put(g,x,bottom-1);
  place(g,'T',3,3,y);g.rotate(1);advance(g,500.000001);
  assert.equal(g.score,mode==='low'?2000:mode==='high'?1000:1100);
  assert.equal(b2b(g),mode!=='high');evidence.miniAfterTetris=g.score;
}
// Perfect clears after an armed B2B chain, with combo broken by a no-clear.
{
  const g=make();tetris(g);g.hardDrop();clear(g);place(g,'O',0,0,bottom-1);g.hardDrop();
  single(g,true);g.hardDrop();assert.equal(g.score,mode==='low'?900:mode==='high'?2100:1700);
  evidence.singlePerfectAfterB2B=g.score;
  const b=make();tetris(b);b.hardDrop();clear(b);place(b,'O',0,0,bottom-1);b.hardDrop();
  tetris(b);grid(b)[bottom-9][0]=null;b.hardDrop();
  assert(empty(b));assert.equal(b.score,mode==='low'?2000:mode==='high'?5200:4000);
  evidence.tetrisPerfectAfterB2B=b.score;
}
if(mode!=='low'){
  const g=make(),piece={type:'T',rotation:0,x:3,y:bottom-2};
  put(g,5,bottom-2);put(g,3,bottom);put(g,5,bottom);
  if(mode==='high'){
    const {detectTSpin}=await load('core/tspin.js');
    assert.equal(detectTSpin(g.board,piece,true,0),'mini');assert.equal(detectTSpin(g.board,piece,true,4),'full');
    clear(g);assert.equal(detectTSpin(g.board,piece,true,4),'none');
  }else{
    g.lastAction='rotate';g.lastKickIndex=0;assert.equal(g.detectSpin(piece),'mini');
    g.lastKickIndex=4;assert.equal(g.detectSpin(piece),'tspin');clear(g);assert.equal(g.detectSpin(piece),'none');
  }
}
console.log(`${mode} scoring: ${JSON.stringify(evidence)}`);
for(const level of [1,2,5,10,15,20]){
  const interval=mode==='low'?rules.gravityMs(level):mode==='high'?rules.gravityIntervalMs(level):rules.gravitySeconds(level)*1000;
  const expected=Math.max(mode==='high'?16:1,Math.pow(0.8-(level-1)*0.007,level-1)*1000);
  assert(Math.abs(interval-expected)<1e-7);
  const g=make(['O']);g.level=level;g.lines=(level-1)*10;const y=g.active.y;advance(g,interval-0.01);assert.equal(g.active.y,y);step(g,0.010001);assert.equal(g.active.y,y+1);
}
{
  const g=make(['O']);advance(g,800);const y=g.active.y;soft(g,true);step(g,1);assert.equal(g.active.y-y,16);assert.equal(g.score,16);
  const normal=make(['O']);soft(normal,true);advance(normal,100.000001);assert.equal(normal.score,2);
  // Equal-duration updates at two refresh rates on a free-falling piece.
  const a=make(['O']),b=make(['O']);for(let i=0;i<60;i++)step(a,1100/60);for(let i=0;i<144;i++)step(b,1100/144);assert.equal(a.active.y,b.active.y);assert.equal(a.active.y,1+(mode==='low'?0:mode==='high'?1:0));
  console.log(`${mode}: gravity curve 1/2/5/10/15/20, levels, equal-time 60/144 Hz; soft transition +16 rows/points confirmed`);
}
{
  const g=make(['T','I']);
  if(mode==='max'){
    // Legal T spawn; first two candidates hit the stack. Canonical test 3
    // reaches x=2,y=-1 without overlap; this run rejects all above-top cells.
    for(const [x,y]of [[4,2],[3,2]])put(g,x,y);
    assert(g.canPlace(g.active));
    const canonical={type:'T',rotation:1,x:2,y:-1};
    assert(absolute(canonical).every(([x,y])=>x>=0&&x<10&&(y<0||grid(g)[y][x]===null)));
    assert.equal(g.rotate(1),false);assert.deepEqual(g.active,{type:'T',rotation:0,x:3,y:0});
    evidence.ceilingRotation={expected:canonical,actual:g.active};
    console.log('CONFIRMED max: legal above-top SRS kick is rejected; there is no hidden field/lock-out path');
  }else{
    // Actual spawn and public actions; incoming I remains independently open.
    if(mode==='low'){
      for(let i=0;i<3;i++)assert(move(g,-1));
      for(const x of [0,1,2])put(g,x,2);
    }else{
      for(const [x,y]of [[2,2],[3,3],[4,3]])put(g,x,y);
      assert(fits(g,g.active));assert(g.rotate(1));assert(g.rotate(-1));while(g.active.x>0)assert(move(g,-1));
    }
    assert(absolute(g.active).every(([,y])=>y<skyline));assert.equal(ghost(g),g.active.y);
    assert(fits(g,{type:'I',rotation:0,x:3,y:mode==='low'?-1:1}));g.hardDrop();assert(over(g));
  }
}
{
  const g=make(['O','T','I']);clear(g);place(g,'O',0,0,bottom-1);put(g,4,mode==='low'?0:mode==='high'?1:0);g.hardDrop();assert(over(g));
  const snapshot=()=>JSON.stringify([g.active,grid(g),g.score,g.holdType]);const before=snapshot();move(g,-1);g.rotate(1);hold(g);g.hardDrop();advance(g,1000);assert.equal(snapshot(),before);
  restart(g);assert(!over(g));assert(empty(g));assert.equal(g.score,0);assert.equal(g.lines,0);assert.equal(g.level,1);assert.equal(g.holdType,null);assert(g.canHold);
}
console.log(`${mode} engine audit passed: recorded conformance and defects reproduced.`);
