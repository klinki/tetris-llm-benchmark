// Unchanged application, precise RAF timestamps, real Chromium keyboard events.
// Usage: node .audit/gpt56-sol-browser.cjs <base> <effort> [outside-artifacts-dir]
const { chromium } = require('../node_modules/playwright');
const path = require('node:path');
const [base,mode,artifacts] = process.argv.slice(2);
const check=(ok,msg)=>{if(!ok)throw Error(mode+': '+msg);};
(async()=>{
 const browser=await chromium.launch({headless:true}),result={mode,browser:browser.version(),views:{}};
 try{for(const [name,width,height]of [['desktop',1280,800],['mobile',390,844]]){
  const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage(),errors=[],badResponses=[],failedRequests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)badResponses.push(r.status()+' '+r.url());});page.on('requestfailed',r=>failedRequests.push(r.url()+' '+r.failure()?.errorText));
  await page.addInitScript(()=>{window.__now=0;performance.now=()=>window.__now;window.requestAnimationFrame=cb=>{window.__frame=cb;return 1;};});
  await page.route('**/main.js',async route=>{const response=await route.fetch();const clock=mode==='low'?'lastFall=0;groundedAt=null;':mode==='medium'?'lastTime=0;': 'previousTime=0;';await route.fulfill({response,body:await response.text()+`\nwindow.__game=game;window.__resetClock=()=>{${clock}};\n`});});
  await page.goto(base,{waitUntil:'networkidle'});
  await page.evaluate(mode=>{
   const g=window.__game,offset={low:2,medium:4,high:4,xhigh:0}[mode];let time=0;
   const origin=t=>mode==='medium'?[-1,-1]:mode==='low'&&t==='I'?[0,-1]:[0,0];
   window.__v={
    frame:ms=>{time+=ms;window.__now=time;window.__frame(time);},
    clear:()=>g.board.forEach(r=>r.fill(null)),
    put:(x,y)=>g.board[y+offset][x]='J',
    count:()=>g.board.flat().filter(Boolean).length,
    queue:()=>mode==='low'||mode==='high'?g.next:g.queue,
    place:(kind,rotation,x,y)=>{const [dx,dy]=origin(kind);g.active={rotation,x:x-dx,y:y+offset-dy,[mode==='low'?'name':mode==='high'?'type':'kind']:kind};Object.assign(g,{fallAccumulator:0,lockAccumulator:0,gravityElapsed:0,lockElapsed:0,lockResets:0,lastMoveWasRotation:false,lastActionWasRotation:false,lastKickIndex:0});time=0;window.__now=0;window.__resetClock();window.__frame(0);},
    state:()=>{const p=g.active,kind=p&&(p.name??p.type??p.kind),[dx,dy]=kind?origin(kind):[0,0];return {active:p&&{kind,rotation:p.rotation,x:p.x+dx,y:p.y-offset+dy},score:g.score,lines:g.lines,level:g.level,held:mode==='high'?g.held:g.holdPiece,canHold:mode==='high'?g.holdAvailable:mode==='xhigh'?!g.holdLocked:g.canHold,over:mode==='medium'?g.status==='gameover':mode==='high'?g.status==='over':g.gameOver,count:g.board.flat().filter(Boolean).length};}
   };window.__v.frame(0);
  },mode);
  const v=(fn,arg)=>page.evaluate(fn,arg);
  check(!(await v(()=>window.__v.state().over)),'starts');
  await v(()=>{window.__v.clear();window.__v.place('T',0,3,5);});
  const controls=[];for(const key of ['ArrowLeft','ArrowRight','ArrowUp','x','z','ControlLeft','ArrowDown','Space','c']){const before=await v(()=>window.__v.state());await page.keyboard.press(key);const after=await v(()=>window.__v.state());controls.push({key,before,after});}
  check(controls[0].after.active.x===controls[0].before.active.x-1,'left');check(controls[1].after.active.x===controls[1].before.active.x+1,'right');
  for(let i=2;i<6;i++)check(controls[i].after.active.rotation===(controls[i].before.active.rotation+(i<4?1:3))%4,'rotate '+controls[i].key);
  check(controls[6].after.active.y===controls[6].before.active.y+1&&controls[6].after.score===controls[6].before.score+1,'Down row/point');check(controls[7].after.count===4&&controls[7].after.score>controls[7].before.score,'hard drop');check(controls[8].after.held===controls[8].before.active.kind&&!controls[8].after.canHold,'hold');
  await v(()=>{window.__v.clear();window.__game.level=1;window.__game.lines=0;window.__v.place('O',0,3,0);for(let i=0;i<50;i++)window.__v.frame(16);});
  const before=await v(()=>window.__v.state());await page.keyboard.down('ArrowDown');await v(()=>window.__v.frame(1));const after=await v(()=>window.__v.state());await page.keyboard.up('ArrowDown');const transition={rows:after.active.y-before.active.y,points:after.score-before.score};
  check(transition.rows===1&&transition.points===1,'normal/soft transition '+JSON.stringify(transition));
  const refresh=await v(()=>{const out={};for(const [level,duration]of [[2,1480.001],[10,600],[15,600]]){const ys=[];for(const hz of [60,144]){window.__v.clear();window.__game.level=level;window.__game.lines=(level-1)*10;window.__v.place('O',0,3,0);let elapsed=0;while(elapsed<duration-1e-9){const dt=Math.min(1000/hz,duration-elapsed);window.__v.frame(dt);elapsed+=dt;}ys.push(window.__v.state().active.y);}out[level+':'+duration]=ys;}window.__game.level=1;window.__game.lines=0;return out;});
  // Held soft input at equal elapsed time; native OS repeat is outside this
  // deterministic test. High and xhigh implement their own repeat clocks.
  const softRefresh=[];
  if(mode==='high'||mode==='xhigh')for(const hz of [60,144]){
   await v(()=>{window.__v.clear();window.__game.level=1;window.__game.lines=0;window.__v.place('O',0,3,0);});
   const start=await v(()=>window.__v.state());await page.keyboard.down('ArrowDown');
   await v(hz=>{let elapsed=0;while(elapsed<600-1e-9){const dt=Math.min(1000/hz,600-elapsed);window.__v.frame(dt);elapsed+=dt;}},hz);
   await page.keyboard.up('ArrowDown');const end=await v(()=>window.__v.state());softRefresh.push({hz,rows:end.active.y-start.active.y,points:end.score-start.score});
  }
  // Replacing a piece should reset its normal-gravity phase.
  await v(()=>{window.__v.clear();window.__game.level=1;window.__game.lines=0;window.__v.place('O',0,3,0);for(let i=0;i<50;i++)window.__v.frame(16);window.__game.canHold=true;window.__game.holdAvailable=true;window.__game.holdLocked=false;});
  await page.keyboard.press('c');const heldStart=await v(()=>window.__v.state());await v(()=>{for(let i=0;i<12;i++)window.__v.frame(16);window.__v.frame(8);});const heldEnd=await v(()=>window.__v.state());const holdGravity={rows:heldEnd.active.y-heldStart.active.y};
  // Ledge-move probe through actual key handler and unmodified RAF callback.
  await v(()=>{const w=window.__v;w.clear();w.place('O',0,-1,14);w.put(0,16);for(let i=0;i<30;i++)w.frame(16);w.frame(10);});await page.keyboard.press('ArrowRight');await v(()=>window.__v.frame(20));const ledge=await v(()=>window.__v.state());check(ledge.count===1&&ledge.active.y===14,'ledge remains airborne past old lock deadline');
  await v(mode=>{const w=window.__v;w.clear();w.place('O',0,0,18);w.queue()[0]='T';w.put(4,{low:-2,medium:0,high:-2,xhigh:0}[mode]);},mode);
  await page.keyboard.press('Space');await v(()=>window.__v.frame(1));const over=await v(()=>window.__v.state());check(over.over,'blocked spawn');
  const overlay=await v(mode=>{if(mode==='xhigh')return {text:document.getElementById('status-text').textContent};const e=document.getElementById('overlay'),s=getComputedStyle(e);return {display:s.display,visibility:s.visibility,text:e.innerText.replace(/\s+/g,' ').trim()};},mode);
  for(const key of ['ArrowLeft','ArrowUp','Space','c','ArrowDown'])await page.keyboard.press(key);check(JSON.stringify(await v(()=>window.__v.state()))===JSON.stringify(over),'inert game-over input');
  await page.keyboard.press('r');await v(()=>window.__v.frame(1));const restarted=await v(()=>window.__v.state());check(!restarted.over&&restarted.count===0&&restarted.score===0&&restarted.lines===0&&restarted.held===null,'R restart');
  // Forced I previews exercise clipping and pixel content, with body unchanged.
  await v(()=>{window.__game.held='I';window.__game.holdPiece='I';window.__v.queue().fill('I');window.__v.frame(1);});
  const layout=await v(mode=>{const box=e=>{const r=e.getBoundingClientRect();return {x:+r.x.toFixed(2),y:+r.y.toFixed(2),width:+r.width.toFixed(2),height:+r.height.toFixed(2)};};return {documentWidth:document.documentElement.scrollWidth,documentHeight:document.documentElement.scrollHeight,board:box(document.querySelector(mode==='medium'||mode==='xhigh'?'#game-canvas':'#board')),canvases:[...document.querySelectorAll('canvas')].map(c=>({id:c.id,...box(c),backing:[c.width,c.height]})),touch:[...document.querySelectorAll('[data-action]')].filter(b=>b.getBoundingClientRect().width>0).map(b=>b.dataset.action)};},mode);
  const previewAspect=Object.fromEntries(layout.canvases.filter(c=>!['board','game-canvas'].includes(c.id)).map(c=>[c.id,+((c.width/c.backing[0])/(c.height/c.backing[1])).toFixed(3)]));
  const pixels=await v(mode=>[...document.querySelectorAll('canvas')].filter(c=>!['board','game-canvas'].includes(c.id)).map(c=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let painted=0;for(let i=3;i<d.length;i+=4)if(d[i])painted++;return {id:c.id,painted};}),mode);
  check(pixels.every(p=>p.painted>0),'previews paint');
  const external=u=>/fonts\.(googleapis|gstatic)\.com|favicon\.ico/.test(u);
  check(errors.filter(u=>!external(u)).length===0,'application errors '+errors.join(';'));check(badResponses.filter(u=>!external(u)).length===0&&failedRequests.filter(u=>!external(u)).length===0,'asset failure');
  result.views[name]={controls:controls.map(c=>c.key),transition,refresh,ledge,overlay,restarted,layout,previewAspect,pixels,softRefresh,holdGravity,errors,badResponses,failedRequests};
  if(artifacts)await page.screenshot({path:path.join(artifacts,`gpt56-sol-${mode}-${name}.png`),fullPage:true});await context.close();
 }}finally{await browser.close();}
 // Stable geometry and exact findings are asserted in both viewports.
 for(const [name,v]of Object.entries(result.views)){
  check(v.layout.documentWidth===(name==='desktop'?1280:390),'no horizontal overflow');
  check(v.layout.canvases.every(c=>c.x>=0&&c.x+c.width<=(name==='desktop'?1280:390)+0.02),'supporting canvases fit');
  const widths={desktop:{low:310,medium:296,high:328.5,xhigh:324},mobile:{low:210,medium:258,high:228,xhigh:299}};
  check(Math.abs(v.layout.board.width-widths[name][mode])<0.15,'board width');
  check(Math.abs(v.layout.board.height-2*v.layout.board.width)<0.15,'uniform board aspect');
  const rows=mode==='low'?{ '2:1480.001':[1,1],'10:600':[9,8],'15:600':[12,12]}:{'2:1480.001':[1,1],'10:600':[9,9],'15:600':[18,18]};
  check(JSON.stringify(v.refresh)===JSON.stringify(rows),'unchanged RAF refresh findings');
  check(v.holdGravity.rows===(mode==='low'?1:0),'piece replacement gravity clock');
  const aspect=Object.values(v.previewAspect);
  if(mode==='low'&&name==='mobile')check(Math.abs(v.previewAspect.hold-.769)<.002,'held preview distorted');
  else check(aspect.every(a=>Math.abs(a-1)<.03),'square preview cells');
  if(mode==='high'||mode==='xhigh')check(v.softRefresh.every(x=>x.rows===(mode==='high'?11:14)&&x.points===x.rows),'600 ms held repeat');
 }
 console.log(JSON.stringify(result));
})().catch(e=>{console.error(e.stack);process.exit(1);});
