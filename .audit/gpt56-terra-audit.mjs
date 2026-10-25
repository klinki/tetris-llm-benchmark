// Shared equivalent-rule probes for Terra and Qwen Max. Builds must be temporary.
// Main-module clocks use unchanged emitted callbacks in a no-op DOM VM.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import vm from 'node:vm';
const reference = {
  I: [[[0,1],[1,1],[2,1],[3,1]], [[2,0],[2,1],[2,2],[2,3]], [[0,2],[1,2],[2,2],[3,2]], [[1,0],[1,1],[1,2],[1,3]]],
  J: [[[0,0],[0,1],[1,1],[2,1]], [[1,0],[2,0],[1,1],[1,2]], [[0,1],[1,1],[2,1],[2,2]], [[1,0],[1,1],[0,2],[1,2]]],
  L: [[[2,0],[0,1],[1,1],[2,1]], [[1,0],[1,1],[1,2],[2,2]], [[0,1],[1,1],[2,1],[0,2]], [[0,0],[1,0],[1,1],[1,2]]],
  O: Array.from({ length: 4 }, () => [[1,0],[2,0],[1,1],[2,1]]),
  S: [[[1,0],[2,0],[0,1],[1,1]], [[1,0],[1,1],[2,1],[2,2]], [[1,1],[2,1],[0,2],[1,2]], [[0,0],[0,1],[1,1],[1,2]]],
  T: [[[1,0],[0,1],[1,1],[2,1]], [[1,0],[1,1],[2,1],[1,2]], [[0,1],[1,1],[2,1],[1,2]], [[1,0],[0,1],[1,1],[1,2]]],
  Z: [[[0,0],[1,0],[1,1],[2,1]], [[2,0],[1,1],[2,1],[1,2]], [[0,1],[1,1],[1,2],[2,2]], [[1,0],[0,1],[1,1],[0,2]]],
};
// Independent published SRS offsets with positive Y upward; negated below.
const normalKicks = {
  '0>1': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]], '1>0': [[0,0],[1,0],[1,-1],[0,2],[1,2]],
  '1>2': [[0,0],[1,0],[1,-1],[0,2],[1,2]], '2>1': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  '2>3': [[0,0],[1,0],[1,1],[0,-2],[1,-2]], '3>2': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  '3>0': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]], '0>3': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
};
const iKicks = {
  '0>1': [[0,0],[-2,0],[1,0],[-2,-1],[1,2]], '1>0': [[0,0],[2,0],[-1,0],[2,1],[-1,-2]],
  '1>2': [[0,0],[-1,0],[2,0],[-1,2],[2,-1]], '2>1': [[0,0],[1,0],[-2,0],[1,-2],[-2,1]],
  '2>3': [[0,0],[2,0],[-1,0],[2,1],[-1,-2]], '3>2': [[0,0],[-2,0],[1,0],[-2,-1],[1,2]],
  '3>0': [[0,0],[1,0],[-2,0],[1,-2],[-2,1]], '0>3': [[0,0],[-1,0],[2,0],[-1,2],[2,-1]],
};

export async function runAudit(root, mode, family = 'terra') {
  root = resolve(root);
  const qwen = family === 'qwen', low = mode === 'low', medium = mode === 'medium', max = !qwen && mode === 'max';
  assert((qwen ? ['low','medium'] : ['low','medium','high','xhigh','max']).includes(mode));
  const load = file => import(pathToFileURL(resolve(root, 'dist', qwen && low ? 'src' : '', file)));
  const core = !qwen && medium ? null : await load(!qwen && mode === 'xhigh' ? 'engine.js' : 'game.js');
  const pieces = qwen ? await load('pieces.js') : null;
  const offset = qwen ? (low ? 4 : 2) : mode === 'high' || max ? 2 : 0;
  const types = Object.keys(reference), bottom = 19;
  const seeded = seed => () => ((seed = (Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
  const apps = new WeakMap();
  const withRandom = (random, fn) => { const old = Math.random; Math.random = random; try { return fn(); } finally { Math.random = old; } };
  function make(seed = 42) {
    const random = seeded(seed);
    if(qwen) return new core.Game(random);
    // Only DOM/environment surfaces and import bindings are supplied. Engine,
    // input, rendering and frame function bodies remain byte-for-byte emitted JS.
    const elements = new Map(), handlers = {};
    const noop = () => {};
    const context = new Proxy({canvas:{width:360,height:720},createLinearGradient:()=>({addColorStop:noop})}, {get:(t,p)=>p in t?t[p]:noop,set:(t,p,v)=>(t[p]=v,true)});
    const element = id => {
      if(!elements.has(id)) elements.set(id,{width:360,height:720,style:{setProperty:noop},classList:{toggle:noop},append:noop,addEventListener:noop,getContext:()=>context});
      return elements.get(id);
    };
    const document = {querySelector:element,querySelectorAll:()=>[],getElementById:element,createElement:element,addEventListener:(n,fn)=>handlers[n]=fn};
    const sandbox = {...core,document,performance:{now:()=>0},requestAnimationFrame:noop,console,
      addEventListener:(n,fn)=>handlers[n]=fn,HTMLCanvasElement:Object,HTMLElement:Object};
    sandbox.window=sandbox;sandbox.Math=Object.create(Math);sandbox.Math.random=random;
    const ctx=vm.createContext(sandbox);
    const file=mode==='xhigh'?'index.js':'main.js';
    let source=readFileSync(resolve(root,'dist',file),'utf8').replace(/^import[\s\S]*?from\s+["'][^"']+["'];\s*/gm,'').replace(/export class /g,'class ');
    const frame=max?'animationFrame':mode==='high'?'tick':mode==='xhigh'?'update':'loop';
    const clocks=max?'previousFrame=0;game.gravityElapsed=0;game.lockElapsed=0;game.lockResets=0;':mode==='high'?'last=0;gravityElapsed=0;lockElapsed=0;lockResets=0;':mode==='xhigh'?'previousTime=0;gravityElapsed=0;groundedElapsed=0;lockResets=0;':'last=0;elapsed=0;';
    source+=`\nglobalThis.__app={get game(){return game},frame:${frame},resetClock(){${clocks}},key(e){globalThis.__keydown(e)}};`;
    withRandom(random,()=>vm.runInContext(source,ctx));
    ctx.__keydown=handlers.keydown;
    const app=ctx.__app,g=app.game;app.resetClock();apps.set(g,{app,time:0,random});return g;
  }
  const native = g => qwen ? (low?g.piece:g.current) : (low||medium?g.current:g.active);
  const active = g => {const p=native(g);return p && {type:p.type??p.kind,rotation:p.rotation??p.rot,x:p.x??p.col,y:(p.y??p.row)-offset};};
  const setActive = (g,p) => {
    if(qwen && !low) g.current={type:p.type,rot:p.rotation,col:p.x,row:p.y+offset};
    else {const value={...(qwen||(!low&&!medium)?{type:p.type}:{kind:p.type}),rotation:p.rotation,x:p.x,y:p.y+offset};if(qwen)g.piece=value;else if(low||medium)g.current=value;else g.active=value;}
  };
  const get = (g,x,y) => y+offset<0 ? null : qwen ? (low?g.board.grid[y+offset][x]:g.board.cells[(y+offset)*10+x]) : g.board[y+offset][x];
  const put = (g,x,y,type='J') => {if(qwen){if(low)g.board.grid[y+offset][x]=1;else g.board.cells[(y+offset)*10+x]=2;}else g.board[y+offset][x]=type;};
  const clear = g => {if(qwen)g.board.reset();else g.board.forEach(r=>r.fill(null));};
  const count = g => qwen ? (low?g.board.grid.flat():Array.from(g.board.cells)).filter(Boolean).length : g.board.flat().filter(Boolean).length;
  const local = (type,r) => {
    if(qwen && !low){const a=[];pieces.STATES[type][r].forEach((row,y)=>row.forEach((v,x)=>{if(v)a.push([x,y]);}));return a;}
    if(qwen)return pieces.shapeCells(type,r);
    if(max)return core.getPieceCells({type,rotation:r,x:0,y:0}).map(c=>[c.x,c.y]);
    if(mode==='xhigh')return core.cellsFor({type,rotation:r,x:0,y:0});
    const g=make();return JSON.parse(JSON.stringify(g.cells({...native(g),type,kind:type,rotation:r,x:0,y:0})));
  };
  // Cache local geometry; main-module rendering must never replace the oracle.
  const geometry=Object.fromEntries(types.map(t=>[t,Array.from({length:4},(_,r)=>local(t,r))]));
  const cells = p => geometry[p.type][p.rotation].map(([x,y])=>[x+p.x,y+p.y]);
  const fits = (g,p) => cells(p).every(([x,y])=>x>=0&&x<10&&y<=bottom&&!get(g,x,y));
  const over = g => max ? g.phase==='gameover' : qwen ? (low?g.state==='over':g.gameOver) : (low||medium?g.over:g.gameOver);
  const canHold = g => max ? !g.holdUsed : g.canHold;
  const queue = g => qwen?g.nextQueue:g.queue;
  const held = g => qwen?(low?g.holdType:g.hold):mode==='high'?g.held:g.hold;
  const keyEvent = key => ({key,code:({' ':'Space',c:'KeyC',r:'KeyR',x:'KeyX',z:'KeyZ',Control:'ControlLeft'})[key]??key,preventDefault(){},repeat:false});
  const key = (g,k) => apps.get(g).app.key(keyEvent(k));
  const move = (g,d) => max ? g.handle(d<0?'left':'right') : g.move(d,...(!qwen?[0]:[]));
  const rotate = (g,d) => max ? g.handle(d===1?'rotateClockwise':'rotateCounterClockwise') : g.rotate(d);
  const hard = g => max ? g.handle('hardDrop') : qwen?g.hardDrop():withRandom(apps.get(g).random,()=>g.hardDrop());
  const hold = g => max ? g.handle('hold') : qwen?(low?g.hold():g.holdPiece()):mode==='high'?g.hold():g.holdPiece();
  const step = (g,ms,soft=false) => {
    if(qwen){if(low)g.softDropping=soft;else g.softDropHeld=soft;g.update(low?ms/1000:ms);}
    else {const a=apps.get(g);a.time+=ms;withRandom(a.random,()=>a.app.frame(a.time));}
  };
  const advance = (g,ms,soft=false) => {while(ms>1e-8){const dt=Math.min(ms,16);step(g,dt,soft);ms-=dt;}};
  const reset = g => {if(qwen){g.restart();return g;}key(g,'r');const fresh=apps.get(g).app.game;apps.set(fresh,apps.get(g));return fresh;};
  const place = (g,type,rotation,x,y) => {
    setActive(g,{type,rotation,x,y});
    if(qwen)Object.assign(g,{fallTimer:0,gravityAccum:0,lockTimer:0,lockResets:0,lastMoveWasRotation:false,lastKickIndex:-1});
    else {const a=apps.get(g);a.app.resetClock();a.time=0;g.lastAction='move';}
    assert(fits(g,active(g)),'fixture starts collision-free');
  };
  const ghost = g => max ? g.getGhostPiece().y-offset : qwen?(low?g.ghostY():g.dropPosition())-offset:low?g.ghost().y:medium||mode==='high'?g.ghostY()-offset: (()=>{let p=active(g);while(fits(g,{...p,y:p.y+1}))p={...p,y:p.y+1};return p.y;})();
  const soft = g => {const p=active(g);if(qwen){step(g,50,true);}else key(g,'ArrowDown');return active(g)?.y!==p.y;};
  const colorFile=qwen?'pieces.ts':mode==='xhigh'?'index.ts':mode==='medium'?'main.ts':'game.ts';
  const colorText=readFileSync(resolve(root,'src',colorFile),'utf8');
  const colorTable=colorText.match(/COLORS[^=]*=\s*\{([\s\S]*?)\n?\};/)[1];
  const colors=new Set([...colorTable.matchAll(/#[0-9a-fA-F]{6}/g)].map(m=>m[0].toLowerCase()));
  assert.equal(colors.size,mode==='xhigh'&&!qwen?21:7);
  const evidence={family,mode};
  const record=(name,value)=>evidence[name]=JSON.parse(JSON.stringify(value));
  const cellKey = a => a.map(p=>p.join(',')).sort().join(' ');
  const wrongStates=[];
  for(const t of types)for(let r=0;r<4;r++)if(cellKey(geometry[t][r].map(([x,y])=>[x+(qwen&&t==='O'?1:0),y]))!==cellKey(reference[t][r]))wrongStates.push(t+r);
  record('wrongStates',wrongStates);assert.deepEqual(wrongStates,[]);
  const wrongKicks=[];
  for(const t of types.filter(t=>t!=='O'))for(const trans of Object.keys(normalKicks)){
    const [from,to]=trans.split('>').map(Number),g=make();place(g,t,from,3,8);const seen=[];
    const capture=p=>{if((p.rotation??p.rot)===to)seen.push([(p.x??p.col)-3,(p.y??p.row)-offset-8]);return false;};
    if(max)g.isValid=capture;
    else if(qwen&&low)g.canPlace=capture;
    else if(qwen)g.board.collides=(m,row,col)=>!capture({rot:to,row,col});
    else if(low||medium)g.valid=capture;
    else if(mode==='high')g.fits=capture;
    else {
      // canPlace is a lexical function. A board proxy records each candidate's
      // first shape cell while reporting it occupied, so each attempt fails.
      const first=geometry[t][to][0];
      g.board=new Proxy(g.board,{get:(rows,y)=>/^\d+$/.test(String(y))?new Proxy(rows[y],{get:(row,x)=>{if(/^\d+$/.test(String(x)))seen.push([+x-first[0]-3,+y-first[1]-offset-8]);return 'J';}}):rows[y]});
    }
    rotate(g,(to-from+4)%4===1?1:-1);
    const expected=(t==='I'?iKicks:normalKicks)[trans].map(([x,y])=>[x,-y||0]);
    if(JSON.stringify(seen)!==JSON.stringify(expected))wrongKicks.push(`${t}:${trans}`);
  }
  record('wrongKicks',wrongKicks);
  const concrete={};
  for(const t of ['T','I'])for(const side of [-1,1]){
    const g=make(),r=side===-1?1:3,xx=side===-1?-Math.min(...geometry[t][r].map(p=>p[0])):9-Math.max(...geometry[t][r].map(p=>p[0]));place(g,t,r,xx,8);rotate(g,side===-1?-1:1);concrete[`${t}Wall${side}`]=active(g);assert(fits(g,active(g)));
  }
  for(const t of ['T','I']){const g=make();place(g,t,0,3,18);rotate(g,1);concrete[`${t}Floor`]=active(g);assert(fits(g,active(g)));}
  record('concreteKicks',concrete);
  for(const t of types){const g=make();place(g,t,0,3,8);for(const d of [-1,1]){for(let i=0;i<20;i++)move(g,d);const xs=cells(active(g)).map(p=>p[0]);assert.equal(d<0?Math.min(...xs):Math.max(...xs),d<0?0:9);}}
  for(let seed=1;seed<=10;seed++){const g=make(seed);for(let bag=0;bag<10;bag++){const dealt=[];for(let i=0;i<7;i++){dealt.push(active(g).type);clear(g);hard(g);assert(!over(g));}assert.deepEqual(dealt.sort(),[...types].sort());}}
  record('bags',100);
  {const g=make(),first=active(g).type,next=queue(g)[0];rotate(g,1);hold(g);assert.equal(active(g).type,next);assert.equal(held(g),first);assert(!canHold(g));const kept=active(g);hold(g);assert.deepEqual(active(g),kept);clear(g);hard(g);assert(canHold(g));const outgoing=active(g).type;hold(g);assert.equal(active(g).type,first);assert.equal(active(g).rotation,0);assert.equal(held(g),outgoing);record('hold','restriction, queue, post-lock retrieval and orientation pass');}
  for(const t of types){const g=make();place(g,t,0,3,0);put(g,4,16);const p=active(g),y=ghost(g);assert(fits(g,{...p,y}));assert(!fits(g,{...p,y:y+1}));hard(g);assert.equal(g.score,2*(y-p.y));for(const[x,yy]of cells({...p,y}))assert(get(g,x,yy));}
  record('ghost','seven obstructed landing poses, points and welded cells pass');
  const ox=qwen?0:-1;
  {const g=make();place(g,'O',0,3,18);advance(g,499);const at499=count(g);step(g,1.000001);record('lockBoundary',{at499,at500:count(g)});
   const r=make();place(r,'O',0,3,18);advance(r,490);if(qwen)move(r,1);else key(r,'ArrowRight');advance(r,20);record('resetAfter20',count(r));
   const c=make();place(c,'O',0,3,18);let lockedAt=null;for(let i=0;i<30;i++){advance(c,490);if(count(c)){lockedAt=i;break;}if(qwen)move(c,i%2?-1:1);else key(c,i%2?'ArrowLeft':'ArrowRight');}record('resetCap',{lockedAt,count:count(c)});
   const l=make();place(l,'O',0,ox,12);put(l,0,14);advance(l,490);assert.equal(count(l),1);if(qwen)move(l,1);else key(l,'ArrowRight');assert(fits(l,{...active(l),y:active(l).y+1}));advance(l,20);record('ledge',{occupied:count(l),active:active(l)});assert.equal(count(l),1);for(let i=0;i<500&&!get(l,1,19);i++)step(l,16);assert(get(l,1,19),'eventual floor lock');
   const s=make();place(s,'O',0,3,18);soft(s);record('groundedSoftLock',count(s));
   const n=make();place(n,'O',0,3,17);let landedAt=0;while(active(n).y===17&&landedAt<2000){step(n,1);landedAt++;}let lockedAfter=0;while(!count(n)&&lockedAfter<2000){step(n,1);lockedAfter++;}record('naturalLanding',{landedAt,lockedAfter});}
  if(max){
    // The unchanged callback must not count time before contact as grounded.
    const counts=[];
    for(const parts of [[1000],Array(10).fill(100)]){
      const g=make();place(g,'O',0,3,17);for(const ms of parts)step(g,ms);counts.push(count(g));
    }
    record('landingFramePartition',{single1000:counts[0],ten100:counts[1]});
    const g=make();place(g,'O',0,3,17);step(g,990);step(g,16);advance(g,483);const at1489=count(g);step(g,1);record('landingFrame16',{at1489,at1490:count(g)});
  }
  const well=(g,n,pc=false)=>{clear(g);for(let y=20-n;y<=19;y++)for(let x=0;x<10;x++)if(x!==4)put(g,x,y);if(!pc)put(g,0,10);place(g,'I',1,2,16);};
  const pcSingle=g=>{clear(g);for(let x=0;x<10;x++)if(x<3||x>6)put(g,x,19);place(g,'I',0,3,18);};
  const filler=g=>{clear(g);place(g,'O',0,7,18);hard(g);};
  for(const n of [1,2,3,4]){const g=make();well(g,n);hard(g);record(`normal${n}`,g.score);assert.equal(g.lines,n);}
  {const p=make();pcSingle(p);hard(p);record('singlePc',p.score);assert.equal(count(p),0);
   const b=make();well(b,4);hard(b);filler(b);well(b,4);hard(b);record('b2b',b.score);well(b,1);hard(b);record('b2bBreak',b.score);
   const c=make();c.lines=10;c.level=2;c.combo=0;well(c,1);hard(c);record('levelTwoCombo',c.score);
   const x=make();x.lines=9;well(x,1);hard(x);record('levelCrossing',{score:x.score,lines:x.lines,level:x.level});
   const t=make();well(t,4);hard(t);filler(t);well(t,4,true);hard(t);record('b2bTetrisPc',t.score);
   const a=make();well(a,4);hard(a);filler(a);pcSingle(a);hard(a);record('singlePcAfterB2B',a.score);
   const k=make();well(k,4);hard(k);well(k,4);hard(k);record('consecutiveTetrises',k.score);}
  for(const timed of [false,true])for(const full of [false,true])for(const line of [false,true]){
    const g=make();put(g,5,17);put(g,3,19);put(g,full?3:5,full?17:19);if(line)for(const x of [0,1,2,6,7,8,9])put(g,x,18);
    place(g,'T',3,3,17);rotate(g,1);assert.deepEqual(active(g),{type:'T',rotation:0,x:3,y:17});assert.equal(ghost(g),17);
    if(timed)advance(g,!qwen&&(low||medium)?1100:500.000001);else hard(g);
    record(`${timed?'timed':'hard'}-${full?'full':'mini'}-${line?'single':'zero'}`,g.score);
  }
  {const g=make();for(const[x,y]of [[3,17],[5,17],[3,19]])put(g,x,y);place(g,'T',0,3,17);hard(g);record('nonRotationCornerLock',g.score);}
  {const values=[];for(const level of [1,2,5,9,10,14,15,20]){const g=make();g.level=level;g.lines=(level-1)*10;place(g,'O',0,3,0);let elapsed=0;while(active(g).y===0&&elapsed<2000){step(g,1);elapsed++;}values.push({level,elapsed,score:g.score});}record('gravity',values);}
  {const g=make();place(g,'O',0,3,0);advance(g,800);const before={y:active(g).y,score:g.score};if(qwen)step(g,1,true);else{key(g,'ArrowDown');step(g,1);}record('normalToSoft',{before,after:{y:active(g).y,score:g.score}});
   const refresh=[];for(const hz of [60,144]){const g=make();g.level=10;place(g,'O',0,3,0);let elapsed=0;while(elapsed<600-1e-8){const dt=Math.min(1000/hz,600-elapsed);step(g,dt);elapsed+=dt;}refresh.push(active(g).y);}record('refresh',refresh);}
  {const refresh={};for(const [level,duration] of [[2,1480.001],[2,1564],[10,600],[15,600]]){const values=[];for(const hz of [60,144]){const g=make();g.level=level;place(g,'O',0,3,0);let elapsed=0;while(elapsed<duration-1e-8){const dt=Math.min(1000/hz,duration-elapsed);step(g,dt);elapsed+=dt;}values.push(active(g).y);}refresh[level+':'+duration]=values;}record('refreshVariants',refresh);}
  if(!qwen){
    const replacement=make();place(replacement,'O',0,3,0);advance(replacement,400);key(replacement,'c');const spawnRow=active(replacement).y;let firstRowAfterHold=0;while(active(replacement).y===spawnRow&&firstRowAfterHold<2000){step(replacement,1);firstRowAfterHold++;}record('firstRowAfterHold',firstRowAfterHold);
    const g=make();place(g,'O',0,3,18);advance(g,490);key(g,'ArrowRight');advance(g,490);key(g,'ArrowLeft');advance(g,20);record('twoMoveLockAt1000',count(g));
    if(mode==='high'){
      const h=make();place(h,'O',0,3,18);for(let i=0;i<15;i++){advance(h,10);key(h,i%2?'ArrowLeft':'ArrowRight');}key(h,'c');
      const p=active(h);while(gap(h)>0)h.softDrop();advance(h,490);const before=count(h);key(h,'ArrowRight');advance(h,20);record('holdInheritedResetCount',{first:p,before,locked:count(h)>0});
      const t=make();place(t,'O',0,3,0);advance(t,800);key(t,'c');const incoming=active(t);advance(t,199);const beforeRow=active(t).y;step(t,1);record('holdGravityCarry',{incoming,beforeRow,afterRow:active(t).y});
    }
  }
  function gap(g){return ghost(g)-active(g).y;}
  if(qwen&&low){const g=make();place(g,'O',0,3,18);for(let i=0;i<15;i++){advance(g,10);move(g,i%2?-1:1);}const before=count(g);step(g,1);record('capAt151',{before,after:count(g)});}
  // Integrated spin cancellation, mini B2B and a real two-rotation double.
  {const g=make();for(const[x,y]of [[0,17],[0,19],[2,19]])put(g,x,y);place(g,'T',0,0,3);rotate(g,1);let rows=0;while(gap(g)>0){const before=active(g).y;soft(g);rows+=active(g).y-before;}hard(g);record('manualSoftSpin',{rows,extra:g.score-rows});}
  {const g=make();well(g,4);hard(g);filler(g);clear(g);for(const[x,y]of [[5,17],[3,19],[5,19]])put(g,x,y);for(const x of [0,1,2,6,7,8,9])put(g,x,18);place(g,'T',3,3,17);rotate(g,1);advance(g,!qwen&&(low||medium)?1100:500.000001);record('miniAfterB2B',g.score);}
  for(const timed of [false,true]){const g=make();for(let x=0;x<10;x++){if(x!==4)put(g,x,19);if(x<3||x>5)put(g,x,18);}put(g,3,17);place(g,'T',0,3,17);rotate(g,1);rotate(g,1);assert.equal(active(g).rotation,2);if(timed)advance(g,!qwen&&(low||medium)?1100:500.000001);else hard(g);record(timed?'timedFullDouble':'hardFullDouble',{score:g.score,lines:g.lines});}
  // Public-action hidden lock-out search. Only stack cells are injected. Each
  // result is replayed from an actual spawn with incoming I independently open.
  function spawn(g,type){if(qwen&&low){g.nextQueue[0]=type;g.spawnNext();}else if(qwen)g.placePiece(type);else g.spawn(type);}
  const search=make(8),rng=seeded(1234);let found=null;
  for(let trial=0;trial<6000&&!found;trial++){
    clear(search);spawn(search,'T');const start=active(search);spawn(search,'I');const incoming=active(search);spawn(search,'T');
    const excluded=new Set([...cells(start),...cells(incoming)].map(p=>p.join(','))),stack=[];
    for(let i=0;i<1+trial%7;i++){const p=[Math.floor(rng()*10),Math.floor(rng()*4)];if(!excluded.has(p.join(','))&&!get(search,...p)){put(search,...p);stack.push(p);}}
    const todo=[{p:start,path:[]}],seen=new Set();
    for(let i=0;i<todo.length&&i<250&&!found;i++){
      const {p,path}=todo[i],id=JSON.stringify(p);if(seen.has(id))continue;seen.add(id);setActive(search,p);
      if(cells(p).every(([,y])=>y<0)&&!fits(search,{...p,y:p.y+1})&&cells(incoming).every(([x,y])=>!get(search,x,y)&&!cells(p).some(([a,b])=>a===x&&b===y))){found={stack,start,path,pose:p,incoming};break;}
      if(path.length===9)continue;
      for(const a of ['L','R','C','A']){setActive(search,p);a==='L'||a==='R'?move(search,a==='L'?-1:1):rotate(search,a==='C'?1:-1);const n=active(search);if(n.y>=-6&&n.y<=1&&!seen.has(JSON.stringify(n)))todo.push({p:n,path:[...path,a]});}
    }
  }
  assert(found,'bounded public hidden-lock fixture exists');
  {const g=make();clear(g);for(const[x,y]of found.stack)put(g,x,y);spawn(g,'T');queue(g)[0]='I';for(const a of found.path)a==='L'||a==='R'?move(g,a==='L'?-1:1):rotate(g,a==='C'?1:-1);assert.deepEqual(active(g),found.pose);assert.equal(ghost(g),found.pose.y);hard(g);record('hiddenLockOut',{...found,over:over(g)});}
  if(qwen){const g=make();put(g,8,1);spawn(g,'T');queue(g)[0]='I';for(let i=0;i<4;i++)assert(move(g,1));advance(g,1000);const pose=active(g);assert(pose&&cells(pose).some(([,y])=>y<0)&&cells(pose).some(([,y])=>y>=0));assert.equal(ghost(g),pose.y);assert(fits(g,{type:'I',rotation:0,x:3,y:-2}),'incoming I open');hard(g);record('partialLockOut',{pose,over:over(g)});}
  {const g=make();place(g,'O',0,0,18);queue(g)[0]='T';put(g,4,(!qwen&&(low||medium))?0:!qwen&&mode==='xhigh'?1:-2);hard(g);assert(over(g),'blocked spawn ends game');const snapshot=()=>JSON.stringify([active(g),qwen?g.board:g.board,g.score,held(g)]),before=snapshot();move(g,-1);rotate(g,1);hold(g);hard(g);record('engineGameOverInert',snapshot()===before);const fresh=reset(g);record('reset',{over:over(fresh),count:count(fresh),score:fresh.score,lines:fresh.lines,level:fresh.level,held:held(fresh),canHold:canHold(fresh)});}
  {let g=make(42),drops=0;while(!over(g)&&drops<100){hard(g);drops++;}assert(over(g),'real hard drops reach game over');g=reset(g);const opening=[];for(let i=0;i<7;i++){opening.push(active(g).type);clear(g);hard(g);assert(!over(g));}record('restartBag',{drops,opening,types:new Set(opening).size});}
  console.log(JSON.stringify(evidence,null,1));
  assertRecorded(evidence);
  console.log(`${family} ${mode}: canonical engine, unchanged clock, scoring and transition findings asserted`);
  return evidence;
}

function assertRecorded(e) {
  assert.deepEqual(e.wrongStates,[]);assert.equal(e.bags,100);
  assert.equal(e.restartBag.types,e.family==='terra'&&e.mode==='xhigh'?5:7,'fresh opening after actual game over/restart');
  if(e.family==='terra'&&e.mode==='xhigh')assert.deepEqual(e.restartBag,{drops:11,opening:['J','Z','Z','T','L','I','J'],types:5});
  const expectedKicks=e.family==='terra'&&!['xhigh','max'].includes(e.mode)?Object.keys(reference).filter(t=>t!=='O').flatMap(t=>Object.keys(normalKicks).map(k=>t+':'+k)):[];
  assert.deepEqual(e.wrongKicks,expectedKicks);
  const expected = {
    "qwen-low": {
      "partialLockOut": {"pose":{"type":"T","rotation":0,"x":7,"y":-1},"over":false},
      "concreteKicks": {"TWall-1":{"type":"T","rotation":0,"x":0,"y":8},"TWall1":{"type":"T","rotation":0,"x":7,"y":8},"IWall-1":{"type":"I","rotation":0,"x":0,"y":8},"IWall1":{"type":"I","rotation":0,"x":6,"y":8},"TFloor":{"type":"T","rotation":1,"x":2,"y":17},"IFloor":{"type":"I","rotation":1,"x":4,"y":16}},
      "lockBoundary": {"at499":0,"at500":4},
      "resetAfter20": 0,
      "resetCap": {"lockedAt":15,"count":4},
      "ledge": {"occupied":1,"active":{"type":"O","rotation":0,"x":1,"y":12}},
      "groundedSoftLock": 0,
      "naturalLanding": {"landedAt":1000,"lockedAfter":499},
      "normal1": 100,
      "normal2": 300,
      "normal3": 500,
      "normal4": 800,
      "singlePc": 100,
      "b2b": 1600,
      "b2bBreak": 1750,
      "levelTwoCombo": 300,
      "levelCrossing": {"score":100,"lines":10,"level":2},
      "b2bTetrisPc": 1600,
      "singlePcAfterB2B": 900,
      "consecutiveTetrises": 1650,
      "hard-mini-zero": 0,
      "hard-mini-single": 100,
      "hard-full-zero": 0,
      "hard-full-single": 100,
      "timed-mini-zero": 0,
      "timed-mini-single": 100,
      "timed-full-zero": 0,
      "timed-full-single": 100,
      "nonRotationCornerLock": 0,
      "gravity": [{"level":1,"elapsed":1000,"score":0},{"level":2,"elapsed":793,"score":0},{"level":5,"elapsed":356,"score":0},{"level":9,"elapsed":94,"score":0},{"level":10,"elapsed":65,"score":0},{"level":14,"elapsed":12,"score":0},{"level":15,"elapsed":8,"score":0},{"level":20,"elapsed":1,"score":0}],
      "normalToSoft": {"before":{"y":0,"score":0},"after":{"y":16,"score":16}},
      "refresh": [9,9],
      "refreshVariants": {"2:1480.001":[1,1],"2:1564":[1,1],"10:600":[9,9],"15:600":[18,18]},
      "capAt151": {"before":0,"after":4},
      "manualSoftSpin": {"rows":14,"extra":0},
      "miniAfterB2B": 900,
      "hardFullDouble": {"score":300,"lines":2},
      "timedFullDouble": {"score":300,"lines":2},
      "hiddenLockOut": {"stack":[[7,0]],"start":{"type":"T","rotation":0,"x":3,"y":-2},"path":["R","R","R","R"],"pose":{"type":"T","rotation":0,"x":7,"y":-2},"incoming":{"type":"I","rotation":0,"x":3,"y":-2},"over":true},
      "engineGameOverInert": true,
      "reset": {"over":false,"count":0,"score":0,"lines":0,"level":1,"held":null,"canHold":true},
    },
    "qwen-medium": {
      "concreteKicks": {"TWall-1":{"type":"T","rotation":0,"x":0,"y":8},"TWall1":{"type":"T","rotation":0,"x":7,"y":8},"IWall-1":{"type":"I","rotation":0,"x":0,"y":8},"IWall1":{"type":"I","rotation":0,"x":6,"y":8},"TFloor":{"type":"T","rotation":1,"x":2,"y":17},"IFloor":{"type":"I","rotation":1,"x":4,"y":16}},
      "lockBoundary": {"at499":0,"at500":4},
      "resetAfter20": 0,
      "resetCap": {"lockedAt":16,"count":4},
      "ledge": {"occupied":1,"active":{"type":"O","rotation":0,"x":1,"y":12}},
      "groundedSoftLock": 0,
      "naturalLanding": {"landedAt":1000,"lockedAfter":499},
      "normal1": 100,
      "normal2": 300,
      "normal3": 500,
      "normal4": 800,
      "singlePc": 100,
      "b2b": 2000,
      "b2bBreak": 2150,
      "levelTwoCombo": 300,
      "levelCrossing": {"score":100,"lines":10,"level":2},
      "b2bTetrisPc": 2000,
      "singlePcAfterB2B": 900,
      "consecutiveTetrises": 2050,
      "hard-mini-zero": 0,
      "hard-mini-single": 100,
      "hard-full-zero": 0,
      "hard-full-single": 100,
      "timed-mini-zero": 100,
      "timed-mini-single": 200,
      "timed-full-zero": 400,
      "timed-full-single": 800,
      "nonRotationCornerLock": 0,
      "gravity": [{"level":1,"elapsed":1000,"score":0},{"level":2,"elapsed":793,"score":0},{"level":5,"elapsed":356,"score":0},{"level":9,"elapsed":94,"score":0},{"level":10,"elapsed":65,"score":0},{"level":14,"elapsed":12,"score":0},{"level":15,"elapsed":8,"score":0},{"level":20,"elapsed":1,"score":0}],
      "normalToSoft": {"before":{"y":0,"score":0},"after":{"y":16,"score":16}},
      "refresh": [9,9],
      "refreshVariants": {"2:1480.001":[1,1],"2:1564":[1,1],"10:600":[9,9],"15:600":[18,18]},
      "manualSoftSpin": {"rows":14,"extra":0},
      "miniAfterB2B": 1100,
      "hardFullDouble": {"score":300,"lines":2},
      "timedFullDouble": {"score":1200,"lines":2},
      "hiddenLockOut": {"stack":[[7,0]],"start":{"type":"T","rotation":0,"x":3,"y":-2},"path":["R","R","R","R"],"pose":{"type":"T","rotation":0,"x":7,"y":-2},"incoming":{"type":"I","rotation":0,"x":3,"y":-2},"over":true},
      "partialLockOut": {"pose":{"type":"T","rotation":0,"x":7,"y":-1},"over":true},
      "engineGameOverInert": true,
      "reset": {"over":false,"count":0,"score":0,"lines":0,"level":1,"held":null,"canHold":true},
    },
    "terra-high": {
      "firstRowAfterHold": 600,
      "concreteKicks": {"TWall-1":{"type":"T","rotation":0,"x":0,"y":8},"TWall1":{"type":"T","rotation":0,"x":7,"y":8},"IWall-1":{"type":"I","rotation":0,"x":0,"y":8},"IWall1":{"type":"I","rotation":0,"x":6,"y":8},"TFloor":{"type":"T","rotation":1,"x":3,"y":16},"IFloor":{"type":"I","rotation":0,"x":3,"y":18}},
      "lockBoundary": {"at499":0,"at500":4},
      "resetAfter20": 0,
      "resetCap": {"lockedAt":16,"count":4},
      "ledge": {"occupied":1,"active":{"type":"O","rotation":0,"x":0,"y":12}},
      "groundedSoftLock": 0,
      "naturalLanding": {"landedAt":1000,"lockedAfter":499},
      "normal1": 100,
      "normal2": 300,
      "normal3": 500,
      "normal4": 800,
      "singlePc": 100,
      "b2b": 2000,
      "b2bBreak": 2150,
      "levelTwoCombo": 300,
      "levelCrossing": {"score":100,"lines":10,"level":2},
      "b2bTetrisPc": 2000,
      "singlePcAfterB2B": 900,
      "consecutiveTetrises": 2050,
      "hard-mini-zero": 0,
      "hard-mini-single": 100,
      "hard-full-zero": 0,
      "hard-full-single": 100,
      "timed-mini-zero": 0,
      "timed-mini-single": 100,
      "timed-full-zero": 0,
      "timed-full-single": 100,
      "nonRotationCornerLock": 0,
      "gravity": [{"level":1,"elapsed":1000,"score":0},{"level":2,"elapsed":793,"score":0},{"level":5,"elapsed":356,"score":0},{"level":9,"elapsed":94,"score":0},{"level":10,"elapsed":65,"score":0},{"level":14,"elapsed":50,"score":0},{"level":15,"elapsed":50,"score":0},{"level":20,"elapsed":50,"score":0}],
      "normalToSoft": {"before":{"y":0,"score":0},"after":{"y":1,"score":1}},
      "refresh": [9,8],
      "refreshVariants": {"2:1480.001":[1,1],"2:1564":[1,1],"10:600":[9,8],"15:600":[10,10]},
      "twoMoveLockAt1000": 0,
      "holdInheritedResetCount": {"first":{"type":"I","rotation":0,"x":3,"y":-2},"before":0,"locked":true},
      "holdGravityCarry": {"incoming":{"type":"I","rotation":0,"x":3,"y":-2},"beforeRow":-2,"afterRow":-1},
      "manualSoftSpin": {"rows":14,"extra":0},
      "miniAfterB2B": 900,
      "hardFullDouble": {"score":300,"lines":2},
      "timedFullDouble": {"score":300,"lines":2},
      "hiddenLockOut": {"stack":[[7,0]],"start":{"type":"T","rotation":0,"x":3,"y":-2},"path":["R","R","R","R"],"pose":{"type":"T","rotation":0,"x":7,"y":-2},"incoming":{"type":"I","rotation":0,"x":3,"y":-2},"over":false},
      "engineGameOverInert": true,
      "reset": {"over":false,"count":0,"score":0,"lines":0,"level":1,"held":null,"canHold":true},
    },
    "terra-low": {
      "firstRowAfterHold": 401,
      "concreteKicks": {"TWall-1":{"type":"T","rotation":0,"x":0,"y":8},"TWall1":{"type":"T","rotation":0,"x":7,"y":8},"IWall-1":{"type":"I","rotation":1,"x":-2,"y":8},"IWall1":{"type":"I","rotation":0,"x":6,"y":8},"TFloor":{"type":"T","rotation":1,"x":2,"y":17},"IFloor":{"type":"I","rotation":1,"x":3,"y":16}},
      "lockBoundary": {"at499":0,"at500":0},
      "resetAfter20": 0,
      "resetCap": {"lockedAt":1,"count":4},
      "ledge": {"occupied":1,"active":{"type":"O","rotation":0,"x":0,"y":12}},
      "groundedSoftLock": 4,
      "naturalLanding": {"landedAt":801,"lockedAfter":801},
      "normal1": 100,
      "normal2": 300,
      "normal3": 500,
      "normal4": 800,
      "singlePc": 100,
      "b2b": 1600,
      "b2bBreak": 1750,
      "levelTwoCombo": 300,
      "levelCrossing": {"score":100,"lines":10,"level":2},
      "b2bTetrisPc": 1600,
      "singlePcAfterB2B": 900,
      "consecutiveTetrises": 1650,
      "hard-mini-zero": 0,
      "hard-mini-single": 100,
      "hard-full-zero": 0,
      "hard-full-single": 100,
      "timed-mini-zero": 0,
      "timed-mini-single": 100,
      "timed-full-zero": 0,
      "timed-full-single": 100,
      "nonRotationCornerLock": 0,
      "gravity": [{"level":1,"elapsed":801,"score":1},{"level":2,"elapsed":736,"score":1},{"level":5,"elapsed":541,"score":1},{"level":9,"elapsed":281,"score":1},{"level":10,"elapsed":216,"score":1},{"level":14,"elapsed":101,"score":1},{"level":15,"elapsed":101,"score":1},{"level":20,"elapsed":101,"score":1}],
      "normalToSoft": {"before":{"y":0,"score":0},"after":{"y":2,"score":2}},
      "refresh": [2,2],
      "refreshVariants": {"2:1480.001":[1,2],"2:1564":[2,2],"10:600":[2,2],"15:600":[5,5]},
      "twoMoveLockAt1000": 4,
      "manualSoftSpin": {"rows":14,"extra":0},
      "miniAfterB2B": 900,
      "hardFullDouble": {"score":300,"lines":2},
      "timedFullDouble": {"score":300,"lines":2},
      "hiddenLockOut": {"stack":[[8,1],[2,1],[8,0],[6,1],[7,1],[5,1]],"start":{"type":"T","rotation":0,"x":3,"y":-1},"path":["R","R","C","R","R","A"],"pose":{"type":"T","rotation":0,"x":6,"y":-2},"incoming":{"type":"I","rotation":0,"x":3,"y":-1},"over":false},
      "engineGameOverInert": false,
      "reset": {"over":false,"count":0,"score":0,"lines":0,"level":1,"held":null,"canHold":true},
    },
    "terra-medium": {
      "firstRowAfterHold": 450,
      "concreteKicks": {"TWall-1":{"type":"T","rotation":0,"x":0,"y":8},"TWall1":{"type":"T","rotation":0,"x":7,"y":8},"IWall-1":{"type":"I","rotation":0,"x":0,"y":8},"IWall1":{"type":"I","rotation":0,"x":6,"y":8},"TFloor":{"type":"T","rotation":1,"x":3,"y":17},"IFloor":{"type":"I","rotation":0,"x":3,"y":18}},
      "lockBoundary": {"at499":0,"at500":0},
      "resetAfter20": 0,
      "resetCap": {"lockedAt":1,"count":4},
      "ledge": {"occupied":1,"active":{"type":"O","rotation":0,"x":0,"y":12}},
      "groundedSoftLock": 4,
      "naturalLanding": {"landedAt":850,"lockedAfter":850},
      "normal1": 100,
      "normal2": 300,
      "normal3": 500,
      "normal4": 800,
      "singlePc": 100,
      "b2b": 1600,
      "b2bBreak": 1700,
      "levelTwoCombo": 200,
      "levelCrossing": {"score":100,"lines":10,"level":2},
      "b2bTetrisPc": 1600,
      "singlePcAfterB2B": 900,
      "consecutiveTetrises": 1600,
      "hard-mini-zero": 0,
      "hard-mini-single": 100,
      "hard-full-zero": 0,
      "hard-full-single": 100,
      "timed-mini-zero": 0,
      "timed-mini-single": 100,
      "timed-full-zero": 0,
      "timed-full-single": 100,
      "nonRotationCornerLock": 0,
      "gravity": [{"level":1,"elapsed":850,"score":1},{"level":2,"elapsed":780,"score":1},{"level":5,"elapsed":570,"score":1},{"level":9,"elapsed":290,"score":1},{"level":10,"elapsed":220,"score":1},{"level":14,"elapsed":80,"score":1},{"level":15,"elapsed":80,"score":1},{"level":20,"elapsed":80,"score":1}],
      "normalToSoft": {"before":{"y":0,"score":0},"after":{"y":1,"score":1}},
      "refresh": [2,2],
      "refreshVariants": {"2:1480.001":[1,1],"2:1564":[2,1],"10:600":[2,2],"15:600":[7,7]},
      "twoMoveLockAt1000": 4,
      "manualSoftSpin": {"rows":14,"extra":0},
      "miniAfterB2B": 900,
      "hardFullDouble": {"score":300,"lines":2},
      "timedFullDouble": {"score":300,"lines":2},
      "hiddenLockOut": {"stack":[[8,1],[2,1],[8,0],[6,1],[7,1],[5,1]],"start":{"type":"T","rotation":0,"x":3,"y":-1},"path":["R","R","C","R","A"],"pose":{"type":"T","rotation":0,"x":6,"y":-2},"incoming":{"type":"I","rotation":0,"x":3,"y":-1},"over":false},
      "engineGameOverInert": false,
      "reset": {"over":false,"count":0,"score":0,"lines":0,"level":1,"held":null,"canHold":true},
    },
    "terra-xhigh": {
      "firstRowAfterHold": 1000,
      "concreteKicks": {"TWall-1":{"type":"T","rotation":0,"x":0,"y":8},"TWall1":{"type":"T","rotation":0,"x":7,"y":8},"IWall-1":{"type":"I","rotation":0,"x":0,"y":8},"IWall1":{"type":"I","rotation":0,"x":6,"y":8},"TFloor":{"type":"T","rotation":1,"x":2,"y":17},"IFloor":{"type":"I","rotation":1,"x":4,"y":16}},
      "lockBoundary": {"at499":0,"at500":4},
      "resetAfter20": 0,
      "resetCap": {"lockedAt":2,"count":4},
      "ledge": {"occupied":1,"active":{"type":"O","rotation":0,"x":0,"y":12}},
      "groundedSoftLock": 0,
      "naturalLanding": {"landedAt":1000,"lockedAfter":500},
      "normal1": 100,
      "normal2": 300,
      "normal3": 500,
      "normal4": 800,
      "singlePc": 100,
      "b2b": 1600,
      "b2bBreak": 1750,
      "levelTwoCombo": 300,
      "levelCrossing": {"score":100,"lines":10,"level":2},
      "b2bTetrisPc": 1600,
      "singlePcAfterB2B": 900,
      "consecutiveTetrises": 2050,
      "hard-mini-zero": 0,
      "hard-mini-single": 100,
      "hard-full-zero": 0,
      "hard-full-single": 100,
      "timed-mini-zero": 400,
      "timed-mini-single": 800,
      "timed-full-zero": 400,
      "timed-full-single": 800,
      "nonRotationCornerLock": 0,
      "gravity": [{"level":1,"elapsed":1000,"score":0},{"level":2,"elapsed":793,"score":0},{"level":5,"elapsed":356,"score":0},{"level":9,"elapsed":94,"score":0},{"level":10,"elapsed":65,"score":0},{"level":14,"elapsed":50,"score":0},{"level":15,"elapsed":50,"score":0},{"level":20,"elapsed":50,"score":0}],
      "normalToSoft": {"before":{"y":0,"score":0},"after":{"y":1,"score":1}},
      "refresh": [9,8],
      "refreshVariants": {"2:1480.001":[1,1],"2:1564":[1,1],"10:600":[9,8],"15:600":[10,10]},
      "twoMoveLockAt1000": 4,
      "manualSoftSpin": {"rows":14,"extra":0},
      "miniAfterB2B": 1600,
      "hardFullDouble": {"score":300,"lines":2},
      "timedFullDouble": {"score":1200,"lines":2},
      "hiddenLockOut": {"stack":[[0,1],[0,0],[8,0],[2,2],[8,1],[9,2]],"start":{"type":"T","rotation":0,"x":3,"y":0},"path":["L","L","C","C","C","C"],"pose":{"type":"T","rotation":0,"x":0,"y":-2},"incoming":{"type":"I","rotation":0,"x":3,"y":0},"over":false},
      "engineGameOverInert": true,
      "reset": {"over":false,"count":0,"score":0,"lines":0,"level":1,"held":null,"canHold":true},
    },
  };
  expected['terra-max']={
    ...expected['terra-high'],
    firstRowAfterHold:1000,
    concreteKicks:expected['terra-xhigh'].concreteKicks,
    gravity:expected['terra-high'].gravity.map(g=>({...g,elapsed:g.level>=14?16:g.elapsed})),
    refresh:[9,9],
    refreshVariants:{'2:1480.001':[1,1],'2:1564':[1,1],'10:600':[9,9],'15:600':[18,18]},
    'hard-mini-zero':400,'hard-mini-single':800,'hard-full-zero':400,'hard-full-single':800,
    'timed-mini-zero':400,'timed-mini-single':800,'timed-full-zero':400,'timed-full-single':800,
    miniAfterB2B:2000,hardFullDouble:{score:1200,lines:2},timedFullDouble:{score:1200,lines:2},
    landingFramePartition:{single1000:4,ten100:0},landingFrame16:{at1489:0,at1490:4},
  };
  delete expected['terra-max'].holdInheritedResetCount;
  delete expected['terra-max'].holdGravityCarry;
  const actual={...e};for(const key of ['family','mode','wrongStates','wrongKicks','bags','hold','ghost','restartBag'])delete actual[key];
  assert.deepEqual(actual,expected[e.family+'-'+e.mode],'recorded conforming and defective outcomes');
}

if(process.argv[1] && resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname)) await runAudit(process.argv[2],process.argv[3]);

