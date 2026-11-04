// Full GLM-5.3 MAX, independent fixtures; no delivered implementation edits.
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {reference,normalKicks,iKicks} from './opus55-efforts-audit.mjs';
export {reference,normalKicks,iKicks};

// Only setup/candidate capture touch emitted private fields. No spin credit is assigned.
export function createAdapter(modules) {
  const pieces=modules.pieces;
  const seeded=seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
  const withRandom=(rng,fn)=>{const old=Math.random;Math.random=rng;try{return fn();}finally{Math.random=old;}};
  const make=(seed=42)=>{const rng=seeded(seed),g=withRandom(rng,()=>new modules.game.Game());g.__auditRandom=rng;return g;};
  const active=g=>{const p=g.active;return p&&{type:p.type,rotation:p.rotation,x:p.x-(p.type==='O'?1:0),y:p.y-2};};
  const setActive=(g,p)=>{g.active={...p,x:p.x+(p.type==='O'?1:0),y:p.y+2};};
  const local=(t,r)=>pieces.PIECES[t].states[r].map(([x,y])=>[x+(t==='O'?1:0),y]);
  const cells=p=>local(p.type,p.rotation).map(([x,y])=>[x+p.x,y+p.y]);
  const get=(g,x,y)=>y<-2||y>=20||x<0||x>9?null:g.board.grid[y+2][x];
  const put=(g,x,y,t='J')=>{if(y<-2||y>=20||x<0||x>9)throw Error('stack bounds');g.board.grid[y+2][x]=t;};
  const clear=g=>{for(let y=-2;y<20;y++)for(let x=0;x<10;x++)put(g,x,y,null);};
  const count=g=>g.board.grid.flat().filter(Boolean).length;
  const fits=(g,p)=>cells(p).every(([x,y])=>x>=0&&x<10&&y<20&&!get(g,x,y));
  const place=(g,t,r,x,y)=>{setActive(g,{type:t,rotation:r,x,y});Object.assign(g,{gravityAcc:0,lockTimer:0,lockResets:0,lowestY:y+2,lastAction:'spawn',lastKick:0,__softDrop:false});if(!fits(g,active(g)))throw Error('colliding fixture');};
  const move=(g,d)=>g.move(d),rotate=(g,d)=>g.rotate(d),hard=g=>withRandom(g.__auditRandom,()=>g.hardDrop()),hold=g=>withRandom(g.__auditRandom,()=>g.holdPiece());
  // Match real Down key: immediate row and accumulator reset precede held update.
  const soft=(g,on)=>{if(on&&!g.__softDrop)g.softDropStep();g.__softDrop=on;};
  const step=(g,ms)=>withRandom(g.__auditRandom,()=>g.update(ms,!!g.__softDrop));
  const advance=(g,ms)=>{while(ms>1e-8){const dt=Math.min(ms,16);step(g,dt);ms-=dt;}};
  const ghost=g=>g.ghostY()-2,over=g=>g.gameOver,spawn=(g,t)=>g.spawn(t),incoming=(g,t)=>g.queue[0]=t;
  const reset=g=>withRandom(g.__auditRandom,()=>g.restart());
  const capture=(g,from,to)=>{const seen=[],p=g.active;g.fits=(t,x,y,r)=>{seen.push([x-p.x,y-p.y]);return false;};rotate(g,(to-from+4)%4===1?1:-1);return seen;};
  return {mode:'max',make,active,local,cells,get,put,clear,count,fits,place,move,rotate,hard,hold,soft,step,advance,ghost,over,spawn,incoming,capture,reset};
}

export function runProbes(a,oracle) {
  const {reference,normalKicks,iKicks}=oracle;
  const {mode,make,active,local,cells,get,put,clear,count,fits,place,move,rotate,hard,hold,soft,step,advance,ghost,over,spawn,incoming,capture,reset}=a;
  const e={mode},check=(v,m)=>{if(!v)throw Error(m);},eq=(v,w,m)=>check(JSON.stringify(v)===JSON.stringify(w),m+': '+JSON.stringify({v,w}));
  const key=cs=>cs.map(p=>p.join(',')).sort().join(' '),types=Object.keys(reference);
  e.states=[];for(const t of types)for(let r=0;r<4;r++)if(key(local(t,r))!==key(reference[t][r]))e.states.push(t+r);
  e.kicks=[];for(const t of types.filter(t=>t!=='O'))for(const tr of Object.keys(normalKicks)){const[from,to]=tr.split('>').map(Number),g=make();place(g,t,from,3,8);const got=capture(g,from,to),want=(t==='I'?iKicks:normalKicks)[tr].map(([x,y])=>[x,-y||0]);if(JSON.stringify(got)!==JSON.stringify(want))e.kicks.push({t,tr,got,want});}
  // 672 independently computed actual CW/CCW outcomes with walls/floor/obstructions.
  let seed=0x5532;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
  const canon=p=>reference[p.type][p.rotation].map(([x,y])=>[p.x+x,p.y+y]);
  const legal=(g,p)=>canon(p).every(([x,y])=>x>=0&&x<10&&y<20&&!get(g,x,y));
  e.rotations={total:0,mismatches:0,rejected:0,byType:{},firstByType:{},examples:[]};
  for(const type of types)for(let from=0;from<4;from++)for(const dir of [-1,1])for(let sample=0;sample<12;sample++){
    const cs=[...reference[type][from],...local(type,from)],minX=Math.min(...cs.map(p=>p[0])),maxX=Math.max(...cs.map(p=>p[0])),maxY=Math.max(...cs.map(p=>p[1]));
    const x=[-minX,3,9-maxX][sample%3],y=[-2,8,19-maxY][Math.floor(sample/3)%3],g=make();place(g,type,from,x,y);
    const before=active(g),occupied=new Set([...canon(before),...cells(before)].map(p=>p.join(','))),stack=[];
    for(let yy=Math.max(-2,y-2);yy<=Math.min(19,y+4);yy++)for(let xx=0;xx<10;xx++)if(!occupied.has(`${xx},${yy}`)&&random()<.28){put(g,xx,yy);stack.push([xx,yy]);}
    const to=(from+dir+4)%4,offsets=type==='O'?[[0,0]]:(type==='I'?iKicks:normalKicks)[`${from}>${to}`].map(([dx,dy])=>[dx,-dy]);
    const index=offsets.findIndex(([dx,dy])=>legal(g,{type,rotation:to,x:x+dx,y:y+dy})),want=index<0?before:{type,rotation:to,x:x+offsets[index][0],y:y+offsets[index][1]};
    const success=rotate(g,dir),got=active(g);e.rotations.total++;if(index<0)e.rotations.rejected++;
    if(success!==(index>=0)||JSON.stringify(got)!==JSON.stringify(want)){e.rotations.mismatches++;e.rotations.byType[type]=(e.rotations.byType[type]??0)+1;e.rotations.firstByType[type]??={before,dir,stack,success,got,want};if(e.rotations.examples.length<4)e.rotations.examples.push({before,dir,stack,success,got,want});}
  }
  e.bags=0;for(let s=1;s<=10;s++){const g=make(s);for(let b=0;b<10;b++){const bag=[];for(let i=0;i<7;i++){bag.push(active(g).type);clear(g);hard(g);check(!over(g),'bag game');}eq(bag.sort(),[...types].sort(),'actual bag');e.bags++;}}
  {const g=make(),first=active(g).type,next=g.queue[0];rotate(g,1);hold(g);eq([g.hold,active(g).type,g.canHold],[first,next,false],'first hold');const p=active(g);hold(g);eq(active(g),p,'hold restriction');clear(g);hard(g);check(g.canHold,'hold postlock');hold(g);eq([active(g).type,active(g).rotation,g.canHold],[first,0,false],'held retrieval');e.hold='pass';}
  e.ghosts=[];for(const t of types){const g=make();place(g,t,0,3,0);put(g,4,16);const p=active(g);let y=p.y;while(fits(g,{...p,y:y+1}))y++;eq(ghost(g),y,'ghost '+t);hard(g);eq(g.score,2*(y-p.y),'drop points');for(const[x,yy]of cells({...p,y}))check(get(g,x,yy),'exact welded cells');eq(count(g),5,'weld count');e.ghosts.push([t,y]);}
  {const g=make();for(let y of [16,18])for(let x=0;x<10;x++)put(g,x,y);put(g,2,15,'T');const n=g.board.clearLines();eq(n,2,'two rows');check(get(g,2,17)==='T','nonadjacent compaction');e.compaction='pass';}
  {const g=make();place(g,'O',0,3,18);advance(g,499);eq(count(g),0,'499 unlocked');step(g,1);eq(count(g),4,'500 lock');
    const r=make();place(r,'O',0,3,18);advance(r,490);move(r,1);advance(r,499);eq(count(r),0,'movement reset');step(r,1);eq(count(r),4,'reset 500');
    const c=make();place(c,'O',0,3,18);for(let i=0;i<15;i++){advance(c,10);move(c,i%2?-1:1);}advance(c,499);eq(count(c),0,'full fifteenth reset');move(c,-1);step(c,1);eq(count(c),4,'sixteenth cannot reset');
    const f=make();place(f,'O',0,-1,18);advance(f,490);for(let i=0;i<5;i++){check(!move(f,-1),'failed wall');advance(f,2);}eq(count(f),4,'failed actions no reset');e.lock='499/500, reset, full fifteen-cap, failed moves pass';}
  {const g=make();place(g,'O',0,3,17);advance(g,990);step(g,16);advance(g,483);const at1489=count(g);step(g,1);e.landing={at1489,at1490:count(g)};let t=1490;while(count(g)===0&&t<1600){step(g,1);t++;}e.landing.lock=t;}
  {const g=make();place(g,'O',0,-1,12);put(g,0,14);advance(g,490);move(g,1);advance(g,20);eq(count(g),1,'ledge airborne no lock');let t=20,land=null;while(count(g)===1&&t<8000){step(g,1);t++;if(land===null&&active(g)?.y===18)land=t;}e.ledge={land,lock:t,resets:g.lockResets};}
  {const g=make();place(g,'O',0,-1,12);put(g,0,14);for(let i=0;i<15;i++){advance(g,1);rotate(g,1);}advance(g,490);move(g,1);let t=0,land=null;while(count(g)===1&&t<8000){step(g,1);t++;if(land===null&&active(g)?.y===18)land=t;}e.exhaustedLedge={land,lock:t};}
  e.gravity=[];for(let level=1;level<=20;level++){const g=make();g.level=level;g.lines=(level-1)*10;place(g,'O',0,3,0);let t=0;while(active(g).y===0&&t<2000){step(g,1);t++;}e.gravity.push({level,actual:t,expected:Math.ceil(Math.max(1000*Math.pow(.8-(level-1)*.007,level-1),1)-1e-8)});}
  e.refresh=[];for(const hz of [60,144]){const g=make();g.level=10;place(g,'O',0,3,0);let t=0;while(t<600-1e-8){const d=Math.min(1000/hz,600-t);step(g,d);t+=d;}e.refresh.push(active(g).y);}
  {const g=make();place(g,'O',0,3,0);advance(g,800);soft(g,true);step(g,1);e.softEntry={rows:active(g).y,points:g.score};soft(g,false);advance(g,999);e.softRelease=active(g).y;}
  {const g=make();place(g,'O',0,3,18);soft(g,true);step(g,1);eq(count(g),0,'blocked soft does not lock');e.blockedSoft='pass';}
  {const g=make();place(g,'O',0,3,0);advance(g,800);hold(g);const y=active(g).y;advance(g,999);eq(active(g).y,y,'fresh hold clock');step(g,1);eq(active(g).y,y+1,'hold 1000ms');e.holdClock='pass';}
  const well=(g,n,pc=false)=>{clear(g);for(let y=20-n;y<20;y++)for(let x=0;x<10;x++)if(x!==4)put(g,x,y);if(!pc)put(g,0,10);place(g,'I',1,2,16);};
  const pcWell=(g,n)=>{clear(g);const p=n===1?{type:'I',rotation:0,x:3,y:18}:n===2?{type:'O',rotation:0,x:3,y:18}:n===3?{type:'T',rotation:1,x:3,y:17}:{type:'I',rotation:1,x:2,y:16};const occupied=new Set(cells(p).map(c=>c.join(',')));for(let y=20-n;y<20;y++)for(let x=0;x<10;x++)if(!occupied.has(`${x},${y}`))put(g,x,y);place(g,p.type,p.rotation,p.x,p.y);};
  const filler=g=>{clear(g);place(g,'O',0,7,18);hard(g);};
  const s=e.scores={};for(const n of [1,2,3,4]){const g=make();well(g,n);hard(g);eq(g.lines,n,'clear lines');s['normal'+n]=g.score;const p=make();pcWell(p,n);hard(p);eq(count(p),0,'PC empty');s['pc'+n]=p.score;}
  {const g=make();well(g,4);hard(g);well(g,4);hard(g);s.consecutive=g.score;}
  {const g=make();well(g,4);hard(g);filler(g);well(g,4);hard(g);s.b2b=g.score;well(g,1);hard(g);s.b2bBreak=g.score;}
  {const g=make();g.lines=10;g.level=2;well(g,1);hard(g);const before=g.score;well(g,1);hard(g);s.levelTwoCombo=g.score-before;}
  {const g=make();g.lines=9;well(g,1);hard(g);s.crossing=[g.score,g.lines,g.level];}
  {const g=make();well(g,4);hard(g);filler(g);well(g,4,true);hard(g);s.b2bPc=g.score;}
  const pocket=(g,full,line)=>{clear(g);put(g,5,17);put(g,3,19);put(g,full?3:5,full?17:19);if(line)for(const x of [0,1,2,6,7,8,9])put(g,x,18);place(g,'T',3,3,17);check(rotate(g,1),'actual spin');eq(active(g),{type:'T',rotation:0,x:3,y:17},'spin pose');eq(ghost(g),17,'zero spin travel');};
  for(const timed of [false,true])for(const full of [false,true])for(const line of [false,true]){const g=make();pocket(g,full,line);if(timed)advance(g,500);else hard(g);s[`${timed?'timed':'hard'}-${full?'full':'mini'}-${line?'single':'zero'}`]=g.score;}
  {const g=make();for(const[x,y]of [[3,17],[5,17],[3,19]])put(g,x,y);place(g,'T',0,3,17);hard(g);s.nonRotation=g.score;}
  for(const timed of [false,true]){const g=make();for(let x=0;x<10;x++){if(x!==4)put(g,x,19);if(x<3||x>5)put(g,x,18);}put(g,3,17);place(g,'T',0,3,17);check(rotate(g,1)&&rotate(g,1),'real double rotations');if(timed)advance(g,500);else hard(g);eq(g.lines,2,'spin double');s[timed?'timedDouble':'hardDouble']=g.score;}
  for(const method of ['natural','hard','soft']){const g=make();for(const[x,y]of [[0,17],[0,19],[2,19]])put(g,x,y);place(g,'T',0,0,3);check(rotate(g,1),'downward rotation');if(method==='natural')advance(g,14000);if(method==='soft'){soft(g,true);for(let i=0;i<14;i++)step(g,50);soft(g,false);}const before=g.score;hard(g);s[method+'DownExtra']=g.score-before;}
  s.facings=[];for(let r=0;r<4;r++)for(const full of [false,true]){const g=make();const fronts=[[0,1],[1,3],[2,3],[0,2]][r],corners=[[3,15],[5,15],[3,17],[5,17]],missing=full?[0,1,2,3].find(i=>!fronts.includes(i)):fronts[0];for(let i=0;i<4;i++)if(i!==missing)put(g,...corners[i]);place(g,'T',(r+3)%4,3,15);check(rotate(g,1),'facing rotation');advance(g,500);s.facings.push(g.score);}
  {const g=make();clear(g);put(g,3,0);put(g,4,0);spawn(g,'T');const before=active(g),success=rotate(g,1);e.ceiling={before,success,after:active(g)};}
  if(mode==='max'){const g=make();clear(g);for(const[x,y]of [[5,0],[3,0],[6,1]])put(g,x,y);spawn(g,'I');incoming(g,'T');check(rotate(g,1),'ceiling I rotation');const kicked=active(g);advance(g,1000);const pose=active(g);eq(ghost(g),pose.y,'partial above-buffer grounded');const before=count(g);hard(g);e.aboveBufferPartial={kicked,pose,over:over(g),welded:count(g)-before};}
  s.deepKicks=[];for(const fifth of [false,true]){const g=make(),stack=fifth?[[4,15],[6,15],[6,17],[3,18],[6,18],[3,16]]:[[3,15],[3,17],[5,17],[3,18],[6,19]];for(const[x,y]of stack)put(g,x,y);place(g,'T',1,3,17);check(rotate(g,fifth?1:-1),'deep kick rotation');const pose=active(g);eq(pose,{type:'T',rotation:fifth?2:0,x:fifth?4:3,y:15},'actual deep kick');hard(g);s.deepKicks.push({fifth,pose,score:g.score});}
  // Real spawn/shift paths with incoming I independently free.
  e.hidden=[];for(const partial of [false,true]){const g=make();clear(g);put(g,partial?8:0,partial?1:0);if(!partial)put(g,5,0);spawn(g,'T');incoming(g,'I');const start=active(g);for(let i=0;i<(partial?4:3);i++)check(move(g,partial?1:-1),'hidden move');const pose=active(g),ys=cells(pose).map(p=>p[1]);check(partial?ys.some(y=>y<0)&&ys.some(y=>y>=0):ys.every(y=>y<0),'hidden extent');eq(ghost(g),pose.y,'grounded hidden');hard(g);e.hidden.push({partial,start,pose,over:over(g),cells:cells(pose).map(([x,y])=>[x,y,get(g,x,y)])});}
  {const g=make();place(g,'O',0,-1,18);incoming(g,'T');put(g,4,-2);hard(g);check(over(g),'blocked spawn');const snap=()=>JSON.stringify([active(g),count(g),g.score,g.hold,g.lines,g.level]),before=snap();move(g,-1);rotate(g,1);hard(g);hold(g);advance(g,1000);eq(snap(),before,'terminal guards');reset(g);eq([over(g),count(g),g.score,g.lines,g.level,g.hold,g.canHold],[false,0,0,0,1,null,true],'reset state');e.terminal='pass';}
  e.restart=[];for(const seed of [1,2,42]){const g=make(seed);let n=0;while(!over(g)&&n++<100)hard(g);check(over(g),'natural topout');reset(g);const opening=[];for(let i=0;i<7;i++){opening.push(active(g).type);clear(g);hard(g);}e.restart.push({seed,opening,types:new Set(opening).size});}
  {const g=make();place(g,'O',0,-1,12);put(g,0,14);for(let i=0;i<15;i++)rotate(g,1);const spent=g.lockResets;move(g,1);advance(g,1000);e.newLowest={spent,pose:active(g),resets:g.lockResets};advance(g,5000);move(g,1);e.newLowest.freshReset=g.lockResets;advance(g,499);eq(count(g),1,'new lowest full reset survival');step(g,1);eq(count(g),5,'new lowest lock');}
  {const g=make();place(g,'O',0,3,0);advance(g,800);g.update(1,true);e.rawSoftEntry={rows:active(g).y,points:g.score};}
  {const g=make();place(g,'S',1,-1,-2);put(g,2,-2);put(g,0,0);rotate(g,-1);e.ceilingWall=active(g);}
  // HD-SPIN-1: snapshots retain failures; only 28 points conforms.
  e.hardDropCredit={distance:14,score:e.scores.hardDownExtra,expected:28,conforms:e.scores.hardDownExtra===28};
  return e;
}

export function assertRecorded(e) {
  assert.deepEqual(e.hardDropCredit,{distance:14,score:28,expected:28,conforms:true});
  assert.equal(e.rotations.total,672);assert.equal(e.rotations.rejected,88);assert.equal(e.rotations.mismatches,0);
  assert.deepEqual(e.states,[]);assert.deepEqual(e.kicks,[]);assert.equal(e.bags,100);
  assert.equal(e.hold,'pass');assert.equal(e.compaction,'pass');assert.equal(e.ghosts.length,7);assert(e.ghosts.every(x=>x[1]===14));
  assert.deepEqual(e.landing,{at1489:0,at1490:0,lock:1506});
  assert.deepEqual(e.ledge,{land:6000,lock:6500,resets:0});assert.deepEqual(e.exhaustedLedge,{land:6000,lock:6500});
  assert.equal(e.newLowest.spent,15);assert.equal(e.newLowest.resets,0);assert.equal(e.newLowest.freshReset,1);
  assert.deepEqual(e.gravity.map(x=>x.actual),e.gravity.map(x=>x.expected));assert.deepEqual(e.refresh,[9,9]);
  assert.deepEqual(e.softEntry,{rows:1,points:1});assert.deepEqual(e.rawSoftEntry,{rows:16,points:16});assert.equal(e.softRelease,2);
  for(const k of ['blockedSoft','holdClock','terminal'])assert.equal(e[k],'pass');
  for(let n=1;n<=4;n++){assert.equal(e.scores['normal'+n],[0,100,300,500,800][n]);assert.equal(e.scores['pc'+n],[0,100,300,500,800][n]);}
  for(const timed of [false,true])for(const full of [false,true])for(const line of [false,true])assert.equal(e.scores[`${timed?'timed':'hard'}-${full?'full':'mini'}-${line?'single':'zero'}`],full?(line?800:400):(line?200:100));
  for(const [k,v]of Object.entries({nonRotation:0,hardDouble:1200,timedDouble:1200,b2b:2000,consecutive:2050,b2bBreak:2150,levelTwoCombo:300,b2bPc:2000,naturalDownExtra:0,hardDownExtra:28,softDownExtra:0}))assert.equal(e.scores[k],v,k);
  assert.deepEqual(e.scores.crossing,[100,10,2]);assert.deepEqual(e.scores.facings,[100,400,100,400,100,400,100,400]);assert.deepEqual(e.scores.deepKicks.map(x=>x.score),[100,400]);
  assert.deepEqual(e.ceiling.after,{type:'T',rotation:1,x:2,y:-3});assert.equal(e.ceiling.success,true);
  assert.deepEqual(e.ceilingWall,{type:'S',rotation:0,x:0,y:-4});assert.deepEqual(e.aboveBufferPartial,{kicked:{type:'I',rotation:1,x:4,y:-4},pose:{type:'I',rotation:1,x:4,y:-3},over:false,welded:3});
  assert.deepEqual(e.hidden.map(x=>x.over),[true,false]);assert(e.hidden[1].cells.every(x=>x[2]==='T'));
  assert.deepEqual(e.restart.map(x=>x.types),[7,7,7]);
}
export async function runAudit(root) {
  const load=file=>import(pathToFileURL(resolve(root,'dist/src/core',file)));
  const modules={game:await load('game.js'),pieces:await load('tetromino.js')};
  const e=runProbes(createAdapter(modules),{reference,normalKicks,iKicks});
  console.log(JSON.stringify(e,null,2));assertRecorded(e);console.log('max: GLM-5.3 engine outcomes asserted');return e;
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname))await runAudit(process.argv[2]);
