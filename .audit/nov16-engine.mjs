// Shared, independent fixtures for the November 16 cohort. All coordinates
// below use the visible 10x20 field. Adapters expose data/actions, never replace
// scoring or movement rules. Only pose, stack and clocks are set for fixtures.
export function createAdapter(m, mode) {
  if (mode === 'none') return createNoneAdapter(m);
  const hy = mode === 'hy4', low = mode === 'low', high = mode === 'high';
  const hidden = hy ? 20 : low ? 4 : 2;
  const seeded = s => () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32);
  const make = (seed = 42) => {
    const rng = seeded(seed), original = Math.random;
    Math.random = rng;
    try { return low ? new m.game.Game({rng}) : hy ? new m.game.Game() : new m.game.Game(rng); }
    finally { Math.random = original; }
  };
  const local = (t, r) => hy ? m.pieces.getCells(t, r).map(c => [c.x,c.y])
    : (high ? m.pieces.SHAPES : low ? m.pieces.PIECES : m.pieces.ROTATIONS)[t][r];
  const active = g => g.current && ({type:g.current.type, rotation:g.current.rotation ?? g.current.rot,
    x:g.current.x, y:g.current.y-hidden});
  const get = (g,x,y) => {
    if (x<0 || x>=10 || y < -hidden || y>=20) return null;
    return hy ? g.board.cells[y+hidden][x] : low ? g.board.grid[y+hidden][x]
      : high ? g.board[(y+hidden)*10+x] : g.board[y+hidden][x];
  };
  const put = (g,x,y,t='J') => {
    if (x<0 || x>=10 || y < -hidden || y>=20) throw Error('stack outside storage');
    if(hy)g.board.cells[y+hidden][x]=t;
    else if(low)g.board.grid[y+hidden][x]=t;
    else if(high)g.board[(y+hidden)*10+x]=t===null?0:m.pieces.pieceId(t);
    else g.board[y+hidden][x]=t;
  };
  const clear = g => {for(let y=-hidden;y<20;y++)for(let x=0;x<10;x++)put(g,x,y,null);};
  const count = g => {let n=0;for(let y=-hidden;y<20;y++)for(let x=0;x<10;x++)n+=!!get(g,x,y);return n;};
  const cells = p => local(p.type,p.rotation).map(([x,y])=>[x+p.x,y+p.y]);
  const fits = (g,p) => cells(p).every(([x,y])=>x>=0&&x<10&&y<20&&!get(g,x,y));
  const place = (g,t,r,x,y) => {
    g.current={type:t,x,y:y+hidden,...(hy||low?{rotation:r}:{rot:r})};
    for(const k of ['gravityMs','gravityTimer','gravityAcc','lockMs','lockTimer','lockResets'])if(typeof g[k]==='number')g[k]=0;
    if('lowestY' in g)g.lowestY=y+hidden;
    if(!fits(g,active(g)))throw Error('colliding pose '+JSON.stringify(active(g)));
  };
  const step = (g,ms,soft=false) => g.update(low?ms/1000:ms,soft);
  const advance = (g,ms,soft=false) => {while(ms>1e-7){const dt=Math.min(ms,16);step(g,dt,soft);ms-=dt;}};
  const finish = g => {if(g.state==='clearing')advance(g,181);};
  const hard = g => g.hardDrop();
  const rotate = (g,d) => g.rotate(d);
  const move = (g,d) => hy?g.moveHorizontal(d):g.move(d);
  const hold = g => hy?g.hold():g.holdPiece();
  const restart = g => (hy||mode==='xhigh')?g.reset():g.restart();
  const over = g => hy?g.gameOver:high?g.over:low?g.phase==='gameover':g.state==='over';
  const queue = g => hy?g.nextQueue:low?g.nextQueue:g.queue;
  const ghost = g => g.ghostY()-hidden;
  const kick = (t,from,to) => hy?m.pieces.PIECES[t].kicks[`${from}>${to}`].map(([x,y])=>[x,-y||0])
    :high?m.srs.kicksFor(t,from,(to-from+4)%4===1?1:-1):low?m.srs.getKicks(t,from,to):m.pieces.kicksFor(t,from,to);
  const softStep = g => hy||mode==='xhigh'?g.softDrop():step(g,50,true);
  return {mode,hidden,make,local,active,get,put,clear,count,cells,fits,place,step,advance,finish,hard,rotate,move,hold,restart,over,queue,ghost,kick,softStep};
}

// Diagnostic Node adapter for the delivered CommonJS/frame-tick implementation.
// Accessor aliases expose its scoring data. No delivered method is replaced.
function createNoneAdapter(m) {
  const hidden = m.constants.HIDDEN_ROWS;
  const remainders = new WeakMap();
  const make = (seed=42) => {
    const g = new m.game.Game(seed);
    for (const key of ['score','lines','level']) Object.defineProperty(g,key,{
      get(){return this.scoring[key];}, set(value){this.scoring[key]=value;}
    });
    return g;
  };
  const local = (t,r) => m.constants.SHAPE_DEFINITIONS[t].cells[r].map(([x,y])=>[x-(t==='O'?1:0),y]);
  const active = g => g.active && ({type:g.active.shape,rotation:g.active.rotation,x:g.active.x+(g.active.shape==='O'?1:0),y:g.active.y-hidden});
  const get = (g,x,y) => x<0||x>=10||y < -hidden||y>=20 ? null : g.board.grid[y+hidden][x];
  const put = (g,x,y,t='J') => {g.board.grid[y+hidden][x]=t;};
  const clear = g => g.board.clear();
  const count = g => g.board.grid.flat().filter(Boolean).length;
  const cells = p => local(p.type,p.rotation).map(([x,y])=>[x+p.x,y+p.y]);
  const fits = (g,p) => cells(p).every(([x,y])=>x>=0&&x<10&&y<20&&!get(g,x,y));
  const place = (g,t,r,x,y) => {
    g.active={shape:t,rotation:r,x:x-(t==='O'?1:0),y:y+hidden};
    g.gravityCounter=0;g.lockTimer=0;g.lockResets=0;g.grounded=false;remainders.set(g,0);
    if(!fits(g,active(g)))throw Error('colliding diagnostic pose '+JSON.stringify({t,r,x,y,p:active(g),cells:cells(active(g))}));
  };
  const step = (g,ms) => {
    const frames=ms*60/1000+(remainders.get(g)||0),n=Math.floor(frames+1e-9);
    remainders.set(g,frames-n);
    for(let i=0;i<n;i++)g.tick();
  };
  const advance=step,finish=()=>{},hard=g=>g.hardDrop(),rotate=(g,d)=>g.rotate(d),move=(g,d)=>g.move(d);
  const hold=g=>g.holdPiece(),restart=g=>{g.reset(42);remainders.set(g,0);},over=g=>g.gameOver;
  const queue=g=>g.next,ghost=g=>g.board.ghostPose(g.active).y-hidden;
  const kick=(t,from,to)=>m.constants.getKickTable(t)[`${from}>${to}`].map(([x,y])=>[x,-y||0]);
  return {mode:'none',hidden,make,local,active,get,put,clear,count,cells,fits,place,step,advance,finish,hard,rotate,move,hold,restart,over,queue,ghost,kick,softStep:g=>g.softDrop()};
}

export function runProbes(a, oracle) {
  const {reference,normalKicks,iKicks}=oracle;
  const {make,local,active,get,put,clear,count,cells,fits,place,step,advance,finish,hard,rotate,move,hold,restart,over,queue,ghost}=a;
  const out={mode:a.mode,checks:[],observations:{}};
  const stable=x=>JSON.stringify(x),key=cs=>cs.map(p=>p.join(',')).sort().join(' ');
  const record=(name,actual,expected)=>{out.checks.push({name,actual,expected,pass:stable(actual)===stable(expected)});};
  const types=Object.keys(reference),canon=(t,r)=>reference[t][r].map(([x,y])=>[x-(t==='O'?1:0),y]);
  const fresh=(t='T',r=0,x=3,y=3)=>{const g=make();place(g,t,r,x,y);return g;};
  const filled=(g,y,holes)=>{for(let x=0;x<10;x++)if(!holes.includes(x))put(g,x,y);};
  const quad=g=>{clear(g);put(g,0,10);for(let y=16;y<20;y++)filled(g,y,[9]);place(g,'I',1,7,16);hard(g);finish(g);};
  {const g=make();const ys=cells(active(g)).map(c=>c[1]);out.observations.initialSpawn={minY:Math.min(...ys),maxY:Math.max(...ys)};record('initial spawn is near the visible field',Math.min(...ys)>=-2,true);}
  const states=[];for(const t of types)for(let r=0;r<4;r++)if(key(local(t,r))!==key(canon(t,r)))states.push(t+r);
  record('28 canonical rotation states',states,[]);
  const kickErrors=[];for(const t of types.filter(t=>t!=='O'))for(const tr of Object.keys(normalKicks)){
    const [from,to]=tr.split('>').map(Number),want=(t==='I'?iKicks:normalKicks)[tr].map(([x,y])=>[x,-y||0]);
    if(stable(a.kick(t,from,to))!==stable(want))kickErrors.push({t,tr,actual:a.kick(t,from,to),expected:want});
  }
  record('48 ordered SRS kick lists',kickErrors,[]);
  let seed=0x1632;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
  const rotations={total:0,mismatches:0,examples:[]};
  for(const t of types)for(let from=0;from<4;from++)for(const dir of [-1,1])for(let sample=0;sample<12;sample++){
    const cs=a.mode==='none'?local(t,from):canon(t,from),minX=Math.min(...cs.map(c=>c[0])),maxX=Math.max(...cs.map(c=>c[0])),maxY=Math.max(...cs.map(c=>c[1]));
    const x=[-minX,3,9-maxX][sample%3],y=[-2,8,19-maxY][Math.floor(sample/3)%3],g=fresh(t,from,x,y);
    const occupied=new Set(cells(active(g)).map(p=>p.join(',')));
    for(let yy=Math.max(-a.hidden,y-2);yy<=Math.min(19,y+4);yy++)for(let xx=0;xx<10;xx++)if(!occupied.has(`${xx},${yy}`)&&random()<.28)put(g,xx,yy);
    const to=t==='O'?from:(from+dir+4)%4,offsets=t==='O'?[[0,0]]:(t==='I'?iKicks:normalKicks)[`${from}>${to}`].map(([dx,dy])=>[dx,-dy]);
    const before=active(g),legal=p=>canon(t,p.rotation).every(([xx,yy])=>p.x+xx>=0&&p.x+xx<10&&p.y+yy<20&&!get(g,p.x+xx,p.y+yy));
    const i=offsets.findIndex(([dx,dy])=>legal({...before,rotation:to,x:x+dx,y:y+dy}));
    const want=i<0?before:{...before,rotation:to,x:x+offsets[i][0],y:y+offsets[i][1]};
    rotate(g,dir);const got=active(g);rotations.total++;
    if(key(cells(got))!==key(canon(t,want.rotation).map(([xx,yy])=>[xx+want.x,yy+want.y]))){rotations.mismatches++;if(rotations.examples.length<3)rotations.examples.push({before,dir,got,want,actualCells:cells(got),expectedCells:canon(t,want.rotation).map(([xx,yy])=>[xx+want.x,yy+want.y])});}
  }
  out.observations.rotations=rotations;record('672 actual SRS rotations',rotations.mismatches,0);
  let bags=0,bagErrors=0;for(let seed=1;seed<=10;seed++){const g=make(seed);for(let b=0;b<10;b++){
    const draws=[];for(let n=0;n<7;n++){draws.push(active(g).type);clear(g);hard(g);finish(g);if(over(g))throw Error('unexpected bag top-out');}
    if(key([draws.sort()])!==key([[...types].sort()]))bagErrors++;bags++;
  }}
  out.observations.bags=bags;record('100 actual opening/dealt bags',bagErrors,0);
  {const g=fresh(),p=active(g).type;hold(g);const before=stable(active(g));hold(g);record('hold blocked twice',stable(active(g)),before);clear(g);hard(g);finish(g);hold(g);record('held retrieval spawn rotation',active(g).rotation,0);}
  for(const t of types){const g=fresh(t);put(g,4,16);const p=active(g);let y=p.y;while(fits(g,{...p,y:y+1}))y++;record('ghost '+t,ghost(g),y);const score=g.score;hard(g);record('hard-drop points '+t,g.score-score,2*(y-p.y));}
  for(let n=1;n<=4;n++){const g=fresh();put(g,0,10);for(let y=20-n;y<20;y++)filled(g,y,[9]);place(g,'I',1,7,16);hard(g);record('ordinary '+n+' line score',g.score,[0,100,300,500,800][n]);record('line count '+n,g.lines,n);}
  for(let n=1;n<=4;n++){
    const g=fresh();clear(g);
    if(n===1){filled(g,19,[6,7,8,9]);place(g,'I',0,6,18);}
    if(n===2){for(let y=18;y<20;y++)filled(g,y,[8,9]);place(g,'O',0,8,18);}
    if(n===3){filled(g,17,[8]);filled(g,18,[8,9]);filled(g,19,[8]);place(g,'T',1,7,17);}
    if(n===4){for(let y=16;y<20;y++)filled(g,y,[9]);place(g,'I',1,7,16);}
    hard(g);record('perfect clear '+n,g.score,[0,900,1500,2300,2800][n]);
  }
  {const g=fresh();quad(g);clear(g);place(g,'O',0,0,18);hard(g);finish(g);const before=g.score;quad(g);record('B2B survives a no-clear lock',g.score-before,1200);}
  {const g=fresh();quad(g);clear(g);for(let y=16;y<20;y++)filled(g,y,[9]);place(g,'I',1,7,16);const before=g.score;hard(g);record('B2B perfect clear plus combo',g.score-before,4450);}
  const spin=(kind,lock='hard')=>{
    const g=fresh('T',kind==='travel'?0:3,kind==='travel'?0:3,kind==='travel'?3:17);
    const stack=kind==='travel'?[[0,17],[0,19],[2,19]]:kind==='mini'?[[5,17],[3,19],[5,19]]:[[5,17],[3,19],[3,17]];
    for(const[x,y]of stack)put(g,x,y);const ok=rotate(g,1);if(!ok)throw Error('spin fixture rotation failed');
    const p=active(g),gy=ghost(g),before=g.score;if(lock==='hard')hard(g);else step(g,501);
    return {score:g.score-before,pose:p,ghost:gy,distance:gy-p.y};
  };
  for(const kind of ['travel','mini','full'])for(const method of ['hard','timed']){
    if(kind==='travel'&&method==='timed')continue;
    const v=spin(kind,method);out.observations[kind+'-'+method]=v;record('HD-SPIN-1 '+kind+' '+method,v.score,kind==='travel'?28:kind==='mini'?100:400);
  }
  {const g=fresh('T',0,0,3);for(const[x,y]of [[0,17],[0,19],[2,19]])put(g,x,y);rotate(g,1);for(let i=0;i<14;i++)a.softStep(g);step(g,501);record('manual soft descent cancels old spin credit',g.score,14);}
  const land=split=>{const g=fresh('O',0,3,17);if(split)advance(g,1100);else step(g,1100);return{locked:count(g)>0,y:active(g)?.y,clock:(g.lockTimer??g.lockMs)*(a.mode==='low'?1000:a.mode==='none'?1000/60:1)};};
  out.observations.landing={coarse:land(false),fine:land(true)};
  record('landing retains only 100ms lock time',land(false).clock,100);
  {const g=fresh('O',0,3,18);step(g,499);record('floor survives 499ms',count(g),0);step(g,1);record('floor locks at 500ms',count(g),4);}
  if(!['hy4','none'].includes(a.mode)){const g=fresh('T');step(g,900);const y=active(g).y;step(g,1,true);const moved=active(g).y-y;record('soft entry moves at most one row',moved<=1,true);out.observations.softEntryRows=moved;}
  {const g=fresh('I',0,3,0);g.level=15;step(g,100);record('level 15 gravity rows',active(g).y,Math.floor(100/(1000*Math.pow(.8-14*.007,14))));}
  {const g=fresh('O',0,3,0);for(let i=0;i<16;i++)move(g,i%2?1:-1);advance(g,18000);step(g,450);move(g,1);step(g,60);record('airborne moves do not exhaust later floor reset',count(g),0);}
  {const g=fresh('T',0,3,18);for(let i=0;i<15;i++)move(g,i%2?1:-1);rotate(g,1);rotate(g,-1);advance(g,1000);out.observations.oldRowResetCount=g.lockResets;step(g,400);move(g,1);step(g,120);record('returning to an old lowest row keeps spent resets',count(g),4);}
  for(const y of [-1,-2]){const g=fresh('O',0,0,y);put(g,0,y+2);hard(g);record(y===-1?'partial hidden lock continues':'wholly hidden lock ends',over(g),y===-2);}
  {const g=fresh('I',1,-2,-3);put(g,0,1);hard(g);record('legal above-buffer lock retains four minos plus support',count(g),5);}
  let badRestarts=0;for(let seed=1;seed<=20;seed++){const g=make(seed);for(let i=0;i<3;i++){clear(g);hard(g);finish(g);}restart(g);const opening=[];for(let i=0;i<7;i++){opening.push(active(g).type);clear(g);hard(g);finish(g);}if(new Set(opening).size!==7)badRestarts++;}
  record('20 restarts after three drops begin fresh bags',badRestarts,0);
  return out;
}
