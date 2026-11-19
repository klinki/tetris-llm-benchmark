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
export function probes({Game,shape,COLORS}) {
  const e = {srs:{states:28,kickLists:48,outcomes:0,mismatches:[]}, bags:0};
  const eq=(a,b,name)=>{if(JSON.stringify(a)!==JSON.stringify(b))throw Error(name+': '+JSON.stringify({actual:a,expected:b}));};
  const ok=(a,name)=>{if(!a)throw Error(name);};
  const rng=(seed=42)=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
  const make=(seed=42)=>{const g=new Game(rng(seed));g.play();return g;};
  const clear=g=>g.setUp({clear:true});
  const put=(g,x,y)=>g.setUp({stack:[[x,y,'J']]});
  const place=(g,kind,rotation,x,y)=>g.setUp({active:{kind,rotation,x,y}});
  const count=g=>g.board.flat().filter(Boolean).length;
  const key=c=>c.map(String).sort().join(' ');
  const types=Object.keys(reference);
  const cells=p=>reference[p.kind][p.rotation].map(([x,y])=>[x+p.x,y+p.y]);
  const fits=(g,p)=>cells(p).every(([x,y])=>x>=0&&x<10&&y>=-20&&y<20&&!g.board[y+20][x]);
  eq(new Set(Object.values(COLORS)).size,7,'colors');
  for(const k of types)for(let r=0;r<4;r++)eq(key(shape(k,r)),key(reference[k][r]),'state '+k+r);
  // Reject candidates only on sacrificial games, solely to observe the order.
  for(const k of types.filter(k=>k!=='O'))for(const tr of Object.keys(normalKicks)){
    const [r,n]=tr.split('>').map(Number),g=make(),seen=[];place(g,k,r,3,7);
    g.fits=p=>{seen.push([p.x-3,p.y-7]);return false;};
    eq(g.rotate((n-r+4)%4===1?1:-1),false,'rejected rotation');
    eq(seen,(k==='I'?iKicks:normalKicks)[tr].map(([x,y])=>[x,-y||0]),'kick list '+k+tr);
  }
  const random=rng(9123);
  for(const k of types.filter(k=>k!=='O'))for(let r=0;r<4;r++)for(const d of [-1,1])for(let sample=0;sample<12;sample++){
    const g=make(),cs=reference[k][r];
    const x=[-Math.min(...cs.map(p=>p[0])),3,9-Math.max(...cs.map(p=>p[0]))][sample%3];
    const y=[-20-Math.min(...cs.map(p=>p[1])),7,19-Math.max(...cs.map(p=>p[1])),15][Math.floor(sample/3)];
    place(g,k,r,x,y);const own=new Set(cells(g.active).map(String));
    for(let yy=Math.max(-20,y-2);yy<=Math.min(19,y+4);yy++)for(let xx=0;xx<10;xx++)if(!own.has([xx,yy].toString())&&random()<.23)put(g,xx,yy);
    const before={...g.active},n=(r+d+4)%4;let expected=before;
    for(const [dx,dy]of(k==='I'?iKicks:normalKicks)[r+'>'+n]){const p={kind:k,rotation:n,x:x+dx,y:y-dy};if(fits(g,p)){expected=p;break;}}
    g.rotate(d);eq(g.active,expected,'actual first-fitting SRS');e.srs.outcomes++;
  }
  for(let s=1;s<=10;s++){const g=make(s);for(let b=0;b<10;b++){const bag=[];for(let i=0;i<7;i++){bag.push(g.active.kind);clear(g);g.hardDrop();ok(g.status==='playing','bag game');}eq(bag.sort(),types.slice().sort(),'bag');e.bags++;}}
  {const g=make(),first=g.active.kind,next=g.queue[0];g.rotate(1);g.move(1);ok(g.hold(),'hold');eq([g.held,g.active.kind,g.canHold],[first,next,false],'first hold');const p={...g.active};eq(g.hold(),false,'hold restriction');eq(g.active,p,'hold unchanged');clear(g);g.hardDrop();const queue=[...g.queue];g.hold();eq(g.active,{kind:first,rotation:0,x:3,y:-1},'retrieved spawn');eq(g.queue,queue,'swap queue');e.hold='pass';}
  e.drops=[];
  for(const k of types){const g=make();place(g,k,0,3,1);put(g,4,16);let y=1;while(fits(g,{...g.active,y:y+1}))y++;eq(g.ghost().y,y,'independent ghost');g.softDrop();eq(g.score,1,'soft point');const dist=y-g.active.y;g.hardDrop();eq(g.score,1+dist*2,'hard points');eq(count(g),5,'weld');e.drops.push({kind:k,ghost:y,points:g.score});}
  e.clocks={};
  {const g=make();place(g,'O',0,3,18);g.update(499);eq(g.pieces,0,'499');g.update(1);eq(g.pieces,1,'500');e.clocks.boundary=[0,1];}
  {const g=make();place(g,'O',0,3,18);g.update(490);g.move(1);g.update(499);eq(g.pieces,0,'reset499');g.update(1);eq(g.pieces,1,'reset500');e.clocks.moveReset='pass';}
  {const g=make();place(g,'O',0,3,18);for(let i=0;i<15;i++){g.update(490);g.move(i%2?-1:1);}g.update(499);eq(g.pieces,0,'fifteenth survives499');g.move(1);g.update(1);eq(g.pieces,1,'sixteenth no reset');e.clocks.resetCap=15;}
  {const g=make();place(g,'O',0,-1,18);g.update(490);for(let i=0;i<5;i++)eq(g.move(-1),false,'wall failure');g.update(10);eq(g.pieces,1,'failed wall no reset');e.clocks.failedWall='pass';}
  e.clocks.ledges=[];
  for(const exhausted of [false,true]){
    const g=make();put(g,0,14);place(g,'O',0,-1,12);
    if(exhausted)for(let i=0;i<15;i++)g.rotate(1);
    g.update(490);g.move(1);ok(!g.grounded,'ledge airborne');g.update(20);eq(g.pieces,0,'no airborne lock');
    let time=20;while(!g.grounded&&time<8000){g.update(1);time++;}eq(g.active.y,18,'lower landing');
    g.update(499);eq(g.pieces,0,'lower landing full delay');g.move(1);g.update(499);eq(g.pieces,0,'lower landing fresh reset');g.update(1);eq(g.pieces,1,'lower lock');
    e.clocks.ledges.push({exhausted,landingAfterMove:time,fullDelay:true,freshResets:true});
  }
  {const g=make();for(const p of [[3,12],[4,14],[4,16]])put(g,...p);place(g,'T',0,4,11);g.softDrop();for(let i=0;i<15;i++)g.move(i%2?1:-1);g.update(490);g.rotate(1);eq(g.active,{kind:'T',rotation:1,x:2,y:14},'new-lowest downward kick');g.update(499);eq(g.pieces,0,'downkick499');g.update(1);eq(g.pieces,1,'downkick500');e.clocks.downwardKick='pass';}
  {const g=make();place(g,'O',0,3,17);g.update(999);eq(g.active.y,17,'contact999');g.update(1);eq(g.active.y,18,'contact1000');g.update(499);eq(g.pieces,0,'contact1499');g.update(1);eq(g.pieces,1,'contact1500');e.clocks.naturalContact=1500;}
  {const g=make();place(g,'O',0,3,18);eq(g.softDrop(),false,'grounded soft');eq(g.pieces,0,'soft no lock');g.update(500);eq(g.pieces,1,'soft timed lock');}
  e.gravity=[];
  for(let l=1;l<=20;l++){const g=make();g.setUp({lines:(l-1)*10});place(g,'O',0,3,0);let t=0;while(g.active.y===0&&t<1100){g.update(1);t++;}const expected=Math.ceil(Math.max(1,1000*(.8-(l-1)*.007)**(l-1)));eq(t,expected,'level gravity');eq(g.score,0,'gravity points');e.gravity.push({level:l,actual:t,expected});}
  {const g=make();place(g,'O',0,3,0);g.update(800);g.softDrop();g.update(1,true);eq([g.active.y,g.score],[1,1],'soft entry');g.update(49,true);eq([g.active.y,g.score],[2,2],'soft interval');e.softEntry={actualRows:1,actualPoints:1,expectedRows:1,expectedPoints:1};}
  e.refresh=[];for(const hz of [60,144]){const g=make();g.setUp({lines:90});place(g,'O',0,3,0);let t=0;while(t<600-1e-9){const dt=Math.min(1000/hz,600-t);g.update(dt);t+=dt;}eq(g.active.y,9,'refresh');e.refresh.push({hz,rows:g.active.y,points:g.score});}
  const clearWith=(g,n,pc=false)=>{clear(g);const[k,r,x,y]=({1:['I',0,3,18],2:['O',0,3,18],3:['T',1,3,17],4:['I',1,2,16]})[n];place(g,k,r,x,y);const own=new Set(cells(g.active).map(String));for(let yy=20-n;yy<20;yy++)for(let xx=0;xx<10;xx++)if(!own.has([xx,yy].toString()))put(g,xx,yy);if(!pc)put(g,0,4);eq(g.ghost().y,y,'zero clear travel');g.hardDrop();};
  {const g=make();for(const y of [17,19])for(let x=0;x<10;x++)if(x!==4)put(g,x,y);put(g,0,-1);put(g,1,18);place(g,'I',1,2,16);g.hardDrop();eq([g.lines,g.cell(0,1),g.cell(1,19)],[2,'J','J'],'nonadjacent and hidden compaction');e.compaction='pass';}
  const filler=g=>{clear(g);place(g,'O',0,7,18);g.hardDrop();};
  e.scoring={normal:[],perfect:[]};
  for(let n=1;n<=4;n++){const g=make();clearWith(g,n);e.scoring.normal.push(g.score);eq(g.lines,n,'lines');const p=make();clearWith(p,n,true);eq(count(p),0,'empty PC');e.scoring.perfect.push(p.score);}
  eq(e.scoring.normal,[100,300,500,800],'normal scores');eq(e.scoring.perfect,[900,1500,2300,2800],'perfect scores');
  {const g=make();clearWith(g,4);filler(g);clearWith(g,4);eq(g.score,2000,'B2B survives');clearWith(g,1);eq([g.score,g.backToBack],[2150,false],'B2B break');e.scoring.b2bBreak=2150;}
  {const g=make();clearWith(g,4);clearWith(g,4);eq(g.score,2050,'combo tetrises');e.scoring.consecutiveTetrises=g.score;}
  {const g=make();clearWith(g,4);filler(g);clearWith(g,4,true);eq(g.score,5200,'B2B PC');e.scoring.b2bPc=g.score;}
  {const g=make();g.setUp({lines:10});clearWith(g,1);const before=g.score;clearWith(g,1);eq(g.score-before,300,'level2 combo');e.scoring.level2Combo=300;}
  {const g=make();g.setUp({lines:9});clearWith(g,1);eq([g.score,g.lines,g.level],[100,10,2],'level crossing');e.scoring.crossing=[100,10,2];}
  const pocket=(g,full,line=false)=>{clear(g);for(const p of [[5,17],[3,19],full?[3,17]:[5,19]])put(g,...p);if(line)for(const x of [0,1,2,6,7,8,9])put(g,x,18);place(g,'T',3,3,17);ok(g.rotate(1),'real spin CW');eq(g.active,{kind:'T',rotation:0,x:3,y:17},'spin pose');eq(g.ghost().y,17,'zero spin travel');};
  e.spins={};
  for(const timed of [false,true])for(const full of [false,true])for(const line of [false,true]){const g=make();pocket(g,full,line);if(timed)g.update(500);else g.hardDrop();const expected=full?(line?800:400):(line?200:100);eq(g.score,expected,'spin score');e.spins[`${timed?'timed':'hard'}-${full?'full':'mini'}-${line?'single':'zero'}`]={actual:g.score,expected};}
  e.spins.facings=[];
  for(let r=0;r<4;r++)for(const full of [false,true]){const g=make(),front=[[0,1],[1,2],[2,3],[0,3]][r],corners=[[3,15],[5,15],[5,17],[3,17]],missing=full?[0,1,2,3].find(i=>!front.includes(i)):front[0];for(let i=0;i<4;i++)if(i!==missing)put(g,...corners[i]);place(g,'T',(r+3)%4,3,15);g.rotate(1);eq(g.active.rotation,r,'facing rotation');g.update(500);eq(g.score,full?400:100,'facing score');e.spins.facings.push({r,full,actual:g.score,expected:full?400:100});}
  {const g=make();for(let y=18;y<=19;y++)for(let x=0;x<10;x++)if(y===18?![3,4,5].includes(x):x!==4)put(g,x,y);put(g,5,17);place(g,'T',1,3,17);g.rotate(1);eq(g.active.rotation,2,'double rotation');g.hardDrop();eq(g.score,1200,'spin double');e.spins.double=1200;}
  {const g=make();for(const p of [[2,15],[3,17],[1,17],[1,19]])put(g,...p);for(let x=0;x<10;x++)if(![2,3].includes(x))put(g,x,18);place(g,'T',0,2,15);g.rotate(1);eq(g.active,{kind:'T',rotation:1,x:1,y:17},'fifth kick');g.hardDrop();eq(g.score,800,'fifth promoted single');e.spins.fifthKick=800;}
  {const g=make();for(const p of [[5,17],[3,19],[3,17]])put(g,...p);place(g,'T',0,3,17);g.hardDrop();eq(g.score,0,'no rotation negative');e.spins.noRotation=0;}
  for(const method of ['hard','soft']){const g=make();for(const p of [[0,17],[0,19],[2,19]])put(g,...p);place(g,'T',0,0,3);g.rotate(1);eq(g.active,{kind:'T',rotation:1,x:0,y:3},'HD spin real rotation');eq(g.ghost().y,17,'HD ghost independent');if(method==='hard')g.hardDrop();else{while(g.softDrop());g.hardDrop();}eq(g.score,method==='hard'?28:14,'spin travel credit');eq(g.lastLock.spin,null,'travel no spin');e.spins[method+'Travel']={actual:g.score,expected:method==='hard'?28:14,spin:g.lastLock.spin};}
  {const g=make();for(const p of [[2,17],[2,18],[3,18],[6,18]])put(g,...p);place(g,'T',3,4,17);g.rotate(1);eq(g.active,{kind:'T',rotation:0,x:3,y:18},'translation fixture');g.move(1);g.move(-1);g.hardDrop();eq(g.score,0,'lateral cancels');e.spins.lateralCancel=0;}
  {const g=make();pocket(g,true,true);g.hardDrop();filler(g);pocket(g,true,true);g.hardDrop();eq(g.score,2000,'spin B2B across no clear');e.spins.b2b=2000;}
  {const g=make();pocket(g,true);eq(g.softDrop(),false,'failed soft');g.hardDrop();eq(g.score,400,'failed soft retains');e.spins.failedSoftRetains=400;}
  {const g=make();pocket(g,true);eq(g.move(-1),false,'failed left');eq(g.move(1),false,'failed right');g.hardDrop();eq(g.score,400,'failed moves retain');e.spins.failedMovesRetain=400;}
  e.topOut={};
  {const g=make();clear(g);for(const p of [[3,1],[6,1],[7,1],[8,0]])put(g,...p);g.spawn('T');for(const action of [()=>g.move(1),()=>g.move(1),()=>g.rotate(-1),()=>g.rotate(1)])ok(action(),'hidden path');const p={...g.active};ok(cells(p).every(([,y])=>y<0),'wholly hidden');eq(g.ghost().y,p.y,'hidden grounded');g.hardDrop();eq(g.status,'over','hidden lockout');e.topOut.hidden={pose:p,status:g.status};}
  {const g=make();put(g,8,1);place(g,'T',0,7,-1);g.hardDrop();eq(g.status,'playing','partial lock continues');eq(g.cell(8,-1),'T','hidden cell preserved');e.topOut.partial='pass';}
  {const g=make();g.hold();g.hardDrop();for(let y=-2;y<=-1;y++)for(let x=3;x<=6;x++)put(g,x,y);g.hold();eq(g.status,'over','blocked hold');e.topOut.blockedHold='pass';}
  {const g=make();place(g,'O',0,-1,18);for(let y=-2;y<=-1;y++)for(let x=3;x<=6;x++)put(g,x,y);g.hardDrop();eq(g.status,'over','blocked spawn');const snap=()=>JSON.stringify([g.active,g.board,g.score,g.held,g.elapsed]);const before=snap();g.move(1);g.rotate(1);g.hold();g.softDrop();g.hardDrop();g.update(2000);eq(snap(),before,'terminal inert');g.restart();eq([g.status,count(g),g.score,g.lines,g.level,g.held,g.canHold,g.combo,g.backToBack],['playing',0,0,0,1,null,true,-1,false],'restart');e.topOut.blockedAndRestart='pass';}
  e.naturalGames=[];for(let seed=1;seed<=3;seed++){const g=make(seed);let n=0;while(g.status==='playing'&&n<100){g.hardDrop();n++;}eq(g.status,'over','natural over');g.restart();const bag=[];for(let i=0;i<7;i++){bag.push(g.active.kind);clear(g);g.hardDrop();}eq(new Set(bag).size,7,'restart bag');e.naturalGames.push({seed,locks:n,restartBag:bag});}
  return e;
}

if(typeof process!=='undefined' && process.argv[1] && import.meta.url===new URL('file://'+process.argv[1]).href){
  const {pathToFileURL}=await import('node:url');const {resolve}=await import('node:path');
  const root=process.argv[2],m={...await import(pathToFileURL(resolve(root,'dist/engine.js'))),...await import(pathToFileURL(resolve(root,'dist/pieces.js')))};
  console.log(JSON.stringify(probes(m)));
}
