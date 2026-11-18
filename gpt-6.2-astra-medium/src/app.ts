import {Game,cells,type Kind} from './game.js';
const el=(id:string)=>document.getElementById(id)!;
const canvas=(id:string)=>el(id) as HTMLCanvasElement;
const title=canvas('title').getContext('2d')!;
const glyphs=['11111/00100/00100/00100/00100/00100/00100','11111/10000/10000/11110/10000/10000/11111','11111/00100/00100/00100/00100/00100/00100','11110/10001/10001/11110/10100/10010/10001','111/010/010/010/010/010/111','01111/10000/10000/01110/00001/00001/11110'];
canvas('title').width=134;
for(const offset of [2,0]){
  title.fillStyle=offset?'#ac91db':'#26232e';
  let x=0;
  for(const glyph of glyphs){
    glyph.split('/').forEach((row,y)=>[...row].forEach((bit,i)=>{if(bit==='1')title.fillRect(x+i*4+offset,y*4+offset,4,4);}));
    x+=(glyph.indexOf('/')+1)*4;
  }
}
const colors:Record<Kind,string>={I:'#57cee6',O:'#f7cb50',T:'#b18aef',Z:'#f46c78',S:'#7acb81',J:'#668def',L:'#f6a257'};
function tile(ctx:CanvasRenderingContext2D,x:number,y:number,s:number,k:Kind){
  ctx.fillStyle='#302c38';ctx.fillRect(x,y,s,s);
  ctx.fillStyle=colors[k];ctx.fillRect(x+1,y+1,s-2,s-2);
  ctx.fillStyle='#ffffff64';ctx.fillRect(x+2,y+2,s-4,3);ctx.fillRect(x+2,y+5,2,s-8);
  ctx.fillStyle='#00000028';ctx.fillRect(x+3,y+s-5,s-5,3);ctx.fillRect(x+s-5,y+4,3,s-8);
}
function preview(c:HTMLCanvasElement,k:Kind|null){
  const ctx=c.getContext('2d')!;ctx.clearRect(0,0,c.width,c.height);
  if(!k){ctx.fillStyle='#aaa3ae';ctx.font='bold 18px monospace';ctx.textAlign='center';ctx.fillText('—',52,36);return;}
  const p=cells(k),minY=Math.min(...p.map(a=>a[1])),height=Math.max(...p.map(a=>a[1]))-minY+1;
  const width=1+Math.max(...p.map(a=>a[0]));
  for(const [x,y] of p)tile(ctx,(104-width*20)/2+x*20,(64-height*20)/2+(y-minY)*20,20,k);
}
const previews=Array.from({length:3},()=>{const c=document.createElement('canvas');c.width=104;c.height=64;el('next').append(c);return c;});
let game=new Game(),paused=false,last=performance.now(),signature='';
function draw(){
  const state=[game.kind,game.x,game.y,game.rotation,game.score,game.lines,game.held,game.queue.join(''),game.over,paused].join('|');
  if(state===signature)return;
  signature=state;
  const ctx=canvas('board').getContext('2d')!;
  ctx.fillStyle='#22212b';ctx.fillRect(0,0,300,600);
  for(let y=0;y<20;y++)for(let x=0;x<10;x++){
    ctx.strokeStyle='#34323e';ctx.strokeRect(x*30+.5,y*30+.5,30,30);
    const k=game.grid[y+20][x];if(k)tile(ctx,x*30,y*30,30,k);
  }
  if(!game.over){
    const ghost=game.ghost();
    for(const [x,y] of cells(game.kind,game.rotation)){
      const px=(game.x+x)*30,py=(ghost+y-20)*30;
      ctx.strokeStyle=colors[game.kind];ctx.globalAlpha=.45;ctx.strokeRect(px+2.5,py+2.5,25,25);ctx.globalAlpha=1;
    }
    for(const [x,y] of cells(game.kind,game.rotation))tile(ctx,(game.x+x)*30,(game.y+y-20)*30,30,game.kind);
  }
  preview(canvas('held'),game.held);previews.forEach((c,i)=>preview(c,game.queue[i]));
  for(const [id,v,n] of [['score',game.score,6],['level',game.level,2],['lines',game.lines,3]] as const)el(id).textContent=String(v).padStart(n,'0');
  el('overlay').hidden=!(paused||game.over);
  el('overlay').querySelector('strong')!.textContent=game.over?'Game over':'Paused';
  el('resume').textContent=game.over?'Restart (R)':'Resume';
  el('pause').textContent=paused?'▶':'Ⅱ';el('pause').ariaLabel=paused?'Resume game':'Pause game';
  el('status').textContent=game.over?'GAME OVER':paused?'PAUSED':'LIVE GAME';
}
function input(code:string,repeat=false){
  if(game.over){if(code==='KeyR'){game=new Game();paused=false;signature='';}return;}
  if(['KeyP','Escape'].includes(code)){if(!repeat)paused=!paused;return;}
  if(paused)return;
  switch(code){
    case 'ArrowLeft':game.move(-1);break;
    case 'ArrowRight':game.move(1);break;
    case 'ArrowDown':game.down(true);break;
    case 'ArrowUp':case 'KeyX':game.rotate(1);break;
    case 'KeyZ':case 'ControlLeft':game.rotate(-1);break;
    case 'Space':if(!repeat)game.drop();break;
    case 'KeyC':if(!repeat)game.hold();break;
  }
}
window.addEventListener('keydown',e=>{
  if(e.code==='Space'&&e.target instanceof HTMLButtonElement)return;
  if(['ArrowLeft','ArrowRight','ArrowDown','ArrowUp','Space','ControlLeft'].includes(e.code))e.preventDefault();
  input(e.code,e.repeat);draw();
});
el('resume').onclick=()=>{input(game.over?'KeyR':'KeyP');draw();};
el('pause').onclick=()=>{input('KeyP');draw();el('pause').blur();};
document.querySelectorAll<HTMLButtonElement>('[data-key]').forEach(b=>b.onclick=()=>{input(b.dataset.key!);draw();b.blur();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&!game.over){paused=true;draw();}});
function frame(now:number){if(!paused)game.tick(Math.min(100,now-last));last=now;draw();requestAnimationFrame(frame);}
draw();requestAnimationFrame(frame);
