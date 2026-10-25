import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const root = resolve(process.argv[2]), mode = process.argv[3];
assert(['low','medium','high','xhigh','max'].includes(mode));
const load = file => import(pathToFileURL(resolve(root, 'dist', file)));
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

const core = await load(mode === 'low' ? 'engine.js' : mode === 'high' ? 'src/game.js' : 'game.js');
const pieces = mode === 'xhigh' ? await load('pieces.js') : null;
const types = Object.keys(reference), bottom = mode === 'xhigh' ? 19 : 21;
const skyline = mode === 'xhigh' ? 0 : 2;
const seeded = seed => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
const make = (seed = 42) => {
  const random = seeded(seed);
  if (mode === 'xhigh') {
    const old = Math.random;
    // SevenBag consults Math.random on every refill, so bind only each draw.
    const { SevenBag } = randomizer;
    const bag = new SevenBag();
    const next = bag.next.bind(bag);
    bag.next = () => { Math.random = random; try { return next(); } finally { Math.random = old; } };
    return new core.TetrisGame(bag);
  }
  return new (core.Game ?? core.TetrisGame)(random);
};
const randomizer = mode === 'xhigh' ? await load('randomizer.js') : null;
const grid = g => mode === 'max' ? g.grid : ['high','xhigh'].includes(mode) ? g.board.cells : g.board;
const clear = g => grid(g).forEach(row => row.fill(null));
const put = (g,x,y) => { grid(g)[y][x] = 'J'; };
const active = g => g.active;
const over = g => mode === 'medium' ? g.over : mode === 'max' ? g._gameOver : g.gameOver;
const score = g => mode === 'medium' ? g.score.score : g.score;
const lines = g => mode === 'medium' ? g.score.lines : g.lines;
const level = g => mode === 'medium' ? g.score.level : mode === 'low' ? g.level + 1 : g.level;
const setLevel = (g,n,l=(n-1)*10) => {
  if (mode === 'medium') Object.assign(g.score,{level:n,lines:l});
  else if (mode === 'max') Object.assign(g,{_level:n,_lines:l});
  else Object.assign(g,{level:mode==='low'?n-1:n,lines:l});
};
const local = (t,r) => {
  const p={type:t,rotation:r,x:0,y:0};
  if (mode === 'low') return core.Game.prototype.cells(p);
  if (mode === 'medium') return core.cellsFor(t==='O'?{...p,rotation:0}:p);
  if (mode === 'high') return core.getCells(t,r);
  if (mode === 'xhigh') return pieces.getLocalCells(t,r).map(c=>[c.x,c.y]);
  return core.getPieceCells(p).map(c=>[c.x,c.y]);
};
const absolute = p => local(p.type,p.rotation).map(([x,y])=>[x+p.x,y+p.y]);
const fits = (g,p) => absolute(p).every(([x,y])=>x>=0&&x<10&&y<=bottom&&(y<0||grid(g)[y][x]===null));
const count = g => grid(g).flat().filter(Boolean).length;
const move = (g,d) => mode === 'high' ? (d===1?g.moveRight():g.moveLeft()) : g.move(d);
const rotate = (g,d) => g.rotate(['high','xhigh'].includes(mode)?d===1:d);
const step = (g,ms,soft=false) => ['high','xhigh'].includes(mode)?g.update(ms,soft):g.tick(ms);
const advance = (g,ms,soft=false) => { while(ms>1e-8){const dt=Math.min(ms,16);step(g,dt,soft);ms-=dt;} };
const hard = g => g.hardDrop();
const held = g => mode === 'max' ? g.held : g.hold;
const available = g => mode === 'max' ? g._canHold : mode === 'xhigh' ? !g.holdUsed : g.canHold;
const queue = g => ['medium','xhigh'].includes(mode)?g.next:g.queue;
const reset = g => mode === 'high'?g.restart():g.reset();
const ghost = g => mode==='high' ? (g.updateGhost(),g.ghost.y) : mode==='xhigh'?g.getGhostY():mode==='max'?g.getSnapshot().ghost.y:g.ghost().y;
const place = (g,t,r,x,y) => {
  g.active={type:t,rotation:r,x,y};
  Object.assign(g,{dropTimer:0,lockTimer:0,dropAccumulator:0,lockAccumulator:0,gravityElapsed:0,lockElapsed:0,
    lockResets:0,grounded:false,fallTimer:0,fallAccumulator:0,lastActionWasRotation:false});
  assert(fits(g,g.active),'fixture starts collision-free');
};
const key = cells => cells.map(([x,y])=>`${x},${y}`).sort().join(' ');
const evidence={mode,diagnosticOnly:mode==='medium'};
const record=(name,value)=>{evidence[name]=value;};
const colorSource=readFileSync(resolve(root,'src',mode==='xhigh'?'pieces.ts':mode==='max'?'game.ts':'main.ts'),'utf8');
const colorTable=colorSource.match(/(?:colors|colorClass|COLORS)[^=]*=\s*(\{[^}]+\})/)[1];
assert.equal(new Set([...colorTable.matchAll(/:\s*['"]([^'"]+)['"]/g)].map(m=>m[1])).size,7);

const wrongStates=[];
for(const t of types)for(let r=0;r<4;r++){
  // The 2x2 low O has one constant origin translation across all states.
  const actual=local(t,r).map(([x,y])=>[x+(mode==='low'&&t==='O'?1:0),y]);
  if(key(actual)!==key(reference[t][r]))wrongStates.push(t+r);
}
record('wrongStates',wrongStates);
const wrongKicks=[];
for(const t of types.filter(t=>t!=='O'))for(const transition of Object.keys(normalKicks)){
  const [from,to]=transition.split('>').map(Number),g=make();place(g,t,from,3,8);const seen=[];
  const capture=p=>{if(p.rotation===to)seen.push([p.x-3,p.y-8]);return false;};
  if(mode==='low')g.valid=capture;
  else if(mode==='medium')g.collides=p=>!capture(p);
  else if(mode==='high')g.board.collides=p=>!capture(p);
  else if(mode==='xhigh')g.board.canPlace=capture;
  else g.collides=p=>!capture(p);
  rotate(g,(to-from+4)%4===1?1:-1);
  const expected=(t==='I'?iKicks:normalKicks)[transition].map(([x,y])=>[x,-y||0]);
  if(JSON.stringify(seen)!==JSON.stringify(expected))wrongKicks.push(`${t}:${transition}`);
}
record('wrongKicks',wrongKicks);
for(const t of types){
 const g=make();place(g,t,0,3,8);
 for(const d of [-1,1]){for(let i=0;i<20;i++)move(g,d);const xs=absolute(g.active).map(([x])=>x);assert.equal(d<0?Math.min(...xs):Math.max(...xs),d<0?0:9);}
}
for(const t of ['T','I'])for(const d of [-1,1]){
 const g=make();const r=d===1?3:1;const cells=local(t,r);const x=d===1?9-Math.max(...cells.map(c=>c[0])):-Math.min(...cells.map(c=>c[0]));
 place(g,t,r,x,10);const before={...g.active};rotate(g,d);
 record(`wall-${t}-${d}`,{before,after:g.active,valid:fits(g,g.active)});
 assert(fits(g,g.active));if(mode!=='low')assert.equal(g.active.rotation,0);
}
for(let seed=1;seed<=10;seed++){
 const g=make(seed);for(let bag=0;bag<10;bag++){
  const dealt=[];for(let i=0;i<7;i++){dealt.push(g.active.type);clear(g);hard(g);assert(!over(g));}
  assert.deepEqual(dealt.sort(),[...types].sort());
 }
}
{
 const g=make(),first=g.active.type,next=queue(g)[0];rotate(g,1);g.holdPiece();
 const afterFirst={active:{...g.active},held:held(g),canHold:available(g),next};
 g.holdPiece();const afterSecond={active:{...g.active},held:held(g),canHold:available(g)};
 clear(g);hard(g);const afterLock=available(g);g.holdPiece();
 record('hold',{first,afterFirst,afterSecond,afterLock,afterSwap:{active:g.active,held:held(g),canHold:available(g)}});
 if(mode!=='low'){assert.equal(afterFirst.active.type,next);assert.equal(afterFirst.held,first);assert(!afterFirst.canHold);assert.deepEqual(afterSecond.active,afterFirst.active);assert(afterLock);assert.equal(g.active.type,first);assert.equal(g.active.rotation,0);}
}
for(const t of types){
 const g=make();place(g,t,0,3,0);put(g,4,bottom-3);const p={...g.active},y=ghost(g);
 assert(fits(g,{...p,y}));assert(!fits(g,{...p,y:y+1}));hard(g);
 record(`ghost-${t}`,{y,points:score(g),distance:y-p.y});
 assert.equal(score(g),(mode==='medium'?1:2)*(y-p.y));
 for(const [x,yy]of absolute({...p,y}))assert.equal(grid(g)[yy][x],t);
}
{
 const g=make(),oX=mode==='low'?4:3;place(g,'O',0,oX,bottom-1);if(mode==='high')g.softDrop();
 advance(g,499);const at499=count(g);step(g,1.000001);record('lockBoundary',{at499,at500:count(g)});
 const r=make();place(r,'O',0,oX,bottom-1);if(mode==='high')r.softDrop();let lockedAt=null;
 for(let i=0;i<30;i++){advance(r,490);if(count(r)>0){lockedAt=i;break;}move(r,i%2?-1:1);}
 if(lockedAt===null){advance(r,490);move(r,-1);advance(r,10.000001);}
 record('resetCap',{lockedAt,count:count(r)});
 const l=make();place(l,'O',0,mode==='low'?0:-1,bottom-5);put(l,0,bottom-3);if(mode==='high')l.softDrop();
 advance(l,490);assert.equal(count(l),1);move(l,1);assert(fits(l,{...l.active,y:l.active.y+1}));advance(l,20);
 record('ledge',{occupied:count(l),active:{...l.active}});assert.equal(count(l),1,'no mid-air lock');
 for(let i=0;i<500&&grid(l)[bottom][1]===null;i++)step(l,16);
 assert.equal(grid(l)[bottom][1],'O','eventual floor lock');
 const s=make();place(s,'O',0,oX,bottom-1);s.softDrop();record('groundedSoftLock',count(s));
}
// Integrated normal clears, PC/B2B/combo and level crossing, with no drop distance.
{
 const g=make();place(g,'O',0,mode==='low'?4:3,bottom-2);
 let elapsed=0;while(g.active.y===bottom-2&&elapsed<1500){step(g,1);elapsed++;}
 const landedAt=elapsed;let lockedAfter=0;while(count(g)===0&&lockedAfter<2000){step(g,1);lockedAfter++;}
 record('naturalLanding',{landedAt,lockedAfter,count:count(g)});
 const r=make();place(r,'O',0,mode==='low'?4:3,bottom-1);if(mode==='high')r.softDrop();
 advance(r,490);move(r,1);advance(r,309);const at309=count(r);step(r,1);record('resetPhase',{at309,at310:count(r)});
 // Fast alternating actions reveal the absent cap without normal gravity
 // reaching its next boundary. Medium's independent premature lock may end it.
 const cap=make();place(cap,'O',0,mode==='low'?4:3,bottom-1);if(mode==='high')cap.softDrop();
 for(let i=0;i<30;i++){advance(cap,10);move(cap,i%2?-1:1);}
 const resets=cap.lockResets;advance(cap,499);record('thirtyActions',{resets,countAt799:count(cap)});
 for(const type of ['T','I']){
  const k=make();place(k,type,0,3,mode==='low'&&type==='I'?bottom-3:bottom-1);rotate(k,1);record(`floor-${type}`,{active:k.active,valid:fits(k,k.active)});
 }
}
const single=(g,pc=false)=>{
 clear(g);const r=mode==='low'?1:0,y=bottom-1;const missing=new Set(local('I',r).map(([x])=>3+x));
 for(let x=0;x<10;x++)if(!missing.has(x))put(g,x,bottom);if(!pc)put(g,0,bottom-9);place(g,'I',r,3,y);
};
const tetris=(g,pc=false)=>{
 clear(g);const r=mode==='low'?0:1,x=mode==='low'?3:2,y=bottom-3;
 for(let yy=bottom-3;yy<=bottom;yy++)for(let xx=0;xx<10;xx++)if(xx!==4)put(g,xx,yy);
 if(!pc)put(g,0,bottom-9);place(g,'I',r,x,y);
};
for(const n of [1,2,3,4]){
 const g=make();if(n===1)single(g);else{
  tetris(g);for(let yy=bottom-3;yy<bottom-n+1;yy++)grid(g)[yy].fill(null);
 }hard(g);record(`normal${n}`,score(g));assert.equal(score(g),[0,100,300,500,800][n]);assert.equal(lines(g),n);
}
{
 const g=make();single(g,true);hard(g);assert.equal(count(g),0);record('singlePc',score(g));
 const b=make();tetris(b);hard(b);clear(b);place(b,'O',0,0,bottom-1);hard(b);tetris(b);hard(b);record('b2b',score(b));single(b);hard(b);record('b2bBreak',{score:score(b),backToBack:b._backToBack??b.backToBack});
 const c=make();setLevel(c,2);Object.assign(c,mode==='max'?{_combo:0}:{combo:0});single(c);hard(c);record('levelTwoCombo',score(c));
 const crossing=make();setLevel(crossing,1,9);single(crossing);hard(crossing);record('levelCrossing',{score:score(crossing),level:level(crossing)});
 const pc=make();tetris(pc);hard(pc);clear(pc);place(pc,'O',0,0,bottom-1);hard(pc);tetris(pc,true);hard(pc);assert.equal(count(pc),0);record('b2bTetrisPc',score(pc));
 const p=make();tetris(p);hard(p);clear(p);place(p,'O',0,0,bottom-1);hard(p);single(p,true);hard(p);record('singlePcAfterB2B',score(p));
 const consecutive=make();tetris(consecutive);hard(consecutive);tetris(consecutive);hard(consecutive);record('consecutiveTetrises',score(consecutive));
}
// Actual final CW rotation into r0; no forced spin flags. Low's r3 shape is
// shifted one column left so the same final orientation is reached legally.
for(const timed of [false,true])for(const full of [false,true])for(const line of [false,true]){
 const g=make(),y=bottom-2;put(g,5,y);put(g,3,bottom);put(g,full?3:5,full?y:bottom);
 if(line)for(const x of [0,1,2,6,7,8,9])put(g,x,bottom-1);
 place(g,'T',3,3,y);rotate(g,1);assert.equal(g.active.rotation,0);assert.equal(ghost(g),g.active.y);
 if(timed){if(mode==='high')g.softDrop();advance(g,500.000001);}else hard(g);
 record(`${timed?'timed':'hard'}-${full?'full':'mini'}-${line?'single':'zero'}`,score(g));
}
// No rotation and manual-down-after-rotation must not turn a corner pocket
// into a spin. High ignores last-action history; xhigh preserves it on down.
{
 const g=make(),y=bottom-2;for(const [x,yy]of [[3,y],[5,y],[3,bottom]])put(g,x,yy);place(g,'T',0,3,y);hard(g);record('nonRotationCornerLock',score(g));
 if(mode!=='low'){
  const s=make();for(const [x,yy]of [[3,y],[3,bottom],[5,bottom]])put(s,x,yy);place(s,'T',0,3,3);rotate(s,1);let rows=0;while(s.softDrop()){rows++;if(rows>30)throw Error('soft loop');}hard(s);record('manualSoftAfterRotation',{rows,extra:score(s)-rows});
 }
}
const intervals=[];
for(const n of [1,2,5,9,10,14,15,20]){
 const g=make();place(g,'O',0,3,0);setLevel(g,n);let elapsed=0;while(g.active.y===0&&elapsed<2000){step(g,1);elapsed++;}
 intervals.push({level:n,elapsed,score:score(g),profile:1000*(.8-(n-1)*.007)**(n-1)});
}
record('gravity',intervals);
{
 const g=make();place(g,'O',0,3,0);advance(g,800);const before={y:g.active.y,score:score(g)};g.softDrop();step(g,1,true);
 record('normalToSoft',{before,after:{y:g.active.y,score:score(g)}});
 const refresh=[];for(const hz of [60,144]){
  const g=make();place(g,'O',0,3,0);setLevel(g,2);let elapsed=0;while(elapsed<1480.001-1e-8){const dt=Math.min(1000/hz,1480.001-elapsed);step(g,dt);elapsed+=dt;}refresh.push({hz,y:g.active.y,score:score(g)});
 }record('refresh',refresh);
}
// Wholly hidden lock from a real spawn and legal public moves, with I spawn
// independently open. xhigh has a 20-row board and uses an above-top kick.
{
 const g=make();clear(g);let path,stack;
 if(mode==='low'){
  stack=[[6,2]];path=['R'];
 }else if(mode!=='xhigh'){
  stack=[[2,2],[3,3],[4,3]];path=['C','A','L','L','L'];
 }else{
  stack=[[6,0],[1,1],[3,2],[2,2]];path=['L','C','A','L','C','C','R','R','R','R','R'];
 }
 const spawn=()=>{
  if(mode==='low')g.spawn('T');else if(mode==='medium')g.spawn('T');else if(mode==='high')g.spawn('T');else if(mode==='max')g.activate('T');else g.active=g.createSpawn('T');
 };
 clear(g);spawn();queue(g)[0]='I';for(const [x,y]of stack)put(g,x,y);
 for(const a of path)if(a==='L'||a==='R')move(g,a==='L'?-1:1);else rotate(g,a==='C'?1:-1);
 const pose={...g.active};assert(absolute(pose).every(([,y])=>y<skyline));assert.equal(ghost(g),pose.y);assert(fits(g,{type:'I',rotation:0,x:3,y:0}));hard(g);
 record('hiddenLockOut',{stack,path,pose,over:over(g)});
}
{
 const g=make();clear(g);place(g,'O',0,0,bottom-1);queue(g)[0]='T';put(g,mode==='low'?5:4,0);hard(g);assert(over(g));
 const snap=()=>JSON.stringify([g.active,grid(g),score(g),held(g)]),before=snap();move(g,-1);rotate(g,1);g.holdPiece();hard(g);advance(g,1000);record('gameOverInert',snap()===before);
 reset(g);record('reset',{over:over(g),count:count(g),score:score(g),lines:lines(g),level:level(g),held:held(g),canHold:available(g)});
 assert(!over(g));assert.equal(count(g),0);assert.equal(score(g),0);assert.equal(lines(g),0);assert.equal(level(g),1);assert.equal(held(g),null);assert(available(g));
}
// Assert the confirmed findings as well as conformance. A passing audit
// reproduces these defects; it does not declare the implementation bug-free.
assert.deepEqual(evidence.wrongStates,mode==='low'?['I0','I1','I2','I3','J1','L1','S1','S2','T1','Z1','Z2']:[]);
assert.deepEqual(evidence.wrongKicks,['low','max'].includes(mode)?types.filter(t=>t!=='O').flatMap(t=>Object.keys(normalKicks).map(k=>`${t}:${k}`)):[]);
assert.deepEqual(evidence.lockBoundary,{at499:0,at500:4});
assert.equal(evidence.resetCap.lockedAt,['low','medium'].includes(mode)?1:16);
assert.equal(evidence.groundedSoftLock,mode==='low'?4:0);
assert.deepEqual(evidence.resetPhase,{at309:0,at310:['low','medium'].includes(mode)?4:0});
assert.deepEqual(evidence.thirtyActions,{resets:['low','medium'].includes(mode)?0:15,countAt799:['low','medium'].includes(mode)?0:4});
assert.deepEqual(evidence.naturalLanding,{landedAt:['low','medium','high'].includes(mode)?800:1000,lockedAfter:mode==='high'?1299:mode==='max'?500:499,count:4});
assert.equal(evidence.singlePc,mode==='max'?900:100);
const basic=['low','medium'].includes(mode);
assert.equal(evidence.b2b,basic?1600:2000);
assert.equal(evidence.b2bBreak.score,basic?1700:2150);
if(!basic)assert.equal(evidence.b2bBreak.backToBack,false);
assert.equal(evidence.consecutiveTetrises,basic?1600:mode==='high'?2075:2050);
assert.equal(evidence.levelTwoCombo,basic?200:300);
assert.deepEqual(evidence.levelCrossing,{score:mode==='low'?200:100,level:2});
assert.equal(evidence.b2bTetrisPc,mode==='max'?4000:basic?1600:2000);
assert.equal(evidence.singlePcAfterB2B,mode==='max'?1700:900);
for(const timed of [false,true])for(const full of [false,true])for(const line of [false,true]){
 const expected=basic?(line?100:0):full||mode!=='max'?(line?800:400):(line?200:100);
 assert.equal(evidence[`${timed?'timed':'hard'}-${full?'full':'mini'}-${line?'single':'zero'}`],expected);
}
assert.equal(evidence.nonRotationCornerLock,mode==='high'?400:0);
if(mode!=='low')assert.deepEqual(evidence.manualSoftAfterRotation,{rows:mode==='xhigh'?14:16,extra:['high','xhigh'].includes(mode)?400:0});
const expectedGravity={low:[800,735,540,280,215,80,80,80],medium:[800,735,540,280,215,70,70,70],high:[800,717,467,134,100,34,17,17],xhigh:[1000,793,355,94,64,11,7,5],max:[1000,793,355,99,72,21,16,16]};
assert.deepEqual(evidence.gravity.map(e=>e.elapsed),expectedGravity[mode]);
assert.deepEqual(evidence.gravity.map(e=>e.score),Array(8).fill(basic?1:0));
assert.deepEqual(evidence.refresh.map(e=>e.y),mode==='low'?[1,2]:['medium','high'].includes(mode)?[2,2]:[1,1]);
assert.equal(evidence.normalToSoft.after.y-evidence.normalToSoft.before.y,mode==='xhigh'?18:1);
assert.equal(evidence.normalToSoft.after.score-evidence.normalToSoft.before.score,mode==='xhigh'?18:1);
assert.equal(evidence.hiddenLockOut.over,false);
assert.equal(evidence.gameOverInert,mode!=='low');
if(mode==='low'){
 assert.equal(evidence.hold.afterFirst.active.type,evidence.hold.first);
 assert.equal(evidence.hold.afterFirst.canHold,true);
 assert.notEqual(evidence.hold.afterFirst.active.type,evidence.hold.afterFirst.next);
 assert.deepEqual(evidence.hold.afterSecond.active,evidence.hold.afterFirst.active);
}
console.log(JSON.stringify(evidence,null,2));
console.log(`${mode}: canonical SRS/kicks, 100 seeded engine bags, hold/ghost/drop, lock/cap/ledge, scoring, gravity, hidden lock, game over/reset findings asserted`);

