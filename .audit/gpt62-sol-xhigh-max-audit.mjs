// Independent xhigh/max audit. Reuses the earlier cohort's canonical fixtures and calibration.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {reference,normalKicks,iKicks} from './opus55-efforts-audit.mjs';
export {reference,normalKicks,iKicks};
export function createAdapter(m,mode){
 const W=m.game.WIDTH,H=m.game.HEIGHT,hidden=m.game.HIDDEN_ROWS;
 const types=['I','J','L','O','S','T','Z'];
 const make=(seed=42)=>new m.game.Game(()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32));
 const active=g=>g.active&&({type:g.active.kind,rotation:g.active.rotation,x:g.active.x,y:g.active.y});
 const local=(t,r)=>m.pieces.SHAPES[t][r],cells=p=>local(p.type,p.rotation).map(([x,y])=>[x+p.x,y+p.y]);
 const get=(g,x,y)=>g.board[y+hidden]?.[x]??null,put=(g,x,y,t='J')=>{g.board[y+hidden][x]=t;};
 const clear=g=>g.board.forEach(row=>row.fill(null)),count=g=>g.board.flat().filter(Boolean).length;
 const fits=(g,p)=>cells(p).every(([x,y])=>x>=0&&x<W&&y>=-hidden&&y<H&&!get(g,x,y));
 const place=(g,t,r,x,y)=>{g.active={kind:t,rotation:r,x,y};Object.assign(g,{fallTime:0,lockTime:0,lockMoves:0,touchedSurface:!fits(g,{...active(g),y:y+1}),lowestY:y});if(!fits(g,active(g)))throw Error('colliding fixture '+JSON.stringify(active(g)));};
 const move=(g,d)=>g.move(d),rotate=(g,d)=>g.rotate(d),hard=g=>g.hardDrop(),hold=g=>g.hold(),soft=g=>g.softDrop();
 const step=(g,ms)=>g.tick(ms),advance=(g,ms)=>{while(ms>1e-8){const dt=Math.min(16,ms);step(g,dt);ms-=dt;}};
 const ghost=g=>g.ghost()?.y;
 const capture=(g,from,to)=>{const seen=[],p=active(g);g.fits=q=>{if(q.rotation===to)seen.push([q.x-p.x,q.y-p.y]);return false;};rotate(g,(to-from+4)%4===1?1:-1);return seen;};
 const spawn=(g,t)=>g.spawn(t);
 return {mode,W,H,hidden,types,make,active,local,cells,get,put,clear,count,fits,place,move,rotate,hard,hold,soft,step,advance,ghost,capture,spawn,queue:g=>g.next,over:g=>g.gameOver,resets:g=>g.lockMoves};
}
export function runStandardProbes(a,oracle){
 const {reference,normalKicks,iKicks}=oracle,{mode,W,H,hidden,types,make,active,local,cells,get,put,clear,count,fits,place,move,rotate,hard,hold,soft,step,advance,ghost,capture,spawn,queue,over}=a;
 const e={mode,field:{actual:[W,H],expected:[10,20]},srs:{states:[],kicks:[],actualRotations:0,canonicalApplicable:true,statesChecked:28,kickListsChecked:48}},eq=(v,w,m)=>{if(JSON.stringify(v)!==JSON.stringify(w))throw Error(m+': '+JSON.stringify({v,w}));};
 // Both deliveries use named standard tetrominoes; exact canonical coordinates apply.
 const canonical=Object.keys(reference),key=cs=>cs.map(p=>p.join(',')).sort().join(' ');
 for(let i=0;i<7;i++)for(let r=0;r<4;r++){const got=local(types[i],r);if(key(got)!==key(reference[canonical[i]][r]))e.srs.states.push({type:types[i],ordinalReference:canonical[i],r,cells:got});}
 for(let i=0;i<7;i++){if(i===3)continue;for(const tr of Object.keys(normalKicks)){const[from,to]=tr.split('>').map(Number),g=make();place(g,types[i],from,4,8);const got=capture(g,from,to),want=(i===0?iKicks:normalKicks)[tr].map(([x,y])=>[x,-y||0]);if(JSON.stringify(got)!==JSON.stringify(want))e.srs.kicks.push({type:types[i],tr,got,want});}}
 let seed=5532;const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);e.srs.outcomeMismatches=0;e.srs.rotationExamples=[];
 for(const t of types)for(let r=0;r<4;r++)for(const d of [-1,1])for(let sample=0;sample<9;sample++){
  const cs=local(t,r),x=[-Math.min(...cs.map(p=>p[0])),3,W-1-Math.max(...cs.map(p=>p[0]))][sample%3],y=[-Math.min(...cs.map(p=>p[1])),8,H-1-Math.max(...cs.map(p=>p[1]))][Math.floor(sample/3)];
  const g=make();place(g,t,r,x,y);const occupied=new Set(cells(active(g)).map(c=>c.join(',')));
  for(let yy=Math.max(0,y-2);yy<=Math.min(H-1,y+4);yy++)for(let xx=0;xx<W;xx++)if(!occupied.has(`${xx},${yy}`)&&rng()<.25)put(g,xx,yy);
  const before=active(g),to=(r+d+4)%4;let want=null;
  {const offsets=t==='O'?[[0,0]]:(t==='I'?iKicks:normalKicks)[`${r}>${to}`].map(([x,y])=>[x,-y]);const hit=offsets.find(([dx,dy])=>fits(g,{...before,rotation:to,x:x+dx,y:y+dy}));want=hit?{...before,rotation:to,x:x+hit[0],y:y+hit[1]}:before;}
  rotate(g,d);if(!fits(g,active(g)))throw Error('rotation produced collision');e.srs.actualRotations++;if(want&&JSON.stringify(active(g))!==JSON.stringify(want))e.srs.outcomeMismatches++;if(e.srs.rotationExamples.length<4)e.srs.rotationExamples.push({before,dir:d,after:active(g),expected:want});
 }
 e.bags=0;for(let s=1;s<=10;s++){const g=make(s);for(let b=0;b<10;b++){const bag=[];for(let i=0;i<7;i++){bag.push(active(g).type);clear(g);hard(g);eq(over(g),false,'bag topout');}eq(bag.map(String).sort(),types.map(String).sort(),'bag');e.bags++;}}
 {const g=make(),first=active(g).type,next=queue(g)[0];rotate(g,1);hold(g);eq([g.held,active(g).type,g.canHold],[first,next,false],'hold');const p=active(g);hold(g);eq(active(g),p,'hold twice');clear(g);hard(g);hold(g);eq([active(g).type,active(g).rotation],[first,0],'hold restore');e.hold='pass';}
 e.ghosts=[];for(const t of types){const g=make();place(g,t,0,4,4);put(g,4,H-4);const p=active(g);let y=p.y;while(fits(g,{...p,y:y+1}))y++;eq(ghost(g),y,'ghost');hard(g);eq(g.score,2*(y-p.y),'drop points');eq(count(g),local(t,0).length+1,'weld count');for(const[x,yy]of cells({...p,y}))if(!get(g,x,yy))throw Error('missing weld');e.ghosts.push({type:t,y,welded:local(t,0).length});}
 {const g=make();place(g,types[0],0,4,4);soft(g);eq([active(g).y,g.score],[5,1],'soft points');e.soft='pass';}
 const groundedPose=g=>{const t=types[0];place(g,t,0,4,H-1-Math.max(...local(t,0).map(p=>p[1])));};
 const lockAfter=(g,limit=600)=>{let t=0;while(count(g)===0&&t<limit){step(g,1);t++;}return t;};
 {const g=make();groundedPose(g);e.groundedLock=lockAfter(g);}
 e.resetTests=[];for(const n of [1,8,14,15,16]){const g=make();groundedPose(g);advance(g,100);for(let i=0;i<n&&count(g)===0;i++)move(g,i%2?-1:1);e.resetTests.push({moves:n,immediate:count(g),remaining:lockAfter(g)});}
 {const g=make();groundedPose(g);const target=active(g).y;place(g,types[0],0,4,target-1);advance(g,990);step(g,16);let t=1006;while(count(g)===0&&t<1800){step(g,1);t++;}e.contactLock=t;}
 e.gravity=[];for(let level=1;level<=20;level++){const g=make();g.lines=(level-1)*10;place(g,types[0],0,4,4);let t=0;while(active(g).y===4&&t<2000){step(g,1);t++;}e.gravity.push({level,actual:t,expected:Math.ceil(Math.max(1,1000*Math.pow(.8-(level-1)*.007,level-1))-1e-8)});}
 {const g=make();g.lines=6;e.levelAtSix=g.level;g.lines=10;e.levelAtTen=g.level;}
 e.refresh=[];for(const hz of [60,144]){const g=make();g.lines=90;place(g,types[0],0,4,0);let t=0;while(t<600-1e-8){const dt=Math.min(1000/hz,600-t);step(g,dt);t+=dt;}e.refresh.push(active(g).y);}
 {const g=make();place(g,types[0],0,4,4);advance(g,800);hold(g);const start=active(g).y;advance(g,199);const before=active(g).y;step(g,1);e.holdClock={start,before,at200:active(g).y};}
 e.capClocks=[];for(const n of [8,15]){const g=make();groundedPose(g);for(let i=0;i<n&&count(g)===0;i++){advance(g,1);move(g,i%2?-1:1);}const immediate=count(g);advance(g,100);if(count(g)===0)move(g,1);e.capClocks.push({resets:n,immediate,remaining:lockAfter(g)});}
 
 // Actual native line/PC integration: fill the complement of a grounded pose.
 const clearWith=(g,n,pc)=>{clear(g);let found;
  found=[null,{t:'I',r:0,y:18},{t:'O',r:0,y:18},{t:'T',r:1,y:17},{t:'I',r:1,y:16}][n];if(!found)return false;place(g,found.t,found.r,4,found.y);const pose=active(g),occupied=new Set(cells(pose).map(c=>c.join(',')));
  for(let y=H-n;y<H;y++)for(let x=0;x<W;x++)if(!occupied.has(`${x},${y}`))put(g,x,y);
  if(!pc)put(g,0,5);hard(g);return true;};
 e.scores={normal:[],pc:[]};for(let n=1;n<=4;n++){for(const pc of [false,true]){const g=make();const supported=clearWith(g,n,pc);e.scores[pc?'pc':'normal'].push(supported?{lines:g.lines,score:g.score,cells:count(g)}:{unsupported:true});}}
 {const g=make();clearWith(g,1,false);const before=g.score;clearWith(g,1,false);e.scores.secondSingle=g.score-before;}
 {const g=make();if(clearWith(g,4,false)){clear(g);groundedPose(g);hard(g);clearWith(g,4,false);e.scores.b2b=g.score;}else e.scores.b2b='no four-row piece';}
 {const g=make();g.lines=9;clearWith(g,1,false);e.scores.crossing={score:g.score,lines:g.lines,level:g.level};}
 {const g=make();for(const y of [H-4,H-2])for(let x=0;x<W;x++)put(g,x,y);put(g,0,H-5);place(g,types[0],0,4,4);hard(g);eq(g.lines,2,'nonadjacent full rows');if(!get(g,0,H-3))throw Error('marker compaction');e.compaction='pass';}
 
 
 {
  {const g=make();clearWith(g,4,false);clearWith(g,4,false);e.scores.consecutive=g.score;}
  {const g=make();clearWith(g,4,false);clear(g);groundedPose(g);hard(g);clearWith(g,4,true);e.scores.b2bPc={actual:g.score,expected:5200};}
  {const g=make();g.lines=10;clearWith(g,1,false);const b=g.score;clearWith(g,1,false);e.scores.levelTwoCombo=g.score-b;}
  {const g=make();g.lines=9;clearWith(g,1,true);e.scores.pcCrossing={actual:g.score,expected:900,level:g.level};}
  {const g=make();clearWith(g,4,false);clearWith(g,1,false);clearWith(g,4,false);e.scores.b2bBroken=g.score;}
  {const g=make();place(g,'O',0,-1,18);advance(g,490);for(let i=0;i<5;i++){move(g,-1);step(g,2);}e.failedWallLock=count(g);}
 }
 // Real rotations establish all spin credit; fixture setup never assigns it.
 
 {
  const pocket=(g,full,line)=>{for(const[x,y]of [[5,17],[3,19],full?[3,17]:[5,19]])put(g,x,y);if(line)for(const x of [0,1,2,6,7,8,9])put(g,x,18);place(g,'T',3,3,17);eq(rotate(g,1),true,'spin rotation');eq(ghost(g),17,'zero distance');};
  e.spins={};for(const timed of [false,true])for(const full of [false,true])for(const line of [false,true]){const g=make();pocket(g,full,line);if(timed)advance(g,500);else hard(g);e.spins[`${timed?'timed':'hard'}-${full?'full':'mini'}-${line?'single':'zero'}`]=g.score;}
  for(const method of ['hard','soft']){const g=make();for(const[x,y]of [[0,17],[0,19],[2,19]])put(g,x,y);place(g,'T',0,0,3);eq(rotate(g,1),true,'travel rotation');eq(ghost(g),17,'fourteen rows');if(method==='soft')for(let i=0;i<14;i++)soft(g);const before=g.score;hard(g);e.spins[method+'Travel']={actual:g.score-before,expected:method==='hard'?28:0};}
  {const g=make();pocket(g,true,false);soft(g);move(g,-1);hard(g);e.spins.failedActions=g.score;}
  {const g=make();for(const[x,y]of [[3,18],[5,18],[4,19]])put(g,x,y);place(g,'T',1,3,16);rotate(g,1);advance(g,500);e.spins.twoCorners=g.score;}
  for(const fifth of [false,true]){const g=make();for(const[x,y]of fifth?[[4,15],[6,15],[6,17],[3,18],[6,18],[3,16]]:[[3,15],[3,17],[5,17],[3,18],[6,19]])put(g,x,y);place(g,'T',1,3,17);rotate(g,fifth?1:-1);const pose=active(g);hard(g);e.spins[fifth?'fifthKick':'fourthKick']={pose,score:g.score};}
  {const g=make();for(let x=0;x<10;x++){if(x!==4)put(g,x,19);if(x<3||x>5)put(g,x,18);}put(g,3,17);place(g,'T',0,3,17);rotate(g,1);rotate(g,1);hard(g);e.spins.double={score:g.score,lines:g.lines};}
  {const g=make();for(const[x,y]of [[3,17],[5,17],[3,19]])put(g,x,y);place(g,'T',0,3,17);hard(g);e.spins.noRotation=g.score;}
  e.spins.facings=[];for(let r=0;r<4;r++)for(const full of [false,true]){const g=make(),fronts=[[0,1],[1,3],[2,3],[0,2]][r],corners=[[3,15],[5,15],[3,17],[5,17]],missing=full?[0,1,2,3].find(i=>!fronts.includes(i)):fronts[0];for(let i=0;i<4;i++)if(i!==missing)put(g,...corners[i]);place(g,'T',(r+3)%4,3,15);rotate(g,1);advance(g,500);e.spins.facings.push(g.score);}
  e.ledges=[];for(const exhausted of [false,true]){const g=make();place(g,'O',0,-1,12);put(g,0,14);if(exhausted)for(let i=0;i<14;i++)move(g,i%2?-1:1);advance(g,490);move(g,1);advance(g,20);const airborne=count(g);let t=20,land=null;while(count(g)===1&&t<8000){step(g,1);t++;if(land===null&&active(g).y===18)land=t;}e.ledges.push({exhausted,airborne,land,lock:t});}
  {const g=make();place(g,'O',0,-1,12);put(g,0,14);put(g,1,14);g.touchedSurface=true;
   for(let i=0;i<13;i++)move(g,i%2?-1:1);advance(g,490);move(g,1);move(g,1);
   let t=0;while(active(g).y<18&&t<8000){step(g,1);t++;}
   const spent=a.resets(g);advance(g,400);move(g,1);advance(g,100);
   e.newLowest={resets:spent,cells:count(g),expectedCells:2,land:t};}
  e.hidden=[];for(const partial of [false,true]){const g=make();put(g,0,partial?1:0);place(g,'O',0,-1,partial?-1:-2);queue(g)[0]='I';hard(g);e.hidden.push({partial,over:over(g),cells:count(g)});}
 }
 {const g=make();for(let y=-hidden;y<Math.min(3,H);y++)for(let x=0;x<W;x++)put(g,x,y);spawn(g,types[0]);eq(over(g),true,'blocked spawn');const snapshot=()=>JSON.stringify([active(g),g.board,g.score,g.held,g.lines]),before=snapshot();move(g,1);rotate(g,1);hold(g);soft(g);hard(g);advance(g,1000);eq(snapshot(),before,'terminal guards');e.terminal='pass';}
 e.restart=[];for(const seed of [1,2,42]){let g=make(seed),n=0;while(!over(g)&&n++<100)hard(g);eq(over(g),true,'natural gameover');g=make(seed);eq([over(g),count(g),g.score,g.lines,g.level,g.held,g.canHold],[false,0,0,0,1,null,true],'fresh reset state');const bag=[];for(let i=0;i<7;i++){bag.push(active(g).type);clear(g);hard(g);}e.restart.push(new Set(bag).size);}
 return e;
}
export function createCustomAdapter(m,mode){
 const W=m.game.WIDTH,H=m.game.HEIGHT,hidden=0,types=Object.keys(m.game.PIECES);
 const make=(seed=42)=>{const g=new m.game.Game(()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32));g.start();return g;};
 const active=g=>g.active&&({type:g.active.kind,rotation:g.active.rotation,x:g.active.x,y:g.active.y});
 const local=(t,r)=>m.game.cellsFor(t,r),cells=p=>local(p.type,p.rotation).map(([x,y])=>[x+p.x,y+p.y]);
 const get=(g,x,y)=>g.board[y]?.[x]??null,put=(g,x,y,t='box')=>{g.board[y][x]=t;};
 const clear=g=>g.board.forEach(row=>row.fill(null)),count=g=>g.board.flat().filter(Boolean).length;
 const fits=(g,p)=>cells(p).every(([x,y])=>x>=0&&x<W&&y>=0&&y<H&&!get(g,x,y));
 const place=(g,t,r,x,y)=>{g.active={kind:t,rotation:r,x,y};Object.assign(g,{gravityElapsed:0,lockElapsed:0,lockResets:0});if(!fits(g,active(g)))throw Error('colliding fixture '+JSON.stringify(active(g)));};
 const move=(g,d)=>g.act(d<0?'left':'right'),rotate=(g,d)=>g.act(d<0?'counterclockwise':'clockwise'),hard=g=>g.act('hard-drop'),hold=g=>g.act('hold'),soft=g=>g.act('soft-drop');
 const step=(g,ms)=>g.advance(ms),advance=(g,ms)=>{while(ms>1e-8){const dt=Math.min(16,ms);step(g,dt);ms-=dt;}};
 const ghost=g=>g.ghost?.y;
 const capture=(g,from,to)=>{const seen=[],p=active(g);g.fits=q=>{if(q.rotation===to)seen.push([q.x-p.x,q.y-p.y]);return false;};rotate(g,(to-from+4)%4===1?1:-1);return seen;};
 const spawn=(g,t)=>g.spawn(t);
 return {mode,W,H,hidden,types,make,active,local,cells,get,put,clear,count,fits,place,move,rotate,hard,hold,soft,step,advance,ghost,capture,spawn,queue:g=>g.queue,over:g=>g.status==='game-over'};
}
export function runProbes(a,oracle){return a.mode==='max'?runCustomProbes(a,oracle):runStandardProbes(a,oracle);}
export function runCustomProbes(a,oracle){
 const {reference,normalKicks,iKicks}=oracle,{mode,W,H,hidden,types,make,active,local,cells,get,put,clear,count,fits,place,move,rotate,hard,hold,soft,step,advance,ghost,capture,spawn,queue,over}=a;
 const e={mode,field:{actual:[W,H],expected:[10,20]},srs:{states:[],kicks:[],actualRotations:0,canonicalApplicable:false,statesChecked:28,kickListsChecked:48,note:'Ordinal states are diagnostics only; bar/box/ridge/step are native I/O/T/S; elbow has 3 and cross/pocket have 5 cells. No canonical oracle for these three pieces.'}},eq=(v,w,m)=>{if(JSON.stringify(v)!==JSON.stringify(w))throw Error(m+': '+JSON.stringify({v,w}));};
 // Custom pieces have no SRS identity. Ordinal comparison is diagnostic, not a mapping claim.
 const canonical=Object.keys(reference),key=cs=>cs.map(p=>p.join(',')).sort().join(' ');
 for(let i=0;i<7;i++)for(let r=0;r<4;r++){const got=local(types[i],r);if(key(got)!==key(reference[canonical[i]][r]))e.srs.states.push({type:types[i],ordinalReference:canonical[i],r,cells:got});}
 for(let i=0;i<7;i++){if(types[i]==='box')continue;for(const tr of Object.keys(normalKicks)){const[from,to]=tr.split('>').map(Number),g=make();place(g,types[i],from,4,8);const got=capture(g,from,to),want=(i===0?iKicks:normalKicks)[tr].map(([x,y])=>[x,-y||0]);if(JSON.stringify(got)!==JSON.stringify(want))e.srs.kicks.push({type:types[i],tr,got,want});}}
 let seed=5532;const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);e.srs.outcomeMismatches=null;e.srs.rotationExamples=[];
 for(const t of types)for(let r=0;r<4;r++)for(const d of [-1,1])for(let sample=0;sample<9;sample++){
  const cs=local(t,r),x=[-Math.min(...cs.map(p=>p[0])),3,W-1-Math.max(...cs.map(p=>p[0]))][sample%3],y=[-Math.min(...cs.map(p=>p[1])),8,H-1-Math.max(...cs.map(p=>p[1]))][Math.floor(sample/3)];
  const g=make();place(g,t,r,x,y);const occupied=new Set(cells(active(g)).map(c=>c.join(',')));
  for(let yy=Math.max(0,y-2);yy<=Math.min(H-1,y+4);yy++)for(let xx=0;xx<W;xx++)if(!occupied.has(`${xx},${yy}`)&&rng()<.25)put(g,xx,yy);
  const before=active(g),to=(r+d+4)%4;let want=null;
  
  rotate(g,d);if(!fits(g,active(g)))throw Error('rotation produced collision');e.srs.actualRotations++;if(want&&JSON.stringify(active(g))!==JSON.stringify(want))e.srs.outcomeMismatches++;if(e.srs.rotationExamples.length<4)e.srs.rotationExamples.push({before,dir:d,after:active(g),expected:want});
 }
 e.bags=0;for(let s=1;s<=10;s++){const g=make(s);for(let b=0;b<10;b++){const bag=[];for(let i=0;i<7;i++){bag.push(active(g).type);clear(g);hard(g);eq(over(g),false,'bag topout');}eq(bag.map(String).sort(),types.map(String).sort(),'bag');e.bags++;}}
 {const g=make(),first=active(g).type,next=queue(g)[0];rotate(g,1);hold(g);eq([g.held,active(g).type,g.canHold],[first,next,false],'hold');const p=active(g);hold(g);eq(active(g),p,'hold twice');clear(g);hard(g);hold(g);eq([active(g).type,active(g).rotation],[first,0],'hold restore');e.hold='pass';}
 e.ghosts=[];for(const t of types){const g=make();place(g,t,0,4,4);put(g,4,H-4);const p=active(g);let y=p.y;while(fits(g,{...p,y:y+1}))y++;eq(ghost(g),y,'ghost');hard(g);eq(g.score,2*(y-p.y),'drop points');eq(count(g),local(t,0).length+1,'weld count');for(const[x,yy]of cells({...p,y}))if(!get(g,x,yy))throw Error('missing weld');e.ghosts.push({type:t,y,welded:local(t,0).length});}
 {const g=make();place(g,types[0],0,4,4);soft(g);eq([active(g).y,g.score],[5,1],'soft points');e.soft='pass';}
 const groundedPose=g=>{const t=types[0];place(g,t,0,4,H-1-Math.max(...local(t,0).map(p=>p[1])));};
 const lockAfter=(g,limit=600)=>{let t=0;while(count(g)===0&&t<limit){step(g,1);t++;}return t;};
 {const g=make();groundedPose(g);e.groundedLock=lockAfter(g);}
 e.resetTests=[];for(const n of [1,9,10,14,15,16]){const g=make();groundedPose(g);advance(g,100);for(let i=0;i<n&&count(g)===0;i++)move(g,i%2?-1:1);e.resetTests.push({moves:n,immediate:count(g),remaining:lockAfter(g)});}
 {const g=make();groundedPose(g);const target=active(g).y;place(g,types[0],0,4,target-1);advance(g,990);step(g,16);let t=1006;while(count(g)===0&&t<1800){step(g,1);t++;}e.contactLock=t;}
 e.gravity=[];for(let level=1;level<=20;level++){const g=make();g.lines=(level-1)*8;place(g,types[0],0,4,4);let t=0;while(active(g).y===4&&t<2000){step(g,1);t++;}e.gravity.push({level,actual:t,expected:Math.ceil(Math.max(1,1000*Math.pow(.8-(level-1)*.007,level-1))-1e-8)});}
 {const g=make();g.lines=6;e.levelAtSix=g.level;g.lines=8;e.levelAtEight=g.level;g.lines=10;e.levelAtTen=g.level;}
 e.refresh=[];for(const hz of [60,144]){const g=make();g.lines=72;place(g,types[0],0,4,0);let t=0;while(t<600-1e-8){const dt=Math.min(1000/hz,600-t);step(g,dt);t+=dt;}e.refresh.push(active(g).y);}
 {const g=make();place(g,types[0],0,4,4);advance(g,800);hold(g);const start=active(g).y;advance(g,199);const before=active(g).y;step(g,1);e.holdClock={start,before,at200:active(g).y};}
 e.capClocks=[];for(const n of [10,15]){const g=make();groundedPose(g);for(let i=0;i<n&&count(g)===0;i++){advance(g,1);move(g,i%2?-1:1);}const immediate=count(g);advance(g,100);if(count(g)===0)move(g,1);e.capClocks.push({resets:n,immediate,remaining:lockAfter(g)});}
 {
  e.ledges=[];for(const spent of [false,true]){const g=make(),t=types[0],x=0,y=12;place(g,t,0,x,y);put(g,0,14);put(g,1,14);if(spent)for(let i=0;i<10;i++)move(g,i%2?-1:1);eq(fits(g,active(g)),true,'legal ledge pose');advance(g,440);move(g,1);move(g,1);advance(g,20);let elapsed=20,land=null;const initial=count(g);while(count(g)===2&&elapsed<12000){step(g,1);elapsed++;if(land===null&&ghost(g)===active(g).y)land=elapsed;}e.ledges.push({spent,initial,land,lock:elapsed,cells:count(g)});}
 }
 // Actual native line/PC integration: fill the complement of a grounded pose.
 const clearWith=(g,n,pc)=>{clear(g);let found;
  found=[null,{t:'bar',r:0,y:16},{t:'box',r:0,y:16},{t:'ridge',r:1,y:15},{t:'bar',r:1,y:14}][n];
  if(!found)return false;place(g,found.t,found.r,4,found.y);const pose=active(g),occupied=new Set(cells(pose).map(c=>c.join(',')));
  for(let y=H-n;y<H;y++)for(let x=0;x<W;x++)if(!occupied.has(`${x},${y}`))put(g,x,y);
  if(!pc)put(g,0,5);hard(g);return true;};
 e.scores={normal:[],pc:[]};for(let n=1;n<=4;n++){for(const pc of [false,true]){const g=make();const supported=clearWith(g,n,pc);e.scores[pc?'pc':'normal'].push(supported?{lines:g.lines,score:g.score,cells:count(g)}:{unsupported:true});}}
 {const g=make();clearWith(g,1,false);const before=g.score;clearWith(g,1,false);e.scores.secondSingle=g.score-before;}
 {const g=make();clearWith(g,4,false);const first=g.score;clear(g);groundedPose(g);hard(g);const before=g.score;clearWith(g,4,false);e.scores.b2bDetail={first,second:g.score-before,expectedFirst:800,expectedSecond:1200};}
 {const g=make();g.lines=10;clearWith(g,1,false);const before=g.score;clearWith(g,1,false);e.scores.levelTwoCombo={actual:g.score-before,expected:300};}
 {const g=make();if(clearWith(g,4,false)){clear(g);groundedPose(g);hard(g);clearWith(g,4,false);e.scores.b2b=g.score;}else e.scores.b2b='no four-row piece';}
 {const g=make();g.lines=7;clearWith(g,1,false);e.scores.crossing={score:g.score,lines:g.lines,level:g.level};}
 {const g=make();for(const y of [H-4,H-2])for(let x=0;x<W;x++)put(g,x,y);put(g,0,H-5);place(g,types[0],0,4,4);hard(g);eq(g.lines,2,'nonadjacent full rows');if(!get(g,0,H-3))throw Error('marker compaction');e.compaction='pass';}
 {
  const g=make();place(g,'bar',0,0,12);put(g,0,14);put(g,1,14);eq(fits(g,active(g)),true,'legal lower-row pose');
  for(let i=0;i<10;i++)move(g,i%2?-1:1);move(g,1);move(g,1);let t=0;while(active(g).y<16&&t<8000){step(g,1);t++;}
  const spent=g.lockResets;advance(g,400);move(g,1);advance(g,100);e.newLowest={spent,cells:count(g),expectedCells:2,land:t};
 }
 
 
 // No virtual T/I/O is substituted into custom-polyomino games.
 e.spins={available:false,reason:'Canonical 10x20 fixtures cannot be expressed in the 9x18 field. Native ridge T analogues are tested separately; no spin recognition implementation.'};
 
 {const g=make();for(let y=-hidden;y<Math.min(3,H);y++)for(let x=0;x<W;x++)put(g,x,y);spawn(g,types[0]);eq(over(g),true,'blocked spawn');const snapshot=()=>JSON.stringify([active(g),g.board,g.score,g.held,g.lines]),before=snapshot();move(g,1);rotate(g,1);hold(g);soft(g);hard(g);advance(g,1000);eq(snapshot(),before,'terminal guards');e.terminal='pass';}
 e.nativeSpins={};for(const kind of ['travel','mini','full']){const g=make();
  if(kind==='travel'){for(const[x,y]of [[0,15],[0,17],[2,17]])put(g,x,y);place(g,'ridge',0,0,3);}else{for(const[x,y]of [[5,15],[3,17],kind==='full'?[3,15]:[5,17]])put(g,x,y);place(g,'ridge',3,3,15);}
  eq(rotate(g,1),true,'native spin rotation');const pose=active(g),distance=ghost(g)-pose.y;eq(distance,kind==='travel'?12:0,'native spin distance');hard(g);e.nativeSpins[kind]={pose,distance,actual:g.score,expected:kind==='travel'?24:kind==='mini'?100:400};}
 e.nativeTimedSpins={};for(const full of [false,true]){const g=make();for(const[x,y]of [[5,15],[3,17],full?[3,15]:[5,17]])put(g,x,y);place(g,'ridge',3,3,15);rotate(g,1);advance(g,500);e.nativeTimedSpins[full?'full':'mini']=g.score;}
 e.nativeBoundaries=[];for(const y of [-2,-1,0]){const g=make(),p={type:'box',rotation:0,x:0,y};e.nativeBoundaries.push({y,legal:fits(g,p)});}
 e.restart=[];for(const seed of [1,2,42]){let g=make(seed),n=0;while(!over(g)&&n++<100)hard(g);eq(over(g),true,'natural gameover');g.reset();g.start();eq([over(g),count(g),g.score,g.lines,g.level,g.held,g.canHold],[false,0,0,0,1,null,true],'fresh reset state');const bag=[];for(let i=0;i<7;i++){bag.push(active(g).type);clear(g);hard(g);}e.restart.push(new Set(bag).size);}
 return e;
}
export function assertRecorded(e){const saved=JSON.parse(readFileSync(new URL('./gpt62-sol-xhigh-max-evidence.json',import.meta.url)));assert.deepEqual(JSON.parse(JSON.stringify(e)),saved.runs[e.mode].engine,'Pinned outcomes include defects, not conformance');}
export async function loadModules(root,mode){const load=f=>import(pathToFileURL(resolve(root,'dist',f)));return{game:await load('game.js'),pieces:mode==='max'?null:await load('pieces.js')};}
if(process.argv[1]&&resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname)){const e=runProbes((process.argv[3]==='max'?createCustomAdapter:createAdapter)(await loadModules(process.argv[2],process.argv[3]),process.argv[3]),{reference,normalKicks,iKicks});if(!process.argv.includes('--record'))assertRecorded(e);console.log(JSON.stringify(e));}
