// Equivalent probes for Opus 5.5 low/high/xhigh. Only disposable emitted builds.
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
export const reference = {
  I: [[[0,1],[1,1],[2,1],[3,1]], [[2,0],[2,1],[2,2],[2,3]], [[0,2],[1,2],[2,2],[3,2]], [[1,0],[1,1],[1,2],[1,3]]],
  J: [[[0,0],[0,1],[1,1],[2,1]], [[1,0],[2,0],[1,1],[1,2]], [[0,1],[1,1],[2,1],[2,2]], [[1,0],[1,1],[0,2],[1,2]]],
  L: [[[2,0],[0,1],[1,1],[2,1]], [[1,0],[1,1],[1,2],[2,2]], [[0,1],[1,1],[2,1],[0,2]], [[0,0],[1,0],[1,1],[1,2]]],
  O: Array.from({ length: 4 }, () => [[1,0],[2,0],[1,1],[2,1]]),
  S: [[[1,0],[2,0],[0,1],[1,1]], [[1,0],[1,1],[2,1],[2,2]], [[1,1],[2,1],[0,2],[1,2]], [[0,0],[0,1],[1,1],[1,2]]],
  T: [[[1,0],[0,1],[1,1],[2,1]], [[1,0],[1,1],[2,1],[1,2]], [[0,1],[1,1],[2,1],[1,2]], [[1,0],[0,1],[1,1],[1,2]]],
  Z: [[[0,0],[1,0],[1,1],[2,1]], [[2,0],[1,1],[2,1],[1,2]], [[0,1],[1,1],[1,2],[2,2]], [[1,0],[0,1],[1,1],[0,2]]],
};
// Independent published SRS offsets with positive Y upward; negated below.
export const normalKicks = {
  '0>1': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]], '1>0': [[0,0],[1,0],[1,-1],[0,2],[1,2]],
  '1>2': [[0,0],[1,0],[1,-1],[0,2],[1,2]], '2>1': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  '2>3': [[0,0],[1,0],[1,1],[0,-2],[1,-2]], '3>2': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  '3>0': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]], '0>3': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
};
export const iKicks = {
  '0>1': [[0,0],[-2,0],[1,0],[-2,-1],[1,2]], '1>0': [[0,0],[2,0],[-1,0],[2,1],[-1,-2]],
  '1>2': [[0,0],[-1,0],[2,0],[-1,2],[2,-1]], '2>1': [[0,0],[1,0],[-2,0],[1,-2],[-2,1]],
  '2>3': [[0,0],[2,0],[-1,0],[2,1],[-1,-2]], '3>2': [[0,0],[-2,0],[1,0],[-2,-1],[1,2]],
  '3>0': [[0,0],[1,0],[-2,0],[1,-2],[-2,1]], '0>3': [[0,0],[-1,0],[2,0],[-1,2],[2,-1]],
};


// This factory and the probes also run inside Chromium against the served modules.
// Private properties are used only for fixture setup / rejected-candidate capture.
export function createAdapter(modules, mode) {
  const {Game} = modules.game, shapes = modules.pieces.SHAPES;
  const low = mode === 'low', high = mode === 'high';
  const seeded = seed => () => ((seed = (Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
  const make = (seed=42) => low ? new Game(seeded(seed)) : high ? new Game({random:seeded(seed)}) : new Game(new modules.bag.Bag(seeded(seed)));
  const native = g => low ? g.current : g.active;
  const active = g => {const p=native(g);return p && {type:p.type,rotation:low?p.rot:p.rotation,x:p.x,y:p.y-20};};
  const setActive = (g,p) => {const v={type:p.type,x:p.x,y:p.y+20,...(low?{rot:p.rotation}:{rotation:p.rotation})};if(low)g.current=v;else g.active=v;};
  const get=(g,x,y)=>low?g.board[y+20][x]:g.board.get(x,y+20);
  const put=(g,x,y,t='J')=>{if(low)g.board[y+20][x]=t;else g.board.set(x,y+20,t);};
  const clear=g=>{for(let y=-20;y<20;y++)for(let x=0;x<10;x++)put(g,x,y,null);};
  const count=g=>{let n=0;for(let y=-20;y<20;y++)for(let x=0;x<10;x++)if(get(g,x,y))n++;return n;};
  const local=(t,r)=>shapes[t][r];
  const cells=p=>local(p.type,p.rotation).map(([x,y])=>[x+p.x,y+p.y]);
  const fits=(g,p)=>cells(p).every(([x,y])=>x>=0&&x<10&&y>=-20&&y<20&&!get(g,x,y));
  const over=g=>low?g.gameOver:high?g.status==='over':g.state==='over';
  const move=(g,d)=>low?g.move(d):high?(d<0?g.moveLeft():g.moveRight()):g.shift(d);
  const rotate=(g,d)=>high?(d===1?g.rotateCW():g.rotateCCW()):g.rotate(d);
  const hard=g=>g.hardDrop(),hold=g=>low?g.holdPiece():g.hold();
  const held=g=>low?g.hold:g.held,canHold=g=>low||high?g.canHold:!g.holdUsed;
  const queue=g=>low||!high?g.queue:g.nextQueue;
  const soft=(g,on)=>{if(low)g.softDrop=on;else g.setSoftDrop(on);};
  const step=(g,ms)=>g.update(ms);
  const advance=(g,ms)=>{while(ms>1e-8){const dt=Math.min(ms,16);step(g,dt);ms-=dt;}};
  const place=(g,t,r,x,y)=>{
    setActive(g,{type:t,rotation:r,x,y});
    Object.assign(g,{fallTimer:0,gravityTimer:0,lockTimer:0,lockResets:0,lowestY:y+20,lastMoveWasRotation:false,lastKickIndex:0,lastKick:0});
    if(!fits(g,active(g)))throw Error('Colliding fixture '+JSON.stringify(active(g)));
  };
  const ghost=g=>(low?g.ghost().y:g.ghostY())-20;
  const spawn=(g,t)=>g.spawn(t);
  const incoming=(g,t)=>{if(low||high)g.queue[0]=t;else g.source={next:()=>t,peek:n=>Array(n).fill(t)};};
  const restart=g=>{if(low||high){g.reset();return g;}return make(121);};
  const capture=(g,from,to)=>{
    const seen=[];
    if(high)g.fits=(t,r,x,y)=>{if(r===to)seen.push([x-3,y-28]);return false;};
    else g.fits=p=>{if((p.rot??p.rotation)===to)seen.push([p.x-3,p.y-28]);return false;};
    rotate(g,(to-from+4)%4===1?1:-1);return seen;
  };
  return {mode,make,active,setActive,get,put,clear,count,local,cells,fits,over,move,rotate,hard,hold,held,canHold,queue,soft,step,advance,place,ghost,spawn,incoming,restart,capture,colors:modules.pieces.COLORS??modules.pieces.PIECE_COLORS};
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
  let transitions=0;
  for(const t of types.filter(t=>t!=='O'))for(const tr of Object.keys(normalKicks)){
    const [from,to]=tr.split('>').map(Number),g=make();place(g,t,from,3,8);
    eq(capture(g,from,to),(t==='I'?iKicks:normalKicks)[tr].map(([x,y])=>[x,-y||0]),'ordered '+t+tr);transitions++;
  }
  record('srs',{states:28,orderedTransitions:transitions});
  const kicks={};
  for(const t of ['T','I'])for(const side of [-1,1]){
    const g=make(),r=side===-1?1:3,x=side===-1?-Math.min(...local(t,r).map(p=>p[0])):9-Math.max(...local(t,r).map(p=>p[0]));
    place(g,t,r,x,8);check(rotate(g,side===-1?-1:1),'wall rotate');kicks[t+'Wall'+side]=active(g);check(fits(g,active(g)),'wall fit');
  }
  for(const t of ['T','I']){const g=make();place(g,t,0,3,18);check(rotate(g,1),'floor rotate');kicks[t+'Floor']=active(g);}
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
   const s=make();place(s,'O',0,3,18);soft(s,true);step(s,1);eq(count(s),0,'blocked soft does not lock');
   const n=make();place(n,'O',0,3,17);let landing=0;while(active(n).y===17&&landing<2000){step(n,1);landing++;}let delay=0;while(!count(n)&&delay<2000){step(n,1);delay++;}record('naturalContact',{landing,delay});}
  // Ordinary frame-size steps, also repeated through the real browser RAF.
  {const g=make();place(g,'O',0,3,17);advance(g,990);step(g,16);advance(g,483);const at1489=count(g);step(g,1);record('landingFrame',{at1489,at1490:count(g)});}
  // Low retains a previous contact's lock time even after a downward step.
  {const g=make();place(g,'O',0,0,12);put(g,0,14);advance(g,490);move(g,1);advance(g,1000);const p=active(g),atNextContact=count(g);advance(g,490);record('secondContact',{pose:p,atNextContact,after490:count(g)});}
  if(mode==='low'){
    const g=make();place(g,'O',0,0,12);put(g,0,14);
    for(let i=0;i<15;i++)rotate(g,1);
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
  {const g=make();g.lines=10;g.level=2;g.combo=0;well(g,1);hard(g);scores.levelTwoCombo=g.score;}
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
  // Legal paths start with the real spawn; no active pose/spin flag is assigned.
  {const g=make();clear(g);for(const[x,y]of [[2,0],[3,1],[4,1]])put(g,x,y);spawn(g,'T');incoming(g,'I');const start=active(g);check(rotate(g,1)&&rotate(g,-1)&&move(g,-1)&&move(g,-1),'hidden legal kick/move path');const p=active(g);check(cells(p).every(([,y])=>y<0),'wholly hidden');eq(ghost(g),p.y,'hidden zero drop');const i=make();spawn(i,'I');check(fits(g,active(i))&&!cells(active(i)).some(c=>cells(p).some(d=>key([c])===key([d]))),'incoming open');hard(g);check(over(g),'hidden lock out');record('hiddenLockOut',{start,pose:p,over:over(g)});}
  {const g=make();clear(g);put(g,8,1);spawn(g,'T');incoming(g,'I');for(let i=0;i<4;i++)check(move(g,1),'partial legal move');const p=active(g);eq(p.y,-1,'partial row');check(cells(p).some(([,y])=>y<0)&&cells(p).some(([,y])=>y>=0),'partial visibility');eq(ghost(g),p.y,'partial zero drop');hard(g);check(!over(g),'partly visible continues');record('partialLockOut','pass');}
  {const g=make();place(g,'O',0,0,18);incoming(g,'T');put(g,4,-2);hard(g);check(over(g),'blocked spawn');const snapshot=()=>JSON.stringify([active(g),count(g),g.score,held(g)]),before=snapshot();move(g,-1);rotate(g,1);hard(g);hold(g);advance(g,1000);eq(snapshot(),before,'terminal guard');const fresh=restart(g);eq([over(fresh),count(fresh),fresh.score,fresh.lines,fresh.level,held(fresh),canHold(fresh)],[false,0,0,0,1,null,true],'fresh game');}
  {let g=make(42),drops=0;while(!over(g)&&drops<100){hard(g);drops++;}check(over(g),'actual game over');g=restart(g);const opening=[];for(let i=0;i<7;i++){opening.push(active(g).type);clear(g);hard(g);}eq(new Set(opening).size,7,'fresh bag');record('restartBag',{drops,types:7});}
  return evidence;
}

export function assertRecorded(e) {
  if(!['low','high','xhigh'].includes(e.mode))throw Error('Unknown mode');
  const expected = {
  "srs": {
    "states": 28,
    "orderedTransitions": 48
  },
  "concreteKicks": {
    "TWall-1": {
      "type": "T",
      "rotation": 0,
      "x": 0,
      "y": 8
    },
    "TWall1": {
      "type": "T",
      "rotation": 0,
      "x": 7,
      "y": 8
    },
    "IWall-1": {
      "type": "I",
      "rotation": 0,
      "x": 0,
      "y": 8
    },
    "IWall1": {
      "type": "I",
      "rotation": 0,
      "x": 6,
      "y": 8
    },
    "TFloor": {
      "type": "T",
      "rotation": 1,
      "x": 2,
      "y": 17
    },
    "IFloor": {
      "type": "I",
      "rotation": 1,
      "x": 4,
      "y": 16
    }
  },
  "bags": 100,
  "hold": "pass",
  "ghosts": [
    {
      "type": "I",
      "y": 14
    },
    {
      "type": "J",
      "y": 14
    },
    {
      "type": "L",
      "y": 14
    },
    {
      "type": "O",
      "y": 14
    },
    {
      "type": "S",
      "y": 14
    },
    {
      "type": "T",
      "y": 14
    },
    {
      "type": "Z",
      "y": 14
    }
  ],
  "cap": {
    "before": 0,
    "at151": 0,
    "after16th": 4
  },
  "naturalContact": {
    "landing": 1000,
    "delay": 499
  },
  "landingFrame": {
    "at1489": 0,
    "at1490": 4
  },
  "secondContact": {
    "pose": {
      "type": "O",
      "rotation": 0,
      "x": 1,
      "y": 13
    },
    "atNextContact": 1,
    "after490": 1
  },
  "scores": {
    "normal1": 100,
    "normal2": 300,
    "normal3": 500,
    "normal4": 800,
    "singlePc": 100,
    "b2b": 2000,
    "b2bBreak": 2150,
    "levelTwoCombo": 300,
    "levelCrossing": {
      "score": 100,
      "lines": 10,
      "level": 2
    },
    "b2bTetrisPc": 2000,
    "singlePcAfterB2B": 900,
    "consecutiveTetrises": 2050,
    "hard-mini-zero": 100,
    "hard-mini-single": 200,
    "hard-full-zero": 400,
    "hard-full-single": 800,
    "timed-mini-zero": 100,
    "timed-mini-single": 200,
    "timed-full-zero": 400,
    "timed-full-single": 800,
    "nonRotation": 0,
    "miniAfterB2B": 1100,
    "hardDouble": 1200,
    "timedDouble": 1200,
    "manualSoftExtra": 0
  },
  "gravity": [
    {
      "level": 1,
      "elapsed": 1000,
      "score": 0
    },
    {
      "level": 2,
      "elapsed": 793,
      "score": 0
    },
    {
      "level": 5,
      "elapsed": 356,
      "score": 0
    },
    {
      "level": 9,
      "elapsed": 94,
      "score": 0
    },
    {
      "level": 10,
      "elapsed": 65,
      "score": 0
    },
    {
      "level": 14,
      "elapsed": 12,
      "score": 0
    },
    {
      "level": 15,
      "elapsed": 8,
      "score": 0
    },
    {
      "level": 20,
      "elapsed": 1,
      "score": 0
    }
  ],
  "normalToSoft": {
    "rows": 16,
    "points": 16
  },
  "refresh": {
    "2:1480.001": [
      1,
      1
    ],
    "10:600": [
      9,
      9
    ],
    "15:100": [
      14,
      14
    ]
  },
  "holdClock": "1000 ms",
  "hiddenLockOut": {
    "start": {
      "type": "T",
      "rotation": 0,
      "x": 3,
      "y": -1
    },
    "pose": {
      "type": "T",
      "rotation": 0,
      "x": 0,
      "y": -2
    },
    "over": true
  },
  "partialLockOut": "pass",
  "restartBag": {
    "types": 7
  }
};
  expected.mode=e.mode;
  if(e.mode==='low')expected.exhaustedLedge={landedAt:6000,lockedAt:6009,locked:true};
  expected.cap.at151=e.mode==='low'?0:4;
  expected.normalToSoft={rows:e.mode==='xhigh'?1:16,points:e.mode==='xhigh'?1:16};
  expected.restartBag={drops:e.mode==='xhigh'?11:12,types:7};
  const stable=value=>value&&typeof value==='object'?Array.isArray(value)?value.map(stable):Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])])):value;
  if(JSON.stringify(stable(e))!==JSON.stringify(stable(expected)))throw Error('Recorded engine outcome changed: '+JSON.stringify({actual:e,expected}));
}

export async function runAudit(root, mode) {
  const load=file=>import(pathToFileURL(resolve(root,'dist',file)));
  const modules={game:await load('game.js'),pieces:await load('pieces.js')};
  if(mode==='xhigh')modules.bag=await load('randomizer.js');
  const e=runProbes(createAdapter(modules,mode),{reference,normalKicks,iKicks});
  console.log(JSON.stringify(e,null,2));assertRecorded(e);
  console.log(`opus55 ${mode}: canonical engine, scoring, clocks and transitions asserted`);
  return e;
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname))await runAudit(process.argv[2],process.argv[3]);
