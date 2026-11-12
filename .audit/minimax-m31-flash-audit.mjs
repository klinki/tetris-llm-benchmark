// Independent visible-coordinate fixtures. No application rule bodies are replaced.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {reference,normalKicks,iKicks} from './opus55-efforts-audit.mjs';
export {reference,normalKicks,iKicks};
export function createAdapter(m,mode){
 const offset={max:2,xhigh:0,high:2,medium:4,low:0}[mode],hidden={max:2,xhigh:4,high:2,medium:4,low:0}[mode];
 const seeded=seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
 const make=(seed=42)=>{const random=seeded(seed);let g;if(mode==='max'){g=new m.game.Game({randomizer:new m.bag.SevenBag(random)});g.reset();}else if(mode==='xhigh')g=new m.game.Game({random});else if(mode==='low'){const old=Math.random;try{Math.random=random;g=new m.game.Game();const r=new m.bag.Randomizer(),next=r.next.bind(r);r.next=()=>{const old=Math.random;try{Math.random=random;return next();}finally{Math.random=old;}};g.randomizer=r;g.newGame();g.start();}finally{Math.random=old;}}else{g=new m.game.Game(random);if(mode==='medium')g.start();}return g;};
 const native=g=>mode==='low'||mode==='xhigh'?g.active:g.current;
 const active=g=>{const p=native(g);return p&&{type:p.type,rotation:p.rotation,x:p.x-(p.type==='O'?1:0),y:p.y-offset};};
 const local=(t,r)=>{let cs=mode==='max'?m.pieces.getCells(t,r):mode==='low'?m.board.cellsOf(t,r):mode==='high'?m.pieces.cellsOf(t,r):m.pieces.pieceCells(t,r);return cs.map(c=>Array.isArray(c)?c:[c.x??c.dx,c.y??c.dy]).map(([x,y])=>[x+(t==='O'?1:0),y]);};
 const cells=p=>local(p.type,p.rotation).map(([x,y])=>[x+p.x,y+p.y]);
 const get=(g,x,y)=>{if(y< -hidden||y>=20||x<0||x>9)return null;const yy=y+offset;return mode==='max'?g.board.cellAt(x,yy):mode==='xhigh'?g.board.valueAt(x,yy):mode==='low'?g.board.get(x,yy):g.board.cells[yy*10+x];};
 const put=(g,x,y)=>{if(y< -hidden||y>=20||x<0||x>9)throw Error('stack outside storage');const yy=y+offset;if(mode==='max')g.board.setCell(x,yy,'J');else if(mode==='xhigh')g.board.set(x,yy,1);else g.board.cells[yy*10+x]=mode==='low'?'J':1;};
 const count=g=>{let n=0;for(let y=-hidden;y<20;y++)for(let x=0;x<10;x++)if(get(g,x,y))n++;return n;};
 const fits=(g,p)=>cells(p).every(([x,y])=>x>=0&&x<10&&y<20&&((mode==='max'||mode==='xhigh'||mode==='high')?y>=-hidden:true)&&!get(g,x,y));
 const place=(g,t,r,x,y)=>{const p={type:t,rotation:r,x:x+(t==='O'?1:0),y:y+offset};if(mode==='low'||mode==='xhigh')g.active=p;else g.current=p;if(!fits(g,active(g)))throw Error('colliding setup '+JSON.stringify(active(g)));};
 const move=(g,d)=>mode==='xhigh'?g.move(d):d<0?g.moveLeft():g.moveRight();
 const rotate=(g,d)=>g.rotate(d),hard=g=>g.hardDrop(),clear=g=>{if(g.board.clear)g.board.clear();else g.board.cells.fill(0);};
 const settle=g=>{if(mode==='medium'&&!g.current)g.update(100);};
 const step=(g,ms)=>mode==='max'?g.tick(ms):g.update(ms),advance=(g,ms)=>{while(ms>1e-8){const dt=Math.min(16,ms);step(g,dt);ms-=dt;}};
 const ghost=g=>{const p=mode==='max'?g.ghost:mode==='high'?g.ghost():null;return(p?p.y:mode==='medium'?g.ghostY:g.ghostY())-offset;};
 const hold=g=>mode==='xhigh'?g.hold():g.holdPiece(),held=g=>mode==='xhigh'?g.heldPiece:g.hold,queue=g=>g.queue;
 const soft=(g,on)=>mode==='low'?on&&g.softDrop():g.setSoftDrop(on);
 const over=g=>(mode==='low'?g.state:g.status)==='gameover';
 const restart=g=>{if(mode==='low'){g.newGame();g.start();}else if(mode==='medium')g.restart();else g.reset();};
 const spawn=(g,t)=>mode==='medium'?g.spawnPiece(t):g.spawn(t);
 const capture=(g,from,to)=>{const seen=[],p=native(g),save=(x,y)=>{seen.push([x-p.x,y-p.y]);};if(mode==='max')g.board.collides=q=>{save(q.x,q.y);return true;};else if(mode==='high')g.board.collides=(t,r,x,y)=>{save(x,y);return true;};else if(mode==='xhigh')g.board.fits=(t,r,x,y)=>{save(x,y);return false;};else{g.board[mode==='low'?'fits':'canPlace']=(cs,x,y)=>{save(x,y);return false;};}rotate(g,(to-from+4)%4===1?1:-1);return seen;};
 return {mode,hidden,make,active,local,cells,get,put,count,fits,place,move,rotate,hard,clear,settle,step,advance,ghost,hold,held,queue,soft,over,restart,spawn,capture};
}
export function runProbes(a,oracle){
 const {mode,hidden,make,active,local,cells,get,put,count,fits,place,move,rotate,hard,clear,settle,step,advance,ghost,hold,held,queue,soft,over,restart,spawn,capture}=a;
 const {reference,normalKicks,iKicks}=oracle,e={mode},key=cs=>cs.map(c=>c.join(',')).sort().join(' '),eq=(v,w,msg)=>{if(JSON.stringify(v)!==JSON.stringify(w))throw Error(msg+': '+JSON.stringify({v,w}));},types=Object.keys(reference);
 e.states=[];for(const t of types)for(let r=0;r<4;r++)if(key(local(t,r))!==key(reference[t][r]))e.states.push(t+r);
 e.kicks=[];for(const t of types.filter(t=>t!=='O'))for(const tr of Object.keys(normalKicks)){const[from,to]=tr.split('>').map(Number),g=make();place(g,t,from,3,8);const got=capture(g,from,to),want=(t==='I'?iKicks:normalKicks)[tr].map(([x,y])=>[x,-y||0]);if(JSON.stringify(got)!==JSON.stringify(want))e.kicks.push({t,tr,got,want});}
 let seed=0x5532;const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);const canon=p=>reference[p.type][p.rotation].map(([x,y])=>[x+p.x,y+p.y]);
 const legal=(g,p)=>canon(p).every(([x,y])=>x>=0&&x<10&&y<20&&!get(g,x,y));
 e.rotations={total:0,mismatches:0,examples:[]};for(const t of types.filter(t=>t!=='O'))for(let r=0;r<4;r++)for(const d of [-1,1])for(let sample=0;sample<12;sample++){
  const g=make(),cs=[...reference[t][r],...local(t,r)],x=[-Math.min(...cs.map(c=>c[0])),3,9-Math.max(...cs.map(c=>c[0]))][sample%3],y=[Math.max(-2,-hidden),8,19-Math.max(...cs.map(c=>c[1]))][Math.floor(sample/3)%3];place(g,t,r,x,y);
  const before=active(g),occupied=new Set([...cells(before),...canon(before)].map(c=>c.join(','))),stack=[];for(let yy=Math.max(-hidden,y-2);yy<=Math.min(19,y+4);yy++)for(let xx=0;xx<10;xx++)if(!occupied.has(`${xx},${yy}`)&&rng()<.28){put(g,xx,yy);stack.push([xx,yy]);}
  const to=(r+d+4)%4,offsets=(t==='I'?iKicks:normalKicks)[`${r}>${to}`].map(([dx,dy])=>[dx,-dy]),i=offsets.findIndex(([dx,dy])=>legal(g,{...before,rotation:to,x:x+dx,y:y+dy})),want=i<0?before:{...before,rotation:to,x:x+offsets[i][0],y:y+offsets[i][1]};rotate(g,d);const got=active(g);e.rotations.total++;if(JSON.stringify(got)!==JSON.stringify(want)){e.rotations.mismatches++;if(e.rotations.examples.length<6)e.rotations.examples.push({before,d,stack,got,want});}}
 e.bags=0;for(let s=1;s<=10;s++){const g=make(s);for(let b=0;b<10;b++){const bag=[];for(let i=0;i<7;i++){bag.push(active(g).type);clear(g);hard(g);settle(g);}eq(bag.sort(),types.slice().sort(),'bag');e.bags++;}}
 {const g=make(),first=active(g).type;rotate(g,1);hold(g);eq(held(g),first,'held');const second=active(g);hold(g);eq(active(g),second,'hold restriction');clear(g);hard(g);settle(g);hold(g);eq([active(g).type,active(g).rotation],[first,0],'hold retrieval');e.hold='pass';}
 e.ghosts=[];for(const t of types){const g=make();place(g,t,0,3,0);put(g,4,16);const p=active(g);let y=p.y;while(fits(g,{...p,y:y+1}))y++;eq(ghost(g),y,'ghost');hard(g);eq(g.score,2*(y-p.y),'drop');eq(count(g),5,'four welded');for(const[x,yy]of cells({...p,y}))if(!get(g,x,yy))throw Error('missing welded cell');e.ghosts.push([t,y]);}
 {const g=make();for(const y of [16,18])for(let x=0;x<10;x++)put(g,x,y);put(g,2,15);let n;if(mode==='medium')n=g.board.clearFullRows();else if(mode==='high'){const rows=g.board.findFullRows();n=rows.length;g.board.clearRows(rows);}else n=g.board.clearLines();eq([n,Boolean(get(g,2,17))],[2,true],'compaction');e.compaction='pass';}
 const clock=(g,max=8000)=>{let t=0,land=null;while(count(g)<5&&t<max){step(g,1);t++;if(land===null&&active(g)?.y===18)land=t;}return{land,lock:t,count:count(g)};};
 {const g=make();place(g,'O',0,3,18);advance(g,499);const at499=count(g);step(g,1);e.grounded=[at499,count(g)];}
 {const g=make();place(g,'O',0,3,18);advance(g,490);move(g,1);advance(g,499);const at499=count(g);step(g,1);e.resetClock=[at499,count(g)];}
 {const g=make();place(g,'O',0,3,18);for(let i=0;i<15;i++){advance(g,10);move(g,i%2?-1:1);}advance(g,499);const before=count(g);move(g,-1);step(g,1);e.cap=[before,count(g)];}
 {const g=make();place(g,'O',0,-1,18);advance(g,490);for(let i=0;i<5;i++){move(g,-1);step(g,2);}e.failedClock=count(g);}
 {const g=make();place(g,'O',0,3,17);advance(g,990);step(g,16);let t=1006;while(count(g)===0&&t<2000){step(g,1);t++;}e.contactLock=t;}
 for(const exhausted of [false,true]){const g=make();place(g,'O',0,-1,12);put(g,0,14);if(exhausted)for(let i=0;i<15;i++){step(g,1);move(g,i%2?-1:1);}advance(g,490);move(g,1);advance(g,20);const airborne=count(g);const c=clock(g);e[exhausted?'exhaustedLedge':'ledge']={airborne,...c};}
 {const g=make();place(g,'O',0,-1,12);put(g,0,14);put(g,1,14);for(let i=0;i<15;i++)move(g,i%2?-1:1);advance(g,490);move(g,1);advance(g,1000);e.newLowest={resets:g.lockResets,pose:active(g)};}
 {const g=make();place(g,'O',0,3,18);for(let i=0;i<15;i++)move(g,i%2?-1:1);advance(g,100);move(g,-1);step(g,1);e.sixteenthEarly=count(g);}
 {const g=make();place(g,'T',0,3,5);for(let i=0;i<15;i++)move(g,i%2?-1:1);e.airResets=g.lockResets;}
 e.gravity=[];for(let level=1;level<=20;level++){const g=make();g.level=level;g.lines=(level-1)*10;place(g,'O',0,3,0);let t=0;while(active(g)?.y===0&&t<2000){step(g,1);t++;}e.gravity.push(t);}
 e.refresh=[];for(const hz of [60,144]){const g=make();g.level=10;place(g,'O',0,3,0);let t=0;while(t<600-1e-8){const dt=Math.min(1000/hz,600-t);step(g,dt);t+=dt;}e.refresh.push(active(g).y);}
 {const g=make();place(g,'O',0,3,0);advance(g,800);soft(g,true);step(g,1);e.softEntry={y:active(g).y,score:g.score};soft(g,false);advance(g,999);e.softRelease=active(g).y;}
 {const g=make();place(g,'O',0,3,0);advance(g,800);hold(g);const y=active(g).y;advance(g,999);e.holdClock=[active(g).y-y];step(g,1);e.holdClock.push(active(g).y-y);}
 const well=(g,n,pc=false)=>{clear(g);for(let y=20-n;y<20;y++)for(let x=0;x<10;x++)if(x!==4)put(g,x,y);if(!pc)put(g,0,10);place(g,'I',1,2,16);};
 const pcWell=(g,n)=>{clear(g);const p=n===1?{type:'I',rotation:0,x:3,y:18}:n===2?{type:'O',rotation:0,x:3,y:18}:n===3?{type:'T',rotation:1,x:3,y:17}:{type:'I',rotation:1,x:2,y:16};const occupied=new Set(cells(p).map(c=>c.join(',')));for(let y=20-n;y<20;y++)for(let x=0;x<10;x++)if(!occupied.has(`${x},${y}`))put(g,x,y);place(g,p.type,p.rotation,p.x,p.y);};
 const s=e.scores={};for(let n=1;n<=4;n++){const g=make();well(g,n);hard(g);eq(g.lines,n,'normal lines');s['normal'+n]=g.score;const p=make();pcWell(p,n);hard(p);eq(count(p),0,'pc empty');s['pc'+n]=p.score;}
 const filler=g=>{clear(g);settle(g);place(g,'O',0,7,18);hard(g);settle(g);};
 {const g=make();well(g,4);hard(g);settle(g);well(g,4);hard(g);s.consecutive=g.score;}
 {const g=make();well(g,4);hard(g);filler(g);well(g,4);hard(g);s.b2b=g.score;settle(g);well(g,1);hard(g);s.break=g.score;}
 {const g=make();g.level=2;g.lines=10;well(g,1);hard(g);settle(g);const b=g.score;well(g,1);hard(g);s.level2Combo=g.score-b;}
 {const g=make();g.lines=9;well(g,1);hard(g);s.crossing=[g.score,g.lines,g.level];}
 {const g=make();well(g,4);hard(g);filler(g);well(g,4,true);hard(g);s.b2bPc=g.score;}
 for(const timed of [false,true])for(const full of [false,true])for(const line of [false,true]){const g=make();for(const[x,y]of [[5,17],[3,19],full?[3,17]:[5,19]])put(g,x,y);if(line)for(const x of [0,1,2,6,7,8,9])put(g,x,18);place(g,'T',3,3,17);eq(rotate(g,1),true,'real spin rotation');eq(ghost(g),17,'zero travel');if(timed)advance(g,500);else hard(g);s[`${timed?'timed':'hard'}-${full?'full':'mini'}-${line?'single':'zero'}`]=g.score;}
 for(const method of ['hard','soft']){const g=make();for(const[x,y]of [[0,17],[0,19],[2,19]])put(g,x,y);place(g,'T',0,0,3);eq(rotate(g,1),true,'travel rotation');eq(ghost(g),17,'14 rows');if(method==='soft'){if(mode==='low'||mode==='medium')for(let i=0;i<14;i++)g.softDrop();else{soft(g,true);while(active(g).y<17)step(g,1);soft(g,false);}}const before=g.score;hard(g);s[method+'DownExtra']=g.score-before;}
 {const g=make();for(const[x,y]of [[3,18],[5,18],[4,19]])put(g,x,y);place(g,'T',1,3,16);rotate(g,1);advance(g,500);s.twoCorners=g.score;}
 {const g=make();for(const[x,y]of [[4,15],[6,15],[6,17],[3,18],[6,18],[3,16]])put(g,x,y);place(g,'T',1,3,17);rotate(g,1);s.fifthPose=active(g);hard(g);s.fifthScore=g.score;}
 {const g=make();for(const[x,y]of [[5,17],[3,19],[3,17]])put(g,x,y);place(g,'T',3,3,17);rotate(g,1);move(g,-1);if(mode==='low'||mode==='medium')g.softDrop();hard(g);s.failedActions=g.score;}

 {const g=make();g.lines=9;pcWell(g,1);hard(g);s.pcCrossing=[g.score,g.level];}
 for(const timed of [false,true]){const g=make();for(let x=0;x<10;x++){if(x!==4)put(g,x,19);if(x<3||x>5)put(g,x,18);}put(g,3,17);place(g,'T',0,3,17);rotate(g,1);rotate(g,1);if(timed)advance(g,500);else hard(g);s[timed?'timedDouble':'hardDouble']=g.score;}
 {const g=make();const mini=()=>{clear(g);settle(g);for(const[x,y]of [[5,17],[3,19],[5,19]])put(g,x,y);for(const x of [0,1,2,6,7,8,9])put(g,x,18);place(g,'T',3,3,17);rotate(g,1);};mini();hard(g);const before=g.score;mini();hard(g);s.secondMini=g.score-before;}
 {const g=make();for(const[x,y]of [[3,17],[5,17],[3,19]])put(g,x,y);place(g,'T',0,3,17);hard(g);s.noRotation=g.score;}
 {const g=make();place(g,'O',0,-1,12);put(g,0,14);put(g,1,14);for(let i=0;i<15;i++)move(g,i%2?-1:1);advance(g,490);move(g,1);while(active(g)?.y!==18&&count(g)===2)step(g,1);advance(g,400);move(g,-1);advance(g,100);e.newLowestMove=count(g);}
 if(mode==='max'){const g=make();place(g,'T',0,3,5);g.togglePause();hard(g);e.pauseCells=count(g);}
 if(mode==='low'){const g=make();put(g,0,0);place(g,'O',0,-1,-2);queue(g)[0]='I';hard(g);e.lowHidden={over:over(g),count:count(g)};}
 if(hidden>=2){const g=make();place(g,'S',1,-1,-2);put(g,2,-2);put(g,0,0);rotate(g,-1);e.ceilingS=active(g);}
 e.hidden=[];if(hidden)for(const partial of [false,true]){const g=make();put(g,0,partial?1:0);place(g,'O',0,-1,partial?-1:-2);queue(g)[0]='I';hard(g);settle(g);e.hidden.push({partial,over:over(g),cells:count(g)});}
 {const g=make();for(let y=0;y<=2;y++)for(const x of [3,4,5,6])put(g,x,y);spawn(g,'T');e.blocked=over(g);const before=JSON.stringify([active(g),count(g),g.score,held(g)]);move(g,1);rotate(g,1);hold(g);hard(g);advance(g,1000);e.terminal=JSON.stringify([active(g),count(g),g.score,held(g)])===before;restart(g);e.reset=[over(g),count(g),g.score,g.lines,g.level,held(g)];}
 e.restartBags=[];for(const seed of [1,2,42]){const g=make(seed);let n=0;while(!over(g)&&n++<100){hard(g);settle(g);}restart(g);const bag=[];for(let i=0;i<7;i++){bag.push(active(g).type);clear(g);hard(g);settle(g);}e.restartBags.push(new Set(bag).size);}
 return e;
}
export function assertRecorded(e){
 const saved=JSON.parse(readFileSync(new URL('./minimax-m31-flash-engine-results.json',import.meta.url),'utf8'));
 assert.deepEqual(JSON.parse(JSON.stringify(e)),saved[e.mode],'Complete recorded outcome, not a conformance pass');
 assert.equal(e.bags,100);assert.equal(e.hold,'pass');assert.equal(e.compaction,'pass');assert.equal(e.rotations.total,576);assert.deepEqual(e.grounded,[0,4]);assert.deepEqual(e.resetClock,[0,4]);assert.equal(e.failedClock,4);assert.equal(e.blocked,true);assert.deepEqual(e.reset,[false,0,0,0,1,null]);
 // Findings are pinned separately from the independent conformance expectations.
 const recorded={max:{states:['I3'],kickTransitions:2,hardDown:28,pc:100},xhigh:{states:[],kickTransitions:0,hardDown:128,pc:900},high:{states:[],kickTransitions:0,hardDown:128,pc:100},medium:{states:[],kickTransitions:0,hardDown:128,pc:900},low:{states:[],kickTransitions:3,hardDown:128,pc:100}}[e.mode];
 assert.deepEqual(e.states,recorded.states);assert.equal(e.kicks.length,recorded.kickTransitions);assert.equal(e.scores.hardDownExtra,recorded.hardDown);assert.equal(e.scores.pc1,recorded.pc);
}
export async function loadModules(root,mode){const load=f=>import(pathToFileURL(resolve(root,'dist',f)));const prefix=mode==='low'?'':'core/';return{game:await load(prefix+'game.js'),pieces:await load(prefix+'pieces.js'),board:await load(prefix+'board.js'),bag:await load(prefix+(mode==='xhigh'?'bag.js':'randomizer.js'))};}
if(process.argv[1]&&resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname)){const e=runProbes(createAdapter(await loadModules(process.argv[2],process.argv[3]),process.argv[3]),{reference,normalKicks,iKicks});console.log(JSON.stringify(e,null,2));assertRecorded(e);console.log('engine outcomes asserted');}
