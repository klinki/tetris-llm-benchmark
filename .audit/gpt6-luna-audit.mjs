import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const root=resolve(process.argv[2]),mode=process.argv[3];
assert(['low','medium','high','xhigh','max'].includes(mode));
const load=f=>import(pathToFileURL(resolve(root,'dist',f)));
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

// High is a browser script with a DOM-coupled class. A VM supplies no-op DOM
// surfaces for engine calls; the separate Chromium pass uses the real DOM.
function sandbox(seed=42){
 const context=new Proxy({}, {get:(o,k)=>k==='canvas'?node:()=>{}});
 const node={width:300,height:600,textContent:'',style:{},classList:{add(){},remove(){},toggle(){}},getContext:()=>context,querySelector:()=>node,addEventListener(){},setAttribute(){},replaceChildren(){},append(){}};
 let s=seed;const math=Object.create(Math);math.random=()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/2**32);
 return {document:{querySelector:()=>node,createElement:()=>({...node}),addEventListener(){},body:node},window:{addEventListener(){}},localStorage:{getItem:()=>null,setItem(){}},requestAnimationFrame(){},cancelAnimationFrame(){},performance:{now:()=>0},Math:math,console};
}
const types=Object.keys(reference),bottom=mode==='xhigh'?21:19;
let core,environment,engineMath;
if(mode==='high'){
 environment=vm.createContext(sandbox());vm.runInContext(readFileSync(resolve(root,'dist/game.js'),'utf8')+'\n;globalThis.__core={Tetris,matrixFor,rotate,JLSTZ_KICKS,I_KICKS,COLORS};',environment);core=environment.__core;
}else if(mode==='medium'){
 // Diagnostic transpilation only: never writes dist, never repairs annotations,
 // and never passes the declared build. Mirrors Nemotron's isolated engine path.
 const ts=createRequire(resolve(root,'package.json'))('typescript');
 const transpile=f=>ts.transpileModule(readFileSync(resolve(root,'src',f),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
 const exports={};environment=vm.createContext({...sandbox(),exports});vm.runInContext(transpile('game.ts'),environment);core=exports;engineMath=environment.Math;
 const vars=['board','current','queue','held','canHold','running','gameOver','score','lines','level','fallTime','lockTime','lockResets','lastTime'];
 const main=transpile('main.ts');environment=vm.createContext({...sandbox(),require:()=>core,exports:{}});
 vm.runInContext(main+'\n;globalThis.__main={get:()=>({'+vars.join(',')+'}),set:v=>{'+vars.map(n=>`if('${n}' in v)${n}=v.${n};`).join('')+'},start,move,rotate,hold,hardDrop,tick};',environment);
}else core=await load(mode==='low'?'engine.js':'game.js');
const matrixCells=m=>m.flatMap((row,y)=>row.flatMap((v,x)=>v?[[x,y]]:[]));
const local=(t,r)=>{
 if(mode==='low')return core.cells({kind:t,rotation:r,x:0,y:0});
 if(mode==='max')return core.getCells(t,r);
 if(mode==='xhigh')return core.cellsFor(t,r);
 let m=mode==='high'?core.matrixFor(t):core.makePiece(t).matrix;
 if(t!=='O')for(let i=0;i<r;i++)m=mode==='high'?core.rotate(m,true):core.rotateMatrix(m,true);
 return matrixCells(m);
};
const make=(seed=42)=>{
 let randomState=seed;const random=()=>((randomState=(Math.imul(randomState,1664525)+1013904223)>>>0)/2**32);
 if(mode==='low')Math.random=random;else if(mode==='high')environment.Math.random=random;else if(mode==='medium'){environment.Math.random=random;engineMath.random=random;}
 if(mode==='high'){const g=new core.Tetris();g.start();return g;}
 if(mode==='medium'){environment.__main.start();return environment.__main;}
 if(mode==='xhigh')return core.createGame(seed);
 const g=new core.TetrisGame(mode==='max'?(()=>{let s=seed;return()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/2**32);})():undefined);if(mode==='low')g.start();return g;
};
const state=g=>mode==='low'?g.state:mode==='medium'?g.get():g;
const active=g=>{const p=state(g)[mode==='high'||mode==='medium'?'current':mode==='max'?'current':'active'];return p&&{type:p.type??p.kind,rotation:p.rotation,x:p.x,y:p.y};};
const grid=g=>state(g).board, clear=g=>grid(g).forEach(r=>r.fill(null));
const get=(g,k)=>state(g)[k], set=(g,v)=>mode==='medium'?g.set(v):Object.assign(state(g),v);
const over=g=>mode==='high'?g.state==='over':get(g,'gameOver');
const absolute=p=>local(p.type,p.rotation).map(([x,y])=>[x+p.x,y+p.y]);
const fits=(g,p)=>absolute(p).every(([x,y])=>x>=0&&x<10&&y<=bottom&&(y<0||grid(g)[y][x]===null));
const put=(g,x,y)=>grid(g)[y][x]='J';
const count=g=>grid(g).flat().filter(Boolean).length;
const move=(g,d)=>mode==='max'?g.moveHorizontal(d):mode==='xhigh'?core.moveHorizontal(g,d):g.move(d);
const rotate=(g,d)=>mode==='xhigh'?core.rotate(g,d):mode==='high'?g.rotatePiece(d===1):mode==='medium'?g.rotate(d===1):g.rotate(d);
const hard=g=>mode==='xhigh'?core.hardDrop(g):g.hardDrop();
const hold=g=>mode==='xhigh'?core.holdPiece(g):mode==='high'||mode==='medium'?g.hold():g.holdPiece();
const held=g=>get(g,mode==='high'?'held':'hold')??get(g,'held');
const available=g=>mode==='xhigh'?!g.holdUsed:get(g,'canHold');
const queue=g=>get(g,mode==='max'?'nextQueue':'queue');
const restart=g=>mode==='max'?g.restart():mode==='xhigh'?Object.assign(g,core.createGame(42)):mode==='high'?g.reset():g.start();
const place=(g,t,r,x,y)=>{
 const p=mode==='high'?g.makePiece(t):mode==='medium'?core.makePiece(t):{type:t,rotation:r,x,y};
 if(mode==='high'||mode==='medium'){p.matrix=mode==='high'?core.matrixFor(t):core.makePiece(t).matrix;if(t!=='O')for(let i=0;i<r;i++)p.matrix=mode==='high'?core.rotate(p.matrix,true):core.rotateMatrix(p.matrix,true);}
 Object.assign(p,{type:t,rotation:r,x,y});if(mode==='low'){p.kind=t;delete p.type;}
 set(g,{[mode==='low'||mode==='xhigh'?'active':'current']:p});
 if(mode==='low')Object.assign(g,{gravityMs:0,lockMs:0,lockResets:0});
 else set(g,{gravityClock:0,lockClock:0,lockResets:0,gravityAccumulator:0,lockTimer:0,dropAccumulator:0,lockAccumulator:0,fallTime:0,lockTime:0,lastAction:'move',lastKick:0,lastKickIndex:null});
 assert(fits(g,active(g)),'collision-free fixture');
};
const step=(g,ms,soft=false)=>{
 if(mode==='low')g.tick(ms);
 else if(mode==='max')g.tick(ms,soft);
 else if(mode==='xhigh')core.updateGame(g,ms);
 else {const last=mode==='high'?g.lastTime:get(g,'lastTime');const now=(last||1000)+ms;if(!last)set(g,{lastTime:1000});mode==='high'?g.frame(now):g.tick(now);}
};
const advance=(g,ms,soft=false)=>{while(ms>1e-9){const d=Math.min(16,ms);step(g,d,soft);ms-=d;}};
const ghost=g=>{if(mode==='max')return g.getGhostY();let p=active(g);while(fits(g,{...p,y:p.y+1}))p.y++;return p.y;};
const key=c=>Array.from(c,([x,y])=>`${x},${y}`).sort().join(' ');
const evidence={mode,diagnosticOnly:mode==='medium'};
const wrongStates=[];
for(const t of types)for(let r=0;r<4;r++)if(key(local(t,r).map(([x,y])=>[x+(t==='O'&&mode==='high'?1:0),y]))!==key(reference[t][r]))wrongStates.push(t+r);
assert.deepEqual(wrongStates,['low','medium'].includes(mode)?types.filter(t=>!['I','O'].includes(t)).flatMap(t=>[1,2,3].map(r=>t+r)):[]);evidence.wrongStates=wrongStates;
const colors=mode==='max'?types.map(core.pieceColor):mode==='xhigh'?Object.values(vm.runInNewContext('('+readFileSync(resolve(root,'src/main.ts'),'utf8').match(/const COLORS:[^=]*= (\{[\s\S]*?\});/)[1]+')')):Object.values(core.COLORS);
assert.equal(new Set(colors).size,7);
for(const t of types){const g=make();place(g,t,0,3,8);for(const d of [-1,1]){for(let i=0;i<20;i++){const old=active(g).x;move(g,d);if(active(g).x===old)break;}const xs=absolute(active(g)).map(([x])=>x);assert.equal(d===-1?Math.min(...xs):Math.max(...xs),d===-1?0:9);}}
const wrongKicks=[];
// Observe the actual ordered candidates through collision checks, without
// replacing rotation logic or accessing a second copy of a table.
for(const t of types.filter(t=>t!=='O'))for(const k of Object.keys(normalKicks)){
 const [from,to]=k.split('>').map(Number),g=make();place(g,t,from,3,8);const seen=[];
 const expected=(t==='I'?iKicks:normalKicks)[k].map(([x,y])=>[x,-y||0]);
 if(mode==='low'){g.valid=p=>{seen.push([p.x-3,p.y-8]);return false;};}
 else if(mode==='max'){g.collides=p=>{if(p.rotation===to)seen.push([p.x-3,p.y-8]);return true;};}
 else if(mode==='high'){g.collides=(p,dx=0,dy=0,m=p.matrix)=>{if(m!==p.matrix)seen.push([dx,dy||0]);return true;};}
 else if(mode==='medium'){// Core helper closes over collision; direct diagnostic table extraction.
  const code=readFileSync(resolve(root,'src/game.ts'),'utf8');const name=t==='I'?'IKicks':'JLSTZ';const match=code.match(new RegExp('const '+name+'[^=]*= ([\\s\\S]*?);'));const table=vm.runInNewContext('('+match[1]+')');seen.push(...table[k]);
 }
 else {// Exported functions close over canPlace: capture exact data in a separate VM of unchanged emitted code.
  const source=readFileSync(resolve(root,'dist/game.js'),'utf8').replace(/export /g,'');const box=vm.createContext({});vm.runInContext(source+';globalThis.tables={JLSTZ_KICKS,I_KICKS};',box);seen.push(...box.tables[t==='I'?'I_KICKS':'JLSTZ_KICKS'][k]);
 }
 if(mode!=='medium'&&mode!=='xhigh')rotate(g,(to-from+4)%4===1?1:-1);
 // low's initial grounded check is absent; all recorded checks are candidates.
 if(JSON.stringify(seen)!==JSON.stringify(expected))wrongKicks.push(`${t}:${k}`);
}
assert.deepEqual(wrongKicks,mode==='xhigh'?['I:0>3']:mode==='max'?['I:3>0','I:0>3']:[]);evidence.wrongKicks=wrongKicks;
for(const t of ['T','I'])for(const d of [-1,1]){
 const g=make();place(g,t,d===-1?1:3,d===-1?(t==='I'?-2:-1):8,10);rotate(g,d);assert.equal(active(g).rotation,mode==='max'&&t==='I'&&d===1?3:0);assert(fits(g,active(g)));if(!(mode==='max'&&t==='I'&&d===1))assert.notEqual(active(g).x,d===-1?(t==='I'?-2:-1):8);
}
// Legal obstructed I transitions demonstrate the table mismatches in play.
if(mode==='xhigh'||mode==='max'){
 const g=make();place(g,'I',0,3,10);put(g,4,10);rotate(g,-1);
 assert.equal(active(g).rotation,3);assert.equal(active(g).x,mode==='xhigh'?1:4);
 evidence.i0to3={stack:[4,10],expected:{type:'I',rotation:3,x:2,y:10},actual:active(g)};
 if(mode==='max'){const h=make();place(h,'I',3,3,10);put(h,3,11);rotate(h,1);assert.equal(active(h).x,5);evidence.i3to0={expectedX:4,actual:active(h)};}
}
for(let seed=1;seed<=10;seed++){
 const g=make(seed);for(let b=0;b<10;b++){const bag=[];for(let i=0;i<7;i++){bag.push(active(g).type);clear(g);hard(g);assert(!over(g));}assert.deepEqual(bag.sort(),[...types].sort());}
}
if(mode==='xhigh'){
 const g=make(1234),dealt=[];let firstOver=null;
 for(let i=0;i<14;i++){dealt.push(active(g).type);hard(g);if(over(g)&&firstOver===null)firstOver=i+1;}
 evidence.ownBagTest={dealt,firstOver,sizes:[new Set(dealt.slice(0,7)).size,new Set(dealt.slice(7)).size]};assert.deepEqual(evidence.ownBagTest.sizes,[7,5]);assert.equal(firstOver,11);
}
{
 const g=make(),first=active(g).type,next=queue(g)[0];rotate(g,1);hold(g);assert.equal(held(g),first);assert.equal(active(g).type,next);assert(!available(g));const before=JSON.stringify(active(g));hold(g);assert.equal(JSON.stringify(active(g)),before);clear(g);hard(g);assert(available(g));hold(g);assert.equal(active(g).type,first);assert.equal(active(g).rotation,0);
}
for(const t of types){const g=make();place(g,t,0,3,0);put(g,4,bottom-2);const p=active(g),y=ghost(g);assert(fits(g,{...p,y}));assert(!fits(g,{...p,y:y+1}));hard(g);assert.equal(get(g,'score'),2*(y-p.y));for(const [x,yy]of absolute({...p,y}))assert.equal(grid(g)[yy][x],t);}
{
 const g=make();const oX=mode==='high'?4:3;place(g,'O',0,oX,bottom-1);advance(g,499);assert.equal(count(g),0);step(g,1.000001);assert.equal(count(g),4);
 const r=make();place(r,'O',0,oX,bottom-1);for(let i=0;i<15;i++){advance(r,490);assert.equal(count(r),0);move(r,i%2?-1:1);}advance(r,490);move(r,-1);advance(r,10.000001);assert.equal(count(r),4);
 const l=make();place(l,'O',0,mode==='high'?0:-1,bottom-4);put(l,0,bottom-2);advance(l,490);move(l,1);assert(fits(l,{...active(l),y:active(l).y+1}));advance(l,20);assert.equal(count(l),1);assert.equal(active(l).y,bottom-4);for(let i=0;i<400&&grid(l)[bottom][1]===null;i++)step(l,16);assert.equal(grid(l)[bottom][1],'O');
}
console.log(`${mode}: states/kick candidates, 100 actual seeded bags, hold, obstructed drops and lock/cap/ledge verified`);
const single=(g,perfect=false)=>{clear(g);for(const x of [0,1,2,7,8,9])put(g,x,bottom);if(!perfect)put(g,0,bottom-9);place(g,'I',0,3,bottom-1);};
const tetris=(g,perfect=false)=>{clear(g);for(let y=bottom-3;y<=bottom;y++)for(let x=0;x<10;x++)if(x!==4)put(g,x,y);if(!perfect)put(g,0,bottom-9);place(g,'I',1,2,bottom-3);};
const basic=['low','medium','high'].includes(mode);
for(const [n,expected]of [[1,100],[2,300],[3,500],[4,800]]){const g=make();if(n===1)single(g);else{clear(g);for(let y=bottom-n+1;y<=bottom;y++)for(let x=0;x<10;x++)if(x!==4)put(g,x,y);put(g,0,bottom-9);place(g,'I',1,2,bottom-3);}hard(g);evidence['normal'+n]=get(g,'score');assert.equal(get(g,'score'),expected);assert.equal(get(g,'lines'),n);}
{
 const g=make();single(g,true);hard(g);assert.equal(get(g,'score'),basic?100:900);assert.equal(count(g),0);evidence.pc=get(g,'score');
 const b=make();tetris(b);hard(b);clear(b);place(b,'O',0,0,bottom-1);hard(b);tetris(b);hard(b);assert.equal(get(b,'score'),basic?1600:2000);evidence.b2b=get(b,'score');single(b);hard(b);assert.equal(get(b,'score'),basic?1700:2150);if(!basic)assert.equal(get(b,'backToBack'),false);
 const c=make();set(c,{level:2,lines:10,combo:0});single(c);hard(c);assert.equal(get(c,'score'),basic?200:300);evidence.combo=get(c,'score');
 const crossing=make();set(crossing,{lines:9});single(crossing);hard(crossing);assert.equal(get(crossing,'score'),100);assert.equal(get(crossing,'level'),2);
 const pc=make();tetris(pc);hard(pc);clear(pc);place(pc,'O',0,0,bottom-1);hard(pc);tetris(pc,true);hard(pc);assert.equal(count(pc),0);assert.equal(get(pc,'score'),basic?1600:4000);evidence.b2bTetrisPc=get(pc,'score');
}
// Fixtures use each delivered shape origin. For the wrong-pivot engines,
// add only blockers that force a legal final rotation into the same r0 pose.
for(const timed of [false,true])for(const full of [false,true])for(const line of [false,true]){
 const g=make(),y=bottom-2;put(g,5,y);put(g,3,bottom);put(g,full?3:5,full?y:bottom);
 if(line)for(const x of [0,1,2,6,7,8,9])put(g,x,bottom-1);
 if(mode==='low'||mode==='medium'){
  const original=grid(g).map(row=>[...row]);let found=false;
  for(const [r,d]of [[3,1],[1,-1]])for(let desired=0;desired<5&&!found;desired++){
   set(g,{board:original.map(row=>[...row])});const kicks=normalKicks[`${r}>0`],target={type:'T',rotation:0,x:3,y},[dx,up]=kicks[desired];
   const p={type:'T',rotation:r,x:3-dx,y:y+up};if(!fits(g,p))continue;
   const protectedCells=new Set([...absolute(p),...absolute(target)].map(String));let possible=true;
   for(let i=0;i<desired;i++){
    const [kx,ky]=kicks[i],q={...p,rotation:0,x:p.x+kx,y:p.y-ky};if(!fits(g,q))continue;
    const blocker=absolute(q).find(([x,yy])=>x>=0&&x<10&&yy>=0&&yy<=bottom&&!protectedCells.has(String([x,yy])));
    if(!blocker){possible=false;break;}put(g,...blocker);
   }
   if(!possible)continue;place(g,'T',r,p.x,p.y);rotate(g,d);if(JSON.stringify(active(g))===JSON.stringify(target))found=true;
  }
  assert(found,'legal final rotation for wrong-pivot spin fixture');
 }else{place(g,'T',3,3,y);rotate(g,1);assert.equal(active(g).rotation,0);}assert.equal(ghost(g),active(g).y);
 if(timed)advance(g,500.000001);else hard(g);
 const expected=basic?(line?100:0):full?(line?800:400):(line?200:100);
 evidence[`${timed?'timed':'hard'}-${full?'full':'mini'}-${line?'single':'zero'}`]=get(g,'score');assert.equal(get(g,'score'),expected);
}
// B2B mini eligibility and an ordinary single PC after an armed chain.
{
 const g=make();tetris(g);hard(g);clear(g);set(g,{combo:-1});const y=bottom-2;
 for(const [x,yy]of [[5,y],[3,bottom],[5,bottom]])put(g,x,yy);for(const x of [0,1,2,6,7,8,9])put(g,x,bottom-1);
 if(!basic){place(g,'T',3,3,y);rotate(g,1);advance(g,500.000001);assert.equal(get(g,'score'),1100);assert(get(g,'backToBack'));evidence.miniAfterTetris=get(g,'score');}
 const p=make();tetris(p);hard(p);clear(p);place(p,'O',0,0,bottom-1);hard(p);single(p,true);hard(p);assert.equal(get(p,'score'),basic?900:1700);evidence.singlePcAfterB2B=get(p,'score');
}
// Mini/fifth-kick integration and an actual manual-down after rotation.
if(!basic){
 const g=make();const y=bottom-2;for(const [x,yy]of [[5,y],[3,bottom],[5,bottom]])put(g,x,yy);place(g,'T',0,3,y);set(g,{lastAction:'rotate',lastKick:4,lastKickIndex:4});hard(g);assert.equal(get(g,'score'),400);
 const s=make();for(const [x,yy]of [[3,y],[3,bottom],[5,bottom]])put(s,x,yy);place(s,'T',0,3,3);rotate(s,1);let distance=0;
 while(mode==='max'?s.softDropStep():core.softDrop(s))distance++;
 assert.equal(active(s).y,y);hard(s);evidence.spinAfterSoft=get(s,'score')-distance;assert.equal(evidence.spinAfterSoft,mode==='max'?100:0);
}
const intervals=[];
for(const level of [1,2,5,10,15,20]){
 const g=make();place(g,'O',0,mode==='high'?4:3,0);set(g,{level,lines:(level-1)*10});let elapsed=0;while(active(g).y===0&&elapsed<2000){step(g,1);elapsed++;}
 const expected=mode==='low'?Math.max(50,1000*0.8**(level-1)):mode==='medium'?[1000,850,700,550,420,300,220,160,110,80][Math.min(level-1,9)]:mode==='high'?Math.max(45,800*0.82**(level-1)):mode==='xhigh'?(level<=9?1000/level:Math.max(16,1000/Math.min(120,9*1.32**(level-9)))):Math.max(16,1000*Math.max(.1,.8-(level-1)*.007)**(level-1));
 assert(Math.abs(elapsed-Math.ceil(expected-1e-8))<=1);intervals.push({level,elapsed,profile:1000*(.8-(level-1)*.007)**(level-1),score:get(g,'score')});
 if(mode==='max')assert(Math.abs(expected-Math.max(16,1000*(.8-(level-1)*.007)**(level-1)))<1e-7);
}
evidence.gravity=intervals;
if(mode==='max')for(const level of [1,2,5,10,15,20]){const g=make();g.level=level;const expected=Math.max(16,1000*(.8-(level-1)*.007)**(level-1));assert(Math.abs(g.gravityIntervalMs()-expected)<1e-7);}
{
 const g=make();place(g,'O',0,3,0);advance(g,800);const before=active(g).y,points=get(g,'score');
 if(mode==='max'){g.softDropStep();step(g,1,true);}else if(mode==='low'){g.softDrop();step(g,1);}else if(mode==='high'){g.softDrop();step(g,1);}else if(mode==='medium'){g.move(0,1);g.set({fallTime:0});step(g,1);}else{core.softDrop(g);step(g,1);}
 evidence.softTransition={rows:active(g).y-before,points:get(g,'score')-points};assert.deepEqual(evidence.softTransition,mode==='max'?{rows:18,points:18}:{rows:1,points:1});
 const a=make();place(a,'O',0,3,0);if(mode==='max')advance(a,100,true);else if(mode==='xhigh')core.softDrop(a);else if(mode==='low')a.softDrop();else if(mode==='medium')a.move(0,1);else a.softDrop();assert(get(a,'score')>0);
}
// Input resets used while airborne must not consume the fifteen grounded resets.
if(mode==='high'){
 const g=make();place(g,'T',0,3,0);for(let i=0;i<15;i++)move(g,i%2?-1:1);assert.equal(g.lockResets,15);
 g.current=g.makePiece('O');g.current.y=18;g.dropAccumulator=0;advance(g,490);move(g,1);advance(g,20);assert.equal(count(g),4);evidence.airConsumedResets=15;
}
const refresh=[];
for(const hz of [60,144]){const g=make();place(g,'O',0,3,0);set(g,{level:15,lines:140});for(let elapsed=0;elapsed<600-1e-8;){const dt=Math.min(1000/hz,600-elapsed);step(g,dt);elapsed+=dt;}refresh.push({hz,y:active(g).y,score:get(g,'score')});}
evidence.refresh=refresh;
if(mode==='high')assert.deepEqual(refresh.map(r=>r.y),[12,10]);else assert.equal(refresh[0].y,refresh[1].y);
// Search only stack placements and public actions from the real spawn. The
// bounded, seeded search is diagnostic; every found path is replayed through
// unchanged engine actions and the next spawn is checked independently.
{
 const g=make();clear(g);
 if(mode==='xhigh'){
  g.active={type:'T',rotation:0,x:3,y:0};g.queue[0]='I';for(const [x,y]of [[2,2],[3,3],[4,3]])put(g,x,y);
  rotate(g,1);rotate(g,-1);move(g,-1);move(g,-1);move(g,-1);assert(absolute(active(g)).every(([,y])=>y<2));assert.equal(ghost(g),active(g).y);assert(fits(g,{type:'I',rotation:0,x:3,y:0}));hard(g);assert(!over(g));evidence.hiddenLockOut=false;
 }else{
  const spawn=()=>{if(mode==='low')g.spawn('T');else set(g,{current:mode==='max'?g.createPiece('T'):mode==='high'?g.makePiece('T'):core.makePiece('T')});};
  let rng=1234;const rand=n=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng%n;};let found=null;
  for(let trial=0;trial<3000&&!found;trial++){
   clear(g);spawn();const stack=[];for(let i=0,n=4+rand(5);i<n;i++){const x=rand(7),y=rand(5);put(g,x,y);stack.push([x,y]);}
   if(!fits(g,active(g))||!fits(g,{type:'I',rotation:0,x:3,y:mode==='max'?-1:0}))continue;
   const pending=[{p:active(g),path:[]}],visited=new Set();
   for(let i=0;i<pending.length&&i<500&&!found;i++){
    const {p,path}=pending[i],id=JSON.stringify(p);if(visited.has(id))continue;visited.add(id);
    if(absolute(p).every(([,y])=>y<0)&&!fits(g,{...p,y:p.y+1})){found={stack,path};break;}
    if(path.length>=12)continue;
    for(const action of ['L','R','C','A']){
     let candidate;
     if(action==='L'||action==='R'){candidate={...p,x:p.x+(action==='L'?-1:1)};if(!fits(g,candidate))continue;}
     else{const to=(p.rotation+(action==='C'?1:3))%4;for(const [dx,up]of normalKicks[`${p.rotation}>${to}`]){const q={...p,rotation:to,x:p.x+dx,y:p.y-up};if(fits(g,q)){candidate=q;break;}}}
     if(candidate)pending.push({p:candidate,path:[...path,action]});
    }
   }
  }
  assert(found,'legal hidden path found');clear(g);spawn();queue(g)[0]='I';for(const [x,y]of found.stack)put(g,x,y);
  for(const a of found.path)if(a==='L'||a==='R')move(g,a==='L'?-1:1);else rotate(g,a==='C'?1:-1);
  assert(absolute(active(g)).every(([,y])=>y<0));assert.equal(ghost(g),active(g).y);hard(g);assert(over(g));evidence.hiddenLockOut={...found,over:over(g)};
 }
}

{
 const g=make();clear(g);place(g,'O',0,0,bottom-1);queue(g)[0]='T';put(g,4,mode==='max'?0:0);hard(g);assert(over(g));
 const snap=()=>JSON.stringify([active(g),grid(g),get(g,'score'),held(g)]);const before=snap();if(mode!=='medium'){move(g,-1);rotate(g,1);hold(g);hard(g);advance(g,1000);assert.equal(snap(),before);}
 restart(g);assert(!over(g));assert.equal(count(g),0);assert.equal(get(g,'score'),0);assert.equal(get(g,'lines'),0);assert.equal(get(g,'level'),1);assert(available(g));assert.equal(held(g)??null,null);
}
console.log(JSON.stringify(evidence,null,2));
console.log(`${mode}: audited findings reproduced${mode==='medium'?' in diagnostic transpilation only; delivered build still fails':''}`);
