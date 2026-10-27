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
}

if(process.argv[1]&&resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname)) {
  const load=file=>import(pathToFileURL(resolve(process.argv[2],'dist',file)));
  const a=createAdapter({game:await load('game.js'),pieces:await load('pieces.js')});
  const e=runProbes(a,{reference,normalKicks,iKicks});console.log(JSON.stringify(e));assertRecorded(e);
  console.log('opus55 medium rerun: canonical engine, scoring, clocks and transitions asserted');
}
