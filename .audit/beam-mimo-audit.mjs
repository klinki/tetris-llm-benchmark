// Audits emitted code in disposable copies only. Also serialized into Chromium.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {reference,normalKicks,iKicks} from './opus55-efforts-audit.mjs';
export {reference,normalKicks,iKicks};

// Appended accessors: action/clock/render bodies are never changed.
export const lowAccess = `
globalThis.__low={
 get board(){return board}, get cur(){return cur},get score(){return score},get lines(){return lines},get level(){return level},get over(){return gameOverFlag},
 get pending(){return globalThis.__pending},
 fresh(type='T',shape=null,x=3,y=0){board=Array.from({length:20},()=>Array(10).fill(0));colors=Array.from({length:20},()=>Array(10).fill(''));cur={type,shape:shape||pieces[type].shape,color:pieces[type].color,x,y};score=0;lines=0;level=1;gameOverFlag=false;last=0;dropCounter=0;updateUI();},
 setLevel(n){level=n},setLines(n){lines=n},getPiece,spawn,rotate,draw,update,
 pose(type,shape,x,y){cur={type,shape,color:pieces[type].color,x,y}},
 key(key){document.dispatchEvent({type:'keydown',key})},
 local(t,r){let s=pieces[t].shape;while(r-->0)s=rotate(s);return s.flatMap((row,y)=>row.flatMap((v,x)=>v?[[x,y]]:[]));},
 put(x,y){board[y][x]=1;colors[y][x]='#ffffff'},
 count(){return board.flat().filter(Boolean).length},
 next(type){bag=[type]},resetBag(){bag=[]},get bag(){return [...bag]},
};`;

export const mediumAccess = `
globalThis.__medium={get state(){return state},get acc(){return acc},tick,draw,
 fresh(){state=game_1.initGame();state.board=Array.from({length:20},()=>Array(10).fill(0));state.current={type:1,rot:0,x:3,y:18};last=0;acc=0;},
};`;

export function runMediumClock(a,m) {
  const count=()=>a.state.board.flat().filter(Boolean).length;
  a.fresh();a.tick(500);const at500=count();m.move(a.state,1);a.tick(800);const at800=count();
  a.fresh();a.state.current.y=0;a.tick(600);m.hold(a.state);const y=a.state.current.y;a.tick(800);const heldRows=a.state.current.y-y;
  return {at500,at800,heldRows};
}

export function runLow(a,oracle) {
  const check=(v,m)=>{if(!v)throw Error(m)},eq=(v,w,m)=>check(JSON.stringify(v)===JSON.stringify(w),m+': '+JSON.stringify(v));
  const out={mode:'low'},key=cs=>cs.map(c=>c.join(',')).sort().join(' ');
  const mismatch=[];
  for(const t of Object.keys(oracle))for(let r=0;r<4;r++){
    const cells=a.local(t,r),zero=a.local(t,0),dx=Math.min(...oracle[t][0].map(c=>c[0]))-Math.min(...zero.map(c=>c[0])),dy=Math.min(...oracle[t][0].map(c=>c[1]))-Math.min(...zero.map(c=>c[1]));
    if(key(cells.map(([x,y])=>[x+dx,y+dy]))!==key(oracle[t][r]))mismatch.push(t+r);
  }
  out.states=mismatch;
  a.fresh('T',[[0,1,0],[1,1,1]],3,18);a.key('ArrowUp');out.floor={x:a.cur.x,y:a.cur.y,shape:a.cur.shape};
  a.resetBag();const bags=[];for(let b=0;b<100;b++){const bag=[];for(let i=0;i<7;i++)bag.push(a.getPiece());check(new Set(bag).size===7,'bag permutation');bags.push(bag);}out.bags=bags.length;
  a.fresh();const before=JSON.stringify(a.cur);a.key('c');eq(JSON.stringify(a.cur),before,'hold absent');a.key('Control');eq(JSON.stringify(a.cur),before,'left ctrl absent');
  a.fresh('O',[[1,1],[1,1]],3,0);a.key('ArrowDown');out.soft={y:a.cur.y,score:a.score};a.key(' ');out.hard={count:a.count(),score:a.score};
  const normal=[];for(let n=1;n<=4;n++){a.fresh('I',[[1],[1],[1],[1]],4,16);for(let y=20-n;y<20;y++)for(let x=0;x<10;x++)if(x!==4)a.put(x,y);a.put(0,10);a.key(' ');normal.push(a.score);}out.normal=normal;
  a.fresh('T',a.rotate(a.rotate(a.rotate([[0,1,0],[1,1,1]]))),3,17);for(const[x,y]of [[5,17],[3,19],[3,17]])a.put(x,y);for(const x of [0,1,2,6,7,8,9])a.put(x,18);a.key('ArrowUp');a.key(' ');out.fullSpinSingle=a.score;
  a.fresh('I',[[1,1,1,1]],3,19);for(let x=0;x<10;x++)if(x<3||x>6)a.put(x,19);a.key(' ');out.pc=a.score;eq(a.count(),0,'single PC empties');
  const well=n=>{for(const row of a.board)row.fill(0);a.pose('I',[[1],[1],[1],[1]],4,16);for(let y=20-n;y<20;y++)for(let x=0;x<10;x++)if(x!==4)a.put(x,y);a.put(0,10);};
  a.fresh();well(4);a.key(' ');for(const row of a.board)row.fill(0);a.pose('O',[[1,1],[1,1]],7,18);a.key(' ');well(4);a.key(' ');out.b2b=a.score;
  a.fresh();a.setLevel(2);a.setLines(10);well(1);a.key(' ');const firstSingle=a.score;well(1);a.key(' ');out.comboIncrement=a.score-firstSingle;
  // Ground contact and manipulations use the real emitted RAF body.
  a.fresh('O',[[1,1],[1,1]],3,18);a.update(500);out.at500=a.count();a.key('ArrowRight');a.update(1001);out.at1001=a.count();
  const gravity=[];for(const level of [1,2,5,10]){a.fresh('O',[[1,1],[1,1]],3,0);a.setLevel(level);let t=0;while(a.cur.y===0&&t<2000)a.update(++t);gravity.push(t);}out.gravity=gravity;
  const refresh=[];for(const hz of [60,144]){a.fresh('O',[[1,1],[1,1]],3,0);a.setLevel(2);let t=0;while(t<1480.001-1e-8){t=Math.min(t+1000/hz,1480.001);a.update(t);}refresh.push(a.cur.y);}out.refresh=refresh;
  // A blocked incoming O ends the game. Consume the final queued callback,
  // restart, then inspect the real scheduling count and clock.
  a.fresh('O',[[1,1],[1,1]],0,18);a.next('O');a.put(3,0);a.key(' ');check(a.over,'blocked spawn');
  const x=a.cur.x;a.key('ArrowRight');out.terminalMoves=a.cur.x-x;
  a.update(1100);const pending=a.pending;a.key('r');out.restart={over:a.over,count:a.count(),score:a.score};out.restartScheduled=a.pending-pending;
  return out;
}

export function runMedium(m,oracle) {
  const check=(v,s)=>{if(!v)throw Error(s)},eq=(v,w,s)=>check(JSON.stringify(v)===JSON.stringify(w),s+': '+JSON.stringify(v));
  const names=['I','O','T','S','Z','J','L'],key=cs=>cs.map(c=>c.join(',')).sort().join(' '),out={mode:'medium'};
  const local=(t,r)=>m.shapeOf({type:names.indexOf(t),rot:r,x:0,y:0}).flatMap((row,y)=>row.flatMap((v,x)=>v?[[x,y]]:[]));
  out.states=[];for(const t of names)for(let r=0;r<4;r++){const zero=local(t,0),dx=Math.min(...oracle[t][0].map(c=>c[0]))-Math.min(...zero.map(c=>c[0])),dy=Math.min(...oracle[t][0].map(c=>c[1]))-Math.min(...zero.map(c=>c[1]));if(key(local(t,r).map(([x,y])=>[x+dx,y+dy]))!==key(oracle[t][r]))out.states.push(t+r);}
  out.floor=m.tryRotate(m.newBoard(),{type:2,rot:0,x:3,y:18},1);
  const g=m.initGame(),first=g.current.type;m.hold(g);check(g.hold===first&&g.holdUsed,'first hold');const held=JSON.stringify(g.current);m.hold(g);eq(JSON.stringify(g.current),held,'hold restriction');m.hardDrop(g);m.hold(g);eq(g.current.type,first,'retrieval');eq(g.current.rot,0,'orientation');
  const bag=new m.Bag();for(let b=0;b<100;b++)eq(Array.from({length:7},()=>bag.next()).sort(),[0,1,2,3,4,5,6],'bag');out.bags=100;
  const scores=[];for(let n=1;n<=4;n++){const s=m.initGame();s.board=m.newBoard();s.current={type:0,rot:1,x:2,y:16};for(let y=20-n;y<20;y++)for(let x=0;x<10;x++)if(x!==4)s.board[y][x]=1;s.board[10][0]=1;m.hardDrop(s);scores.push(s.score);}out.normal=scores;
  const pc=m.initGame();pc.board=m.newBoard();pc.current={type:0,rot:0,x:3,y:18};for(let x=0;x<10;x++)if(x<3||x>6)pc.board[19][x]=1;m.hardDrop(pc);out.pc=pc.score;
  const well=(s,n)=>{s.board=m.newBoard();s.current={type:0,rot:1,x:2,y:16};for(let y=20-n;y<20;y++)for(let x=0;x<10;x++)if(x!==4)s.board[y][x]=1;s.board[10][0]=1;};
  const chain=m.initGame();well(chain,4);m.hardDrop(chain);chain.board=m.newBoard();chain.current={type:1,rot:0,x:7,y:18};m.hardDrop(chain);well(chain,4);m.hardDrop(chain);out.b2b=chain.score;
  const combo=m.initGame();combo.level=1;combo.lines=10;well(combo,1);m.hardDrop(combo);const firstSingle=combo.score;well(combo,1);m.hardDrop(combo);out.comboIncrement=combo.score-firstSingle;
  const ghosts=[];for(let type=0;type<7;type++){const s=m.initGame();s.board=m.newBoard();s.current={type,rot:0,x:3,y:0};s.board[16][4]=1;const p={...s.current},y=m.ghostY(s);check(!m.collides(s.board,{...p,y})&&m.collides(s.board,{...p,y:y+1}),'ghost');m.hardDrop(s);eq(s.score,2*(y-p.y),'drop points');eq(s.board.flat().filter(Boolean).length,5,'four cells');ghosts.push(y);}out.ghosts=ghosts;
  out.gravity=[0,1,4,9].map(m.gravityInterval);
  const spin=m.initGame();spin.board=m.newBoard();spin.current={type:2,rot:3,x:3,y:17};for(const[x,y]of [[5,17],[3,19],[3,17]])spin.board[y][x]=1;for(const x of [0,1,2,6,7,8,9])spin.board[18][x]=1;check(m.rotateCW(spin),'actual spin rotation');m.hardDrop(spin);out.fullSpinSingle=spin.score;
  const hidden=m.initGame();hidden.board=m.newBoard();for(const[x,y]of [[4,2],[2,1],[8,2],[5,3],[0,0],[3,3]])hidden.board[y][x]=1;
  check(m.spawn(hidden,2),'actual T spawn');hidden.queue[0]=0;
  check(!m.collides(hidden.board,{type:0,rot:0,x:3,y:0}),'incoming I independently open');
  for(const action of ['CW','CW','CW','CW','L','CW','CW','CW','CW'])check(action==='L'?m.move(hidden,-1):m.rotateCW(hidden),'public hidden action');
  const hp={...hidden.current};check(local('T',hp.rot).every(([,y])=>y+hp.y<0),'whole hidden');eq(m.ghostY(hidden),hp.y,'zero travel hidden');m.hardDrop(hidden);out.hidden={pose:hp,over:hidden.gameOver,count:hidden.board.flat().filter(Boolean).length};
  return out;
}

export function mimoAdapter(modules) {
  const {Game}=modules.game,{SHAPES,cellsOf,kickTable}=modules.pieces;
  const make=(seed=42)=>new Game(()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32)),active=g=>g.current&&({...g.current,y:g.current.y-20});
  const put=(g,x,y,t='J')=>g.board.set(x,y+20,t),clear=g=>g.board.reset(),count=g=>g.board.filledCells();
  const place=(g,t,r,x,y)=>{g.current={type:t,rot:r,x,y:y+20};Object.assign(g,{fallTimer:0,lockTimer:0,lockResets:0,lastActionWasRotation:false,lastKickIndex:-1,softDropping:false});if(g.board.collides(cellsOf(t,r),x,y+20))throw Error('colliding fixture');};
  const cells=p=>cellsOf(p.type,p.rot).map(([x,y])=>[x+p.x,y+p.y]);
  const advance=(g,ms)=>{while(ms>1e-8){const dt=Math.min(ms,16);g.update(dt/1000);ms-=dt;}};
  return {make,active,put,clear,count,place,cells,advance,local:cellsOf,kicks:kickTable,shapes:SHAPES};
}

export function runMimo(a,oracle) {
  const check=(v,m)=>{if(!v)throw Error(m)},eq=(v,w,m)=>check(JSON.stringify(v)===JSON.stringify(w),m+': '+JSON.stringify(v));
  const {make,active,put,clear,count,place,cells,advance,local,kicks}=a,key=cs=>cs.map(c=>c.join(',')).sort().join(' '),out={mode:'mimo'};
  for(const t of Object.keys(oracle.reference))for(let r=0;r<4;r++)eq(key(local(t,r)),key(oracle.reference[t][r]),'state '+t+r);
  const mismatches=[];for(const t of ['I','J','L','S','T','Z'])for(const tr of Object.keys(oracle.normalKicks)){const [f,to]=tr.split('>').map(Number),expected=(t==='I'?oracle.iKicks:oracle.normalKicks)[tr].map(([x,y])=>[x,-y||0]);if(JSON.stringify(kicks(t,f,to))!==JSON.stringify(expected))mismatches.push(t+tr);}out.kickMismatches=mismatches;let captured=0;for(const t of ['I','J','L','S','T','Z'])for(const tr of Object.keys(oracle.normalKicks)){const [from,to]=tr.split('>').map(Number),g=make(),seen=[];place(g,t,from,3,8);g.board.collides=(_cells,x,y)=>{seen.push([x-3,y-28]);return true;};g.rotate((to-from+4)%4===1?1:-1);eq(seen,kicks(t,from,to),'actual ordered candidates');captured++;}out.capturedTransitions=captured;
  out.floor={};for(const t of ['I','T']){const g=make();place(g,t,0,3,18);const success=g.rotate(1);out.floor[t]={success,pose:active(g)};}
  for(let seed=1;seed<=10;seed++){const g=make(seed);for(let b=0;b<10;b++){const draw=[];for(let i=0;i<7;i++){draw.push(g.current.type);clear(g);g.hardDrop();}eq(new Set(draw).size,7,'actual bag');}}out.bags=100;
  const g=make(),first=g.current.type,next=g.peekNext(5)[0];g.rotate(1);g.holdPiece();eq(g.current.type,next,'hold next');eq(g.hold,first,'hold stores');const p=active(g);g.holdPiece();eq(active(g),p,'hold restriction');clear(g);g.hardDrop();g.holdPiece();eq(g.current.type,first,'retrieval');eq(g.current.rot,0,'orientation');out.hold=true;
  out.ghosts=[];for(const t of Object.keys(oracle.reference)){const g=make();place(g,t,0,3,0);put(g,4,16);const p=active(g),y=g.ghostY()-20;const fits=p=>cells(p).every(([x,y])=>x>=0&&x<10&&y<20&&!g.board.get(x,y+20));check(fits({...p,y})&&!fits({...p,y:y+1}),'independent ghost');g.hardDrop();eq(g.score,2*(y-p.y),'hard points');eq(count(g),5,'four welded cells');for(const[x,yy]of cells({...p,y}))check(g.board.get(x,yy+20),'welded coordinate');out.ghosts.push({type:t,y});}
  const well=(g,n,pc=false)=>{clear(g);for(let y=20-n;y<20;y++)for(let x=0;x<10;x++)if(x!==4)put(g,x,y);if(!pc)put(g,0,10);place(g,'I',1,2,16);};
  const pcSingle=g=>{clear(g);for(let x=0;x<10;x++)if(x<3||x>6)put(g,x,19);place(g,'I',0,3,18);};
  const filler=g=>{clear(g);place(g,'O',0,7,18);g.hardDrop();};
  const scores={};for(let n=1;n<=4;n++){const g=make();well(g,n);g.hardDrop();eq(g.lines,n,'normal clear');scores['normal'+n]=g.score;}
  {const g=make();pcSingle(g);g.hardDrop();eq(count(g),0,'empty PC');scores.singlePc=g.score;}
  {const g=make();well(g,4);g.hardDrop();filler(g);well(g,4);g.hardDrop();scores.b2b=g.score;well(g,1);g.hardDrop();scores.break=g.score;}
  {const g=make();g.lines=10;g.level=2;g.combo=0;well(g,1);g.hardDrop();scores.combo=g.score;}
  {const g=make();g.lines=9;well(g,1);g.hardDrop();scores.crossing=[g.score,g.lines,g.level];}
  {const g=make();well(g,4);g.hardDrop();filler(g);well(g,4,true);g.hardDrop();scores.b2bPc=g.score;}
  const pocket=(g,full,line)=>{clear(g);put(g,5,17);put(g,3,19);put(g,full?3:5,full?17:19);if(line)for(const x of [0,1,2,6,7,8,9])put(g,x,18);place(g,'T',3,3,17);check(g.rotate(1),'actual final rotation');eq(active(g),{type:'T',rot:0,x:3,y:17},'pose');eq(g.ghostY()-20,17,'zero travel');};
  for(const timed of [false,true])for(const full of [false,true])for(const line of [false,true]){const g=make();pocket(g,full,line);if(timed)advance(g,501);else g.hardDrop();scores[`${timed?'timed':'hard'}-${full?'full':'mini'}-${line?'single':'zero'}`]=g.score;}
  for(const timed of [false,true]){const g=make();for(let x=0;x<10;x++){if(x!==4)put(g,x,19);if(x<3||x>5)put(g,x,18);}put(g,3,17);place(g,'T',0,3,17);check(g.rotate(1)&&g.rotate(1),'double rotations');if(timed)advance(g,501);else g.hardDrop();scores[timed?'timedDouble':'hardDouble']=g.score;}
  out.scores=scores;
  const ground=make();place(ground,'O',0,3,18);advance(ground,499);eq(count(ground),0,'499 unlocked');advance(ground,1);out.at500=count(ground);
  const reset=make();place(reset,'O',0,3,18);advance(reset,490);reset.moveHorizontal(1);advance(reset,20);eq(count(reset),0,'reset');
  const cap=make();place(cap,'O',0,3,18);for(let i=0;i<15;i++){advance(cap,10);cap.moveHorizontal(i%2?-1:1);}advance(cap,490);const before=count(cap);cap.moveHorizontal(-1);advance(cap,10);out.cap=[before,count(cap)];
  const ledge=make();place(ledge,'O',0,-1,12);put(ledge,0,14);advance(ledge,490);ledge.moveHorizontal(1);advance(ledge,20);eq(count(ledge),1,'safe ledge');
  const landing=make();place(landing,'O',0,3,17);advance(landing,990);advance(landing,16);advance(landing,483);const b=count(landing);advance(landing,1);out.landing=[b,count(landing)];
  const soft=make();place(soft,'O',0,3,0);advance(soft,800);soft.setSoftDrop(true);advance(soft,1);out.soft={rows:active(soft).y,points:soft.score};
  const holdClock=make();place(holdClock,'O',0,3,0);advance(holdClock,800);holdClock.holdPiece();const heldY=holdClock.current.y;advance(holdClock,999);eq(holdClock.current.y,heldY,'fresh held phase');advance(holdClock,1);eq(holdClock.current.y,heldY+1,'held 1000');
  out.gravity=[];for(const level of [1,2,5,9,10,14,15,20]){const g=make();g.level=level;place(g,'O',0,3,0);let ms=0;while(active(g).y===0&&ms<2000){g.update(.001);ms++;}eq(g.score,0,'no gravity points');out.gravity.push(ms);}
  out.refresh={};for(const[level,duration]of [[2,1480.001],[10,600],[15,100.001]]){out.refresh[level]=[];for(const hz of [60,144]){const g=make();g.level=level;place(g,'O',0,3,0);let t=0;while(t<duration-1e-8){const dt=Math.min(1000/hz,duration-t);g.update(dt/1000);t+=dt;}out.refresh[level].push(active(g).y);}}
  const hiddenStack=[[1,1],[0,3],[0,0],[1,3],[7,2],[3,2],[4,2],[4,3],[6,2],[0,2]],hiddenPath=['L','CW','CW','L','CW','CW'];
  out.hidden=[];for(const path of [hiddenPath,hiddenPath.slice(0,5)]){
    const g=make();clear(g);for(const[x,y]of hiddenStack)put(g,x,y);g.spawn('T');check(!g.gameOver,'public T spawn');g.bag.queue=['I'];check(!g.board.collides(local('I',0),3,20),'incoming I independently open');
    for(const action of path)check(action==='L'?g.moveHorizontal(-1):g.rotate(1),'public hidden action');
    const p=active(g),ys=cells(p).map(c=>c[1]);eq(g.ghostY()-20,p.y,'grounded hidden fixture');
    if(path.length===6)check(ys.every(y=>y<0),'wholly hidden');else check(ys.some(y=>y<0)&&ys.some(y=>y>=0),'partly visible');
    g.hardDrop();eq(g.gameOver,path.length===6,'whole/partial handling');out.hidden.push({pose:p,over:g.gameOver});
  }
  const terminal=make();place(terminal,'O',0,0,18);terminal.bag.queue=['T'];put(terminal,4,0);terminal.hardDrop();check(terminal.gameOver,'blocked spawn');const snap=()=>JSON.stringify([active(terminal),terminal.score,count(terminal),terminal.hold]);const frozen=snap();terminal.moveHorizontal(1);terminal.rotate(1);terminal.hardDrop();terminal.holdPiece();advance(terminal,1000);eq(snap(),frozen,'inert terminal');terminal.restart();eq([terminal.gameOver,count(terminal),terminal.score,terminal.lines,terminal.level,terminal.hold,terminal.canHold],[false,0,0,0,1,null,true],'restart');
  return out;
}

export async function loadLow(copy) {
  const handlers={},elements={},context={console:{log(){}},Math:Object.create(Math),__pending:0,requestAnimationFrame(){context.__pending++;return 1;}};
  context.Math.random=()=>.314159265;
  context.document={getElementById(id){return elements[id]??=(id==='game'?{width:320,height:640,getContext:()=>new Proxy({},{get:()=>()=>{}})}:{textContent:''});},addEventListener(t,cb){handlers[t]=cb;},dispatchEvent(e){handlers[e.type]?.(e);}};
  vm.createContext(context);vm.runInContext(fs.readFileSync(resolve(copy,'dist/main.js'),'utf8')+lowAccess,context);return {api:context.__low,context};
}

export async function auditCopy(copy,mode) {
  let evidence;
  if(mode==='low'){const {api}=await loadLow(copy);evidence=runLow(api,reference);}
  else if(mode==='medium'){
    const require=createRequire(import.meta.url),m=require(resolve(copy,'dist/game.js'));evidence=runMedium(m,reference);
    const context={exports:{},require:()=>m,console,requestAnimationFrame(){},window:{addEventListener(){}},document:{getElementById:id=>id==='c'?{getContext:()=>new Proxy({},{get:()=>()=>{}})}:{textContent:''}}};
    vm.createContext(context);vm.runInContext(fs.readFileSync(resolve(copy,'dist/main.js'),'utf8')+mediumAccess,context);
    evidence.clock=runMediumClock(context.__medium,m);
  }
  else {const base=pathToFileURL(resolve(copy,'dist')).href+'/';const modules={game:await import(base+'game.js'),pieces:await import(base+'pieces.js')};const a=mimoAdapter(modules);evidence=runMimo(a,{reference,normalKicks,iKicks});
  }
  try {assertRecorded(evidence);}catch(error){console.error(JSON.stringify(evidence));throw error;}return evidence;
}

export function assertRecorded(e) {
  assert.equal(e.bags,100);
  if(e.mode==='low'){
    assert.equal(e.b2b,1600);assert.equal(e.comboIncrement,200);
    assert.deepEqual(e.soft,{y:1,score:0});assert.deepEqual(e.hard,{count:4,score:0});assert.deepEqual(e.normal,[100,300,500,800]);assert.equal(e.pc,100);assert.equal(e.at500,0);assert.equal(e.at1001,4);assert.deepEqual(e.gravity,[1001,501,201,101]);assert.equal(e.terminalMoves,1);assert.deepEqual(e.restart,{over:false,count:0,score:0});assert.equal(e.restartScheduled,0);assert.equal(e.fullSpinSingle,100);
    assert.deepEqual(e.states,['I1','I2','I3','J1','J2','L1','L2','S1','S2','T1','T2','Z1','Z2']);assert.deepEqual(e.floor,{x:3,y:18,shape:[[0,1,0],[1,1,1]]});
  } else if(e.mode==='medium'){
    assert.equal(e.b2b,1600);assert.equal(e.comboIncrement,200);
    assert.deepEqual(e.normal,[100,300,500,800]);assert.equal(e.pc,100);assert.deepEqual(e.gravity,[800,717,467,100]);assert.equal(e.ghosts.length,7);assert.deepEqual(e.clock,{at500:0,at800:4,heldRows:1});assert.deepEqual(e.states,['I2','I3','S2','S3','Z2','Z3']);assert.deepEqual(e.floor,{type:2,rot:1,x:3,y:17});assert.equal(e.fullSpinSingle,100);assert.deepEqual(e.hidden,{pose:{type:2,rot:0,x:0,y:-2},over:false,count:6});
  } else {
    assert.deepEqual(e.kickMismatches,[]);assert.equal(e.capturedTransitions,48);assert.deepEqual(e.refresh,{'2':[1,1],'10':[9,9],'15':[6,6]});
    assert.deepEqual(e.floor.I,{success:true,pose:{type:'I',rot:1,x:4,y:16}});
    assert.deepEqual(e.floor.T,{success:true,pose:{type:'T',rot:1,x:2,y:17}});
    assert.deepEqual(e.soft,{rows:17,points:17});assert.equal(e.at500,4);assert.deepEqual(e.cap,[0,4]);assert.deepEqual(e.landing,[0,0]);
    assert.deepEqual(e.gravity,[1000,793,356,94,65,17,17,17]);
    assert.deepEqual(e.scores,{normal1:100,normal2:300,normal3:500,normal4:800,singlePc:200,b2b:2000,break:2150,combo:300,crossing:[100,10,2],b2bPc:2800,'hard-mini-zero':0,'hard-mini-single':100,'hard-full-zero':0,'hard-full-single':800,'timed-mini-zero':0,'timed-mini-single':100,'timed-full-zero':0,'timed-full-single':800,hardDouble:1200,timedDouble:1200});
  }
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname)){
  const e=await auditCopy(process.argv[2],process.argv[3]);console.log(JSON.stringify(e));console.log(`${e.mode}: canonical engine, scoring, clocks and findings asserted`);
}
