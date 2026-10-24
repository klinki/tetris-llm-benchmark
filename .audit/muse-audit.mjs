import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
if (!process.argv[2]) throw new Error('Pass an isolated, built run directory');
const root = resolve(process.argv[2]), mode = process.argv[3];
assert(['minimal', 'low', 'medium', 'high', 'xhigh'].includes(mode));
const load = file => import(pathToFileURL(resolve(root, 'dist', file)));
// Identical canonical coordinate oracle to the October 23 audit.
const reference = {
  I: [
    [[0, 1], [1, 1], [2, 1], [3, 1]], [[2, 0], [2, 1], [2, 2], [2, 3]],
    [[0, 2], [1, 2], [2, 2], [3, 2]], [[1, 0], [1, 1], [1, 2], [1, 3]],
  ],
  J: [
    [[0, 0], [0, 1], [1, 1], [2, 1]], [[1, 0], [2, 0], [1, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [2, 2]], [[1, 0], [1, 1], [0, 2], [1, 2]],
  ],
  L: [
    [[2, 0], [0, 1], [1, 1], [2, 1]], [[1, 0], [1, 1], [1, 2], [2, 2]],
    [[0, 1], [1, 1], [2, 1], [0, 2]], [[0, 0], [1, 0], [1, 1], [1, 2]],
  ],
  O: Array.from({ length: 4 }, () => [[1, 0], [2, 0], [1, 1], [2, 1]]),
  S: [
    [[1, 0], [2, 0], [0, 1], [1, 1]], [[1, 0], [1, 1], [2, 1], [2, 2]],
    [[1, 1], [2, 1], [0, 2], [1, 2]], [[0, 0], [0, 1], [1, 1], [1, 2]],
  ],
  T: [
    [[1, 0], [0, 1], [1, 1], [2, 1]], [[1, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [1, 2]], [[1, 0], [0, 1], [1, 1], [1, 2]],
  ],
  Z: [
    [[0, 0], [1, 0], [1, 1], [2, 1]], [[2, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [1, 2], [2, 2]], [[1, 0], [0, 1], [1, 1], [0, 2]],
  ],
};

// Independent published SRS offsets: positive Y points up; normalize the run below.
const normalKicks = {
  '0>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '1>0': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '1>2': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '2>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '2>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '3>2': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '3>0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '0>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
};
const iKicks = {
  '0>1': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '1>0': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '1>2': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  '2>1': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '2>3': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '3>2': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '3>0': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '0>3': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
};

const core = await load(mode === 'minimal' || mode === 'high' ? 'tetris.js' : 'game.js');
const Game = core.Game ?? core.TetrisGame;
const pieces = mode === 'minimal' || mode === 'high' ? core : await load(mode === 'xhigh' ? 'tetromino.js' : 'pieces.js');
const types = Object.keys(reference), bottom = 21;
const pairs = values => values.map(c => Array.isArray(c) ? c : [c.x, c.y]);
const local = (type, rotation) => pairs((pieces.cellsFor ?? pieces.getCells)(type, rotation));
const key = cells => cells.map(([x,y]) => `${x},${y}`).sort().join(' ');
const source = file => readFileSync(resolve(root, 'src', file), 'utf8');
const literal = (file, name) => JSON.parse(source(file).match(new RegExp(`(?:const|export const) ${name}[^=]*= (\\{[\\s\\S]*?\\n\\});`))[1].replace(/\b([A-Z]+):/g, '"$1":').replace(/,\s*}/g, '}'));
const colors = mode === 'high' ? literal('main.ts', 'COLORS') : pieces.COLORS ?? (await load('constants.js')).COLORS;
for (const type of types) for (let r=0;r<4;r++) {
  const shift = type === 'O' && !['minimal','low'].includes(mode) ? 1 : 0;
  assert.equal(key(local(type,r).map(([x,y])=>[x+shift,y])), key(reference[type][r]), `${type}${r}`);
}
assert.equal(new Set(Object.values(colors)).size, 7);
const kickMismatches = [];
for (const type of types) for (const transition of Object.keys(normalKicks)) {
  const [from,to] = transition.split('>').map(Number);
  let actual;
  if (mode === 'high') actual = type === 'O' ? [[0,0]] : literal('tetris.ts', type === 'I' ? 'I_KICKS' : 'JLSTZ_KICKS')[`${from}-${to}`];
  else actual = pairs((pieces.kicksFor ?? pieces.getKicks)(type,from,to));
  const up = actual.map(([x,y]) => [x||0, (mode === 'minimal' ? y : -y)||0]);
  const expected = type === 'O' ? [[0,0]] : (type === 'I' ? iKicks : normalKicks)[transition];
  if (JSON.stringify(up)!==JSON.stringify(expected)) kickMismatches.push(`${type}:${transition}`);
}
assert.deepEqual(kickMismatches, mode === 'low' ? types.filter(t=>!['I','O'].includes(t)).flatMap(t=>['2>3','3>2','3>0','0>3'].map(k=>`${t}:${k}`)) : []);
console.log(`${mode}: 28 canonical states / seven colors; kick mismatches ${JSON.stringify(kickMismatches)}`);
const raw = g => mode === 'minimal' || mode === 'high' ? g.active : g.current;
const active = g => { const p=raw(g); return p && {type:p.type??p.kind, rotation:p.rotation??p.rot,x:p.x,y:p.y}; };
const grid = g => mode === 'minimal'||mode === 'low' ? g.grid : mode === 'high' ? g.board : g.board.grid;
const blank = ['minimal','high'].includes(mode) ? 0 : null;
const put = (g,x,y,value='J') => {grid(g)[y][x]=value;};
const clear = g => grid(g).forEach(row=>row.fill(blank));
const empty = g => grid(g).flat().every(c=>c===blank);
const over = g => mode === 'minimal' ? g.over : mode === 'low' ? g.status==='over' : g.gameOver;
const held = g => mode === 'minimal'||mode === 'low' ? g.holdKind : mode === 'medium' ? g.held : mode === 'high' ? g.holdType : g.hold;
const queue = g => mode === 'minimal' ? g.queue : mode === 'medium' ? g.next : g.nextQueue;
const move = (g,dx,dy=0) => (g.tryMove ?? g.move).call(g,dx,dy);
const rotate = (g,d) => (g.tryRotate ?? g.rotate).call(g,d);
const hold = g => mode === 'xhigh' ? g.holdPiece() : g.hold();
const hard = g => mode === 'minimal' ? g.hardDropWithScore() : g.hardDrop();
const step = (g,ms) => (g.tick ?? g.update).call(g,mode === 'xhigh' ? ms/1000 : ms);
// Keep frames below all delivered dt caps, with exact total elapsed time.
const advance = (g,ms) => { while(ms>0) {const d=Math.min(ms,16);step(g,d);ms-=d;} };
const soft = (g,on) => {g[mode === 'high' ? 'softDropping' : 'softDrop']=on;};
const restart = g => (g.restart ?? g.reset).call(g);
const absolute = p => local(p.type,p.rotation).map(([x,y])=>[p.x+x,p.y+y]);
const fits = (g,p) => absolute(p).every(([x,y])=>x>=0&&x<10&&y<=bottom&&(y<0||grid(g)[y][x]===blank));
const place = (g,type,rotation,x,y) => {
  const p = mode === 'minimal' ? {kind:type,rot:rotation,x,y} : mode==='low'||mode==='xhigh' ? {kind:type,rotation,x,y} : {type,rotation,x,y};
  g[mode==='minimal'||mode==='high'?'active':'current']=p;
  Object.assign(g,{fallAccum:0,fallAccMs:0,fallTimer:0,gravityTimer:0,lockTimer:0,lockMs:0,lockResets:0,
    lastMoveWasRotate:false,lastActionWasRotate:false,lastActionRotate:false,lastKickIndex:-1});
  if(mode==='low') g.onGround=g.isTouchingGround();
  assert(fits(g,active(g)),'fixture must be collision-free');
};
const placeO = (g,left,top) => place(g,'O',0,left-(['minimal','low'].includes(mode)?1:0),top);
const make = (sequence=['T','I','O','S','Z','J','L']) => {
  const g=new Game(()=>0.5), q=queue(g);
  q.splice(0,q.length,...Array.from({length:21},(_,i)=>sequence[i%sequence.length]));
  if(mode==='low')g.spawnNext();else g.spawn();
  assert.equal(active(g).type,sequence[0]);
  return g;
};
const isGround = g => !fits(g,{...active(g),y:active(g).y+1});
for(const [type,x] of [['T',-1],['I',-2]]) {
  const g=make();place(g,type,1,x,12);assert(rotate(g,-1));
  assert.deepEqual(active(g),{type,rotation:0,x:0,y:12});
}
for(const [type,x] of [['T',7],['I',6]]) {
  const g=make();place(g,type,3,8,12);assert(rotate(g,1));
  assert.deepEqual(active(g),{type,rotation:0,x,y:12});
}
// A concrete obstacle forces the third 0->L kick. Canonical result is (4,9).
{
  const g=make();place(g,'T',0,3,10);put(g,4,12);put(g,5,12);
  assert(rotate(g,-1));
  assert.deepEqual(active(g),{type:'T',rotation:3,x:mode==='low'?3:4,y:mode==='low'?8:9});
  console.log(`${mode}: forced third CCW kick -> ${JSON.stringify(active(g))}; canonical y=9`);
}
{
  let seed=42; const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
  const oldRandom=Math.random;Math.random=random;
  try {
    const g=new Game(random);
    for(let b=0;b<10;b++) {
      const drawn=[];
      for(let i=0;i<7;i++){drawn.push(active(g).type);clear(g);hard(g);assert(!over(g));}
      assert.deepEqual(drawn.sort(),[...types].sort());
    }
  } finally {Math.random=oldRandom;}
}
{
  const g=make();assert.deepEqual(queue(g).slice(0,5),['I','O','S','Z','J']);
  rotate(g,1);hold(g);assert.equal(held(g),'T');assert.equal(active(g).type,'I');assert.equal(g.canHold,false);
  hold(g);assert.equal(active(g).type,'I');hard(g);assert(g.canHold);hold(g);
  assert.equal(active(g).type,'T');assert.equal(active(g).rotation,0);assert.equal(g.canHold,false);
  const w=make();placeO(w,4,10);while(move(w,-1)){}assert.equal(Math.min(...absolute(active(w)).map(([x])=>x)),0);
  while(move(w,1)){}assert.equal(Math.max(...absolute(active(w)).map(([x])=>x)),9);
}
for(const type of types) {
  const g=make([type]);put(g,4,bottom-1);const p=active(g),y=g.ghostY();
  assert(fits(g,{...p,y}));assert(!fits(g,{...p,y:y+1}));const expected=absolute({...p,y});
  assert.equal(new Set(expected.map(String)).size,4);
  if(g.ghostCells) assert.equal(key(pairs(g.ghostCells())),key(expected));
  if(g.ghostCellsAbsolute) assert.equal(key(g.ghostCellsAbsolute().map(([x,y])=>[x,y+2])),key(expected));
  hard(g);assert.equal(g.score,2*(y-p.y));for(const [x,y] of expected)assert.equal(grid(g)[y][x],type);
}
console.log(`${mode}: T/I kicks both directions, ten actual seeded bags, walls, hold/queue and seven obstructed ghosts/drops passed`);
{
  const g=make();placeO(g,4,20);advance(g,499);assert(empty(g));step(g,1.000001);assert.equal(grid(g)[21][4],'O');
}
{
  const g=make();placeO(g,4,20);advance(g,490);assert(move(g,1));advance(g,20);
  assert.equal(grid(g)[21][5], mode==='minimal'?'O':blank);
  if(mode==='minimal'){
    const r=make();placeO(r,4,20);advance(r,490);assert(rotate(r,1));advance(r,20);assert.equal(grid(r)[21][4],'O');
    console.log('CONFIRMED: grounded lateral move/rotation do not reset the 490 ms lock timer');
  }
  else {
    for(let i=1;i<15;i++){advance(g,470);assert(empty(g));move(g,i%2?-1:1);}
    assert.equal(g.lockResets,15);advance(g,490);move(g,-1);advance(g,10.000001);
    assert(grid(g).flat().includes('O'));
  }
}
{
  const g=make();placeO(g,0,19);put(g,0,21);assert(isGround(g));advance(g,490);assert(move(g,1));assert(!isGround(g));
  advance(g,20);assert.equal(active(g).y,19);assert.equal(grid(g)[19][1],blank);
  for(let i=0;i<50 && grid(g)[21][1]===blank;i++)advance(g,100);
  assert.equal(grid(g)[21][1],'O');assert.equal(grid(g)[19][1],blank);
}
console.log(`${mode}: 499/500 ms boundary, reset behavior and ledge mid-air lock probe complete`);
const single=(g,perfect=false)=>{
  clear(g);for(const x of [0,1,2,7,8,9])put(g,x,21);if(!perfect)put(g,0,12);place(g,'I',0,3,20);
};
const tetris=g=>{
  clear(g);for(let y=18;y<=21;y++)for(let x=0;x<10;x++)if(x!==4)put(g,x,y);
  put(g,0,12);place(g,'I',1,2,18);
};
{
  const g=make();single(g,true);assert.equal(g.ghostY(),20);hard(g);assert.equal(g.score,100);assert.equal(g.lines,1);assert(empty(g));
  console.log('CONFIRMED: perfect-clear single scores 100, benchmark expectation 900');
}
for(const [lines,expected]of [[1,100],[2,300],[3,500],[4,800]]){
  const g=make();
  if(lines===1)single(g);else{for(let y=22-lines;y<22;y++)for(let x=0;x<10;x++)if(x!==4)put(g,x,y);put(g,0,12);place(g,'I',1,2,18);}
  hard(g);assert.equal(g.score,expected);assert.equal(g.lines,lines);
}
const scoring={};
{
  const g=make();tetris(g);hard(g);assert.equal(g.score,800);
  clear(g);placeO(g,0,20);hard(g);tetris(g);hard(g);
  scoring.b2b=g.score;assert.equal(g.score,['low','medium'].includes(mode)?1600:2000);
  single(g);hard(g);assert.equal(g.score,['low','medium'].includes(mode)?1750:2150);
  if(mode==='minimal'||mode==='high')assert.equal(g.b2b,false);
  if(mode==='xhigh')assert.equal(g.backToBack,false);
  const c=make();c.lines=10;c.level=2;c.combo=0;single(c);hard(c);assert.equal(c.score,300);
  const crossing=make();crossing.lines=9;single(crossing);hard(crossing);assert.equal(crossing.score,100);assert.equal(crossing.level,2);
}
// Real final rotation, legal grounded pose, zero-travel hard drop or lock timeout.
for(const timed of [false,true])for(const full of [false,true])for(const line of [false,true]){
  const g=make(),y=19;put(g,5,y);put(g,3,21);put(g,full?3:5,full?y:21);
  if(line)for(const x of [0,1,2,6,7,8,9])put(g,x,20);
  place(g,'T',3,3,y);assert(rotate(g,1));assert.equal(active(g).rotation,0);assert.equal(g.ghostY(),y);
  if(timed)advance(g,500.000001);else hard(g);
  const label=`${timed?'timed':'hard'}-${full?'full':'mini'}-${line?'single':'zero'}`;
  scoring[label]=g.score;
  let expected;
  if(mode==='medium'||(mode==='xhigh'&&!timed))expected=line?100:0;
  else if(mode==='minimal')expected=line?800:0;
  else expected=line?800:400;
  assert.equal(g.score,expected,label);assert.equal(g.lines,Number(line));
}
// Compare final-kick metadata behavior on the same mini geometry; no-corner
// fixture must never become a spin. These engines lack mini classification.
if(mode!=='medium'){
  const g=make();put(g,3,21);put(g,5,21);put(g,5,19);place(g,'T',0,3,19);
  g.lastMoveWasRotate=g.lastActionWasRotate=g.lastActionRotate=true;
  const detect=()=>mode==='xhigh'?g.isTspin():g.isTSpin();
  assert.equal(detect(),true);g.lastKickIndex=4;assert.equal(detect(),true);clear(g);assert.equal(detect(),false);
}
console.log(`${mode} scoring evidence: ${JSON.stringify(scoring)}`);
{
  const g=make(['O']),y=active(g).y;advance(g,999);assert.equal(active(g).y,y);step(g,1.000001);assert.equal(active(g).y,y+1);
  const fast=make(['O']);fast.level=2;fast.lines=10;advance(fast,792);assert.equal(active(fast).y,y);step(fast,1.000001);assert.equal(active(fast).y,y+1);
  const s=make(['O']);soft(s,true);advance(s,100);
  assert.equal(active(s).y,mode==='minimal'?7:mode==='low'?4:mode==='xhigh'?5:2);
  assert.equal(s.score,active(s).y);
  // Timing transitions, below every frame cap. Minimal consumes one row/frame.
  const t=make(['O']);advance(t,800);const before=active(t).y;soft(t,true);step(t,1);
  const delta=active(t).y-before;
  assert.equal(delta,mode==='minimal'?1:mode==='low'||mode==='xhigh'?20:16);assert.equal(t.score,delta);
  console.log(`${mode}: normal gravity 1000/793 ms; soft 100 ms=${s.score} rows/points; 800 ms normal + soft 1 ms=${delta} rows/points`);
  if(mode==='minimal'){
    const a=make(['O']),b=make(['O']);soft(a,true);soft(b,true);step(a,16);for(let i=0;i<16;i++)step(b,1);
    assert.equal(active(a).y,1);assert.equal(active(b).y,16);console.log('CONFIRMED: same 16 ms soft time yields 1 versus 16 rows/points by frame count');
  }
}
{
  const g=make(['O','T','I']);placeO(g,0,20);put(g,4,0);hard(g);assert(over(g));
  const state=()=>JSON.stringify({p:active(g),board:grid(g),score:g.score,held:held(g),canHold:g.canHold});
  const before=state();advance(g,1000);move(g,-1);rotate(g,1);hold(g);hard(g);assert.equal(state(),before);
  restart(g);assert(!over(g));assert(empty(g));assert.equal(g.score,0);assert.equal(g.lines,0);assert.equal(g.level,1);assert.equal(held(g),null);assert(g.canHold);
}
{
  const g=make(['T','I']);for(const [x,y]of [[2,2],[3,3],[4,3]])put(g,x,y);
  assert(fits(g,active(g)));assert(rotate(g,1));assert(rotate(g,-1));assert(move(g,-1));assert(move(g,-1));assert(move(g,-1));
  assert.deepEqual(active(g),{type:'T',rotation:0,x:0,y:0});assert(absolute(active(g)).every(([,y])=>y<2));assert(isGround(g));
  assert(fits(g,{type:'I',rotation:0,x:3,y:0}));hard(g);assert.equal(over(g),mode==='low');
  console.log(`${mode}: public-action wholly hidden lock, next I spawn open -> game over ${over(g)}`);
}
console.log(`${mode} engine audit passed; documented conforming and defective outcomes reproduced.`);
