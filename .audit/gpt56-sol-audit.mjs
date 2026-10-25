// Equivalent probes for four independent GPT-5.6 Sol runs, in temporary builds.
// Only fixture state and environment surfaces are supplied; no rule is repaired.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import vm from 'node:vm';
const root = resolve(process.argv[2]), mode = process.argv[3];
assert(['low','medium','high','xhigh'].includes(mode));
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

const core = await import(pathToFileURL(resolve(root,'dist/game.js')));
const types = Object.keys(reference), offset = {low:2,medium:4,high:4,xhigh:0}[mode];
const seeded = seed => () => ((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
const apps = new WeakMap();
function make(seed=42) {
  if(mode!=='low') return new core.TetrisGame(mode==='xhigh'?{rng:seeded(seed)}:seeded(seed));
  const noop=()=>{}, elements=new Map(), context=new Proxy({canvas:{width:320,height:640},createLinearGradient:()=>({addColorStop:noop})},{get:(t,p)=>p in t?t[p]:noop,set:(t,p,v)=>(t[p]=v,true)});
  const element=id=>{if(!elements.has(id))elements.set(id,{width:320,height:640,getContext:()=>context,querySelector:element,addEventListener:noop});return elements.get(id);};
  let time=0;
  const sandbox={...core,document:{querySelector:element,querySelectorAll:()=>[],addEventListener:noop},performance:{now:()=>time},requestAnimationFrame:noop,console};
  const source=readFileSync(resolve(root,'dist/main.js'),'utf8').replace(/^import[^\n]*\n/gm,'')+'\nglobalThis.__app={game,loop,action,resetClock(){lastFall=0;groundedAt=null;}};';
  // Inject this run's unchanged constructor with deterministic random input.
  sandbox.TetrisGame=class extends core.TetrisGame {constructor(){super(seeded(seed));}};
  const ctx=vm.createContext(sandbox);vm.runInContext(source,ctx);
  apps.set(ctx.__app.game,{app:ctx.__app,time:0,setTime:t=>time=t});return ctx.__app.game;
}
// Canonical origin translations: medium is centered (-1,-1); low I has y=-1.
const origin = kind => mode==='medium'?[-1,-1]:mode==='low'&&kind==='I'?[0,-1]:[0,0];
const native = p => {const [dx,dy]=origin(p.kind);return {...p,[mode==='low'?'name':mode==='high'?'type':'kind']:p.kind,x:p.x-dx,y:p.y+offset-dy};};
const active = g => {const p=g.active;if(!p)return null;const kind=p.name??p.type??p.kind,[dx,dy]=origin(kind);return {kind,rotation:p.rotation,x:p.x+dx,y:p.y-offset+dy};};
const setActive = (g,p)=>{const n=native(p);delete n.kind;if(mode==='medium'||mode==='xhigh')n.kind=p.kind;g.active=n;};
const local=(kind,rotation)=>{
  const p={kind,rotation,x:0,y:0},n=native({...p,y:-offset});
  const points=(mode==='low'?core.cells:mode==='medium'?core.pieceCells:mode==='high'?core.cellsFor:core.getPieceCells)(n);
  return points.map(c=>Array.isArray(c)?c:[c.x,c.y]);
};
// local() translates to canonical origin before querying emitted geometry.
const cells=p=>local(p.kind,p.rotation).map(([x,y])=>[x+p.x,y+p.y]);
const get=(g,x,y)=>y+offset<0?null:g.board[y+offset]?.[x];
const put=(g,x,y,kind='J')=>{assert(y+offset>=0&&y+offset<g.board.length);g.board[y+offset][x]=kind;};
const clear=g=>g.board.forEach(r=>r.fill(null));
const count=g=>g.board.flat().filter(Boolean).length;
const fits=(g,p)=>cells(p).every(([x,y])=>x>=0&&x<10&&y<20&&(mode==='low'||mode==='medium'?y>=-offset:true)&&!get(g,x,y));
const over=g=>mode==='medium'?g.status==='gameover':mode==='high'?g.status==='over':g.gameOver;
const queue=g=>(mode==='low'||mode==='high'?g.next:g.queue);
const held=g=>mode==='high'?g.held:g.holdPiece;
const available=g=>mode==='high'?g.holdAvailable:mode==='xhigh'?!g.holdLocked:g.canHold;
const ghost=g=>{const a=active(g),n=g.active;return a.y+((mode==='high'?g.getGhostY():mode==='xhigh'?g.getGhostY():g.ghostY())-n.y);};
const move=(g,d)=>{if(mode==='low'){const before=g.active.x;apps.get(g).app.action(d<0?'left':'right');return g.active.x!==before;}return mode==='medium'?g.move(d,0):g.move(d);};
const rotate=(g,d)=>g.rotate(d);
const hard=g=>g.hardDrop();
const soft=g=>{const before=active(g);if(mode==='low')apps.get(g).app.action('down');else g.softDrop();return active(g)?.y!==before?.y;};
const step=(g,ms)=>{if(mode==='low'){const a=apps.get(g);a.time+=ms;a.setTime(a.time);a.app.loop(a.time);}else if(mode==='high')g.update(ms);else g.tick(ms);};
const advance=(g,ms)=>{while(ms>1e-8){const dt=Math.min(ms,16);step(g,dt);ms-=dt;}};
const reset=g=>mode==='low'||mode==='high'?g.restart():g.reset();
const setLevel=(g,n,lines=(n-1)*10)=>Object.assign(g,{level:n,lines});
const place=(g,kind,rotation,x,y)=>{
  setActive(g,{kind,rotation,x,y});
  Object.assign(g,{fallAccumulator:0,lockAccumulator:0,gravityElapsed:0,lockElapsed:0,lockResets:0,lastMoveWasRotation:false,lastActionWasRotation:false,lastKickIndex:0});
  if(mode==='low'){const a=apps.get(g);a.time=0;a.setTime(0);a.app.resetClock();a.app.loop(0);}
  assert(fits(g,active(g)),`collision-free fixture ${JSON.stringify(active(g))}`);
};
const key=a=>a.map(p=>p.join(',')).sort().join(' ');
const evidence={mode},record=(k,v)=>evidence[k]=JSON.parse(JSON.stringify(v));
const colorSource=readFileSync(resolve(root,'src',mode==='medium'||mode==='high'?'main.ts':'game.ts'),'utf8');
const colorTable=colorSource.match(/COLORS[^=]*=\s*\{([\s\S]*?)\}/)[1];
assert.equal(new Set([...colorTable.matchAll(/#[a-fA-F0-9]{6}/g)].map(m=>m[0])).size,7);
record('wrongStates',types.flatMap(t=>[0,1,2,3].filter(r=>key(local(t,r))!==key(reference[t][r])).map(r=>t+r)));
const wrongKicks=[];
for(const t of types.filter(t=>t!=='O'))for(const transition of Object.keys(normalKicks)){
  const [from,to]=transition.split('>').map(Number),g=make();place(g,t,from,3,8);const start={...g.active},seen=[];
  const capture=p=>{if(p.rotation===to)seen.push([p.x-start.x,p.y-start.y]);return mode==='low'||mode==='medium'?false:true;};
  g[mode==='low'||mode==='medium'?'valid':'collides']=capture;
  assert.equal(rotate(g,(to-from+4)%4===1?1:-1),false);
  if(JSON.stringify(seen)!==JSON.stringify((t==='I'?iKicks:normalKicks)[transition].map(([x,y])=>[x,-y||0])))wrongKicks.push(t+':'+transition);
}
record('wrongKicks',wrongKicks);
for(const t of types){const g=make();place(g,t,0,3,8);for(const d of [-1,1]){for(let i=0;i<20;i++)move(g,d);const xs=cells(active(g)).map(p=>p[0]);assert.equal(d<0?Math.min(...xs):Math.max(...xs),d<0?0:9);}}
const kicks={};
for(const [name,t,r,x,y,d]of [['TWall','T',1,-1,8,-1],['IWall','I',1,-2,8,-1],['TFloor','T',0,3,18,1],['IFloor','I',0,3,18,1]]){
  // Medium T has the opposite state: use its actual vertical leftmost cells.
  const g=make();place(g,t,r,mode==='medium'&&t==='T'&&x<0?0:x,mode==='medium'&&name==='TFloor'?17:y);rotate(g,d);kicks[name]=active(g);
}
if(mode==='medium'){const g=make();place(g,'T',2,3,18);assert(rotate(g,1));kicks.physicalTFloor=active(g);}
record('kicks',kicks);
for(let seed=1;seed<=10;seed++){const g=make(seed);for(let b=0;b<10;b++){const dealt=[];for(let i=0;i<7;i++){dealt.push(active(g).kind);clear(g);hard(g);assert(!over(g));}assert.deepEqual(dealt.sort(),[...types].sort());}}
record('bags',100);
{const g=make(),first=active(g).kind,next=queue(g)[0];rotate(g,1);assert(g.hold()!==false);assert.equal(held(g),first);assert.equal(active(g).kind,next);assert(!available(g));const before=active(g);g.hold();assert.deepEqual(active(g),before);clear(g);hard(g);assert(available(g));const outgoing=active(g).kind;g.hold();assert.equal(active(g).kind,first);assert.equal(active(g).rotation,0);assert.equal(held(g),outgoing);record('hold','first, restriction, post-lock retrieval/orientation pass');}
for(const t of types){const g=make();clear(g);place(g,t,0,3,0);put(g,4,16);const p=active(g),y=ghost(g);assert(fits(g,{...p,y}));assert(!fits(g,{...p,y:y+1}));hard(g);assert.equal(g.score,2*(y-p.y));for(const[x,yy]of cells({...p,y}))assert.equal(get(g,x,yy),t);}
record('ghost','seven obstructed projections, exact points and welded cells pass');
{const g=make();place(g,'O',0,3,18);advance(g,499);const at499=count(g);step(g,1.000001);record('lockBoundary',{at499,at500:count(g)});
 const r=make();place(r,'O',0,3,18);let lockedAt=null;for(let i=0;i<30;i++){advance(r,490);if(count(r)){lockedAt=i;break;}move(r,i%2?-1:1);}record('resetCap',{lockedAt,count:count(r)});
 const s=make();place(s,'O',0,3,18);soft(s);record('groundedSoftLock',count(s));
 const l=make();place(l,'O',0,-1,14);put(l,0,16);advance(l,490);assert.equal(count(l),1);assert(move(l,1));assert(fits(l,{...active(l),y:active(l).y+1}));advance(l,20);record('ledge',{count:count(l),active:active(l)});for(let i=0;i<600&&!get(l,1,19);i++)step(l,16);assert.equal(get(l,1,19),'O');
 const n=make();place(n,'O',0,3,17);let landed=0,locked=0;while(active(n).y===17&&landed<2000){step(n,1);landed++;}while(!count(n)&&locked<2000){step(n,1);locked++;}record('naturalLanding',{landed,locked});
 const f=make();place(f,'O',0,3,18);advance(f,490);move(f,1);advance(f,20);record('resetAfter20',count(f));
 // Failed wall actions cannot continually reset grounded lock time.
 const w=make();place(w,'O',0,-1,18);for(let i=0;i<10;i++){advance(w,100);if(count(w))break;move(w,-1);}record('failedMoveLock',count(w));
}
const well=(g,n,pc=false)=>{clear(g);for(let y=20-n;y<20;y++)for(let x=0;x<10;x++)if(x!==4)put(g,x,y);if(!pc)put(g,0,10);place(g,'I',1,2,16);};
const singlePc=g=>{clear(g);for(let x=0;x<10;x++)if(x<3||x>6)put(g,x,19);place(g,'I',0,3,18);};
const filler=g=>{clear(g);place(g,'O',0,7,18);hard(g);};
for(const n of [1,2,3,4]){const g=make();well(g,n);hard(g);record('normal'+n,g.score);assert.equal(g.lines,n);}
{const g=make();singlePc(g);hard(g);assert.equal(count(g),0);record('singlePc',g.score);
 const b=make();well(b,4);hard(b);filler(b);well(b,4);hard(b);record('b2b',b.score);well(b,1);hard(b);record('b2bBreak',{score:b.score,b2b:b.backToBack});
 const c=make();setLevel(c,2);c.combo=0;well(c,1);hard(c);record('levelTwoCombo',c.score);
 const x=make();setLevel(x,1,9);well(x,1);hard(x);record('levelCrossing',{score:x.score,lines:x.lines,level:x.level});
 const p=make();well(p,4);hard(p);filler(p);well(p,4,true);hard(p);record('b2bTetrisPc',p.score);
 const q=make();well(q,4);hard(q);filler(q);singlePc(q);hard(q);record('singlePcAfterB2B',q.score);
 const k=make();well(k,4);hard(k);well(k,4);hard(k);record('consecutiveTetrises',k.score);}
for(const timed of [false,true])for(const full of [false,true])for(const line of [false,true]){
 const g=make();put(g,5,17);put(g,3,19);put(g,full?3:5,full?17:19);if(line)for(const x of [0,1,2,6,7,8,9])put(g,x,18);
 place(g,'T',mode==='medium'?1:3,3,17);assert(rotate(g,1));assert.equal(ghost(g),active(g).y);if(timed)advance(g,500.000001);else hard(g);assert.equal(g.lines,line?1:0);record(`${timed?'timed':'hard'}-${full?'full':'mini'}-${line?'single':'zero'}`,g.score);
}
for(const timed of [false,true]){const g=make();for(let x=0;x<10;x++){if(x!==4)put(g,x,19);if(x<3||x>5)put(g,x,18);}put(g,3,17);place(g,'T',mode==='medium'?2:0,3,17);assert(rotate(g,1));assert(rotate(g,1));if(timed)advance(g,500.000001);else hard(g);record(timed?'timedFullDouble':'hardFullDouble',{score:g.score,lines:g.lines});}
{const g=make();for(const[x,y]of [[3,17],[5,17],[3,19]])put(g,x,y);place(g,'T',mode==='medium'?2:0,3,17);hard(g);record('nonRotationCornerLock',g.score);
 const s=make();for(const[x,y]of [[0,17],[0,19],[2,19]])put(s,x,y);place(s,'T',mode==='medium'?2:0,0,3);assert(rotate(s,1));let rows=0;while(soft(s)&&rows<30)rows++;hard(s);record('manualSoftSpin',{rows,extra:s.score-rows});
 const m=make();well(m,4);hard(m);filler(m);clear(m);for(const[x,y]of [[5,17],[3,19],[5,19]])put(m,x,y);for(const x of [0,1,2,6,7,8,9])put(m,x,18);place(m,'T',mode==='medium'?1:3,3,17);assert(rotate(m,1));advance(m,500.000001);record('miniAfterB2B',m.score);}
const gravity=[];
for(const level of [1,2,5,9,10,14,15,20]){const g=make();setLevel(g,level);place(g,'O',0,3,0);let elapsed=0;while(active(g).y===0&&elapsed<2000){step(g,1);elapsed++;}gravity.push({level,elapsed,score:g.score});}
record('gravity',gravity);
{const g=make();place(g,'O',0,3,0);advance(g,800);const before={y:active(g).y,score:g.score};soft(g);step(g,1);record('normalToSoft',{before,after:{y:active(g).y,score:g.score}});}
{const g=make();place(g,'O',0,3,0);advance(g,800);g.hold();const p=active(g);advance(g,200);record('holdGravity',{rows:active(g).y-p.y});}
const refresh={};for(const [level,duration]of [[2,1480.001],[10,600],[15,600]]){const ys=[];for(const hz of [60,144]){const g=make();setLevel(g,level);place(g,'O',0,3,0);let elapsed=0;while(elapsed<duration-1e-9){const dt=Math.min(1000/hz,duration-elapsed);step(g,dt);elapsed+=dt;}ys.push(active(g).y);}refresh[level+':'+duration]=ys;}record('refresh',refresh);
// Bounded public-action search; replay its result from actual T spawn. Only
// stack is injected; independently open incoming I rules out spawn collision.
function spawn(g,kind){if(mode==='xhigh'){queue(g)[0]=kind;g.spawnNext();}else g.spawn(kind);}
const search=make(),rng=seeded(1234);let found=null;
for(let trial=0;trial<6000&&!found;trial++){
 clear(search);spawn(search,'T');const start=active(search);spawn(search,'I');const incoming=active(search);spawn(search,'T');
 const excluded=new Set([...cells(start),...cells(incoming)].map(p=>p.join(','))),stack=[];
 for(let i=0;i<1+trial%7;i++){const p=[Math.floor(rng()*10),Math.floor(rng()*4)];if(!excluded.has(p.join(','))&&!get(search,...p)){put(search,...p);stack.push(p);}}
 const todo=[{p:start,path:[]}],seen=new Set();for(let i=0;i<todo.length&&i<300&&!found;i++){
  const {p,path}=todo[i],id=JSON.stringify(p);if(seen.has(id))continue;seen.add(id);setActive(search,p);
  if(cells(p).every(([,y])=>y<0)&&!fits(search,{...p,y:p.y+1})&&cells(incoming).every(([x,y])=>!get(search,x,y)&&!cells(p).some(([a,b])=>x===a&&y===b))){found={stack,start,path,pose:p,incoming};break;}
  if(path.length===10)continue;for(const a of ['L','R','C','A']){setActive(search,p);a==='L'||a==='R'?move(search,a==='L'?-1:1):rotate(search,a==='C'?1:-1);const n=active(search);if(n.y>=-6&&n.y<=1&&!seen.has(JSON.stringify(n)))todo.push({p:n,path:[...path,a]});}
 }
}
assert(found,'public hidden fixture exists');
{const g=make();for(const[x,y]of found.stack)put(g,x,y);spawn(g,'T');queue(g)[0]='I';for(const a of found.path)assert(a==='L'||a==='R'?move(g,a==='L'?-1:1):rotate(g,a==='C'?1:-1));assert.deepEqual(active(g),found.pose);assert.equal(ghost(g),found.pose.y);hard(g);record('hiddenLockOut',{...found,over:over(g)});}
if(mode==='xhigh'){const g=make();put(g,8,1);spawn(g,'T');queue(g)[0]='I';for(let i=0;i<4;i++)assert(move(g,1));const pose=active(g);assert(cells(pose).some(([,y])=>y<0)&&cells(pose).some(([,y])=>y>=0));assert.equal(ghost(g),pose.y);assert(fits(g,{kind:'I',rotation:0,x:3,y:-1}));hard(g);record('partialLockOut',{pose,over:over(g)});}
{const g=make();place(g,'O',0,0,18);queue(g)[0]='T';const s=make();spawn(s,'T');const block=cells(active(s)).find(([,y])=>y>=-offset);put(g,...block);hard(g);assert(over(g),'blocked spawn tops out');const snapshot=()=>JSON.stringify([active(g),g.board,g.score,held(g)]),before=snapshot();move(g,-1);rotate(g,1);g.hold();soft(g);hard(g);advance(g,1000);record('gameOverInert',snapshot()===before);reset(g);record('reset',{over:over(g),count:count(g),score:g.score,lines:g.lines,level:g.level,held:held(g),canHold:available(g)});}
{const g=make();let drops=0;while(!over(g)&&drops<100){hard(g);drops++;}assert(over(g));reset(g);const opening=[];for(let i=0;i<7;i++){opening.push(active(g).kind);clear(g);hard(g);}assert.equal(new Set(opening).size,7);record('restartBag',{drops,opening});}
console.log(JSON.stringify(evidence,null,1));
// Explicit baselines reviewed against the independent rule oracle. A pass
// reproduces both conformance and the documented defects, never bug freedom.
assert.equal(evidence.bags,100);
const expectedKicks=mode==='low'?types.filter(t=>t!=='O').flatMap(t=>Object.keys(normalKicks).map(k=>t+':'+k)):[];
assert.deepEqual(evidence.wrongKicks,expectedKicks);
const expected={
 "low": {
  "wrongStates": [],
  "kicks": {"TWall":{"kind":"T","rotation":0,"x":0,"y":8},"IWall":{"kind":"I","rotation":0,"x":0,"y":8},"TFloor":{"kind":"T","rotation":1,"x":3,"y":16},"IFloor":{"kind":"I","rotation":0,"x":3,"y":18}},
  "lockBoundary": {"at499":0,"at500":4},
  "resetCap": {"lockedAt":null,"count":0},
  "groundedSoftLock": 0,
  "ledge": {"count":1,"active":{"kind":"O","rotation":0,"x":0,"y":14}},
  "naturalLanding": {"landed":1000,"locked":500},
  "resetAfter20": 0,
  "failedMoveLock": 0,
  "normal1": 100,
  "normal2": 300,
  "normal3": 500,
  "normal4": 800,
  "singlePc": 100,
  "b2b": 2000,
  "b2bBreak": {"score":2150,"b2b":false},
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
  "hardFullDouble": {"score":300,"lines":2},
  "timedFullDouble": {"score":300,"lines":2},
  "nonRotationCornerLock": 0,
  "manualSoftSpin": {"rows":14,"extra":0},
  "miniAfterB2B": 900,
  "gravity": [{"level":1,"elapsed":1000,"score":0},{"level":2,"elapsed":793,"score":0},{"level":5,"elapsed":356,"score":0},{"level":9,"elapsed":94,"score":0},{"level":10,"elapsed":65,"score":0},{"level":14,"elapsed":45,"score":0},{"level":15,"elapsed":45,"score":0},{"level":20,"elapsed":45,"score":0}],
  "normalToSoft": {"before":{"y":0,"score":0},"after":{"y":1,"score":1}},
  "holdGravity": {"rows":1},
  "refresh": {"2:1480.001":[1,1],"10:600":[9,8],"15:600":[12,12]},
  "hiddenLockOut": {"stack":[[7,0]],"start":{"kind":"T","rotation":0,"x":3,"y":-2},"path":["R","R","R","R"],"pose":{"kind":"T","rotation":0,"x":7,"y":-2},"incoming":{"kind":"I","rotation":0,"x":3,"y":-2},"over":false},
  "gameOverInert": true,
  "reset": {"over":false,"count":0,"score":0,"lines":0,"level":1,"held":null,"canHold":true},
  "restartBag": {"drops":11,"opening":["S","O","J","I","L","T","Z"]},
 },
 "medium": {
  "wrongStates": ["T0","T1","T2","T3"],
  "kicks": {"TWall":{"kind":"T","rotation":0,"x":0,"y":8},"IWall":{"kind":"I","rotation":0,"x":0,"y":8},"TFloor":{"kind":"T","rotation":1,"x":3,"y":17},"IFloor":{"kind":"I","rotation":1,"x":4,"y":16},"physicalTFloor":{"kind":"T","rotation":3,"x":4,"y":17}},
  "lockBoundary": {"at499":0,"at500":4},
  "resetCap": {"lockedAt":16,"count":4},
  "groundedSoftLock": 0,
  "ledge": {"count":1,"active":{"kind":"O","rotation":0,"x":0,"y":14}},
  "naturalLanding": {"landed":1000,"locked":500},
  "resetAfter20": 0,
  "failedMoveLock": 4,
  "normal1": 100,
  "normal2": 300,
  "normal3": 500,
  "normal4": 800,
  "singlePc": 100,
  "b2b": 2000,
  "b2bBreak": {"score":2150,"b2b":false},
  "levelTwoCombo": 300,
  "levelCrossing": {"score":100,"lines":10,"level":2},
  "b2bTetrisPc": 2000,
  "singlePcAfterB2B": 900,
  "consecutiveTetrises": 2050,
  "hard-mini-zero": 400,
  "hard-mini-single": 800,
  "hard-full-zero": 400,
  "hard-full-single": 800,
  "timed-mini-zero": 400,
  "timed-mini-single": 800,
  "timed-full-zero": 400,
  "timed-full-single": 800,
  "hardFullDouble": {"score":1200,"lines":2},
  "timedFullDouble": {"score":1200,"lines":2},
  "nonRotationCornerLock": 0,
  "manualSoftSpin": {"rows":14,"extra":0},
  "miniAfterB2B": 2000,
  "gravity": [{"level":1,"elapsed":1000,"score":0},{"level":2,"elapsed":793,"score":0},{"level":5,"elapsed":356,"score":0},{"level":9,"elapsed":94,"score":0},{"level":10,"elapsed":65,"score":0},{"level":14,"elapsed":16,"score":0},{"level":15,"elapsed":16,"score":0},{"level":20,"elapsed":16,"score":0}],
  "normalToSoft": {"before":{"y":0,"score":0},"after":{"y":1,"score":1}},
  "holdGravity": {"rows":0},
  "refresh": {"2:1480.001":[1,1],"10:600":[9,9],"15:600":[18,18]},
  "hiddenLockOut": {"stack":[[7,0]],"start":{"kind":"T","rotation":0,"x":3,"y":-2},"path":["R","R","C","C","R","R"],"pose":{"kind":"T","rotation":2,"x":7,"y":-2},"incoming":{"kind":"I","rotation":0,"x":3,"y":-2},"over":false},
  "gameOverInert": true,
  "reset": {"over":false,"count":0,"score":0,"lines":0,"level":1,"held":null,"canHold":true},
  "restartBag": {"drops":12,"opening":["S","O","J","I","L","T","Z"]},
 },
 "high": {
  "wrongStates": [],
  "kicks": {"TWall":{"kind":"T","rotation":0,"x":0,"y":8},"IWall":{"kind":"I","rotation":0,"x":0,"y":8},"TFloor":{"kind":"T","rotation":1,"x":2,"y":17},"IFloor":{"kind":"I","rotation":1,"x":4,"y":16}},
  "lockBoundary": {"at499":0,"at500":4},
  "resetCap": {"lockedAt":16,"count":4},
  "groundedSoftLock": 0,
  "ledge": {"count":1,"active":{"kind":"O","rotation":0,"x":0,"y":14}},
  "naturalLanding": {"landed":1000,"locked":499},
  "resetAfter20": 0,
  "failedMoveLock": 4,
  "normal1": 100,
  "normal2": 300,
  "normal3": 500,
  "normal4": 800,
  "singlePc": 100,
  "b2b": 2000,
  "b2bBreak": {"score":2150,"b2b":false},
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
  "hardFullDouble": {"score":300,"lines":2},
  "timedFullDouble": {"score":1200,"lines":2},
  "nonRotationCornerLock": 0,
  "manualSoftSpin": {"rows":14,"extra":0},
  "miniAfterB2B": 1100,
  "gravity": [{"level":1,"elapsed":1000,"score":0},{"level":2,"elapsed":793,"score":0},{"level":5,"elapsed":356,"score":0},{"level":9,"elapsed":94,"score":0},{"level":10,"elapsed":65,"score":0},{"level":14,"elapsed":17,"score":0},{"level":15,"elapsed":17,"score":0},{"level":20,"elapsed":17,"score":0}],
  "normalToSoft": {"before":{"y":0,"score":0},"after":{"y":1,"score":1}},
  "holdGravity": {"rows":0},
  "refresh": {"2:1480.001":[1,1],"10:600":[9,9],"15:600":[18,18]},
  "hiddenLockOut": {"stack":[[7,0]],"start":{"kind":"T","rotation":0,"x":3,"y":-2},"path":["R","R","R","R"],"pose":{"kind":"T","rotation":0,"x":7,"y":-2},"incoming":{"kind":"I","rotation":0,"x":3,"y":-2},"over":false},
  "gameOverInert": true,
  "reset": {"over":false,"count":0,"score":0,"lines":0,"level":1,"held":null,"canHold":true},
  "restartBag": {"drops":11,"opening":["S","O","J","I","L","T","Z"]},
 },
 "xhigh": {
  "wrongStates": [],
  "kicks": {"TWall":{"kind":"T","rotation":0,"x":0,"y":8},"IWall":{"kind":"I","rotation":0,"x":0,"y":8},"TFloor":{"kind":"T","rotation":1,"x":2,"y":17},"IFloor":{"kind":"I","rotation":1,"x":4,"y":16}},
  "lockBoundary": {"at499":0,"at500":4},
  "resetCap": {"lockedAt":16,"count":4},
  "groundedSoftLock": 0,
  "ledge": {"count":1,"active":{"kind":"O","rotation":0,"x":0,"y":14}},
  "naturalLanding": {"landed":1000,"locked":499},
  "resetAfter20": 0,
  "failedMoveLock": 4,
  "normal1": 100,
  "normal2": 300,
  "normal3": 500,
  "normal4": 800,
  "singlePc": 900,
  "b2b": 2000,
  "b2bBreak": {"score":2150,"b2b":false},
  "levelTwoCombo": 300,
  "levelCrossing": {"score":100,"lines":10,"level":2},
  "b2bTetrisPc": 4000,
  "singlePcAfterB2B": 1700,
  "consecutiveTetrises": 2050,
  "hard-mini-zero": 400,
  "hard-mini-single": 800,
  "hard-full-zero": 400,
  "hard-full-single": 800,
  "timed-mini-zero": 400,
  "timed-mini-single": 800,
  "timed-full-zero": 400,
  "timed-full-single": 800,
  "hardFullDouble": {"score":1200,"lines":2},
  "timedFullDouble": {"score":1200,"lines":2},
  "nonRotationCornerLock": 0,
  "manualSoftSpin": {"rows":14,"extra":400},
  "miniAfterB2B": 2000,
  "gravity": [{"level":1,"elapsed":1000,"score":0},{"level":2,"elapsed":793,"score":0},{"level":5,"elapsed":356,"score":0},{"level":9,"elapsed":94,"score":0},{"level":10,"elapsed":65,"score":0},{"level":14,"elapsed":20,"score":0},{"level":15,"elapsed":20,"score":0},{"level":20,"elapsed":20,"score":0}],
  "normalToSoft": {"before":{"y":0,"score":0},"after":{"y":1,"score":1}},
  "holdGravity": {"rows":0},
  "refresh": {"2:1480.001":[1,1],"10:600":[9,9],"15:600":[18,18]},
  "hiddenLockOut": {"stack":[[7,0],[2,0],[4,3],[3,3],[3,1],[6,2],[5,1]],"start":{"kind":"T","rotation":0,"x":3,"y":-1},"path":["R","A","A","R"],"pose":{"kind":"T","rotation":2,"x":6,"y":-3},"incoming":{"kind":"I","rotation":0,"x":3,"y":-1},"over":true},
  "partialLockOut": {"pose":{"kind":"T","rotation":0,"x":7,"y":-1},"over":true},
  "gameOverInert": true,
  "reset": {"over":false,"count":0,"score":0,"lines":0,"level":1,"held":null,"canHold":true},
  "restartBag": {"drops":11,"opening":["S","O","J","I","L","T","Z"]},
 },
};
const actual={...evidence};for(const k of ['mode','wrongKicks','bags','hold','ghost'])delete actual[k];
assert.deepEqual(actual,expected[mode],'recorded canonical, timing, scoring and transition findings');
console.log(`${mode}: 28 states, 48 kicks, 100 bags, hold/ghost, lock/cap/ledge, scoring, gravity/refresh, hidden lock-out and reset findings asserted`);
