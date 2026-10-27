// Reproducible Qwen3.8 Max xhigh audit; only disposable emitted builds.
// Equivalent fixtures derived from the unchanged newest Flash audit.
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {reference,normalKicks,iKicks} from './opus55-efforts-audit.mjs';
export {reference,normalKicks,iKicks};

// Serialized into Chromium. All actions call this run's unchanged engine.
export function createAdapter(modules) {
  const {Game}=modules.game,pieces=modules.pieces;
  const seeded=seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
  const make=(seed=42)=>{const g=new Game(seeded(seed));g.start();return g;};
  const active=g=>{const p=g.current;return p&&{type:p.kind,rotation:p.rotation,x:p.x,y:p.y-2};};
  const setActive=(g,p)=>g.current={kind:p.type,rotation:p.rotation,x:p.x,y:p.y+2};
  const local=(t,r)=>pieces.PIECE_CELLS[t][r].map(c=>[c.x,c.y]);
  const cells=p=>local(p.type,p.rotation).map(([x,y])=>[p.x+x,p.y+y]);
  const get=(g,x,y)=>g.board.get(x,y+2);
  const put=(g,x,y,t='J')=>{if(y<-2)throw Error('Stack outside stored buffer');g.board.set(x,y+2,t);};
  const clear=g=>g.board.clear();
  const count=g=>{let n=0;for(let y=-2;y<20;y++)for(let x=0;x<10;x++)if(get(g,x,y))n++;return n;};
  const fits=(g,p)=>cells(p).every(([x,y])=>x>=0&&x<10&&y<20&&!get(g,x,y));
  const over=g=>g.status==='gameover';
  const move=(g,d)=>{const before=active(g);if(d<0)g.moveLeft();else g.moveRight();return JSON.stringify(before)!==JSON.stringify(active(g));};
  const rotate=(g,d)=>{const before=active(g);if(d===1)g.rotateClockwise();else g.rotateCounterClockwise();return JSON.stringify(before)!==JSON.stringify(active(g));};
  const hard=g=>g.hardDrop(),hold=g=>g.holdPiece(),held=g=>g.held,canHold=g=>g.canHold,queue=g=>g.queue;
  const soft=(g,on)=>g.softDropping=on;
  const step=(g,ms)=>g.update(ms);
  const advance=(g,ms)=>{while(ms>1e-8){const dt=Math.min(ms,16);step(g,dt);ms-=dt;}};
  const place=(g,t,r,x,y)=>{setActive(g,{type:t,rotation:r,x,y});Object.assign(g,{gravityTimer:0,lockTimer:0,lockResets:0});if(!fits(g,active(g)))throw Error('Colliding fixture '+JSON.stringify(active(g)));};
  const ghost=g=>g.ghostY()-2,spawn=(g,t)=>g.spawn(t),incoming=(g,t)=>g.queue[0]=t;
  const restart=g=>{g.restart();return g;};
  const capture=(g,from,to)=>{const seen=[],p={...g.current};g.board.collides=(cs,x,y)=>{seen.push([x-p.x,y-p.y]);return true;};rotate(g,(to-from+4)%4===1?1:-1);return seen;};
  return {mode:'max-xhigh',make,active,setActive,local,cells,get,put,clear,count,fits,over,move,rotate,hard,hold,held,canHold,queue,soft,step,advance,place,ghost,spawn,incoming,restart,capture,colors:pieces.COLORS,gravity:modules.game.gravityMsPerRow};
}

export function runProbes(a, oracle) {
  const {reference,normalKicks,iKicks}=oracle;
  const {mode,make,active,get,put,clear,count,local,cells,fits,over,move,rotate,hard,hold,held,canHold,queue,soft,step,advance,place,ghost,spawn,incoming,restart,capture}=a;
  const evidence={mode};
  const check=(ok,msg)=>{if(!ok)throw Error(msg);};
  const eq=(actual,expected,msg)=>check(JSON.stringify(actual)===JSON.stringify(expected),msg+': '+JSON.stringify({actual,expected}));
  const record=(name,v)=>evidence[name]=JSON.parse(JSON.stringify(v));
  const key=points=>points.map(p=>p.join(',')).sort().join(' ');
  const types=Object.keys(reference);
  eq(new Set(Object.values(a.colors)).size,7,'distinct colors');
  for(const t of types)for(let r=0;r<4;r++)eq(key(local(t,r).map(([x,y])=>[x+(t==='O'?1:0),y])),key(reference[t][r]),'canonical '+t+r);
  const kickMismatches=[];let transitions=0;
  for(const t of types.filter(t=>t!=='O'))for(const tr of Object.keys(normalKicks)){
    const [from,to]=tr.split('>').map(Number),g=make();place(g,t,from,3,8);
    const actual=capture(g,from,to),expected=(t==='I'?iKicks:normalKicks)[tr].map(([x,y])=>[x,-y||0]); if(JSON.stringify(actual)!==JSON.stringify(expected))kickMismatches.push({type:t,transition:tr,actual,expected});transitions++;
  }
  record('srs',{states:28,orderedTransitions:transitions,kickMismatches});
  const kicks={};
  for(const t of ['T','I'])for(const side of [-1,1]){
    const g=make(),r=side===-1?1:3,x=side===-1?-Math.min(...local(t,r).map(p=>p[0])):9-Math.max(...local(t,r).map(p=>p[0]));
    place(g,t,r,x,8);check(rotate(g,side===-1?-1:1),'wall rotate');kicks[t+'Wall'+side]=active(g);check(fits(g,active(g)),'wall fit');
  }
  for(const t of ['T','I']){const g=make();place(g,t,0,3,18);check(rotate(g,1),'floor rotate');kicks[t+'Floor']=active(g);}
  for(const [name,r,y]of [['IFloorCCW',0,18],['I2FloorCCW',2,17]]){const g=make();place(g,'I',r,3,y);const success=rotate(g,-1);kicks[name]={success,pose:active(g)};}
  record('concreteKicks',kicks);
  for(const t of types){const g=make();place(g,t,0,3,8);for(const d of [-1,1]){for(let i=0;i<20;i++)move(g,d);const xs=cells(active(g)).map(p=>p[0]);eq(d<0?Math.min(...xs):Math.max(...xs),d<0?0:9,'wall bounds');}}
  for(let seed=1;seed<=10;seed++){const g=make(seed);for(let b=0;b<10;b++){const bag=[];for(let i=0;i<7;i++){bag.push(active(g).type);clear(g);hard(g);check(!over(g),'bag play');}eq(bag.sort(),[...types].sort(),'engine bag');}}
  record('bags',100);
  {const g=make(),first=active(g).type,next=queue(g)[0];rotate(g,1);hold(g);eq(active(g).type,next,'hold consumes queue');eq(held(g),first,'stores first');check(!canHold(g),'hold restricted');const p=active(g);hold(g);eq(active(g),p,'repeated hold inert');clear(g);hard(g);check(canHold(g),'hold after lock');hold(g);eq(active(g).type,first,'retrieval');eq(active(g).rotation,0,'held orientation');record('hold','pass');}
  const ghosts=[];
  for(const t of types){const g=make();place(g,t,0,3,0);put(g,4,16);const p=active(g),y=ghost(g);check(fits(g,{...p,y})&&!fits(g,{...p,y:y+1}),'independent ghost '+t);hard(g);eq(g.score,2*(y-p.y),'hard points');for(const[x,yy]of cells({...p,y}))check(get(g,x,yy),'welded cell');eq(count(g),5,'four welded cells');ghosts.push({type:t,y});}
  record('ghosts',ghosts);
  {const g=make();place(g,'O',0,3,18);advance(g,499);eq(count(g),0,'499 unlocked');step(g,1);eq(count(g),4,'500 locked');
   const r=make();place(r,'O',0,3,18);advance(r,490);move(r,1);advance(r,20);eq(count(r),0,'successful reset');
   const c=make();place(c,'O',0,3,18);for(let i=0;i<15;i++){advance(c,10);move(c,i%2?-1:1);}const before=count(c);step(c,1);const at151=count(c);move(c,-1);record('cap',{before,at151,after16th:count(c)});
   const f=make();place(f,'O',0,0,18);advance(f,490);for(let i=0;i<5;i++){check(!move(f,-1),'failed wall');advance(f,2);}eq(count(f),4,'failed actions do not reset');
   const l=make();place(l,'O',0,0,12);put(l,0,14);advance(l,490);move(l,1);advance(l,20);eq(count(l),1,'no midair lock');check(fits(l,{...active(l),y:active(l).y+1}),'ledge airborne');for(let i=0;i<600&&!get(l,1,19);i++)step(l,16);check(get(l,1,19),'eventual floor lock');
   const s=make();place(s,'O',0,3,18);soft(s,true);step(s,1);record('blockedSoft',count(s));
   const n=make();place(n,'O',0,3,17);let landing=0;while(active(n).y===17&&landing<2000){step(n,1);landing++;}let delay=0;while(!count(n)&&delay<2000){step(n,1);delay++;}record('naturalContact',{landing,delay});}
  // Ordinary frame-size steps, also repeated through the real browser RAF.
  {const g=make();place(g,'O',0,3,17);advance(g,990);step(g,16);advance(g,483);const at1489=count(g);step(g,1);record('landingFrame',{at1489,at1490:count(g)});}
  // Previous-contact clock is discarded after descent.
  {const g=make();place(g,'O',0,0,12);put(g,0,14);advance(g,490);move(g,1);advance(g,1000);const p=active(g),atNextContact=count(g);advance(g,490);record('secondContact',{pose:p,atNextContact,after490:count(g)});}
  {
    const g=make();place(g,'O',0,0,12);put(g,0,14);
    for(let i=0;i<15;i++){advance(g,1);rotate(g,1);}
    advance(g,490);move(g,1);
    let elapsed=0,landedAt=null;while(!get(g,1,19)&&elapsed<8000){step(g,1);elapsed++;if(landedAt===null&&active(g)?.y===18)landedAt=elapsed;}
    record('exhaustedLedge',{landedAt,lockedAt:elapsed,locked:!!get(g,1,19)});
  }
  const well=(g,n,pc=false)=>{clear(g);for(let y=20-n;y<20;y++)for(let x=0;x<10;x++)if(x!==4)put(g,x,y);if(!pc)put(g,0,10);place(g,'I',1,2,16);};
  const pcSingle=g=>{clear(g);for(let x=0;x<10;x++)if(x<3||x>6)put(g,x,19);place(g,'I',0,3,18);};
  const filler=g=>{clear(g);place(g,'O',0,7,18);hard(g);};
  const scores={};
  for(const n of [1,2,3,4]){const g=make();well(g,n);hard(g);eq(g.lines,n,'normal lines');scores['normal'+n]=g.score;}
  {const g=make();pcSingle(g);hard(g);eq(count(g),0,'empty PC');scores.singlePc=g.score;}
  {const g=make();well(g,4);hard(g);filler(g);well(g,4);hard(g);scores.b2b=g.score;well(g,1);hard(g);scores.b2bBreak=g.score;}
  {const g=make();g.lines=10;g.level=2;well(g,1);hard(g);const before=g.score;well(g,1);hard(g);scores.levelTwoCombo=g.score-before;}
  {const g=make();g.lines=9;well(g,1);hard(g);scores.levelCrossing={score:g.score,lines:g.lines,level:g.level};}
  {const g=make();well(g,4);hard(g);filler(g);well(g,4,true);hard(g);scores.b2bTetrisPc=g.score;}
  {const g=make();well(g,4);hard(g);filler(g);pcSingle(g);hard(g);scores.singlePcAfterB2B=g.score;}
  {const g=make();well(g,4);hard(g);well(g,4);hard(g);scores.consecutiveTetrises=g.score;}
  function pocket(g,full,line){clear(g);put(g,5,17);put(g,3,19);put(g,full?3:5,full?17:19);if(line)for(const x of [0,1,2,6,7,8,9])put(g,x,18);place(g,'T',3,3,17);check(rotate(g,1),'legal final spin rotation');eq(active(g),{type:'T',rotation:0,x:3,y:17},'spin pose');eq(ghost(g),17,'zero spin drop');}
  for(const timed of [false,true])for(const full of [false,true])for(const line of [false,true]){const g=make();pocket(g,full,line);if(timed)advance(g,500);else hard(g);scores[`${timed?'timed':'hard'}-${full?'full':'mini'}-${line?'single':'zero'}`]=g.score;}
  {const g=make();for(const[x,y]of [[3,17],[5,17],[3,19]])put(g,x,y);place(g,'T',0,3,17);hard(g);scores.nonRotation=g.score;}
  {const g=make();well(g,4);hard(g);filler(g);pocket(g,false,true);hard(g);scores.miniAfterB2B=g.score;}
  for(const timed of [false,true]){const g=make();for(let x=0;x<10;x++){if(x!==4)put(g,x,19);if(x<3||x>5)put(g,x,18);}put(g,3,17);place(g,'T',0,3,17);check(rotate(g,1)&&rotate(g,1),'double rotations');if(timed)advance(g,500);else hard(g);scores[timed?'timedDouble':'hardDouble']=g.score;eq(g.lines,2,'double lines');}
  {const g=make();for(const[x,y]of [[0,17],[0,19],[2,19]])put(g,x,y);place(g,'T',0,0,3);rotate(g,1);soft(g,true);let n=0;while(ghost(g)>active(g).y&&n++<1000)step(g,50);soft(g,false);const before=g.score;hard(g);scores.manualSoftExtra=g.score-before;}
  record('scores',scores);
  const gravity=[];
  for(const level of [1,2,5,9,10,14,15,20]){const g=make();g.level=level;g.lines=(level-1)*10;place(g,'O',0,3,0);let elapsed=0;while(active(g).y===0&&elapsed<2000){step(g,1);elapsed++;}gravity.push({level,elapsed,score:g.score});}
  record('gravity',gravity);
  {const g=make();place(g,'O',0,3,0);advance(g,800);soft(g,true);step(g,1);record('normalToSoft',{rows:active(g).y,points:g.score});}
  const refresh={};for(const [level,duration]of [[2,1480.001],[10,600],[15,100]]){const out=[];for(const hz of [60,144]){const g=make();g.level=level;place(g,'O',0,3,0);let t=0;while(t<duration-1e-8){const dt=Math.min(1000/hz,duration-t);step(g,dt);t+=dt;}out.push(active(g).y);}refresh[level+':'+duration]=out;}
  record('refresh',refresh);
  {const g=make();place(g,'O',0,3,0);advance(g,800);hold(g);const y=active(g).y;advance(g,999);eq(active(g).y,y,'fresh hold clock');step(g,1);eq(active(g).y,y+1,'hold gravity');record('holdClock','1000 ms');}
  // Exact public-action fixtures. Stack assignment only; real spawn/moves/kicks.
  const fixtures=mode==='xhigh'?[
    {stack:[[2,0],[3,1],[4,1]],path:['CW','CCW','L','L']},
    {stack:[[8,1]],path:['R','R','R','R']}
  ]:[
    {stack:[[0,0]],path:['L','L','L']},
    {stack:[[8,1]],path:['R','R','R','R','WAIT1000']}
  ];
  const hidden=[];
  for(const [index,f]of fixtures.entries()){
    const g=make();clear(g);for(const[x,y]of f.stack)put(g,x,y);spawn(g,'T');incoming(g,'I');
    const start=active(g);check(!over(g),'open initial T');
    for(const action of f.path){if(action==='WAIT1000')advance(g,1000);else check(action==='L'||action==='R'?move(g,action==='L'?-1:1):rotate(g,action==='CW'?1:-1),'legal hidden replay '+action);}
    const pose=active(g),ys=cells(pose).map(c=>c[1]);
    check(index?ys.some(y=>y<0)&&ys.some(y=>y>=0):ys.every(y=>y<0),'whole/partial extent');eq(ghost(g),pose.y,'zero hidden travel');
    const i=make();spawn(i,'I');check(fits(g,active(i))&&cells(active(i)).every(c=>!cells(pose).some(d=>key([c])===key([d]))),'incoming I independently open');
    hard(g);hidden.push({...f,start,pose,over:over(g)});
  }
  record('hidden',hidden);
  {const g=make();place(g,'O',0,0,18);incoming(g,'T');put(g,4,mode==='xhigh'?-1:-2);hard(g);check(over(g),'blocked spawn');const snapshot=()=>JSON.stringify([active(g),count(g),g.score,held(g)]),before=snapshot();move(g,-1);rotate(g,1);hard(g);hold(g);advance(g,1000);eq(snapshot(),before,'terminal guard');const fresh=restart(g);eq([over(fresh),count(fresh),fresh.score,fresh.lines,fresh.level,held(fresh),canHold(fresh)],[false,0,0,0,1,null,true],'fresh game');}
  {let g=make(42),drops=0;while(!over(g)&&drops<100){hard(g);drops++;}check(over(g),'actual game over');g=restart(g);const opening=[];for(let i=0;i<7;i++){opening.push(active(g).type);clear(g);hard(g);}record('restartBag',{drops,opening,types:new Set(opening).size});}
  // Newest-audit calibration: independent first-fitting SRS on obstructed stacks.
  const canonical=(t,r)=>reference[t][r].map(([x,y])=>[x-(t==='O'?1:0),y]);
  const occupied=p=>canonical(p.type,p.rotation).map(([x,y])=>[x+p.x,y+p.y]);
  const legal=(g,p)=>occupied(p).every(([x,y])=>x>=0&&x<10&&y<20&&!get(g,x,y));
  let seed=0x5532;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
  let rotations=0,rejections=0;const acceptedCandidates=[0,0,0,0,0],differences=[];
  for(const type of types)for(let from=0;from<4;from++)for(const dir of [-1,1])for(let sample=0;sample<12;sample++) {
    const g=make(),cs=canonical(type,from),minX=Math.min(...cs.map(p=>p[0])),maxX=Math.max(...cs.map(p=>p[0])),maxY=Math.max(...cs.map(p=>p[1]));
    const x=[-minX,3,9-maxX][sample%3],y=[-2,8,19-maxY][Math.floor(sample/3)%3];
    place(g,type,from,x,y);const before=active(g),start=new Set(occupied(before).map(p=>p.join(','))),stack=[];
    for(let yy=Math.max(-2,y-2);yy<=Math.min(19,y+4);yy++)for(let xx=0;xx<10;xx++)if(!start.has(`${xx},${yy}`)&&random()<.28){put(g,xx,yy);stack.push([xx,yy]);}
    const to=(from+dir+4)%4,offsets=type==='O'?[[0,0]]:(type==='I'?iKicks:normalKicks)[`${from}>${to}`].map(([dx,dy])=>[dx,-dy]);
    const index=offsets.findIndex(([dx,dy])=>legal(g,{type,rotation:to,x:x+dx,y:y+dy}));
    const expected=index<0?before:{type,rotation:to,x:x+offsets[index][0],y:y+offsets[index][1]};
    const success=rotate(g,dir),actual=active(g);
    if(success!==(index>=0)||JSON.stringify(actual)!==JSON.stringify(expected))differences.push({before,dir,stack,success,actual,expected,expectedSuccess:index>=0});
    if(index<0)rejections++;else acceptedCandidates[index]++;rotations++;
  }
  record('rotationOutcomes',{rotations,rejections,acceptedCandidates,differences:differences.length});
  // All four T facings, full/mini zero-line credit, using actual final rotation.
  const spinFacings=[];
  for(let rotation=0;rotation<4;rotation++)for(const full of [false,true]) {
    let found=false;
    for(let missing=0;missing<4&&!found;missing++) {
      const front=[rotation,(rotation+1)%4];if(front.includes(missing)===full)continue;
      for(const dir of [-1,1])for(let dy=-2;dy<=2&&!found;dy++)for(let dx=-2;dx<=2&&!found;dx++) {
        const g=make(),corners=[[3,17],[5,17],[5,19],[3,19]];
        corners.forEach(([x,y],i)=>{if(i!==missing)put(g,x,y);});
        const before={type:'T',rotation:(rotation-dir+4)%4,x:3+dx,y:17+dy};
        if(!legal(g,before))continue;
        place(g,before.type,before.rotation,before.x,before.y);
        if(!rotate(g,dir)||JSON.stringify(active(g))!==JSON.stringify({type:'T',rotation,x:3,y:17})||ghost(g)!==17)continue;
        hard(g);eq(g.lines,0,'spin-facing zero lines');spinFacings.push({rotation,full,score:g.score});found=true;
      }
    }
    check(found,'reachable T facing');
  }
  record('spinFacings',spinFacings);
  {const g=make();for(const y of [17,19])for(let x=0;x<10;x++)if(x!==4)put(g,x,y);
    put(g,0,18);put(g,1,16);place(g,'I',1,2,16);hard(g);
    const remaining=[];for(let y=-2;y<20;y++)for(let x=0;x<10;x++)if(get(g,x,y))remaining.push([x,y]);
    eq(remaining,[[1,18],[4,18],[0,19],[4,19]],'nonadjacent row compaction');
    record('nonadjacentClear',{lines:g.lines,score:g.score,cells:count(g)});
  }
  const perfectVariants=[];
  for(const n of [1,2,3,4]) {
    const g=make(),type=n===1||n===4?'I':n===2?'O':'T',rotation=n>=3?1:0,x=n===4?2:3,y=n===1?18:n===2?18:n===3?17:16;
    place(g,type,rotation,x,y);const occupiedSet=new Set(cells(active(g)).map(p=>p.join(',')));
    for(let yy=20-n;yy<20;yy++)for(let xx=0;xx<10;xx++)if(!occupiedSet.has(`${xx},${yy}`))put(g,xx,yy);
    eq(ghost(g),y,'PC zero travel');hard(g);eq(count(g),0,'PC empty board');eq(g.lines,n,'PC line count');perfectVariants.push(g.score);
  }
  record('perfectVariants',perfectVariants);
  {const g=make();place(g,'O',0,3,18);for(let i=0;i<15;i++){advance(g,10);move(g,i%2?-1:1);}
    advance(g,499);const before=count(g),resets=g.lockResets;move(g,-1);step(g,1);record('fullCap',{before,after:count(g),resets});}
  const scaled=[];for(const level of [3,10]){const g=make();g.level=level;g.lines=(level-1)*10;well(g,1);hard(g);scaled.push(g.score);}record('scaledSingles',scaled);
  return evidence;
}

export function additionalProbes(a) {
  const {make,place,put,active,rotate,hard,soft,step,advance,count,get,move}=a;
  const gravity=[];
  for(let level=1;level<=20;level++) {
    const g=make(),ms=Math.pow(.8-(level-1)*.007,level-1)*1000;
    g.level=level;g.lines=(level-1)*10;place(g,'O',0,3,0);
    if(Math.abs(a.gravity(level)-ms)>1e-9)throw Error('gravity helper L'+level);
    step(g,ms*.999);if(active(g).y!==0||g.score!==0)throw Error('early gravity L'+level);
    step(g,ms*.002);if(active(g).y<1||g.score!==0)throw Error('missing gravity L'+level);
    gravity.push({level,firstInteger:Math.ceil(ms),rows:active(g).y,score:g.score});
  }
  const downward=[];
  for(const method of ['gravity','hard','soft']) {
    const g=make();for(const[x,y]of [[0,17],[0,19],[2,19]])put(g,x,y);
    place(g,'T',0,0,3);rotate(g,1);const start=active(g),before=g.score;
    if(method==='hard')hard(g);
    else {soft(g,method==='soft');while(active(g).y<17)step(g,method==='soft'?50:1000);soft(g,false);hard(g);}
    downward.push({method,start,score:g.score-before,extra:g.score-before-(method==='hard'?28:method==='soft'?14:0)});
  }
  // Exhausted reset allowance does not carry old contact time down to a new low.
  const g=make();place(g,'O',0,0,12);put(g,0,14);
  for(let i=0;i<15;i++){step(g,1);rotate(g,1);}advance(g,490);move(g,1);
  advance(g,1000);const atNewLowest={pose:active(g),resets:g.lockResets,lockTimer:g.lockTimer,cells:count(g)};
  while(active(g).y<18)step(g,1);
  advance(g,490);move(g,1);const before=count(g);advance(g,9);const after499=count(g);step(g,1);
  const lowerCap={atNewLowest,before,after499,after500:count(g),cell:!!get(g,2,19)};
  return {gravity,downward,lowerCap};
}

export function assertRecorded(e,extra) {
  assert.equal(e.mode,'max-xhigh');
  const pose=(type,rotation,x,y)=>({type,rotation,x,y});
  assert.deepEqual(e.srs,{states:28,orderedTransitions:48,kickMismatches:[]});
  assert.deepEqual(e.concreteKicks,{
    'TWall-1':pose('T',0,0,8),TWall1:pose('T',0,7,8),
    'IWall-1':pose('I',0,0,8),IWall1:pose('I',0,6,8),
    TFloor:pose('T',1,2,17),IFloor:pose('I',1,4,16),
    IFloorCCW:{success:true,pose:pose('I',3,2,16)},
    I2FloorCCW:{success:true,pose:pose('I',1,1,16)}});
  assert.equal(e.bags,100);assert.equal(e.hold,'pass');assert.equal(e.holdClock,'1000 ms');
  assert.deepEqual(e.ghosts,Object.keys(reference).map(type=>({type,y:14})));
  assert.deepEqual(e.cap,{before:0,at151:0,after16th:0});
  assert.deepEqual(e.fullCap,{before:0,after:4,resets:15});
  assert.equal(e.blockedSoft,0);
  assert.deepEqual(e.naturalContact,{landing:1000,delay:500});
  assert.deepEqual(e.landingFrame,{at1489:0,at1490:0});
  assert.deepEqual(e.secondContact,{pose:pose('O',0,1,13),atNextContact:1,after490:1});
  assert.deepEqual(e.exhaustedLedge,{landedAt:6000,lockedAt:6500,locked:true});
  const scores={normal1:100,normal2:300,normal3:500,normal4:800,
    singlePc:100,b2b:1600,b2bBreak:1750,levelTwoCombo:300,
    levelCrossing:{score:100,lines:10,level:2},b2bTetrisPc:1600,
    singlePcAfterB2B:900,consecutiveTetrises:2050,
    nonRotation:0,miniAfterB2B:900,hardDouble:300,timedDouble:300,manualSoftExtra:0};
  for(const timed of [false,true])for(const full of [false,true])for(const line of [false,true])
    scores[`${timed?'timed':'hard'}-${full?'full':'mini'}-${line?'single':'zero'}`]=line?100:0;
  assert.deepEqual(e.scores,scores);
  assert.deepEqual(e.perfectVariants,[100,300,500,800]);
  assert.deepEqual(e.gravity,[1000,793,356,94,65,12,8,1].map((elapsed,i)=>({level:[1,2,5,9,10,14,15,20][i],elapsed,score:0})));
  assert.deepEqual(e.normalToSoft,{rows:0,points:0});
  assert.deepEqual(e.refresh,{'2:1480.001':[1,1],'10:600':[9,9],'15:100':[14,14]});
  assert.deepEqual(e.hidden.map(f=>f.over),[false,false]);
  assert.deepEqual(e.hidden.map(f=>f.pose),[pose('T',0,0,-2),pose('T',0,7,-1)]);
  assert.deepEqual(e.restartBag,{drops:12,opening:['Z','T','L','I','J','O','S'],types:7});
  assert.deepEqual(e.rotationOutcomes,{rotations:672,rejections:88,
    acceptedCandidates:[303,111,90,46,34],differences:0});
  assert.deepEqual(e.spinFacings,[0,1,2,3].flatMap(rotation=>[false,true].map(full=>({rotation,full,score:0}))));
  assert.deepEqual(e.nonadjacentClear,{lines:2,score:300,cells:4});
  assert.deepEqual(e.scaledSingles,[300,1000]);
  assert.deepEqual(extra.gravity,[1000,793,618,473,356,263,190,135,94,65,43,29,19,12,8,5,3,2,1,1].map((firstInteger,i)=>({level:i+1,firstInteger,rows:1,score:0})));
  assert.deepEqual(extra.downward,['gravity','hard','soft'].map((method,i)=>({method,start:pose('T',1,0,3),score:[0,28,14][i],extra:0})));
  assert.deepEqual(extra.lowerCap,{atNewLowest:{pose:pose('O',3,1,13),resets:15,lockTimer:0,cells:1},before:1,after499:1,after500:5,cell:true});
}

if(process.argv[1]&&resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname)) {
  const load=file=>import(pathToFileURL(resolve(process.argv[2],'dist',file)));
  const a=createAdapter({game:await load('game.js'),pieces:await load('pieces.js')});
  const e=runProbes(a,{reference,normalKicks,iKicks}),extra=additionalProbes(a);
  console.log(JSON.stringify({engine:e,extra}));assertRecorded(e,extra);
  console.log('qwen38 max xhigh: engine outcomes asserted');
}
