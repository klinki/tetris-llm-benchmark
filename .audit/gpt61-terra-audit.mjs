// Equivalent fixtures against unchanged emitted engines; shared with Chromium.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {reference,normalKicks,iKicks} from './opus55-efforts-audit.mjs';
export {reference,normalKicks,iKicks};

export function accessors(mode) {
  const reset={low:'last=0;soft=0;keys.clear()',medium:'last=0;fall=lockTime=resets=0;paused=false;previewKey=""',high:'last=0',xhigh:'previous=0;down=false',max:'previousTime=0;heldKeys.clear()',ultra:'previousTime=0;paused=false'}[mode];
  return `\nglobalThis.__app={get game(){return game},colors,paint(){${mode==='xhigh'?'draw()':'render()'}},resetClock(){${reset}},${mode==='medium'?'setGame(g){game=g},action:act,':''}};`;
}
export function createAdapter(core,mode,clock) {
  const low=mode==='low',medium=mode==='medium',high=mode==='high',xh=mode==='xhigh',max=mode==='max',ultra=mode==='ultra';
  const offset=medium?2:xh||max?20:0,top=low||high?0:medium?-2:-20;
  const seeded=seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
  const make=(seed=42)=>new core.Game(seeded(seed));
  const native=g=>low||xh?g.current:g.active;
  const active=g=>{const p=native(g);return p&&{type:p.kind??p.type,rotation:p.rotation,x:p.x,y:p.y-(medium?2:0)};};
  const setActive=(g,p)=>{const v={x:p.x,y:p.y+(medium?2:0),rotation:p.rotation,...(max||ultra?{type:p.type}:{kind:p.type})};if(low||xh)g.current=v;else g.active=v;};
  const local=(type,rotation)=>{
    if(low)return make().cells({kind:type,rotation,x:0,y:0});
    if(xh)return core.blocks(type,rotation);
    const p={rotation,x:0,y:0,...(max||ultra?{type}:{kind:type})};
    return (max?core.pieceCells(p):core.cells(p)).map(c=>Array.isArray(c)?c:[c.x,c.y]);
  };
  const cells=p=>local(p.type,p.rotation).map(([x,y])=>[x+p.x,y+p.y]);
  const get=(g,x,y)=>{if(y<top)return null;return ultra&&y<0?g.hidden[y+20][x]:g.board[y+offset]?.[x]??null;};
  const put=(g,x,y,t='J')=>{if(y<top)throw Error('Unsupported fixture row '+y);(ultra&&y<0?g.hidden[y+20]:g.board[y+offset])[x]=t;};
  const clear=g=>{g.board.forEach(r=>r.fill(null));if(ultra)g.hidden.forEach(r=>r.fill(null));};
  const count=g=>g.board.flat().filter(Boolean).length+(ultra?g.hidden.flat().filter(Boolean).length:0);
  const fits=(g,p)=>cells(p).every(([x,y])=>x>=0&&x<10&&y<20&&(y<top||!get(g,x,y)));
  const over=g=>max?g.status==='gameover':xh||ultra?g.gameOver:g.over;
  const move=(g,dx)=>medium?clock.action(g,dx<0?'left':'right'):g.move(dx,0);
  const rotate=(g,d)=>medium?clock.action(g,d===1?'rotate':'rotateBack'):g.rotate(d),hard=g=>medium?clock.action(g,'drop'):g.hardDrop();
  const soft=g=>low?g.move(0,1,true):medium?clock.action(g,'down'):g.softDrop();
  const hold=g=>medium?clock.action(g,'hold'):high?g.swapHold():g.hold();
  const held=g=>medium||high?g.hold:g.held;
  const canHold=g=>high?!g.holdUsed:g.canHold;
  const queue=g=>ultra?g.next:g.queue;
  const ghost=g=>medium?g.ghost().y-2:xh?g.ghostY():max?g.ghost.y:g.ghost()?.y;
  const step=(g,ms,isSoft=false)=>medium?clock(g,ms):low?g.tick(ms):xh?g.tick(ms,isSoft):g.update(ms);
  const advance=(g,ms,isSoft=false)=>{while(ms>1e-8){const dt=Math.min(16,ms);step(g,dt,isSoft);ms-=dt;}};
  const place=(g,t,r,x,y)=>{setActive(g,{type:t,rotation:r,x,y});Object.assign(g,{gravityTime:0,gravityElapsed:0,lockTime:0,lockElapsed:0,lockResets:0,lastRotation:max?null:false,lastKick:0});if(!fits(g,active(g)))throw Error('Colliding fixture '+JSON.stringify(active(g)));};
  const spawn=(g,t)=>g.spawn(t);
  const incoming=(g,t)=>queue(g)[0]=t;
  const restart=g=>low||ultra?g.reset():medium?Object.assign(g,make(71)):g.restart();
  const capture=(g,from,to)=>{
    const seen=[],p=native(g);const name=max?'collides':medium||ultra?'fits':'valid';
    g[name]=q=>{if(q.rotation===to)seen.push([q.x-p.x,q.y-p.y]);return max;};rotate(g,(to-from+4)%4===1?1:-1);return seen;
  };
  return {mode,top,make,active,setActive,local,cells,get,put,clear,count,fits,over,move,rotate,hard,soft,hold,held,canHold,queue,ghost,step,advance,place,spawn,incoming,restart,capture};
}

export function runProbes(a,oracle) {
  const {reference,normalKicks,iKicks}=oracle;
  const {mode,make,active,local,cells,get,put,clear,count,fits,over,move,rotate,hard,soft,hold,held,canHold,queue,ghost,step,advance,place,spawn,incoming,restart,capture}=a;
  const eq=(v,w,m)=>{if(JSON.stringify(v)!==JSON.stringify(w))throw Error(m+': '+JSON.stringify({actual:v,expected:w}));};
  const check=(v,m)=>{if(!v)throw Error(m);},key=cs=>cs.map(c=>c.join(',')).sort().join(' '),types=Object.keys(reference),out={mode};
  for(const t of types)for(let r=0;r<4;r++)eq(key(local(t,r)),key(reference[t][r]),'state '+t+r);
  let transitions=0;for(const t of types.filter(t=>t!=='O'))for(const tr of Object.keys(normalKicks)){
    const[from,to]=tr.split('>').map(Number),g=make();place(g,t,from,3,8);
    eq(capture(g,from,to),(t==='I'?iKicks:normalKicks)[tr].map(([x,y])=>[x,-y||0]),'ordered '+t+tr);transitions++;
  }out.srs={states:28,orderedTransitions:transitions};
  out.floor={};for(const t of ['I','T']){const g=make();place(g,t,0,3,18);check(rotate(g,1),'floor kick');out.floor[t]=active(g);}
  for(const t of ['I','T'])for(const side of [-1,1]){const g=make(),r=side<0?1:3,x=side<0?-Math.min(...local(t,r).map(c=>c[0])):9-Math.max(...local(t,r).map(c=>c[0]));place(g,t,r,x,8);check(rotate(g,side<0?-1:1),'wall kick');eq(active(g).x,side<0?0:t==='I'?6:7,'wall kick displacement');}
  for(const t of types){const g=make();place(g,t,0,3,8);for(const d of [-1,1]){for(let i=0;i<20;i++)move(g,d);const xs=cells(active(g)).map(c=>c[0]);eq(d<0?Math.min(...xs):Math.max(...xs),d<0?0:9,'walls');}}
  for(let seed=1;seed<=10;seed++){const g=make(seed);for(let b=0;b<10;b++){const bag=[];for(let i=0;i<7;i++){bag.push(active(g).type);clear(g);hard(g);check(!over(g),'bag play');}eq(bag.sort(),[...types].sort(),'bag');}}out.bags=100;
  {const g=make(),first=active(g).type,next=queue(g)[0];rotate(g,1);hold(g);eq(active(g).type,next,'hold queue');eq(held(g),first,'held type');check(!canHold(g),'restricted');const p=active(g);hold(g);eq(active(g),p,'hold inert');clear(g);hard(g);hold(g);eq(active(g).type,first,'retrieve');eq(active(g).rotation,0,'held orientation');}
  {const g=make();place(g,'O',0,3,0);advance(g,800);hold(g);const y=active(g).y;advance(g,999);eq(active(g).y,y,'fresh hold clock 999');step(g,1);eq(active(g).y,y+1,'fresh hold clock 1000');}
  {const g=make();place(g,'O',0,3,18);soft(g);step(g,1);eq(count(g),0,'grounded soft cannot lock');}
  out.ghosts=[];for(const t of types){const g=make();place(g,t,0,3,0);put(g,4,16);const p=active(g),y=ghost(g);check(fits(g,{...p,y})&&!fits(g,{...p,y:y+1}),'independent ghost');hard(g);eq(g.score,2*(y-p.y),'drop points');eq(count(g),5,'four cells');for(const[x,yy]of cells({...p,y}))check(get(g,x,yy),'weld coords');out.ghosts.push(y);}
  {const g=make();place(g,'O',0,3,18);advance(g,499);eq(count(g),0,'499');step(g,1);eq(count(g),4,'500');}
  {const g=make();place(g,'O',0,3,18);advance(g,490);move(g,1);advance(g,20);eq(count(g),0,'reset');}
  {const g=make();place(g,'O',0,3,18);for(let i=0;i<15;i++){advance(g,10);move(g,i%2?-1:1);}advance(g,490);out.cap=[count(g)];move(g,-1);advance(g,10);out.cap.push(count(g));}
  {const g=make();place(g,'O',0,-1,18);advance(g,490);check(!move(g,-1),'failed move');advance(g,10);eq(count(g),4,'failed no reset');}
  {const g=make();place(g,'O',0,3,17);advance(g,990);step(g,16);advance(g,483);out.landing=[count(g)];step(g,1);out.landing.push(count(g));}
  {const g=make();place(g,'O',0,-1,12);put(g,0,14);advance(g,490);move(g,1);advance(g,20);eq(count(g),1,'ledge airborne');out.ledgeSafe=true;}
  {const g=make();place(g,'O',0,-1,12);put(g,0,14);for(let i=0;i<15;i++)rotate(g,1);advance(g,490);move(g,1);let elapsed=0,landedAt=null;while(!get(g,1,19)&&elapsed<9000){step(g,1);elapsed++;if(landedAt===null&&active(g)?.y===18)landedAt=elapsed;}out.exhaustedLedge={landedAt,lockedAt:elapsed};}
  const well=(g,n,pc=false)=>{clear(g);for(let y=20-n;y<20;y++)for(let x=0;x<10;x++)if(x!==4)put(g,x,y);if(!pc)put(g,0,10);place(g,'I',1,2,16);};
  const pcSingle=g=>{clear(g);for(let x=0;x<10;x++)if(x<3||x>6)put(g,x,19);place(g,'I',0,3,18);};
  const filler=g=>{clear(g);place(g,'O',0,7,18);hard(g);};
  const scores={};for(const n of [1,2,3,4]){const g=make();well(g,n);hard(g);eq(g.lines,n,'line count');scores['normal'+n]=g.score;}
  {const g=make();pcSingle(g);hard(g);eq(count(g),0,'empty PC');scores.pc=g.score;}
  {const g=make();well(g,4);hard(g);filler(g);well(g,4);hard(g);scores.b2b=g.score;well(g,1);hard(g);scores.break=g.score;}
  {const g=make();g.level=2;g.lines=10;g.combo=0;well(g,1);hard(g);scores.combo=g.score;}
  {const g=make();g.lines=9;well(g,1);hard(g);scores.crossing=[g.score,g.lines,g.level];}
  {const g=make();well(g,4);hard(g);filler(g);well(g,4,true);hard(g);scores.b2bPc=g.score;}
  {const g=make();well(g,4);hard(g);well(g,4);hard(g);scores.consecutive=g.score;}
  function pocket(g,full,line){clear(g);put(g,5,17);put(g,3,19);put(g,full?3:5,full?17:19);if(line)for(const x of [0,1,2,6,7,8,9])put(g,x,18);place(g,'T',3,3,17);check(rotate(g,1),'final rotation');eq(active(g),{type:'T',rotation:0,x:3,y:17},'spin pose');eq(ghost(g),17,'zero travel');}
  for(const timed of [false,true])for(const full of [false,true])for(const line of [false,true]){const g=make();pocket(g,full,line);if(timed)advance(g,500);else hard(g);scores[`${timed?'timed':'hard'}-${full?'full':'mini'}-${line?'single':'zero'}`]=g.score;}
  for(const timed of [false,true]){const g=make();for(let x=0;x<10;x++){if(x!==4)put(g,x,19);if(x<3||x>5)put(g,x,18);}put(g,3,17);place(g,'T',0,3,17);check(rotate(g,1)&&rotate(g,1),'double rotations');if(timed)advance(g,500);else hard(g);scores[timed?'timedDouble':'hardDouble']=g.score;}
  {const g=make();for(const[x,y]of [[0,17],[0,19],[2,19]])put(g,x,y);place(g,'T',0,0,3);check(rotate(g,1),'cancel start rotation');while(ghost(g)>active(g).y)check(soft(g),'manual soft');const before=g.score;hard(g);scores.manualSoftExtra=g.score-before;}
  {const g=make();for(const[x,y]of [[0,17],[0,19],[2,19]])put(g,x,y);place(g,'T',0,0,3);check(rotate(g,1),'no rotation credit');place(g,'T',1,0,17);hard(g);scores.noRotation=g.score;}
  out.scores=scores;
  out.gravity=[];for(const level of [1,2,5,9,10,14,15,20]){const g=make();place(g,'O',0,3,0);g.level=level;let ms=0;while(active(g).y===0&&ms<2000){step(g,1);ms++;}eq(g.score,0,'no gravity points');out.gravity.push(ms);}
  out.refresh={};for(const[level,duration]of [[2,1480.001],[10,600],[15,100.001]]){out.refresh[level]=[];for(const hz of [60,144]){const g=make();place(g,'O',0,3,0);g.level=level;let t=0;while(t<duration-1e-8){const dt=Math.min(1000/hz,duration-t);step(g,dt);t+=dt;}out.refresh[level].push(active(g).y);}}
  if(mode==='xhigh'){const g=make();place(g,'O',0,3,0);advance(g,800);soft(g);step(g,1,true);out.softTransition={rows:active(g).y,points:g.score};}
  // Fixed fixtures discovered by a bounded search and replayed from real
  // spawn. Only stack cells are assigned; no active pose/spin flag is injected.
  const common=[{stack:[[7,0]],path:['R','R','R','R']},{stack:[[7,0]],path:['R','R','R','CCW']}];
  const fixtures=mode==='low'?[{stack:[[0,1],[0,0],[8,0],[2,2],[8,1],[9,2]],path:['L','L','CW','CW','CW','CW']},{stack:[[1,2],[3,0],[9,3],[8,1],[1,3],[2,3]],path:['CW','CW','L','CCW','CCW','L','CW','CW','R']}]:['high','max'].includes(mode)?[{stack:[[7,0],[2,0],[4,3],[3,3],[3,1],[6,2],[5,1]],path:['R','CCW','CCW','R']},{stack:[[7,1],[8,1]],path:['R','R','R','R']}]:common;
  out.hidden=[];
  for(const [index,fixture]of fixtures.entries()){
    const g=make();clear(g);for(const[x,y]of fixture.stack)put(g,x,y);spawn(g,'T');const start=active(g);incoming(g,'I');check(!over(g),'open T spawn');
    const inc=make();spawn(inc,'I');const incomingPose=active(inc);
    for(const action of fixture.path)check(action==='L'||action==='R'?move(g,action==='L'?-1:1):rotate(g,action==='CW'?1:-1),'public replay action');
    const pose=active(g),ys=cells(pose).map(c=>c[1]);check(index?ys.some(y=>y<0)&&ys.some(y=>y>=0):ys.every(y=>y<0),'whole/partial extent');eq(ghost(g),pose.y,'zero travel');
    check(fits(g,incomingPose)&&cells(incomingPose).every(c=>!cells(pose).some(d=>key([c])===key([d]))),'incoming independently open');
    hard(g);out.hidden.push({...fixture,start,pose,incoming:incomingPose,over:over(g)});
  }
  {const g=make();clear(g);spawn(g,'T');{const[x,y]=cells(active(g)).find(c=>c[1]>=a.top);put(g,x,y);}place(g,'O',0,0,18);incoming(g,'T');hard(g);check(over(g),'blocked spawn');const snap=()=>JSON.stringify([active(g),count(g),g.score,held(g)]),before=snap();move(g,1);rotate(g,1);soft(g);hard(g);hold(g);advance(g,1000);out.terminalInert=snap()===before;if(mode==='medium'){const beforeDirect=snap(),scoreBefore=g.score;g.hardDrop();out.directTerminalInert=snap()===beforeDirect;out.directTerminalDelta=g.score-scoreBefore;}restart(g);eq([over(g),count(g),g.score,g.lines,g.level,held(g),canHold(g)],[false,0,0,0,1,null,true],'restart');}
  {const g=make();let n=0;while(!over(g)&&n++<100)hard(g);check(over(g),'actual topout');restart(g);const bag=[];for(let i=0;i<7;i++){bag.push(active(g).type);clear(g);hard(g);}eq(new Set(bag).size,7,'fresh restart bag');}
  return out;
}

export async function loadCopy(copy,mode) {
  const core=mode==='low'?createRequire(import.meta.url)(resolve(copy,'dist/game.js')):await import(pathToFileURL(resolve(copy,'dist/game.js')));
  let clock;
  if(mode==='medium'){
    const canvas={width:300,height:600,getContext:()=>new Proxy({},{get:()=>()=>{}})},el=()=>({textContent:'',style:{},classList:{toggle(){}},addEventListener(){},append(){},innerHTML:''});
    const context={Game:core.Game,cells:core.cells,console,performance:{now:()=>0},requestAnimationFrame(){},window:{addEventListener(){}},document:{querySelector:s=>s==='#board'||s==='#hold'?canvas:el(),querySelectorAll:()=>[],createElement:t=>t==='canvas'?canvas:el()}};
    vm.createContext(context);const source=fs.readFileSync(resolve(copy,'dist/main.js'),'utf8').replace(/^import .*?;\s*/,'');vm.runInContext(source+accessors(mode)+'\nglobalThis.__drive=frame;',context);
    let current=null,time=0;const attach=g=>{if(current!==g){current=g;time=0;context.__app.setGame(g);context.__app.resetClock();}};clock=(g,ms)=>{attach(g);time+=ms;context.__drive(time);};clock.action=(g,action)=>{attach(g);const before=JSON.stringify(g.active);context.__app.action(action);return before!==JSON.stringify(g.active);};
  }
  return createAdapter(core,mode,clock);
}
export function assertRecorded(e) {
  assert.deepEqual(e.srs,{states:28,orderedTransitions:48});assert.equal(e.bags,100);assert.deepEqual(e.ghosts,Array(7).fill(14));
  const slow=['low','medium','xhigh'].includes(e.mode),pcMissing=['low','medium','high'].includes(e.mode);
  assert.deepEqual(e.floor,{I:{type:'I',rotation:1,x:4,y:16},T:{type:'T',rotation:1,x:2,y:17}});
  assert.deepEqual(e.cap,[0,4]);assert.equal(e.ledgeSafe,true);assert.equal(e.terminalInert,true);
  assert.deepEqual(e.landing,['max','ultra'].includes(e.mode)?[0,0]:[0,4]);
  assert.deepEqual(e.exhaustedLedge, e.mode==='max'?{landedAt:6000,lockedAt:6010}:e.mode==='high'?{landedAt:6000,lockedAt:6499}:e.mode==='ultra'?{landedAt:5510,lockedAt:6010}:{landedAt:5510,lockedAt:6009});
  assert.deepEqual(e.gravity,slow?[1000,793,356,94,65,16,16,16]:[1000,793,356,94,65,12,8,1]);
  assert.deepEqual(e.refresh,e.mode==='medium'?{'2':[1,1],'10':[9,8],'15':[6,5]}:{'2':[1,1],'10':[9,9],'15':slow?[6,6]:[14,14]});
  const scores={normal1:100,normal2:300,normal3:500,normal4:800,pc:pcMissing?100:900,b2b:2000,break:2150,combo:300,crossing:[100,10,2],b2bPc:pcMissing?2000:5200,consecutive:2050};
  for(const timed of [false,true])for(const full of [false,true])for(const line of [false,true])scores[`${timed?'timed':'hard'}-${full?'full':'mini'}-${line?'single':'zero'}`]=full||e.mode==='low'?(line?800:400):(line?200:100);
  Object.assign(scores,{hardDouble:1200,timedDouble:1200,manualSoftExtra:['medium','xhigh'].includes(e.mode)?100:0,noRotation:0});
  assert.deepEqual(e.scores,scores);
  assert.deepEqual(e.hidden.map(f=>f.over),[true,['low','high'].includes(e.mode)]);
  assert.deepEqual(e.hidden.map(f=>f.pose),e.mode==='low'?[{type:'T',rotation:0,x:0,y:-2},{type:'T',rotation:2,x:1,y:-2}]:['high','max'].includes(e.mode)?[{type:'T',rotation:2,x:6,y:-3},{type:'T',rotation:0,x:7,y:-1}]:[{type:'T',rotation:0,x:7,y:-2},{type:'T',rotation:3,x:7,y:-2}]);
  if(e.mode==='medium'){assert.equal(e.directTerminalInert,false);assert.equal(e.directTerminalDelta,40);}
  if(e.mode==='xhigh')assert.deepEqual(e.softTransition,{rows:17,points:17});
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname)){
  const a=await loadCopy(process.argv[2],process.argv[3]);const e=runProbes(a,{reference,normalKicks,iKicks});assertRecorded(e);console.log(JSON.stringify(e));
}
