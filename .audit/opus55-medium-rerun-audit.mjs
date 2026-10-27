// Equivalent calibrated fixtures against disposable emitted builds only.
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {reference, normalKicks, iKicks, runProbes as calibratedProbes} from './opus55-efforts-audit.mjs';
export {reference, normalKicks, iKicks, calibratedProbes};

// This factory is serialized into Chromium too. No action/rule is replaced.
export function createAdapter(modules) {
  const {Game}=modules.game, pieces=modules.pieces;
  const seeded=seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
  const make=(seed=42)=>new Game(seeded(seed));
  const active=g=>g.active&&({...g.active,y:g.active.y-20});
  const setActive=(g,p)=>g.active={...p,y:p.y+20};
  const get=(g,x,y)=>g.board[(y+20)*10+x];
  const put=(g,x,y,t='J')=>g.board[(y+20)*10+x]=t?pieces.PIECE_TYPES.indexOf(t)+1:0;
  const clear=g=>g.board.fill(0), count=g=>g.board.reduce((n,v)=>n+!!v,0);
  const local=(t,r)=>pieces.pieceCells(t,r);
  const cells=p=>local(p.type,p.rotation).map(([x,y])=>[x+p.x,y+p.y]);
  const fits=(g,p)=>cells(p).every(([x,y])=>x>=0&&x<10&&y>=-20&&y<20&&!get(g,x,y));
  const move=(g,d)=>d<0?g.moveLeft():g.moveRight(), rotate=(g,d)=>g.rotate(d);
  const hard=g=>g.hardDrop(), hold=g=>g.hold(), held=g=>g.holdPiece;
  const canHold=g=>!g.holdUsed, queue=g=>g.nextPieces, soft=(g,on)=>g.setSoftDrop(on);
  const step=(g,ms)=>g.update(ms);
  const advance=(g,ms)=>{while(ms>1e-8){const dt=Math.min(ms,16);step(g,dt);ms-=dt;}};
  const place=(g,type,rotation,x,y)=>{
    setActive(g,{type,rotation,x,y});
    Object.assign(g,{gravityAcc:0,lockTimer:0,lockResets:0,lowestY:y+20,lastMoveRotation:false,lastKickIndex:0});
    if(!fits(g,active(g)))throw Error('Colliding fixture '+JSON.stringify(active(g)));
  };
  const spawn=(g,t)=>g.spawn(t), ghost=g=>g.ghostY()-20, over=g=>g.gameOver;
  const incoming=(g,t)=>{g.nextPieces;g.bag.queue[0]=t;};
  const restart=g=>{g.reset();return g;};
  const capture=(g,from,to)=>{
    const seen=[],p={...g.active};
    g.collides=(t,r,x,y)=>{if(r===to)seen.push([x-p.x,y-p.y]);return true;};
    rotate(g,(to-from+4)%4===1?1:-1);return seen;
  };
  return {mode:'medium-rerun',make,active,setActive,get,put,clear,count,local,cells,fits,move,rotate,hard,hold,held,canHold,queue,soft,step,advance,place,spawn,ghost,over,incoming,restart,capture,colors:pieces.PIECE_COLORS};
}

export function runProbes(a,oracle,common=calibratedProbes) {
  const e=common(a,oracle),{make,place,put,rotate,advance,move,step,count,get,active}=a;
  const check=(ok,message)=>{if(!ok)throw Error(message);};
  const eq=(actual,expected,message)=>check(JSON.stringify(actual)===JSON.stringify(expected),
    message+': '+JSON.stringify({actual,expected}));
  // Round 2: check actual first-fitting rotations against independent geometry,
  // not just the intercepted candidate lists in the common calibration.
  const canonical=(type,r)=>oracle.reference[type][r].map(([x,y])=>[x-(type==='O'?1:0),y]);
  const occupied=p=>canonical(p.type,p.rotation).map(([x,y])=>[x+p.x,y+p.y]);
  const legal=(g,p)=>occupied(p).every(([x,y])=>x>=0&&x<10&&y>=-20&&y<20&&!get(g,x,y));
  let seed=0x5532,rotations=0,rejections=0;
  const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
  const acceptedCandidates=[0,0,0,0,0];
  for(const type of Object.keys(oracle.reference))for(let from=0;from<4;from++)for(const dir of [-1,1]) {
    for(let sample=0;sample<12;sample++) {
      const g=make(),local=canonical(type,from),minX=Math.min(...local.map(p=>p[0])),
        maxX=Math.max(...local.map(p=>p[0])),maxY=Math.max(...local.map(p=>p[1]));
      const x=[-minX,3,9-maxX][sample%3],y=[-2,8,19-maxY][Math.floor(sample/3)%3];
      place(g,type,from,x,y);const before=active(g),start=new Set(occupied(before).map(p=>p.join(',')));
      for(let yy=y-2;yy<=Math.min(19,y+4);yy++)for(let xx=0;xx<10;xx++)
        if(!start.has(`${xx},${yy}`)&&random()<.28)put(g,xx,yy);
      const to=(from+dir+4)%4,offsets=type==='O'?[[0,0]]:(type==='I'?oracle.iKicks:oracle.normalKicks)[`${from}>${to}`].map(([dx,dy])=>[dx,-dy]);
      const index=offsets.findIndex(([dx,dy])=>legal(g,{type,rotation:to,x:x+dx,y:y+dy}));
      const expected=index<0?before:{type,rotation:to,x:x+offsets[index][0],y:y+offsets[index][1]};
      eq(rotate(g,dir),index>=0,'actual rotation result');eq(active(g),expected,'actual first-fitting SRS');
      if(index<0)rejections++;else acceptedCandidates[index]++;rotations++;
    }
  }
  e.rotationOutcomes={rotations,rejections,acceptedCandidates};
  // All four T facings, full and mini, reached by real final rotations.
  e.spinFacings=[];
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
        if(!rotate(g,dir)||JSON.stringify(active(g))!==JSON.stringify({type:'T',rotation,x:3,y:17})||a.ghost(g)!==17)continue;
        const score=g.score;a.hard(g);eq(g.lines,0,'spin-facing zero lines');
        eq(g.score-score,full?400:100,'full/mini facing score');
        e.spinFacings.push({rotation,full,score:g.score-score});found=true;
      }
    }
    check(found,'reachable spin-facing fixture '+rotation+'/'+full);
  }
  // Public lock clears nonadjacent rows and preserves every other coordinate.
  {const g=make();for(const y of [17,19])for(let x=0;x<10;x++)if(x!==4)put(g,x,y);
    put(g,0,18);put(g,1,16);place(g,'I',1,2,16);
    const rows=Array.from({length:40},(_,y)=>Array.from({length:10},(_,x)=>get(g,x,y-20)));
    for(const[x,y]of occupied(active(g)))rows[y+20][x]=1;
    const remaining=rows.filter(row=>row.some(v=>v===0));
    while(remaining.length<40)remaining.unshift(Array(10).fill(0));
    a.hard(g);eq([...g.board],remaining.flat(),'nonadjacent row compaction');
    e.nonadjacentClear={lines:g.lines,score:g.score,cells:count(g)};
  }
  e.scaledScores=[];
  for(const level of [3,10]) {
    const g=make();g.lines=(level-1)*10;g.level=level;put(g,0,10);
    for(let x=0;x<10;x++)if(x<3||x>6)put(g,x,19);
    place(g,'I',0,3,18);a.hard(g);
    e.scaledScores.push({level,score:g.score});
    const d=make();d.level=level;place(d,'O',0,3,0);a.soft(d,true);
    step(d,1000*Math.pow(.8-(level-1)*.007,level-1)/20+.000001);
    eq(d.score,1,'soft points independent of level');a.soft(d,false);
    const y=active(d).y,score=d.score;a.hard(d);eq(d.score-score,2*(18-y),'hard points independent of level');
  }
  // Paused time cannot consume the saved gravity or grounded lock phase.
  {const g=make();place(g,'O',0,3,0);advance(g,800);g.togglePause();advance(g,2000);
    g.togglePause();advance(g,199);const before=active(g).y;step(g,1);
    e.pauseGravity={before,after:active(g).y,score:g.score};
    const l=make();place(l,'O',0,3,18);advance(l,490);l.togglePause();advance(l,2000);
    l.togglePause();advance(l,9);const unlocked=count(l);step(l,1);
    e.pauseLock={before:unlocked,after:count(l)};
  }
  {const g=make();place(g,'O',0,3,0);a.soft(g,true);advance(g,50);a.soft(g,false);
    advance(g,999);const before=active(g).y;step(g,1);e.softRelease={before,after:active(g).y,score:g.score};
  }
  // The fifteenth allowed reset receives a full delay; a sixteenth cannot reset.
  {const g=make();place(g,'O',0,3,18);
    for(let i=0;i<15;i++){advance(g,10);move(g,i%2?-1:1);}
    advance(g,499);const before=count(g),resetsBeforeLock=g.lockResets;move(g,-1);step(g,1);
    e.fullCap={before,after:count(g),resetsBeforeLock};
  }
  // New lowest rows must discard the earlier contact even after the cap.
  {const g=make();place(g,'O',0,0,12);put(g,0,14);
    for(let i=0;i<15;i++){advance(g,1);rotate(g,1);}
    advance(g,490);move(g,1);
    let elapsed=0,landedAt=null;
    while(!get(g,1,19)&&elapsed<9000){step(g,1);elapsed++;if(landedAt===null&&active(g)?.y===18)landedAt=elapsed;}
    e.exhaustedLedge={landedAt,lockedAt:elapsed};
  }
  {const g=make();place(g,'O',0,3,17);advance(g,990);step(g,16);advance(g,483);
    const out=[count(g)];step(g,1);out.push(count(g));advance(g,15);out.push(count(g));step(g,1);out.push(count(g));
    e.landingBoundary=out;
  }
  // Pause and terminal guards cover all mutations, not just visible movement.
  {const g=make();place(g,'T',0,3,5);g.togglePause();
    const snapshot=()=>JSON.stringify([g.active,[...g.board],g.score,g.holdPiece,g.holdUsed,g.nextPieces]);
    const before=snapshot();move(g,1);rotate(g,1);a.hard(g);a.hold(g);advance(g,1000);
    e.pauseInert=snapshot()===before;g.togglePause();
    e.resumeMoves=move(g,1);
  }
  return e;
}

export function assertRecorded(e) {
  assert.equal(e.mode,'medium-rerun');
  assert.deepEqual(e.srs,{states:28,orderedTransitions:48});assert.equal(e.bags,100);
  assert.deepEqual(e.concreteKicks,{
    'TWall-1':{type:'T',rotation:0,x:0,y:8},TWall1:{type:'T',rotation:0,x:7,y:8},
    'IWall-1':{type:'I',rotation:0,x:0,y:8},IWall1:{type:'I',rotation:0,x:6,y:8},
    TFloor:{type:'T',rotation:1,x:2,y:17},IFloor:{type:'I',rotation:1,x:4,y:16}});
  assert.equal(e.hold,'pass');assert.equal(e.holdClock,'1000 ms');
  assert.deepEqual(e.ghosts,Object.keys(reference).map(type=>({type,y:14})));
  assert.deepEqual(e.cap,{before:0,at151:0,after16th:0});
  assert.deepEqual(e.fullCap,{before:0,after:4,resetsBeforeLock:15});
  assert.deepEqual(e.naturalContact,{landing:1000,delay:500});
  assert.deepEqual(e.landingFrame,{at1489:0,at1490:0});
  assert.deepEqual(e.landingBoundary,[0,0,0,4]);
  assert.deepEqual(e.secondContact,{pose:{type:'O',rotation:0,x:1,y:13},atNextContact:1,after490:1});
  assert.deepEqual(e.exhaustedLedge,{landedAt:6000,lockedAt:6500});
  const scores={normal1:100,normal2:300,normal3:500,normal4:800,singlePc:100,b2b:2000,b2bBreak:2150,
    levelTwoCombo:300,levelCrossing:{score:100,lines:10,level:2},b2bTetrisPc:2000,singlePcAfterB2B:900,
    consecutiveTetrises:2050,nonRotation:0,miniAfterB2B:1100,hardDouble:1200,timedDouble:1200,manualSoftExtra:0};
  for(const timed of [false,true])for(const full of [false,true])for(const line of [false,true])
    scores[`${timed?'timed':'hard'}-${full?'full':'mini'}-${line?'single':'zero'}`]=full?(line?800:400):(line?200:100);
  assert.deepEqual(e.scores,scores);
  assert.deepEqual(e.gravity,[1000,793,356,94,65,12,8,1].map((elapsed,i)=>({level:[1,2,5,9,10,14,15,20][i],elapsed,score:0})));
  assert.deepEqual(e.normalToSoft,{rows:16,points:16});
  assert.deepEqual(e.refresh,{'2:1480.001':[1,1],'10:600':[9,9],'15:100':[14,14]});
  assert.deepEqual(e.hiddenLockOut,{start:{type:'T',rotation:0,x:3,y:-1},pose:{type:'T',rotation:0,x:0,y:-2},over:true});
  assert.equal(e.partialLockOut,'pass');
  assert.equal(e.restartBag.types,7);assert.equal(e.restartBag.drops,11);
  assert.equal(e.pauseInert,true);assert.equal(e.resumeMoves,true);
  assert.deepEqual(e.rotationOutcomes,{rotations:672,rejections:125,acceptedCandidates:[309,117,58,28,35]});
  assert.deepEqual(e.spinFacings,[0,1,2,3].flatMap(rotation=>[false,true].map(full=>({rotation,full,score:full?400:100}))));
  assert.deepEqual(e.nonadjacentClear,{lines:2,score:300,cells:4});
  assert.deepEqual(e.scaledScores,[{level:3,score:300},{level:10,score:1000}]);
  assert.deepEqual(e.pauseGravity,{before:0,after:1,score:0});
  assert.deepEqual(e.pauseLock,{before:0,after:4});
  assert.deepEqual(e.softRelease,{before:1,after:2,score:1});
}

if(process.argv[1]&&resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname)) {
  const load=file=>import(pathToFileURL(resolve(process.argv[2],'dist',file)));
  const a=createAdapter({game:await load('game.js'),pieces:await load('pieces.js')});
  const e=runProbes(a,{reference,normalKicks,iKicks});console.log(JSON.stringify(e));assertRecorded(e);
  console.log('opus55 medium rerun: canonical engine, scoring, clocks and transitions asserted');
}
