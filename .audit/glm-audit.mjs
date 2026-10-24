import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
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

// Low emits browser ESM into a commonjs package. Its declared test build is
// CommonJS; load that unchanged build, rather than repairing the delivery.
const req = createRequire(import.meta.url);
const core = mode === 'low' ? req(resolve(root,'build/tests/game/game.js')) : await load('game.js');
const pieces = mode === 'low' ? req(resolve(root,'build/tests/game/engine.js'))
  : await load(mode === 'high' ? 'pieces.js' : 'tetromino.js');
const Game = core.Game, types=Object.keys(reference), ids='IJLOSTZ';
const bottom=mode==='max'?21:19, skyline=mode==='max'?2:0, blank=mode==='low'?0:null;
const local=(t,r)=>mode==='low'?pieces.pieceCells(ids.indexOf(t),r)
  : mode==='high'?pieces.STATES[t][r]:pieces.cellsOf(t,r);
const key=c=>c.map(([x,y])=>`${x},${y}`).sort().join(' ');
const grid=g=>mode==='low'?g.board:mode==='high'?g.board.grid:g.field.cells;
const put=(g,x,y,t='J')=>{grid(g)[y][x]=mode==='low'?ids.indexOf(t)+1:t;};
const value=t=>mode==='low'?ids.indexOf(t)+1:t;
const clear=g=>grid(g).forEach(row=>row.fill(blank));
const empty=g=>grid(g).flat().every(c=>c===blank);
const active=g=>{const p=g.piece;return p&&{type:mode==='low'?ids[p.id]:p.kind??p.type,rotation:p.rotation??p.rot,x:p.x,y:p.y};};
const absolute=p=>local(p.type,p.rotation).map(([x,y])=>[x+p.x,y+p.y]);
const fits=(g,p)=>absolute(p).every(([x,y])=>x>=0&&x<10&&y<=bottom&&(y<0||grid(g)[y][x]===blank));
const score=g=>mode==='low'?g.stats.score:g.score;
const lines=g=>mode==='low'?g.stats.lines:g.lines;
const level=g=>mode==='low'?g.stats.level:g.level;
const over=g=>mode==='low'?g.status==='over':mode==='high'?g.over:g.state==='over';
const held=g=>mode==='low'?(g.hold===null?null:ids[g.hold]):mode==='high'?g.holdKind:g.hold;
const available=g=>mode==='low'?!g.holdUsed:mode==='high'?g.canHold:!g.holdUsed;
const upcoming=g=>mode==='low'?g.nextQueue.map(i=>ids[i]):mode==='high'?g.bag.upcoming(5):g.nextQueue;
const ghost=g=>mode==='low'?g.piece.y+g.dropDistance(g.piece):mode==='high'?g.ghostY:g.ghost().y;
const move=(g,dx)=>{const before=JSON.stringify(active(g));g.move(dx);return before!==JSON.stringify(active(g));};
const rotate=(g,d)=>g.rotate(mode==='max'?(d===1?'cw':'ccw'):d);
const hard=g=>g.hardDrop();
const hold=g=>mode==='high'?g.hold():g.holdPiece();
const restart=g=>(g.restart??g.reset).call(g);
const step=(g,ms)=>mode==='low'?g.tick():g.update(ms);
const advance=(g,ms)=>{if(mode==='low'){assert(Number.isInteger(ms/1000*60));for(let i=0;i<ms/1000*60;i++)g.tick();}
  else while(ms>0){const dt=Math.min(ms,16);step(g,dt);ms-=dt;}};
const soft=(g,on)=>{if(mode==='low')g.softDrop(on);else g[mode==='high'?'softHeld':'softDrop']=on;};
const place=(g,t,r,x,y)=>{
  g.piece=mode==='low'?{id:ids.indexOf(t),rotation:r,x,y}:mode==='high'?{kind:t,rot:r,x,y}:{type:t,rot:r,x,y};
  if(mode==='low')Object.assign(g,{gravityAccumulator:0,lockFrames:0,moveResetCount:0});
  else if(mode==='high')Object.assign(g,{fallTimer:0,lockTimer:0,lockResets:0,lowestY:y,lastActionRotation:false});
  else Object.assign(g,{gravityAcc:0,softAcc:0,lockAcc:0,lockResets:0,grounded:false,lastRotation:false,lastKickIndex:0});
  assert(fits(g,active(g)),'fixture starts collision-free');
};
const make=(sequence=['T','I','O','S','Z','J','L'])=>{
  if(mode==='high')return new Game(undefined,sequence);
  const g=new Game(),q=Array.from({length:21},(_,i)=>sequence[i%sequence.length]);
  g.nextQueue.splice(0,g.nextQueue.length,...(mode==='low'?q.map(t=>ids.indexOf(t)):q));
  if(mode==='low')g.spawn();else g.spawnNext();
  assert.equal(active(g).type,sequence[0]);return g;
};
for(const t of types)for(let r=0;r<4;r++)
  assert.equal(key(local(t,r).map(([x,y])=>[x+(t==='O'?1:0),y])),key(reference[t][r]),`${t}${r}`);
assert.equal(new Set(Object.values(pieces.COLORS)).size,7);
for(const t of types)for(const k of Object.keys(normalKicks)){
  const [from,to]=k.split('>').map(Number);
  const offsets=mode==='low'?(t==='O'?[[0,0]]:(t==='I'?pieces.KICKS_I:pieces.KICKS_JLSTZ)[k])
    : mode==='high'?pieces.kicksFor(t,from,to):pieces.kickOffsets(t,from,to);
  const up=offsets.map(([x,y])=>[x||0,(mode==='high'?y:-y)||0]);
  assert.deepEqual(up,t==='O'?[[0,0]]:(t==='I'?iKicks:normalKicks)[k]);
}
for(const [t,x]of [['T',-1],['I',-2]]){
  const g=make();place(g,t,1,x,10);rotate(g,-1);assert.deepEqual(active(g),{type:t,rotation:0,x:0,y:10});
}
for(const [t,x]of [['T',7],['I',6]]){
  const g=make();place(g,t,3,8,10);rotate(g,1);assert.deepEqual(active(g),{type:t,rotation:0,x,y:10});
}
{
  const g=make();place(g,'T',0,3,10);put(g,4,12);put(g,5,12);rotate(g,-1);
  assert.deepEqual(active(g),{type:'T',rotation:3,x:4,y:9});
}
{
  let seed=42;const old=Math.random;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
  try{const g=new Game();for(let b=0;b<10;b++){const drawn=[];for(let i=0;i<7;i++){
    drawn.push(active(g).type);clear(g);hard(g);assert(!over(g));}assert.deepEqual(drawn.sort(),[...types].sort());}}
  finally{Math.random=old;}
}
{
  const g=make();assert.deepEqual(upcoming(g).slice(0,4),['I','O','S','Z']);
  rotate(g,1);hold(g);assert.equal(held(g),'T');assert.equal(active(g).type,'I');assert(!available(g));
  hold(g);assert.equal(active(g).type,'I');hard(g);assert.equal(available(g),mode!=='low');hold(g);
  assert.equal(active(g).type,mode==='low'?'O':'T');assert.equal(active(g).rotation,0);
  if(mode==='low'){
    assert.equal(held(g),'T');assert(!available(g));
    const swap=make(['I']);swap.hold=ids.indexOf('T');rotate(swap,1);hold(swap);
    assert.equal(active(swap).type,'T');assert.equal(active(swap).rotation,0);
    console.log('CONFIRMED low: holdUsed remains true after lock; C is unavailable for the rest of the game');
  }else assert(!available(g));
  const w=make();place(w,'O',0,4,10);while(move(w,-1)){}assert.equal(active(w).x,0);
  while(move(w,1)){}assert.equal(active(w).x,8);
}
for(const t of types){
  const g=make([t]);put(g,4,bottom-1);const p=active(g),y=ghost(g),landing={...p,y};
  assert(fits(g,landing));assert(!fits(g,{...landing,y:y+1}));assert.equal(new Set(absolute(landing).map(String)).size,4);
  hard(g);assert.equal(score(g),2*(y-p.y));for(const [x,y]of absolute(landing))assert.equal(grid(g)[y][x],value(t));
}
console.log(`${mode}: 28 canonical states, all CW/CCW tables, real T/I/obstacle kicks, colors, ten actual bags, walls, hold and seven ghosts/drops passed`);
{
  const g=make();place(g,'O',0,4,bottom-1);
  if(mode==='low'){for(let i=0;i<29;i++)step(g);assert(empty(g));step(g);}
  else{advance(g,499);assert(empty(g));step(g,1.000001);}
  assert.equal(grid(g)[bottom][4],value('O'));
}
{
  const g=make();place(g,'O',0,4,bottom-1);
  for(let i=0;i<15;i++){
    if(mode==='low')for(let j=0;j<29;j++)step(g);else advance(g,490);
    assert(empty(g));assert(move(g,i%2?-1:1));
  }
  assert.equal(g[mode==='low'?'moveResetCount':'lockResets'],15);
  if(mode==='low'){for(let j=0;j<29;j++)step(g);move(g,-1);step(g);}
  else{advance(g,490);move(g,-1);advance(g,10.000001);}
  assert(grid(g).flat().includes(value('O')));
}
for(const top of (mode==='low'?[bottom-2,bottom-4]:[bottom-2])){
  // Same ledge fixture; low's incorrect 1G floor moves it to the floor in one
  // tick. A taller ledge separately checks the old deadline while airborne.
  const g=make();place(g,'O',0,0,top);put(g,0,top+2);
  if(mode==='low')for(let i=0;i<29;i++)step(g);else advance(g,490);
  assert(move(g,1));assert(fits(g,{...active(g),y:active(g).y+1}));
  if(mode==='low'){step(g);step(g);assert.equal(active(g).y,Math.min(top+2,bottom-1));}
  else{advance(g,20);assert.equal(active(g).y,top);}
  assert.equal(grid(g)[top][1],blank);
  for(let i=0;i<200&&grid(g)[bottom][1]===blank;i++)step(g,16);
  assert.equal(grid(g)[bottom][1],value('O'));assert.equal(grid(g)[top][1],blank);
}
console.log(`${mode}: lock boundary, fifteen-reset cap and ledge mid-air-lock probe passed`);
const single=(g,perfect=false)=>{clear(g);for(const x of [0,1,2,7,8,9])put(g,x,bottom);
  if(!perfect)put(g,0,bottom-9);place(g,'I',0,3,bottom-1);};
const tetris=g=>{clear(g);for(let y=bottom-3;y<=bottom;y++)for(let x=0;x<10;x++)if(x!==4)put(g,x,y);
  put(g,0,bottom-9);place(g,'I',1,2,bottom-3);};
const evidence={};
for(const [n,expected]of [[1,100],[2,300],[3,500],[4,800]]){
  const g=make();if(n===1)single(g);else{
    for(let y=bottom-n+1;y<=bottom;y++)for(let x=0;x<10;x++)if(x!==4)put(g,x,y);
    put(g,0,bottom-9);place(g,'I',1,2,bottom-3);}
  hard(g);assert.equal(score(g),expected);assert.equal(lines(g),n);
}
{
  const g=make();single(g,true);hard(g);assert.equal(score(g),100);assert(empty(g));evidence.perfectClear=score(g);
  const b=make();tetris(b);hard(b);clear(b);place(b,'O',0,0,bottom-1);hard(b);tetris(b);hard(b);
  assert.equal(score(b),mode==='low'?1600:2000);evidence.b2b=score(b);
  single(b);hard(b);assert.equal(score(b),mode==='low'?1700:2150);
  const c=make();Object.assign(mode==='low'?c.stats:c,{level:2,lines:10});c.combo=0;single(c);hard(c);
  assert.equal(score(c),mode==='low'?200:300);evidence.levelTwoCombo=score(c);
  const crossing=make();(mode==='low'?crossing.stats:crossing).lines=9;single(crossing);hard(crossing);
  assert.equal(score(crossing),100);assert.equal(level(crossing),2);
}
for(const timed of [false,true])for(const full of [false,true])for(const line of [false,true]){
  const g=make(),y=bottom-2;put(g,5,y);put(g,3,bottom);put(g,full?3:5,full?y:bottom);
  if(line)for(const x of [0,1,2,6,7,8,9])put(g,x,bottom-1);
  place(g,'T',3,3,y);rotate(g,1);assert.equal(active(g).rotation,0);assert.equal(ghost(g),y);
  if(timed){if(mode==='low')for(let i=0;i<30;i++)step(g);else advance(g,500.000001);}else hard(g);
  const expected=mode==='low'?(line?100:0):mode==='high'?(line?800:400):full?(line?800:400):(line?200:100);
  assert.equal(score(g),expected);assert.equal(lines(g),Number(line));
  evidence[`${timed?'timed':'hard'}-${full?'full':'mini'}-${line?'single':'zero'}`]=score(g);
}
if(mode==='max'){
  const g=make(),p={type:'T',rot:0,x:3,y:bottom-2};put(g,3,bottom);put(g,5,bottom);put(g,5,bottom-2);
  assert.equal(core.detectTSpin(g.field,p,0),'mini');assert.equal(core.detectTSpin(g.field,p,4),'full');
  clear(g);assert.equal(core.detectTSpin(g.field,p,4),null);
  // Own-suite flakiness is a test-quality limitation, not an engine defect.
  const code="let s=16;Math.random=()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/2**32);await import('./dist/tests/tests.js');";
  const result=spawnSync(process.execPath,['--input-type=module','-e',code],{cwd:root,encoding:'utf8'});
  assert.equal(result.status,1);assert.match(result.stdout,/22 passed, 1 failed/);
  assert.match(result.stderr,/hard drop:.*next piece already spawned/);
  console.log('CONFIRMED own-test limitation: seed 16 fails the assertion that a random next piece cannot be I');
}
console.log(`${mode} scoring: ${JSON.stringify(evidence)}`);
{
  const g=make(['O']),y=active(g).y;
  if(mode==='low'){
    step(g);assert.equal(active(g).y,y+1);g.stats.level=2;step(g);assert.equal(active(g).y,y+2);
    const s=make(['O']);soft(s,true);step(s);assert.equal(active(s).y,18);assert.equal(score(s),0);
    console.log('CONFIRMED low: normal level 1/2 = one row/tick (60G/s); soft = 19 rows in one tick, zero points');
    const block=make(['T','I']);grid(block)[0].fill(value('J'));block.spawn(ids.indexOf('T'));
    assert(!over(block));assert.equal(active(block).y,-2);assert.equal(ghost(block),-2);
    hard(block);assert(over(block));
    console.log('CONFIRMED low: occupied spawn row relocates T to y=-2 and keeps playing until hidden lock');
  }else{
    const interval=mode==='high'?1000:267;advance(g,interval-1);assert.equal(active(g).y,y);step(g,1.000001);assert.equal(active(g).y,y+1);
    const fast=make(['O']);fast.level=2;fast.lines=10;const next=mode==='high'?793:217;
    advance(fast,next-1);assert.equal(active(fast).y,y);step(fast,1.000001);assert.equal(active(fast).y,y+1);
    const s=make(['O']);advance(s,mode==='high'?800:250);const before=active(s).y;soft(s,true);step(s,1);
    assert.equal(active(s).y-before,mode==='high'?16:0);assert.equal(score(s),mode==='high'?16:0);
    const ordinary=make(['O']);soft(ordinary,true);advance(ordinary,100);
    assert.equal(score(ordinary),mode==='high'?2:7);
    console.log(`${mode}: normal gravity ${interval}/${next} ms; normal-to-soft +1ms moves ${active(s).y-before} rows / ${score(s)} points; ordinary 100 ms soft ${score(ordinary)} rows/points`);
  }
}
{
  const g=make(['T','I']);
  if(mode==='max'){
    for(const [x,y]of [[2,2],[3,3],[4,3]])put(g,x,y);
    rotate(g,1);rotate(g,-1);move(g,-1);move(g,-1);
    assert.deepEqual(active(g),{type:'T',rotation:0,x:0,y:0});
  }else{
    for(const [x,y]of [[2,0],[3,1],[4,1]])put(g,x,y);
    rotate(g,1);rotate(g,-1);move(g,-1);move(g,-1);
    assert.deepEqual(active(g),{type:'T',rotation:0,x:0,y:-2});
  }
  assert(absolute(active(g)).every(([,y])=>y<skyline));assert.equal(ghost(g),active(g).y);
  assert(fits(g,{type:'I',rotation:0,x:3,y:mode==='max'?1:-1}));hard(g);
  assert.equal(over(g),mode!=='high');console.log(`${mode}: wholly hidden legal lock, incoming I open -> over ${over(g)}`);
}
{
  const g=make(['O','T','I']);place(g,'O',0,0,bottom-1);
  if(mode==='low'){
    // Its block-out failure is already asserted; force hidden lock through
    // public hard drop to exercise inert game over and R-equivalent reset.
    grid(g)[0].fill(value('J'));g.spawn(ids.indexOf('T'));hard(g);
  }else{put(g,4,mode==='max'?1:0);hard(g);}
  assert(over(g));const snapshot=()=>JSON.stringify({p:active(g),board:grid(g),score:score(g),held:held(g)});
  const before=snapshot();for(let i=0;i<10;i++)step(g,16);move(g,-1);rotate(g,1);hold(g);hard(g);assert.equal(snapshot(),before);
  restart(g);assert(!over(g));assert(empty(g));assert.equal(score(g),0);assert.equal(lines(g),0);assert.equal(level(g),1);
  assert.equal(held(g),null);assert(available(g));
}
console.log(`${mode} engine audit passed: recorded conformance and defects reproduced.`);

