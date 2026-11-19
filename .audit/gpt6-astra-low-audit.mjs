// Independent engine fixtures. Only pose, board and clocks are fixture state.
import {reference,normalKicks,iKicks} from './opus55-efforts-audit.mjs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
export {reference,normalKicks,iKicks};
export function adapter(m){
 const types=['I','J','L','O','S','T','Z'];
 const make=(seed=42)=>new m.Game(()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32));
 const pose=g=>({...g.active,y:g.active.y-2});
 const local=(kind,r)=>m.cells({kind,r,x:0,y:0}),put=(g,x,y,k='J')=>g.board[y+2][x]=k;
 const fits=(g,p)=>local(p.kind,p.r).every(([x,y])=>x+p.x>=0&&x+p.x<10&&y+p.y>=-2&&y+p.y<20&&!g.board[y+p.y+2][x+p.x]);
 const place=(g,kind,r,x,y)=>{Object.assign(g,{active:{kind,r,x,y:y+2},fall:0,lock:0,resets:0,rotated:false,kick:0});if(!fits(g,pose(g)))throw Error('invalid pose '+JSON.stringify(pose(g)));};
 const clear=g=>g.board.forEach(row=>row.fill(null)),count=g=>g.board.flat().filter(Boolean).length;
 const advance=(g,ms,dt=10)=>{while(ms>1e-8){const d=Math.min(dt,ms);g.tick(d);ms-=d}};
 return{types,make,pose,local,put,fits,place,clear,count,advance};
}
export function probes(m,oracle){
 let globalSeed=9123;const oldRandom=Math.random;Math.random=()=>((globalSeed=(Math.imul(globalSeed,1664525)+1013904223)>>>0)/2**32);
 const a=adapter(m),{types,make,pose,local,put,fits,place,clear,count,advance}=a,{reference,normalKicks,iKicks}=oracle;
 const eq=(a,b,n)=>{if(JSON.stringify(a)!==JSON.stringify(b))throw Error(n+': '+JSON.stringify({actual:a,expected:b}));};
 const key=p=>p.map(x=>x.join(',')).sort().join(' '),e={srs:{states:[],kickLists:[],outcomes:[],attempts:0},bags:0};
 for(const k of types)for(let r=0;r<4;r++){const actual=local(k,r);if(key(actual)!==key(reference[k][r]))e.srs.states.push({k,r,actual,expected:reference[k][r]});}
 for(const k of types.filter(k=>k!=='O'))for(const tr of Object.keys(normalKicks)){
  const [r,n]=tr.split('>').map(Number),g=make();place(g,k,r,3,5);const actual=[];
  g.valid=p=>{actual.push([p.x-g.active.x,p.y-g.active.y]);return false};g.rotate((n-r+4)%4===1?1:-1);
  const expected=(k==='I'?iKicks:normalKicks)[tr].map(([x,y])=>[x,-y||0]);if(JSON.stringify(actual)!==JSON.stringify(expected))e.srs.kickLists.push({k,tr,actual,expected});
 }
 let seed=1234;const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
 for(const k of types.filter(k=>k!=='O'))for(let r=0;r<4;r++)for(const d of [-1,1])for(let sample=0;sample<12;sample++){
  const g=make(),cs=local(k,r),x=[-Math.min(...cs.map(p=>p[0])),3,9-Math.max(...cs.map(p=>p[0]))][sample%3],y=[-Math.min(...cs.map(p=>p[1])),7,19-Math.max(...cs.map(p=>p[1])),15][Math.floor(sample/3)];place(g,k,r,x,y);
  const active=new Set(cs.map(([xx,yy])=>[xx+x,yy+y].join(',')));
  for(let yy=Math.max(-2,y-2);yy<=Math.min(19,y+4);yy++)for(let xx=0;xx<10;xx++)if(!active.has([xx,yy].join(','))&&rng()<.23)put(g,xx,yy);
  const before=pose(g),n=(r+d+4)%4,offsets=(k==='I'?iKicks:normalKicks)[r+'>'+n];let expected=before;
  for(const [dx,dy] of offsets){const p={kind:k,r:n,x:x+dx,y:y-dy};if(fits(g,p)){expected=p;break}}
  g.rotate(d);const actual=pose(g);e.srs.attempts++;if(JSON.stringify(actual)!==JSON.stringify(expected))e.srs.outcomes.push({before,d,actual,expected,stack:g.board.flatMap((row,y)=>row.flatMap((v,x)=>v?[[x,y-2]]:[]))});
 }
 for(let s=1;s<=10;s++){
  // Constructor defaults capture the seeded RNG through queue replenishment.
  const old=Math.random;let seed=s;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
  try{const g=new m.Game();for(let b=0;b<10;b++){const bag=[];for(let i=0;i<7;i++){bag.push(g.active.kind);clear(g);g.hardDrop()}eq(bag.sort(),types.slice().sort(),'bag');e.bags++}}finally{Math.random=old}
 }
 {const g=make(),first=g.active.kind,next=g.queue[0];g.rotate(1);g.hold();eq([g.held,g.active.kind,g.usedHold],[first,next,true],'hold');const before=pose(g);g.hold();eq(pose(g),before,'double hold');clear(g);g.hardDrop();g.hold();eq([g.active.kind,g.active.r,g.active.x,g.active.y,g.usedHold],[first,0,3,0,true],'retrieved spawn');e.hold='pass';}
 {const g=make();Object.assign(g,{fall:800,lock:400,resets:12});g.hold();eq([g.fall,g.lock,g.resets],[0,0,0],'replacement clocks');e.holdClocks='pass';}
 e.drops=[];for(const k of types){const g=make();place(g,k,0,3,1);put(g,4,16);let y=1;while(fits(g,{...pose(g),y:y+1}))y++;eq(g.ghost().y-2,y,'ghost');g.tick(50,true);eq(g.score,1,'soft');const dist=y-(g.active.y-2);g.hardDrop();eq(g.score,1+2*dist,'hard points');eq(count(g),5,'weld');e.drops.push({k,ghost:y,points:g.score});}
 e.clocks={};
 {const g=make();place(g,'O',0,3,18);advance(g,499);eq(count(g),0,'499');advance(g,1);eq(count(g),4,'500');e.clocks.boundary='pass';}
 {const g=make();place(g,'O',0,3,18);advance(g,490);g.move(1);advance(g,499);eq(count(g),0,'reset499');advance(g,1);eq(count(g),4,'reset500');e.clocks.reset='pass';}
 {const g=make();place(g,'O',0,3,18);advance(g,100);for(let i=0;i<15;i++)g.move(i%2?-1:1);e.clocks.after15={cells:count(g),resets:g.resets};advance(g,499);e.clocks.after15plus499=count(g);g.move(1);advance(g,1);e.clocks.after16plus1=count(g);}
 {const g=make();place(g,'O',0,-1,18);advance(g,490);for(let i=0;i<4;i++)g.move(-1);advance(g,10);e.clocks.failedWall=count(g);}
 e.clocks.ledges=[];for(const exhausted of [false,true]){const g=make();place(g,'O',0,-1,12);put(g,0,14);put(g,1,14);if(exhausted)for(let i=0;i<15;i++)g.move(i%2?-1:1);advance(g,490);g.move(1);g.move(1);eq(fits(g,pose(g)),true,'ledge legal');const start=g.lock;let t=0,land=null;while(count(g)===2&&t<8000){g.tick(1);t++;if(land===null&&g.active.y===20)land=t;}e.clocks.ledges.push({exhausted,start,land,lock:t,expectedLock:land+500});}
 {const g=make();place(g,'O',0,-1,12);put(g,0,14);put(g,1,14);for(let i=0;i<14;i++)g.move(i%2?-1:1);g.move(1);g.move(1);let t=0;while(g.active.y<20&&t++<8000)g.tick(1);const resets=g.resets;advance(g,400);g.move(1);advance(g,100);e.clocks.newLowest={resets,cells:count(g),expectedCells:2};}
 e.clocks.contact=[];for(const dt of [10,100,1000/60,1000/144]){const g=make();place(g,'O',0,3,17);let elapsed=0;while(!count(g)&&elapsed<2000){g.tick(dt);elapsed+=dt;}e.clocks.contact.push({dt,actual:elapsed,expected:1500});}
 {const g=make();place(g,'O',0,3,0);g.tick(800);const before=pose(g);g.tick(1,true);e.softEntry={before,after:pose(g),score:g.score,expectedRows:0,expectedPoints:0};}
 e.gravity=[];for(let l=1;l<=20;l++){const g=make();g.lines=(l-1)*10;place(g,'O',0,3,1);let t=0;while(g.active.y===3&&t<1100){g.tick(.1);t+=.1;}e.gravity.push({level:l,actual:Math.round(t*10)/10,expected:1000*(.8-(Math.min(l,15)-1)*.007)**(Math.min(l,15)-1)});}
 const clearWith=(g,n,pc)=>{clear(g);const[k,r,x,y]=({1:['I',0,3,18],2:['O',0,3,18],3:['T',1,3,17],4:['I',1,3,16]})[n];place(g,k,r,x,y);const occupied=new Set(local(k,r).map(([a,b])=>[a+x,b+y].join(',')));for(let yy=20-n;yy<20;yy++)for(let xx=0;xx<10;xx++)if(!occupied.has([xx,yy].join(',')))put(g,xx,yy);if(!pc)put(g,0,0);g.hardDrop();return g.score;};
 e.scoring={clears:[],pc:[]};for(let n=1;n<=4;n++){const g=make();clearWith(g,n,false);e.scoring.clears.push(g.score);const p=make();clearWith(p,n,true);eq(count(p),0,'PC empty');e.scoring.pc.push(p.score);}
 for(const [name,sequence]of Object.entries({combo:[1,1],b2b:[4,0,4],break:[4,1,4],pcB2b:[4,0,-4]})){const g=make(),deltas=[];for(const n of sequence){const before=g.score;if(n)clearWith(g,Math.abs(n),n<0);else{clear(g);place(g,'O',0,3,18);g.hardDrop()}deltas.push(g.score-before)}e.scoring[name]={deltas,total:g.score};}
 {const g=make();g.lines=9;clearWith(g,1,true);e.scoring.crossing={score:g.score,level:g.level,lines:g.lines};}
 {const g=make();g.lines=10;clearWith(g,1,false);const before=g.score;clearWith(g,1,false);e.scoring.comboLevel2=g.score-before;}
 // Rotation must actually succeed; never assign spin credit.
 const spinPocket=(g,full,line)=>{place(g,'T',3,3,17);for(const[x,y]of [[5,17],[3,19],full?[3,17]:[5,19]])put(g,x,y);if(line)for(const x of [0,1,2,6,7,8,9])put(g,x,18);g.rotate(1);eq(pose(g),{kind:'T',r:0,x:3,y:17},'real spin');eq(g.ghost().y-2,17,'zero spin distance');};
 e.spins={};for(const timed of [false,true])for(const full of [false,true])for(const line of [false,true]){const g=make();spinPocket(g,full,line);if(timed)advance(g,500);else g.hardDrop();e.spins[`${timed?'timed':'hard'}-${full?'full':'mini'}-${line?'single':'zero'}`]=g.score;}
 e.spins.facings=[];for(let r=0;r<4;r++)for(const full of [false,true]){const g=make(),fronts=[[0,1],[1,2],[2,3],[0,3]][r],corners=[[3,15],[5,15],[5,17],[3,17]],missing=full?[0,1,2,3].find(i=>!fronts.includes(i)):fronts[0];for(let i=0;i<4;i++)if(i!==missing)put(g,...corners[i]);place(g,'T',(r+3)%4,3,15);g.rotate(1);eq(g.active.r,r,'facing real rotation');advance(g,500);e.spins.facings.push({r,full,score:g.score});}
 for(const method of ['hard','soft']){const g=make();for(const[x,y]of [[0,17],[0,19],[2,19]])put(g,x,y);place(g,'T',0,0,3);g.rotate(1);eq(g.active.r,1,'travel rotate');eq(g.ghost().y-2,17,'travel ghost');if(method==='soft')for(let i=0;i<14;i++)g.tick(50,true);g.hardDrop();e.spins[method+'Travel']=g.score;}
 {const g=make();spinPocket(g,true,false);g.tick(50,true);g.move(-1);g.hardDrop();e.spins.failedActions=g.score;}
 {const g=make();for(const[x,y]of [[3,17],[5,17],[3,19]])put(g,x,y);place(g,'T',0,3,17);g.hardDrop();e.spins.noRotation=g.score;}
 for(const fifth of [false,true]){const g=make();for(const[x,y]of fifth?[[4,15],[6,15],[6,17],[3,18],[6,18],[3,16]]:[[3,15],[3,17],[5,17],[3,18],[6,19]])put(g,x,y);place(g,'T',1,3,17);g.rotate(fifth?1:-1);const p=pose(g),credit=({rotated:g.rotated,kick:g.kick});g.hardDrop();e.spins[fifth?'fifthKick':'fourthKick']={pose:p,credit,score:g.score};}
 {const g=make();for(let x=0;x<10;x++){if(x!==4)put(g,x,19);if(x<3||x>5)put(g,x,18);}put(g,3,17);place(g,'T',0,3,17);g.rotate(1);g.rotate(1);g.hardDrop();e.spins.double={score:g.score,lines:g.lines};}
 {const g=make();place(g,'T',3,3,17);put(g,5,17);put(g,3,19);g.rotate(1);g.hardDrop();e.spins.twoCorners=g.score;eq(g.score,0,'two corners');}
 e.hidden=[];for(const partial of [false,true]){const g=make();put(g,0,partial?1:0);place(g,'O',0,-1,partial?-1:-2);g.queue[0]='I';g.hardDrop();e.hidden.push({partial,over:g.over,cells:count(g)});}
 {const g=make();for(let y=-2;y<3;y++)for(let x=0;x<10;x++)put(g,x,y);g.spawn('I');eq(g.over,true,'spawn topout');const before=JSON.stringify(g);g.move(1);g.rotate(1);g.hold();g.tick(50,true);g.hardDrop();advance(g,1000);eq(JSON.stringify(g),before,'terminal freeze');e.terminal='pass';}
 {const g=make();for(const y of [17,19])for(let x=0;x<10;x++)put(g,x,y);put(g,0,16);place(g,'O',0,3,3);g.hardDrop();eq(g.lines,2,'compaction');eq(g.board[20][0],'J','marker falls two');e.compaction='pass';}
 e.restart=[];for(const s of [1,2,42]){let g=make(s),n=0;while(!g.over&&n++<100)g.hardDrop();eq(g.over,true,'natural topout');g=make(s);eq([count(g),g.score,g.lines,g.level,g.held,g.usedHold,g.over],[0,0,0,1,null,false,false],'restart');e.restart.push(n);}
 Math.random=oldRandom;return e;
}
export const runProbes=(m)=>probes(m,{reference,normalKicks,iKicks});
if(process.argv[1]&&resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname)){
 const m=await import(pathToFileURL(resolve(process.argv[2],'dist/game.js')));console.log(JSON.stringify(runProbes(m)));
}
