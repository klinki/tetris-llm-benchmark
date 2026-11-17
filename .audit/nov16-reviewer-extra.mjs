// Additional independent reviewer fixtures. No spin flags or rule methods assigned.
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {writeFileSync} from 'node:fs';
import {createAdapter} from './nov16-engine.mjs';
const root=process.argv[2],results={};
for(const [mode,name] of Object.entries({hy4:'hy4-flash-free-high',none:'hy4-flash-free-none',high:'qwen4-max-high',low:'qwen4-max-low',xhigh:'qwen4-max-xhigh'})){
 const load=f=>import(pathToFileURL(resolve(root,name,'dist',f)));
 const m={game:await load('game.js')};
 if(mode==='none')m.constants=await load('constants.js');else m.pieces=await load('pieces.js');
 if(['low','high'].includes(mode))m.srs=await load('srs.js');
 const a=createAdapter(m,mode),checks=[];
 const record=(name,actual,expected)=>checks.push({name,actual,expected,pass:JSON.stringify(actual)===JSON.stringify(expected)});
 const fresh=(t,r,x,y)=>{const g=a.make();a.place(g,t,r,x,y);return g;};
 // Failed translations preserve real preceding rotation credit.
 for(const kind of ['mini','full']){
  const g=fresh('T',3,3,17),stack=kind==='mini'?[[5,17],[3,19],[5,19]]:[[5,17],[3,19],[3,17]];
  for(const [x,y] of stack)a.put(g,x,y);
  a.rotate(g,1);
  const p=JSON.stringify(a.active(g));
  a.move(g,1);
  record(kind+' blocked move actually fails',JSON.stringify(a.active(g)),p);
  a.step(g,501);
  record(kind+' failed action preserves spin',g.score,kind==='mini'?100:400);
 }
 // Exhaust resets, step off a low ledge, and reach a genuinely lower row.
 {
  const g=fresh('O',0,3,10);a.put(g,3,12);a.put(g,4,12);
  a.step(g,1);for(let i=0;i<15;i++)a.move(g,i%2===0?-1:1);
  a.move(g,1);a.move(g,1);a.move(g,1);a.advance(g,8000);
  // Accumulate less than the lock delay, move, then cross the old deadline.
  a.step(g,400);a.move(g,1);a.step(g,120);
  record('new lowest row restores grounded reset allowance',a.count(g),2);
 }
 if(mode==='none'){
  const g=fresh('T',0,3,3);a.step(g,1000);
  record('natural fall keeps airborne grounded flag false',g.grounded,false);
  const g2=fresh('T',0,3,3);a.step(g2,1000);a.move(g2,1);
  record('airborne action after natural fall spends no reset',g2.lockResets,0);
  const listeners={};globalThis.window={addEventListener:(event,fn)=>listeners[event]=fn};
  const {InputHandler}=await load('input.js'),g3=fresh('T',0,3,3),input=new InputHandler(g3);
  listeners.keydown({code:'ArrowLeft',preventDefault(){}});
  const x=a.active(g3).x;
  if(listeners.blur)listeners.blur();
  for(let n=0;n<12;n++)input.tick();
  record('blur releases held movement',a.active(g3).x,x);
  delete globalThis.window;
 }
 results[name]={checks};
}
writeFileSync(resolve('output/playwright/nov16/reviewer-extra.json'),JSON.stringify(results,null,2)+'\n');
console.log(JSON.stringify(results,null,2));
