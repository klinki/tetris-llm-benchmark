// Playwright CLI workflow; append fixture accessors only. Original engine,
// input, drawing and frame callback bodies are never repaired or replaced.
async page => {
 const mode=new URLSearchParams(page.url().split('#')[1]).get('audit');
 const check=(ok,message)=>{if(!ok)throw Error(message);};
 check(['low','medium','high','xhigh','max'].includes(mode),'Unknown effort');
 const errors=[],consoleErrors=[],badResponses=[],failedRequests=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error'&&!m.location().url?.endsWith('/favicon.ico'))consoleErrors.push(m.text());});
 page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))badResponses.push({status:r.status(),url:r.url()});});
 page.on('requestfailed',r=>failedRequests.push({url:r.url(),error:r.failure()?.errorText}));
 await page.addInitScript(()=>{window.requestAnimationFrame=cb=>{window.__auditFrame=cb;return 1;};});
 const entry=mode==='high'?'/dist/src/main.js':['medium','max'].includes(mode)?'/main.js':'/dist/main.js';
 if(mode!=='medium')await page.route(`**${entry}`,async route=>{
  const response=await route.fetch(),body=await response.text();
  const local=mode==='low'?"t=>game.cells({type:t,rotation:0,x:0,y:0})":mode==='high'?"t=>getCells(t,0)":mode==='xhigh'?"t=>getLocalCells(t).map(c=>[c.x,c.y])":"t=>getPieceCells({type:t,rotation:0,x:0,y:0}).map(c=>[c.x,c.y])";
  const access=`
   window.__v={raw:game,local:${local},reset:()=>game.${mode==='high'?'restart':'reset'}(),render:()=>${mode==='low'?'draw()':mode==='xhigh'?'render(game.getState())':'render()'},step:(ms,soft=false)=>game.${['high','xhigh'].includes(mode)?'update':'tick'}(ms,soft)};
   window.__v.grid=()=>${mode==='max'?'game.grid':['high','xhigh'].includes(mode)?'game.board.cells':'game.board'};
   window.__v.state=()=>({active:game.active&&{...game.active},score:game.score,lines:game.lines,level:game.level,held:${mode==='max'?'game.held':'game.hold'},available:${mode==='max'?'game.canHold':mode==='xhigh'?'!game.holdUsed':'game.canHold'},over:game.gameOver,count:window.__v.grid().flat().filter(Boolean).length});
   window.__v.place=(type,x,y)=>{game.active={type,rotation:0,x,y};Object.assign(game,{dropTimer:0,lockTimer:0,dropAccumulator:0,lockAccumulator:0,gravityElapsed:0,lockElapsed:0,lockResets:0,grounded:false,fallTimer:0,fallAccumulator:0,lastActionWasRotation:false});};
  `;
  await route.fulfill({response,body:body+'\n'+access});
 });
 await page.setViewportSize({width:1280,height:800});await page.reload({waitUntil:'networkidle'});
 const views={};
 for(const [name,width,height]of [['desktop',1280,800],['mobile',390,844]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(100);
  const controls=[];
  if(mode!=='medium'){
   await page.evaluate(()=>{const v=window.__v;v.reset();v.place('T',3,5);v.render();});
   for(const key of ['ArrowLeft','ArrowRight','ArrowUp','x','z','ControlLeft','ArrowDown','Space','c']){
    const before=await page.evaluate(()=>window.__v.state());await page.keyboard.press(key);const after=await page.evaluate(()=>window.__v.state());controls.push({key,before,after});
   }
   check(controls[0].after.active.x===controls[0].before.active.x-1&&controls[1].after.active.x===controls[1].before.active.x+1,'Move bindings');
   for(let i=2;i<6;i++)check(controls[i].after.active.rotation===(controls[i].before.active.rotation+(i<4?1:3))%4,'Rotation binding '+controls[i].key);
   check(controls[6].after.active.y===controls[6].before.active.y+1&&controls[6].after.score===controls[6].before.score+1,'Down binding');
   check(controls[7].after.count===4,'Space locks four cells');
   check(controls[8].after.held===controls[8].before.active.type,'C stores piece');
   check(controls[8].after.available===(mode==='low'),'Hold availability');
   await page.keyboard.press('c');await page.evaluate(mode=>{const v=window.__v;if(mode==='high')v.raw.queue.splice(0,3,'I','I','I');v.render();},mode);
  }else{
   await page.locator('#restart').click();for(const key of ['ArrowLeft','ArrowRight','ArrowUp','x','z','ControlLeft','ArrowDown','Space','c','r'])await page.keyboard.press(key);
   check(await page.locator('#score').textContent()==='0','Medium static score');check(!await page.evaluate(()=>Boolean(window.__v)),'Medium unexpectedly starts');
  }
  views[name]=await page.evaluate(mode=>{
   const box=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height};};
   const board=document.querySelector(mode==='low'?'#game':mode==='medium'?'#board':mode==='high'?'#game-board':'#game-canvas');
   const overlay=document.querySelector(mode==='medium'?'#overlay':mode==='high'?'#game-message':mode==='xhigh'?'#game-status':mode==='max'?'#game-overlay':'#absent');
   return{viewport:[innerWidth,innerHeight],documentWidth:document.documentElement.scrollWidth,documentHeight:document.documentElement.scrollHeight,board:box(board),
    canvases:[...document.querySelectorAll('canvas')].map(c=>({id:c.id,...box(c),native:[c.width,c.height]})),
    overlay:overlay?{hidden:overlay.hidden,display:getComputedStyle(overlay).display,text:overlay.innerText}:null,
    previews:[...document.querySelectorAll('.next-row')].map(e=>({box:box(e),cells:[...e.querySelectorAll('.filled')].map(box)}))};
  },mode);
  views[name].controls=controls;
  const view=views[name],mobile=name==='mobile';
  check(view.documentWidth===(mobile&&mode==='low'?466:width),'Recorded document width');
  const expected=mobile?({low:[0,300,600],medium:[54,282,620.390625],high:[26.875,336.25,652.5],xhigh:[32,326,652],max:[53,284,568]})[mode]:({low:[410,300,600],medium:[199,282,620.390625],high:[470,340,660],xhigh:[477,326,652],max:[498,284,568]})[mode];
  for(const [i,key]of ['x','width','height'].entries())check(Math.abs(view.board[key]-expected[i])<.02,`${name} board ${key}`);
  if(mode==='max')check(view.overlay.hidden&&view.overlay.display==='grid'&&view.overlay.text.includes('Game over'),'Visible active game-over overlay');
  if(['high','xhigh'].includes(mode))check(view.overlay.hidden&&view.overlay.display==='none','Active overlay');
  if(mode==='low'&&mobile)check(view.canvases.filter(c=>c.id!=='game').every(c=>c.x+c.width>390),'Phone supporting-state clipping');
  if(mode==='high'){
   const overlap=(a,b)=>a.x<b.x+b.width&&b.x<a.x+a.width&&a.y<b.y+b.height&&b.y<a.y+a.height;
   check(view.previews[0].cells.some(a=>view.previews[1].cells.some(b=>overlap(a,b))),`${name} next previews overlap`);
  }
  await page.screenshot({path:`gpt56-luna-${mode}-${name}.png`,fullPage:true});
 }
 const findings={};
 if(mode!=='medium'){
  if(mode==='high'){
   await page.setViewportSize({width:1280,height:800});
   findings.previewOverlap=await page.evaluate(()=>{
    const v=window.__v;v.raw.queue.splice(0,3,'I','I','I');v.render();
    const rows=[...document.querySelectorAll('.next-row')];
    const boxes=rows.map(row=>[...row.querySelectorAll('.filled')].map(e=>{const b=e.getBoundingClientRect();return{x:b.x,y:b.y,width:b.width,height:b.height};}));
    const overlap=(a,b)=>a.x<b.x+b.width&&b.x<a.x+a.width&&a.y<b.y+b.height&&b.y<a.y+a.height;
    return{boxes,intersections:boxes[0].flatMap(a=>boxes[1].filter(b=>overlap(a,b))).length};
   });check(findings.previewOverlap.intersections>0,'Next previews overlap');
   await page.setViewportSize({width:390,height:844});
   await page.locator('.next-card').scrollIntoViewIfNeeded();findings.scrolledNext=await page.locator('.next-card').boundingBox();
   check(findings.scrolledNext.y>=0&&findings.scrolledNext.y+findings.scrolledNext.height<=844,'High next reachable by scrolling');
  }
  if(mode==='xhigh'){
   await page.locator('.next-card').scrollIntoViewIfNeeded();findings.scrolledNext=await page.locator('.next-card').boundingBox();
   check(findings.scrolledNext.y>=0&&findings.scrolledNext.y+findings.scrolledNext.height<=844,'Xhigh next reachable');
  }
  findings.ghosts=await page.evaluate(mode=>{
   const v=window.__v,result=[];
   for(const type of ['I','J','L','O','S','T','Z']){
    v.reset();v.place(type,3,0);const g=v.raw,board=v.grid();board[board.length-4][4]='J';
    let y=0;const fits=y=>v.local(type).every(([dx,dy])=>y+dy<board.length&&(y+dy<0||board[y+dy][3+dx]===null));while(fits(y+1))y++;
    const expected=v.local(type).map(([x,dy])=>`${3+x},${y+dy-(mode==='xhigh'?0:2)}`).sort();let actual;
    if(mode==='high'){
     g.updateGhost();v.render();actual=[...document.querySelectorAll('#game-board .cell')].flatMap((e,i)=>e.classList.contains('ghost')?[`${i%10},${Math.floor(i/10)}`]:[]).sort();
    }else{
     const c=document.querySelector(mode==='low'?'#game':'#game-canvas'),ctx=c.getContext('2d'),method=mode==='max'?'moveTo':'fillRect',alpha=mode==='max'?.55:mode==='low'?.2:.22;
     const calls=[],original=ctx[method];ctx[method]=function(...args){if(Math.abs(this.globalAlpha-alpha)<.0001)calls.push(args);return original.apply(this,args);};
     v.render();ctx[method]=original;
     const insetX=mode==='max'?7.8:mode==='xhigh'?1:0,insetY=mode==='max'?2.4:mode==='xhigh'?1:0;
     actual=calls.filter((_,i)=>mode!=='xhigh'||i%2===0).map(([x,y])=>`${Math.round((x-insetX)/30)},${Math.round((y-insetY)/30)}`).sort();
    }
    if(JSON.stringify(actual)!==JSON.stringify(expected))throw Error('Ghost '+type+JSON.stringify({actual,expected}));result.push({type,y,actual});
   }return result;
  },mode);
  findings.refresh=[];
  for(const [hz,base]of [[60,10000],[144,20000]])findings.refresh.push(await page.evaluate(({mode,hz,base})=>{
   const v=window.__v;window.__auditFrame(base);v.reset();v.place('O',3,0);
   if(mode==='max'){v.raw._level=2;v.raw._lines=10;}else{v.raw.level=mode==='low'?1:2;v.raw.lines=10;}
   let elapsed=0;while(elapsed<1480.001-1e-8){elapsed+=Math.min(1000/hz,1480.001-elapsed);window.__auditFrame(base+elapsed);}return{hz,...v.state()};
  },{mode,hz,base}));
  check(JSON.stringify(findings.refresh.map(r=>r.active.y))===JSON.stringify(mode==='low'?[1,2]:mode==='high'?[2,2]:[1,1]),'Frame-rate outcome');
  await page.evaluate(()=>{const v=window.__v;v.reset();v.place('O',3,0);for(let i=0;i<50;i++)v.step(16);v.render();});
  findings.softBefore=await page.evaluate(()=>window.__v.state());await page.keyboard.down('ArrowDown');await page.evaluate(()=>window.__v.step(1,true));findings.softAfter=await page.evaluate(()=>window.__v.state());await page.keyboard.up('ArrowDown');
  check(findings.softAfter.active.y-findings.softBefore.active.y===(mode==='xhigh'?18:1),'Normal-to-soft transition');
  findings.restarts=[];
  for(const [width,height]of [[1280,800],[390,844]]){
   await page.setViewportSize({width,height});
   await page.evaluate(()=>{const v=window.__v;v.reset();v.place('O',0,v.grid().length-2);for(let y=0;y<2;y++)for(let x=3;x<7;x++)v.grid()[y][x]='J';v.render();});
   await page.keyboard.press('Space');const before=await page.evaluate(()=>window.__v.state());check(before.over,'Blocked spawn');
   await page.keyboard.press('r');const after=await page.evaluate(()=>window.__v.state());check(!after.over&&after.score===0&&after.count===0&&after.held===null&&after.available,'R restart');
   if(mode==='max')check(await page.evaluate(()=>{const e=document.querySelector('#game-overlay');return e.hidden&&getComputedStyle(e).display==='grid'&&!window.__v.raw.gameOver;}),'False overlay persists after real R');
   findings.restarts.push({viewport:[width,height],before,after});
  }
  check(!errors.length&&!consoleErrors.length&&!badResponses.length,JSON.stringify({errors,consoleErrors,badResponses}));
 }else{
  check(consoleErrors.some(e=>e.includes('MIME type')&&e.includes('text/css')),'Expected CSS module delivery failure');
 }
 const result={mode,browser:page.context().browser().version(),staticOnly:mode==='medium',...views,...findings,errors,consoleErrors,badResponses,failedRequests};
 await page.evaluate(r=>window.__tetrisAudit=r,result);console.log(JSON.stringify(result,null,2));
}
